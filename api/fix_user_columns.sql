-- Script pour ajouter les colonnes manquantes à la table users
-- Exécuter avec: curl -X POST http://localhost:8081/execute-sql -d "@fix_user_columns.sql"

-- Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'driver';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajouter la contrainte CHECK pour les rôles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('admin', 'commissaire', 'mechanic', 'instructor', 'driver', 'spectator'));
    END IF;
END $$;

-- Mettre à jour les utilisateurs existants pour avoir des valeurs par défaut
UPDATE users SET role = 'driver' WHERE role IS NULL;
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;
