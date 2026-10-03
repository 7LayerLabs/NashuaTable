# Verification · October 3, 2026

Target project: `C:\Users\derek\OneDrive\Desktop\nashua_table`

Preview: http://127.0.0.1:8770/ served from this folder. The previous Documents copy and port 8769 are older versions.

## Current update: individual dots and multiple cuisines

- Restored one dot per restaurant at every zoom; Chrome showed 279 dots and zero numbered clusters in the default city view.
- Added Breakfast as a cuisine: 10 results based on stored cuisine, menu or sourced discovery evidence.
- Bobola’s appears once under Seafood (5 results), American (74), Italian (38), and Breakfast (10). Live browser clicks verified its card and map dot in each category; clicking its dot showed all four cuisines in the detail panel.
- User correction is saved in research/cuisine-corrections.json and applied by the enrichment script on data rebuilds.
- All 30 automated checks passed. Browser console had no errors or warnings. Reset restores 279 results.
- The earlier cluster-based checks below describe the previous interface and are superseded by this update. No new locations or hours were inferred.

## Automated checks

`npm run check` checks app/module JavaScript syntax and 30 Node tests. The app is buildless; these are its production checks. Tests cover municipal containment, polygon masking, branch identity, Eastern-time hours and DST, closed/uncertain exclusion, exact cuisine sets, combined filters, price grouping, faceted counts, source dates, saved storage recovery, comparison cap, GeoJSON/filter consistency, source-linked enrichment and roster reconciliation.

Expected default: 279 displayed out of 282 records. The difference is three closed historical entries; visible results still include temporary closures and unresolved records, clearly labeled.

## Earlier browser checks before the dot update

Live Chrome testing at desktop size and 390 × 844. These are real browser interactions with the delivered app, not only unit tests.

| Check | Observed result |
| --- | --- |
| Seafood | 4 results; only Seafood cards; map count 4 |
| Italian | 37 results; only Italian cards; map count 37 |
| American | 74 results; only American cards; map count 74 |
| Cafes & bakery | 62 results; only cafe/bakery cards; map count 62 |
| Asian | 42 results; only Asian cards; map count 42 |
| Mexican | 18 results; only Mexican cards; map count 18 |
| Other | 42 results; only Other cards; map count 42 |
| Italian + mid-range + 4.5+ | One result: Mike's Italian Kitchen |
| Above filters + North End | Zero results, map source count 0, explicit reset message |
| Include permanently closed | 282 results; uncheck restores 279 |
| Open now | 98 results at time checked; every result labeled Open from published hours; count changes with Eastern time |
| Breakfast / Coffee | 10 / 24 matches |
| Date night / Takeout | 2 / 7 matches, based on curated source-linked evidence |
| Open late | 69 matches for Saturday's published schedules at time checked |
| Every corridor | All 12 checked; map and list counts agree (below) |
| Save Bobola's | Saved-only view shows one restaurant; count persists across reload; test favorite removed afterward |
| Compare three | Bobola's, Surf and Peddler's Daughter displayed across cuisine, price, provider rating, status, hours, menu and address |
| Share / deep link | Bobola's link contains `?place=nashua-3`; reload reopens its detail panel |
| Mobile filters | Filters opens List; Asian selects 42 results; switching to Map keeps 42 |
| Mobile browsing | Next advances from 1 / 279 to 2 / 279 and flies to that restaurant |
| Mobile detail | New Pho food photo, published hours, phone, directions and actual menu link display correctly |
| City context | Full outline, dimmed neighbors, town/corridor labels visible on desktop and mobile |
| Cluster zoom | Clicking a numbered cluster expands the view and reveals smaller groups / individual pins; observed zoom 12.72 with 26 groups after expansion |
| Dish search / desktop List | Best burger returns 17 results, selects Highest rated, and displays a responsive five-column card grid at the tested desktop width |
| New images | Six added image URLs load; visual review replaced Friendly Toast's initial location-logo candidate with a restaurant photo |

Corridor counts with closed places hidden: Airport 2; Amherst 66; Broad Street 18; Daniel Webster 65; Downtown 78; East Hollis 8; Kinsley/Tree Streets 11; Main Dunstable 11; North End 2; Southwood 4; Spit Brook 8; West Hollis 6.

The checked app browser console had no errors or warnings. Direct phone dialing, third-party menu ordering, actual interior Street View availability and public hosting were not exercised. Copy/share links are local until deployment. Browser tests confirm app behavior, not current real-world operating status.

## Data and remaining dependencies

- Nine venue records received targeted official-source enrichment; six new venue/food images were added. Many other photos, menus, ratings, prices and schedules remain unknown.
- `research/city-roster-request-draft.txt` is unsent. No authoritative roster has been received, so a missing-restaurant count cannot be calculated. The roster reconciliation command is ready for a CSV and leaves restaurant records unchanged.
- Photos remain externally hosted; thumbnails and galleries have a labeled failure fallback.
- Data exports include source provenance and enrichment timestamps. No generated reviews, ratings, dishes or stock food photos were substituted for missing facts.

## Breakfast correction: Roland’s and Bud’s

Both imported records had only American cuisine and no dish details. User-confirmed Breakfast tags are now saved in research/cuisine-corrections.json and survive enrichment/data rebuilds. Breakfast now returns 12 places; live Chrome verified both cards. All 30 checks pass. These corrections do not establish complete breakfast coverage.
