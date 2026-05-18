#!/usr/bin/env python3
"""
GPS Web Server — LC29H(DA) RTK + NTRIP Centipede + Leaflet.js
==============================================================
Lit les trames NMEA depuis le module LC29H(DA) via /dev/ttyS0,
injecte les corrections RTK Centipede, et sert une carte Leaflet
temps réel sur http://localhost:8766

Install :
  pip install websockets pyserial

Run :
  python3 gps_server.py                         # auto-detect port
  python3 gps_server.py -p /dev/ttyS0           # port explicite
  python3 gps_server.py --no-ntrip              # sans corrections RTK
  python3 gps_server.py --caster point-one      # caster alternatif

Ouvrir : http://<ip-du-rpi>:8766
"""

import argparse
import asyncio
import base64
import http
import json
import socket
import threading
import time
import serial
import serial.tools.list_ports
import websockets
from websockets.http11 import Response
from websockets.datastructures import Headers

# ── NTRIP casters ─────────────────────────────────────────────────────
CASTERS = {
    "centipede": {
        "host":    "caster.centipede.fr",
        "port":    2101,
        "mountpt": "NEAR",
        "user":    "centipede",
        "pass":    "centipede",
        "label":   "Centipede (FR, gratuit)",
    },
    "point-one": {
        "host":    "virtualrtk.pointonenav.com",
        "port":    2101,
        "mountpt": "AUTO",
        "user":    "vxuykevwn8",
        "pass":    "4yv7u82y3x",
        "label":   "Point One Navigation",
    },
}
DEFAULT_CASTER = "centipede"
DEFAULT_BAUD   = 115200
WEB_PORT       = 8766

FIX_LABELS = {
    "0": "No fix",
    "1": "GPS",
    "2": "DGPS/SBAS",
    "4": "RTK Fixed",
    "5": "RTK Float",
}

# ── Shared state ──────────────────────────────────────────────────────

class SharedGPS:
    def __init__(self):
        self.lock      = threading.Lock()
        self.data      = {}
        self.new_data  = False
        self._hz_buf   = []
        self.hz        = 0.0

    def update(self, d: dict):
        now = time.time()
        with self.lock:
            self.data     = d.copy()
            self.new_data = True
            self._hz_buf.append(now)
            self._hz_buf  = [t for t in self._hz_buf if now - t < 5]
            self.hz       = max(len(self._hz_buf) - 1, 0) / 5.0

    def snapshot(self):
        with self.lock:
            self.new_data = False
            return self.data.copy(), round(self.hz, 1)


SHARED  = SharedGPS()
CLIENTS: set = set()


# ── NMEA parsing ──────────────────────────────────────────────────────

def nmea_ok(sentence: str) -> bool:
    try:
        if "*" not in sentence:
            return False
        body, cs = sentence[1:].rsplit("*", 1)
        calc = 0
        for c in body:
            calc ^= ord(c)
        return calc == int(cs.strip()[:2], 16)
    except Exception:
        return False


def dms2dd(raw: str, hem: str):
    if not raw:
        return None
    dot = raw.index(".")
    deg = float(raw[:dot - 2])
    mn  = float(raw[dot - 2:]) / 60.0
    dd  = deg + mn
    return -dd if hem in ("S", "W") else dd


def parse_gga(fields) -> dict | None:
    if len(fields) < 10:
        return None
    try:
        return {
            "lat":  dms2dd(fields[2], fields[3]),
            "lon":  dms2dd(fields[4], fields[5]),
            "fix":  fields[6],
            "sats": fields[7],
            "hdop": fields[8],
            "alt":  fields[9],
        }
    except Exception:
        return None


def parse_rmc(fields) -> dict | None:
    if len(fields) < 9:
        return None
    try:
        if fields[2] != "A":
            return None
        return {
            "speed_kmh": float(fields[7]) * 1.852 if fields[7] else 0.0,
            "course":    float(fields[8]) if fields[8] else 0.0,
        }
    except Exception:
        return None


def make_gga_approx(lat=43.1, lon=6.0) -> bytes:
    def dd2dms(dd, is_lat):
        hem = ("N" if dd >= 0 else "S") if is_lat else ("E" if dd >= 0 else "W")
        dd  = abs(dd)
        deg = int(dd)
        mn  = (dd - deg) * 60.0
        fmt = f"{deg:02d}{mn:08.5f}" if is_lat else f"{deg:03d}{mn:08.5f}"
        return fmt, hem
    lat_s, lat_h = dd2dms(lat, True)
    lon_s, lon_h = dd2dms(lon, False)
    body = f"GPGGA,000000.00,{lat_s},{lat_h},{lon_s},{lon_h},1,08,1.0,0.0,M,0.0,M,,"
    cs = 0
    for c in body:
        cs ^= ord(c)
    return f"${body}*{cs:02X}\r\n".encode()


# ── NTRIP client (thread) ─────────────────────────────────────────────

class NtripClient:
    def __init__(self, ser: serial.Serial, caster: str = DEFAULT_CASTER):
        cfg           = CASTERS[caster]
        self.host     = cfg["host"]
        self.port     = cfg["port"]
        self.mountpt  = cfg["mountpt"]
        self.user     = cfg["user"]
        self.password = cfg["pass"]
        self.label    = cfg["label"]
        self.ser      = ser
        self.lat      = 43.1
        self.lon      = 6.0
        self._stop    = threading.Event()
        self._thread  = threading.Thread(target=self._run, daemon=True, name="ntrip")
        self.connected = False
        self.bytes_in  = 0

    def start(self):
        self._thread.start()

    def stop(self):
        self._stop.set()

    def update_position(self, lat, lon):
        self.lat = lat
        self.lon = lon

    def _run(self):
        while not self._stop.is_set():
            try:
                self._stream()
            except Exception as e:
                print(f"[ntrip] {e} — retry in 5s")
            if not self._stop.is_set():
                time.sleep(5)

    def _stream(self):
        creds   = base64.b64encode(f"{self.user}:{self.password}".encode()).decode()
        request = (
            f"GET /{self.mountpt} HTTP/1.0\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            f"Ntrip-Version: Ntrip/2.0\r\n"
            f"User-Agent: NTRIP MoKartGPS/1.0\r\n"
            f"Authorization: Basic {creds}\r\n"
            f"Connection: close\r\n\r\n"
        )
        print(f"[ntrip] Connecting to {self.host}/{self.mountpt} ({self.label})...")
        sock = socket.create_connection((self.host, self.port), timeout=10)
        sock.sendall(request.encode())

        header = b""
        while b"\r\n\r\n" not in header:
            chunk = sock.recv(256)
            if not chunk:
                raise ConnectionError("Closed during header")
            header += chunk

        first = header.decode(errors="replace").split("\r\n")[0]
        if "200" not in first and "ICY 200" not in first:
            raise ConnectionError(f"Rejected: {first}")

        print("[ntrip] Connected — RTCM3 streaming")
        self.connected = True
        sock.sendall(make_gga_approx(self.lat, self.lon))

        leftover = header.split(b"\r\n\r\n", 1)[1] if b"\r\n\r\n" in header else b""
        if leftover:
            self.ser.write(leftover)
            self.bytes_in += len(leftover)

        gga_timer = time.time()
        sock.settimeout(5)

        while not self._stop.is_set():
            try:
                data = sock.recv(4096)
            except socket.timeout:
                if time.time() - gga_timer > 30:
                    sock.sendall(make_gga_approx(self.lat, self.lon))
                    gga_timer = time.time()
                continue
            if not data:
                break
            self.ser.write(data)
            self.bytes_in += len(data)

        self.connected = False
        sock.close()
        print("[ntrip] Disconnected")


# ── Serial reader (thread) ────────────────────────────────────────────

def serial_thread(port: str, baud: int, use_ntrip: bool, caster: str):
    while True:
        try:
            print(f"[serial] Opening {port} at {baud} baud...")
            ser = serial.Serial(port, baud, timeout=1)
        except serial.SerialException as e:
            print(f"[serial] Open failed: {e} — retry in 3s")
            time.sleep(3)
            continue

        ntrip = None
        if use_ntrip:
            ntrip = NtripClient(ser, caster=caster)
            ntrip.start()

        buf        = b""
        state      = {}
        speed_kmh  = 0.0
        course     = 0.0

        try:
            while True:
                chunk = ser.read(ser.in_waiting or 1)
                if not chunk:
                    continue
                buf += chunk

                while b"\n" in buf:
                    line, buf = buf.split(b"\n", 1)
                    sentence  = line.decode(errors="replace").strip()
                    if not sentence.startswith("$"):
                        continue
                    if not nmea_ok(sentence):
                        continue

                    fields   = sentence.split(",")
                    msg_type = fields[0][1:]

                    if msg_type in ("GNGGA", "GPGGA", "GAGGA", "GLGGA", "GBGGA"):
                        gga = parse_gga(fields)
                        if gga:
                            state.update(gga)

                    elif msg_type in ("GNRMC", "GPRMC", "GARMC", "GLRMC"):
                        rmc = parse_rmc(fields)
                        if rmc:
                            speed_kmh = rmc["speed_kmh"]
                            course    = rmc["course"]

                    # Emit once we have a complete GGA
                    if "fix" in state:
                        d = {
                            "lat":       state.get("lat"),
                            "lon":       state.get("lon"),
                            "fix":       state.get("fix", "0"),
                            "fix_label": FIX_LABELS.get(state.get("fix", "0"), "?"),
                            "sats":      state.get("sats", "0"),
                            "hdop":      state.get("hdop", "99"),
                            "alt":       state.get("alt", "0"),
                            "speed_kmh": round(speed_kmh, 1),
                            "course":    round(course, 1),
                            "ntrip_ok":  ntrip.connected if ntrip else False,
                            "ntrip_kb":  (ntrip.bytes_in // 1024) if ntrip else 0,
                            "ts":        time.time(),
                        }
                        if d["lat"] is not None and ntrip:
                            ntrip.update_position(d["lat"], d["lon"])
                        SHARED.update(d)

        except (OSError, serial.SerialException) as e:
            print(f"[serial] Disconnected: {e}")
        finally:
            if ntrip:
                ntrip.stop()
            try:
                ser.close()
            except Exception:
                pass
        print("[serial] Reconnecting in 3s...")
        time.sleep(3)


# ── WebSocket broadcaster (async) ─────────────────────────────────────

async def broadcaster():
    while True:
        await asyncio.sleep(0.2)   # 5fps max (GPS is 1Hz anyway)
        if not CLIENTS:
            continue
        data, hz = SHARED.snapshot()
        if not data:
            continue
        msg = json.dumps({
            "lat":       data.get("lat"),
            "lon":       data.get("lon"),
            "fix":       data.get("fix", "0"),
            "fix_label": data.get("fix_label", "No fix"),
            "sats":      data.get("sats", "0"),
            "hdop":      data.get("hdop", "99"),
            "alt":       round(float(data.get("alt") or 0), 1),
            "speed_kmh": data.get("speed_kmh", 0),
            "course":    data.get("course", 0),
            "ntrip_ok":  data.get("ntrip_ok", False),
            "ntrip_kb":  data.get("ntrip_kb", 0),
            "hz":        hz,
        })
        for ws in list(CLIENTS):
            try:
                await ws.send(msg)
            except Exception:
                CLIENTS.discard(ws)


# ── WebSocket handler ─────────────────────────────────────────────────

async def ws_handler(websocket):
    CLIENTS.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        CLIENTS.discard(websocket)


# ── HTTP handler (serves HTML on every non-WS request) ───────────────

async def http_handler(connection, request):
    # Laisser passer les requêtes WebSocket upgrade (Upgrade: websocket)
    if request.headers.get("upgrade", "").lower() == "websocket":
        return None
    # Servir la page HTML pour les requêtes HTTP normales
    if request.path in ("/", "/index.html"):
        body = HTML_PAGE.encode()
        hdrs = Headers([
            ("Content-Type", "text/html; charset=utf-8"),
            ("Content-Length", str(len(body))),
            ("Cache-Control", "no-cache"),
        ])
        return Response(200, "OK", hdrs, body)
    body = b"Not found"
    hdrs = Headers([("Content-Length", str(len(body)))])
    return Response(404, "Not Found", hdrs, body)


# ── HTML map page ─────────────────────────────────────────────────────

HTML_PAGE = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GPS Live — MoKart</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;height:100%;background:#f5f5f5;overflow:hidden}
  #map{width:100vw;height:100vh}

  /* Header */
  #header{
    position:fixed;top:0;left:0;right:0;z-index:1000;
    display:flex;align-items:center;justify-content:space-between;
    background:#161b22cc;backdrop-filter:blur(8px);
    border-bottom:1px solid #30363d;padding:10px 18px;
  }
  #header h1{font-family:monospace;font-size:13px;font-weight:700;color:#58a6ff;letter-spacing:1px}
  #ws-dot{width:8px;height:8px;border-radius:50%;background:#f78166;transition:background .3s;flex-shrink:0}
  #ws-dot.live{background:#3fb950}

  /* Overlay panel */
  #panel{
    position:fixed;top:54px;left:12px;z-index:1000;
    background:#161b22ee;backdrop-filter:blur(8px);
    border:1px solid #30363d;border-radius:10px;
    padding:14px 16px;min-width:220px;
    font-family:'JetBrains Mono',Consolas,monospace;font-size:12px;color:#e6edf3;
    display:flex;flex-direction:column;gap:8px;
  }
  .row{display:flex;justify-content:space-between;align-items:center;gap:16px}
  .lbl{color:#8b949e;font-size:10px;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap}
  .val{font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;text-align:right}
  .val.big{font-size:18px}

  /* Fix badge */
  #fix-badge{
    text-align:center;padding:5px 10px;border-radius:6px;
    font-weight:700;font-size:13px;letter-spacing:.5px;
    background:#21262d;border:1px solid #30363d;color:#8b949e;
    transition:all .3s;
  }
  #fix-badge.gps   {background:#1a3a1a;border-color:#3fb950;color:#3fb950}
  #fix-badge.float {background:#3a2a0a;border-color:#e3b341;color:#e3b341}
  #fix-badge.fixed {background:#0a2a1a;border-color:#3fb950;color:#56d364;box-shadow:0 0 8px #3fb95044}

  /* NTRIP status */
  #ntrip-row{font-size:10px;color:#8b949e;border-top:1px solid #21262d;padding-top:6px;margin-top:2px}
  #ntrip-row span{color:#58a6ff}

  .leaflet-container{background:#f5f5f5}
</style>
</head>
<body>
<div id="map"></div>

<div id="header">
  <h1>⬡ GPS LIVE — MoKart</h1>
  <div style="display:flex;align-items:center;gap:8px">
    <span style="font-family:monospace;font-size:11px;color:#8b949e" id="coord-header">—</span>
    <div id="ws-dot"></div>
  </div>
</div>

<div id="panel">
  <div id="fix-badge">NO FIX</div>
  <div class="row"><span class="lbl">Satellites</span><span class="val big" id="v-sats">—</span></div>
  <div class="row"><span class="lbl">HDOP</span><span class="val" id="v-hdop">—</span></div>
  <div class="row"><span class="lbl">Altitude</span><span class="val" id="v-alt">— m</span></div>
  <div class="row"><span class="lbl">Vitesse</span><span class="val" id="v-speed">— km/h</span></div>
  <div class="row"><span class="lbl">Cap</span><span class="val" id="v-course">—°</span></div>
  <div class="row"><span class="lbl">Fréquence</span><span class="val" id="v-hz">— Hz</span></div>
  <div id="ntrip-row">NTRIP : <span id="v-ntrip">—</span></div>
</div>

<script>
// ── Map init ──────────────────────────────────────────────────────────
const map = L.map('map', {
  center: [46.5, 2.5],
  zoom: 6,
  zoomControl: true,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap © CartoDB',
  subdomains: 'abcd',
  maxZoom: 20,
}).addTo(map);

// Custom marker (glowing dot)
const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#58a6ff;border:2px solid #fff;
    box-shadow:0 0 10px #58a6ff88;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

let marker    = null;
let trail     = L.polyline([], { color: '#1a6fcf', weight: 3, opacity: 0.8 }).addTo(map);
let trailPts  = [];
let firstFix  = false;
const MAX_TRAIL = 500;

// ── Helpers ───────────────────────────────────────────────────────────
function fmt(v, dec=2) {
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toFixed(dec);
}

function setFixBadge(fixLabel) {
  const el  = document.getElementById('fix-badge');
  el.textContent = fixLabel.toUpperCase();
  el.className = '';
  if (fixLabel.includes('Fixed'))  el.classList.add('fixed');
  else if (fixLabel.includes('Float')) el.classList.add('float');
  else if (fixLabel.includes('GPS') || fixLabel.includes('DGPS')) el.classList.add('gps');
}

// ── WebSocket ─────────────────────────────────────────────────────────
let ws, reconnTimer;

function connect() {
  ws = new WebSocket(`ws://${location.host}`);
  ws.onopen  = () => { document.getElementById('ws-dot').classList.add('live'); clearTimeout(reconnTimer); };
  ws.onclose = () => { document.getElementById('ws-dot').classList.remove('live'); reconnTimer = setTimeout(connect, 2000); };
  ws.onerror = () => ws.close();
  ws.onmessage = ({ data }) => {
    const d = JSON.parse(data);

    // Panel
    setFixBadge(d.fix_label || 'No fix');
    document.getElementById('v-sats').textContent   = d.sats ?? '—';
    document.getElementById('v-hdop').textContent   = fmt(d.hdop, 2);
    document.getElementById('v-alt').textContent    = fmt(d.alt, 1) + ' m';
    document.getElementById('v-speed').textContent  = fmt(d.speed_kmh, 1) + ' km/h';
    document.getElementById('v-course').textContent = fmt(d.course, 1) + '°';
    document.getElementById('v-hz').textContent     = fmt(d.hz, 1) + ' Hz';
    document.getElementById('v-ntrip').textContent  = d.ntrip_ok ? `OK (${d.ntrip_kb} KB)` : 'Connecting…';

    if (d.lat == null || d.lon == null) return;

    const latlng = [d.lat, d.lon];

    // Header coord
    document.getElementById('coord-header').textContent =
      `${d.lat.toFixed(6)}, ${d.lon.toFixed(6)}`;

    // Marker
    if (!marker) {
      marker = L.marker(latlng, { icon: markerIcon }).addTo(map);
    } else {
      marker.setLatLng(latlng);
    }

    // Auto-center on first real fix
    if (!firstFix && d.fix !== '0') {
      map.setView(latlng, 17);
      firstFix = true;
    } else if (firstFix) {
      // Soft-follow: re-center only if marker goes off-screen
      if (!map.getBounds().contains(latlng)) {
        map.panTo(latlng, { animate: true, duration: 0.5 });
      }
    }

    // Trail
    trailPts.push(latlng);
    if (trailPts.length > MAX_TRAIL) trailPts.shift();
    trail.setLatLngs(trailPts);
  };
}

connect();
</script>
</body>
</html>
"""


# ── Port detection ────────────────────────────────────────────────────

def find_port():
    for p in serial.tools.list_ports.comports():
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        dev  = p.device
        if any(k in desc for k in ["cp210", "silicon labs", "slab"]):
            return dev
        if "10c4" in hwid:
            return dev
        if any(k in dev for k in ["ttyS0", "ttyAMA0", "ttyUSB0", "usbserial"]):
            return dev
    return None


# ── Entry point ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="GPS Web Server — LC29H(DA) + Leaflet")
    parser.add_argument("-p", "--port",      help="Serial port (auto-detect si omis)")
    parser.add_argument("-b", "--baud",      type=int, default=DEFAULT_BAUD)
    parser.add_argument("--no-ntrip",        action="store_true")
    parser.add_argument("--caster",          choices=list(CASTERS.keys()), default=DEFAULT_CASTER)
    parser.add_argument("--web-port",        type=int, default=WEB_PORT)
    parser.add_argument("--list-ports",      action="store_true")
    args = parser.parse_args()

    if args.list_ports:
        for p in serial.tools.list_ports.comports():
            print(f"  {p.device}  {p.description}")
        return

    port = args.port or find_port()
    if not port:
        print("ERROR: Aucun port trouvé. Utilise --list-ports puis -p <port>")
        return
    if not args.port:
        print(f"[gps] Port auto-détecté : {port}")

    # Start serial thread
    t = threading.Thread(
        target=serial_thread,
        args=(port, args.baud, not args.no_ntrip, args.caster),
        daemon=True,
    )
    t.start()

    # Start async server
    async def run():
        asyncio.create_task(broadcaster())
        print(f"\n  GPS Map : http://0.0.0.0:{args.web_port}")
        print(f"  NTRIP   : {CASTERS[args.caster]['label']}")
        print("  Ctrl+C pour arrêter\n")
        async with websockets.serve(
            ws_handler,
            "0.0.0.0",
            args.web_port,
            process_request=http_handler,
        ):
            await asyncio.Future()

    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print("\nArrêt.")


if __name__ == "__main__":
    main()
