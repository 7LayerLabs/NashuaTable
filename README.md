# Nashua Table

Complete working project: `C:\Users\derek\OneDrive\Desktop\nashua_table`

Open **Start-Nashua.cmd** to start the local server and launch the map. Or run `npm start` in this folder, then open **http://127.0.0.1:8770/**. Node 20+ is required; no package installation or API key is needed. `Open Map.url` opens an already-running preview. The launcher starts Node in the background and writes server logs here. It uses Node directly, so PowerShell script execution policy does not prevent launching. After a Windows restart, open Start-Nashua.cmd again.

The previous Documents copy is preserved. This Desktop folder is the updated project. The ZIP in this folder contains the app, source, research, scripts, documentation and backups. It does not need the previous copy to run.

## Discovery improvements · October 3, 2026

- Individual glowing dots show every matching restaurant at every zoom level. Dots retain cuisine colors, and labels appear on hover, focus or selection. There are no numbered clusters.
- City GIS outline, dimmed surrounding towns, nearby town and major corridor labels, and a persistent Back to all Nashua button.
- Cuisine buttons include Breakfast and support multiple cuisines per restaurant. Bobola’s appears under Seafood, American, Italian and Breakfast, based on the user correction saved in `research/cuisine-corrections.json`. Breakfast uses explicit cuisine, dish or discovery evidence. Counts can overlap across cuisines; each place still has one dot. Cuisine buttons show counts under the other selected filters. Filtered-out places are removed from the map source. The list and map use the same filtered records. Active filters are visible and individually removable.
- Cuisine, neighborhood, price, rating, open-now and search combine. Mid-range matches price levels 2 and 3. Unknown prices/ratings/hours are excluded only when their filter is applied. Zero results clear the map and explain how to reset.
- Permanently closed historical entries are hidden by default, with an explicit inclusion checkbox. Temporarily closed and unresolved entries remain labeled and cannot pass open-now.
- Breakfast, Coffee, Date night, Takeout and Open late shortcuts. Coffee and breakfast require explicit cuisine/menu evidence or a linked official source. Takeout requires checked service evidence. Date night is an editorial selection with a reason and source. Open late means published hours reach 10 pm or later on today's Eastern-time schedule, not confirmed kitchen service.
- Larger cards with sourced photos/menu highlights, status, directions, Save and Compare. Details include Call, Directions, menu links, photo galleries, source-specific check dates and external Street View links.
- Favorites persist locally in the same browser. Compare up to three places across price, ratings, hours, menu and location. Restaurant share links use `?place=ID` and reopen the chosen detail panel. Localhost links work only on the same computer until the app is hosted.
- Mobile Map/List switch, filter panel, horizontal swipe cards with previous/next buttons, large tap targets and a bottom detail sheet. Desktop List mode displays cards in a grid.

## Data coverage

There are **282 records**, with **279 displayed by default**. These include 3 permanently closed historical businesses, 1 temporary closure and 9 records needing review. The 269 ordinary listings are not all independently verified as operating today. **The number of missing current restaurants remains unknown.**

Current field coverage: 219 phone numbers, 123 weekly schedules, 26 ratings, 25 price ranges, 39 records with menu highlights, 9 with photos and 8 direct menu links. Other records may link to their venue website. Unknown facts stay unknown. The October 3 enrichment checks nine venues against official pages; it is not a full audit of all 282.

OSM's expanded source snapshot is dated July 15, 2026, despite its October 2 retrieval. The City GIS boundary was retrieved October 3, without an underlying survey revision date. All 282 coordinates are inside the raw municipal polygon. Some pins identify a shared site or approximate storefront; geometric containment does not establish business identity.

Bobola's conflicting official hours remain unknown. Closed predecessors such as Fratello's and Pig Tale remain historical records. Provider ratings retain their provider/capture date and are not merged into a new score. Google Maps, Yelp and Tripadvisor lookup links do not establish complete provider coverage.

See `COVERAGE.md`, `research/discovery-enrichment.json`, `research/boundary-audit.json` and `VERIFICATION.md` for evidence and limits.

## City roster reconciliation

`research/city-roster-request-draft.txt` is an **unsent** request for a public licensing roster. No email was sent. Nashua's published count of over 525 licensed facilities includes a broader category than public restaurants, so subtracting 282 would not give a missing-restaurant count.

When a CSV roster becomes available, run:

```powershell
node scripts/reconcile-roster.mjs "path\to\roster.csv"
```

The CSV needs name and address columns; category/type and status are optional. The tool writes `reports/roster-reconciliation.json`, distinguishing exact name/address matches, same-address identity conflicts and unmatched candidates. It does not modify restaurant data. Review scope, closures, alternate names and duplicates before treating candidates as omissions.

## Development and validation

```powershell
npm run check
npm run data:rebuild
```

This is buildless static HTML/CSS/JavaScript. Syntax checks and 30 automated tests are the production checks; no bundler build step exists. The data rebuild uses saved inputs, applies discovery enrichment, rebuilds/audits the city boundary and regenerates coverage documentation, without network requests. `VERIFICATION.md` records browser checks.

- `dist/`: complete deployable static app, including local restaurant and boundary data.
- `scripts/`: local server, reproducible data processing, roster reconciliation and tests.
- `research/`: source-linked evidence, snapshots, enrichment and unsent roster request.
- `backups/`: original UI and README before this upgrade.
- `reports/`: verification and future roster output.

Internet is needed for MapLibre, OpenFreeMap tiles, fonts and externally hosted photos. The restaurant list remains available when the map cannot load. Favorites are local, not an account or cloud sync. No public deployment was made.

## Attribution

Map/OSM-derived fields © OpenStreetMap contributors (ODbL 1.0), via OpenFreeMap/OpenMapTiles. Municipal boundary: City of Nashua GIS. Venue images are linked from their original sources and credited in details; no reuse license or ownership transfer is implied. New photo sources include New Pho, Sunflower Bakery, Crosby Bakery, Evviva Trattoria, OakCraft Pizza and The Friendly Toast. They are actual venue/brand photos, not generated stand-ins.
