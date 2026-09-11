# Dungeon Row — GDD v1.6: ét loot-skip per tur

Fra prototype v0.5.0 gælder reglerne i `Dungeon Row - GDD v1.5 perfect loot.md` med følgende ændring:

- Højst **én** Perfect-belønning kan skippes per tur. Andre Perfect Kills giver opgraderet loot.
- **Move skip here** flytter et eksisterende skip til et andet Perfect Kill; den tidligere belønning skifter til Take loot.
- Take loot frigiver turens skip, og et valg bortfalder stadig, hvis monsteret ikke længere har en planlagt Perfect Kill.
- Scrap er fortsat en separat mulighed: højst ét helt håndkort per tur, uden effekter eller erstatningskort.

Formålet er at teste, om mindre kontrol over nye kort bevarer de interessante loot-valg og samtidig begrænser, hvor let et lille stærkt deck kan opbygges. Runs fra v1.5 og v1.6 skal sammenlignes som forskellige regler.

## Betjening

Heal og Block aktiveres på spilleren med ét klik og deaktiveres med et nyt klik. Deres rækkefølge og styrke er uændret. Attack kræver stadig valg af et monster.

HP-feltets **After turn** er en prognose, ikke en ændring af faktisk HP. Heal afvikles før fjendeangrebet og stopper ved max-HP. Block reducerer skade, men overskydende Block healer ikke. Ved en planlagt sejr angriber fjenderne ikke.
