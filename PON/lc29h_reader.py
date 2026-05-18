#!/usr/bin/env python3
"""
Quectel LC29H(DA) GPS/RTK HAT Reader
=====================================
Injecte des corrections RTCM3 depuis le caster Point One NTRIP
et lit les positions NMEA en retour.

Module : Quectel LC29H(DA) — Rover uniquement, 1 Hz RTK max
HAT    : Waveshare LC29H(XX) GPS/RTK HAT
Baud   : 115200 (défaut)
Port   :
  - Mac via USB (jumper A) : /dev/cu.usbserial-XXX ou /dev/cu.SLAB_USBtoUART
  - RPi UART (jumper B)    : /dev/ttyS0  (RPi 4) / /dev/ttyAMA0 (RPi 5)
  - RPi via USB (jumper A) : /dev/ttyUSB0

Install :
  pip install pyserial

Run :
  python3 lc29h_reader.py                      # auto-detect + NTRIP
  python3 lc29h_reader.py -p /dev/cu.SLAB_USBtoUART
  python3 lc29h_reader.py --configure          # envoyer PAIR commands d'abord
  python3 lc29h_reader.py --no-ntrip           # NMEA only
  python3 lc29h_reader.py --debug              # toutes les trames brutes

Qualité de fix (champ GGA) :
  0 = No fix
  1 = GPS standalone (~1-3m)
  2 = DGPS / SBAS
  4 = RTK Fixed  ✓  (<10cm)
  5 = RTK Float  ~  (~20-50cm)

⚠ LC29H(DA) limitation : 1 Hz RTK max (vs 200Hz IMU, ~10Hz Point One Smart Antenna)
   → Le DA convient pour du statique / lent. Pour un kart, préférer LC29H(EA) (10Hz)
"""

import argparse
import base64
import socket
import threading
import time
import serial
import serial.tools.list_ports

# ── NTRIP caster configs ──────────────────────────────────────────────
CASTERS = {
    "centipede": {
        "host":     "caster.centipede.fr",
        "port":     2101,
        "mountpt":  "NEAR",
        "user":     "centipede",
        "pass":     "centipede",
        "label":    "Centipede (FR, gratuit)",
    },
    "point-one": {
        "host":     "virtualrtk.pointonenav.com",
        "port":     2101,
        "mountpt":  "AUTO",
        "user":     "vxuykevwn8",
        "pass":     "4yv7u82y3x",
        "label":    "Point One Navigation",
    },
}
DEFAULT_CASTER = "centipede"

# ── Serial ────────────────────────────────────────────────────────────
DEFAULT_BAUD   = 115200
BAUD_FALLBACKS = [115200, 9600, 38400, 57600]

FIX_QUALITY = {
    "0": "No fix",
    "1": "GPS",
    "2": "DGPS/SBAS",
    "3": "PPS",
    "4": "RTK Fixed ✓",
    "5": "RTK Float ~",
    "6": "Estimated",
}


# ── PAIR command helpers ──────────────────────────────────────────────

def pair_checksum(body: str) -> str:
    """Compute XOR checksum for a PAIR command body (without $ and *)."""
    cs = 0
    for c in body:
        cs ^= ord(c)
    return f"{cs:02X}"


def make_pair(body: str) -> bytes:
    """Build a complete PAIR command sentence."""
    cs = pair_checksum(body)
    return f"${body}*{cs}\r\n".encode()


# PAIR commands for LC29H(DA/EA)
PAIR_GET_VERSION    = make_pair("PAIR001")               # firmware version
PAIR_RATE_1HZ       = make_pair("PAIR050,1000")          # 1 Hz (max for DA with RTK)
PAIR_DISABLE_GLL    = make_pair("PAIR062,1,0")           # disable GLL
PAIR_DISABLE_VTG    = make_pair("PAIR062,2,0")           # disable VTG
PAIR_DISABLE_GSA    = make_pair("PAIR062,3,0")           # disable GSA (verbose)
PAIR_DISABLE_GSV    = make_pair("PAIR062,5,0")           # disable GSV (verbose)
PAIR_ENABLE_GGA     = make_pair("PAIR062,0,1")           # ensure GGA on
PAIR_ENABLE_RMC     = make_pair("PAIR062,6,1")           # ensure RMC on
PAIR_SAVE           = make_pair("PAIR513")               # save to flash


def configure_module(ser: serial.Serial):
    """
    Send PAIR commands to optimize the LC29H output.
    Disables verbose sentences (GSA, GSV) to reduce UART load.
    """
    print("[lc29h] Configuring module via PAIR commands...")
    cmds = [
        ("Get version",    PAIR_GET_VERSION),
        ("Set 1 Hz",       PAIR_RATE_1HZ),
        ("Disable GLL",    PAIR_DISABLE_GLL),
        ("Disable VTG",    PAIR_DISABLE_VTG),
        ("Disable GSA",    PAIR_DISABLE_GSA),
        ("Disable GSV",    PAIR_DISABLE_GSV),
        ("Enable GGA",     PAIR_ENABLE_GGA),
        ("Enable RMC",     PAIR_ENABLE_RMC),
        ("Save config",    PAIR_SAVE),
    ]
    for name, cmd in cmds:
        ser.write(cmd)
        print(f"  → {name}: {cmd.decode().strip()}")
        time.sleep(0.2)

    # Read response for ~2s
    time.sleep(2.0)
    resp = ser.read(ser.in_waiting)
    if resp:
        for line in resp.decode(errors="replace").splitlines():
            if line.strip():
                print(f"  ← {line.strip()}")
    print("[lc29h] Configuration done\n")


# ── Port detection ────────────────────────────────────────────────────

def find_lc29h_port():
    """Auto-detect the LC29H serial port (CP2102 USB-UART bridge)."""
    candidates = []
    for p in serial.tools.list_ports.comports():
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        dev  = p.device
        # CP210x (Silicon Labs) — used on Waveshare HAT USB
        if any(k in desc for k in ["cp210", "silicon labs", "slab"]):
            return dev
        if "10c4:ea60" in hwid or "10c4" in hwid:
            return dev
        if any(k in dev for k in ["usbserial", "usbmodem", "SLAB"]):
            candidates.append(dev)
        # RPi UART fallback
        if any(k in dev for k in ["ttyS0", "ttyAMA0", "ttyUSB0"]):
            candidates.append(dev)
    return candidates[0] if candidates else None


# ── NMEA parsing ──────────────────────────────────────────────────────

def nmea_checksum_ok(sentence: str) -> bool:
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


def parse_gga(fields) -> dict | None:
    if len(fields) < 10:
        return None
    try:
        raw_lat = fields[2]; lat_hem = fields[3]
        raw_lon = fields[4]; lon_hem = fields[5]

        def dms2dd(raw, hem):
            if not raw:
                return None
            dot = raw.index(".")
            deg = float(raw[:dot - 2])
            mn  = float(raw[dot - 2:]) / 60.0
            dd  = deg + mn
            if hem in ("S", "W"):
                dd = -dd
            return dd

        return {
            "lat":  dms2dd(raw_lat, lat_hem),
            "lon":  dms2dd(raw_lon, lon_hem),
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
        return {
            "status":    fields[2],
            "speed_kmh": float(fields[7]) * 1.852 if fields[7] else 0.0,
            "course":    float(fields[8]) if fields[8] else 0.0,
        }
    except Exception:
        return None


def make_gga_approx(lat=43.1, lon=6.0) -> bytes:
    """Approximate GGA (south of France) to send to NTRIP caster."""
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


# ── NTRIP client ──────────────────────────────────────────────────────

class NtripClient:
    def __init__(self, ser: serial.Serial, caster: str = DEFAULT_CASTER, lat=43.1, lon=6.0):
        cfg            = CASTERS[caster]
        self.host      = cfg["host"]
        self.port      = cfg["port"]
        self.mountpt   = cfg["mountpt"]
        self.user      = cfg["user"]
        self.password  = cfg["pass"]
        self.label     = cfg["label"]
        self.ser       = ser
        self.lat       = lat
        self.lon       = lon
        self._stop     = threading.Event()
        self._thread   = threading.Thread(target=self._run, daemon=True, name="ntrip")
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
                self._connect_and_stream()
            except Exception as e:
                print(f"\n[ntrip] Error: {e} — retry in 5s")
            if not self._stop.is_set():
                time.sleep(5)

    def _connect_and_stream(self):
        credentials = base64.b64encode(f"{self.user}:{self.password}".encode()).decode()
        request = (
            f"GET /{self.mountpt} HTTP/1.0\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            f"Ntrip-Version: Ntrip/2.0\r\n"
            f"User-Agent: NTRIP MoKartLC29H/1.0\r\n"
            f"Authorization: Basic {credentials}\r\n"
            f"Connection: close\r\n\r\n"
        )
        print(f"\n[ntrip] Connecting to {self.host}:{self.port}/{self.mountpt} ({self.label})...")
        sock = socket.create_connection((self.host, self.port), timeout=10)
        sock.sendall(request.encode())

        header = b""
        while b"\r\n\r\n" not in header:
            chunk = sock.recv(256)
            if not chunk:
                raise ConnectionError("Closed during header")
            header += chunk

        first_line = header.decode(errors="replace").split("\r\n")[0]
        if "200" not in first_line and "ICY 200" not in first_line:
            raise ConnectionError(f"Rejected: {first_line}")

        print("[ntrip] Connected — RTCM3 corrections streaming")
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
        print("\n[ntrip] Disconnected")


# ── Stats for benchmark ───────────────────────────────────────────────

class BenchmarkStats:
    """Accumulates fix quality history for benchmarking vs Point One."""
    def __init__(self):
        self.samples      = 0
        self.rtk_fixed    = 0
        self.rtk_float    = 0
        self.gps_only     = 0
        self.no_fix       = 0
        self.first_fix_ts = None
        self.first_rtk_ts = None
        self.hdops        = []
        self.start_ts     = time.time()

    def record(self, fix: str, hdop: str):
        self.samples += 1
        now = time.time()
        if fix == "4":
            self.rtk_fixed += 1
            if self.first_rtk_ts is None:
                self.first_rtk_ts = now
                print(f"\n  ★ RTK Fixed reached in {now - self.start_ts:.1f}s!")
        elif fix == "5":
            self.rtk_float += 1
        elif fix in ("1", "2", "3"):
            self.gps_only += 1
            if self.first_fix_ts is None:
                self.first_fix_ts = now
                print(f"\n  ✓ First GPS fix in {now - self.start_ts:.1f}s")
        else:
            self.no_fix += 1
        try:
            self.hdops.append(float(hdop))
        except Exception:
            pass

    def summary(self):
        if self.samples == 0:
            return "No samples recorded"
        elapsed = time.time() - self.start_ts
        avg_hdop = sum(self.hdops) / len(self.hdops) if self.hdops else 0
        lines = [
            "\n" + "═" * 50,
            "  LC29H(DA) BENCHMARK SUMMARY",
            "═" * 50,
            f"  Duration          : {elapsed:.0f}s",
            f"  Total samples     : {self.samples}",
            f"  RTK Fixed (4)     : {self.rtk_fixed} ({100*self.rtk_fixed/self.samples:.1f}%)",
            f"  RTK Float (5)     : {self.rtk_float} ({100*self.rtk_float/self.samples:.1f}%)",
            f"  GPS only  (1-3)   : {self.gps_only} ({100*self.gps_only/self.samples:.1f}%)",
            f"  No fix    (0)     : {self.no_fix} ({100*self.no_fix/self.samples:.1f}%)",
            f"  Avg HDOP          : {avg_hdop:.2f}",
        ]
        if self.first_fix_ts:
            lines.append(f"  Time to first fix : {self.first_fix_ts - self.start_ts:.1f}s")
        if self.first_rtk_ts:
            lines.append(f"  Time to RTK Fixed : {self.first_rtk_ts - self.start_ts:.1f}s")
        lines += [
            "═" * 50,
            "  ⚠ DA variant max RTK rate: 1 Hz",
            "  Compare with Point One Smart Antenna (~10Hz)",
            "═" * 50,
        ]
        return "\n".join(lines)


# ── PAIR message decoder ─────────────────────────────────────────────

GPS_EPOCH_JD  = 2444244.5          # Julian date of GPS epoch (Jan 6 1980)
GNSS_NAMES    = {0: "GPS", 1: "GLONASS", 2: "Galileo", 3: "BeiDou", 4: "QZSS"}
FIX_NAMES_P10 = {0: "No fix", 1: "GPS fix", 2: "DGPS", 4: "RTK Fixed ✓", 5: "RTK Float ~"}


def gps_to_utc(week: int, tow_s: float) -> str:
    """Convert GPS week + time-of-week to a readable UTC string."""
    import datetime
    gps_epoch = datetime.datetime(1980, 1, 6, tzinfo=datetime.timezone.utc)
    t = gps_epoch + datetime.timedelta(weeks=week, seconds=tow_s)
    return t.strftime("%Y-%m-%d %H:%M:%S UTC")


def decode_pair(sentence: str) -> str:
    """Return a human-readable description of a PAIR sentence."""
    fields = sentence.split(",")
    msg = fields[0][1:]   # e.g. "PAIR010"

    try:
        if msg == "PAIR010":
            # $PAIR010,<fix_type>,<gnss_id>,<gps_week>,<gps_tow>*cs
            # Periodic status broadcast (~60s interval, one per constellation)
            fix_raw  = int(fields[1])
            gnss_id  = int(fields[2])
            week     = int(fields[3])
            tow_raw  = fields[4].split("*")[0]
            tow_s    = float(tow_raw)
            fix_lbl  = FIX_NAMES_P10.get(fix_raw, f"?({fix_raw})")
            gnss_lbl = GNSS_NAMES.get(gnss_id, f"GNSS{gnss_id}")
            utc      = gps_to_utc(week, tow_s)
            return (
                f"STATUS  constellation={gnss_lbl:<8}  fix={fix_lbl:<14}"
                f"  gps_week={week}  tow={tow_s:.0f}s  → {utc}"
            )

        elif msg == "PAIR001":
            # $PAIR001,<cmd_id>,<result>  — ACK/NACK for a sent command
            cmd_id = fields[1] if len(fields) > 1 else "?"
            result = fields[2].split("*")[0] if len(fields) > 2 else "?"
            result_lbl = {"0": "OK ✓", "1": "FAILED ✗", "2": "UNSUPPORTED"}.get(result, result)
            return f"ACK     cmd={cmd_id}  result={result_lbl}"

        elif msg == "PAIR021":
            # $PAIR021,<fw_version>  — firmware version response
            return f"FIRMWARE  version={fields[1].split('*')[0]}"

        elif msg == "PAIR513":
            return "SAVE CONFIG  → settings written to flash"

        else:
            # Unknown PAIR — show raw with field breakdown
            body = sentence.split("*")[0]
            return f"{body}  [{len(fields)-1} fields]"

    except Exception:
        return sentence   # fallback: raw


# ── Main read loop ────────────────────────────────────────────────────

def read_loop(port: str, baud: int, use_ntrip: bool, debug: bool, do_configure: bool, caster: str):
    print(f"[lc29h] Opening {port} at {baud} baud...")
    ser = serial.Serial(port, baud, timeout=1)
    time.sleep(0.5)
    ser.reset_input_buffer()

    if do_configure:
        configure_module(ser)
        ser.reset_input_buffer()

    ntrip = None
    if use_ntrip:
        cfg = CASTERS[caster]
        print(f"[ntrip] Caster : {cfg['label']}  ({cfg['host']}:{cfg['port']}/{cfg['mountpt']})")
        ntrip = NtripClient(ser, caster=caster)
        ntrip.start()

    print("[lc29h] Reading NMEA — Ctrl+C to stop\n")
    stats = BenchmarkStats()
    buf   = b""

    try:
        while True:
            chunk = ser.read(ser.in_waiting or 1)
            if not chunk:
                continue
            buf += chunk

            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                sentence = line.decode(errors="replace").strip()
                if not sentence.startswith("$"):
                    continue

                if debug:
                    cs_ok = nmea_checksum_ok(sentence)
                    print(f"  RAW [{'+ ' if cs_ok else 'CS'}] {sentence}")
                    if not cs_ok:
                        continue
                elif not nmea_checksum_ok(sentence):
                    continue

                fields   = sentence.split(",")
                msg_type = fields[0][1:]

                if msg_type in ("GNGGA", "GPGGA", "GAGGA", "GLGGA", "GBGGA"):
                    gga = parse_gga(fields)
                    if gga:
                        fix_label = FIX_QUALITY.get(gga["fix"], f"?{gga['fix']}")
                        stats.record(gga["fix"], gga["hdop"])
                        if gga["lat"] is not None:
                            print(
                                f"\n  GGA  lat={gga['lat']:+.7f}  lon={gga['lon']:+.7f}"
                                f"  alt={gga['alt']}m  sats={gga['sats']}"
                                f"  hdop={gga['hdop']}  [{fix_label}]"
                            )
                            if ntrip:
                                ntrip.update_position(gga["lat"], gga["lon"])
                        else:
                            ntrip_ok = ntrip and ntrip.connected
                            kb = (ntrip.bytes_in // 1024) if ntrip else 0
                            print(
                                f"\r  Waiting... sats={gga['sats']:>2}  fix={fix_label:<12}"
                                f"  ntrip={'OK ' if ntrip_ok else '…  '} {kb}KB in   ",
                                end="", flush=True,
                            )

                elif msg_type in ("GNRMC", "GPRMC", "GARMC", "GLRMC"):
                    rmc = parse_rmc(fields)
                    if rmc and rmc["status"] == "A":
                        print(
                            f"\n  RMC  {rmc['speed_kmh']:.1f} km/h  cap={rmc['course']:.1f}°"
                        )

                elif msg_type.startswith("PAIR"):
                    print(f"\n  PAIR ← {decode_pair(sentence)}")

                else:
                    pass  # GSV, GSA, VTG — silenced unless --debug

    except KeyboardInterrupt:
        print(stats.summary())
    finally:
        if ntrip:
            ntrip.stop()
        ser.close()


# ── Entry point ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Quectel LC29H(DA) GPS/RTK HAT Reader — MoKart benchmark"
    )
    parser.add_argument("-p", "--port",      help="Serial port (auto-detect if omitted)")
    parser.add_argument("-b", "--baud",      type=int, default=DEFAULT_BAUD)
    parser.add_argument("--no-ntrip",        action="store_true",
                        help="Disable NTRIP (NMEA only)")
    parser.add_argument("--caster",          choices=list(CASTERS.keys()),
                        default=DEFAULT_CASTER,
                        help=f"NTRIP caster à utiliser (défaut: {DEFAULT_CASTER})")
    parser.add_argument("--configure",       action="store_true",
                        help="Send PAIR config commands at startup")
    parser.add_argument("--debug",           action="store_true",
                        help="Print all raw NMEA sentences")
    parser.add_argument("--list-ports",      action="store_true")
    args = parser.parse_args()

    if args.list_ports:
        for p in serial.tools.list_ports.comports():
            print(f"  {p.device}  {p.description}  [{p.hwid}]")
        return

    port = args.port or find_lc29h_port()
    if not port:
        print("ERROR: No port found. Use --list-ports then -p <port>")
        return
    if not args.port:
        print(f"[lc29h] Auto-detected: {port}")

    # Baud auto-detect
    baud = args.baud
    all_bauds = [baud] + [b for b in BAUD_FALLBACKS if b != baud]
    for b in all_bauds:
        print(f"[lc29h] Trying {b} baud...")
        try:
            s = serial.Serial(port, b, timeout=3)
            data = s.read(128)
            s.close()
            if b"$" in data or b"PAIR" in data:
                print(f"[lc29h] Got data at {b} baud")
                baud = b
                break
            print(f"[lc29h] No data at {b} baud")
        except Exception as e:
            print(f"[lc29h] {b} baud error: {e}")

    print(f"\n  ⚠ LC29H(DA) : RTK max 1 Hz (benchmark vs Point One ~10 Hz)\n")
    read_loop(port, baud, use_ntrip=not args.no_ntrip, debug=args.debug,
              do_configure=args.configure, caster=args.caster)


if __name__ == "__main__":
    main()
