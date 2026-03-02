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
CYAN        = (0, 255, 255)
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
                output = subprocess.check_output(cmd, shell=True, text=True).strip()
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

def draw_wifi_bars(surf, x, y, count, color):
    for i in range(4):
        bar_h = 4 + (i * 3)
        bar_color = color if i < count else GRAY_DARK
        pygame.draw.rect(surf, bar_color, (x + (i * 5), y + (12 - bar_h), 3, bar_h))

stats = SystemStats()

# --- CIRCUIT SPEEDKART --- 480x320 ||1024x644
'''CONTROL_POINTS = [
    (340, 275), (310, 270), (280, 260), (260, 230),
    (240, 210), (220, 195), (230, 180), (260, 185),
    (290, 205), (305, 180), (310, 140), (320, 100),
    (330, 75),  (355, 70),  (380, 85),  (390, 120),
    (385, 160), (370, 190), (380, 210), (410, 200),
    (435, 195), (450, 210), (455, 240), (445, 270),
    (425, 290), (390, 300), (365, 290)
]

CONTROL_POINTS = [
    (159,329), (86,221), (74,106),
    (153,49), (230,119), (180,244),
    (233,272), (587,56), (756,92),
    (752,205), (623,304), (461,283),
    (353,293), (296,362), (333, 412),
    (501,394), (564,457), (492,515),
    (96,572), (62, 533), (195, 482),
    (216, 427)
]

CONTROL_POINTS = [
    (53, 110), (29, 74), (25, 35),
    (51, 16), (77, 40), (60, 81),
    (78, 91), (196, 19), (252, 31),
    (251, 68), (208, 101), (153, 94),
    (118, 98), (99, 121), (111, 137),
    (167, 131), (188, 152), (164, 172),
    (32, 191), (21, 178), (65, 161),
    (72, 142)
]'''

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
        # On récupère 4 points pour la spline (p0, p1, p2, p3)
        p0 = points[(i - 1) % n]
        p1 = points[i]
        p2 = points[(i + 1) % n]
        p3 = points[(i + 2) % n]

        for t_step in range(subdivisions):
            t = t_step / subdivisions
            t2 = t * t
            t3 = t2 * t

            # Formule de Catmull-Rom
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                (-p0[0] + 3 * p1[1] - 3 * p2[0] + p3[0]) * t3) # Note: correction index ici

            # Correction de la formule pour X et Y
            fx = 0.5 * (2*p1[0] + (-p0[0] + p2[0])*t + (2*p0[0] - 5*p1[0] + 4*p2[0] - p3[0])*t2 + (-p0[0] + 3*p1[0] - 3*p2[0] + p3[0])*t3)
            fy = 0.5 * (2*p1[1] + (-p0[1] + p2[1])*t + (2*p0[1] - 5*p1[1] + 4*p2[1] - p3[1])*t2 + (-p0[1] + 3*p1[1] - 3*p2[1] + p3[1])*t3)
            route.append((fx, fy))
    return route

# Génération du tracé lisse une seule fois au démarrage
SMOOTH_TRACK = get_catmull_rom_path(CONTROL_POINTS)

def draw_track(surf, ticks):
    # 1. Dessin de l'ombre/bordure du circuit pour l'épaisseur
    if len(SMOOTH_TRACK) > 2:
        # Trace le contour néon
        pygame.draw.lines(surf, CYAN, True, SMOOTH_TRACK, 3)

    # 2. Animation du point (la voiture)
    # On utilise la longueur de SMOOTH_TRACK pour la vitesse
    speed_factor = 0.01
    idx = int((ticks * speed_factor) % len(SMOOTH_TRACK))
    pos = SMOOTH_TRACK[idx]

    # Cercle de position avec lueur
    pygame.draw.circle(surf, WHITE, (int(pos[0]), int(pos[1])), 5)
    pygame.draw.circle(surf, CYAN, (int(pos[0]), int(pos[1])), 3)


# --- STARTUP ---
for i in range(3, 0, -1):
    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            pygame.quit(); sys.exit()
    surface.fill(BG_COLOR)
    txt = font_count.render(str(i), True, CYAN)
    surface.blit(txt, (240 - txt.get_width()//2, 160 - txt.get_height()//2))
    screen.blit(pygame.transform.scale(surface, (SCREEN_WIDTH, SCREEN_HEIGHT)), (0, 0))
    pygame.display.flip()
    time.sleep(1)

clock = pygame.time.Clock()
while True:
    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            pygame.quit(); sys.exit()

    stats.update_if_needed()
    current_ticks = pygame.time.get_ticks()

    surface.fill(BG_COLOR)

    # Header
    pygame.draw.rect(surface, CYAN, (0, 0, 480, 30))
    surface.blit(font_small.render("MOKART TELEMETRY REAL-TIME", True, BG_COLOR), (10, 5))
    surface.blit(font_small.render(time.strftime("%H:%M:%S"), True, BG_COLOR), (390, 5))

    # WiFi
    w_color = stats.wifi_color
    if stats.wifi_ssid == "Disconnected" and (current_ticks // 500) % 2: w_color = BG_COLOR
    ssid_txt = font_tiny.render(stats.wifi_ssid, True, w_color)
    surface.blit(ssid_txt, (450 - ssid_txt.get_width(), 40))
    draw_wifi_bars(surface, 455, 41, stats.wifi_bars, w_color)

    # --- PARTIE GAUCHE : STATS & VITESSE ---
    # CPU
    surface.blit(font_tiny.render(f"PROCESSOR LOAD: {stats.cpu_cache}%", True, CYAN), (20, 50))
    pygame.draw.rect(surface, GRAY_DARK, (20, 65, 150, 10))
    pygame.draw.rect(surface, CYAN, (20, 65, int(150 * (stats.cpu_cache/100)), 10))

    # MEMORY
    surface.blit(font_tiny.render(f"MEMORY USAGE: {stats.mem_cache}%", True, MAGENTA), (20, 85))
    pygame.draw.rect(surface, GRAY_DARK, (20, 100, 150, 10))
    pygame.draw.rect(surface, MAGENTA, (20, 100, int(150 * (stats.mem_cache/100)), 10))

    surface.blit(font_med.render("0 km/h", True, CYAN), (80, 155))

    # LOGS / SYSTEM NOMINAL
    status_y = 240
    pygame.draw.line(surface, CYAN, (20, 230), (170, 230), 1)
    for i, msg in enumerate(["> SYSTEM_NOMINAL", f"> CPU_TEMP: {40+stats.cpu_cache//10}°C", "> GPS_LOCKED"]):
        surface.blit(font_tiny.render(msg, True, CYAN), (20, status_y + (i*15)))

    # --- TRACK ---
    draw_track(surface, current_ticks)

    screen.blit(pygame.transform.scale(surface, (SCREEN_WIDTH, SCREEN_HEIGHT)), (0, 0))
    pygame.display.flip()
    clock.tick(30)
