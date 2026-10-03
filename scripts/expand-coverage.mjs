import fs from 'node:fs';
import {normalize,neighborhood,parseOSMHours} from '../dist/core.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const bundle=read('research/before-expansion.json');
const rows=bundle.restaurants;
const osm=read('research/expanded-osm.json');
const geocodes=[...read('research/round-two-refined.json'),...read('research/round-two-geocodes.json'),...read('research/geocodes.json'),...read('research/geocodes-extra.json')];
const roundTwo=read('research/round-two.json');
const additions=[...read('research/additions.json'),...read('research/supplemental.json'),...roundTwo];
const date='2026-10-02';
const source=(label,url,fields)=>({label,url,fields,checkedAt:date});
const upgrades={2:32285515,5:8773566914,6:180643883,8:580207594,14:179913162,18:169911563,20:77083137,25:179913141,28:8773600737,35:573784844,79:233679297};
for(const[id,osmId]of Object.entries(upgrades)){
 const r=rows.find(r=>r.id==='nashua-'+id),e=osm.elements.find(e=>e.id===osmId),p=e.center||e;
 r.lng=p.lon;r.lat=p.lat;r.precision='OSM mapped address';
 r.sources.push(source('OpenStreetMap address geometry',`https://www.openstreetmap.org/${e.type}/${e.id}`,['coordinates']));
}
function geocode(address){
 const entry=geocodes.find(g=>g.address===address.split(',')[0]);
 const matches=entry?.matches?.filter(m=>m.address?.city==='Nashua'&&m.address.house_number===address.match(/^\d+/)?.[0]);
 if(!matches?.length)throw Error('No reviewed address match: '+address);
 // Select known site/building matches, avoiding other named tenants returned first.
 const selected=address.startsWith('255 Amherst')?matches.find(m=>m.name==='Whole Foods Market'):
 address.startsWith('34 Northwest')?matches.find(m=>m.name==='Market Basket'):
 address.startsWith('483 Amherst')?matches.find(m=>/cibao/i.test(m.name))||matches.find(m=>m.type==='yes'&&!m.name):
 address.startsWith('449 Amherst')?matches.find(m=>/levitate/i.test(m.name)):
 address.startsWith('9 Main')?matches.find(m=>/sky market/i.test(m.name)):
 address.startsWith('310 Daniel')?matches.find(m=>m.type==='mall'):
 address.startsWith('55 Northeastern')?matches.find(m=>m.type==='casino'):
 address.startsWith('2 Cellu')?matches.find(m=>!m.name):
 address.startsWith('2 Somerset')?matches.find(m=>m.type==='hotel'):matches[0];
 const m=selected||matches[0];
 return{lat:Number(m.lat),lng:Number(m.lon),precision:'Geocoded address/site; storefront approximate',geoSource:source('OpenStreetMap address match',`https://www.openstreetmap.org/${m.osm_type}/${m.osm_id}`,['coordinates']),geocodeMatchedName:m.name||null};
}
const newlyAdded=[];
for(const a of additions){
 let geo;
 if(a.osm){const e=osm.elements.find(e=>e.id===a.osm);const p=e.center||e;geo={lat:p.lat,lng:p.lon,precision:'OSM mapped address; venue name checked separately',geoSource:source('OpenStreetMap address geometry',`https://www.openstreetmap.org/${e.type}/${e.id}`,['coordinates'])}}
 else geo=geocode(a.address);
 // An exact address is geocoded; a different tenant name never supplies business facts.
 const fields=['name','address','cuisine',...(a.phone?['phone']:[]),...(a.hoursText?['hours']:[]),...(a.dishes?.length?['dishes']:[])];
 const provider=a.source?(a.source.includes('tripadvisor')?'Tripadvisor':a.source.includes('restaurantji')?'Restaurantji':a.source.includes('waze')?'Waze':a.source.includes('hippopress')?'Hippo':a.source.includes('untappd')?'Verified brewery profile':'Directory source'):'Official venue website';
 const id=a.update||'expanded-'+normalize(a.name).replaceAll(' ','-');
 const r={id,name:a.name,address:a.address+', Nashua, NH',cuisine:a.cuisine,neighborhood:neighborhood(geo.lng,geo.lat),lat:geo.lat,lng:geo.lng,precision:geo.precision,phone:a.phone||null,website:a.website||null,hours:parseOSMHours(a.hoursText),hoursText:a.hoursText||null,hoursSource:a.hoursText?provider:null,dishes:a.dishes||[],price:null,priceLabel:null,rating:null,status:a.status||'listed',featured:false,checkedAt:date,addedAt:date,notes:a.notes||null,verification:a.source?'Source-linked listing; current service not independently confirmed':'Official website lists this venue; current service not independently confirmed',sources:[source(provider,a.source||a.website,fields),geo.geoSource]};
 if(a.rating)r.rating=a.rating;
 for(const s of a.extraSources||[]){r.sources[0].fields=r.sources[0].fields.filter(f=>!s.fields.includes(f));r.sources.push({...s,checkedAt:date});}
 if(a.website&&a.source)r.sources.push(source('Venue website',a.website,['website']));
 if(a.update){const existing=rows.find(x=>x.id===a.update);r.sources.push(...existing.sources);r.notes='Relocated to 29 Main Street, reported September 2026. Previous address was 1 Elm / 112 West Pearl. '+(r.notes||'');Object.assign(existing,r)}
 else {rows.push(r);newlyAdded.push(r.id)}
}
// Supplemental field provenance where a venue homepage did not supply the field.
const named=n=>rows.find(r=>r.name===n);
named('Sunflower Bakery & Cafe').sources.push(source('Nashua Chamber', 'https://members.nashuachamber.com/list/member/sunflower-bakery-cafe-26264',['phone']));
named('Proper Chophouse & Cocktails').sources.push(source('OpenTable','https://www.opentable.com/r/proper-chophouse-nashua',['phone']));
named('Kalo Pizza & Subs').sources.push(source('Venue ordering menu','https://www.kalopizzasubsnashua.com/',['dishes']));
named('Jeannotte’s Market · Deli').sources.push(source('Official deli menu','https://jeannottesmarket.com/',['dishes']));
named('Speaker’s Corner').phone='6035954155';named('Speaker’s Corner').sources.push(source('Tripadvisor','https://www.tripadvisor.co.uk/Restaurant_Review-g46172-d1732129-Reviews-Speaker_s_Corner_Pub-Nashua_New_Hampshire.html',['phone']));
// Do not let unresolved predecessor listings pass open-now or inflate current-service counts.
const conflicts={
 'osm-way-146701672':'Evviva Trattoria and CAVA now list 350 Amherst Street. Grand Buffet remains in older OSM geometry; current operation needs review.',
 'osm-way-229627954':'New Pho now lists 13 Broad Street. Shira Kiku remains in older OSM geometry; current operation needs review.',
 'osm-way-179221580':'Riviera Nayarit lists 116 West Pearl Street. El Colima remains in older community data; current operation needs review.',
 'osm-way-179913165':'T&T Way now lists 138 Main Street. Fuego remains in older community data; current operation needs review.',
 'osm-way-190539404':'Latin Bakery lists 33 Lowell Street. Café Brasileiro remains in older community data; current operation needs review.',
 'osm-way-124014579':'Tequila Jalisco lists this address. Bertucci’s remains in older community data; current operation needs review.',
 'osm-way-169787920':'Pho Tai Loc lists this address. Five Dragons remains in older community data; current operation needs review.',
 'nashua-75':'Hungry Pot lists 230 Daniel Webster Highway. IHOP remains in an older directory; current operation needs review.'
};
for(const[id,note]of Object.entries(conflicts)){const r=rows.find(r=>r.id===id);r.status='needs_review';r.hours=null;r.hoursText=null;r.notes=note;r.reviewedAt=date}
const sf=rows.find(r=>r.id==='nashua-24');sf.status='closed';sf.hours=null;sf.notes='Reported as the former tenant in an August 2026 Downtown Nashua Association update. Campo Enoteca was described as opening soon; opening has not been confirmed.';sf.sources.push(source('Downtown Nashua Association update','https://www.nashuaindependent.com/the-downtown-lowdown-august-20-to-august-26/',['status']));
// Resolve address gaps using reviewed address-level sources; do not infer operating hours.
const pig=rows.find(r=>r.id==='osm-way-103064352');
pig.status='closed';pig.hours=null;pig.hoursText=null;pig.reviewedAt='2026-10-03';
pig.notes='Historical listing: Hippo reported Stones Social opened in the former Pig Tale space at 449 Amherst Street in June 2020. Pig Tale is retained as a closed former business, not a current dining option.';
pig.sources.push({label:'Hippo · July 2, 2020 · page 23',url:'https://hippopress.com/wp-content/uploads/Hippo_PDFs/2020/HIP_200702_BOOK-Web.pdf',fields:['status'],checkedAt:'2026-10-03'});
const addressFixes=[
 ['osm-node-1714829743','112 Daniel Webster Highway','https://maps.roadtrippers.com/us/nashua-nh/food-drink/kurry-masala-express'],
 ['osm-node-2381957720','103 Broad Street','https://locations.dunkindonuts.com/en/nh/nashua/103-broad-st/300254'],
 ['osm-node-2408790483','340 Amherst Street','https://untappd.com/v/keglers-den/145838/photos'],
 ['osm-node-7188768319','495 Amherst Street, Suite 4','https://www.yellowpages.com/nashua-nh/mip/sub-zero-ice-cream-yogurt-502860121'],
 ['osm-node-8329225563','493 Amherst Street','https://www.trycaviar.com/fr-CA/business/kung-fu-tea---tkk-fried-chicken-493445/'],
 ['osm-node-12610692635','310 Daniel Webster Highway','https://www.simon.com/brands/bad-brgr'],
 ['osm-way-1293487528','267 Main Street','https://www.dunkindonuts.com/locations/us/nh/nashua/267-main-st/store-358089/']
];
for(const[id,address,url]of addressFixes){const r=rows.find(r=>r.id===id);r.address=address+', Nashua, NH';r.sources.push(source('Address reference',url,['address']));r.reviewedAt=date;}
const keg=rows.find(r=>r.id==='osm-node-2408790483');keg.status='needs_review';keg.hours=null;keg.hoursText=null;keg.website=null;keg.notes='Bar mapped at Leda Lanes. Current food service and business name need confirmation; historical address reference retained.';
// Co-located venues remain separate businesses. Districts are navigation groupings, not ward polygons.
function district(r){const a=normalize(r.address);if(/courtland|concord street|manchester street/.test(a))return'North End & Greeley Park';if(/perimeter|charron/.test(a))return'Airport & Charron Avenue';if(/somerset|southwood|trafalgar|cotton road/.test(a))return'Southwood & Somerset';if(/broad street|coliseum|gusabel|saint laurent/.test(a))return'Broad Street & Nashua Mall';if(/amherst|sunapee|cellu|northwest|north west/.test(a))return'Amherst Street & Route 101A';if(/daniel webster|taggart|harold drive|marmon/.test(a))return'Daniel Webster Highway & Pheasant Lane';if(/spit brook|innovative|mountain laurels|east dunstable|tara boulevard/.test(a))return'Spit Brook & Sky Meadow';if(/main dunstable|merrit|pittsburgh|northeastern|simon street|murphy/.test(a))return'Main Dunstable & Northeastern';if(/kinsley|lake street|allds|palm street|pine street|ash street/.test(a))return'Kinsley, Lake & Tree Streets';if(/east hollis|scripture|bridge street/.test(a)||(/temple/.test(a)&&r.lng> -71.458))return'East Hollis & Temple Street';if(/west hollis/.test(a))return'West Hollis Street';if(/street address not mapped/.test(a))return'Location under review';return'Downtown & Railroad Square'}
for(const r of rows){r.district=district(r);r.searchAliases=[r.district,...(r.district.includes('Pheasant')?['mall','south nashua']:[]),...(r.district.includes('Tree')?['tree streets']:[])];}
bundle.compiledAt=date;
bundle.coverage='Citywide geographic coverage, not a verified complete business census. Some venues are historical, temporarily closed, or need review.';
bundle.communityData=`229 OpenStreetMap food, cafe, bakery and pub records inspected in the city-boundary audit; source database timestamp ${osm.osm3s.timestamp_osm_base}. Original 202-record snapshot retained; newer official venue information takes precedence.`;
bundle.audit={date,beforeCount:226,added:newlyAdded.length,updatedLocation:'CodeX B.A.R. moved to 29 Main Street',osmSnapshotAt:osm.osm3s.timestamp_osm_base,newIds:newlyAdded,latestPass:{beforeCount:266,added:roundTwo.length,ids:roundTwo.map(a=>'expanded-'+normalize(a.name).replaceAll(' ','-'))},districtMethod:'Street-address navigation groupings; not official neighborhood or ward boundaries',censusStatus:'Incomplete: licensed-facility roster not published on the city food-service page; exhaustive Google Maps, Yelp and Tripadvisor access unavailable.',censusSource:'https://www.nashuanh.gov/525/Food-Service-Safety',exclusions:'Private institutional cafeterias, grocery stores without a verified prepared-food counter, candy retail, delivery-only aliases and unconfirmed proposed openings are not added as restaurants.'};
bundle.audit.districts=Object.fromEntries([...new Set(rows.map(r=>r.district))].sort().map(d=>[d,{listed:rows.filter(r=>r.district===d).length,needsReview:rows.filter(r=>r.district===d&&r.status==='needs_review').length}]));
fs.writeFileSync('dist/data/restaurants.json',JSON.stringify(bundle,null,2)+'\n');
console.log(JSON.stringify({total:rows.length,added:newlyAdded.length,phones:rows.filter(r=>r.phone).length,hours:rows.filter(r=>r.hours).length,statuses:rows.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}),districts:bundle.audit.districts},null,2));
