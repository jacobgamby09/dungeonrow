# Dungeon Row - GDD v1.4 testvariant: løbende HP og separat ATK

Prototype: **0.2.0**. Eksportens regelsæt: **1.4-hp-atk-test**. Dette tillæg beskriver en alternativ kampmodel til GDD v1.3. Browseren starter i varianten; klassisk v1.3 kan vælges i testpanelet før et nyt run.

## Formål

Undersøg, om vedvarende skade gør små Attack-tal og Leave mere tilfredsstillende uden at fjerne interessante valg om loot og Perfect Kills. Kort, loot, dungeon-fordeling, håndstørrelse og 20 start-HP følger stadig v1.3. Fra prototype v0.2.2 er Scrap en fast mulighed i alle nye runs.

## Monstre har to uafhængige tal

- **HP** er monsterets resterende liv. Start- og max-HP er lig monsterets trykte Threat fra v1.3.
- **ATK** er monsterets angrebsstyrke. Start-ATK = max(1, oprindelig Threat - 2).
- Attack reducerer HP under Resolve. Skaden bevares mellem ture; den reducerer ikke ATK.
- Eskalering giver +1 ATK til alle overlevende. Den ændrer hverken resterende HP eller max-HP.
- Angriberen er den overlevende med højest ATK. Ved samme ATK angriber den længst til venstre, uanset HP.
- Skade mod spilleren = max(0, angriberens ATK - Block).

Eksempel: Troll starter med 10 HP og 8 ATK i denne test. Attack 4 efterlader 6 HP og 8 ATK. Hvis den angriber, giver den stadig 8 skade minus Block. Vælges Leave, har den efter eskalering 6 HP og 9 ATK.

## Kill, Perfect og Endure/Leave

- HP på 0 giver et kill og normal loot til discard.
- Hvis summen af Attack på **drabsturen** er præcis monsterets HP ved turens start, gives opgraderet loot i stedet. Tidligere skade udelukker ikke en Perfect.
- Overskydende Attack giver ingen ekstra effekt og overføres ikke til andre monstre eller boss-stages.
- Endure fjerner stadig kun den netop angribende almindelige fjende uden loot, også når den er såret.
- Leave bevarer dens resterende HP. Alle andre overlevende bevarer også deres sår.
- Tildeling og preview ændrer ikke monsterets faktiske HP. Alt kan fortsat fortrydes før End Turn.

## Bossen

Alle tre stages bruger samme HP/ATK-model. De kan såres over flere ture og kan aldrig Endures. Næste stage kommer først under Refill i den reserverede plads med fuld HP og sin egen start-ATK. Tidligere skade og ATK-eskalering overføres ikke. Den nye stage kan først angribe og eskalere næste tur. Stage 3's død giver straks sejr før andre fjenders angreb.

## Starttal

| Monster | HP | ATK |
|---|---:|---:|
| Rat | 2 | 1 |
| Bat | 3 | 1 |
| Slime | 3 | 1 |
| Goblin | 4 | 2 |
| Guard | 5 | 3 |
| Skeleton | 5 | 3 |
| Cultist | 6 | 4 |
| Ghoul | 6 | 4 |
| Orc | 7 | 5 |
| Wolf Rider | 8 | 6 |
| Knight | 8 | 6 |
| Necromancer | 9 | 7 |
| Troll | 10 | 8 |
| Vampire | 10 | 8 |
| Ogre | 12 | 10 |
| Gravekeeper stage 1 | 8 | 6 |
| Gravekeeper stage 2 | 11 | 9 |
| Gravekeeper stage 3 | 14 | 12 |

## Sammenligning og testlog

Eksporten identificerer kampmodel, prototypeversion og regelsæt. Hvert monster i turens snapshots har resterende HP, max-HP og ATK. `monsterDamage` registrerer tildelt Attack samt HP før og efter Resolve. Det gamle `threat`-felt beholdes som kortets oprindelige dataværdi i denne variant og bruges ikke som løbende HP eller angrebsstyrke.

Denne variant ændrer både skadebevarelse og startangrebsstyrke i forhold til v1.3. En forbedring i overlevelse kan derfor ikke alene tilskrives løbende HP. Sammenlign også oplevelsen af delvise angreb, Leave og Perfects.

Test gerne med samme seed, 20 HP, Scrap til og +1 ATK hver tur. Tidligere runs uden Scrap skal markeres særskilt i sammenligninger. Notér:

1. Blev en såret fjende bevidst bevaret for dens loot, og blev planen gennemført?
2. Gav små Attack-tal et meningsfuldt valg, eller blev de bare placeret et oplagt sted?
3. Blev Perfects for nemme at forberede?
4. Var der stadig mindst to seriøst overvejede linjer?
5. Nåede de ønskede loot-kort at komme i spil?

PDF-printpakken i `output/pdf/` er fortsat mærket v1.3 og beskriver klassisk Threat. Dette tillæg er regelsættet for den digitale HP/ATK-test; PDF'erne er ikke opdateret til varianten.

## Scrap som kerneregel — prototype v0.2.2

Scrap er tilgængeligt fra starten uden tilvalg i testpanelet. Én gang per tur må spilleren permanent fjerne ét helt kort fra hånden i stedet for at bruge det. Kortet giver ingen effekter, og der trækkes ingen erstatning; med fire kort på hånden kan kun de tre andre bruges.

Hvert håndkort har knappen **Scrap card**, som skifter til **Undo Scrap**, når kortet er markeret. Markeringen fjerner kortets tildelinger. Spilleren kan fortryde eller vælge et andet kort indtil **End Turn**; ved fortrydelse skal effekterne tildeles igen. Fjernelsen gennemføres ved End Turn og registreres i run-eksporten.
