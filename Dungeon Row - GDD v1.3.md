# Prototype GDD v1.3 — arbejdstitel: *Dungeon Row*

**Formål:** Papirprototype der tester ét spørgsmål: *får spilleren lyst til bestemte monstre, fordi hun vil have deres kort?* Hvis svaret er nej, er det et combat-puzzle uden hook, og Layer 2 er ikke løsningen.
**Sekundært:** bærer kernen 15-25 turns uden at blive ensformig?
**Ikke formål:** Balance, indhold, meta, tema-polish. Alt der ikke tester kernen er ude (se §10).

---

## 1. Pitch

> Et light dungeon-deckbuilder, hvor hver fjende også er det kort, du kan vinde. Dræb monstre for at stjæle deres udstyr og bygge dit deck. Overlever du dem i stedet, koster det HP og du går glip af kortet. Ram et monsters Threat præcist, og du får den opgraderede udgave.

## 2. Hypoteser der testes

| # | Hypotese | Måles ved |
|---|---|---|
| H0 | Spilleren begærer monstre for deres loot | Antal turns hvor spilleren siger højt, at hun vil have et bestemt kort (mål: ≥1 pr. 3 turns). **Stærkeste signal:** loot-ønsket ændrer den ellers optimale combat-beslutning ("jeg burde tage Ogre 12, men jeg går efter Vampire for Fang") |
| H1 | Hver turn er et lille puzzle | Primært: havde spilleren mindst to seriøst overvejede linjer? Ja/nej, noter begge. Sekundært: antal flyttede tildelinger før End Turn |
| H2 | Endure vs. Leave er et reelt dilemma | Antal Leave pr. run, og om Leave nogensinde fører til det kill, der var målet |
| H3 | Perfect Kill jages aktivt | Bevidste vs. tilfældige Perfects (spilleren siger det højt før resolve) |
| H4 | Tynd-deck-strategien er ikke dominant | 3 runs spillet grådigt tyndt: når de floor 3? |
| H5 | Run-længde passer til mobil | 15-25 turns, 10-15 min |
| H6 | Læsbarhed | Ny spiller kan forklare loopet efter at have set 1 turn |

## 3. Komponenter (indekskort)

- 10 starter-kort
- 25 monsterkort (fra 15 typer) + 3 boss-kort
- 30 loot-kort (15 normale + 15 opgraderede; opgraderet = første tal +1)
- 1 HP-tæller (20), 1 Block-tæller, evt. terning til Threat-stigning
- Et Scrap-felt og en discard-bunke

## 4. Grundregler

### 4.1 Opsætning
- HP = 20. Max HP = 20.
- Bland starter-decket. Læg Dungeon Deck (§7), og læg bossens 3 stages separat i rækkefølge.
- Fyld Dungeon Row med 4 monstre fra venstre mod højre. Monstre beholder deres pladser; rækken komprimeres ikke, når et monster fjernes.

### 4.2 Kortsprog
Der findes præcis tre verber. Ingen kort har tekst.

- **Attack N** – bidrager N til ét monster.
- **Block N** – reducerer skade mod dig denne turn.
- **Heal N** – genvind N HP (max 20).

Et kort kan have to tal (fx *Attack 2 / Attack 2* eller *Attack 3 / Block 2*). Hvert tal tildeles separat: Bone Wand *Attack 4 / Attack 4* kan ramme to monstre med 4 hver eller stacke 8 på ét. Notationen "4/4" i tabellerne betyder altid to separate tal.

**Observation, ingen regel:** med kun én angriber pr. turn er Block 3 og Heal 3 ofte matematisk ens; forskellen er timing (Block er bedst ved fuld HP, Heal reparerer gammel skade, og Block over angriberens Threat spildes). Hvis testeren omtaler dem som "samme kort", noteres det. Ingen Armor eller persistent Block indføres i v1.

Monstre har ét tal: **Threat**. Under Threat vises looten (navn + tal).

### 4.3 Turn-sekvens
1. **Draw 4.** Løber draw-bunken tør, bland discard til en ny draw-bunke og fortsæt trækket. Hvis begge bunker er tomme, spiller du med de kort, du har kunnet trække. Hånden fyldes ikke op senere på turen.
2. **Tildel.** Træk hvert tal til et mål: et monster (Attack) eller dig selv (Block/Heal). Tal må efterlades ubrugte uden effekt. Hvis Scrap er aktiveret, kan ét helt kort i stedet trækkes til Scrap-feltet (§4.4). Alt kan fortrydes frit indtil End Turn.
3. **Resolve.** Fjern eventuelt scrappet kort uden effekt. Læg derefter alle tildelte Heal-tal sammen, og genvind HP op til max 20; overskydende Heal går tabt. Resolve så alle tildelte angreb: For hvert monster gælder sum af Attack ≥ Threat → dræbt, loot til discard. Sum = Threat → **Perfect Kill**, opgraderet loot i stedet. Sum < Threat → intet sker (monstre har ikke HP; spildt Attack er spildt). Overskydende Attack overføres ikke til andre monstre eller boss-stages. Dræbes bossens Stage 3, vinder du straks, før fjendens angreb.
4. **Angreb.** Det stærkeste overlevende monster angriber. Ved samme Threat angriber monstret længst til venstre. Skade = **max(0, Threat − samlet Block)**. Block forsvinder derefter. Ved HP ≤ 0 slutter runnet straks, før Endure/Leave. Hvis ingen monstre overlever, springes angrebet og trin 5 over; Block forsvinder stadig.
5. **Endure eller Leave.** For det monster, der netop angreb, vælger du:
   - **Endure** → fjern det. Ingen loot.
   - **Leave** → det bliver stående og eskalerer.
   Andre monstre kan ikke Endures; de bliver stående, til de selv er stærkest. Boss-stages kan aldrig Endures: Hvis bossen angreb, bliver den automatisk stående. Dette er ikke et frivilligt Leave og tælles ikke med i H2.
6. **Eskalering.** Alle overlevende monstre +1 Threat.
7. **Refill.** Indsæt først en eventuel ventende boss-stage efter reglerne i §4.5. Fyld derefter tomme pladser fra venstre mod højre fra Dungeon Deck. Når sidste almindelige monsterkort er trukket, indsættes bossens Stage 1, hvis der er en ledig plads, og bossen ikke allerede er ankommet. Kan rækken ikke fyldes, fortsætter spillet med færre end 4 monstre. Nye monstre og boss-stages kan først angribes, angribe og eskalere fra næste tur. Alle resterende kort på hånden → discard, også kort med ubrugte tal.

Konsekvens: et monster, du holder i live for dets loot, får +1 Threat hver tur. Det skader dig kun på ture, hvor det er den stærkste overlevende fjende (ved lighed: længst til venstre), og Block reducerer skaden. Rækken har hukommelse uden tekst eller status.

Død ved HP ≤ 0. Sejr når bossens sidste stage er dræbt.

### 4.4 Scrap
**De første 3 runs spilles uden Scrap.** Reglen aktiveres kun, hvis deck bloat viser sig som et reelt problem.

Når aktiveret:
- Ét helt kort pr. turn kan trækkes til Scrap: det fjernes permanent fra spillet under Resolve og **giver ingen effekt denne turn**. Et kort med to tal kan enten bruges eller scrappes; ingen af dets tal må bruges, hvis kortet scrappes.
- Prisen er altså ét af fire draws nu, for at alle fremtidige draws bliver bedre.

### 4.5 Boss
Bossens 3 stages ligger separat fra Dungeon Deck. Når alle almindelige monsterkort er trukket, kommer Stage 1 ind under Refill i den første ledige plads fra venstre. Er rækken fuld, venter den til et senere Refill med en ledig plads. Almindelige monstre kan stadig stå i rækken, når bossen ankommer.

Når Stage 1 eller 2 dræbes, reserveres dens plads til næste stage. Pladsen regnes som tom ved denne turs fjendtlige angreb. Næste stage indsættes først under Refill, i samme plads og med sin trykte Threat. Den kan hverken angribes, angribe eller eskalere på indsættelsesturen. Overskydende Attack overføres ikke mellem stages.

Boss-stages eskalerer som andre monstre fra turen efter indsættelsen. De kan ikke Endures; når bossen angriber, bliver den automatisk stående. Boss giver ingen loot, heller ikke ved Perfect Kill.

Dræbes Stage 3, vinder spilleren straks, før eventuelle overlevende monstre angriber.

---

## 5. Starter-deck (10 kort)

| Antal | Kort | Effekt |
|---|---|---|
| 3 | Rusty Strike | Attack 2 |
| 2 | Club | Attack 3 |
| 1 | Shiv | Attack 1 / Attack 1 |
| 1 | Torch | Attack 1 |
| 2 | Block | Block 3 |
| 1 | Bandage | Heal 3 |

Maks Attack i én hånd fra starterdeck er 10 (Club + Club + Strike + Shiv), men det kræver et bestemt 4-korts draw ud af 10. Orc 7 er realistisk; Troll 10 er meget usandsynligt uden loot, med vilje.

## 6. Monstre (15 typer)

Opgraderet loot = normal loot med første tal +1.

**Floor 1 · Threat 2-5**

| Monster | Threat | Loot |
|---|---|---|
| Rat | 2 | Rat Hide · Block 1 |
| Bat | 3 | Bat Fang · Attack 1 / Attack 1 |
| Slime | 3 | Slime Salve · Heal 2 |
| Goblin | 4 | Goblin Dagger · Attack 2 / Attack 2 |
| Guard | 5 | Guard Shield · Block 4 |

**Floor 2 · Threat 5-8**

| Monster | Threat | Loot |
|---|---|---|
| Skeleton | 5 | Bone Blade · Attack 4 |
| Cultist | 6 | Dark Potion · Heal 5 |
| Ghoul | 6 | Ghoul Claw · Attack 3 / Block 2 |
| Orc | 7 | Orc Axe · Attack 6 |
| Wolf Rider | 8 | Wolf Spear · Attack 3 / Attack 3 |

**Floor 3 · Threat 8-12**

| Monster | Threat | Loot |
|---|---|---|
| Knight | 8 | Tower Shield · Block 6 |
| Necromancer | 9 | Bone Wand · Attack 4 / Attack 4 |
| Troll | 10 | Troll Club · Attack 8 |
| Vampire | 10 | Vampire Fang · Attack 5 / Heal 2 |
| Ogre | 12 | Ogre Maul · Attack 10 |

**Designregel:** loot-kvalitet følger *ikke* Threat monotont (Goblin 4 giver bedre loot end Guard 5; Wolf Rider 8 er svagere loot end Orc 7). Uden det er "dræb den stærkeste" altid rigtigt, og H2 dør.

**Boss · Gravekeeper:** Stage 1 Threat 8 → Stage 2 Threat 11 → Stage 3 Threat 14.

## 7. Dungeon Deck (25 + boss)

Banded shuffle: bland inden for hver floor, stak floors oven på hinanden.

| Floor | Antal | Fordeling |
|---|---|---|
| 1 | 9 | Rat ×2, Bat ×2, Slime ×2, Goblin ×2, Guard ×1 |
| 2 | 9 | Skeleton ×2, Cultist ×2, Ghoul ×2, Orc ×2, Wolf Rider ×1 |
| 3 | 7 | Knight ×2, Necromancer ×1, Troll ×2, Vampire ×1, Ogre ×1 |
| Boss | 3 stages | separat; ankommer under Refill efter sidste almindelige kort er trukket |

Kurven er bremsen på tynd-deck-strategien: et deck der stopper med at vokse på floor 1, skal dø på floor 2.

## 8. Eksempel-turn

Hånd: Club 3, Rusty Strike 2, Shiv 1/1, Block 3.
Række fra venstre mod højre: Goblin 4 (→ Dagger 2/2), Slime 3, Guard 5, Skeleton 5 (→ Bone Blade 4).

Mulighed A: Club 3 + Shiv 1 → Goblin 4 **Perfect** (Dagger 3/2). Strike 2 + Shiv 1 → Slime 3 **Perfect** (Salve 3). Block 3. Guard 5 angriber, fordi den står længst til venstre blandt de stærkeste overlevende: 5 − 3 = 2 skade.

- **Endure:** Guard fjernes uden loot. Kun Skeleton eskalerer til 6. Tre pladser er ledige til Refill.
- **Leave:** Guard bliver stående. Guard og Skeleton eskalerer begge til 6. To pladser er ledige til Refill.

Mulighed B: Club 3 + Strike 2 → Skeleton 5 **Perfect** (Bone Blade 5). Shiv 1/1 kan ikke dræbe noget alene og efterlades ubrugt. Block 3. Guard 5 angriber: 2 skade.

- **Endure:** Guard fjernes uden loot. Goblin eskalerer til 5 og Slime til 4. To pladser er ledige til Refill.
- **Leave:** Guard bliver stående. Goblin eskalerer til 5, Slime til 4 og Guard til 6. Én plads er ledig til Refill.

A giver to kort, herunder et fleksibelt angreb og healing; B giver ét koncentreret angreb på 5. Ved samme Endure/Leave-valg efterlader B flere gamle monstre, mens A åbner flere pladser til nye trusler. Det er den slags afvejning mellem loot og næste række, prototypen skal producere.

## 9. Åbne beslutninger (defaults i prototypen)

| Beslutning | Default | Alternativ hvis default fejler |
|---|---|---|
| Stacking af Attack på samme mål | Tilladt, og det er ikke til forhandling | Hvis Perfect bliver for let: justér Threat-fordeling eller Perfect-reward, aldrig kombinatorikken |
| Scrap | Slået fra i de første 3 runs | Ren fjernelse, 1 pr. turn. Hvis døde hænder føles for hårde: +1 Attack ved scrap |
| Eskalering | +1 Threat pr. turn | +1 hver anden turn |
| Loot-eskalering (monster der står længe giver bedre loot) | Nej | Ja — kun hvis Leave aldrig vælges |
| Endure på andre end angriberen | Nej | Ja, mod at tage dets Threat som ekstra skade — kun hvis junk-blokade (§11) viser sig |
| Hånd-størrelse | 4 | 5 |
| Start-HP | 20 | 25 |

## 10. Uden for scope (Layer 2, dokumenteres separat)

Rumvalg/map · Dungeon Laws · Relics · Unikke opgraderede loot-kort · Monster-abilities og Elites · Loot/Harvest-valg · Carry-slot · Ressource-tema · Al meta-progression · Flere end tre verber.

## 11. Testprotokol

**Runs, i rækkefølge:**
1. 3 runs **uden Scrap**. Noter om deck bloat opleves som et problem, og hvornår.
2. 7 runs normalt spil med Scrap aktiveret (kun hvis 1 viste behov; ellers 7 runs uden).
3. 3 runs "grådig tynd" (kun hvis Scrap er aktiveret): scrap hver turn, behold de 4-5 bedste kort.
4. 2 runs med en ny spiller, som kun får vist én turn først (H6).

**Log pr. turn:** turn-nr · HP · deck-størrelse · kills · Perfects (bevidst/tilfældig) · Endure/Leave-valg og hvilket monster (bossens automatiske fastholdelse noteres separat og tælles ikke som Leave) · scraps · to overvejede linjer (ja/nej + hvad) · antal flyttede tildelinger · "sagde spilleren, at hun ville have et bestemt kort?"

**Log pr. run:** udfald · floor nået · turns · minutter · slut-deck (liste) · "hvornår blev det kedeligt?" (turn-nr, hvis relevant) · blev et junk-monster bevidst efterladt for at blokere en plads?

**Beslutningskriterier:**
- **H0 fejler** hvis spilleren i færre end 1 af 3 turns nævner et kort, hun vil have → hooket bærer ikke. Stop. Layer 2 løser ikke det.
- H4 fejler hvis ≥2 af 3 grådig-tynd-runs når floor 3 → scrap er for billig; overvej +1 Threat til stærkeste monster ved scrap.
- H2 fejler hvis Leave vælges <2 gange pr. run i gennemsnit, *mens H0 holder* → begæret er der, men +1 Threat pr. turn er for dyrt. Løsning: eskalering hver anden turn, eller loot-eskalering (§9). Ikke et kerneproblem.
- H3 fejler hvis <30 % af Perfects er bevidste → justér Threat-fordeling eller gør opgraderet loot større (+2 i stedet for +1). Rør ikke stacking.
- H1/H5 fejler hvis spilleren rapporterer kedsomhed før turn 15 i ≥5 af 10 runs, *selvom H0 holder* → problemet er kurve/indhold, ikke kernen; det er dér Layer 2 hører til.

## 12. Noter til den digitale version (ikke prototypen)

Én gestus i hele spillet: træk tal til mål. Scrap er et felt, ikke en knap. Undo er gratis indtil End Turn. Ingen popups. Rækken markerer den fjende, der vil angribe efter de aktuelt tildelte kills: den stærkste overlevende, og ved samme Threat den længst til venstre. Markeringen opdateres under tildeling og undo; hvis alle monstre dræbes, markeres ingen.