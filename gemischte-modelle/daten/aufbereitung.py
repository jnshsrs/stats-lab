"""Aufbereitung des FAI-Reha-Datensatzes (Müller-Torrente et al., 2021; Zenodo 10.5281/zenodo.22206659, CC BY 4.0).

Eingabe:  fai_original.csv (unverändert von Zenodo)
Ausgabe:  fai_reha.csv (langes Format), fai_reha.sav (SPSS mit Labels), fai_reha.js (für die Website)

Aufbereitungsschritte (alle im Code nachvollziehbar):
1. Personen-ID rekonstruiert: Die Originaldatei hat keine ID. Innerhalb von Gruppe und Zeitpunkt stehen die Personen
   in derselben Reihenfolge; Alter, Gewicht, Größe, BMI, Geschlecht und Sportstunden stimmen über alle drei Zeitpunkte
   Zeile für Zeile überein (wird unten geprüft).
2. Gewicht und Größe vertauscht (Größe in der Gewichtsspalte), bei drei Personen Größe in Metern: korrigiert, BMI geprüft.
   Bei drei Personen passt der BMI des Originals nicht zu Größe und Gewicht; er wird unverändert übernommen.
3. Alter „43A“ zu 43.
4. Ja/Nein-Kodierungen SI/S/YES und NO/N vereinheitlicht zu 1/0.
5. Schmerz (EVA) 0 bis 10 wie im Original; der Artikel berichtet dieselben Werte in mm (mal 10).
6. Zwei Personen der Interventionsgruppe (I44, I45) haben in Woche 4 und Woche 14 exakt die Werte vor der OP
   (Schmerz, alle Bewegungsumfänge, Tests; mHHS in Woche 14 = Wert vor der OP). Das spricht für fortgeschriebene
   Werte (LOCF), vermutlich die beiden Personen ohne Nachuntersuchung. Sie bleiben im Datensatz und sind über
   die Spalte fortgeschrieben = 1 markiert.
"""
import pandas as pd, numpy as np, json, pyreadstat

d = pd.read_csv("fai_original.csv", dtype=str)
d["k"] = d.groupby(["TIEMPO", "GRUPO"]).cumcount()
dem = ["Edad", "Peso", "Talla", "IMC", "Sexo", "Act Deportiva"]
chk = d.pivot_table(index=["GRUPO", "k"], columns="TIEMPO", values=dem, aggfunc="first")
for c in dem:
    assert (chk[(c, "PRE")] == chk[(c, "POST1")]).all() and (chk[(c, "PRE")] == chk[(c, "POST2")]).all(), c

out = pd.DataFrame()
out["id"] = np.where(d.GRUPO == "CONTROL", "K", "I") + (d.k + 1).astype(str).str.zfill(2)
out["gruppe"] = np.where(d.GRUPO == "CONTROL", "Kontrolle", "Intervention")
out["zeit"] = d.TIEMPO.map({"PRE": "vor OP", "POST1": "Woche 4", "POST2": "Woche 14"})
out["zeit_nr"] = d.TIEMPO.map({"PRE": 0, "POST1": 1, "POST2": 2})
out["alter"] = d.Edad.str.replace("A", "", regex=False).astype(int)
out["geschlecht"] = d.Sexo.map({"H": "m", "M": "w"})
p, t = d.Peso.astype(float), d.Talla.astype(float)
swap = (p > t) | (p < 3)
w, h = np.where(swap, t, p), np.where(swap, p, t)
h = np.where(h < 3, h * 100, h)
out["gewicht_kg"], out["groesse_cm"] = w, h
bmi = out.gewicht_kg / (out.groesse_cm / 100) ** 2
off = abs(bmi - d.IMC.astype(float)) >= 0.6
assert off.sum() == 9, off.sum()  # 3 Personen x 3 Zeitpunkte: BMI im Original passt nicht zu Größe und Gewicht, unverändert übernommen
out["bmi"] = d.IMC.astype(float).round(1)
out["sport_h_woche"] = d["Act Deportiva"].astype(int)
out["adhaerenz"] = pd.to_numeric(d.Cumplimiento)
out["schmerz_vas"] = pd.to_numeric(d.EVA)
yn = {"SI": 1, "S": 1, "YES": 1, "NO": 0, "N": 0}
for a, b in [("FABERE", "faber"), ("FADDIR", "fadir"), ("OBER", "ober")]:
    out[b] = d[a].map(yn).astype(int)
for a, b in [("F", "flexion"), ("E", "extension"), ("ABD", "abduktion"), ("ADD", "adduktion"), ("RI", "innenrotation"), ("RE", "aussenrotation")]:
    out[b] = pd.to_numeric(d[a])
out["mhhs"] = pd.to_numeric(d["HARRIS M."])
out["fortgeschrieben"] = ((out.id.isin(["I44", "I45"])) & (out.zeit_nr > 0)).astype(int)

# Prüfung LOCF-Verdacht
num = ["schmerz_vas", "flexion", "extension", "abduktion", "adduktion", "innenrotation", "aussenrotation"]
for pid in ["I44", "I45"]:
    s = out[out.id == pid][num]
    assert (s.nunique() == 1).all(), pid

out = out.sort_values(["gruppe", "id", "zeit_nr"], ascending=[True, True, True]).reset_index(drop=True)
out.to_csv("fai_reha.csv", index=False)

labels = {
    "id": "Person (I = Intervention, K = Kontrolle), rekonstruiert aus der Zeilenreihenfolge",
    "gruppe": "Studienarm: Intervention = supervidierte Reha (Protokoll Müller und Puig), Kontrolle = Standardversorgung",
    "zeit": "Messzeitpunkt", "zeit_nr": "Messzeitpunkt (0 = vor OP, 1 = 4 Wochen, 2 = 14 Wochen nach OP)",
    "alter": "Alter in Jahren", "geschlecht": "Geschlecht", "gewicht_kg": "Körpergewicht in kg", "groesse_cm": "Körpergröße in cm",
    "bmi": "Body-Mass-Index (kg/m²)", "sport_h_woche": "Sport in Stunden pro Woche", "adhaerenz": "Adhärenz an das Reha-Protokoll in % (nur Intervention)",
    "schmerz_vas": "Schmerz, visuelle Analogskala 0 bis 10", "faber": "FABER-Test positiv", "fadir": "FADIR-Test positiv", "ober": "Ober-Test positiv",
    "flexion": "Hüftflexion in Grad", "extension": "Hüftextension in Grad", "abduktion": "Hüftabduktion in Grad", "adduktion": "Hüftadduktion in Grad",
    "innenrotation": "Hüftinnenrotation in Grad", "aussenrotation": "Hüftaußenrotation in Grad",
    "mhhs": "modifizierter Harris Hip Score 0 bis 100 (nur vor OP und Woche 14)",
    "fortgeschrieben": "Wert vermutlich fortgeschrieben (identisch mit dem Wert vor der OP)",
}
vl = {"faber": {0: "negativ", 1: "positiv"}, "fadir": {0: "negativ", 1: "positiv"}, "ober": {0: "negativ", 1: "positiv"},
      "zeit_nr": {0: "vor OP", 1: "Woche 4", 2: "Woche 14"}, "fortgeschrieben": {0: "nein", 1: "ja"}}
pyreadstat.write_sav(out, "fai_reha.sav", column_labels=labels, variable_value_labels=vl)

cols = list(out.columns)
rows = [[None if (isinstance(v, float) and np.isnan(v)) else (int(v) if isinstance(v, (np.integer,)) else (float(v) if isinstance(v, np.floating) else v)) for v in r] for r in out.itertuples(index=False)]
with open("fai_reha.js", "w") as f:
    f.write("/* Reha nach Hüftarthroskopie bei Cam-FAIS: Müller-Torrente et al. (2021), J Clin Med 10:3125. Daten: Zenodo 10.5281/zenodo.22206659, CC BY 4.0. Aufbereitet mit aufbereitung.py. */\n")
    f.write("window.FAI = " + json.dumps({"cols": cols, "rows": rows}, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(out), "Zeilen,", out.id.nunique(), "Personen; vertauscht:", int(swap.sum() / 3), "Personen")
