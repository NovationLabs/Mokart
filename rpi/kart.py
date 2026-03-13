#!/usr/bin/env python3
"""
mokart-1 / mokart-2 (kart client)
Envoie la telemetrie au serveur et recoit l'etat global.

Le kart_id est automatiquement le hostname de la machine.
Le server_id est automatiquement "mokart-test.local".
"""

import socket
import json
import time
import threading
import platform

UDP_PORT = 5005        # port du serveur (envoi)
BROADCAST_PORT = 5006  # port broadcast (reception)

def get_cpu_temp():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            return int(f.read().strip()) // 1000
    except:
        return 0

def get_cpu_percent():
    try:
        with open("/proc/stat", "r") as f:
            fields = [float(c) for c in f.readline().strip().split()[1:]]
        return fields[3], sum(fields)  # idle, total
    except:
        return 0, 1

def get_mem_percent():
    try:
        with open("/proc/meminfo", "r") as f:
            lines = f.readlines()
        total = int(lines[0].split()[1])
        available = int(lines[2].split()[1])
        return int(100 * (total - available) / total)
    except:
        return 0


class MokartKart:
    def __init__(self, kart_id: str, server_host: str):
        self.kart_id = kart_id
        self.server_host = server_host
        self.server_addr = (server_host, UDP_PORT)
        self.running = False
        self.other_karts = {}

        # CPU percent tracking
        self._last_idle = 0
        self._last_total = 0
        self.cpu_percent = 0
        self._last_stats_update = 0

        # Socket d'envoi
        self.send_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

        # Socket de reception broadcast
        self.recv_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.recv_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.recv_sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        self.recv_sock.bind(("0.0.0.0", BROADCAST_PORT))
        self.recv_sock.settimeout(1.0)

    def _update_cpu_percent(self):
        idle, total = get_cpu_percent()
        idle_d = idle - self._last_idle
        total_d = total - self._last_total
        self._last_idle, self._last_total = idle, total
        if total_d > 0:
            self.cpu_percent = int(100.0 * (1.0 - idle_d / total_d))

    def start(self):
        self.running = True
        print(f"[{self.kart_id}] Envoi vers {self.server_host}:{UDP_PORT}")

        recv_thread = threading.Thread(target=self._receive_loop, daemon=True)
        recv_thread.start()

        try:
            while self.running:
                self._send_telemetry()
                time.sleep(0.033)  # ~30 Hz
        except KeyboardInterrupt:
            self.running = False
            print(f"\n[{self.kart_id}] Arret.")

    def _send_telemetry(self):
        """Envoie un paquet de telemetrie au serveur."""
        now = time.time()
        if now - self._last_stats_update >= 1.0:
            self._update_cpu_percent()
            self._last_stats_update = now

        packet = {
            "kart_id": self.kart_id,
            "timestamp": now,
            "cpu_temp": get_cpu_temp(),
            "cpu_percent": self.cpu_percent,
            "mem_percent": get_mem_percent(),
            # TODO: remplacer par les vraies donnees capteurs
            "x": 0.0,
            "y": 0.0,
            "speed": 0.0,
            "steering": 0.0,
            "imu_ax": 0.0,
            "imu_ay": 0.0,
            "imu_az": 0.0,
            "imu_gx": 0.0,
            "imu_gy": 0.0,
            "imu_gz": 0.0,
            "lap": 0,
        }

        payload = json.dumps(packet).encode()
        try:
            self.send_sock.sendto(payload, self.server_addr)
        except OSError as e:
            print(f"[{self.kart_id}] Erreur envoi: {e}")

    def _receive_loop(self):
        """Recoit l'etat global broadcast par le serveur."""
        while self.running:
            try:
                data, _ = self.recv_sock.recvfrom(4096)
                state = json.loads(data.decode())

                if state.get("type") == "state":
                    self.other_karts = {
                        k: v for k, v in state.get("karts", {}).items()
                        if k != self.kart_id
                    }

            except socket.timeout:
                continue
            except json.JSONDecodeError:
                continue


if __name__ == "__main__":
    kart_id = platform.node()
    server_host = "mokart-test.local"

    kart = MokartKart(kart_id, server_host)
    kart.start()
