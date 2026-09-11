# Dungeon Row — plan for prototypen

Grundlag: [GDD v1.3](Dungeon%20Row%20-%20GDD%20v1.3.md).

## Implementeringsstatus - prototype 0.2.0

- Fase 1: Printkort, turguide, spillebord og testark er lavet i `output/pdf/`.
- Fase 2: Ét delt klassisk browser-run er analyseret (8 ture, 11 kills, 9 Perfects, død på floor 3). Den fulde menneskelige testprotokol afventer; dette tæller ikke som tre manuelle papirtests.
- Fase 3-5: Spilmotor med regeltests, browserbord, testpanel, noter og JSON/CSV-eksport er implementeret. v0.2.0 starter i testvarianten med løbende HP og separat ATK; klassisk v1.3 kan stadig vælges i testpanelet.
- Fase 6: Klik/tap, musetræk og touch-træk er implementeret og kontrolleret i browseren. Fysisk mobiltest afventer.
- Fase 7: Den resterende testprotokol og vurderingen af kernen afventer menneskelige runs.

Regler og testspørgsmål for den nye variant findes i `Dungeon Row - GDD v1.4 testvariant.md`. Hold resultater fra de to kampmodeller adskilt. Printpakken er fortsat til klassisk v1.3. Startvejledning og teknisk kontrol findes i `README.md`.

## Mål

Undersøg, om spilleren vælger fjender på grund af deres loot, og om kernen kan bære et run på 15–25 ture. Arbejdet går fra tre manuelle runs til en lokal browserprototype med samme regler.

Første digitale milepæl er et komplet run fra opsætning til sejr eller død, med synlige beslutninger og en log, vi kan gennemgå bagefter.

## 1. Klargør den manuelle test

Leverancer:

- Et printark med starterkort, monsterkort, boss-stages og loot.
- Fire nummererede monsterpladser, plads til draw/discard og en HP-tæller.
- En kort turguide med v1.3's rækkefølge og særregler for bossen.
- Et testark til observationer pr. tur og et kort interview efter runnet.

Print tilstrækkelige loot-kopier til gentagne monstre. GDD'ets 15 normale og 15 opgraderede kort er forskellige loot-varianter; én af hver er ikke nok, hvis to ens monstre giver samme variant. Brug ekstra kopier eller blanke reservekort.

**Klar når:** Et run kan gennemføres med materialerne, og testeren kan registrere hænder, valg og udfald uden at opfinde manglende komponenter.

## 2. Spil tre manuelle runs uden Scrap

En person spiller, og en observatør fører om muligt log. Første run bruges også til at opdage uklarheder i reglerne. Spilleren forklarer sine overvejelser uden at blive ledt mod bestemte kort.

Notér især:

- Hvilket loot spilleren ønsker, og om ønsket ændrer valget af mål.
- To seriøst overvejede tildelinger, når de findes.
- Bevidste og tilfældige Perfect Kills.
- Hvorfor Leave vælges, og hvad spilleren forventer at kunne gøre næste tur.
- Hvornår ekstra loot opleves som en forringelse af decket.
- Dødsårsag, turantal og tidspunktet for eventuel kedsomhed.

Afslut hvert run med: Hvilke monstre håbede du at møde? Hvilket valg var mest interessant? Hvornår føltes det, som om du ikke havde et reelt valg?

Efter de tre runs samles observationerne i en kort testopsamling. Regelrettelser dokumenteres, og eventuelle ændringer af tal testes én ad gangen. GDD'ets hypoteser og beslutningskriterier anvendes og rapporteres sammen med observationerne.

**Klar når:** Tre runs er logget, regeluklarheder er afklaret, og vi har taget stilling til, om Scrap skal aktiveres efter GDD'ets protokol. Hvis GDD'ets stopkriterium rammes, dokumenteres det, og retningen afklares før videre implementering.

## 3. Implementér reglerne som en selvstændig spilmotor

Browserudgaven bygges først til lokal brug. Kortdata og regler holdes adskilt fra visningen, så samme regler kan testes uden at klikke gennem brugerfladen.

Implementeringsrækkefølge:

1. Kortdata fra GDD, unikke kortinstanser og blanding inden for floors.
2. Opsætning, fire faste monsterpladser, draw og discard.
3. Tildeling af enkelte tal, ubrugte tal og fuld fortrydelse før End Turn.
4. Resolve: Scrap, Heal, kills, Perfects, loot og fjendens angreb.
5. Endure/Leave, eskalering og Refill.
6. Bossens ankomst, reserveret plads mellem stages og øjeblikkelig sejr/død.
7. Scrap som en indstilling, der vælges før et run.

Indfør et seed, som bestemmer blandingen. Samme seed, regelsæt, indstillinger og handlinger skal give samme run.

Automatiske regeltests skal dække de fejl, der kan ændre spillerens beslutning:

- Begge linjer i GDD'ets eksempel, med både Endure og Leave.
- Separate Attack-tal på samme eller forskellige mål og opgradering ved præcist match.
- Heal ved HP-loftet, overskydende Block og død før Endure/Leave.
- Venstreprioritet ved samme Threat og en tom række efter kills.
- Omblanding samt færre end fire tilgængelige kort.
- Scrap af hele kortet uden effekt eller senere tilbagekomst i discard.
- Bossens ankomst ved tomt Dungeon Deck, herunder når rækken først er fuld.
- Ny boss-stage under Refill, uden angreb eller eskalering på indsættelsesturen.
- Bossen kan ikke Endures, og Stage 3's død giver sejr før andre angreb.

**Klar når:** Regeltestene består, og et komplet run kan gennemføres gennem spilmotoren.

## 4. Byg ét spilbart browserbord

Brugerfladen skal bestå af:

- Øverst: HP, tur, resterende dungeon-kort og adgang til deckets indhold.
- Midten: fire faste monsterpladser med Threat, synligt loot og tildelt Attack.
- Nederst: fire håndkort med individuelt valgbare tal.
- Betjening: End Turn, nulstil tildelinger og Scrap-felt, når funktionen er aktiv.

Første betjening er klik på tal og derefter klik på mål. Et tildelt tal kan flyttes eller tages tilbage. Et kort kan ikke give effekt samtidig med, at det er markeret til Scrap.

Under tildeling vises:

- Tildelt Attack i forhold til hvert monsters Threat.
- Om resultatet er et kill eller Perfect Kill.
- Hvilken overlevende fjende der vil angribe.
- Forventet healing, skade efter Block og HP efter angrebet.

Endure og Leave vises ved den fjende, der netop angreb. Bossens automatiske fastholdelse kræver intet valg. Ved sejr eller død vises resultatet og mulighed for et nyt run.

Brug tekst, enkle farver og symboler. Tal og labels skal også forklare tilstanden, så farver ikke står alene.

**Klar når:** Man kan spille et helt run i browseren, fortryde tildelinger og genstarte uden udviklerværktøjer. Et visuelt browsertjek bekræfter, at de centrale oplysninger kan læses, og at der ikke er konsolfejl under et run.

## 5. Tilføj testværktøjer og run-eksport

Et særskilt testpanel giver adgang til seed, Scrap til/fra, start-HP og eskalering hver tur eller hver anden tur. Indstillinger fastlægges før start og gemmes med runnet. Standarderne følger GDD v1.3, med Scrap slået fra.

Gem automatisk:

- GDD-/prototypeversion, seed og indstillinger.
- Hånd, række med placeringer og Threat samt HP ved turstart.
- Endelige tildelinger, kills, Perfects, loot og scraps.
- Angriber, skade, Endure/Leave og tilstanden efter Refill.
- Deckstørrelse, turantal, varighed og slutresultat.

Skeln mellem automatiske spildata og menneskelige observationer. Systemet kan ikke selv afgøre, om spilleren ønskede et kort, overvejede to linjer eller jagtede en Perfect bevidst. Disse oplysninger føres i testarket eller et separat notefelt. Bossens fastholdelse tælles aldrig som et frivilligt Leave.

Runnet skal kunne eksporteres som JSON til detaljeret gennemgang og CSV med én række pr. tur til sammenligning. Eksporten skal også være tilgængelig efter sejr eller død.

**Klar når:** Et eksporteret run kan sammenholdes med de faktiske valg og udfald, inklusive slutdecket, og to runs med samme seed og handlinger giver samme resultat bortset fra tidsmålinger og noter.

## 6. Tilføj træk-og-slip og kontrollér mobilbetjening

Byg træk-og-slip oven på samme tildelingslogik som klikbetjeningen. Behold klik/tap som alternativ. Separate tal på samme kort skal fortsat kunne få forskellige mål; Scrap modtager hele kortet.

Kontrollér et smalt mobilformat og et desktopformat:

- Monsterloot og alle håndkort er læselige.
- Tildeling, flytning, fortrydelse og Scrap virker med mus og touch.
- Ugyldige slip ændrer ikke spilstaten.
- End Turn kan ikke udløses utilsigtet af et slip.
- Endure/Leave og run-resultatet er tilgængelige uden blokerende dialogbokse.

**Klar når:** Et helt run kan gennemføres med både klik/tap og træk-og-slip. Hvis touch kun er testet via emulering, noteres det; fysisk mobiltest er en separat kontrol.

## 7. Gennemfør den resterende testprotokol

Fortsæt efter de tre manuelle runs med GDD'ets syv normale runs, tre grådig-tynd-runs hvis Scrap er aktivt, og to runs med nye spillere. Nye spillere ser kun én demonstreret tur før deres eget run.

Notér skiftet fra papir til browser og alle ændringer af regler eller tal. Resultater på tværs af forskellige versioner behandles ikke som én uændret testserie.

Lav en afsluttende opsamling med:

- Resultater for H0–H6 og konkrete eksempler på interessante beslutninger.
- Om loot ændrede valg af mål, og hvilke kort der blev efterspurgt.
- Om Leave førte til det planlagte kill.
- Oplevet deck bloat, runlængde og kedsomhed.
- Anbefaling: fortsæt med kernen, justér bestemte regler/tal eller stop og revurdér.

**Klar når:** Vi kan begrunde næste skridt med observerede runs frem for alene at vurdere idéen på papiret.

## Afgrænsning

Denne prototype omfatter ét regelsæt, de eksisterende 15 monstertyper og Gravekeeper. Map, meta-progression, relics, ekstra verber, monster-abilities, animationer, lyd, konti, backend og offentlig hosting indgår ikke i første version.

## Næste konkrete handling

Lav printpakken, turguiden og testarket fra fase 1. Derefter gennemføres de tre manuelle runs. Den første digitale leverance er spilmotoren med regeltests efterfulgt af et komplet run med klikbetjening.
