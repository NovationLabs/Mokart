#!/usr/bin/env python3
"""
Hiwonder 10-axis IMU Module V1.0 - USB Reader for macOS
Protocol: WIT Motion (JY901B compatible)

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

# --- Packet types ---
HEADER = 0x55
TYPE_ACC   = 0x51
TYPE_GYRO  = 0x52
TYPE_ANGLE = 0x53
TYPE_MAG   = 0x54

# --- Conversion scales ---
ACC_SCALE   = 16.0 / 32768.0      # raw -> g
GYRO_SCALE  = 2000.0 / 32768.0    # raw -> deg/s
ANGLE_SCALE = 180.0 / 32768.0     # raw -> degrees
MAG_SCALE   = 1.0                  # raw -> uT (depends on config)
TEMP_SCALE  = 1.0 / 100.0         # raw -> Celsius


class IMUCalibration:
    """Stores calibration offsets captured at startup."""

    def __init__(self):
        self.acc_offset = [0.0, 0.0, 0.0]
        self.gyro_offset = [0.0, 0.0, 0.0]
        self.angle_offset = [0.0, 0.0, 0.0]
        self.mag_offset = [0.0, 0.0, 0.0]
        self.calibrated = False


class IMUData:
    """Stores the latest IMU readings."""

    def __init__(self):
        self.acc = [0.0, 0.0, 0.0]       # g
        self.gyro = [0.0, 0.0, 0.0]      # deg/s
        self.angle = [0.0, 0.0, 0.0]     # degrees (roll, pitch, yaw)
        self.mag = [0.0, 0.0, 0.0]       # uT
        self.temperature = 0.0            # Celsius
        self.timestamp = 0.0

    def __str__(self):
        return (
            f"Acc  (g):    X={self.acc[0]:+8.4f}  Y={self.acc[1]:+8.4f}  Z={self.acc[2]:+8.4f}\n"
            f"Gyro (d/s):  X={self.gyro[0]:+8.2f}  Y={self.gyro[1]:+8.2f}  Z={self.gyro[2]:+8.2f}\n"
            f"Angle (deg): R={self.angle[0]:+8.2f}  P={self.angle[1]:+8.2f}  Y={self.angle[2]:+8.2f}\n"
            f"Mag  (uT):   X={self.mag[0]:+8.1f}  Y={self.mag[1]:+8.1f}  Z={self.mag[2]:+8.1f}\n"
            f"Temp: {self.temperature:.1f} C"
        )

    def to_csv_row(self):
        return (
            f"{self.timestamp:.3f},"
            f"{self.acc[0]:.4f},{self.acc[1]:.4f},{self.acc[2]:.4f},"
            f"{self.gyro[0]:.4f},{self.gyro[1]:.4f},{self.gyro[2]:.4f},"
            f"{self.angle[0]:.4f},{self.angle[1]:.4f},{self.angle[2]:.4f},"
            f"{self.mag[0]:.2f},{self.mag[1]:.2f},{self.mag[2]:.2f},"
            f"{self.temperature:.2f}"
        )

    @staticmethod
    def csv_header():
        return "timestamp,ax,ay,az,gx,gy,gz,roll,pitch,yaw,mx,my,mz,temp"


def find_imu_port():
    """Auto-detect the IMU USB port on macOS (CP2102 chip)."""
    ports = serial.tools.list_ports.comports()
    candidates = []

    for p in ports:
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        # CP2102 identifiers
        if any(k in desc for k in ["cp210", "cp2102", "silicon labs", "uart"]):
            candidates.append(p.device)
        elif any(k in hwid for k in ["10c4:ea60", "cp210"]):  # Silicon Labs VID:PID
            candidates.append(p.device)
        elif "usbserial" in p.device or "usbmodem" in p.device:
            candidates.append(p.device)

    if candidates:
        return candidates[0]

    # Fallback: list all ports
    print("Available serial ports:")
    for p in ports:
        print(f"  {p.device} - {p.description} [{p.hwid}]")
    return None


def verify_checksum(packet: bytes) -> bool:
    """Verify packet checksum (sum of bytes 0..9, lower 8 bits)."""
    return sum(packet[:10]) & 0xFF == packet[10]


def parse_packet(packet: bytes, imu: IMUData) -> str | None:
    """
    Parse a single 11-byte packet and update IMUData.
    Returns the packet type name or None if invalid.
    """
    if len(packet) != 11:
        return None
    if packet[0] != HEADER:
        return None
    if not verify_checksum(packet):
        return None

    ptype = packet[1]
    # Unpack 4 signed 16-bit little-endian values from bytes 2-9
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
    """Process buffer and extract valid packets. Returns (updated_buf, parsed_types)."""
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
    """
    Capture IMU data for `duration` seconds and average it to compute offsets.
    The module must be stationary during this phase.
    """
    cal = IMUCalibration()
    imu = IMUData()
    buf = bytearray()

    acc_samples = []
    gyro_samples = []
    angle_samples = []
    mag_samples = []

    print(f"Calibrating... keep the IMU stationary ({duration:.0f}s)")
    cal_start = time.time()

    while time.time() - cal_start < duration:
        incoming = ser.read(ser.in_waiting or 1)
        if not incoming:
            continue
        buf.extend(incoming)
        buf, parsed = process_buffer(buf, imu)

        for p in parsed:
            if p == "acc":
                acc_samples.append(list(imu.acc))
            elif p == "gyro":
                gyro_samples.append(list(imu.gyro))
            elif p == "angle":
                angle_samples.append(list(imu.angle))
            elif p == "mag":
                mag_samples.append(list(imu.mag))

        # Progress bar
        elapsed = time.time() - cal_start
        pct = min(elapsed / duration, 1.0)
        bar = "#" * int(pct * 30) + "-" * (30 - int(pct * 30))
        print(f"\r  [{bar}] {pct*100:.0f}%  ({len(angle_samples)} samples)", end="", flush=True)

    print()

    if not angle_samples:
        print("WARNING: No data received during calibration!")
        return cal

    def avg(samples):
        n = len(samples)
        return [sum(s[i] for s in samples) / n for i in range(3)]

    if acc_samples:
        cal.acc_offset = avg(acc_samples)
        # Keep gravity on Z: offset only removes the bias, not gravity
        # At rest flat: acc ~= [0, 0, 1g], so we keep Z offset relative to 1g
        cal.acc_offset[2] -= 1.0  # Preserve 1g on Z-axis

    if gyro_samples:
        cal.gyro_offset = avg(gyro_samples)

    if angle_samples:
        cal.angle_offset = avg(angle_samples)

    if mag_samples:
        cal.mag_offset = avg(mag_samples)

    cal.calibrated = True

    print(f"  Calibration done ({len(angle_samples)} samples)")
    print(f"  Acc  offset: X={cal.acc_offset[0]:+.4f}  Y={cal.acc_offset[1]:+.4f}  Z={cal.acc_offset[2]:+.4f}")
    print(f"  Gyro offset: X={cal.gyro_offset[0]:+.4f}  Y={cal.gyro_offset[1]:+.4f}  Z={cal.gyro_offset[2]:+.4f}")
    print(f"  Angle offset: R={cal.angle_offset[0]:+.2f}  P={cal.angle_offset[1]:+.2f}  Y={cal.angle_offset[2]:+.2f}")
    print(f"  Mag  offset: X={cal.mag_offset[0]:+.2f}  Y={cal.mag_offset[1]:+.2f}  Z={cal.mag_offset[2]:+.2f}")

    return cal


def apply_calibration(imu: IMUData, cal: IMUCalibration):
    """Subtract calibration offsets from current IMU data."""
    if not cal.calibrated:
        return
    for i in range(3):
        imu.acc[i] -= cal.acc_offset[i]
        imu.gyro[i] -= cal.gyro_offset[i]
        imu.angle[i] -= cal.angle_offset[i]
        imu.mag[i] -= cal.mag_offset[i]


def read_imu(port: str, baud: int = 9600, log_file: str | None = None,
             raw: bool = False, cal_duration: float = 3.0, skip_cal: bool = False):
    """
    Main loop: calibrate then read and parse IMU data from USB serial.

    Args:
        port: Serial port path (e.g. /dev/tty.usbserial-0001)
        baud: Baud rate (default 9600, must match IMU config)
        log_file: Optional CSV file path for logging
        raw: If True, print every packet; otherwise clear-screen display
        cal_duration: Calibration duration in seconds
        skip_cal: Skip calibration phase
    """
    print(f"Connecting to {port} at {baud} baud...")
    ser = serial.Serial(port, baud, timeout=1)
    print("Connected!\n")

    # --- Calibration phase ---
    if skip_cal:
        cal = IMUCalibration()
        print("Calibration skipped.")
    else:
        cal = calibrate(ser, cal_duration)

    print("\nReading IMU data... (Ctrl+C to stop)\n")

    imu = IMUData()
    csv_file = None

    if log_file:
        csv_file = open(log_file, "w")
        csv_file.write(IMUData.csv_header() + "\n")
        print(f"Logging to {log_file}")

    buf = bytearray()
    packet_count = 0
    error_count = 0
    start_time = time.time()

    try:
        while True:
            incoming = ser.read(ser.in_waiting or 1)
            if not incoming:
                continue

            buf.extend(incoming)
            buf, parsed = process_buffer(buf, imu)

            for result in parsed:
                packet_count += 1

                if result == "angle":
                    apply_calibration(imu, cal)

                    if raw:
                        print(imu.to_csv_row())
                    else:
                        elapsed = time.time() - start_time
                        hz = packet_count / elapsed if elapsed > 0 else 0
                        print(f"\033[2J\033[H")  # Clear screen
                        print("=" * 55)
                        print("  HIWONDER IMU MODULE V1.0 - Live Data")
                        if cal.calibrated:
                            print("  [CALIBRATED]")
                        print("=" * 55)
                        print(imu)
                        print("-" * 55)
                        print(f"Packets: {packet_count}  Errors: {error_count}  Rate: {hz:.1f} pkt/s")
                        if log_file:
                            print(f"Logging to: {log_file}")
                        print("=" * 55)

                    if csv_file:
                        csv_file.write(imu.to_csv_row() + "\n")
                        csv_file.flush()

    except KeyboardInterrupt:
        print("\n\nStopped.")
    finally:
        ser.close()
        if csv_file:
            csv_file.close()
        elapsed = time.time() - start_time
        print(f"Total: {packet_count} packets in {elapsed:.1f}s ({packet_count / elapsed:.1f} pkt/s)")


def main():
    parser = argparse.ArgumentParser(description="Hiwonder IMU Module V1.0 - USB Reader")
    parser.add_argument("-p", "--port", help="Serial port (auto-detect if omitted)")
    parser.add_argument("-b", "--baud", type=int, default=9600, help="Baud rate (default: 9600)")
    parser.add_argument("-l", "--log", help="Log data to CSV file")
    parser.add_argument("-c", "--cal-duration", type=float, default=3.0,
                        help="Calibration duration in seconds (default: 3)")
    parser.add_argument("--no-cal", action="store_true", help="Skip calibration phase")
    parser.add_argument("--raw", action="store_true", help="Raw CSV output mode (no clear screen)")
    parser.add_argument("--list-ports", action="store_true", help="List available serial ports and exit")
    args = parser.parse_args()

    if args.list_ports:
        ports = serial.tools.list_ports.comports()
        if not ports:
            print("No serial ports found.")
        for p in ports:
            print(f"  {p.device} - {p.description} [{p.hwid}]")
        return

    port = args.port
    if not port:
        port = find_imu_port()
        if not port:
            print("ERROR: Could not auto-detect IMU port.")
            print("Use --list-ports to see available ports, then specify with -p")
            sys.exit(1)
        print(f"Auto-detected IMU on: {port}")

    read_imu(port, args.baud, args.log, args.raw, args.cal_duration, args.no_cal)


if __name__ == "__main__":
    main()
