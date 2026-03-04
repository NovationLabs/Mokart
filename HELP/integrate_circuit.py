#!/usr/bin/env python3
import csv

def parse_csv_points(csv_file):
    """Extrait les points des 3 sections du fichier CSV"""
    sections = {
        'trajectoire': [],
        'bordure_exterieure': [],
        'bordure_interieure': []
    }
    current_section = None

    with open(csv_file, 'r') as f:
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
            if row[0] in sections:
                current_section = row[0]
                continue
            if current_section and len(row) >= 3 and row[0].isdigit():
                try:
                    x = float(row[1])
                    y = float(row[2])
                    sections[current_section].append((x, y))
                except:
                    continue

    return sections

def generate_sql_inserts(points, circuit_id, side):
    """Génère les instructions SQL INSERT pour les points"""
    sql_lines = []
    sql_lines.append(f"-- Bordure {side} ({len(points)} points) - Nouveau Circuit")
    sql_lines.append("INSERT INTO circuit_boundaries (id, circuit_id, side, point_order, x, y) VALUES")

    for i, (x, y) in enumerate(points, 1):
        sql_lines.append(f"(uuid_generate_v4(), '{circuit_id}', '{side}', {i}, {x:.6f}, {y:.6f}),")

    sql_lines[-1] = sql_lines[-1].rstrip(',') + " ON CONFLICT DO NOTHING;"
    return sql_lines

def integrate_circuit():
    """Intègre le nouveau circuit dans le fichier SQL"""

    csv_file = '/home/funiclem/Documents/Mokart/circuit_20260304_114157.csv'
    sections = parse_csv_points(csv_file)

    traj   = sections['trajectoire']
    outer  = sections['bordure_exterieure']
    inner  = sections['bordure_interieure']

    print(f"Trajectoire      : {len(traj)} points")
    print(f"Bordure extérieure: {len(outer)} points")
    print(f"Bordure intérieure: {len(inner)} points")

    circuit_id = '550e8400-e29b-41d4-a716-446655440016'

    right_sql = generate_sql_inserts(outer, circuit_id, 'right')
    left_sql  = generate_sql_inserts(inner, circuit_id, 'left')

    with open('/home/funiclem/Documents/Mokart/api/init.sql', 'r') as f:
        sql_content = f.read()

    insert_pos = sql_content.find("-- NOUVELLE SESSION POUR WEEK CIRCUIT")
    if insert_pos == -1:
        insert_pos = len(sql_content)

    new_circuit = f"""
-- NOUVEAU CIRCUIT AVEC POINTS DU CSV
INSERT INTO circuits (id, name, description, created_at)
VALUES ('{circuit_id}', 'Circuit CSV v1', 'Circuit avec {len(traj)} points du CSV', NOW())
ON CONFLICT DO NOTHING;

{chr(10).join(right_sql)}

{chr(10).join(left_sql)}

"""

    new_content = sql_content[:insert_pos] + new_circuit + sql_content[insert_pos:]

    with open('/home/funiclem/Documents/Mokart/api/init.sql', 'w') as f:
        f.write(new_content)

    print(f"\nCircuit intégré avec succès !")
    print(f"ID du circuit: {circuit_id}")
    print("Fichier init.sql mis à jour")

if __name__ == "__main__":
    integrate_circuit()
