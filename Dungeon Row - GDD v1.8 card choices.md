# Dungeon Row — GDD v1.8: kortvalg og deckretning

Prototype v0.7.0 bygger på One-shot-reglerne fra v1.7. Forsøget skal skabe valg mellem angreb og forsvar samt mellem fuld-HP- og wound-strategier. Spillets tekster er på engelsk.

## Startdeck

HP-varianten beholder ti kort. De fire ændringer er:

| Antal | Erstatter | Nyt kort | Vælg én effekt per tur |
| --- | --- | --- | --- |
| 2 | Club | Guarded Strike | Attack 3 **eller** Block 4 |
| 1 | Torch | Expose | Attack 1 **eller** Attack 4 mod en fjende, der var såret ved turens start |
| 1 | Bandage | Second Wind | Heal 3 **eller** Attack 2 |

Øvrige startkort er stadig tre Rusty Strike, én Shiv og to Block. Classic Threat beholder hele sit gamle startdeck.

Et kort mærket **Choose one** kan højst have én tildelt effekt. Et valg af en anden effekt erstatter den første. Heal og Block aktiveres direkte på spilleren; Attack kræver et mål. Valg og mål kan ændres før End Turn. Scrap fjerner hele kortet med alle muligheder og giver intet erstatningskort. Almindelige kort som Shiv og Goblin Dagger kan fortsat bruge alle deres effekter.

Expose kan kun tildele Attack 4 til en fjende med mindre end max-HP ved turens start. Muligheden er deaktiveret, når ingen gyldige mål findes. Skade tildelt tidligere i den samme planlægningsfase gør ikke et mål gyldigt.

## Første modtagne One-shot-belønning

Første gang spilleren modtager loot fra et normalt One-shot i et run, vælges ét af følgende kort:

| Valg | Effekt |
| --- | --- |
| Monsterets opgraderede loot | Den sædvanlige belønning, første effekt +1 |
| Executioner | Attack 6 mod fuld HP ved turens start; ellers Attack 3 |
| Rend | Attack 6 mod en fjende såret ved turens start; ellers Attack 3 |

- Valget vises under planlægningen, når mindst ét normalt One-shot har Take loot. Monsterets opgraderede loot er standardvalget.
- Spilleren får **ét** kort i discard, ikke både monsterets loot og alternativet. Executioner og Rend har præcis de viste værdier og får ikke yderligere +1.
- Valget forbruges ved End Turn, også hvis spilleren tager monsterets loot. Preview og skift mellem muligheder forbruger det ikke.
- Et skippet One-shot forbruger ikke muligheden. Hvis alle berettigede loot skippes, gemmes valget til senere.
- Ved flere modtagne One-shot-loot samme tur gælder alternativet den venstreste berettigede fjende. Andre belønninger fungerer normalt.
- Hvis ændrede angreb, Scrap eller loot-skip flytter eller fjerner den berettigede fjende, nulstilles alternativvalget til standard. Valget kan ikke hænge fast på et andet monster uden et nyt valg.
- Bossfaser og almindelige kills giver ikke adgang til dette valg og forbruger det ikke.
- På mobil kan spilleren hoppe til belønningsvalget fra den faste turkontrol.

Executioner og Rend bruger turens starttilstand, uafhængigt af rækkefølgen kortene tildeles. Et fuldt monster, der rammes af et andet kort samme tur, aktiverer derfor stadig Executioners 6 Attack og ikke Rends 6 Attack. Den samlede skade bruges derefter til at beregne kill og One-shot.

## Uændrede regler

One-shot kræver drab fra fuld HP inden for én tur; flere kort og overkill tæller. Tidligere wounds giver almindeligt loot. Højst ét loot kan skippes per tur, og højst ét kort kan scrappes. Alle modtagne kort går i discard. Monster- og bosstal, Endure, healingrækkefølge og eskalering er uændrede. Salvage og nye bossmekanikker indgår ikke i forsøget.

## Eksport og test

HP-runs mærkes `1.8-hp-atk-card-choices-test`. Kortdata registrerer enten/eller samt betingelser; tildelinger registrerer den valgte effekt og målet. Monsterskade indeholder det faktisk beregnede angreb. JSON gemmer både uafsluttet `firstRewardSelection` og det forbrugte `directionReward`; det relevante kill har `rewardChoice`. CSV tilføjer `first_reward`.

Menneskelige tests skal især notere ture med to plausible planer, bevidst fravalg af mulige One-shots og forskelle mellem Executioner og Rend. En ændret winrate alene beviser ikke, at valgene er blevet mere interessante. De tidligere 4.800 simulationer beskrev v0.5.1/v0.6.0 og kan ikke bruges som resultater for denne version.
