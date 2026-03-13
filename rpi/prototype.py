import os
import sys
import time
import random
import math
import pygame
import signal
import subprocess
import threading

def signal_handler(sig, frame):
    pygame.quit()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

os.environ["SDL_VIDEO_CENTERED"] = "1"
pygame.init()
pygame.mouse.set_visible(False)

info = pygame.display.Info()
if info.current_w == 1920 and info.current_h == 1080:
    SCREEN_WIDTH, SCREEN_HEIGHT = 1920, 1080
    FLAGS = pygame.FULLSCREEN | pygame.DOUBLEBUF | pygame.HWSURFACE
else:
    SCREEN_WIDTH, SCREEN_HEIGHT = 480, 320
    FLAGS = pygame.DOUBLEBUF

screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), FLAGS)
surface = pygame.Surface((480, 320))

BG_COLOR    = (5, 8, 15)
CYAN        = (34, 211, 238)
MAGENTA     = (255, 0, 255)
WHITE       = (255, 255, 255)
GRAY_DARK   = (30, 35, 45)
RED         = (255, 40, 40)
ORANGE      = (255, 165, 0)
YELLOW      = (255, 255, 0)
GREEN       = (0, 255, 100)

font_tiny  = pygame.font.SysFont("arial", 12, bold=True)
font_small = pygame.font.SysFont("arial", 16, bold=True)
font_med   = pygame.font.SysFont("arial", 20, bold=True)
font_big   = pygame.font.SysFont("arial", 70, bold=True)
font_count = pygame.font.SysFont("arial", 120, bold=True)

class SystemStats:
    def __init__(self):
        self.last_idle = 0
        self.last_total = 0
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
            self.cpu_cache = self._get_cpu_percent()
            self.mem_cache = self._get_mem_percent()
            self.last_update = now

    def _get_cpu_percent(self):
        try:
            with open('/proc/stat', 'r') as f:
                fields = [float(column) for column in f.readline().strip().split()[1:]]
            idle, total = fields[3], sum(fields)
            idle_delta, total_delta = idle - self.last_idle, total - self.last_total
            self.last_idle, self.last_total = idle, total
            return int(100.0 * (1.0 - idle_delta / total_delta)) if total_delta != 0 else 0
        except: return 0

    def _get_mem_percent(self):
        try:
            with open('/proc/meminfo', 'r') as f:
                lines = f.readlines()
            total, available = int(lines[0].split()[1]), int(lines[2].split()[1])
            return int(100 * (total - available) / total)
        except: return 0

    def _wifi_worker(self):
        while True:
            try:
                cmd = r"nmcli -t -f IN-USE,SSID,BARS device wifi list | grep '^\*'"
                output = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL).strip()
                parts = output.split(':')
                ssid, bars_str = parts[1], parts[2].strip()
                count = len(bars_str.replace('_', '').replace(' ', ''))

                if count >= 4: color = GREEN
                elif count == 3: color = YELLOW
                elif count == 2: color = ORANGE
                else: color = RED

                self.wifi_ssid, self.wifi_bars, self.wifi_color = ssid, count, color
            except:
                self.wifi_ssid, self.wifi_bars, self.wifi_color = "Disconnected", 0, RED
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
        # Compare current elapsed time to where the reference lap was at this same position
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

def draw_wifi_bars(surf, x, y, count, color):
    for i in range(4):
        bar_h = 4 + (i * 3)
        bar_color = color if i < count else GRAY_DARK
        pygame.draw.rect(surf, bar_color, (x + (i * 5), y + (12 - bar_h), 3, bar_h))

def get_mock_gforce(t):
    """Returns (gx, gy) in range [-1, 1] using time-based sine waves."""
    gx = math.sin(t * 0.9) * math.cos(t * 0.4) * 0.85
    gy = math.sin(t * 1.3 + 1.2) * 0.65
    return gx, gy

def draw_gforce_meter(surf, cx, cy, gx, gy):
    """Draw a 40x40 G-force crosshair at center (cx, cy) with a G-BALL dot."""
    # Background box
    pygame.draw.rect(surf, GRAY_DARK, (cx - 20, cy - 20, 40, 40))
    # Crosshair lines
    pygame.draw.line(surf, (50, 60, 80), (cx - 20, cy), (cx + 20, cy), 1)
    pygame.draw.line(surf, (50, 60, 80), (cx, cy - 20), (cx, cy + 20), 1)
    # Border
    pygame.draw.rect(surf, CYAN, (cx - 20, cy - 20, 40, 40), 1)
    # G-BALL position (clamp within box)
    bx = cx + int(gx * 18)
    by = cy - int(gy * 18)
    bx = max(cx - 18, min(cx + 18, bx))
    by = max(cy - 18, min(cy + 18, by))
    pygame.draw.circle(surf, MAGENTA, (bx, by), 4)
    pygame.draw.circle(surf, WHITE, (bx, by), 2)

stats = SystemStats()

# --- CIRCUIT SPEEDKART ---
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
    """Génère une liste de points lissés via spline de Catmull-Rom."""
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

# Génération du tracé lisse une seule fois au démarrage
SMOOTH_TRACK = get_catmull_rom_path(CONTROL_POINTS)

# Finish line: a short segment drawn at index 0 of SMOOTH_TRACK
FINISH_LINE_POS = SMOOTH_TRACK[0]

lap_manager = LapManager(len(SMOOTH_TRACK))

SPEED_FACTOR = 0.01

def draw_track(surf, idx):
    """Draw the circuit and animated dot at the given track index."""
    if len(SMOOTH_TRACK) > 2:
        pygame.draw.lines(surf, CYAN, True, SMOOTH_TRACK, 3)

    # Finish line marker
    fl = (int(FINISH_LINE_POS[0]), int(FINISH_LINE_POS[1]))
    pygame.draw.circle(surf, WHITE, fl, 4, 1)

    pos = SMOOTH_TRACK[idx]
    pygame.draw.circle(surf, WHITE, (int(pos[0]), int(pos[1])), 5)
    pygame.draw.circle(surf, CYAN, (int(pos[0]), int(pos[1])), 3)

clock = pygame.time.Clock()
last_timer_update = 0.0
delta_display = None
while True:
    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            pygame.quit(); sys.exit()

    stats.update_if_needed()
    current_ticks = pygame.time.get_ticks()
    t_sec = current_ticks / 1000.0
    track_idx = int((current_ticks * SPEED_FACTOR) % len(SMOOTH_TRACK))

    surface.fill(BG_COLOR)

    # --- Header ---
    pygame.draw.rect(surface, CYAN, (0, 0, 480, 30))
    surface.blit(font_small.render("MOKART PROTOTYPE", True, BG_COLOR), (10, 5))
    surface.blit(font_small.render(time.strftime("%H:%M:%S"), True, BG_COLOR), (390, 5))

    # --- WiFi ---
    w_color = stats.wifi_color
    if stats.wifi_ssid == "Disconnected" and (current_ticks // 500) % 2:
        w_color = BG_COLOR
    ssid_txt = font_tiny.render(stats.wifi_ssid, True, w_color)
    surface.blit(ssid_txt, (450 - ssid_txt.get_width(), 40))
    draw_wifi_bars(surface, 455, 41, stats.wifi_bars, w_color)

    # --- LEFT PANEL ---

    # CPU
    surface.blit(font_tiny.render(f"PROCESSOR LOAD: {stats.cpu_cache}%", True, CYAN), (10, 50))
    pygame.draw.rect(surface, GRAY_DARK, (10, 62, 150, 8))
    pygame.draw.rect(surface, CYAN, (10, 62, int(150 * (stats.cpu_cache / 100)), 8))

    # Memory
    surface.blit(font_tiny.render(f"MEMORY USAGE: {stats.mem_cache}%", True, MAGENTA), (10, 76))
    pygame.draw.rect(surface, GRAY_DARK, (10, 88, 150, 8))
    pygame.draw.rect(surface, MAGENTA, (10, 88, int(150 * (stats.mem_cache / 100)), 8))

    # Speed
    surface.blit(font_med.render("0 km/h", True, CYAN), (10, 103))

    # Delta indicator (live vs reference lap at current position, refresh at 2 Hz)
    now = time.time()
    if now - last_timer_update >= 0.5:
        delta_display = lap_manager.live_delta(track_idx)
        last_timer_update = now
    if delta_display is not None:
        sign = "+" if delta_display >= 0 else ""
        delta_color = GREEN if delta_display < 0 else RED
        surface.blit(font_tiny.render(f"{sign}{delta_display:.3f}s", True, delta_color), (10, 127))
    else:
        surface.blit(font_tiny.render("REF LAP", True, GRAY_DARK), (10, 127))

    # G-Force meter
    surface.blit(font_tiny.render("G-FORCE", True, CYAN), (10, 146))
    gx, gy = get_mock_gforce(t_sec)
    draw_gforce_meter(surface, 30, 180, gx, gy)

    # Lap times
    curr_t = lap_manager.current_lap_time()
    surface.blit(font_tiny.render(f"CURR LAP  {LapManager.fmt(curr_t)}", True, WHITE), (10, 216))
    surface.blit(font_tiny.render(f"LAST LAP  {LapManager.fmt(lap_manager.last_lap)}", True, CYAN), (10, 230))

    # CPU temp
    surface.blit(font_tiny.render(f"> CPU_TEMP: {40 + stats.cpu_cache // 10}°C", True, CYAN), (10, 250))

    # Screen resolution (bottom left)
    surface.blit(font_tiny.render(f"{info.current_w}x{info.current_h}", True, WHITE), (10, 308))

    # --- TRACK ---
    draw_track(surface, track_idx)
    lap_manager.update(track_idx)

    screen.blit(pygame.transform.scale(surface, (SCREEN_WIDTH, SCREEN_HEIGHT)), (0, 0))
    pygame.display.flip()
    clock.tick(30)
