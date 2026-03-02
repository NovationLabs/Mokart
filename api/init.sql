-- Extension pour générer des UUID si besoin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création des tables dans le bon ordre (circuits d'abord)
CREATE TABLE IF NOT EXISTS circuits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circuit_boundaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('left', 'right')),
    point_order INTEGER NOT NULL,
    x FLOAT4 NOT NULL,
    y FLOAT4 NOT NULL,
    UNIQUE(circuit_id, side, point_order)
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    kart TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    circuit_id UUID REFERENCES circuits(id),
    kart TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_data (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    uwb_x FLOAT4,
    uwb_y FLOAT4,
    uwb_z FLOAT4,
    imu_ax FLOAT4,
    imu_ay FLOAT4,
    imu_az FLOAT4,
    imu_gx FLOAT4,
    imu_gy FLOAT4,
    imu_gz FLOAT4,
    steering_angle FLOAT4,
    PRIMARY KEY (session_id, timestamp)
);

-- Index optimisés pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_sensor_data_session ON sensor_data(session_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_data_session_timestamp ON sensor_data(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_coords ON sensor_data(uwb_x, uwb_y);

-- Index pour les circuits
CREATE INDEX IF NOT EXISTS idx_circuit_boundaries_circuit ON circuit_boundaries(circuit_id);
CREATE INDEX IF NOT EXISTS idx_circuit_boundaries_order ON circuit_boundaries(circuit_id, side, point_order);

-- CIRCUIT DE TEST : "Karting International de Paris"
-- Dimensions : ~300m x 200m, piste technique avec 12 virages
INSERT INTO circuits (id, name, description)
VALUES ('550e8400-e29b-41d4-a716-446655440010', 'Karting International de Paris', 'Circuit technique de 300m avec 12 virages serrés')
ON CONFLICT DO NOTHING;

-- Points de la bordure gauche (50 points) - Cercle simple
INSERT INTO circuit_boundaries (id, circuit_id, side, point_order, x, y)
SELECT
    uuid_generate_v4(),
    '550e8400-e29b-41d4-a716-446655440010',
    'left',
    gs,
    25 * cos(gs * 0.126),  -- Rayon 25m, cercle complet
    25 * sin(gs * 0.126)
FROM generate_series(1, 50) gs
ON CONFLICT DO NOTHING;

-- Points de la bordure droite (50 points) - Cercle plus grand
INSERT INTO circuit_boundaries (id, circuit_id, side, point_order, x, y)
SELECT
    uuid_generate_v4(),
    '550e8400-e29b-41d4-a716-446655440010',
    'right',
    gs,
    35 * cos(gs * 0.126),  -- Rayon 35m, même centre
    35 * sin(gs * 0.126)
FROM generate_series(1, 50) gs
ON CONFLICT DO NOTHING;

-- INSERTION D'UNE SESSION DE TEST (Pour ne pas avoir un site vide)
INSERT INTO users (id, email, password_hash, kart)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'pilot@mokart.com', 'hash', 'SodiKart RT8')
ON CONFLICT DO NOTHING;

INSERT INTO sessions (id, user_id, circuit_id, kart, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'SodiKart RT8', NOW())
ON CONFLICT DO NOTHING;

-- Génération d'une trajectoire circulaire de test (100 points)
INSERT INTO sensor_data (session_id, timestamp, uwb_x, uwb_y, imu_ax, steering_angle)
SELECT
    '550e8400-e29b-41d4-a716-446655440000',
    1700000000 + (gs * 100),
    30 * cos(gs * 0.1), -- X (Cercle)
    30 * sin(gs * 0.1), -- Y (Cercle)
    0.5 * random(),     -- Accélération simulée
    15 * sin(gs * 0.1)  -- Angle volant simulé
FROM generate_series(1, 100) gs
ON CONFLICT DO NOTHING;

-- INSERTION D'UN DEUXIÈME USER POUR LA SESSION TECHNIQUE
INSERT INTO users (id, email, password_hash, kart)
VALUES ('550e8400-e29b-41d4-a716-446655440002', 'expert@mokart.com', 'hash', 'TonyKart Racer')
ON CONFLICT DO NOTHING;

-- Session technique avec trajectoire optimisée sur le circuit
INSERT INTO sessions (id, user_id, circuit_id, kart, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 'TonyKart Racer', NOW())
ON CONFLICT DO NOTHING;

-- Trajectoire technique optimisée (200 points) - suit la ligne idéale du circuit
INSERT INTO sensor_data (session_id, timestamp, uwb_x, uwb_y, imu_ax, imu_ay, imu_gx, imu_gy, steering_angle)
SELECT
    '550e8400-e29b-41d4-a716-446655440001',
    1700000100 + (gs * 50), -- Timestamp plus récent, fréquence 20Hz
    -- Ligne idéale X (centre de la piste)
    CASE
        WHEN gs <= 20 THEN 10.0 + (gs - 1) * 2.0  -- Ligne droite départ
        WHEN gs <= 35 THEN 20.0 + 6.0 * sin((gs - 20) * 0.209)  -- Virage 1 fluid
        WHEN gs <= 50 THEN 26.0 + (gs - 35) * 1.5  -- Ligne droite 1
        WHEN gs <= 70 THEN 33.5 + 9.0 * cos((gs - 50) * 0.314)  -- Épingle à cheveux
        WHEN gs <= 90 THEN 42.5 + (gs - 70) * 1.2  -- Ligne droite 2
        WHEN gs <= 110 THEN 46.5 + 7.0 * sin((gs - 90) * 0.209)  -- Double virage
        WHEN gs <= 130 THEN 53.5 + (gs - 110) * 1.8  -- Ligne droite finale
        WHEN gs <= 150 THEN 61.5 + 8.0 * cos((gs - 130) * 0.157)  -- Virage final large
        WHEN gs <= 170 THEN 69.5 - (gs - 150) * 2.2  -- Retour ligne droite
        ELSE 57.0 - 5.0 * sin((gs - 170) * 0.314)  -- Dernier virage
    END,
    -- Ligne idéale Y (centre de la piste)
    CASE
        WHEN gs <= 20 THEN 46.0
        WHEN gs <= 35 THEN 46.0 + 6.0 * (1 - cos((gs - 20) * 0.209))
        WHEN gs <= 50 THEN 52.0
        WHEN gs <= 70 THEN 52.0 + 9.0 * sin((gs - 50) * 0.314)
        WHEN gs <= 90 THEN 61.0
        WHEN gs <= 110 THEN 61.0 + 7.0 * (1 - cos((gs - 90) * 0.209))
        WHEN gs <= 130 THEN 68.0
        WHEN gs <= 150 THEN 68.0 + 8.0 * sin((gs - 130) * 0.157)
        WHEN gs <= 170 THEN 76.0 - (gs - 150) * 0.8
        ELSE 71.0 - 5.0 * (1 - cos((gs - 170) * 0.314))
    END,
    -- Accélérations réalistes
    CASE
        WHEN gs <= 20 THEN 2.5 + 0.3 * random()  -- Accélération ligne droite
        WHEN gs <= 35 THEN -1.2 - 0.5 * random()  -- Freinage virage
        WHEN gs <= 50 THEN 3.0 + 0.4 * random()  -- Re-accélération
        WHEN gs <= 70 THEN -2.8 - 0.6 * random()  -- Freinage épingle
        WHEN gs <= 90 THEN 2.8 + 0.3 * random()
        WHEN gs <= 110 THEN -1.5 - 0.4 * random()
        WHEN gs <= 130 THEN 3.2 + 0.5 * random()
        WHEN gs <= 150 THEN -1.8 - 0.3 * random()
        WHEN gs <= 170 THEN 2.6 + 0.4 * random()
        ELSE -2.0 - 0.5 * random()
    END,
    -- Accélération latérale
    CASE
        WHEN gs <= 20 THEN 0.1 * random()
        WHEN gs <= 35 THEN 2.5 + 0.8 * random()  -- Virage 1
        WHEN gs <= 50 THEN 0.1 * random()
        WHEN gs <= 70 THEN 3.2 + 1.0 * random()  -- Épingle
        WHEN gs <= 90 THEN 0.1 * random()
        WHEN gs <= 110 THEN 2.8 + 0.7 * random()  -- Double virage
        WHEN gs <= 130 THEN 0.1 * random()
        WHEN gs <= 150 THEN 2.2 + 0.6 * random()  -- Virage final
        WHEN gs <= 170 THEN 0.1 * random()
        ELSE 2.6 + 0.8 * random()  -- Dernier virage
    END,
    -- Gyroscope X (roll)
    CASE
        WHEN gs <= 20 THEN 0.05 * random()
        WHEN gs <= 35 THEN 0.8 + 0.3 * random()
        WHEN gs <= 50 THEN 0.05 * random()
        WHEN gs <= 70 THEN 1.2 + 0.4 * random()
        WHEN gs <= 90 THEN 0.05 * random()
        WHEN gs <= 110 THEN 0.9 + 0.3 * random()
        WHEN gs <= 130 THEN 0.05 * random()
        WHEN gs <= 150 THEN 0.7 + 0.2 * random()
        WHEN gs <= 170 THEN 0.05 * random()
        ELSE 0.8 + 0.3 * random()
    END,
    -- Gyroscope Y (pitch)
    0.1 + 0.05 * random(),  -- Léger pitch constant
    -- Angle volant réaliste
    CASE
        WHEN gs <= 20 THEN 2.0 * sin(gs * 0.1)  -- Ligne droite, corrections mineures
        WHEN gs <= 35 THEN 25.0 + 15.0 * sin((gs - 20) * 0.209)  -- Virage 1
        WHEN gs <= 50 THEN 3.0 * sin(gs * 0.1)
        WHEN gs <= 70 THEN 35.0 + 20.0 * sin((gs - 50) * 0.314)  -- Épingle serrée
        WHEN gs <= 90 THEN 3.0 * sin(gs * 0.1)
        WHEN gs <= 110 THEN 28.0 + 12.0 * sin((gs - 90) * 0.209)  -- Double virage
        WHEN gs <= 130 THEN 3.0 * sin(gs * 0.1)
        WHEN gs <= 150 THEN 22.0 + 10.0 * sin((gs - 130) * 0.157)  -- Virage final
        WHEN gs <= 170 THEN 3.0 * sin(gs * 0.1)
        ELSE 30.0 + 15.0 * sin((gs - 170) * 0.314)  -- Dernier virage
    END
FROM generate_series(1, 200) gs
ON CONFLICT DO NOTHING;
