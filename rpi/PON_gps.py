#!/usr/bin/env python3
"""
Point One Navigation — RTK Smart Antenna Reader
================================================
Connects to the NTRIP caster (virtualrtk.pointonenav.com) to inject
RTK corrections into the antenna, and reads NMEA sentences back.

Install:
  pip install pyserial

Run (normal mode — read NMEA + RTK corrections):
  python3 pon_gps.py                          # auto-detect port
  python3 pon_gps.py -p /dev/ttyUSB0          # explicit port
  python3 pon_gps.py --no-ntrip               # NMEA only, no corrections
  python3 pon_gps.py --baud 115200            # explicit baud rate

Configure antenna (one-shot — set update rate):
  python3 pon_gps.py --set-rate 10            # set to 10 Hz (1, 2, 5, 10 supported)
  python3 pon_gps.py -p /dev/ttyUSB0 --set-rate 10  # explicit port + rate

Fix quality in GGA:
  0 = No fix
  1 = GPS (standalone, ~3m)
  2 = DGPS
  4 = RTK Fixed  (best, <10cm)
  5 = RTK Float  (transitioning, ~20-50cm)
"""

import argparse
import base64
import socket
import os
import threading
import time
import serial
import serial.tools.list_ports

# ── NTRIP credentials ─────────────────────────────────────────────────
NTRIP_HOST     = "virtualrtk.pointonenav.com"
NTRIP_PORT     = 2101
NTRIP_MOUNTPT  = "AUTO"
NTRIP_USER     = os.getenv("NTRIP_USER")
NTRIP_PASS     = os.getenv("NTRIP_PASS")

# ── Serial defaults ───────────────────────────────────────────────────
DEFAULT_BAUD   = 38400
BAUD_FALLBACKS = [38400, 115200, 9600, 57600]

FIX_QUALITY = {
    "0": "No fix",
    "1": "GPS",
    "2": "DGPS",
    "3": "PPS",
    "4": "RTK Fixed ✓",
    "5": "RTK Float ~",
    "6": "Estimated",
}


# ── NMEA command utilities ────────────────────────────────────────────

def nmea_checksum_calc(body: str) -> str:
    """Calculate NMEA checksum (XOR of all bytes in body)."""
    cs = 0
    for c in body:
        cs ^= ord(c)
    return f"{cs:02X}"


def send_nmea_command(ser: serial.Serial, body: str, verbose: bool = True) -> bool:
    """
    Send an NMEA command (e.g., PAIR062,1,10) to the antenna.
    Returns True if sent successfully.
    """
    cs = nmea_checksum_calc(body)
    cmd = f"${body}*{cs}\r\n"
    if verbose:
        print(f"[gnss] Sending: {cmd.strip()}")
    try:
        ser.write(cmd.encode())
        return True
    except Exception as e:
        print(f"[gnss] Failed to send command: {e}")
        return False


def set_update_rate(ser: serial.Serial, hz: int = 10) -> bool:
    """
    Set NMEA output rate using PAIR062 command.
    Supported rates: 1, 2, 5, 10 Hz
    """
    if hz not in (1, 2, 5, 10):
        print(f"[gnss] ERROR: unsupported rate {hz} Hz (use 1, 2, 5, or 10)")
        return False
    print(f"[gnss] Setting update rate to {hz} Hz...")
    time.sleep(0.2)  # brief pause before command
    success = send_nmea_command(ser, f"PAIR062,1,{hz}")
    time.sleep(0.5)  # wait for antenna to process
    return success


# ── Port detection ────────────────────────────────────────────────────

def find_gnss_port():
    """Auto-detect the antenna serial port."""
    candidates = []
    for p in serial.tools.list_ports.comports():
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        dev  = p.device
        # u-blox, FTDI, CH340, CP210x — typical USB-serial bridges
        if any(k in desc for k in ["u-blox", "ublox", "gnss", "gps", "ftdi"]):
            return dev
        if any(k in hwid for k in ["1546:", "0403:", "10c4:", "067b:", "1a86:"]):
            return dev
        if "usbserial" in dev or "usbmodem" in dev:
            candidates.append(dev)
    return candidates[0] if candidates else None


# ── NMEA parsing ──────────────────────────────────────────────────────

def nmea_checksum_ok(sentence: str) -> bool:
    """Validate NMEA checksum (XOR of bytes between $ and *)."""
    try:
        if "*" not in sentence:
            return False
        body, cs = sentence[1:].rsplit("*", 1)
        calc = 0
        for c in body:
            calc ^= ord(c)
        return calc == int(cs.strip(), 16)
    except Exception:
        return False


def parse_gga(fields) -> dict | None:
    """Parse GPGGA/GNGGA sentence."""
    if len(fields) < 15:
        return None
    try:
        raw_lat = fields[2]; lat_hem = fields[3]
        raw_lon = fields[4]; lon_hem = fields[5]
        fix_q   = fields[6]
        sats    = fields[7]
        hdop    = fields[8]
        alt     = fields[9]

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

        lat = dms2dd(raw_lat, lat_hem)
        lon = dms2dd(raw_lon, lon_hem)
        return {
            "lat":  lat,
            "lon":  lon,
            "fix":  fix_q,
            "sats": sats,
            "hdop": hdop,
            "alt":  alt,
        }
    except Exception:
        return None


def parse_rmc(fields) -> dict | None:
    """Parse GPRMC/GNRMC — speed and course."""
    if len(fields) < 9:
        return None
    try:
        status = fields[2]   # A=active, V=void
        speed_kn = float(fields[7]) if fields[7] else 0.0
        course   = float(fields[8]) if fields[8] else 0.0
        return {
            "status":    status,
            "speed_kn":  speed_kn,
            "speed_kmh": speed_kn * 1.852,
            "course":    course,
        }
    except Exception:
        return None


def make_gga_approx(lat=48.8566, lon=2.3522) -> bytes:
    """
    Build a minimal GGA sentence with an approximate position.
    Used to send to the NTRIP caster so it can select the nearest base.
    Default coords = Paris area (change if far from France).
    """
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
    sentence = f"${body}*{cs:02X}\r\n"
    return sentence.encode()


# ── NTRIP client ──────────────────────────────────────────────────────

class NtripClient:
    """
    Connects to the NTRIP caster, sends RTCM3 corrections to a serial port.
    Runs in a background thread.
    """

    def __init__(self, ser: serial.Serial, approx_lat=48.8566, approx_lon=2.3522):
        self.ser       = ser
        self.lat       = approx_lat
        self.lon       = approx_lon
        self._stop     = threading.Event()
        self._thread   = threading.Thread(target=self._run, daemon=True, name="ntrip")
        self.connected = False
        self.bytes_in  = 0

    def start(self):
        self._thread.start()

    def stop(self):
        self._stop.set()

    def update_position(self, lat, lon):
        """Call once we have a real fix to improve caster selection."""
        self.lat = lat
        self.lon = lon

    def _run(self):
        while not self._stop.is_set():
            try:
                self._connect_and_stream()
            except Exception as e:
                print(f"[ntrip] Error: {e} — retrying in 5s")
            if not self._stop.is_set():
                time.sleep(5)

    def _connect_and_stream(self):
        credentials = base64.b64encode(f"{NTRIP_USER}:{NTRIP_PASS}".encode()).decode()
        request = (
            f"GET /{NTRIP_MOUNTPT} HTTP/1.0\r\n"
            f"Host: {NTRIP_HOST}:{NTRIP_PORT}\r\n"
            f"Ntrip-Version: Ntrip/2.0\r\n"
            f"User-Agent: NTRIP MoKartClient/1.0\r\n"
            f"Authorization: Basic {credentials}\r\n"
            f"Connection: close\r\n\r\n"
        )

        print(f"[ntrip] Connecting to {NTRIP_HOST}:{NTRIP_PORT}/{NTRIP_MOUNTPT}...")
        sock = socket.create_connection((NTRIP_HOST, NTRIP_PORT), timeout=10)
        sock.sendall(request.encode())

        # Read HTTP response header
        header = b""
        while b"\r\n\r\n" not in header:
            chunk = sock.recv(256)
            if not chunk:
                raise ConnectionError("NTRIP: connection closed during header")
            header += chunk
        header_str = header.decode(errors="replace").split("\r\n\r\n")[0]
        first_line  = header_str.split("\r\n")[0]
        if "200" not in first_line and "ICY 200" not in first_line:
            raise ConnectionError(f"NTRIP rejected: {first_line}")

        print(f"[ntrip] Connected — streaming RTCM3 corrections")
        self.connected = True

        # Send initial approximate GGA so caster knows our location
        gga = make_gga_approx(self.lat, self.lon)
        sock.sendall(gga)

        # Leftover bytes after header
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
                # Resend GGA every 30s so caster keeps us associated
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


# ── Main reader loop ──────────────────────────────────────────────────

def config_loop(port: str, baud: int, hz: int):
    """Configure the antenna update rate (one-shot), then exit."""
    print(f"[gnss] Opening {port} at {baud} baud for configuration...")
    try:
        ser = serial.Serial(port, baud, timeout=1)
        time.sleep(0.5)
        ser.reset_input_buffer()

        if set_update_rate(ser, hz):
            print(f"[gnss] ✓ Update rate set to {hz} Hz")
            print("[gnss] Configuration saved to antenna memory")
            print("[gnss] You can now run the script in normal mode")
        else:
            print(f"[gnss] ✗ Failed to set rate")

        ser.close()
    except Exception as e:
        print(f"[gnss] ERROR: {e}")


def read_loop(port: str, baud: int, use_ntrip: bool, debug: bool = False):
    print(f"[gnss] Opening {port} at {baud} baud...")
    ser = serial.Serial(port, baud, timeout=1)
    time.sleep(0.5)
    ser.reset_input_buffer()

    ntrip = None
    if use_ntrip:
        if NTRIP_PASS == "PASTE_YOUR_PASSWORD_HERE":
            print("[ntrip] WARNING: password not set in script — NTRIP disabled")
            use_ntrip = False
        else:
            ntrip = NtripClient(ser)
            ntrip.start()

    print("[gnss] Reading NMEA sentences — Ctrl+C to stop\n")
    buf = b""
    last_fix = {}

    try:
        while True:
            chunk = ser.read(ser.in_waiting or 1)
            if not chunk:
                continue
            buf += chunk

            # Process all complete lines
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                sentence = line.decode(errors="replace").strip()
                if not sentence.startswith("$"):
                    continue

                # Debug: print raw sentence before any filtering
                if debug:
                    cs_ok = nmea_checksum_ok(sentence)
                    print(f"  RAW [{'+' if cs_ok else 'BAD CS'}] {sentence}")
                    if not cs_ok:
                        continue
                elif not nmea_checksum_ok(sentence):
                    continue

                fields = sentence.split(",")
                msg_type = fields[0][1:]  # e.g. "GNGGA", "GPGGA"

                if msg_type in ("GPGGA", "GNGGA", "GAGGA", "GLGGA", "GBGGA"):
                    gga = parse_gga(fields)
                    if gga:
                        fix_label = FIX_QUALITY.get(gga["fix"], f"?({gga['fix']})")
                        if gga["lat"] is not None:
                            print(
                                f"\n  GGA  lat={gga['lat']:+.7f}  lon={gga['lon']:+.7f}"
                                f"  alt={gga['alt']}m  sats={gga['sats']}"
                                f"  hdop={gga['hdop']}  fix={fix_label}"
                            )
                            if ntrip:
                                ntrip.update_position(gga["lat"], gga["lon"])
                            last_fix = gga
                        else:
                            # No fix yet — show waiting status
                            ntrip_ok = ntrip and ntrip.connected
                            print(
                                f"\r  Waiting for fix... sats={gga['sats']}  fix={fix_label}"
                                f"  ntrip={'OK' if ntrip_ok else 'connecting'}   ",
                                end="", flush=True
                            )

                elif msg_type in ("GPRMC", "GNRMC", "GLRMC", "GARMC"):
                    rmc = parse_rmc(fields)
                    if rmc and rmc["status"] == "A":
                        print(
                            f"\n  RMC  speed={rmc['speed_kmh']:.1f} km/h"
                            f"  course={rmc['course']:.1f}°"
                        )

                elif msg_type.endswith("GSV") or msg_type.endswith("GSA"):
                    pass  # satellite details — verbose, skip by default

                else:
                    if debug:
                        pass  # already printed above
                    # else uncomment to see unhandled sentences:
                    # print(f"  {sentence}")

            if ntrip and not debug:
                status = "OK" if ntrip.connected else "CONNECTING"
                print(f"\r[ntrip {status} | {ntrip.bytes_in} bytes in]", end="", flush=True)

    except KeyboardInterrupt:
        print("\n\nStopped.")
    finally:
        if ntrip:
            ntrip.stop()
        ser.close()


# ── Entry point ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Point One RTK Smart Antenna reader")
    parser.add_argument("-p", "--port",     help="Serial port (auto-detect if omitted)")
    parser.add_argument("-b", "--baud",     type=int, default=DEFAULT_BAUD,
                        help=f"Baud rate (default: {DEFAULT_BAUD})")
    parser.add_argument("--no-ntrip",       action="store_true",
                        help="Disable NTRIP corrections (NMEA only)")
    parser.add_argument("--list-ports",     action="store_true")
    parser.add_argument("--debug",          action="store_true",
                        help="Print all raw NMEA sentences (for troubleshooting)")
    parser.add_argument("--set-rate",       type=int, metavar="HZ",
                        help="Configure antenna update rate (1, 2, 5, or 10 Hz) — one-shot config, then exit")
    args = parser.parse_args()

    if args.list_ports:
        for p in serial.tools.list_ports.comports():
            print(f"  {p.device}  {p.description}  [{p.hwid}]")
        return

    port = args.port or find_gnss_port()
    if not port:
        print("ERROR: No GNSS port found. Use --list-ports then -p <port>")
        return

    if not args.port:
        print(f"[gnss] Auto-detected port: {port}")

    # Try the requested baud, fallback if no data in 3s
    baud = args.baud
    if baud not in BAUD_FALLBACKS:
        BAUD_FALLBACKS.insert(0, baud)

    for b in BAUD_FALLBACKS:
        print(f"[gnss] Trying {b} baud...")
        try:
            ser = serial.Serial(port, b, timeout=3)
            data = ser.read(128)
            ser.close()
            if b"$" in data:
                print(f"[gnss] Got NMEA at {b} baud")
                baud = b
                break
            print(f"[gnss] No NMEA at {b} baud")
        except Exception as e:
            print(f"[gnss] {b} baud failed: {e}")
    else:
        print("WARNING: Could not confirm NMEA at any baud — using default")

    # Handle one-shot configuration mode
    if args.set_rate:
        config_loop(port, baud, args.set_rate)
        return

    read_loop(port, baud, use_ntrip=not args.no_ntrip, debug=args.debug)


if __name__ == "__main__":
    main()
