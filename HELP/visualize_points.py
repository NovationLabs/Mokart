#!/usr/bin/env python3

import pygame
import requests
import math

# Initialisation Pygame
pygame.init()
WIDTH, HEIGHT = 1400, 900
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Visualisation Trajectoires - Week Circuit")

# Couleurs
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)
GRAY = (128, 128, 128)

# Récupérer les données
print("Récupération des données...")

# Session 1: Cercle
session1_response = requests.get("http://localhost:8081/sessions/550e8400-e29b-41d4-a716-446655440000/trajectory")
session1_data = session1_response.json()

boundaries1_response = requests.get("http://localhost:8081/circuits/550e8400-e29b-41d4-a716-446655440010/boundaries")
boundaries1_data = boundaries1_response.json()

# Session 2: Week Circuit (Session 3)
session2_response = requests.get("http://localhost:8081/sessions/550e8400-e29b-41d4-a716-446655440004/trajectory")
session2_data = session2_response.json()

boundaries2_response = requests.get("http://localhost:8081/circuits/550e8400-e29b-41d4-a716-446655440012/boundaries")
boundaries2_data = boundaries2_response.json()

print(f"Session 1: {len(session1_data)} points, {len(boundaries1_data)} boundaries")
print(f"Session 2: {len(session2_data)} points, {len(boundaries2_data)} boundaries")

# Fonction pour convertir les coordonnées
def convert_coords(x, y, session_type="default"):
    if session_type == "week_circuit":
        # Adapté pour le Week Circuit (coordonnées plus grandes)
        scale = 1.5  # Échelle réduite pour le Week Circuit
        center_x = 300  # Centre ajusté
        center_y = 300
        screen_x = center_x + int(x * scale)
        screen_y = HEIGHT - center_y - int(y * scale)  # Inverser Y et ajuster
    else:
        # Pour la session 1 (cercle simple)
        scale = 10
        screen_x = WIDTH // 2 + int(x * scale)
        screen_y = HEIGHT // 2 - int(y * scale)
    return screen_x, screen_y

# Fonction pour dessiner des points connectés
def draw_connected_points(points, color, width=2, session_type="default"):
    if len(points) > 1:
        screen_points = [convert_coords(p['x'], p['y'], session_type) for p in points]
        pygame.draw.lines(screen, color, False, screen_points, width)

# Boucle principale
running = True
clock = pygame.time.Clock()
show_session1 = True
font = pygame.font.Font(None, 24)

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                show_session1 = not show_session1
            elif event.key == pygame.K_r:
                # Rafraîchir les données
                print("Rafraîchissement des données...")
                try:
                    session1_response = requests.get("http://localhost:8081/sessions/550e8400-e29b-41d4-a716-446655440000/trajectory")
                    session1_data = session1_response.json()

                    boundaries1_response = requests.get("http://localhost:8081/circuits/550e8400-e29b-41d4-a716-446655440010/boundaries")
                    boundaries1_data = boundaries1_response.json()

                    session2_response = requests.get("http://localhost:8081/sessions/550e8400-e29b-41d4-a716-446655440004/trajectory")
                    session2_data = session2_response.json()

                    boundaries2_response = requests.get("http://localhost:8081/circuits/550e8400-e29b-41d4-a716-446655440012/boundaries")
                    boundaries2_data = boundaries2_response.json()

                    print(f"Session 1: {len(session1_data)} points, {len(boundaries1_data)} boundaries")
                    print(f"Session 2: {len(session2_data)} points, {len(boundaries2_data)} boundaries")
                    print("Données rafraîchies!")
                except Exception as e:
                    print(f"Erreur lors du rafraîchissement: {e}")
            elif event.key == pygame.K_ESCAPE:
                running = False

    # Effacer écran
    screen.fill(BLACK)

    # Choisir la session à afficher
    if show_session1:
        # Session 1: Cercle
        title = "SESSION 1: CERCLE SIMPLE"

        # Dessiner les bordures
        left_points = [b for b in boundaries1_data if b['side'] == 'left']
        right_points = [b for b in boundaries1_data if b['side'] == 'right']

        draw_connected_points(left_points, RED, 3)
        draw_connected_points(right_points, RED, 3)

        # Dessiner la trajectoire
        draw_connected_points(session1_data, BLUE, 2)

        # Dessiner les points de la trajectoire
        for point in session1_data:
            screen_x, screen_y = convert_coords(point['x'], point['y'])
            pygame.draw.circle(screen, BLUE, (screen_x, screen_y), 4)  # Points plus grands
    else:
        # Session 2: Week Circuit
        title = "SESSION 2: WEEK CIRCUIT (129 points)"

        # Dessiner les bordures
        left_points = [b for b in boundaries2_data if b['side'] == 'left']
        right_points = [b for b in boundaries2_data if b['side'] == 'right']

        draw_connected_points(left_points, RED, 3, "week_circuit")
        draw_connected_points(right_points, RED, 3, "week_circuit")

        # Dessiner la trajectoire
        draw_connected_points(session2_data, GREEN, 2, "week_circuit")

        # Dessiner les points de la trajectoire
        for point in session2_data:
            screen_x, screen_y = convert_coords(point['x'], point['y'], "week_circuit")
            pygame.draw.circle(screen, GREEN, (screen_x, screen_y), 4)  # Points plus grands

    # Afficher le titre
    text = font.render(title, True, WHITE)
    screen.blit(text, (10, 10))

    # Instructions
    font_small = pygame.font.Font(None, 18)
    instructions = [
        "ESPACE: Changer de session",
        "R: Rafraîchir les données",
        "ÉCHAP: Quitter",
        f"Session {'1' if show_session1 else '2'} affichée"
    ]

    for i, instruction in enumerate(instructions):
        text = font_small.render(instruction, True, GRAY)
        screen.blit(text, (10, HEIGHT - 80 + i * 20))

    # Légende
    legend_items = [
        ("Bordures", RED),
        ("Trajectoire", BLUE if show_session1 else GREEN)
    ]

    for i, (label, color) in enumerate(legend_items):
        pygame.draw.rect(screen, color, (WIDTH - 150, 10 + i * 30, 20, 20))
        text = font_small.render(label, True, WHITE)
        screen.blit(text, (WIDTH - 120, 15 + i * 30))

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
print("Fin de la visualisation")
