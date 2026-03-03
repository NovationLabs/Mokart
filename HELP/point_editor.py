#!/usr/bin/env python3
import tkinter as tk
import csv
import sys
import math
import os

class PointEditor:
    def __init__(self, root, csv_file):
        self.root = root
        self.csv_file = csv_file

        # Fenêtre principale
        self.root.title(f"Éditeur de points - {csv_file}")

        # Frame principal
        main_frame = tk.Frame(root)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Canvas pour le dessin
        self.canvas = tk.Canvas(main_frame, width=800, height=600, bg="white")
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Panel de contrôle
        control_frame = tk.Frame(main_frame, width=200, bg="lightgray")
        control_frame.pack(side=tk.RIGHT, fill=tk.Y)

        # Labels d'info
        self.info_label = tk.Label(control_frame, text="Cliquez sur un point", bg="lightgray")
        self.info_label.pack(pady=10)

        self.coords_label = tk.Label(control_frame, text="X: 0, Y: 0", bg="lightgray", font=("Courier", 10))
        self.coords_label.pack(pady=5)

        self.coords_mm_label = tk.Label(control_frame, text="X: 0mm, Y: 0mm", bg="lightgray", font=("Courier", 10))
        self.coords_mm_label.pack(pady=5)

        # Boutons de navigation
        nav_frame = tk.Frame(control_frame, bg="lightgray")
        nav_frame.pack(pady=20)

        tk.Label(nav_frame, text="Déplacer point sélectionné:", bg="lightgray").pack()

        # Flèches directionnelles
        arrow_frame = tk.Frame(nav_frame, bg="lightgray")
        arrow_frame.pack(pady=10)

        tk.Button(arrow_frame, text="↑", command=lambda: self.move_point(0, -1), width=3).grid(row=0, column=1)
        tk.Button(arrow_frame, text="←", command=lambda: self.move_point(-1, 0), width=3).grid(row=1, column=0)
        tk.Button(arrow_frame, text="→", command=lambda: self.move_point(1, 0), width=3).grid(row=1, column=2)
        tk.Button(arrow_frame, text="↓", command=lambda: self.move_point(0, 1), width=3).grid(row=2, column=1)

        # Pas de déplacement
        tk.Label(nav_frame, text="Pas de déplacement:", bg="lightgray").pack()
        self.step_var = tk.IntVar(value=1)
        tk.Radiobutton(nav_frame, text="1px", variable=self.step_var, value=1, bg="lightgray").pack()
        tk.Radiobutton(nav_frame, text="5px", variable=self.step_var, value=5, bg="lightgray").pack()
        tk.Radiobutton(nav_frame, text="10px", variable=self.step_var, value=10, bg="lightgray").pack()

        # Bouton sauvegarder
        tk.Button(control_frame, text="Sauvegarder CSV", command=self.save_csv, bg="green", fg="white").pack(pady=20)

        # Données
        self.trajectoire = []
        self.bordure_exterieure = []
        self.bordure_interieure = []

        # Point sélectionné
        self.selected_point = None
        self.selected_type = None
        self.selected_index = None

        # Échelle (1 pixel = 1mm par défaut)
        self.scale = 1.0
        self.offset_x = 0
        self.offset_y = 0

        # Chargement des données
        self.load_csv()
        self.center_view()
        self.draw_all()

        # Bindings
        self.canvas.bind("<Button-1>", self.on_click)
        self.canvas.bind("<MouseWheel>", self.on_zoom)  # Windows
        self.canvas.bind("<Button-4>", self.on_zoom)    # Linux scroll up
        self.canvas.bind("<Button-5>", self.on_zoom)    # Linux scroll down
        self.canvas.bind("<Button-2>", self.start_pan)   # Middle mouse button
        self.canvas.bind("<B2-Motion>", self.pan)        # Drag with middle button
        self.root.bind("<Left>", lambda e: self.move_point(-1, 0))
        self.root.bind("<Right>", lambda e: self.move_point(1, 0))
        self.root.bind("<Up>", lambda e: self.move_point(0, -1))
        self.root.bind("<Down>", lambda e: self.move_point(0, 1))

        # Boutons de zoom
        zoom_frame = tk.Frame(control_frame, bg="lightgray")
        zoom_frame.pack(pady=10)

        tk.Label(zoom_frame, text="Zoom:", bg="lightgray").pack()
        zoom_buttons = tk.Frame(zoom_frame, bg="lightgray")
        zoom_buttons.pack()

        tk.Button(zoom_buttons, text="+", command=lambda: self.zoom(1.2), width=3).grid(row=0, column=0)
        tk.Button(zoom_buttons, text="-", command=lambda: self.zoom(0.8), width=3).grid(row=0, column=1)
        tk.Button(zoom_buttons, text="100%", command=self.reset_zoom, width=4).grid(row=1, column=0, columnspan=2)

        self.zoom_label = tk.Label(zoom_frame, text="100%", bg="lightgray", font=("Courier", 9))
        self.zoom_label.pack()

    def load_csv(self):
        current_section = None

        with open(self.csv_file, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if not row:
                    continue

                if row[0] in ['trajectoire', 'bordure_exterieure', 'bordure_interieure']:
                    current_section = row[0]
                elif len(row) >= 3 and current_section:
                    try:
                        index = int(row[0])
                        x = float(row[1])
                        y = float(row[2])

                        point = {'index': index, 'x': x, 'y': y}

                        if current_section == 'trajectoire':
                            self.trajectoire.append(point)
                        elif current_section == 'bordure_exterieure':
                            self.bordure_exterieure.append(point)
                        elif current_section == 'bordure_interieure':
                            self.bordure_interieure.append(point)
                    except ValueError:
                        continue

    def draw_all(self):
        self.canvas.delete("all")

        # Dessiner la trajectoire
        self.draw_polyline(self.trajectoire, "blue", 2)
        self.draw_points(self.trajectoire, "blue", "T")

        # Dessiner les bordures
        self.draw_polyline(self.bordure_exterieure, "red", 2)
        self.draw_points(self.bordure_exterieure, "red", "E")

        self.draw_polyline(self.bordure_interieure, "green", 2)
        self.draw_points(self.bordure_interieure, "green", "I")

        # Mettre en évidence le point sélectionné
        if self.selected_point:
            x, y = self.transform_point(self.selected_point['x'], self.selected_point['y'])
            r = 8 * self.scale
            self.canvas.create_oval(x-r, y-r, x+r, y+r, fill="yellow", outline="orange", width=2)

    def draw_polyline(self, points, color, width):
        if len(points) < 2:
            return

        for i in range(len(points)):
            x1, y1 = self.transform_point(points[i]['x'], points[i]['y'])
            x2, y2 = self.transform_point(points[(i+1) % len(points)]['x'], points[(i+1) % len(points)]['y'])
            self.canvas.create_line(x1, y1, x2, y2, fill=color, width=width)

    def draw_points(self, points, color, prefix):
        for point in points:
            x, y = self.transform_point(point['x'], point['y'])
            r = 4 * self.scale
            self.canvas.create_oval(x-r, y-r, x+r, y+r, fill=color, outline="darkgray")
            font_size = max(6, int(8 * self.scale))
            self.canvas.create_text(x, y-10*self.scale, text=f"{prefix}{point['index']}", font=("Arial", font_size))

    def transform_point(self, x, y):
        """Transforme les coordonnées du monde vers les coordonnées écran"""
        screen_x = x * self.scale + self.offset_x
        screen_y = y * self.scale + self.offset_y
        return screen_x, screen_y

    def inverse_transform_point(self, screen_x, screen_y):
        """Transforme les coordonnées écran vers les coordonnées du monde"""
        world_x = (screen_x - self.offset_x) / self.scale
        world_y = (screen_y - self.offset_y) / self.scale
        return world_x, world_y

    def center_view(self):
        """Centre la vue sur tous les points"""
        if not (self.trajectoire or self.bordure_exterieure or self.bordure_interieure):
            return

        all_points = []
        all_points.extend(self.trajectoire)
        all_points.extend(self.bordure_exterieure)
        all_points.extend(self.bordure_interieure)

        min_x = min(p['x'] for p in all_points)
        max_x = max(p['x'] for p in all_points)
        min_y = min(p['y'] for p in all_points)
        max_y = max(p['y'] for p in all_points)

        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2

        canvas_width = 800
        canvas_height = 600

        # Calculer l'échelle pour que tout soit visible
        padding = 50
        scale_x = (canvas_width - 2*padding) / (max_x - min_x) if max_x != min_x else 1
        scale_y = (canvas_height - 2*padding) / (max_y - min_y) if max_y != min_y else 1

        self.scale = min(scale_x, scale_y, 2.0)  # Limiter le zoom max à 2x

        self.offset_x = canvas_width/2 - center_x * self.scale
        self.offset_y = canvas_height/2 - center_y * self.scale

    def zoom(self, factor):
        """Zoom avec facteur (>1 pour zoom avant, <1 pour zoom arrière)"""
        # Zoom vers le centre du canvas
        canvas_center_x = 400
        canvas_center_y = 300

        # Convertir le centre en coordonnées monde
        world_center_x, world_center_y = self.inverse_transform_point(canvas_center_x, canvas_center_y)

        # Appliquer le zoom
        new_scale = self.scale * factor
        new_scale = max(0.1, min(new_scale, 10.0))  # Limiter entre 0.1x et 10x

        # Recalculer l'offset pour garder le centre fixe
        self.offset_x = canvas_center_x - world_center_x * new_scale
        self.offset_y = canvas_center_y - world_center_y * new_scale

        self.scale = new_scale
        self.update_zoom_label()
        self.draw_all()

    def reset_zoom(self):
        """Remet le zoom à 100% et recentre"""
        self.center_view()
        self.update_zoom_label()
        self.draw_all()

    def on_zoom(self, event):
        """Gestion du zoom avec molette de souris"""
        if event.delta:
            # Windows
            factor = 1.1 if event.delta > 0 else 0.9
        else:
            # Linux
            factor = 1.1 if event.num == 4 else 0.9

        # Zoom vers la position de la souris
        mouse_x, mouse_y = event.x, event.y
        world_mouse_x, world_mouse_y = self.inverse_transform_point(mouse_x, mouse_y)

        new_scale = self.scale * factor
        new_scale = max(0.1, min(new_scale, 10.0))

        # Recalculer l'offset pour garder la position de la souris fixe
        self.offset_x = mouse_x - world_mouse_x * new_scale
        self.offset_y = mouse_y - world_mouse_y * new_scale

        self.scale = new_scale
        self.update_zoom_label()
        self.draw_all()

    def start_pan(self, event):
        """Commence le déplacement (pan)"""
        self.pan_start_x = event.x
        self.pan_start_y = event.y

    def pan(self, event):
        """Déplace la vue"""
        dx = event.x - self.pan_start_x
        dy = event.y - self.pan_start_y

        self.offset_x += dx
        self.offset_y += dy

        self.pan_start_x = event.x
        self.pan_start_y = event.y

        self.draw_all()

    def update_zoom_label(self):
        """Met à jour le label de zoom"""
        zoom_percent = int(self.scale * 100)
        self.zoom_label.config(text=f"{zoom_percent}%")

    def on_click(self, event):
        screen_x, screen_y = event.x, event.y

        # Convertir en coordonnées monde pour la recherche
        world_x, world_y = self.inverse_transform_point(screen_x, screen_y)

        # Chercher le point le plus proche
        min_dist = float('inf')
        closest = None

        for point_type, points in [('trajectoire', self.trajectoire),
                                  ('bordure_exterieure', self.bordure_exterieure),
                                  ('bordure_interieure', self.bordure_interieure)]:
            for i, point in enumerate(points):
                dist = math.sqrt((point['x'] - world_x)**2 + (point['y'] - world_y)**2)
                # Tolérance adaptative selon le zoom
                tolerance = 10 / self.scale
                if dist < min_dist and dist < tolerance:
                    min_dist = dist
                    closest = (point_type, i, point)

        if closest:
            self.selected_type, self.selected_index, self.selected_point = closest
            self.update_info()
            self.draw_all()
        else:
            self.selected_point = None
            self.selected_type = None
            self.selected_index = None
            self.info_label.config(text="Cliquez sur un point")
            self.coords_label.config(text="X: 0, Y: 0")
            self.coords_mm_label.config(text="X: 0mm, Y: 0mm")
            self.draw_all()

    def move_point(self, dx, dy):
        if not self.selected_point:
            return

        step = self.step_var.get()
        self.selected_point['x'] += dx * step
        self.selected_point['y'] += dy * step

        self.update_info()
        self.draw_all()

    def update_info(self):
        if self.selected_point:
            x, y = self.selected_point['x'], self.selected_point['y']
            type_name = {
                'trajectoire': 'Trajectoire',
                'bordure_exterieure': 'Bordure Extérieure',
                'bordure_interieure': 'Bordure Intérieure'
            }[self.selected_type]

            self.info_label.config(text=f"{type_name} - Point {self.selected_point['index']}")
            self.coords_label.config(text=f"X: {x:.1f}, Y: {y:.1f}")
            self.coords_mm_label.config(text=f"X: {x:.1f}mm, Y: {y:.1f}mm")

    def save_csv(self):
        with open(self.csv_file, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)

            # Trajectoire principale
            writer.writerow(['trajectoire'])
            for point in self.trajectoire:
                writer.writerow([point['index'], point['x'], point['y']])

            # Bordure extérieure
            writer.writerow(['bordure_exterieure'])
            for point in self.bordure_exterieure:
                writer.writerow([point['index'], point['x'], point['y']])

            # Bordure intérieure
            writer.writerow(['bordure_interieure'])
            for point in self.bordure_interieure:
                writer.writerow([point['index'], point['x'], point['y']])

        print(f"Fichier sauvegardé: {self.csv_file}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python point_editor.py <fichier_csv>")
        sys.exit(1)

    csv_file = sys.argv[1]
    if not os.path.exists(csv_file):
        print(f"Fichier introuvable: {csv_file}")
        sys.exit(1)

    root = tk.Tk()
    app = PointEditor(root, csv_file)
    root.mainloop()
