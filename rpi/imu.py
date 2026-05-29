#!/usr/bin/env python3
"""
Packet format (11 bytes each):
  [0x55] [TYPE] [D0L] [D0H] [D1L] [D1H] [D2L] [D2H] [D3L] [D3H] [SUM]

Types:
  0x51 = Acceleration  (ax, ay, az, temperature)
  0x52 = Gyroscope     (wx, wy, wz, temperature)
  0x53 = Angle         (roll, pitch, yaw, version)
  0x54 = Magnetic      (mx, my, mz, temperature)

Checksum: sum of all bytes [0..9] & 0xFF
"""

import serial
import serial.tools.list_ports
import struct
import sys
import time
import argparse
import math
import threading
from collections import deque

import matplotlib
matplotlib.use("TkAgg")
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.animation import FuncAnimation

HEADER     = 0x55
TYPE_ACC   = 0x51
TYPE_GYRO  = 0x52
TYPE_ANGLE = 0x53
TYPE_MAG   = 0x54

ACC_SCALE   = 16.0 / 32768.0    # raw -> g
GYRO_SCALE  = 2000.0 / 32768.0  # raw -> deg/s
ANGLE_SCALE = 180.0 / 32768.0   # raw -> degrees
MAG_SCALE   = 1.0               # raw -> uT
TEMP_SCALE  = 1.0 / 100.0       # raw -> Celsius

CMD_RATE_200HZ  = bytes([0xFF, 0xAA, 0x03, 0x0B, 0x00])
CMD_BAUD_115200 = bytes([0xFF, 0xAA, 0x04, 0x06, 0x00])
CMD_SAVE        = bytes([0xFF, 0xAA, 0x00, 0x00, 0x00])

BUFFER_SIZE = 2000  # 10s at 200Hz


class IMUCalibration:
    def __init__(self):
        self.acc_offset   = [0.0, 0.0, 0.0]
        self.gyro_offset  = [0.0, 0.0, 0.0]
        self.angle_offset = [0.0, 0.0, 0.0]
        self.mag_offset   = [0.0, 0.0, 0.0]
        self.calibrated   = False


class IMUData:
    def __init__(self):
        self.acc         = [0.0, 0.0, 0.0]  # g
        self.gyro        = [0.0, 0.0, 0.0]  # deg/s
        self.angle       = [0.0, 0.0, 0.0]  # deg: roll, pitch, yaw
        self.mag         = [0.0, 0.0, 0.0]  # uT
        self.temperature = 0.0               # Celsius
        self.timestamp   = 0.0

    def to_csv_row(self):
        return (
            f"{self.timestamp:.4f},"
            f"{self.acc[0]:.5f},{self.acc[1]:.5f},{self.acc[2]:.5f},"
            f"{self.gyro[0]:.4f},{self.gyro[1]:.4f},{self.gyro[2]:.4f},"
            f"{self.angle[0]:.4f},{self.angle[1]:.4f},{self.angle[2]:.4f},"
            f"{self.mag[0]:.2f},{self.mag[1]:.2f},{self.mag[2]:.2f},"
            f"{self.temperature:.2f}"
        )

    @staticmethod
    def csv_header():
        return "timestamp,ax,ay,az,gx,gy,gz,roll,pitch,yaw,mx,my,mz,temp"


def find_imu_port():
    ports = serial.tools.list_ports.comports()
    for p in ports:
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        if any(k in desc for k in ["cp210", "cp2102", "silicon labs", "uart", "ch340", "ch341", "ftdi"]):
            return p.device
        if any(k in hwid for k in ["10c4:ea60", "cp210", "1a86:7523", "0403:6001"]):
            return p.device
        if any(k in p.device for k in ["ttyUSB", "ttyACM", "usbserial", "usbmodem"]):
            return p.device
    print("Available ports:")
    for p in ports:
        print(f"  {p.device} - {p.description} [{p.hwid}]")
    return None


def verify_checksum(packet: bytes) -> bool:
    return sum(packet[:10]) & 0xFF == packet[10]


def parse_packet(packet: bytes, imu: IMUData) -> str | None:
    if len(packet) != 11 or packet[0] != HEADER:
        return None
    if not verify_checksum(packet):
        return None
    ptype = packet[1]
    d0, d1, d2, d3 = struct.unpack("<hhhh", packet[2:10])
    if ptype == TYPE_ACC:
        imu.acc = [d0 * ACC_SCALE, d1 * ACC_SCALE, d2 * ACC_SCALE]
        imu.temperature = d3 * TEMP_SCALE
        imu.timestamp = time.time()
        return "acc"
    elif ptype == TYPE_GYRO:
        imu.gyro = [d0 * GYRO_SCALE, d1 * GYRO_SCALE, d2 * GYRO_SCALE]
        imu.temperature = d3 * TEMP_SCALE
        return "gyro"
    elif ptype == TYPE_ANGLE:
        imu.angle = [d0 * ANGLE_SCALE, d1 * ANGLE_SCALE, d2 * ANGLE_SCALE]
        return "angle"
    elif ptype == TYPE_MAG:
        imu.mag = [d0 * MAG_SCALE, d1 * MAG_SCALE, d2 * MAG_SCALE]
        imu.temperature = d3 * TEMP_SCALE
        return "mag"
    return None


def process_buffer(buf: bytearray, imu: IMUData):
    parsed = []
    while len(buf) >= 11:
        try:
            idx = buf.index(HEADER)
        except ValueError:
            buf.clear()
            break
        if idx > 0:
            buf = buf[idx:]
        if len(buf) < 11:
            break
        if buf[1] not in (TYPE_ACC, TYPE_GYRO, TYPE_ANGLE, TYPE_MAG):
            buf.pop(0)
            continue
        packet = bytes(buf[:11])
        buf = buf[11:]
        result = parse_packet(packet, imu)
        if result:
            parsed.append(result)
    return buf, parsed


def calibrate(ser: serial.Serial, duration: float = 3.0) -> IMUCalibration:
    cal = IMUCalibration()
    imu = IMUData()
    buf = bytearray()
    acc_s, gyro_s, angle_s, mag_s = [], [], [], []

    print(f"Calibrating... keep IMU stationary ({duration:.0f}s)")
    t0 = time.time()
    while time.time() - t0 < duration:
        data = ser.read(ser.in_waiting or 1)
        if not data:
            continue
        buf.extend(data)
        buf, parsed = process_buffer(buf, imu)
        for p in parsed:
            if p == "acc":     acc_s.append(list(imu.acc))
            elif p == "gyro":  gyro_s.append(list(imu.gyro))
            elif p == "angle": angle_s.append(list(imu.angle))
            elif p == "mag":   mag_s.append(list(imu.mag))
        pct = min((time.time() - t0) / duration, 1.0)
        bar = "█" * int(pct * 30) + "░" * (30 - int(pct * 30))
        print(f"\r  [{bar}] {pct*100:.0f}%  ({len(angle_s)} samples @ ~{len(angle_s)/(time.time()-t0+1e-9):.0f}Hz)", end="", flush=True)
    print()

    if not angle_s:
        print("WARNING: No data received during calibration!")
        return cal

    def avg(samples):
        n = len(samples)
        return [sum(s[i] for s in samples) / n for i in range(3)]

    if acc_s:
        cal.acc_offset = avg(acc_s)
        cal.acc_offset[2] -= 1.0  # preserve 1g on Z
    if gyro_s:   cal.gyro_offset  = avg(gyro_s)
    if angle_s:  cal.angle_offset = avg(angle_s)
    if mag_s:    cal.mag_offset   = avg(mag_s)
    cal.calibrated = True

    print(f"  Done — {len(angle_s)} samples, ~{len(angle_s)/duration:.0f}Hz effective")
    print(f"  Acc   offset: {[f'{v:+.4f}' for v in cal.acc_offset]}")
    print(f"  Gyro  offset: {[f'{v:+.4f}' for v in cal.gyro_offset]}")
    print(f"  Angle offset: {[f'{v:+.2f}' for v in cal.angle_offset]}")
    return cal


def apply_calibration(imu: IMUData, cal: IMUCalibration):
    if not cal.calibrated:
        return
    for i in range(3):
        imu.acc[i]   -= cal.acc_offset[i]
        imu.gyro[i]  -= cal.gyro_offset[i]
        imu.angle[i] -= cal.angle_offset[i]
        imu.mag[i]   -= cal.mag_offset[i]


def configure_imu(port: str, current_baud: int = 9600):
    print(f"Connecting at {current_baud} baud to send configuration commands...")
    ser = serial.Serial(port, current_baud, timeout=1)
    time.sleep(1.0)
    ser.reset_input_buffer()
    ser.reset_output_buffer()

    for label, cmd in [
        ("output rate to 200Hz", CMD_RATE_200HZ),
        ("save rate config",     CMD_SAVE),
        ("baud rate to 115200",  CMD_BAUD_115200),
        ("save baud config",     CMD_SAVE),
    ]:
        print(f"  → Setting {label}...")
        ser.write(cmd)
        ser.flush()
        time.sleep(0.5)

    ser.close()
    print("Configuration sent.")
    print("→ UNPLUG and REPLUG the USB cable, then run:")
    print("  python imu.py --dashboard -b 115200\n")


class DashboardState:
    def __init__(self):
        self.lock      = threading.Lock()
        self.t         = deque(maxlen=BUFFER_SIZE)
        self.ax        = deque(maxlen=BUFFER_SIZE)
        self.ay        = deque(maxlen=BUFFER_SIZE)
        self.az        = deque(maxlen=BUFFER_SIZE)
        self.gx        = deque(maxlen=BUFFER_SIZE)
        self.gy        = deque(maxlen=BUFFER_SIZE)
        self.gz        = deque(maxlen=BUFFER_SIZE)
        self.roll      = deque(maxlen=BUFFER_SIZE)
        self.pitch     = deque(maxlen=BUFFER_SIZE)
        self.yaw       = deque(maxlen=BUFFER_SIZE)
        self.mx        = deque(maxlen=BUFFER_SIZE)
        self.my        = deque(maxlen=BUFFER_SIZE)
        self.mz        = deque(maxlen=BUFFER_SIZE)
        self.temp      = deque(maxlen=BUFFER_SIZE)
        self.g_total   = deque(maxlen=BUFFER_SIZE)
        self.gyro_mag  = deque(maxlen=BUFFER_SIZE)
        self.mag_total = deque(maxlen=BUFFER_SIZE)
        self.packet_count = 0
        self.rate_hz      = 0.0
        self._rate_buf    = deque(maxlen=200)

    def push(self, imu: IMUData):
        now = time.time()
        with self.lock:
            self.t.append(now)
            self.ax.append(imu.acc[0]);     self.ay.append(imu.acc[1]);    self.az.append(imu.acc[2])
            self.gx.append(imu.gyro[0]);    self.gy.append(imu.gyro[1]);   self.gz.append(imu.gyro[2])
            self.roll.append(imu.angle[0]); self.pitch.append(imu.angle[1]); self.yaw.append(imu.angle[2])
            self.mx.append(imu.mag[0]);     self.my.append(imu.mag[1]);    self.mz.append(imu.mag[2])
            self.temp.append(imu.temperature)
            self.g_total.append(math.sqrt(sum(v**2 for v in imu.acc)))
            self.gyro_mag.append(math.sqrt(sum(v**2 for v in imu.gyro)))
            self.mag_total.append(math.sqrt(sum(v**2 for v in imu.mag)))
            self.packet_count += 1
            self._rate_buf.append(now)
            if len(self._rate_buf) >= 2:
                dt = self._rate_buf[-1] - self._rate_buf[0]
                if dt > 0:
                    self.rate_hz = (len(self._rate_buf) - 1) / dt


def serial_reader_thread(ser, imu, cal, state: DashboardState, stop_event, log_file=None):
    buf = bytearray()
    csv_f = None
    if log_file:
        csv_f = open(log_file, "w")
        csv_f.write(IMUData.csv_header() + "\n")

    while not stop_event.is_set():
        try:
            raw = ser.read(ser.in_waiting or 1)
            if not raw:
                continue
            buf.extend(raw)
            buf, parsed = process_buffer(buf, imu)
            for result in parsed:
                if result == "angle":
                    apply_calibration(imu, cal)
                    state.push(imu)
                    if csv_f:
                        csv_f.write(imu.to_csv_row() + "\n")
                        csv_f.flush()
        except Exception:
            break

    if csv_f:
        csv_f.close()


DARK_BG    = "#0d1117"
PANEL_BG   = "#161b22"
GRID_COLOR = "#30363d"
TEXT_COLOR = "#e6edf3"

PANELS = [
    ("Accel X",     "ax",       "#58a6ff", "g"),
    ("Accel Y",     "ay",       "#3fb950", "g"),
    ("Accel Z",     "az",       "#f78166", "g"),
    ("Gyro X",      "gx",       "#d2a8ff", "°/s"),
    ("Gyro Y",      "gy",       "#ffa657", "°/s"),
    ("Gyro Z",      "gz",       "#79c0ff", "°/s"),
    ("Roll",        "roll",     "#58a6ff", "°"),
    ("Pitch",       "pitch",    "#3fb950", "°"),
    ("Yaw",         "yaw",      "#f78166", "°"),
    ("Mag X",       "mx",       "#d2a8ff", "uT"),
    ("Mag Y",       "my",       "#ffa657", "uT"),
    ("Mag Z",       "mz",       "#79c0ff", "uT"),
    ("|Acc| total", "g_total",  "#e3b341", "g"),
    ("|Gyro| mag",  "gyro_mag", "#ff7b72", "°/s"),
    ("Temperature", "temp",     "#56d364", "°C"),
]


def run_dashboard(ser, imu, cal, log_file=None):
    state = DashboardState()
    stop_event = threading.Event()

    threading.Thread(
        target=serial_reader_thread,
        args=(ser, imu, cal, state, stop_event, log_file),
        daemon=True,
    ).start()

    plt.style.use("dark_background")
    fig = plt.figure(figsize=(18, 11), facecolor=DARK_BG)
    fig.canvas.manager.set_window_title("IMU Dashboard — MoKart")

    outer = gridspec.GridSpec(
        2, 1, figure=fig,
        height_ratios=[1, 15],
        hspace=0.08,
        top=0.97, bottom=0.04, left=0.06, right=0.99,
    )
    header_ax = fig.add_subplot(outer[0])
    header_ax.set_facecolor(PANEL_BG)
    header_ax.set_xticks([]); header_ax.set_yticks([])
    for spine in header_ax.spines.values():
        spine.set_edgecolor(GRID_COLOR)

    stat_text = header_ax.text(
        0.5, 0.5, "", transform=header_ax.transAxes,
        ha="center", va="center", color=TEXT_COLOR,
        fontsize=11, fontfamily="monospace",
    )

    inner = gridspec.GridSpecFromSubplotSpec(
        5, 3, subplot_spec=outer[1],
        hspace=0.55, wspace=0.35,
    )

    axes, lines = [], []
    for i, (label, attr, color, unit) in enumerate(PANELS):
        row, col = divmod(i, 3)
        ax = fig.add_subplot(inner[row, col])
        ax.set_facecolor(PANEL_BG)
        ax.tick_params(colors=TEXT_COLOR, labelsize=7)
        ax.set_title(f"{label} ({unit})", color=TEXT_COLOR, fontsize=8, pad=3)
        ax.grid(True, color=GRID_COLOR, linewidth=0.4)
        for spine in ax.spines.values():
            spine.set_edgecolor(GRID_COLOR)
        line, = ax.plot([], [], color=color, linewidth=0.8, antialiased=True)
        axes.append(ax)
        lines.append((line, attr))

    def update(_frame):
        with state.lock:
            if len(state.t) < 2:
                return lines[0][0],
            t_arr = list(state.t)
            t_rel = [x - t_arr[0] for x in t_arr]
            t_win = t_rel[-1]
            for ax, (line, attr) in zip(axes, lines):
                y = list(getattr(state, attr))
                line.set_data(t_rel, y)
                ax.set_xlim(max(0, t_win - 10), t_win + 0.1)
                if y:
                    lo, hi = min(y), max(y)
                    pad = (hi - lo) * 0.15 or 0.05
                    ax.set_ylim(lo - pad, hi + pad)

            def last(d): return d[-1] if d else 0.0
            stat_text.set_text(
                f"  MoKart IMU  ●  "
                f"Acc [{last(state.ax):+.3f}, {last(state.ay):+.3f}, {last(state.az):+.3f}] g  |  "
                f"Gyro [{last(state.gx):+.1f}, {last(state.gy):+.1f}, {last(state.gz):+.1f}] °/s  |  "
                f"Angles [{last(state.roll):+.1f}, {last(state.pitch):+.1f}, {last(state.yaw):+.1f}] °  |  "
                f"|Acc|={last(state.g_total):.3f}g  |  "
                f"Temp={last(state.temp):.1f}°C  |  "
                f"{state.rate_hz:.1f} Hz  {state.packet_count} pkts"
            )
        return [l for l, _ in lines]

    FuncAnimation(fig, update, interval=33, blit=False, cache_frame_data=False)

    print("Dashboard running — close window or Ctrl+C to stop")
    try:
        plt.show()
    except KeyboardInterrupt:
        pass
    finally:
        stop_event.set()
        plt.close(fig)


def read_imu(port, baud, log_file, skip_cal, cal_duration):
    print(f"Connecting to {port} at {baud} baud...")
    ser = serial.Serial(port, baud, timeout=1)
    print("Connected!\n")

    cal = IMUCalibration()
    if not skip_cal:
        cal = calibrate(ser, cal_duration)

    imu = IMUData()
    buf = bytearray()
    csv_f = None
    if log_file:
        csv_f = open(log_file, "w")
        csv_f.write(IMUData.csv_header() + "\n")
        print(f"Logging to {log_file}")

    packet_count = 0
    start_time = time.time()
    print("\nReading IMU data... (Ctrl+C to stop)\n")

    try:
        while True:
            raw = ser.read(ser.in_waiting or 1)
            if not raw:
                continue
            buf.extend(raw)
            buf, parsed = process_buffer(buf, imu)
            for result in parsed:
                if result == "angle":
                    apply_calibration(imu, cal)
                    packet_count += 1
                    elapsed = time.time() - start_time
                    hz = packet_count / elapsed if elapsed > 0 else 0
                    g_tot = math.sqrt(sum(v**2 for v in imu.acc))
                    g_mag = math.sqrt(sum(v**2 for v in imu.gyro))
                    print("\033[2J\033[H")
                    print("═" * 62)
                    print("  MoKart IMU — Live Data")
                    if cal.calibrated: print("  [CALIBRATED]")
                    print("═" * 62)
                    print(f"  Acc   (g):  X={imu.acc[0]:+8.4f}  Y={imu.acc[1]:+8.4f}  Z={imu.acc[2]:+8.4f}   |acc|={g_tot:.4f}")
                    print(f"  Gyro(°/s):  X={imu.gyro[0]:+8.2f}  Y={imu.gyro[1]:+8.2f}  Z={imu.gyro[2]:+8.2f}   |gyro|={g_mag:.2f}")
                    print(f"  Angle (°):  R={imu.angle[0]:+8.2f}  P={imu.angle[1]:+8.2f}  Y={imu.angle[2]:+8.2f}")
                    print(f"  Mag  (uT):  X={imu.mag[0]:+8.1f}  Y={imu.mag[1]:+8.1f}  Z={imu.mag[2]:+8.1f}")
                    print(f"  Temp: {imu.temperature:.1f}°C")
                    print("─" * 62)
                    print(f"  Packets: {packet_count}   Rate: {hz:.1f} Hz")
                    print("═" * 62)
                    if csv_f:
                        csv_f.write(imu.to_csv_row() + "\n")
                        csv_f.flush()
    except KeyboardInterrupt:
        print("\n\nStopped.")
    finally:
        ser.close()
        if csv_f: csv_f.close()
        elapsed = time.time() - start_time
        if elapsed > 0:
            print(f"Total: {packet_count} packets in {elapsed:.1f}s ({packet_count/elapsed:.1f} pkt/s)")


def main():
    parser = argparse.ArgumentParser(
        description="MoKart IMU — WIT Motion / Hiwonder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  First time setup (configure IMU to 200Hz + 115200 baud):
    python imu.py --configure

  Live terminal at 9600 baud:
    python imu.py

  15-panel dashboard at 200Hz:
    python imu.py --dashboard -b 115200

  Log to CSV:
    python imu.py -l session.csv -b 115200
        """
    )
    parser.add_argument("-p", "--port",         help="Serial port (auto-detect if omitted)")
    parser.add_argument("-b", "--baud", type=int, default=9600,
                                                help="Baud rate (default: 9600, use 115200 for 200Hz)")
    parser.add_argument("-l", "--log",          help="Log data to CSV file")
    parser.add_argument("-c", "--cal-duration", type=float, default=3.0,
                                                help="Calibration duration in seconds (default: 3)")
    parser.add_argument("--no-cal",    action="store_true", help="Skip calibration")
    parser.add_argument("--configure", action="store_true",
                                                help="Send 200Hz+115200 config to IMU then exit")
    parser.add_argument("--dashboard", action="store_true", help="Launch 15-panel matplotlib dashboard")
    parser.add_argument("--list-ports",action="store_true", help="List serial ports and exit")
    args = parser.parse_args()

    if args.list_ports:
        for p in serial.tools.list_ports.comports():
            print(f"  {p.device} - {p.description} [{p.hwid}]")
        return

    port = args.port or find_imu_port()
    if not port:
        print("ERROR: Could not auto-detect IMU port. Use --list-ports then -p <port>")
        sys.exit(1)
    if not args.port:
        print(f"Auto-detected IMU on: {port}")

    if args.configure:
        configure_imu(port, current_baud=9600)
        return

    print(f"Connecting to {port} at {args.baud} baud...")
    ser = serial.Serial(port, args.baud, timeout=1)
    print("Connected!\n")

    cal = IMUCalibration()
    if not args.no_cal:
        cal = calibrate(ser, args.cal_duration)
        print()

    imu = IMUData()

    if args.dashboard:
        print("Starting 15-panel dashboard (close window or Ctrl+C to stop)\n")
        try:
            run_dashboard(ser, imu, cal, log_file=args.log)
        finally:
            ser.close()
    else:
        read_imu(port, args.baud, args.log, args.no_cal, args.cal_duration)


if __name__ == "__main__":
    main()
