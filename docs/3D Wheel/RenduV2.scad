// Base d'un volant fermé circulaire de karting
// Unités: mm

// --- VUE ET ASSEMBLAGE ---
// Choisir l'affichage: "assemble", "eclate", "base", "couvercle"
affichage = "couvercle"; 

diametre_volant = 250;     // Diamètre extérieur du volant
epaisseur_poignee = 25;    // Épaisseur (diamètre de la section) du cerceau

// Paramètres du boitier central (remplace le moyeu simple)
boitier_larg = 120;        // Largeur du boitier central (agrandi pour les vis)
boitier_haut = 90;         // Hauteur du boitier central (agrandi pour les vis)
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

// Module pour les cavités internes du boitier
module cavites_boitier() {
    // 1. Trous de fixation Kart (3 trous Sodi sur entraxe 58mm)
    // S'arrête à Z=0 pour que la tête de vis soit sous la batterie
    for(a=[90, 210, 330]) {
        rotate([0, 0, a])
        translate([entraxe_fixation/2, 0, -boitier_ep/2 - 1])
            cylinder(d=trou_fixation, h=26, $fn=30);
    }
    // Trou central pour colonne de direction (jusque sous la batterie)
    translate([0, 0, -boitier_ep/2]) cylinder(d=35, h=20, $fn=50);

    // 2. Logement Batterie (au fond, env 95x65x20mm)
    // Occupe l'espace de Z=-20 à Z=0
    translate([0, 0, -10]) cube([95, 65, 20], center=true);

    // 3. Logement RPI Zero 2W (milieu, 70x35x10mm)
    // Occupe l'espace de Z=0 à Z=10
    translate([0, 0, 5]) cube([70, 35, 10], center=true);

    // 4. Logement Ecran 3.5" (en haut, 87x57x12mm)
    translate([0, 0, 16]) cube([87, 57, 12], center=true);

    // 5. Ouverture d'affichage de l'écran (traverse le haut)
    translate([0, 0, 20]) cube([75, 50, 20], center=true);

    // 6. Colonne centrale (Passage des câbles entre étages)
    cube([55, 25, 45], center=true);

    // 7. Accès aux ports du RPI Zero (Z = 5)
    // L'accès MicroSD est étendu vers le bas (Z passe de 5 à 0, hauteur passe de 10 à 20) 
    // pour mordre sur le compartiment batterie.
    translate([-45, 0, 0]) cube([30, 15, 20], center=true); // MicroSD
    translate([-20.1, -30, 5]) cube([15, 30, 10], center=true); // Mini HDMI
    translate([8.9, -30, 5]) cube([12, 30, 10], center=true); // USB Data
    translate([21.5, -30, 5]) cube([12, 30, 10], center=true); // USB Power
    
    // 8. Large ouverture latérale pour la batterie (flanc gauche)
    // Fait presque la taille de la batterie pour un accès facile
    translate([-boitier_larg/2 + 5, 0, -10]) cube([30, 50, 20], center=true);
}

// Module pour une branche
module branche() {
    longueur_branche = (diametre_volant - epaisseur_poignee) / 2;

    translate([longueur_branche / 2, 0, 0])
        cube([longueur_branche, largeur_branche, epaisseur_branche], center = true);
}

// Module complet non coupé
module volant_complet() {
    cerceau();
    difference() {
        union() {
            rounded_cube([boitier_larg, boitier_haut, boitier_ep], 10, true);
            for (a = angles_branches) {
                rotate([0, 0, a]) branche();
            }
        }
        cavites_boitier();
    }
}

// --- DÉCOUPE DU MODÈLE POUR L'ASSEMBLAGE ---

// La moitié inférieure (Z < 0) : Contient la batterie et la fixation au Kart
module base_volant() {
    difference() {
        volant_complet();
        translate([0, 0, 50]) cube([400, 400, 100], center=true); // Coupe le haut
    }
}

// La moitié supérieure (Z > 0) : Contient l'écran et le Raspberry
module couvercle_volant() {
    difference() {
        volant_complet();
        translate([0, 0, -50]) cube([400, 400, 100], center=true); // Coupe le bas
    }
}

// --- GESTION DE L'AFFICHAGE ---

if (affichage == "assemble") {
    volant_complet();
} else if (affichage == "eclate") {
    // Vue explosée pour bien comprendre comment ça s'emboite
    base_volant();
    translate([0, 0, 40]) couvercle_volant();
} else if (affichage == "base") {
    // Prêt pour impression 3D (socle seul)
    base_volant();
} else if (affichage == "couvercle") {
    // Prêt pour impression 3D (couvercle retourné pour imprimer la face plane sur le plateau)
    rotate([180, 0, 0]) couvercle_volant(); 
}