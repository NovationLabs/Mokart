-- Script pour ajouter des utilisateurs factices
-- Exécuter avec: curl -X POST http://localhost:8081/execute-sql -d "@seed_users.sql"

-- Supprimer les utilisateurs existants (sauf admin)
DELETE FROM users WHERE username NOT IN ('pilot', 'expert');

-- Insérer des utilisateurs factices avec différentes dates
INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, kart, role, is_active, license_number, license_expiry, created_at, updated_at) VALUES
-- Pilotes actifs
('10000000-0000-0000-0000-000000000001', 'driver1', 'martin.dubois@email.com', 'hash_password123', 'Martin', 'Dubois', '0612345678', 'TonyKart Racer', 'driver', true, 'LIC-001-2024', '2024-12-31', NOW() - INTERVAL '30 days', NOW()),
('20000000-0000-0000-0000-000000000002', 'driver2', 'sophie.bernard@email.com', 'hash_password123', 'Sophie', 'Bernard', '0623456789', 'SodiKart RT8', 'driver', true, 'LIC-002-2024', '2024-12-31', NOW() - INTERVAL '25 days', NOW()),
('30000000-0000-0000-0000-000000000003', 'driver3', 'thomas.martin@email.com', 'hash_password123', 'Thomas', 'Martin', '0634567890', 'CRG KT1', 'driver', true, 'LIC-003-2024', '2024-12-31', NOW() - INTERVAL '20 days', NOW()),
('40000000-0000-0000-0000-000000000004', 'driver4', 'camille.petit@email.com', 'hash_password123', 'Camille', 'Petit', '0645678901', 'BirelART', 'driver', true, 'LIC-004-2024', '2024-12-31', NOW() - INTERVAL '15 days', NOW()),
('50000000-0000-0000-0000-000000000005', 'driver5', 'lucas.robert@email.com', 'hash_password123', 'Lucas', 'Robert', '0656789012', 'TonyKart Racer', 'driver', true, 'LIC-005-2024', '2024-12-31', NOW() - INTERVAL '10 days', NOW()),

-- Mécaniciens
('60000000-0000-0000-0000-000000000006', 'mech1', 'pierre.durand@email.com', 'hash_password123', 'Pierre', 'Durand', '0667890123', NULL, 'mechanic', true, NULL, NULL, NOW() - INTERVAL '45 days', NOW()),
('70000000-0000-0000-0000-000000000007', 'mech2', 'alice.legrand@email.com', 'hash_password123', 'Alice', 'Legrand', '0678901234', NULL, 'mechanic', true, NULL, NULL, NOW() - INTERVAL '60 days', NOW()),

-- Instructeurs
('80000000-0000-0000-0000-000000000008', 'inst1', 'francois.morel@email.com', 'hash_password123', 'François', 'Morel', '0689012345', 'SodiKart RT8', 'instructor', true, 'LIC-INST-001', '2024-12-31', NOW() - INTERVAL '90 days', NOW()),
('90000000-0000-0000-0000-000000000009', 'inst2', 'isabelle.simon@email.com', 'hash_password123', 'Isabelle', 'Simon', '0690123456', 'TonyKart Racer', 'instructor', true, 'LIC-INST-002', '2024-12-31', NOW() - INTERVAL '120 days', NOW()),

-- Commissaires de piste
('a0000000-0000-0000-0000-00000000000a', 'comm1', 'jacques.leroy@email.com', 'hash_password123', 'Jacques', 'Leroy', '0701234567', NULL, 'commissaire', true, NULL, NULL, NOW() - INTERVAL '150 days', NOW()),
('b0000000-0000-0000-0000-00000000000b', 'comm2', 'marie.garcia@email.com', 'hash_password123', 'Marie', 'Garcia', '0712345678', NULL, 'commissaire', true, NULL, NULL, NOW() - INTERVAL '180 days', NOW()),

-- Spectateurs
('c0000000-0000-0000-0000-00000000000c', 'spec1', 'nicolas.roux@email.com', 'hash_password123', 'Nicolas', 'Roux', '0723456789', NULL, 'spectator', true, NULL, NULL, NOW() - INTERVAL '5 days', NOW()),
('d0000000-0000-0000-0000-00000000000d', 'spec2', 'emilie.blanc@email.com', 'hash_password123', 'Emilie', 'Blanc', '0734567890', NULL, 'spectator', true, NULL, NULL, NOW() - INTERVAL '2 days', NOW()),

-- Pilotes inactifs
('e0000000-0000-0000-0000-00000000000e', 'inactive1', 'antoine.fischer@email.com', 'hash_password123', 'Antoine', 'Fischer', '0745678901', 'CRG KT1', 'driver', false, 'LIC-006-2024', '2024-12-31', NOW() - INTERVAL '200 days', NOW()),
('f0000000-0000-0000-0000-00000000000f', 'inactive2', 'julie.muller@email.com', 'hash_password123', 'Julie', 'Muller', '0756789012', 'BirelART', 'driver', false, 'LIC-007-2024', '2024-12-31', NOW() - INTERVAL '365 days', NOW());

-- Ajouter quelques utilisateurs créés ce mois-ci pour les stats
INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, kart, role, is_active, license_number, license_expiry, created_at, updated_at) VALUES
('g0000000-0000-0000-0000-00000000000g', 'newdriver1', 'paul.wagner@email.com', 'hash_password123', 'Paul', 'Wagner', '0767890123', 'TonyKart Racer', 'driver', true, 'LIC-008-2024', '2024-12-31', NOW() - INTERVAL '5 days', NOW()),
('h0000000-0000-0000-0000-00000000000h', 'newdriver2', 'laura.schmidt@email.com', 'hash_password123', 'Laura', 'Schmidt', '0778901234', 'SodiKart RT8', 'driver', true, 'LIC-009-2024', '2024-12-31', NOW() - INTERVAL '3 days', NOW()),
('i0000000-0000-0000-0000-00000000000i', 'newmech1', 'matthieu.klein@email.com', 'hash_password123', 'Matthieu', 'Klein', '0789012345', NULL, 'mechanic', true, NULL, NULL, NOW() - INTERVAL '7 days', NOW());
