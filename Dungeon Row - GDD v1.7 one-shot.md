# Dungeon Row — GDD v1.7: One-shot

Fra prototype v0.6.0 erstatter **One-shot** Perfect Kill i standardvarianten med løbende HP og separat Attack. Dette bygger på v1.6 med højst ét loot-skip per tur.

## Hvornår tæller det?

- Monsteret skal have fuld HP ved turens start og dræbes inden for samme tur.
- Flere kort og flere Attack-effekter må kombineres. Deres samlede skade skal være mindst monsterets HP; overkill tæller.
- Et monster må gerne have stået urørt på rækken i tidligere ture. Det afgørende er fuld HP, ikke ankomstturen.
- Et tidligere såret monster giver almindeligt loot, også hvis det rammes præcist på resterende HP, eller angrebet overstiger dets oprindelige max-HP.

Eksempler med et monster med 6 max-HP:

| Situation | Resultat |
| --- | --- |
| 6/6 HP, to kort med 3 + 3 Attack | One-shot |
| 6/6 HP, 7 Attack | One-shot |
| 6/6 HP, 4 Attack | Monsteret overlever med 2 HP |
| 2/6 HP fra en tidligere tur, 2 eller 7 Attack | Almindeligt kill |

## Belønning og betjening

- Et One-shot giver valget **Take loot** eller **Skip loot**. Take loot er standard og opgraderer kortets første effekt med +1.
- Højst ét loot kan skippes per tur. **Move skip here** flytter valget; øvrige One-shots giver opgraderet loot.
- Ekstra Attack bevarer et valgt skip. Hvis tildeling, reset eller Scrap fjerner den nødvendige skade, bortfalder valget. Et genetableret One-shot starter med Take loot.
- Almindelige kills giver automatisk normal loot. Alt modtaget loot går i discard.
- Bossfaser kan registreres som One-shot, men giver fortsat hverken loot eller mulighed for skip. Bossens kampregler er uændrede i dette eksperiment.
- Scrap er fortsat højst ét helt håndkort per tur uden effekter eller erstatningskort.

## Test og historik

Hypotesen er, at belønningen kræver en tydelig prioritering af samlet skade, mens løbende skade stadig hjælper spilleren videre. Små monstre kan stadig være lette at One-shotte. Vi ved endnu ikke, om denne regel samlet giver færre opgraderinger eller sejre end v1.6.

Classic Threat beholder v1.6-reglernes præcise Perfect Kill som sammenligning. HP-varianten eksporteres som `1.7-hp-atk-one-shot-test`. JSON registrerer `oneShot` separat fra klassiske `perfect`; CSV har en separat `one_shots`-kolonne. Observer notes bruger `intentionalOneShots` i HP-varianten. Historiske runfiler og GDD-versioner ændres ikke.
