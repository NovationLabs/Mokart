-- Extension pour générer des UUID si besoin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    kart TEXT, -- Renommé ici
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    kart TEXT, -- Renommé ici
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_data (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    timestamp BIGINT,
    uwb_x FLOAT8,
    uwb_y FLOAT8,
    uwb_z FLOAT8,
    imu_ax FLOAT8,
    imu_ay FLOAT8,
    imu_az FLOAT8,
    imu_gx FLOAT8,
    imu_gy FLOAT8,
    imu_gz FLOAT8,
    steering_angle FLOAT8,
    PRIMARY KEY (session_id, timestamp)
);

-- Index pour accélérer la récupération des trajectoires par session
CREATE INDEX IF NOT EXISTS idx_sensor_data_session ON sensor_data(session_id);

-- INSERTION D'UNE SESSION DE TEST (Pour ne pas avoir un site vide)
INSERT INTO users (id, email, password_hash, kart)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'pilot@mokart.com', 'hash', 'SodiKart RT8')
ON CONFLICT DO NOTHING;

INSERT INTO sessions (id, user_id, kart, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'SodiKart RT8', NOW())
ON CONFLICT DO NOTHING;

-- Génération d'une trajectoire circulaire de test (100 points)
INSERT INTO sensor_data (session_id, timestamp, uwb_x, uwb_y, imu_ax, steering_angle)
SELECT
    '550e8400-e29b-41d4-a716-446655440000',
    1700000000 + (gs * 100),
    20 * cos(gs * 0.1), -- X (Cercle)
    20 * sin(gs * 0.1), -- Y (Cercle)
    0.5 * random(),     -- Accélération simulée
    15 * sin(gs * 0.1)  -- Angle volant simulé
FROM generate_series(1, 100) gs
ON CONFLICT DO NOTHING;
