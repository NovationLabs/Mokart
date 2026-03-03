-- Extension pour générer des UUID si besoin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Index pour accélérer la récupération des points par circuit
CREATE INDEX IF NOT EXISTS idx_circuit_boundaries_circuit ON circuit_boundaries(circuit_id);
CREATE INDEX IF NOT EXISTS idx_circuit_boundaries_order ON circuit_boundaries(circuit_id, side, point_order);

-- CIRCUIT DE TEST : "Karting International de Paris"
-- Dimensions : ~300m x 200m, piste technique avec 12 virages
INSERT INTO circuits (id, name, description)
VALUES ('550e8400-e29b-41d4-a716-446655440010', 'Karting International de Paris', 'Circuit technique de 300m avec 12 virages serrés')
ON CONFLICT DO NOTHING;

-- Points de la bordure gauche (50 points)
INSERT INTO circuit_boundaries (id, circuit_id, side, point_order, x, y)
SELECT
    uuid_generate_v4(),
    '550e8400-e29b-41d4-a716-446655440010',
    'left',
    gs,
    -- Ligne droite départ
    CASE 
        WHEN gs <= 5 THEN 10.0 + (gs - 1) * 2.0
        -- Virage 1 (90° droite)
        WHEN gs <= 10 THEN 20.0 + 5.0 * sin((gs - 5) * 0.314)
        -- Ligne droite 1
        WHEN gs <= 15 THEN 25.0 + (gs - 10) * 1.5
        -- Virage 2 (épingle)
        WHEN gs <= 20 THEN 32.5 + 8.0 * cos((gs - 15) * 0.628)
        -- Ligne droite 2
        WHEN gs <= 25 THEN 40.0 + (gs - 20) * 1.2
        -- Virage 3 (double)
        WHEN gs <= 30 THEN 46.0 + 6.0 * sin((gs - 25) * 0.419)
        -- Ligne droite finale
        WHEN gs <= 35 THEN 52.0 + (gs - 30) * 1.8
        -- Virage final (large)
        WHEN gs <= 40 THEN 61.0 + 7.0 * cos((gs - 35) * 0.251)
        -- Retour ligne droite
        WHEN gs <= 45 THEN 68.0 - (gs - 40) * 2.5
        -- Dernier virage
        ELSE 55.5 - 4.5 * sin((gs - 45) * 0.628)
    END,
    -- Coordonnées Y
    CASE 
        WHEN gs <= 5 THEN 50.0
        WHEN gs <= 10 THEN 50.0 + 5.0 * (1 - cos((gs - 5) * 0.314))
        WHEN gs <= 15 THEN 55.0
        WHEN gs <= 20 THEN 55.0 + 8.0 * sin((gs - 15) * 0.628)
        WHEN gs <= 25 THEN 63.0
        WHEN gs <= 30 THEN 63.0 + 6.0 * (1 - cos((gs - 25) * 0.419))
        WHEN gs <= 35 THEN 69.0
        WHEN gs <= 40 THEN 69.0 + 7.0 * sin((gs - 35) * 0.251)
        WHEN gs <= 45 THEN 76.0 - (gs - 40) * 1.0
        ELSE 71.0 - 4.5 * (1 - cos((gs - 45) * 0.628))
    END
FROM generate_series(1, 50) gs
ON CONFLICT DO NOTHING;

-- Points de la bordure droite (50 points)
INSERT INTO circuit_boundaries (id, circuit_id, side, point_order, x, y)
SELECT
    uuid_generate_v4(),
    '550e8400-e29b-41d4-a716-446655440010',
    'right',
    gs,
    -- Ligne droite départ (décalée de 8m)
    CASE 
        WHEN gs <= 5 THEN 10.0 + (gs - 1) * 2.0
        -- Virage 1 (rayon plus large)
        WHEN gs <= 10 THEN 20.0 + 7.0 * sin((gs - 5) * 0.314)
        -- Ligne droite 1
        WHEN gs <= 15 THEN 27.0 + (gs - 10) * 1.5
        -- Virage 2 (épingle plus serrée)
        WHEN gs <= 20 THEN 34.5 + 10.0 * cos((gs - 15) * 0.628)
        -- Ligne droite 2
        WHEN gs <= 25 THEN 44.0 + (gs - 20) * 1.2
        -- Virage 3 (double)
        WHEN gs <= 30 THEN 50.0 + 8.0 * sin((gs - 25) * 0.419)
        -- Ligne droite finale
        WHEN gs <= 35 THEN 58.0 + (gs - 30) * 1.8
        -- Virage final (large)
        WHEN gs <= 40 THEN 67.0 + 9.0 * cos((gs - 35) * 0.251)
        -- Retour ligne droite
        WHEN gs <= 45 THEN 76.0 - (gs - 40) * 2.5
        -- Dernier virage
        ELSE 63.5 - 6.5 * sin((gs - 45) * 0.628)
    END,
    -- Coordonnées Y (décalées)
    CASE 
        WHEN gs <= 5 THEN 42.0
        WHEN gs <= 10 THEN 42.0 + 7.0 * (1 - cos((gs - 5) * 0.314))
        WHEN gs <= 15 THEN 49.0
        WHEN gs <= 20 THEN 49.0 + 10.0 * sin((gs - 15) * 0.628)
        WHEN gs <= 25 THEN 59.0
        WHEN gs <= 30 THEN 59.0 + 8.0 * (1 - cos((gs - 25) * 0.419))
        WHEN gs <= 35 THEN 67.0
        WHEN gs <= 40 THEN 67.0 + 9.0 * sin((gs - 35) * 0.251)
        WHEN gs <= 45 THEN 76.0 - (gs - 40) * 1.0
        ELSE 71.0 - 6.5 * (1 - cos((gs - 45) * 0.628))
    END
FROM generate_series(1, 50) gs
ON CONFLICT DO NOTHING;
