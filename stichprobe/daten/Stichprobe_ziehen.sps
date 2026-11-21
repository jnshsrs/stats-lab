* Encoding: UTF-8.
* Zufallsstichprobe aus der Population ziehen (Population bleibt erhalten).
* Wahre Werte der Population: mu = 31.89 cm, sigma = 3.68 cm.

* n = 10: Block ausführen, Mittelwert notieren, beliebig oft wiederholen.
TEMPORARY.
SAMPLE 10 FROM 2000.
DESCRIPTIVES VARIABLES=bizeps_cm
  /STATISTICS=MEAN STDDEV SEMEAN MIN MAX.

* n = 40.
TEMPORARY.
SAMPLE 40 FROM 2000.
DESCRIPTIVES VARIABLES=bizeps_cm
  /STATISTICS=MEAN STDDEV SEMEAN MIN MAX.

* Vergleich: ganze Population.
DESCRIPTIVES VARIABLES=bizeps_cm
  /STATISTICS=MEAN STDDEV MIN MAX.
