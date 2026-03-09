import os
import time
import math
import numpy as np
import psutil
import socket
import threading
import subprocess
import signal
import sys
from PIL import Image, ImageDraw, ImageFont

# ==============================
# CONFIGURATION & CONSTANTS
# ==============================
FB_DEVICE = "/dev/fb1"
WIDTH = 480
HEIGHT = 320
TARGET_FPS = 30
FRAME_TIME = 1.0 / TARGET_FPS

# Ouverture du framebuffer
try:
    fb = open(FB_DEVICE, "r+b", buffering=0)
except PermissionError:
    os.system(f"sudo chmod 666 {FB_DEVICE}")
    fb = open(FB_DEVICE, "r+b", buffering=0)

# Couleurs
BG_COLOR    = (5, 8, 15)
CYAN        = (34, 211, 238)
MAGENTA     = (255, 0, 255)
WHITE       = (255, 255, 255)
GRAY_DARK   = (30, 35, 45)
RED         = (255, 40, 40)
ORANGE      = (255, 165, 0)
YELLOW      = (255, 255, 0)
GREEN       = (0, 255, 100)

# ==============================
# POLICES
# ==============================
try:
    font_tiny  = ImageFont.truetype("Roboto-Bold.ttf", 14)
    font_small = ImageFont.truetype("Roboto-Bold.ttf", 18)
    font_med   = ImageFont.truetype("Roboto-Bold.ttf", 28)
    font_xl    = ImageFont.truetype("Roboto-Bold.ttf", 46)  # Pour l'écran de fin
except IOError:
    print("⚠️ Polices introuvables. Télécharge Roboto-Bold.ttf !")
    font_tiny = font_small = font_med = font_xl = ImageFont.load_default()

# ==============================
# UTILITIES & EXIT SCREEN
# ==============================
def image_to_rgb565_fast(img):
    arr = np.array(img)
    r5 = (arr[:, :, 0] >> 3).astype(np.uint16)
    g6 = (arr[:, :, 1] >> 2).astype(np.uint16)
    b5 = (arr[:, :, 2] >> 3).astype(np.uint16)
    return ((r5 << 11) | (g6 << 5) | b5).tobytes()

def exit_clean(sig, frame):
    try:
        # Création de l'écran "Offline"
        offline_img = Image.new("RGB", (WIDTH, HEIGHT), (5, 5, 8)) # Noir profond
        draw = ImageDraw.Draw(offline_img)

        # Dessin du cadre stylé rouge "Danger/Offline"
        draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=(150, 20, 20), width=2)
        draw.line([20, 20, 40, 20], fill=(255, 50, 50), width=4)
        draw.line([20, 20, 20, 40], fill=(255, 50, 50), width=4)
        draw.line([WIDTH-40, HEIGHT-20, WIDTH-20, HEIGHT-20], fill=(255, 50, 50), width=4)
        draw.line([WIDTH-20, HEIGHT-40, WIDTH-20, HEIGHT-20], fill=(255, 50, 50), width=4)

        # Centrage du texte
        text_1 = "MOKART"
        text_2 = "// SYSTEM OFFLINE"

        try:
            bbox1 = font_xl.getbbox(text_1)
            w1 = bbox1[2] - bbox1[0]
            bbox2 = font_med.getbbox(text_2)
            w2 = bbox2[2] - bbox2[0]
        except AttributeError:
            w1 = len(text_1) * 20
            w2 = len(text_2) * 14

        draw.text(((WIDTH - w1) // 2, HEIGHT // 2 - 40), text_1, font=font_xl, fill=WHITE)
        draw.text(((WIDTH - w2) // 2, HEIGHT // 2 + 10), text_2, font=font_med, fill=RED)

        # Petit texte en bas
        now = time.strftime("%H:%M:%S")
        draw.text((20, HEIGHT - 35), f"SHUTDOWN AT {now}", font=font_tiny, fill=(100, 100, 100))

        # Envoi à l'écran
        data = image_to_rgb565_fast(offline_img)
        fb.seek(0)
        fb.write(data)
        fb.close()
    except Exception as e:
        print(f"Erreur lors de la fermeture : {e}")

    print("\nExited cleanly 🚀")
    sys.exit(0)

signal.signal(signal.SIGINT, exit_clean)

def get_temp():
    try:
        temps = psutil.sensors_temperatures()
        if "cpu_thermal" in temps:
            return int(temps["cpu_thermal"][0].current)
    except:
        pass
    return 0

# ==============================
# CLASSES
# ==============================
class SystemStats:
    def __init__(self):
        self.cpu_cache = 0
        self.mem_cache = 0
        self.wifi_ssid = "Scanning..."
        self.wifi_bars = 0
        self.wifi_color = CYAN
        self.last_update = 0

        self.wifi_thread = threading.Thread(target=self._wifi_worker, daemon=True)
        self.wifi_thread.start()

    def update_if_needed(self):
        now = time.time()
        if now - self.last_update >= 1.0:
            self.cpu_cache = int(psutil.cpu_percent())
            self.mem_cache = int(psutil.virtual_memory().percent)
            self.last_update = now

    def _wifi_worker(self):
        while True:
            try:
                cmd = r"nmcli -t -f IN-USE,SSID,BARS device wifi list | grep '^\*'"
                output = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL).strip()
                if output:
                    parts = output.split(':')
                    ssid, bars_str = parts[1], parts[2].strip()
                    count = len(bars_str.replace('_', '').replace(' ', ''))

                    if count >= 4: color = GREEN
                    elif count == 3: color = YELLOW
                    elif count == 2: color = ORANGE
                    else: color = RED

                    self.wifi_ssid, self.wifi_bars, self.wifi_color = ssid, count, color
                else:
                    self.wifi_ssid, self.wifi_bars, self.wifi_color = "Disconnected", 0, RED
            except:
                self.wifi_ssid, self.wifi_bars, self.wifi_color = "Offline", 0, RED
            time.sleep(3)


class LapManager:
    def __init__(self, track_length):
        self.track_length = track_length
        self.lap_start = time.time()
        self.last_lap = None
        self.reference_lap = None
        self.prev_idx = 0

    def update(self, idx):
        if self.prev_idx > self.track_length * 0.85 and idx < self.track_length * 0.15:
            elapsed = time.time() - self.lap_start
            self.last_lap = elapsed
            if self.reference_lap is None:
                self.reference_lap = elapsed
            self.lap_start = time.time()
        self.prev_idx = idx

    def current_lap_time(self):
        return time.time() - self.lap_start

    def live_delta(self, idx):
        if self.reference_lap is None:
            return None
        progress = idx / self.track_length
        ref_time_here = self.reference_lap * progress
        return self.current_lap_time() - ref_time_here

    @staticmethod
    def fmt(t):
        if t is None:
            return "--:--.---"
        mins = int(t) // 60
        secs = t % 60
        return f"{mins}:{secs:06.3f}"

# ==============================
# DRAWING HELPERS
# ==============================
def draw_wifi_bars(draw, x, y, count, color):
    for i in range(4):
        bar_h = 4 + (i * 3)
        bar_color = color if i < count else GRAY_DARK
        y_pos = y + (12 - bar_h)
        draw.rectangle([x + (i * 5), y_pos, x + (i * 5) + 3, y_pos + bar_h], fill=bar_color)

def get_mock_gforce(t):
    gx = math.sin(t * 0.9) * math.cos(t * 0.4) * 0.85
    gy = math.sin(t * 1.3 + 1.2) * 0.65
    return gx, gy

def draw_gforce_meter(draw, cx, cy, gx, gy, radius=25):
    # Radar plus grand
    draw.rectangle([cx - radius, cy - radius, cx + radius, cy + radius], fill=GRAY_DARK, outline=CYAN, width=1)
    draw.line([cx - radius, cy, cx + radius, cy], fill=(50, 60, 80), width=1)
    draw.line([cx, cy - radius, cx, cy + radius], fill=(50, 60, 80), width=1)

    bx = cx + int(gx * (radius - 3))
    by = cy - int(gy * (radius - 3))
    bx = max(cx - (radius - 3), min(cx + (radius - 3), bx))
    by = max(cy - (radius - 3), min(cy + (radius - 3), by))

    draw.ellipse([bx - 5, by - 5, bx + 5, by + 5], fill=MAGENTA)
    draw.ellipse([bx - 2, by - 2, bx + 2, by + 2], fill=WHITE)

# ==============================
# TRACK GENERATION
# ==============================
CONTROL_POINTS = [
    (253, 210), (229, 174), (225, 135),
    (251, 116), (277, 140), (260, 181),
    (278, 191), (396, 119), (452, 131),
    (451, 168), (408, 201), (353, 194),
    (318, 198), (299, 221), (311, 237),
    (367, 231), (388, 252), (364, 272),
    (232, 291), (221, 278), (265, 261),
    (272, 242)
]

def get_catmull_rom_path(points, subdivisions=15):
    route = []
    n = len(points)
    for i in range(n):
        p0 = points[(i - 1) % n]
        p1 = points[i]
        p2 = points[(i + 1) % n]
        p3 = points[(i + 2) % n]

        for t_step in range(subdivisions):
            t = t_step / subdivisions
            t2 = t * t
            t3 = t2 * t

            fx = 0.5 * (2*p1[0] + (-p0[0] + p2[0])*t + (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0])*t2 + (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0])*t3)
            fy = 0.5 * (2*p1[1] + (-p0[1] + p2[1])*t + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1])*t2 + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1])*t3)
            route.append((fx, fy))
    return route

SMOOTH_TRACK = get_catmull_rom_path(CONTROL_POINTS)
FINISH_LINE_POS = SMOOTH_TRACK[0]
SPEED_FACTOR = 0.01

def draw_track(draw, idx):
    if len(SMOOTH_TRACK) > 2:
        draw.line(SMOOTH_TRACK + [SMOOTH_TRACK[0]], fill=CYAN, width=3, joint="curve")

    fl = (int(FINISH_LINE_POS[0]), int(FINISH_LINE_POS[1]))
    draw.ellipse([fl[0]-4, fl[1]-4, fl[0]+4, fl[1]+4], outline=WHITE, width=1)

    pos = SMOOTH_TRACK[idx]
    draw.ellipse([int(pos[0])-5, int(pos[1])-5, int(pos[0])+5, int(pos[1])+5], fill=WHITE)
    draw.ellipse([int(pos[0])-3, int(pos[1])-3, int(pos[0])+3, int(pos[1])+3], fill=CYAN)

# ==============================
# MAIN LOOP
# ==============================
stats = SystemStats()
lap_manager = LapManager(len(SMOOTH_TRACK))

last_timer_update = 0.0
delta_display = None
start_program_time = time.time()

while True:
    frame_start = time.time()

    stats.update_if_needed()

    t_sec = time.time() - start_program_time
    current_ticks = int(t_sec * 1000)
    track_idx = int((current_ticks * SPEED_FACTOR) % len(SMOOTH_TRACK))

    image = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(image)

    # --- Header --- (Hauteur augmentée à 35px)
    draw.rectangle([0, 0, WIDTH, 35], fill=CYAN)
    draw.text((10, 6), "MOKART PROTOTYPE", font=font_small, fill=BG_COLOR)
    draw.text((385, 6), time.strftime("%H:%M:%S"), font=font_small, fill=BG_COLOR)

    # --- WiFi ---
    w_color = stats.wifi_color
    if stats.wifi_ssid == "Disconnected" and (current_ticks // 500) % 2:
        w_color = BG_COLOR

    try:
        bbox = font_tiny.getbbox(stats.wifi_ssid)
        text_w = bbox[2] - bbox[0]
    except AttributeError:
        text_w = len(stats.wifi_ssid) * 8

    draw.text((440 - text_w, 45), stats.wifi_ssid, font=font_tiny, fill=w_color)
    draw_wifi_bars(draw, 450, 46, stats.wifi_bars, w_color)

    # --- LEFT PANEL (Ré-espacé pour les grandes polices) ---

    # CPU
    draw.text((10, 45), f"PROCESSOR LOAD: {stats.cpu_cache}%", font=font_tiny, fill=CYAN)
    draw.rectangle([10, 62, 170, 72], fill=GRAY_DARK)
    draw.rectangle([10, 62, 10 + int(160 * (stats.cpu_cache / 100)), 72], fill=CYAN)

    # Memory
    draw.text((10, 80), f"MEMORY USAGE: {stats.mem_cache}%", font=font_tiny, fill=MAGENTA)
    draw.rectangle([10, 97, 170, 107], fill=GRAY_DARK)
    draw.rectangle([10, 97, 10 + int(160 * (stats.mem_cache / 100)), 107], fill=MAGENTA)

    # Speed
    draw.text((10, 115), "0 km/h", font=font_med, fill=CYAN)

    # Delta indicator
    now = time.time()
    if now - last_timer_update >= 0.5:
        delta_display = lap_manager.live_delta(track_idx)
        last_timer_update = now

    if delta_display is not None:
        sign = "+" if delta_display >= 0 else ""
        delta_color = GREEN if delta_display < 0 else RED
        draw.text((10, 145), f"{sign}{delta_display:.3f}s", font=font_tiny, fill=delta_color)
    else:
        draw.text((10, 145), "REF LAP", font=font_tiny, fill=GRAY_DARK)

    # G-Force meter (Plus grand, décalé vers le bas)
    draw.text((10, 165), "G-FORCE", font=font_tiny, fill=CYAN)
    gx, gy = get_mock_gforce(t_sec)
    draw_gforce_meter(draw, 40, 215, gx, gy, radius=25)

    # Lap times
    curr_t = lap_manager.current_lap_time()
    draw.text((10, 245), f"CURR  {LapManager.fmt(curr_t)}", font=font_tiny, fill=WHITE)
    draw.text((10, 265), f"LAST  {LapManager.fmt(lap_manager.last_lap)}", font=font_tiny, fill=CYAN)

    # CPU temp
    temp = get_temp()
    draw.text((10, 285), f"> CPU_TEMP: {temp}°C", font=font_tiny, fill=CYAN)

    # Screen resolution (bottom left)
    draw.text((10, 305), f"{WIDTH}x{HEIGHT}", font=font_tiny, fill=WHITE)

    # --- TRACK ---
    draw_track(draw, track_idx)
    lap_manager.update(track_idx)

    # ==============================
    # RENDER TO FRAMEBUFFER
    # ==============================
    data = image_to_rgb565_fast(image)
    fb.seek(0)
    fb.write(data)

    # Cap FPS
    elapsed = time.time() - frame_start
    wait = FRAME_TIME - elapsed
    if wait > 0:
        time.sleep(wait)
