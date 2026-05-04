#!/usr/bin/env python3
"""
IMU Web Dashboard — FastAPI + WebSocket
Real-time browser visualization of all IMU channels.

Install:
  pip install fastapi uvicorn pyserial

Run:
  python imu_server.py                         # auto-detect port, 9600 baud
  python imu_server.py -b 115200               # 200Hz mode
  python imu_server.py -p /dev/ttyUSB0         # explicit port
  python imu_server.py --no-cal                # skip calibration

host : http://localhost:8765
"""

import asyncio
import json
import math
import struct
import sys
import threading
import time
import argparse
from collections import deque

import serial
import serial.tools.list_ports
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

# ──────────────────────────────────────────────
#  IMU Protocol (WIT Motion / JY901B)
# ──────────────────────────────────────────────

HEADER     = 0x55
TYPE_ACC   = 0x51
TYPE_GYRO  = 0x52
TYPE_ANGLE = 0x53
TYPE_MAG   = 0x54

ACC_SCALE   = 16.0 / 32768.0
GYRO_SCALE  = 2000.0 / 32768.0
ANGLE_SCALE = 180.0 / 32768.0
TEMP_SCALE  = 1.0 / 100.0


def find_imu_port():
    for p in serial.tools.list_ports.comports():
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        if any(k in desc for k in ["cp210", "cp2102", "silicon labs", "uart"]):
            return p.device
        if any(k in hwid for k in ["10c4:ea60", "cp210"]):
            return p.device
        if "usbserial" in p.device or "usbmodem" in p.device:
            return p.device
    return None


def verify_checksum(packet):
    return sum(packet[:10]) & 0xFF == packet[10]


def process_buffer(buf, state):
    """Parse all complete packets from buf, update state dict, return remaining buf."""
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
        if not verify_checksum(packet):
            continue
        d0, d1, d2, d3 = struct.unpack("<hhhh", packet[2:10])
        ptype = packet[1]
        if ptype == TYPE_ACC:
            state["ax"] = d0 * ACC_SCALE
            state["ay"] = d1 * ACC_SCALE
            state["az"] = d2 * ACC_SCALE
            state["temp"] = d3 * TEMP_SCALE
            state["ts"] = time.time()
        elif ptype == TYPE_GYRO:
            state["gx"] = d0 * GYRO_SCALE
            state["gy"] = d1 * GYRO_SCALE
            state["gz"] = d2 * GYRO_SCALE
        elif ptype == TYPE_ANGLE:
            state["roll"]  = d0 * ANGLE_SCALE
            state["pitch"] = d1 * ANGLE_SCALE
            state["yaw"]   = d2 * ANGLE_SCALE
            state["_full"] = True   # all 3 types received
        elif ptype == TYPE_MAG:
            state["mx"] = d0 * 1.0
            state["my"] = d1 * 1.0
            state["mz"] = d2 * 1.0
    return buf


# ──────────────────────────────────────────────
#  Calibration (blocking, runs before server)
# ──────────────────────────────────────────────

def calibrate(ser, duration=3.0):
    offsets = {k: [] for k in ["ax","ay","az","gx","gy","gz","roll","pitch","yaw","mx","my","mz"]}
    state = {k: 0.0 for k in offsets}
    state["ts"] = 0.0
    state["_full"] = False
    buf = bytearray()
    t0 = time.time()
    print(f"Calibrating {duration:.0f}s — keep IMU still...")
    while time.time() - t0 < duration:
        raw = ser.read(ser.in_waiting or 1)
        buf.extend(raw)
        buf = process_buffer(buf, state)
        if state.get("_full"):
            for k in offsets:
                offsets[k].append(state[k])
            state["_full"] = False
        pct = min((time.time() - t0) / duration, 1.0)
        bar = "█" * int(pct * 30) + "░" * (30 - int(pct * 30))
        n = len(offsets["roll"])
        hz_eff = n / max(time.time() - t0, 0.001)
        print(f"\r  [{bar}] {pct*100:.0f}%  {n} samples @ {hz_eff:.0f}Hz", end="", flush=True)
    print()
    if not offsets["roll"]:
        print("WARNING: 0 samples — calibration skipped")
        return {k: 0.0 for k in offsets}
    avg = {k: sum(v) / len(v) for k, v in offsets.items() if v}
    avg["az"] -= 1.0   # preserve 1g on Z
    print(f"  Done — {len(offsets['roll'])} samples")
    return avg


# ──────────────────────────────────────────────
#  Shared state between serial thread and WS
# ──────────────────────────────────────────────

class SharedState:
    def __init__(self):
        self.lock = threading.Lock()
        self.latest = {}
        self.new_data = False
        self.packet_count = 0
        self.hz = 0.0
        self._hz_buf = deque(maxlen=100)
        self.start_time = time.time()

    def update(self, data: dict):
        now = time.time()
        with self.lock:
            self.latest = data.copy()
            self.new_data = True
            self.packet_count += 1
            self._hz_buf.append(now)
            if len(self._hz_buf) >= 2:
                dt = self._hz_buf[-1] - self._hz_buf[0]
                if dt > 0:
                    self.hz = (len(self._hz_buf) - 1) / dt

    def snapshot(self):
        with self.lock:
            self.new_data = False
            return self.latest.copy(), self.hz, self.packet_count


SHARED = SharedState()
CLIENTS: set[WebSocket] = set()


# ──────────────────────────────────────────────
#  Serial reader thread
# ──────────────────────────────────────────────

def serial_thread(port_hint: str, baud: int, cal_duration: float, skip_cal: bool):
    """Reconnecting serial loop — recalibrates automatically on each reconnection."""
    while True:
        # ── Wait for device ──────────────────────────────
        port = port_hint or find_imu_port()
        while port is None:
            time.sleep(1.0)
            port = find_imu_port()

        print(f"[serial] Connecting to {port} at {baud} baud...")
        try:
            ser = serial.Serial(port, baud, timeout=1)
        except serial.SerialException as e:
            print(f"[serial] Open failed: {e} — retrying in 2s")
            time.sleep(2.0)
            continue

        # ── Calibration ──────────────────────────────────
        if skip_cal:
            cal_offsets = {}
            print("[serial] Calibration skipped.")
        else:
            print("[serial] Starting calibration...")
            cal_offsets = calibrate(ser, cal_duration)

        print("[serial] Reading...")
        buf = bytearray()
        raw_state = {k: 0.0 for k in ["ax","ay","az","gx","gy","gz","roll","pitch","yaw","mx","my","mz","temp","ts"]}
        raw_state["_full"] = False

        # ── Read loop ─────────────────────────────────────
        try:
            while True:
                data = ser.read(ser.in_waiting or 1)
                if not data:
                    continue
                buf.extend(data)
                buf = process_buffer(buf, raw_state)
                if raw_state.get("_full"):
                    raw_state["_full"] = False
                    d = {k: raw_state[k] for k in ["ax","ay","az","gx","gy","gz","roll","pitch","yaw","mx","my","mz","temp","ts"]}
                    for k in cal_offsets:
                        d[k] = d[k] - cal_offsets[k]
                    d["g_total"]  = math.sqrt(d["ax"]**2 + d["ay"]**2 + d["az"]**2)
                    d["gyro_mag"] = math.sqrt(d["gx"]**2 + d["gy"]**2 + d["gz"]**2)
                    d["mag_total"]= math.sqrt(d["mx"]**2 + d["my"]**2 + d["mz"]**2)
                    SHARED.update(d)
        except (OSError, serial.SerialException) as e:
            print(f"[serial] Disconnected: {e}")
        except Exception as e:
            print(f"[serial] Unexpected error: {e}")
        finally:
            try:
                ser.close()
            except Exception:
                pass

        print("[serial] Waiting for IMU to reconnect...")
        time.sleep(2.0)


# ──────────────────────────────────────────────
#  FastAPI app
# ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_app: FastAPI):
    asyncio.create_task(broadcaster())
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/", response_class=HTMLResponse)
async def index():
    return HTML_PAGE


@app.get("/3d", response_class=HTMLResponse)
async def page_3d():
    return HTML_3D


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    CLIENTS.add(ws)
    try:
        while True:
            await asyncio.sleep(0.05)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    finally:
        CLIENTS.discard(ws)


async def broadcaster():
    """Periodically push latest IMU data to all connected WebSocket clients."""
    while True:
        await asyncio.sleep(0.033)   # ~30fps
        if not CLIENTS:
            continue
        data, hz, pkts = SHARED.snapshot()
        if not data:
            continue
        msg = json.dumps({
            "ax":   round(data.get("ax", 0), 5),
            "ay":   round(data.get("ay", 0), 5),
            "az":   round(data.get("az", 0), 5),
            "gx":   round(data.get("gx", 0), 3),
            "gy":   round(data.get("gy", 0), 3),
            "gz":   round(data.get("gz", 0), 3),
            "roll":  round(data.get("roll",  0), 3),
            "pitch": round(data.get("pitch", 0), 3),
            "yaw":   round(data.get("yaw",   0), 3),
            "mx":   round(data.get("mx", 0), 2),
            "my":   round(data.get("my", 0), 2),
            "mz":   round(data.get("mz", 0), 2),
            "temp": round(data.get("temp", 0), 2),
            "g_total":  round(data.get("g_total",  0), 4),
            "gyro_mag": round(data.get("gyro_mag", 0), 2),
            "mag_total":round(data.get("mag_total",0), 2),
            "hz":   round(hz, 1),
            "pkts": pkts,
            "ts":   round(data.get("ts", time.time()), 3),
        })
        for ws in list(CLIENTS):
            try:
                await ws.send_text(msg)
            except Exception:
                CLIENTS.discard(ws)


# ──────────────────────────────────────────────
#  HTML 3D View (served at /3d)
# ──────────────────────────────────────────────

HTML_3D = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IMU 3D View — MoKart</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d1117;color:#e6edf3;font-family:'JetBrains Mono',Consolas,monospace;font-size:12px;overflow:hidden}

  #header{
    position:fixed;top:0;left:0;right:0;z-index:10;
    display:flex;align-items:center;justify-content:space-between;
    background:#161b22cc;backdrop-filter:blur(8px);
    border-bottom:1px solid #30363d;
    padding:10px 18px;gap:16px;
  }
  #header h1{font-size:14px;font-weight:700;color:#58a6ff;letter-spacing:1px}
  #status{display:flex;align-items:center;gap:6px}
  #dot{width:8px;height:8px;border-radius:50%;background:#f78166;transition:background .3s}
  #dot.live{background:#3fb950}
  #hz-badge{background:#21262d;border:1px solid #30363d;border-radius:12px;padding:2px 10px;color:#e3b341;font-weight:700}

  #canvas-wrap{position:fixed;top:0;left:0;width:100vw;height:100vh}

  #overlay{
    position:fixed;bottom:16px;left:16px;z-index:10;
    background:#161b22cc;backdrop-filter:blur(8px);
    border:1px solid #30363d;border-radius:10px;
    padding:12px 16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 20px;min-width:280px;
  }
  .ov-label{color:#8b949e;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
  .ov-value{font-size:15px;font-weight:700;font-variant-numeric:tabular-nums}
  .c-blue{color:#58a6ff}.c-green{color:#3fb950}.c-red{color:#f78166}
  .c-purple{color:#d2a8ff}.c-orange{color:#ffa657}.c-cyan{color:#79c0ff}

  #help{
    position:fixed;bottom:16px;right:16px;z-index:10;
    color:#8b949e;font-size:10px;text-align:right;line-height:1.6;
  }
</style>
</head>
<body>

<div id="header">
  <h1>⬡ IMU 3D VIEW — MoKart</h1>
  <nav style="display:flex;gap:8px">
    <a href="/" style="background:#21262d;border:1px solid #30363d;color:#8b949e;padding:4px 12px;border-radius:6px;text-decoration:none;font-size:11px">📊 Dashboard</a>
    <a href="/3d" style="background:#21262d;border:1px solid #58a6ff;color:#58a6ff;padding:4px 12px;border-radius:6px;text-decoration:none;font-size:11px">🧊 3D View</a>
  </nav>
  <div id="status">
    <div id="dot"></div>
    <span id="hz-badge">0.0 Hz</span>
  </div>
</div>

<div id="canvas-wrap">
  <canvas id="c3d"></canvas>
</div>

<div id="overlay">
  <div><div class="ov-label">Roll</div><div class="ov-value c-blue" id="v-roll">—°</div></div>
  <div><div class="ov-label">Pitch</div><div class="ov-value c-green" id="v-pitch">—°</div></div>
  <div><div class="ov-label">Yaw</div><div class="ov-value c-red" id="v-yaw">—°</div></div>
  <div><div class="ov-label">Acc X</div><div class="ov-value c-blue" id="v-ax">—g</div></div>
  <div><div class="ov-label">Acc Y</div><div class="ov-value c-green" id="v-ay">—g</div></div>
  <div><div class="ov-label">Acc Z</div><div class="ov-value c-red" id="v-az">—g</div></div>
  <div><div class="ov-label">Gyro X</div><div class="ov-value c-purple" id="v-gx">—°/s</div></div>
  <div><div class="ov-label">Gyro Y</div><div class="ov-value c-orange" id="v-gy">—°/s</div></div>
  <div><div class="ov-label">Gyro Z</div><div class="ov-value c-cyan" id="v-gz">—°/s</div></div>
</div>

<div id="help">Drag to orbit · Scroll to zoom · Right-drag to pan</div>

<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Scene setup ──────────────────────────────────────────────────────
const canvas = document.getElementById('c3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1117);
scene.fog = new THREE.Fog(0x0d1117, 20, 60);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(3, 2.5, 4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.5;
controls.maxDistance = 15;

// ── Lighting ─────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0x58a6ff, 1.2);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0xff7b72, 0.3);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

// ── Ground grid ──────────────────────────────────────────────────────
const grid = new THREE.GridHelper(20, 20, 0x30363d, 0x21262d);
grid.position.y = -1.5;
scene.add(grid);

// ── IMU box (kart-ish proportions: wide, flat) ───────────────────────
const pivot = new THREE.Group();
scene.add(pivot);

const boxGeo = new THREE.BoxGeometry(1.6, 0.4, 1.0);
const materials = [
  new THREE.MeshPhongMaterial({ color: 0x58a6ff, shininess: 80 }),  // +X right
  new THREE.MeshPhongMaterial({ color: 0x2d5a9e, shininess: 80 }),  // -X left
  new THREE.MeshPhongMaterial({ color: 0x3fb950, shininess: 80 }),  // +Y top
  new THREE.MeshPhongMaterial({ color: 0x1a4028, shininess: 80 }),  // -Y bottom
  new THREE.MeshPhongMaterial({ color: 0xe3b341, shininess: 80 }),  // +Z front
  new THREE.MeshPhongMaterial({ color: 0x7d6514, shininess: 80 }),  // -Z back
];
const box = new THREE.Mesh(boxGeo, materials);
box.castShadow = true;
pivot.add(box);

// Front arrow
pivot.add(new THREE.ArrowHelper(
  new THREE.Vector3(0,0,1).normalize(),
  new THREE.Vector3(0, 0.25, 0),
  0.7, 0xe3b341, 0.2, 0.15
));

// ── World-frame axis arrows (fixed, bottom-left area) ────────────────
const axOrigin = new THREE.Vector3(-2.5, -1.4, 0);
scene.add(new THREE.ArrowHelper(new THREE.Vector3(1,0,0), axOrigin, 1.0, 0xff4444, 0.15, 0.1));
scene.add(new THREE.ArrowHelper(new THREE.Vector3(0,1,0), axOrigin, 1.0, 0x44ff44, 0.15, 0.1));
scene.add(new THREE.ArrowHelper(new THREE.Vector3(0,0,1), axOrigin, 1.0, 0x4444ff, 0.15, 0.1));

function makeLabel(text, color) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 16);
  const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(0.4, 0.2, 1);
  return s;
}
const lX = makeLabel('X', '#ff6666'); lX.position.set(-1.3, -1.4,  0); scene.add(lX);
const lY = makeLabel('Y', '#66ff66'); lY.position.set(-2.5, -0.3,  0); scene.add(lY);
const lZ = makeLabel('Z', '#6666ff'); lZ.position.set(-2.5, -1.4, 1.2); scene.add(lZ);

// ── Euler target + smooth interpolation ──────────────────────────────
const DEG2RAD = Math.PI / 180;
let tR = 0, tP = 0, tY = 0;  // targets
let cR = 0, cP = 0, cY = 0;  // current (smoothed)
const ALPHA = 0.12;

// ── Resize ────────────────────────────────────────────────────────────
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ── Render loop ───────────────────────────────────────────────────────
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  cR += (tR - cR) * ALPHA;
  cP += (tP - cP) * ALPHA;
  cY += (tY - cY) * ALPHA;
  pivot.rotation.order = 'ZYX';
  pivot.rotation.z = cR * DEG2RAD;
  pivot.rotation.y = cY * DEG2RAD;
  pivot.rotation.x = cP * DEG2RAD;
  renderer.render(scene, camera);
})();

// ── WebSocket ─────────────────────────────────────────────────────────
let reconnectTimer;
function connect() {
  const ws = new WebSocket(`ws://${location.host}/ws`);
  ws.onopen  = () => { document.getElementById('dot').classList.add('live'); clearTimeout(reconnectTimer); };
  ws.onclose = () => { document.getElementById('dot').classList.remove('live'); reconnectTimer = setTimeout(connect, 2000); };
  ws.onerror = () => ws.close();
  ws.onmessage = ({ data }) => {
    const d = JSON.parse(data);
    tR = d.roll  ?? 0;
    tP = d.pitch ?? 0;
    tY = d.yaw   ?? 0;
    document.getElementById('hz-badge').textContent = (d.hz ?? 0).toFixed(1) + ' Hz';
    const fmt = (v, dec) => (v >= 0 ? '+' : '') + v.toFixed(dec);
    document.getElementById('v-roll').textContent  = fmt(d.roll  ?? 0, 1) + '°';
    document.getElementById('v-pitch').textContent = fmt(d.pitch ?? 0, 1) + '°';
    document.getElementById('v-yaw').textContent   = fmt(d.yaw   ?? 0, 1) + '°';
    document.getElementById('v-ax').textContent = fmt(d.ax ?? 0, 3) + 'g';
    document.getElementById('v-ay').textContent = fmt(d.ay ?? 0, 3) + 'g';
    document.getElementById('v-az').textContent = fmt(d.az ?? 0, 3) + 'g';
    document.getElementById('v-gx').textContent = fmt(d.gx ?? 0, 1) + '°/s';
    document.getElementById('v-gy').textContent = fmt(d.gy ?? 0, 1) + '°/s';
    document.getElementById('v-gz').textContent = fmt(d.gz ?? 0, 1) + '°/s';
  };
}
connect();
</script>
</body>
</html>
"""


# ──────────────────────────────────────────────
#  HTML Dashboard (served at /)
# ──────────────────────────────────────────────

HTML_PAGE = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IMU Dashboard — MoKart</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d1117;color:#e6edf3;font-family:'JetBrains Mono',Consolas,monospace;font-size:12px}

  /* ── Header ── */
  #header{
    display:flex;align-items:center;justify-content:space-between;
    background:#161b22;border-bottom:1px solid #30363d;
    padding:10px 18px;gap:16px;flex-wrap:wrap;
  }
  #header h1{font-size:14px;font-weight:700;color:#58a6ff;letter-spacing:1px;white-space:nowrap}
  #status{display:flex;align-items:center;gap:6px}
  #dot{width:8px;height:8px;border-radius:50%;background:#f78166;transition:background .3s}
  #dot.live{background:#3fb950}
  #hz-badge{
    background:#21262d;border:1px solid #30363d;border-radius:12px;
    padding:2px 10px;color:#e3b341;font-weight:700;
  }
  #pkt-count{color:#8b949e}

  /* ── KPI row ── */
  #kpis{
    display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
    gap:8px;padding:10px 14px;background:#0d1117;border-bottom:1px solid #21262d;
  }
  .kpi{
    background:#161b22;border:1px solid #30363d;border-radius:8px;
    padding:8px 10px;display:flex;flex-direction:column;gap:3px;
  }
  .kpi-label{color:#8b949e;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
  .kpi-value{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
  .kpi-unit{color:#8b949e;font-size:10px}

  /* ── Charts grid ── */
  #charts{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:8px;padding:10px 14px;
  }
  .chart-box{
    background:#161b22;border:1px solid #30363d;border-radius:8px;
    padding:8px 10px 6px;
  }
  .chart-title{
    font-size:10px;color:#8b949e;text-transform:uppercase;letter-spacing:.5px;
    margin-bottom:4px;display:flex;justify-content:space-between;
  }
  .chart-title span{font-variant-numeric:tabular-nums}
  canvas{display:block;width:100%!important;height:100px!important}

  /* ── Colors ── */
  .c-blue{color:#58a6ff}.c-green{color:#3fb950}.c-red{color:#f78166}
  .c-purple{color:#d2a8ff}.c-orange{color:#ffa657}.c-cyan{color:#79c0ff}
  .c-yellow{color:#e3b341}.c-pink{color:#ff7b72}.c-lime{color:#56d364}
</style>
</head>
<body>

<div id="header">
  <h1>⬡ IMU DASHBOARD — MoKart</h1>
  <nav style="display:flex;gap:8px">
    <a href="/" style="background:#21262d;border:1px solid #58a6ff;color:#58a6ff;padding:4px 12px;border-radius:6px;text-decoration:none;font-size:11px">📊 Dashboard</a>
    <a href="/3d" style="background:#21262d;border:1px solid #30363d;color:#8b949e;padding:4px 12px;border-radius:6px;text-decoration:none;font-size:11px">🧊 3D View</a>
  </nav>
  <div id="status">
    <div id="dot"></div>
    <span id="hz-badge">0.0 Hz</span>
    <span id="pkt-count">0 pkts</span>
  </div>
</div>

<div id="kpis">
  <div class="kpi"><div class="kpi-label">Acc X</div><div class="kpi-value c-blue" id="v-ax">—</div><div class="kpi-unit">g</div></div>
  <div class="kpi"><div class="kpi-label">Acc Y</div><div class="kpi-value c-green" id="v-ay">—</div><div class="kpi-unit">g</div></div>
  <div class="kpi"><div class="kpi-label">Acc Z</div><div class="kpi-value c-red" id="v-az">—</div><div class="kpi-unit">g</div></div>
  <div class="kpi"><div class="kpi-label">Gyro X</div><div class="kpi-value c-purple" id="v-gx">—</div><div class="kpi-unit">°/s</div></div>
  <div class="kpi"><div class="kpi-label">Gyro Y</div><div class="kpi-value c-orange" id="v-gy">—</div><div class="kpi-unit">°/s</div></div>
  <div class="kpi"><div class="kpi-label">Gyro Z</div><div class="kpi-value c-cyan" id="v-gz">—</div><div class="kpi-unit">°/s</div></div>
  <div class="kpi"><div class="kpi-label">Roll</div><div class="kpi-value c-blue" id="v-roll">—</div><div class="kpi-unit">°</div></div>
  <div class="kpi"><div class="kpi-label">Pitch</div><div class="kpi-value c-green" id="v-pitch">—</div><div class="kpi-unit">°</div></div>
  <div class="kpi"><div class="kpi-label">Yaw</div><div class="kpi-value c-red" id="v-yaw">—</div><div class="kpi-unit">°</div></div>
  <div class="kpi"><div class="kpi-label">Mag X</div><div class="kpi-value c-purple" id="v-mx">—</div><div class="kpi-unit">uT</div></div>
  <div class="kpi"><div class="kpi-label">Mag Y</div><div class="kpi-value c-orange" id="v-my">—</div><div class="kpi-unit">uT</div></div>
  <div class="kpi"><div class="kpi-label">Mag Z</div><div class="kpi-value c-cyan" id="v-mz">—</div><div class="kpi-unit">uT</div></div>
  <div class="kpi"><div class="kpi-label">|Acc| total</div><div class="kpi-value c-yellow" id="v-gtot">—</div><div class="kpi-unit">g</div></div>
  <div class="kpi"><div class="kpi-label">|Gyro| mag</div><div class="kpi-value c-pink" id="v-gmag">—</div><div class="kpi-unit">°/s</div></div>
  <div class="kpi"><div class="kpi-label">Temp</div><div class="kpi-value c-lime" id="v-temp">—</div><div class="kpi-unit">°C</div></div>
</div>

<div id="charts">
  <div class="chart-box"><div class="chart-title">Accel X (g)<span id="s-ax"></span></div><canvas id="c-ax"></canvas></div>
  <div class="chart-box"><div class="chart-title">Accel Y (g)<span id="s-ay"></span></div><canvas id="c-ay"></canvas></div>
  <div class="chart-box"><div class="chart-title">Accel Z (g)<span id="s-az"></span></div><canvas id="c-az"></canvas></div>
  <div class="chart-box"><div class="chart-title">Gyro X (°/s)<span id="s-gx"></span></div><canvas id="c-gx"></canvas></div>
  <div class="chart-box"><div class="chart-title">Gyro Y (°/s)<span id="s-gy"></span></div><canvas id="c-gy"></canvas></div>
  <div class="chart-box"><div class="chart-title">Gyro Z (°/s)<span id="s-gz"></span></div><canvas id="c-gz"></canvas></div>
  <div class="chart-box"><div class="chart-title">Roll (°)<span id="s-roll"></span></div><canvas id="c-roll"></canvas></div>
  <div class="chart-box"><div class="chart-title">Pitch (°)<span id="s-pitch"></span></div><canvas id="c-pitch"></canvas></div>
  <div class="chart-box"><div class="chart-title">Yaw (°)<span id="s-yaw"></span></div><canvas id="c-yaw"></canvas></div>
  <div class="chart-box"><div class="chart-title">Mag X (uT)<span id="s-mx"></span></div><canvas id="c-mx"></canvas></div>
  <div class="chart-box"><div class="chart-title">Mag Y (uT)<span id="s-my"></span></div><canvas id="c-my"></canvas></div>
  <div class="chart-box"><div class="chart-title">Mag Z (uT)<span id="s-mz"></span></div><canvas id="c-mz"></canvas></div>
  <div class="chart-box"><div class="chart-title">|Acc| total (g)<span id="s-gtot"></span></div><canvas id="c-gtot"></canvas></div>
  <div class="chart-box"><div class="chart-title">|Gyro| mag (°/s)<span id="s-gmag"></span></div><canvas id="c-gmag"></canvas></div>
  <div class="chart-box"><div class="chart-title">Temperature (°C)<span id="s-temp"></span></div><canvas id="c-temp"></canvas></div>
</div>

<script>
const MAX_POINTS = 300;
const CHANNELS = [
  {key:'ax',   canvas:'c-ax',    stat:'s-ax',    color:'#58a6ff', kpi:'v-ax',    fmt:v=>v.toFixed(4)},
  {key:'ay',   canvas:'c-ay',    stat:'s-ay',    color:'#3fb950', kpi:'v-ay',    fmt:v=>v.toFixed(4)},
  {key:'az',   canvas:'c-az',    stat:'s-az',    color:'#f78166', kpi:'v-az',    fmt:v=>v.toFixed(4)},
  {key:'gx',   canvas:'c-gx',    stat:'s-gx',    color:'#d2a8ff', kpi:'v-gx',    fmt:v=>v.toFixed(2)},
  {key:'gy',   canvas:'c-gy',    stat:'s-gy',    color:'#ffa657', kpi:'v-gy',    fmt:v=>v.toFixed(2)},
  {key:'gz',   canvas:'c-gz',    stat:'s-gz',    color:'#79c0ff', kpi:'v-gz',    fmt:v=>v.toFixed(2)},
  {key:'roll', canvas:'c-roll',  stat:'s-roll',  color:'#58a6ff', kpi:'v-roll',  fmt:v=>v.toFixed(2)},
  {key:'pitch',canvas:'c-pitch', stat:'s-pitch', color:'#3fb950', kpi:'v-pitch', fmt:v=>v.toFixed(2)},
  {key:'yaw',  canvas:'c-yaw',   stat:'s-yaw',   color:'#f78166', kpi:'v-yaw',   fmt:v=>v.toFixed(2)},
  {key:'mx',   canvas:'c-mx',    stat:'s-mx',    color:'#d2a8ff', kpi:'v-mx',    fmt:v=>v.toFixed(1)},
  {key:'my',   canvas:'c-my',    stat:'s-my',    color:'#ffa657', kpi:'v-my',    fmt:v=>v.toFixed(1)},
  {key:'mz',   canvas:'c-mz',    stat:'s-mz',    color:'#79c0ff', kpi:'v-mz',    fmt:v=>v.toFixed(1)},
  {key:'g_total',  canvas:'c-gtot', stat:'s-gtot', color:'#e3b341', kpi:'v-gtot', fmt:v=>v.toFixed(4)},
  {key:'gyro_mag', canvas:'c-gmag', stat:'s-gmag', color:'#ff7b72', kpi:'v-gmag', fmt:v=>v.toFixed(2)},
  {key:'temp', canvas:'c-temp',  stat:'s-temp',  color:'#56d364', kpi:'v-temp',  fmt:v=>v.toFixed(2)},
];

// Rolling buffers
const buffers = {};
CHANNELS.forEach(c => { buffers[c.key] = []; });

// Build Chart.js instances
const charts = {};
Chart.defaults.color = '#8b949e';
Chart.defaults.borderColor = '#30363d';

CHANNELS.forEach(ch => {
  const ctx = document.getElementById(ch.canvas).getContext('2d');
  charts[ch.key] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: ch.color,
        borderWidth: 1.2,
        pointRadius: 0,
        tension: 0,
        fill: false,
      }]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: {
          display: false,
          ticks: { display: false },
        },
        y: {
          grid: { color: '#21262d' },
          ticks: { font: { size: 9 }, maxTicksLimit: 4 },
          border: { color: '#30363d' },
        }
      }
    }
  });
});

// WebSocket connection with auto-reconnect
let ws, reconnectTimer;
let lastTs = 0;

function connect() {
  ws = new WebSocket(`ws://${location.host}/ws`);
  ws.onopen = () => {
    document.getElementById('dot').classList.add('live');
    clearTimeout(reconnectTimer);
  };
  ws.onclose = () => {
    document.getElementById('dot').classList.remove('live');
    reconnectTimer = setTimeout(connect, 2000);
  };
  ws.onerror = () => ws.close();
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    onData(d);
  };
}

function onData(d) {
  // Update KPIs
  document.getElementById('hz-badge').textContent = d.hz.toFixed(1) + ' Hz';
  document.getElementById('pkt-count').textContent = d.pkts.toLocaleString() + ' pkts';

  CHANNELS.forEach(ch => {
    const val = d[ch.key];
    if (val === undefined) return;

    // KPI card
    document.getElementById(ch.kpi).textContent = (val >= 0 ? '+' : '') + ch.fmt(val);

    // Rolling buffer
    const buf = buffers[ch.key];
    buf.push(val);
    if (buf.length > MAX_POINTS) buf.shift();

    // Chart update
    const chart = charts[ch.key];
    chart.data.labels = buf.map((_, i) => i);
    chart.data.datasets[0].data = buf;

    // Auto y-scale with small padding
    const min = Math.min(...buf);
    const max = Math.max(...buf);
    const pad = (max - min) * 0.15 || 0.05;
    chart.options.scales.y.min = min - pad;
    chart.options.scales.y.max = max + pad;

    chart.update('none');  // no animation

    // Stat badge (min/max)
    const statEl = document.getElementById(ch.stat);
    if (statEl) statEl.textContent = `min ${ch.fmt(min)} / max ${ch.fmt(max)}`;
  });
}

connect();
</script>
</body>
</html>
"""


# ──────────────────────────────────────────────
#  Entry point
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="IMU Web Dashboard — FastAPI")
    parser.add_argument("-p", "--port",         help="Serial port (auto-detect if omitted)")
    parser.add_argument("-b", "--baud", type=int, default=9600, help="Baud rate (default: 9600)")
    parser.add_argument("-c", "--cal-duration", type=float, default=3.0)
    parser.add_argument("--no-cal",    action="store_true", help="Skip calibration")
    parser.add_argument("--host",      default="0.0.0.0",   help="Server host (default: 0.0.0.0)")
    parser.add_argument("--web-port",  type=int, default=8765, help="Web server port (default: 8765)")
    parser.add_argument("--list-ports",action="store_true")
    args = parser.parse_args()

    if args.list_ports:
        for p in serial.tools.list_ports.comports():
            print(f"  {p.device} - {p.description} [{p.hwid}]")
        return

    port = args.port or find_imu_port()
    if not port:
        print("ERROR: No IMU port found. Use --list-ports then -p <port>")
        sys.exit(1)
    if not args.port:
        print(f"Auto-detected IMU: {port}")

    # Open temporarily just to verify port exists, then close — thread manages its own connection
    try:
        ser = serial.Serial(port, args.baud, timeout=1)
        ser.close()
    except serial.SerialException as e:
        print(f"ERROR: Cannot open {port}: {e}")
        sys.exit(1)
    t = threading.Thread(
        target=serial_thread,
        args=(port, args.baud, args.cal_duration, args.no_cal),
        daemon=True,
    )
    t.start()

    print(f"\n  Dashboard: http://localhost:{args.web_port}")
    print("  Press Ctrl+C to stop\n")

    uvicorn.run(app, host=args.host, port=args.web_port, log_level="warning")


if __name__ == "__main__":
    main()
