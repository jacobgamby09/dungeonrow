# Dungeon Row — opdateringslog

Loggen følger ændringer i prototype, regler og udgivelse. Automatiske kontroller er teknisk verifikation, ikke menneskelige spiltests.

## v0.7.0 — kortvalg og første One-shot-belønning · 14. september 2026

- HP-startdecket har stadig ti kort: to Clubs bliver Guarded Strike (Attack 3 eller Block 4), Torch bliver Expose (Attack 1 eller Attack 4 mod tidligere sårede fjender), og Bandage bliver Second Wind (Heal 3 eller Attack 2).
- Choose one-kort tillader kun én effekt per tur; skift erstatter den tidligere effekt. Andre kort beholder alle deres effekter. Scrap fjerner fortsat hele kortet.
- Første modtagne One-shot-loot giver et valg mellem monsterets opgraderede loot, Executioner og Rend. Præcis ét kort går i discard. Valget forbruges ved End Turn; et skip bevarer muligheden. Ved flere modtagne One-shots gælder valget den venstreste fjende.
- Executioner giver Attack 6 mod fuld HP, ellers 3. Rend giver Attack 6 mod tidligere sårede fjender, ellers 3. Alle sår-/fuld-HP-betingelser vurderes ved turens start.
- Mobil får en genvej til det første belønningsvalg. Valg, betingelser og effektiv skade fremgår af kort, prognoser og eksporter. GDD v1.8 og README er opdateret.
- Verifikation: 59 regeltests bestået, inklusive 100 automatiske runs per kampmodel. Nye tests dækker gensidigt udelukkende effekter, målkrav, rækkefølgeuafhængig skade, ét belønningskort, skip, nulstilling, efterfølgende ture og eksport. JavaScript-syntaks og lokale assetreferencer er kontrolleret. Browserscripts er tilpasset, men ikke kørt i denne opdatering.
- Ingen ændring af monster-/bosstal, One-shot-krav, Scrap-pris eller Endure. De historiske simulationsresultater bevares, og simulationsscriptet er låst til v0.5.1/v0.6.0, så nye kort ikke utilsigtet ændrer den gamle sammenligning.

## Simulationsanalyse af v0.6.0 · 11. september 2026

- Kørt 4.800 automatiske runs: 200 fælles seeds × 24 kombinationer af Perfect/One-shot, to planlægningsmål, tre Endure/Leave-strategier og aktiv/ingen Scrap. Dertil 48 cases på to bruger-seeds.
- Scrap havde den største forskel i botsenes resultater. One-shot ændrede sejrsandelen fra -8,5 til +5,5 procentpoint afhængigt af strategi; der er ikke grundlag for at kalde det en entydig sværhedsforøgelse.
- One-shot-bots med Scrap vandt 86,8–97,4 % efter at have nået bossen alene. Det er et betinget resultat, ikke winrate for hele spillet.
- To bots vandt det seneste brugerseed fra starten; vinderlogs, metode, rå resultater og analyse er gemt i `output/experiments/one-shot-balance/`.
- Verificeret prognose mod motoren hver simuleret tur samt genafspilning af brugerens 12 registrerede ture. Ingen fremtidig kortviden i planlæggeren og ingen runs stoppet af turloftet. Automatiske bots er ikke menneskelige spiltests eller optimalt spil.
- Ingen ændringer i spilleregler eller liveversion.

## v0.6.0 — One-shot i HP-varianten · 11. september 2026

- One-shot erstatter Perfect Kill i standardvarianten: dræb fra fuld HP på én tur. Flere kort kan kombineres, og overkill tæller.
- Tidligere sårede monstre giver normal loot, selv ved præcis skade eller skade over deres oprindelige max-HP. Urørte monstre er stadig berettigede på senere ture.
- Belønningen er fortsat opgraderet loot eller højst ét loot-skip per tur. Overkill bevarer et valgt skip; utilstrækkelig skade, reset og Scrap kan fjerne valget.
- Kort, monsterdetaljer, regler, resultat og observationsfelt bruger One-shot. Eksporter skelner nye One-shots fra historiske Perfects. Classic Threat beholder sin præcise Perfect-regel.
- GDD v1.7 dokumenterer forsøget. Boss, Endure og Scrap er ikke ændret i denne version.
- Verifikation: 49 regeltests bestået, inklusive 100 automatiske runs per kampmodel. Målrettede tests dækker kombinerede angreb, overkill, tidligere wounds, ventende urørte monstre, ét skip, Scrap, bosser og eksport. Eksisterende browserscripts er tilpasset, men ikke kørt i denne opdatering. Menneskelig balancetest afventer næste run.

## v0.5.1 — tilfældige seeds som standard · 11. september 2026

- Spillet får et tilfældigt seed, når siden åbnes. Nye runs får også et nyt seed, når seed-feltet er tomt.
- Et indtastet seed bevares til gentagelige tests. Det aktuelle seed vises i testindstillingerne på både mobil og desktop og følger fortsat med i eksporten.
- Kontrolleret: forskellige seeds ved nye runs og genindlæsning, tomt felt/mellemrum samt identiske startboards ved genbrug af samme seed. Heal/Block- og HP-prognosekontrollen er også bestået.

## v0.5.0 — ét klik på Heal/Block og HP-prognose · 11. september 2026

- Heal og Block aktiveres direkte på spilleren med ét klik eller tryk. Et nyt klik deaktiverer effekten. Attack tildeles fortsat et monster.
- HP-feltet viser nu aktuelt liv → forventet liv efter turen samt faktisk healing, indgående skade eller **All damage blocked**. Prognosen opdateres også ved ændret Attack, reset og Scrap og respekterer max-HP.
- Balanceeksperiment: Højst én Perfect-belønning kan skippes per tur. **Move skip here** flytter valget til et andet monster; den tidligere belønning skifter til Take loot. Andre Perfect Kills giver opgraderet loot.
- Regelsæt v1.6 skelner disse runs fra v1.5 med ubegrænset skip.
- Verifikation: 45 regeltests og målrettede desktop-/mobilkontroller af aktivering, deaktivering, HP-prognose, Scrap, ét loot-skip og eksport bestået.

## v0.4.0 — Perfect loot-valg · 11. september 2026

- Et Perfect Kill giver valget mellem opgraderet loot og ingen loot. Almindelige kills giver fortsat normal loot automatisk.
- Valget vises på hvert monster under planlægningen og gælder ved End Turn. Standardvalget er **Take loot**; spilleren kan skifte til **Skip loot** og tilbage.
- Flere Perfect Kills har uafhængige valg. Hvis tildelingen ændres, så et kill ikke længere er Perfect, nulstilles valget for det monster.
- Boss-stages giver ingen loot og har derfor intet loot-valg. Scrap fungerer fortsat som fjernelse af kort, der allerede er i decket.
- JSON- og CSV-eksporter registrerer loot-valgene, også når et Perfect Kill ikke giver et kort.
- Regelsættet er mærket v1.5, så nye runs kan skelnes fra tidligere tests.
- Denne log er oprettet; fremtidige væsentlige opdateringer føjes til her.
- Verifikation: 44 regeltests bestået. Desktop- og mobilkontrol af uafhængige loot-valg, fortrydelse, ændret tildeling og eksport er bestået. Eksisterende browserkontroller og et helt automatiseret mobilrun er også bestået.

## Tidligere opdateringer — kort historik

### Vercel og GitHub · 11. september 2026

- Projektet blev forbundet til `jacobgamby09/dungeonrow`, med kildekode, GDD, testfiler, eksperimenter og printmateriale.
- Vercels udgivelsesmappe blev rettet til `dist`; forsiden blev kontrolleret live på `dungeonrow.vercel.app`.

### v0.3.0 — mobilvisning

- Kompakte 2 × 2-grids for monstre og hånd, fast bundlinje, markerede mål og separat monsterinformation.
- Mobilmenu samler regler, indstillinger, deck, noter og eksport. Endure/Leave vises i bundområdet.
- Kontrolleret ved flere telefonbredder, i liggende visning og gennem et fuldt automatiseret mobilrun. Desktop og touch-træk blev også kontrolleret.

### v0.2.2 — Scrap som standard

- Scrap blev fast tilgængeligt med **Scrap card / Undo Scrap** direkte på hvert håndkort.
- Tælleren blev omdøbt til **Mobs left in dungeon** og tæller endnu ikke afslørede normale monstre.

### v0.2.1 — tydeligere monsterkort

- HP fik hjerte og livsbjælke; Attack fik et separat orange felt med sværd.
- Skade-preview blev knyttet til HP. Spillets interface blev oversat til engelsk; samtalen foregår fortsat på dansk.

### v0.2.0 — løbende HP og separat Attack

- Monsterskade bevares mellem ture. Mistet HP sænker ikke Attack; kun Attack eskalerer.
- Perfect beregnes ud fra resterende HP på drabsturen. Den klassiske Threat-model blev bevaret som sammenligning.
- Endure-strategier blev undersøgt med automatiserede runs; resultaterne ligger i `output/experiments/`.

### v0.1.0 — første spilbare prototype

- Lokal browserprototype med korttildeling, Perfect loot, Endure/Leave, bosser, valgfri Scrap og run-eksport.
- GDD, prototypeplan og printmateriale blev gemt i projektet.
