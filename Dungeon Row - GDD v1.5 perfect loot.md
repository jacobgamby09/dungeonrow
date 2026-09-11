# Dungeon Row — GDD v1.5: Perfect loot-valg

Denne opdatering bygger på HP/Attack-varianten i `Dungeon Row - GDD v1.4 testvariant.md`. Den gælder fra prototype v0.4.0. Samme loot-valg er tilgængeligt ved brug af den klassiske Threat-kampmodel.

## Regel

- **Almindeligt kill:** Monsterets normale loot føjes automatisk til discard.
- **Perfect Kill:** Spilleren vælger enten opgraderet loot til discard eller ingen loot. Opgraderingen er fortsat +1 på loot-kortets første tal.
- Valget gælder separat for hvert monster, også ved flere Perfect Kills på samme tur.
- Der gives ingen erstatning, healing eller anden bonus for at fravælge loot.
- Boss-stages giver fortsat ingen loot.

## Betjening og rækkefølge

Når tildelt Attack præcis matcher monsterets resterende HP (eller Threat i klassisk kamp), vises **Take loot** og **Skip loot** på kortet. Take loot er valgt som standard. Spilleren kan ændre valget indtil End Turn.

Ændres tildelingerne, så monsteret ikke længere har et Perfect Kill, bortfalder loot-valget. Bliver det senere Perfect igen, starter valget på Take loot. Reset assignments nulstiller også loot-valg. Scrap kan ændre angrebssummen og følger samme regel.

Ved End Turn fjernes markeret Scrap, Heal afvikles, og kills og loot-valg gennemføres. Derefter fortsætter den eksisterende rækkefølge for sejr, fjendeangreb, død, Endure/Leave og næste tur. Loot-valget ændrer ikke angrebsstyrke, eskalering eller genopfyldning.

## Formål og næste test

Perfect skal være værdifuldt, også når monsterets loot ikke passer til decket. Præcision giver kontrol over nye kort; Scrap fjerner eksisterende kort til prisen af deres effekter den tur.

Registrér, hvilke Perfect-belønninger der fravælges, om små Attack-tal bliver mere attraktive, og om muligheden gør små stærke decks for lette at opnå. Sammenlign kun runs med deres konkrete prototypeversion og regelsæt.
