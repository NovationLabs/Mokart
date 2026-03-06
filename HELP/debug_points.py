import tkinter as tk
import math
import csv
import os
from datetime import datetime

OFFSET = 5
MIN_DRAG_DISTANCE = 1  # Distance minimale entre deux points lors du drag

class CircuitDrawer:
    def __init__(self, root):
        self.root = root
        self.canvas = tk.Canvas(root, width=800, height=600, bg="white")
        self.canvas.pack()

        self.points = []
        self.outer_points = []
        self.inner_points = []
        self.finished = False

        self.canvas.bind("<Button-1>", self.add_point)
        self.canvas.bind("<B1-Motion>", self.add_point_drag)
        self.canvas.bind("<Button-3>", self.finish)
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def add_point(self, event):
        if self.finished:
            return

        self.points.append((event.x, event.y))
        r = 3
        self.canvas.create_oval(event.x-r, event.y-r, event.x+r, event.y+r, fill="black")

        if len(self.points) > 1:
            self.canvas.create_line(
                self.points[-2][0], self.points[-2][1],
                self.points[-1][0], self.points[-1][1],
                fill="blue"
            )

    def add_point_drag(self, event):
        if self.finished:
            return

        if self.points:
            last_x, last_y = self.points[-1]
            dist = math.hypot(event.x - last_x, event.y - last_y)
            if dist < MIN_DRAG_DISTANCE:
                return

        self.points.append((event.x, event.y))
        r = 3
        self.canvas.create_oval(event.x-r, event.y-r, event.x+r, event.y+r, fill="black")

        if len(self.points) > 1:
            self.canvas.create_line(
                self.points[-2][0], self.points[-2][1],
                self.points[-1][0], self.points[-1][1],
                fill="blue"
            )

    def finish(self, event):
        if len(self.points) < 3:
            return

        self.finished = True

        self.canvas.create_line(
            self.points[-1][0], self.points[-1][1],
            self.points[0][0], self.points[0][1],
            fill="blue"
        )

        self.outer_points = self.offset_polygon(self.points, OFFSET)
        self.inner_points = self.offset_polygon(self.points, -OFFSET)

        self.draw_polygon(self.outer_points, "red")
        self.draw_polygon(self.inner_points, "green")

    def normalize(self, dx, dy):
        length = math.hypot(dx, dy)
        if length == 0:
            return 0, 0
        return dx/length, dy/length

    def offset_polygon(self, points, offset):
        new_points = []
        n = len(points)

        for i in range(n):
            p1 = points[i - 1]
            p2 = points[i]
            p3 = points[(i + 1) % n]

            dx1, dy1 = p2[0] - p1[0], p2[1] - p1[1]
            dx2, dy2 = p3[0] - p2[0], p3[1] - p2[1]

            nx1, ny1 = self.normalize(-dy1, dx1)
            nx2, ny2 = self.normalize(-dy2, dx2)

            nx = (nx1 + nx2) / 2
            ny = (ny1 + ny2) / 2

            nx, ny = self.normalize(nx, ny)

            new_x = p2[0] + nx * offset
            new_y = p2[1] + ny * offset

            new_points.append((new_x, new_y))

        return new_points

    def draw_polygon(self, points, color):
        n = len(points)
        for i in range(n):
            x1, y1 = points[i]
            x2, y2 = points[(i + 1) % n]
            self.canvas.create_line(x1, y1, x2, y2, fill=color, width=2)

    def export_to_csv(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"circuit_{timestamp}.csv"

        with open(filename, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)

            # Trajectoire principale
            writer.writerow(['trajectoire'])
            for i, (x, y) in enumerate(self.points, 1):
                writer.writerow([i, x, y])

            # Bordure extérieure
            writer.writerow(['bordure_exterieure'])
            for i, (x, y) in enumerate(self.outer_points, 1):
                writer.writerow([i, x, y])

            # Bordure intérieure
            writer.writerow(['bordure_interieure'])
            for i, (x, y) in enumerate(self.inner_points, 1):
                writer.writerow([i, x, y])

        print(f"Fichier exporté: {filename}")
        return filename

    def on_closing(self):
        if self.finished and self.points:
            self.export_to_csv()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    root.title("Circuit Drawer")
    app = CircuitDrawer(root)
    root.mainloop()
