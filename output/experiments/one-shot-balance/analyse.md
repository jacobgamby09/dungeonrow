# Dungeon Row — simulation af One-shot, Scrap og Endure

11. september 2026 · Spilversion v0.6.0 · Analyse, ingen ændring af spilleregler

## Hovedfund

- 4.800 runs: de samme 200 seeds under 24 kombinationer af regler og botstrategier. Derudover 48 særskilte runs på brugerens to seneste seeds; de tæller ikke med i tabellerne.
- Scrap er den største forskel i dette forsøg. Med One-shot vinder bots uden Scrap 3,5–9 %; med aktiv Scrap 54,5–63 %. Dette er faste heuristikkers resultater, ikke menneskers forventede winrate.
- One-shot er ikke en entydig sværhedsforøgelse. Afhængigt af strategi ændres sejrsandelen fra -8,5 til +5,5 procentpoint over for Perfect-reglen. Flere af de parrede usikkerhedsintervaller inkluderer nul.
- One-shot er stadig hyppigt: 80–83 % af normale kills hos bots med Scrap udløser belønningsvalget (også når loot skippes).
- Blandt One-shot-bots med Scrap, som når en tur med bossen alene, vinder 86,8–97,4 %. Udvælgelsen favoriserer runs, som allerede har overlevet vejen dertil.
- Altid Endure er konkurrencedygtigt i forsøget, men ikke bevist optimalt. Den første sammenligning med Leave på sårede fjender var svag, fordi de bots næsten aldrig valgte Leave. Derfor er en tredje, tydeligt anderledes strategi tilføjet; alle resultater er bevaret.

## Sammenligning med de tidligere regler

HP-forsigtig prioriterer højeste HP efter turen før øvrig fremdrift. Afvejet bruger en fælles score for HP, fjernede monstre, loot, tilbageværende skade og Scrap. Begge prioriterer en øjeblikkelig sejr og undgår et øjeblikkeligt nederlag, hvis en sikker fordeling findes.

| Bot | Endure/Leave | Scrap | Perfect v0.5.1 | One-shot v0.6.0 | Forskel | Parret ca. 95 % interval |
| --- | --- | --- | ---: | ---: | ---: | --- |
| HP-forsigtig | Altid Endure | Ingen | 14,0 % | 9,0 % | -5,0 pp | -9,3 til -0,7 pp |
| HP-forsigtig | Altid Endure | Aktiv | 66,5 % | 63,0 % | -3,5 pp | -8,6 til 1,6 pp |
| HP-forsigtig | Leave hvis halvt HP | Ingen | 13,0 % | 8,5 % | -4,5 pp | -8,7 til -0,3 pp |
| HP-forsigtig | Leave hvis halvt HP | Aktiv | 67,5 % | 61,0 % | -6,5 pp | -11,9 til -1,1 pp |
| HP-forsigtig | Selektiv Leave | Ingen | 6,0 % | 3,5 % | -2,5 pp | -6,0 til 1,0 pp |
| HP-forsigtig | Selektiv Leave | Aktiv | 54,0 % | 59,5 % | 5,5 pp | -2,0 til 13,0 pp |
| Afvejet | Altid Endure | Ingen | 9,5 % | 5,0 % | -4,5 pp | -8,5 til -0,5 pp |
| Afvejet | Altid Endure | Aktiv | 63,5 % | 57,5 % | -6,0 pp | -12,5 til 0,5 pp |
| Afvejet | Leave hvis halvt HP | Ingen | 8,5 % | 5,0 % | -3,5 pp | -7,5 til 0,5 pp |
| Afvejet | Leave hvis halvt HP | Aktiv | 65,0 % | 56,5 % | -8,5 pp | -15,0 til -2,0 pp |
| Afvejet | Selektiv Leave | Ingen | 5,0 % | 3,5 % | -1,5 pp | -4,4 til 1,4 pp |
| Afvejet | Selektiv Leave | Aktiv | 54,0 % | 54,5 % | 0,5 pp | -7,0 til 8,0 pp |

Hver celle har 200 runs. Procentpoint er forskel i sejrsandel på parrede seeds. Intervallerne er omtrentlige og beskriver seed-variation for disse faste bots; de er ikke korrigeret for flere sammenligninger. Alle seeds bruger præfikset `balance-2026-09-11-` og numrene `0001`–`0200`.

## One-shot: deck, belønninger og boss

| Bot | Endure/Leave | Scrap | Scrap/run | Kort ved slut | Belønnede normale kills | Boss alene: sejre/ankomster | Loot aldrig trukket |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| HP-forsigtig | Altid Endure | Ingen | 0,0 | 21,8 | 76,6 % | 18/35 | 33,7 % |
| HP-forsigtig | Altid Endure | Aktiv | 5,0 | 16,7 | 83,0 % | 124/134 | 13,6 % |
| HP-forsigtig | Leave hvis halvt HP | Ingen | 0,0 | 21,9 | 75,7 % | 17/34 | 34,0 % |
| HP-forsigtig | Leave hvis halvt HP | Aktiv | 4,9 | 16,9 | 81,4 % | 120/133 | 14,2 % |
| HP-forsigtig | Selektiv Leave | Ingen | 0,0 | 26,1 | 75,6 % | 7/13 | 35,4 % |
| HP-forsigtig | Selektiv Leave | Aktiv | 7,0 | 20,6 | 80,3 % | 114/117 | 17,2 % |
| Afvejet | Altid Endure | Ingen | 0,0 | 21,7 | 76,9 % | 10/29 | 34,7 % |
| Afvejet | Altid Endure | Aktiv | 5,2 | 16,3 | 81,8 % | 115/132 | 14,1 % |
| Afvejet | Leave hvis halvt HP | Ingen | 0,0 | 21,8 | 75,8 % | 10/26 | 35,0 % |
| Afvejet | Leave hvis halvt HP | Aktiv | 5,2 | 16,3 | 80,4 % | 112/129 | 14,5 % |
| Afvejet | Selektiv Leave | Ingen | 0,0 | 25,6 | 76,7 % | 7/10 | 35,4 % |
| Afvejet | Selektiv Leave | Aktiv | 7,7 | 18,7 | 80,0 % | 100/105 | 17,3 % |

Kort ved slut og Scrap/run omfatter både sejre og nederlag. Hurtige nederlag har færre muligheder for at scrappe og trække loot. Andelen af aldrig trukket loot er derfor ikke en ren måling af hastigheden i decket. Første træk af det loot, som faktisk nåede frem, ligger omkring 3–4 ture efter modtagelse; detaljer findes i JSON.

## Dit seneste seed

`896275e7-c70e-460b-949d-d5b76603129e` blev kørt fra starten med de nye regler. Bots genbrugte hverken dine valg eller kendskab til kommende kort. To strategier med selektiv Leave og Scrap vandt:

| Bot | Resultat | Ture | Slut-HP | Scrap | Loot-skip | Endure / Leave |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| HP-forsigtig | Sejr | 20 | 20 | 6 | 3 | 5 / 10 |
| Afvejet | Sejr | 18 | 7 | 5 | 2 | 9 / 6 |

De øvrige ti One-shot-konfigurationer tabte dette seed. De to komplette vinderlogs er gemt i `user-seed-cautious.json` og `user-seed-balanced.json`. I det forsigtige run begyndte kampen mod bossen alene med 5 HP og endte med 20 HP.

Dette viser, at seedet kan vindes, ikke at spilleren burde have fundet netop disse valg. Den eksporterede tur-13-position er fortsat tabt: 15 Attack kan ikke fjerne begge Trolls, og den mindst mulige indgående skade er 8 mod 2 HP.

## Metode og kontrol

- Tidligere regler: spillets faktiske kildekode ved `ed0e317a28ea91ac359598902ec57bd54dc145c1` (v0.5.1, løbende HP, præcis resterende HP giver Perfect, højst ét skip).
- Nye regler: spillets faktiske kildekode ved `03b98e79cf42a06da0cef4a7b5f26a8aecd38bf2` (v0.6.0, One-shot).
- Begge: 20 HP, løbende monster-HP, +1 Attack per tur, samme startdeck og dungeon. Scrap er tilladt i motoren; kontrolstrategien vælger blot aldrig at bruge det.
- Hver tur undersøges fordelinger af de synlige Attack-effekter mellem monstre, inklusive ubrugte effekter. Heal og Block bruges altid, medmindre hele kortet scrappes. Højst ét loot under gennemsnittet for decket skippes, hvis det er berettiget.
- Scrap-strategien overvejer svage kort med vægtet værdi højst 3,2, så længe decket har mere end otte kort. Det er en mulighed, ikke et krav hver tur. Ét kort fjernes med alle dets effekter og uden erstatning.
- Vægte: Attack 1; Block 0,9; Heal 1,2. Den afvejede score er 1,5 × HP efter turen + 2,5 × normale kills/fjernelser + 6 × bossfaser + 0,35 × skade bevaret på overlevende + vurderet loot- og Scrap-værdi. Fremtidig værdi dæmpes, når der er få normale monstre tilbage.
- Selektiv Leave kræver mindst 8 HP efter turen og enten fuldt blokeret angreb, fjende på højst halvt HP eller potentiel opgraderet loot-værdi mindst 1 over deckets gennemsnit. Ellers vælges Endure. Dette er en fast heuristik, ikke en løsning på det optimale valg.
- Planlæggeren modtager ikke seed, RNG, kommende monstre eller rækkefølgen af draw-bunken. Den ser antal resterende monstre og gennemsnittet af kendte kort i decket. Den rigtige motor afgør alle udfald og blandinger.
- Planlæggerens HP-prognose, skade og sejr er kontrolleret mod motoren hver tur. Loot-skip-loftet og One-shot-registrering kontrolleres også. Ingen af de 4.800 runs ramte loftet på 150 ture.
- Brugerens seneste eksport blev desuden genafspillet: alle 12 starttilstande og kill-resultater samt den fulde tur-13-position matcher motoren.
- Heuristikkerne søger ikke flere ture frem. Vægte og valgregler påvirker resultaterne; selv to bots med forskellige mål kan begå de samme strategiske fejl. Gentagne seeds på tværs af strategier er parrede observationer, ikke 4.800 uafhængige seeds.

## Anbefaling

Behold One-shot som forsøg: det ændrer belønningsmønstret, men løser ikke alene balancen. Prioritér bossens mangel på pres efter isolering. Undersøg derefter, om den store afhængighed af Scrap er den ønskede identitet: det er stærkt at kunne forbedre decket, men der er i disse bots en stor afstand mellem aktiv deckpleje og næsten ingen. Endure bør fortsat undersøges, men forsøget beviser ikke, at altid Endure er bedst.

## Filer og gentagelse

- `results.json`: metode, alle 24 opsummeringer, parrede sammenligninger, 4.800 run-resultater og 48 særskilte cases.
- `user-seed-cautious.json` og `user-seed-balanced.json`: komplette automatiske vinderlogs på seneste brugerseed.
- `scripts/simulate-balance.mjs`: kør med `node scripts/simulate-balance.mjs`. Standard er 200 seeds per konfiguration. Kræver Git-historikken med v0.5.1. `node scripts/simulate-balance.mjs --case-traces` genskaber de to vinderlogs.

Spillets kode og liveversion er ikke ændret af denne analyse.
