# Nashua Table

Interactive 3D restaurant map, built October 2, 2026.

Run `npm start` from this directory, then open http://127.0.0.1:8769. Node 20+ is sufficient; no installation or API keys are needed. MapLibre, OpenFreeMap tiles, Google Fonts and linked venue photos require internet access. Search and the directory remain usable when map resources fail.

## Implemented

- Real OpenStreetMap street geometry and building extrusions, with a custom dark MapLibre style.
- City of Nashua GIS boundary, with a glowing dashed outline and dimmed neighboring towns. All Nashua opens to the full city extent.
- 282 source-linked listings across Nashua, expanded from 226. Glowing cuisine markers, smooth zoom/rotation/tilt, 2D toggle and neighborhood flights.
- Twelve neighborhood/corridor filters, a coverage table, and individually selectable pins for venues sharing a site.
- Search by name, dish, cuisine or neighborhood. “Best” queries sort by available provider ratings, without asserting an objective best restaurant.
- Cuisine, price, rating and open-now filters, plus list sorting and empty states.
- Responsive restaurant panels, venue-specific photos for Surf, Peddler’s Daughter and Bobola’s, contact/directions links, menus and provenance.
- Street View panorama links. Interior tours are not embedded or guaranteed.
- Downloadable source-linked JSON through the app.
- Optional feature-detected WebMCP `filter_restaurants` tool.

## Data boundaries

This is a broad researched directory, **not a complete verified census from Google Maps, Yelp and Tripadvisor**. Do not advertise it as every currently operating restaurant.

The original dataset combined 81 manually researched listings with a 202-record OpenStreetMap city-boundary query, followed by reconciliation of 21 duplicate branches. The two expansions add 56 source-linked venues, resolve seven missing street addresses, improve eleven existing geocodes, and relocate CodeX. The resulting 282 records have 219 phone numbers, 122 weekly schedules, and 26 provider-labeled ratings. All records now have street addresses. Some coordinates identify a building or shared site rather than an exact storefront. Hours and ratings may be stale.

The expanded city-boundary query inspected 229 food, cafe, bakery and pub records. Although retrieved on October 2, its OSM database timestamp is July 15, 2026; it is not presented as a fresh business census. Official venue pages and newer reporting take precedence for researched additions. Following the October 3 Pig Tale correction, there are 269 ordinary listings, three historical closed listings, one temporarily closed listing and nine listings needing review. Ordinary listing status does not independently confirm current operation. See [COVERAGE.md](COVERAGE.md) for area counts, additions and unresolved coverage work. The count of missing current businesses remains unknown.

All 282 stored coordinates fall within the unsimplified City of Nashua GIS City Boundary layer, retrieved October 3. This checks geographic placement only. The raw geometry and point audit are saved under research; the display polygon is simplified to approximately one metre. Rebuild it with `node scripts/build-boundary.mjs` after rebuilding restaurant data. The city layer's underlying revision date is not supplied; retrieval date does not certify survey accuracy.

The requested providers were researched through indexed web pages. Direct Yelp access and exhaustive Google Maps collection were unavailable. Google Maps/Yelp/Tripadvisor search links in the panels are discovery links, not verified provider IDs. No platform ratings were fabricated or averaged together. Tripadvisor values are indexed snapshots; crawl dates vary. No prices or popular dishes were inferred for missing fields.

Fratello’s Nashua is a **historical closed pin**, based on a 2022 closure report and its current official location list. Current OSM data lists Union Public House at the old address. Some other same-address discrepancies are flagged rather than resolved by assumption.

Bobola’s official homepage has contradictory service-hour statements. Its weekly hours are intentionally unknown and it is excluded from open-now until that conflict is resolved. OSM hours did not override this decision.

Open-now uses America/New_York, handles DST, split service and overnight spill into the next day. Holiday-specific schedules and unsupported OSM hours expressions remain unknown. The filter is based on published schedules, not live operational confirmation.

## Files

- `dist/`: complete deployable static app.
- `dist/data/restaurants.json`: final source-linked directory.
- `research/research-snapshot.json`: initial browser-exported combined data used for reconciliation.
- `scripts/reconcile-data.mjs`: reproducible manual merge and provenance rules.
- `research/before-expansion.json`: preserved 226-record baseline.
- `research/additions.json` and `research/supplemental.json`: source-linked expansion inputs.
- `research/expanded-osm.json` and `research/geocodes*.json`: reviewed geometry evidence.
- `scripts/expand-coverage.mjs`: rebuild the current dataset with `node scripts/expand-coverage.mjs` from the project directory.
- `scripts/build-data.mjs`: original 81-entry seed. It and `reconcile-data.mjs` overwrite the current dataset; run `expand-coverage.mjs` last to restore this expansion.
- `scripts/core.test.mjs`: substantive search, hours, branch-isolation and data-integrity tests.

The second expansion adds 16 places, including two Alltown Fresh counters, three Market’s Kitchen branches, two Sheraton venues, and independent cafes and restaurants. Inputs and review notes are in research/round-two*.json and research/round-two-notes.md.

## Validation

`npm run check` passed all 13 tests, including city boundary containment and masking, the Pig Tale correction, corridor search, temporary-closure exclusion, branch isolation, and expansion integrity. The second expansion was browser checked on desktop: 282 records, the loaded 3D map, distinct Alltown branches and kitchen hours, and the clickable Bonne the Baker marker. The first expansion was checked on desktop and at 390 × 844, including North End and Broad Street filters, the CodeX relocation, temporary-closure labels and the mobile corridor selector. The checked browser console had no errors. Earlier checks covered venue photos, dish search, ratings and Surf's mobile detail sheet. Third-party outbound provider pages and actual interior panorama availability were not individually verified. WebMCP validation was unavailable in this browser; the tool is optional and guarded.

This is buildless static HTML/CSS/JS. Syntax and data tests are the production checks. No generated application build step is required.

## Hosting

A private Sites project was registered, but no version was published. The required source preparation failed because this environment could not connect to `git.chatgpt-team.site:443`. `.openai/hosting.json` preserves the project identity for a later retry. No token is stored in this project.

## Attribution

Map data and OSM-derived restaurant fields © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright. Tiles via OpenFreeMap / OpenMapTiles; MapLibre renderer. Venue photos remain externally hosted and credited to their source; no open reuse license was found. Surf exterior © Nathan Moreau Photography LLC. Bobola’s photographs © Bobola’s Restaurant. Peddler’s Daughter exterior via its OpenTable listing. Confirm photo rights before a public commercial release.

To complete the requested provider census, obtain authorized provider data access, reconcile each business against current profiles, confirm all geocodes and source conflicts, then fill missing hours, prices, dishes and photos. The existing schema supports those fields and per-field source links.
