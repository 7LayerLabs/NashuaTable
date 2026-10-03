import fs from 'node:fs';
const b=JSON.parse(fs.readFileSync('dist/data/restaurants.json'));
const added=b.restaurants.filter(r=>b.audit.newIds.includes(r.id));
const counts=b.restaurants.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});
const text=`# Nashua coverage audit - updated October 3, 2026

Expanded from 226 to ${b.restaurants.length} source-linked listings. The latest pass adds ${b.audit.latestPass.added} to the previous 266. This is citywide geographic coverage, not proof that every currently operating restaurant has been captured. Counts include ${counts.closed} closed historical listings, ${counts.temporarily_closed} temporary closure and ${counts.needs_review} unresolved listings. The ${counts.listed} records marked listed have not all been verified as currently operating. Fields without reviewed evidence remain unknown. The number of missing current businesses is unknown.

## City limits

The map uses the [City of Nashua GIS City Boundary layer](https://newgis.nashuanh.gov/arcgisapp3/rest/services/HTML_Viewer/NashuaNH_OperationalLayers_2022/MapServer/111), retrieved October 3, 2026. A dashed lime outline and dark outer mask distinguish Nashua from neighboring towns. All 282 stored pin coordinates fall inside the unsimplified city polygon; this validates geographic placement, not current business identity. Display geometry is simplified to approximately one metre, with identical inside/outside results for the current pins. Raw data and the audit are preserved in research/city-boundary-raw.geojson and research/boundary-audit.json.

## Field completeness

${[['Phone','phone'],['Weekly hours','hours'],['Rating','rating'],['Price','price'],['Menu highlights','dishes'],['Venue photo','photo']].map(([label,key])=>'- '+label+': '+b.restaurants.filter(r=>key==="photo"?(r.photos?.length||r.photo):Array.isArray(r[key])?r[key].length:r[key]).length+' of '+b.restaurants.length).join('\n')}

## Area coverage

These are street-address navigation groups, not official neighborhood boundaries.

| Neighborhood / corridor | Listings | Needs review |
| --- | ---: | ---: |
${Object.entries(b.audit.districts).map(([n,s])=>`| ${n} | ${s.listed} | ${s.needsReview} |`).join('\n')}

## ${added.length} additions across both passes

${added.sort((a,b)=>a.name.localeCompare(b.name)).map(r=>`- [${r.name}](${r.sources[0].url}) - ${r.address}${r.status==='temporarily_closed'?' (temporarily closed)':''}`).join('\n')}

## Corrections and remaining review

CodeX moved to 29 Main Street. Seven missing street addresses were filled; eleven older approximate pins were matched to OSM address geometry. Shared-site markers are spread in screen space for selection while preserving their underlying coordinates. Map building locations do not establish business identity.

${b.restaurants.filter(r=>['needs_review','closed','temporarily_closed'].includes(r.status)).map(r=>`- **${r.name}** (${r.status.replaceAll('_',' ')}): ${r.notes||r.description||'See linked record sources.'}`).join('\n')}

## Evidence and census gaps

The original 226-record baseline is preserved in research/before-expansion.json. An expanded OSM query inspected 229 records within Nashua's administrative boundary, including restaurants, cafes, fast food, ice cream, pubs, bars and bakery/coffee/deli shops. Its underlying database timestamp is ${b.audit.osmSnapshotAt}; the October 2 retrieval does not make those business tags current. Each new record includes reviewed source URLs and address geometry evidence.

The [city food-service page](${b.audit.censusSource}) did not provide a downloadable restaurant roster. Exhaustive Google Maps, Yelp and Tripadvisor collection remains unavailable. To establish completeness, reconcile an authorized full provider export or city licensed-facility roster against this directory, resolve older names and closures, and verify every unmatched current business. Broad geographic coverage alone cannot establish a complete census.

${b.audit.exclusions} Restaurants inside malls, hotels and casinos are included when specifically identified. Casino access restrictions are recorded where known. Unknown hours, prices, ratings and signature dishes are not filled with estimates.

## Rebuild

Run \`npm run data:rebuild\`, then \`npm run check\`. This runs expansion, official-site discovery enrichment, boundary rebuilding and the coverage report in order. The rebuild uses saved research inputs and makes no network requests. Browser research helper pages are archived under research/tools and are not shipped as app routes.
`;
fs.writeFileSync('COVERAGE.md',text);
