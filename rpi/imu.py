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
import math
import threading

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


def rotation_matrix(roll_deg, pitch_deg, yaw_deg):
    """Build a 3x3 rotation matrix from euler angles (degrees)."""
    r = math.radians(roll_deg)
    p = math.radians(pitch_deg)
    y = math.radians(yaw_deg)

    cr, sr = math.cos(r), math.sin(r)
    cp, sp = math.cos(p), math.sin(p)
    cy, sy = math.cos(y), math.sin(y)

    # ZYX rotation order
    return [
        [cy*cp,  cy*sp*sr - sy*cr,  cy*sp*cr + sy*sr],
        [sy*cp,  sy*sp*sr + cy*cr,  sy*sp*cr - cy*sr],
        [-sp,    cp*sr,             cp*cr            ],
    ]


def rotate_point(point, mat):
    """Apply rotation matrix to a 3D point."""
    return [
        mat[0][0]*point[0] + mat[0][1]*point[1] + mat[0][2]*point[2],
        mat[1][0]*point[0] + mat[1][1]*point[1] + mat[1][2]*point[2],
        mat[2][0]*point[0] + mat[2][1]*point[1] + mat[2][2]*point[2],
    ]


class TrajectoryState:
    """Tracks position via double integration of world-frame acceleration."""

    GRAVITY = 9.81  # m/s^2

    def __init__(self):
        self.reset()

    def reset(self):
        self.vel = [0.0, 0.0, 0.0]       # m/s in world frame
        self.pos = [0.0, 0.0, 0.0]       # m in world frame
        self.trail = []                    # list of (x, y, z) positions
        self.last_time = None
        self.max_trail = 500

    def update(self, imu: IMUData):
        """Integrate acceleration (body frame -> world frame) to update position."""
        now = time.time()
        if self.last_time is None:
            self.last_time = now
            return

        dt = now - self.last_time
        self.last_time = now

        if dt <= 0 or dt > 0.5:  # skip bad dt
            return

        # Rotate body-frame acceleration to world frame
        roll, pitch, yaw = imu.angle
        mat = rotation_matrix(roll, pitch, yaw)
        acc_body = [a * self.GRAVITY for a in imu.acc]  # g -> m/s^2
        acc_world = rotate_point(acc_body, mat)

        # Remove gravity (world Z points up)
        acc_world[2] -= self.GRAVITY

        # Dead zone: ignore small accelerations (noise)
        for i in range(3):
            if abs(acc_world[i]) < 0.3:
                acc_world[i] = 0.0

        # Integrate: acc -> velocity -> position
        for i in range(3):
            self.vel[i] += acc_world[i] * dt
            self.pos[i] += self.vel[i] * dt

        # Velocity decay to fight drift (light damping)
        for i in range(3):
            self.vel[i] *= 0.98

        self.trail.append(tuple(self.pos))
        if len(self.trail) > self.max_trail:
            self.trail.pop(0)


def serial_reader_thread(ser, imu, cal, traj, stop_event):
    """Background thread that reads serial data, applies calibration, and updates trajectory."""
    buf = bytearray()
    while not stop_event.is_set():
        try:
            incoming = ser.read(ser.in_waiting or 1)
            if not incoming:
                continue
            buf.extend(incoming)
            buf, parsed = process_buffer(buf, imu)
            for result in parsed:
                if result == "angle":
                    apply_calibration(imu, cal)
                    traj.update(imu)
        except Exception:
            break


def run_3d_viz(ser, imu, cal, mode="orientation"):
    """
    Launch a matplotlib 3D visualization.
    mode: "orientation" = rotation only, "trajectory" = moving in space
    """
    import matplotlib
    matplotlib.use("TkAgg")
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d.art3d import Poly3DCollection

    # Box dimensions (kart-like proportions)
    lx, ly, lz = 1.6, 0.8, 0.3
    hx, hy, hz = lx/2, ly/2, lz/2

    # Scale down the box for trajectory mode so it fits in the scene
    if mode == "trajectory":
        scale = 0.3
        hx, hy, hz = hx * scale, hy * scale, hz * scale

    base_vertices = [
        [-hx, -hy, -hz], [ hx, -hy, -hz], [ hx,  hy, -hz], [-hx,  hy, -hz],
        [-hx, -hy,  hz], [ hx, -hy,  hz], [ hx,  hy,  hz], [-hx,  hy,  hz],
    ]

    faces_idx = [
        [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
        [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5],
    ]

    face_colors = [
        (0.2, 0.2, 0.2, 0.7), (0.1, 0.6, 0.9, 0.7), (0.9, 0.2, 0.2, 0.7),
        (0.4, 0.4, 0.4, 0.5), (0.3, 0.3, 0.3, 0.5), (0.3, 0.3, 0.3, 0.5),
    ]

    arrow_len = 0.5 if mode == "orientation" else 0.2

    traj = TrajectoryState()
    reset_flag = [False]

    def on_key(event):
        if event.key == "r":
            reset_flag[0] = True

    stop_event = threading.Event()
    reader = threading.Thread(
        target=serial_reader_thread,
        args=(ser, imu, cal, traj, stop_event),
        daemon=True,
    )
    reader.start()

    fig = plt.figure(figsize=(11, 8))
    title = "IMU 3D Trajectory" if mode == "trajectory" else "IMU 3D Visualizer"
    fig.canvas.manager.set_window_title(title)
    fig.canvas.mpl_connect("key_press_event", on_key)
    ax = fig.add_subplot(111, projection="3d")

    try:
        while plt.fignum_exists(fig.number):
            # Handle reset
            if reset_flag[0]:
                traj.reset()
                reset_flag[0] = False

            ax.cla()

            roll, pitch, yaw = imu.angle
            mat = rotation_matrix(roll, pitch, yaw)

            if mode == "trajectory":
                cx, cy, cz = traj.pos
            else:
                cx, cy, cz = 0.0, 0.0, 0.0

            # Rotate and translate vertices
            rotated = []
            for v in base_vertices:
                rv = rotate_point(v, mat)
                rotated.append([rv[0] + cx, rv[1] + cy, rv[2] + cz])

            polys = [[rotated[i] for i in face] for face in faces_idx]
            ax.add_collection3d(Poly3DCollection(
                polys, facecolors=face_colors, edgecolors="black", linewidths=0.8
            ))

            # Axes arrows on the box
            for axis_dir, color, label in [
                ([arrow_len, 0, 0], "red", "X"),
                ([0, arrow_len, 0], "green", "Y"),
                ([0, 0, arrow_len], "blue", "Z"),
            ]:
                tip = rotate_point(axis_dir, mat)
                ax.plot(
                    [cx, cx + tip[0]], [cy, cy + tip[1]], [cz, cz + tip[2]],
                    color=color, linewidth=2,
                )
                ax.text(
                    cx + tip[0] * 1.15, cy + tip[1] * 1.15, cz + tip[2] * 1.15,
                    label, color=color, fontsize=9, fontweight="bold",
                )

            # Front indicator
            front_pt = rotate_point([hx + 0.05, 0, 0], mat)
            ax.scatter(cx + front_pt[0], cy + front_pt[1], cz + front_pt[2],
                       color="red", s=30, zorder=5)

            if mode == "trajectory":
                # Draw trail
                if len(traj.trail) > 1:
                    tx = [p[0] for p in traj.trail]
                    ty = [p[1] for p in traj.trail]
                    tz = [p[2] for p in traj.trail]
                    ax.plot(tx, ty, tz, color="dodgerblue", linewidth=1.5, alpha=0.7)
                    # Start point
                    ax.scatter(tx[0], ty[0], tz[0], color="green", s=50, marker="o", zorder=5)

                # Draw ground grid
                grid_size = 3.0
                for g in [-3, -2, -1, 0, 1, 2, 3]:
                    ax.plot([-grid_size, grid_size], [g, g], [0, 0],
                            color="gray", linewidth=0.3, alpha=0.3)
                    ax.plot([g, g], [-grid_size, grid_size], [0, 0],
                            color="gray", linewidth=0.3, alpha=0.3)

                # Dynamic limits centered on position
                margin = 3.0
                ax.set_xlim([cx - margin, cx + margin])
                ax.set_ylim([cy - margin, cy + margin])
                ax.set_zlim([min(cz - margin, -0.5), cz + margin])

                speed = math.sqrt(sum(v ** 2 for v in traj.vel))
                dist = math.sqrt(sum(p ** 2 for p in traj.pos))

                ax.set_title(
                    f"Roll: {roll:+.1f}   Pitch: {pitch:+.1f}   Yaw: {yaw:+.1f}\n"
                    f"Pos: [{cx:+.2f}, {cy:+.2f}, {cz:+.2f}] m   "
                    f"Speed: {speed:.2f} m/s   Dist: {dist:.2f} m\n"
                    f"[R] Reset trajectory",
                    fontsize=9, fontfamily="monospace",
                )
            else:
                limit = 1.2
                ax.set_xlim([-limit, limit])
                ax.set_ylim([-limit, limit])
                ax.set_zlim([-limit, limit])
                ax.set_title(
                    f"Roll: {roll:+.1f}   Pitch: {pitch:+.1f}   Yaw: {yaw:+.1f}\n"
                    f"Acc: [{imu.acc[0]:+.2f}, {imu.acc[1]:+.2f}, {imu.acc[2]:+.2f}] g   "
                    f"Gyro: [{imu.gyro[0]:+.1f}, {imu.gyro[1]:+.1f}, {imu.gyro[2]:+.1f}] d/s",
                    fontsize=10, fontfamily="monospace",
                )

            ax.set_xlabel("X")
            ax.set_ylabel("Y")
            ax.set_zlabel("Z")
            ax.set_box_aspect([1, 1, 1])

            plt.pause(0.03)

    except KeyboardInterrupt:
        pass
    finally:
        stop_event.set()
        plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description="Hiwonder IMU Module V1.0 - USB Reader")
    parser.add_argument("-p", "--port", help="Serial port (auto-detect if omitted)")
    parser.add_argument("-b", "--baud", type=int, default=9600, help="Baud rate (default: 9600)")
    parser.add_argument("-l", "--log", help="Log data to CSV file")
    parser.add_argument("-c", "--cal-duration", type=float, default=3.0,
                        help="Calibration duration in seconds (default: 3)")
    parser.add_argument("--no-cal", action="store_true", help="Skip calibration phase")
    parser.add_argument("--raw", action="store_true", help="Raw CSV output mode (no clear screen)")
    parser.add_argument("--viz", action="store_true", help="Launch 3D orientation visualization")
    parser.add_argument("--traj", action="store_true", help="Launch 3D trajectory visualization (moving in space)")
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

    if args.viz or args.traj:
        print(f"Connecting to {port} at {args.baud} baud...")
        ser = serial.Serial(port, args.baud, timeout=1)
        print("Connected!\n")

        if args.no_cal:
            cal = IMUCalibration()
            print("Calibration skipped.")
        else:
            cal = calibrate(ser, args.cal_duration)

        viz_mode = "trajectory" if args.traj else "orientation"
        print(f"\nStarting 3D {viz_mode}... (close window or Ctrl+C to stop)\n")
        imu = IMUData()
        try:
            run_3d_viz(ser, imu, cal, mode=viz_mode)
        finally:
            ser.close()
            print("Done.")
    else:
        read_imu(port, args.baud, args.log, args.raw, args.cal_duration, args.no_cal)


if __name__ == "__main__":
    main()
