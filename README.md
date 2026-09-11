# Dungeon Row — prototype 0.5.0

A local, playable prototype with persistent monster HP and separate Attack. The classic Threat combat model is also available in Test settings. Current rules are described in `Dungeon Row - GDD v1.6 single skip.md`, building on the HP variant in `Dungeon Row - GDD v1.4 testvariant.md`. The update history is in `progress.md`.

The interface is in English. Version 0.2.1 gives monsters a heart and health bar, a separate orange sword/Attack field, a damage preview on the health bar, and a label identifying the attacker. Player health uses the same heart symbol. Version 0.2.2 makes Scrap standard, adds Scrap card / Undo Scrap buttons to each hand card, and labels the unrevealed-monster counter Mobs left in dungeon. Card values are unchanged.

## One-tap support effects and HP forecast — v0.5.0

Heal and Block activate on yourself immediately when clicked; click again to deactivate. The health panel shows current HP → projected HP after End Turn, with actual healing and damage (or All damage blocked). It respects maximum HP and updates with assignments, kills, Scrap and reset. `progress.md` tracks rule and interface changes.

## Perfect loot choice — updated in v0.5.0

Each normal monster with a planned Perfect Kill offers **Take loot** (upgraded, selected by default) or **Skip loot** (no card). Skip at most one reward per turn. Move skip here transfers that choice; other Perfects give upgraded loot. Ordinary kills always add normal loot. Boss stages never give loot. Changing assignments so a kill is no longer Perfect resets that monster's loot choice.

The turn log and JSON/CSV exports record skipped Perfect rewards separately from Scrap. Skipping loot prevents a new card from entering the deck; Scrap removes an existing card at the cost of its effects that turn.

## Mobile layout — v0.3.0

Phones use compact 2 × 2 monster and hand grids. Select an effect and tap a highlighted target; the heart/HP area and orange Attack field remain distinct. The fixed bottom bar shows healing, Block, predicted damage and resulting player HP alongside End Turn. Endure/Leave and end-of-run controls replace it when needed.

Each monster has a separate information button. Scrap and Undo remain directly on hand cards. Menu contains rules, test settings, deck contents, notes and exports. Resizing between phone and desktop preserves the active game and notes. Small screens can scroll the hand clear of the bottom controls; touch phones retain this layout in landscape.

## Start the game

Double-click **Start Dungeon Row.cmd**. It starts the server in the background if needed and opens <http://127.0.0.1:4173>.

Alternatively, run `npm start` from this folder and open that address. Do not open `dist/index.html` directly: the game uses JavaScript modules. Node.js is required and is already available on this computer. There are no game packages to install and no accounts or backend connections.

The server listens on this computer only. A physical phone cannot access the computer's localhost address; mobile controls are checked through browser emulation.

Export an active run before refreshing to load an update. Runs are not saved automatically.

## How to play

- Click or tap Heal/Block to toggle it on yourself. For Attack, select an effect and then a monster. You can also drag effects to their targets.
- Select an assigned effect and choose another target to move it. Click the selected effect again to unassign it. Reset assignments clears all assignments.
- Monster health bars preview damage. An exact kill shows Perfect loot; the highlighted Attack field identifies the enemy that will attack. The line below the row forecasts healing, Block, damage, and your resulting HP.
- Press End Turn. After a normal enemy attacks, choose Endure to remove it without loot or Leave to keep it.
- Scrap is always available in the interface. Click Scrap card directly on a hand card, then Undo Scrap on the same card to cancel. You can also drag its Scrap button to the shared Scrap area. One whole card can be permanently removed per turn; it provides no effects and is not replaced. Undo is available before End Turn.
- Rules and Test settings are at the top. Settings apply when starting a new run.

Default settings: persistent HP, 20 player HP, Scrap enabled, +1 Attack every turn. Monster HP starts at printed Threat; Attack starts at max(1, Threat − 2). Damage persists without lowering Attack. Perfect requires exactly the remaining HP on the killing turn. Only Attack escalates. In classic mode, Threat remains both the kill threshold and attack strength.

Every-other-turn escalation happens after turns 2, 4, 6, etc. Player maximum HP is 20, or starting HP if higher. Exports include all settings and the combat model.

## Record a run

Complete **Observer notes** before End Turn to record desired loot, options considered, and intentionally planned Perfects. The game does not infer player intent.

Open **Run log and export** for JSON or CSV. JSON contains detailed turn states, any unfinished turn, notes, and the final deck. CSV has one row per completed turn. Add overall run notes before exporting if useful.

Export before closing, refreshing, or starting another run. The same seed, version, settings, and choices reproduce the same game. The deck viewer hides the actual draw order.

## Print pack

The historical PDFs in `output/pdf/` are in Danish and describe **classic v1.3**, not the HP/Attack variant:

- **Dungeon Row - Printkort.pdf**: 10 pages, 90 cards: 10 starters, 25 monsters, 3 boss stages, 25 normal loot cards, 25 upgraded loot cards, and 2 reserves.
- **Dungeon Row - Turguide og spillebord.pdf**: 3 pages with setup, turn sequence, special rules, an example, and board slots.
- **Dungeon Row - Testark.pdf**: 5 pages per run, including a 25-turn log, observations, and an interview. The two turn-log pages are A4 landscape; the others are A4 portrait.

Print single-sided at 100% / actual size with automatic orientation. Use one card and guide set plus one test-sheet set per run; print additional observation sheets as needed.

## Status and limitations

Both combat models support click/tap, mouse and touch dragging, Scrap, test settings, notes, and exports. Starter cards, loot, and dungeon composition follow GDD v1.3. The HP variant also lowers initial enemy Attack, so improved survival cannot be attributed to persistent HP alone.

Human playtesting is ongoing. Automated checks do not establish the design hypotheses H0–H6. Record the combat model, settings, and play medium for each test.

An optional read-only WebMCP tool exposes visible board information in supporting browsers. It never reveals future cards or changes the game. Unsupported browsers work without it.

## Verification and source

- `npm test`: 45 rules tests, including 100 automated runs per combat model and checks for wounds, independent Attack, Perfects, bosses, Scrap, and exports.
- `node scripts/verify-qol.mjs`: desktop/mobile checks for one-tap Heal/Block, undo, the HP forecast, Scrap interactions and resolved HP. Supports `DUNGEON_ROW_URL` for hosted checks.
- `node scripts/verify-perfect-loot.mjs`: desktop and mobile checks for independent loot choices, changing a Perfect into an overkill, resolving the turn and exporting the resulting deck. Set `DUNGEON_ROW_URL` to verify a hosted version.
- `node scripts/verify-mobile.mjs`: phone layouts at 320, 390 and 430 pixels, landscape, menu/details, layout switching, a full mobile run, fixed turn controls, and exports. Uses the same Playwright setup below.
- `node scripts/verify-browser.mjs`: browser checks for assignments, previews, undo, mouse/touch dragging, Scrap, complete runs in both models, exports, mobile layout, and 200% text size. Uses this computer's bundled Playwright; elsewhere set `PLAYWRIGHT_PACKAGE` to the installed Playwright package's `package.json`.
- `scripts/build-print-pack.py`: regenerates the historical PDF pack from card data with ReportLab and Arial. Requires Python with `reportlab` and `pypdf`.

Source: `dist/data.mjs` (cards), `dist/engine.mjs` (rules), `dist/app.mjs` (interface), and `dist/styles.css` (appearance), and `dist/mobile.css` (mobile layout). No build step or external resources are needed while playing.
