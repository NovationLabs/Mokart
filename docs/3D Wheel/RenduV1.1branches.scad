// Base d'un volant fermé circulaire de karting
// Unités: mm

diametre_volant = 300;     // Diamètre extérieur du volant
epaisseur_poignee = 25;    // Épaisseur (diamètre de la section) du cerceau

// Paramètres du boitier central (remplace le moyeu simple)
boitier_larg = 115;        // Largeur du boitier central
boitier_haut = 85;         // Hauteur du boitier central
boitier_ep = 50;           // Epaisseur totale du boitier
entraxe_fixation = 58;     // Entraxe standard Sodi pour le moyeu (3 trous)
trou_fixation = 6.5;       // Diamètre des trous pour vis M6

angles_branches = [90, 210, 330]; // Angles des branches (Haut, Bas-Gauche, Bas-Droite)
largeur_branche = 25;      // Largeur des branches
epaisseur_branche = 15;    // Épaisseur des branches

// Paramètres de résolution
$fn = 100;

// Module utilitaire : cube avec coins arrondis
module rounded_cube(dim, r, center=false) {
    x = dim[0]; y = dim[1]; z = dim[2];
    cx = center ? 0 : x/2; cy = center ? 0 : y/2; cz = center ? 0 : z/2;
    translate([cx, cy, cz])
    hull() {
        for (dx = [-x/2+r, x/2-r]) {
            for (dy = [-y/2+r, y/2-r]) {
                translate([dx, dy, 0]) cylinder(r=r, h=z, center=true, $fn=50);
            }
        }
    }
}

// Module pour le cerceau extérieur
module cerceau() {
    rotate_extrude()
    // On translate le cercle pour former un tore (cerceau)
    translate([(diametre_volant - epaisseur_poignee) / 2, 0, 0])
    circle(d = epaisseur_poignee);
}

// Module pour les cavités internes du boitier (remplace le moyeu)
module cavites_boitier() {
    // 1. Trous de fixation Kart (3 trous Sodi sur entraxe 58mm)
    for(a=[90, 210, 330]) {
        rotate([0, 0, a])
        translate([entraxe_fixation/2, 0, -boitier_ep/2])
            cylinder(d=trou_fixation, h=20, $fn=30);
    }
    // Trou central pour colonne de direction
    translate([0, 0, -boitier_ep/2]) cylinder(d=35, h=20, $fn=50);

    // 2. Logement Batterie (au fond, env 95x65x20mm)
    translate([0, 0, -10]) cube([95, 65, 20], center=true);

    // 3. Logement RPI Zero 2W (milieu, 70x35x10mm)
    translate([0, 0, 5]) cube([70, 35, 10], center=true);

    // 4. Logement Ecran 3.5" (en haut, 87x57x12mm)
    translate([0, 0, 16]) cube([87, 57, 12], center=true);

    // 5. Ouverture d'affichage de l'écran (traverse le haut)
    translate([0, 0, 20]) cube([75, 50, 20], center=true);

    // 6. Colonne centrale (Passage des câbles)
    cube([55, 25, 45], center=true);

    // 7. Accès aux ports du RPI Zero (Z = 5)
    translate([-45, 0, 5]) cube([30, 15, 10], center=true); // MicroSD
    translate([-20.1, -30, 5]) cube([15, 30, 10], center=true); // Mini HDMI
    translate([8.9, -30, 5]) cube([12, 30, 10], center=true); // USB Data
    translate([21.5, -30, 5]) cube([12, 30, 10], center=true); // USB Power
}

// Module pour une branche
module branche() {
    // La branche part du centre exact (0,0) pour assurer l'ancrage dans le boitier peu importe l'angle.
    // Elle s'arrête exactement au centre du tube du cerceau pour ne pas dépasser à l'extérieur.
    longueur_branche = (diametre_volant - epaisseur_poignee) / 2;

    // On positionne la branche
    translate([longueur_branche / 2, 0, 0])
        cube([longueur_branche, largeur_branche, epaisseur_branche], center = true);
}

// Module principal pour assembler le volant
module volant() {
    cerceau();

    difference() {
        union() {
            // Le corps du boitier central
            rounded_cube([boitier_larg, boitier_haut, boitier_ep], 10, true);

            // On génère les branches aux angles définis
            for (a = angles_branches) {
                rotate([0, 0, a])
                    branche();
            }
        }
        
        // On soustrait les cavités internes. 
        // Comme les branches partent du centre, cette soustraction creuse AUSSI
        // la partie des branches qui rentre dans le boitier, gardant l'intérieur propre !
        cavites_boitier();
    }
}

// Appel du module principal pour afficher le volant
volant();