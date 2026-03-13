#!/usr/bin/env python3
"""
mokart-test (serveur central)
Recoit la telemetrie des karts, affiche sur ecran TFT, broadcast l'etat global.
Chaque kart recoit les infos des AUTRES karts (pas les siennes).
"""

import os
import socket
import json
import time
import threading
import signal
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ==============================
# CONFIGURATION
# ==============================
UDP_PORT = 5005
BROADCAST_PORT = 5006

FB_DEVICE = "/dev/fb1"
WIDTH = 480
HEIGHT = 320
TARGET_FPS = 15  # suffisant pour du monitoring
FRAME_TIME = 1.0 / TARGET_FPS

# Couleurs
BG_COLOR    = (5, 8, 15)
CYAN        = (34, 211, 238)
MAGENTA     = (255, 0, 255)
WHITE       = (255, 255, 255)
GRAY_DARK   = (30, 35, 45)
GRAY_MID    = (60, 65, 75)
RED         = (255, 40, 40)
ORANGE      = (255, 165, 0)
YELLOW      = (255, 255, 0)
GREEN       = (0, 255, 100)

# Couleurs par kart (index par ordre d'apparition)
KART_COLORS = [CYAN, MAGENTA, GREEN, ORANGE, YELLOW]

# ==============================
# POLICES
# ==============================
try:
    font_tiny  = ImageFont.truetype("Roboto-Bold.ttf", 14)
    font_small = ImageFont.truetype("Roboto-Bold.ttf", 18)
    font_med   = ImageFont.truetype("Roboto-Bold.ttf", 24)
    font_xl    = ImageFont.truetype("Roboto-Bold.ttf", 46)
except IOError:
    font_tiny = font_small = font_med = font_xl = ImageFont.load_default()

# ==============================
# FRAMEBUFFER
# ==============================
fb = None
try:
    fb = open(FB_DEVICE, "r+b", buffering=0)
except PermissionError:
    os.system(f"sudo chmod 666 {FB_DEVICE}")
    fb = open(FB_DEVICE, "r+b", buffering=0)
except FileNotFoundError:
    print(f"[DISPLAY] {FB_DEVICE} introuvable, mode console uniquement")

def image_to_rgb565_fast(img):
    arr = np.array(img)
    r5 = (arr[:, :, 0] >> 3).astype(np.uint16)
    g6 = (arr[:, :, 1] >> 2).astype(np.uint16)
    b5 = (arr[:, :, 2] >> 3).astype(np.uint16)
    return ((r5 << 11) | (g6 << 5) | b5).tobytes()

def render_to_screen(image):
    if fb is None:
        return
    data = image_to_rgb565_fast(image)
    fb.seek(0)
    fb.write(data)

# ==============================
# EXIT SCREEN
# ==============================
def get_cpu_temp():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            return int(f.read().strip()) // 1000
    except:
        return 0

def exit_clean(_sig, _frame):
    if fb is not None:
        try:
            img = Image.new("RGB", (WIDTH, HEIGHT), (5, 5, 8))
            draw = ImageDraw.Draw(img)
            draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=(150, 20, 20), width=2)

            t1, t2 = "MOKART", "// SERVER OFFLINE"
            try:
                w1 = font_xl.getbbox(t1)[2] - font_xl.getbbox(t1)[0]
                w2 = font_med.getbbox(t2)[2] - font_med.getbbox(t2)[0]
            except AttributeError:
                w1, w2 = len(t1) * 20, len(t2) * 14

            draw.text(((WIDTH - w1) // 2, HEIGHT // 2 - 40), t1, font=font_xl, fill=WHITE)
            draw.text(((WIDTH - w2) // 2, HEIGHT // 2 + 10), t2, font=font_med, fill=RED)
            draw.text((20, HEIGHT - 35), f"SHUTDOWN AT {time.strftime('%H:%M:%S')}", font=font_tiny, fill=GRAY_MID)

            render_to_screen(img)
            fb.close()
        except:
            pass

    print("\n[SERVER] Arret.")
    sys.exit(0)

signal.signal(signal.SIGINT, exit_clean)

# ==============================
# DRAWING HELPERS
# ==============================
def draw_progress_bar(draw, x, y, w, h, percent, color):
    draw.rectangle([x, y, x + w, y + h], fill=GRAY_DARK)
    fill_w = int(w * min(percent, 100) / 100)
    if fill_w > 0:
        draw.rectangle([x, y, x + fill_w, y + h], fill=color)

def temp_color(temp):
    if temp >= 70: return RED
    if temp >= 55: return ORANGE
    if temp >= 40: return YELLOW
    return GREEN

def status_dot_color(age):
    if age < 2: return GREEN
    if age < 5: return YELLOW
    return RED

# ==============================
# SERVER
# ==============================
class MokartServer:
    def __init__(self):
        self.karts = {}  # {kart_id: {last_seen, data, addr}}
        self.kart_order = []  # ordre stable pour les couleurs
        self.running = False

        # Socket de reception
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind(("0.0.0.0", UDP_PORT))
        self.sock.settimeout(1.0)

        # Socket de broadcast
        self.broadcast_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.broadcast_sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    def start(self):
        self.running = True
        print(f"[SERVER] Ecoute sur le port {UDP_PORT}...")

        threading.Thread(target=self._receive_loop, daemon=True).start()
        threading.Thread(target=self._broadcast_loop, daemon=True).start()

        self._last_console_print = 0

        try:
            while self.running:
                self._render_frame()
                self._print_console()
                time.sleep(FRAME_TIME)
        except KeyboardInterrupt:
            self.running = False

    def _receive_loop(self):
        while self.running:
            try:
                data, addr = self.sock.recvfrom(4096)
                packet = json.loads(data.decode())
                kart_id = packet.get("kart_id", "unknown")

                if kart_id not in self.kart_order:
                    self.kart_order.append(kart_id)

                self.karts[kart_id] = {
                    "last_seen": time.time(),
                    "data": packet,
                    "addr": addr,
                }
            except socket.timeout:
                continue
            except json.JSONDecodeError:
                continue

    def _broadcast_loop(self):
        while self.running:
            time.sleep(0.1)  # 10 Hz

            now = time.time()
            state = {
                "type": "state",
                "timestamp": now,
                "karts": {},
            }

            for kart_id, info in list(self.karts.items()):
                if now - info["last_seen"] > 5:
                    continue
                state["karts"][kart_id] = {
                    "x": info["data"].get("x", 0),
                    "y": info["data"].get("y", 0),
                    "speed": info["data"].get("speed", 0),
                    "lap": info["data"].get("lap", 0),
                    "cpu_temp": info["data"].get("cpu_temp", 0),
                    "cpu_percent": info["data"].get("cpu_percent", 0),
                    "mem_percent": info["data"].get("mem_percent", 0),
                }

            payload = json.dumps(state).encode()
            try:
                self.broadcast_sock.sendto(payload, ("255.255.255.255", BROADCAST_PORT))
            except OSError:
                pass

    def _get_kart_color(self, kart_id):
        idx = self.kart_order.index(kart_id) if kart_id in self.kart_order else 0
        return KART_COLORS[idx % len(KART_COLORS)]

    def _render_frame(self):
        now = time.time()
        image = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
        draw = ImageDraw.Draw(image)

        # --- Header ---
        draw.rectangle([0, 0, WIDTH, 35], fill=CYAN)
        draw.text((10, 6), "MOKART SERVER", font=font_small, fill=BG_COLOR)
        draw.text((385, 6), time.strftime("%H:%M:%S"), font=font_small, fill=BG_COLOR)

        # Nombre de karts connectes + temp serveur
        connected = [k for k, v in self.karts.items() if now - v["last_seen"] < 5]
        srv_temp = get_cpu_temp()
        draw.text((170, 6), f"{len(connected)} KARTS | {srv_temp}°C", font=font_small, fill=BG_COLOR)

        # --- Kart panels ---
        if not self.kart_order:
            # Ecran d'attente
            t = "EN ATTENTE DE KARTS..."
            try:
                tw = font_med.getbbox(t)[2] - font_med.getbbox(t)[0]
            except AttributeError:
                tw = len(t) * 12
            # Clignotement
            if int(now * 2) % 2:
                draw.text(((WIDTH - tw) // 2, HEIGHT // 2 - 15), t, font=font_med, fill=GRAY_MID)
        else:
            y_start = 45
            panel_h = min(130, (HEIGHT - y_start - 10) // max(len(self.kart_order), 1))

            for i, kart_id in enumerate(self.kart_order):
                info = self.karts.get(kart_id)
                if info is None:
                    continue

                y = y_start + i * (panel_h + 5)
                data = info["data"]
                age = now - info["last_seen"]
                color = self._get_kart_color(kart_id)
                online = age < 5

                # Panel background
                panel_bg = (15, 18, 25) if online else (20, 12, 12)
                draw.rectangle([5, y, WIDTH - 5, y + panel_h], fill=panel_bg, outline=color if online else RED, width=1)

                # Status dot
                dot_c = status_dot_color(age)
                draw.ellipse([12, y + 8, 20, y + 16], fill=dot_c)

                # Kart name
                draw.text((26, y + 4), kart_id.upper(), font=font_small, fill=color if online else RED)

                if not online:
                    draw.text((26, y + 28), f"OFFLINE ({age:.0f}s)", font=font_tiny, fill=RED)
                    continue

                # Addr
                addr_str = f"{info['addr'][0]}"
                draw.text((200, y + 6), addr_str, font=font_tiny, fill=GRAY_MID)

                # --- Stats ---
                sx = 15  # start x for stats
                sy = y + 30

                # CPU Temp
                cpu_temp = data.get("cpu_temp", 0)
                tc = temp_color(cpu_temp)
                draw.text((sx, sy), f"TEMP: {cpu_temp}°C", font=font_tiny, fill=tc)

                # CPU bar
                cpu_pct = data.get("cpu_percent", 0)
                draw.text((sx, sy + 20), f"CPU: {cpu_pct}%", font=font_tiny, fill=CYAN)
                draw_progress_bar(draw, sx + 80, sy + 22, 120, 10, cpu_pct, CYAN)

                # MEM bar
                mem_pct = data.get("mem_percent", 0)
                draw.text((sx, sy + 38), f"MEM: {mem_pct}%", font=font_tiny, fill=MAGENTA)
                draw_progress_bar(draw, sx + 80, sy + 40, 120, 10, mem_pct, MAGENTA)

                # Right side: speed + position
                rx = 260
                speed = data.get("speed", 0)
                draw.text((rx, sy), f"SPEED: {speed:.1f} km/h", font=font_tiny, fill=WHITE)
                draw.text((rx, sy + 20), f"POS: ({data.get('x', 0):.1f}, {data.get('y', 0):.1f})", font=font_tiny, fill=GRAY_MID)
                draw.text((rx, sy + 38), f"LAP: {data.get('lap', 0)}", font=font_tiny, fill=WHITE)

        # --- Footer ---
        draw.rectangle([0, HEIGHT - 20, WIDTH, HEIGHT], fill=(10, 12, 18))
        draw.text((10, HEIGHT - 18), f"UDP :{UDP_PORT}  BCAST :{BROADCAST_PORT}", font=font_tiny, fill=GRAY_MID)
        draw.text((350, HEIGHT - 18), f"{WIDTH}x{HEIGHT}", font=font_tiny, fill=GRAY_MID)

        render_to_screen(image)

    def _print_console(self):
        now = time.time()
        if now - self._last_console_print < 2:
            return
        self._last_console_print = now

        connected = []
        for kart_id, info in self.karts.items():
            age = now - info["last_seen"]
            if age < 5:
                d = info["data"]
                connected.append(
                    f"{kart_id} (cpu:{d.get('cpu_percent',0)}% "
                    f"mem:{d.get('mem_percent',0)}% "
                    f"temp:{d.get('cpu_temp',0)}°C)"
                )

        if connected:
            print(f"[SERVER] {', '.join(connected)}")
        else:
            print("[SERVER] En attente de karts...")


if __name__ == "__main__":
    server = MokartServer()
    server.start()
