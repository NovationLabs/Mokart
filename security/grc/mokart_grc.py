import argparse
import datetime
import fnmatch
import json
import os
import re
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
EXCLUS = {".git", "node_modules", ".venv", "venv", "__pycache__", "build", "dist", ".mypy_cache", ".ruff_cache"}
TAILLE_MAX = 2 * 1024 * 1024
VALIDITE_DECLARATION = datetime.timedelta(days=365)
NOTES = [(90, "A"), (75, "B"), (60, "C"), (40, "D"), (0, "E")]
SHA_ACTION = re.compile(r"^\s*-?\s*uses:\s*([^\s#]+)", re.M)


class Depot:
    def __init__(self, racine: Path):
        self.racine = racine
        self._fichiers = None
        self._cache = {}

    def fichiers(self):
        if self._fichiers is None:
            liste = []
            for dossier, sous, noms in os.walk(self.racine):
                sous[:] = [s for s in sous if s not in EXCLUS]
                for nom in noms:
                    liste.append(Path(dossier, nom).relative_to(self.racine).as_posix())
            self._fichiers = sorted(liste)
        return self._fichiers

    def trouver(self, motifs):
        vus = []
        for motif in motifs:
            for chemin in self.fichiers():
                if fnmatch.fnmatch(chemin, motif) or (motif.startswith("**/") and fnmatch.fnmatch(chemin, motif[3:])):
                    if chemin not in vus:
                        vus.append(chemin)
        return vus

    def lire(self, chemin):
        if chemin not in self._cache:
            p = self.racine / chemin
            try:
                if p.stat().st_size > TAILLE_MAX:
                    self._cache[chemin] = ""
                else:
                    brut = p.read_bytes()
                    self._cache[chemin] = "" if b"\0" in brut[:4096] else brut.decode("utf-8", "ignore")
            except OSError:
                self._cache[chemin] = ""
        return self._cache[chemin]


def ligne_de(texte, position):
    return texte.count("\n", 0, position) + 1


def verif_fichier_present(depot, v):
    manquants = [c for c in v["chemins"] if not (depot.racine / c).exists()]
    return not manquants, [f"absent : {c}" for c in manquants]


def verif_motif_absent(depot, v):
    regex = re.compile(v["motif"])
    trouves = []
    for chemin in depot.trouver(v["fichiers"]):
        if chemin.startswith("security/grc/"):
            continue
        texte = depot.lire(chemin)
        for m in regex.finditer(texte):
            trouves.append(f"{chemin}:{ligne_de(texte, m.start())}")
            if len(trouves) >= 10:
                return False, trouves
    return not trouves, trouves


def verif_motif_present(depot, v):
    regex = re.compile(v["motif"])
    cibles = depot.trouver(v["fichiers"])
    if not cibles:
        return False, ["aucun fichier concerné trouvé"]
    avec = [c for c in cibles if regex.search(depot.lire(c))]
    if v.get("tous"):
        sans = [c for c in cibles if c not in avec]
        return not sans, [f"manque dans {c}" for c in sans]
    return bool(avec), [] if avec else [f"introuvable dans {', '.join(cibles)}"]


def verif_actions_epinglees(depot, v):
    flottantes = []
    for chemin in depot.trouver([".github/workflows/*.yml", ".github/workflows/*.yaml"]):
        texte = depot.lire(chemin)
        for m in SHA_ACTION.finditer(texte):
            ref = m.group(1).strip("'\"")
            if ref.startswith("./") or ref.startswith("docker://"):
                continue
            if not re.search(r"@[0-9a-f]{40}$", ref):
                flottantes.append(f"{chemin}:{ligne_de(texte, m.start())} {ref}")
    return not flottantes, flottantes


def verif_declaration(depot, v, controle, declarations, aujourd_hui):
    d = declarations.get(controle["id"], {})
    if not d.get("fait"):
        return False, ["non déclaré"]
    if not str(d.get("preuve", "")).strip():
        return False, ["déclaré sans preuve"]
    try:
        date = datetime.date.fromisoformat(str(d.get("date", "")))
    except ValueError:
        return False, ["date de revue invalide, format AAAA-MM-JJ attendu"]
    if aujourd_hui - date > VALIDITE_DECLARATION:
        return False, [f"revue expirée depuis le {date + VALIDITE_DECLARATION}"]
    return True, [f"preuve : {d['preuve']}"]


VERIFS = {
    "fichier_present": verif_fichier_present,
    "motif_absent": verif_motif_absent,
    "motif_present": verif_motif_present,
    "actions_epinglees": verif_actions_epinglees,
}


def evaluer(racine, referentiel, declarations, aujourd_hui):
    depot = Depot(racine)
    poids = referentiel["gravites"]
    resultats = []
    for c in referentiel["controles"]:
        ok, details = True, []
        for v in c["verifs"]:
            if v["type"] == "declaration":
                r, d = verif_declaration(depot, v, c, declarations, aujourd_hui)
            else:
                r, d = VERIFS[v["type"]](depot, v)
            ok = ok and r
            details.extend(d)
        resultats.append({
            "id": c["id"],
            "domaine": c["domaine"],
            "titre": c["titre"],
            "gravite": c["gravite"],
            "poids": poids[c["gravite"]],
            "cadres": c["cadres"],
            "mode": "declaratif" if c["verifs"][0]["type"] == "declaration" else "automatique",
            "conforme": ok,
            "details": details,
        })
    return resultats


def score(liste):
    total = sum(r["poids"] for r in liste)
    if not total:
        return None
    return round(100 * sum(r["poids"] for r in liste if r["conforme"]) / total, 1)


def note(valeur):
    return next(n for seuil, n in NOTES if valeur >= seuil)


def synthese(resultats, referentiel):
    domaines = {}
    for r in resultats:
        domaines.setdefault(r["domaine"], []).append(r)
    cadres = {}
    for r in resultats:
        for ref in r["cadres"]:
            cadres.setdefault(ref.split(":")[0], []).append(r)
    global_ = score(resultats)
    return {
        "date": datetime.date.today().isoformat(),
        "score": global_,
        "note": note(global_),
        "score_automatique": score([r for r in resultats if r["mode"] == "automatique"]),
        "score_declaratif": score([r for r in resultats if r["mode"] == "declaratif"]),
        "critiques_ouverts": [r["id"] for r in resultats if r["gravite"] == "critique" and not r["conforme"]],
        "domaines": {d: score(l) for d, l in domaines.items()},
        "cadres": {
            c["id"]: {"nom": c["nom"], "statut": c["statut"], "score": score(cadres.get(c["id"], []))}
            for c in referentiel["profil"]["cadres"]
        },
        "controles": resultats,
    }


def barre(valeur, largeur=20):
    if valeur is None:
        return " " * largeur
    plein = round(valeur / 100 * largeur)
    return "#" * plein + "." * (largeur - plein)


def rendu_texte(s, referentiel):
    lignes = [
        f"Score de conformité Mokart du {s['date']}",
        "",
        f"  Global        {s['score']:5.1f} / 100   note {s['note']}",
        f"  Automatique   {s['score_automatique']:5.1f} / 100",
        f"  Déclaratif    {s['score_declaratif']:5.1f} / 100",
        "",
        "Par domaine",
    ]
    for d, v in s["domaines"].items():
        lignes.append(f"  {d:<28} {barre(v)} {v:5.1f}")
    lignes += ["", "Par cadre"]
    for cid, c in s["cadres"].items():
        valeur = "  n/a" if c["score"] is None else f"{c['score']:5.1f}"
        lignes.append(f"  {cid:<8} {c['statut']:<36} {valeur}")
    ouverts = [r for r in s["controles"] if not r["conforme"]]
    lignes += ["", f"Contrôles non conformes ({len(ouverts)})"]
    for r in sorted(ouverts, key=lambda r: -r["poids"]):
        lignes.append(f"  [{r['gravite']:<8}] {r['id']:<10} {r['titre']}")
        for d in r["details"][:3]:
            lignes.append(f"               {d}")
    return "\n".join(lignes) + "\n"


def rendu_markdown(s, referentiel):
    lignes = [
        "## Score de conformité Mokart",
        "",
        f"**{s['score']} / 100, note {s['note']}**. Contrôles automatiques {s['score_automatique']} / 100, contrôles déclaratifs {s['score_declaratif']} / 100.",
        "",
    ]
    if s["critiques_ouverts"]:
        lignes += [f"Contrôles critiques ouverts : {', '.join(s['critiques_ouverts'])}.", ""]
    lignes += ["| Domaine | Score |", "| --- | --- |"]
    lignes += [f"| {d} | {v} |" for d, v in s["domaines"].items()]
    lignes += ["", "| Cadre | Statut | Score |", "| --- | --- | --- |"]
    for cid, c in s["cadres"].items():
        lignes.append(f"| {c['nom']} | {c['statut']} | {'n/a' if c['score'] is None else c['score']} |")
    lignes += ["", "| Contrôle | Gravité | Mode | État | Détail |", "| --- | --- | --- | --- | --- |"]
    for r in s["controles"]:
        etat = "conforme" if r["conforme"] else "**non conforme**"
        detail = "<br>".join(r["details"][:3]).replace("|", "\\|")
        lignes.append(f"| {r['id']} {r['titre']} | {r['gravite']} | {r['mode']} | {etat} | {detail} |")
    return "\n".join(lignes) + "\n"


def main(argv=None):
    p = argparse.ArgumentParser(description="Calcule le score de cyber-conformité de Mokart")
    p.add_argument("--racine", default=str(ICI.parent.parent))
    p.add_argument("--referentiel", default=str(ICI / "referentiel.json"))
    p.add_argument("--declarations", default=str(ICI / "declarations.json"))
    p.add_argument("--format", choices=["texte", "markdown", "json"], default="texte")
    p.add_argument("--sortie")
    p.add_argument("--seuil", type=float, default=0.0)
    p.add_argument("--bloquer-critiques", action="store_true")
    a = p.parse_args(argv)

    referentiel = json.loads(Path(a.referentiel).read_text(encoding="utf-8"))
    chemin_decl = Path(a.declarations)
    declarations = json.loads(chemin_decl.read_text(encoding="utf-8")) if chemin_decl.exists() else {}
    resultats = evaluer(Path(a.racine).resolve(), referentiel, declarations, datetime.date.today())
    s = synthese(resultats, referentiel)

    if a.format == "json":
        sortie = json.dumps(s, indent=2, ensure_ascii=False) + "\n"
    elif a.format == "markdown":
        sortie = rendu_markdown(s, referentiel)
    else:
        sortie = rendu_texte(s, referentiel)

    if a.sortie:
        Path(a.sortie).write_text(sortie, encoding="utf-8")
    else:
        sys.stdout.write(sortie)

    if a.bloquer_critiques and s["critiques_ouverts"]:
        sys.stderr.write(f"contrôles critiques non conformes : {', '.join(s['critiques_ouverts'])}\n")
        return 2
    if s["score"] < a.seuil:
        sys.stderr.write(f"score {s['score']} sous le seuil {a.seuil}\n")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
