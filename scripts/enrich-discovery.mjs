import fs from 'node:fs';
import {parseOSMHours} from '../dist/core.js';
const file='dist/data/restaurants.json',bundle=JSON.parse(fs.readFileSync(file)),date='2026-10-03';
const patches=JSON.parse(fs.readFileSync('research/discovery-enrichment.json'));
for(const patch of patches){
 const r=bundle.restaurants.find(r=>r.id===patch.id);if(!r)throw Error('Unknown enrichment id '+patch.id);
 for(const key of ['phone','menuUrl','dishes'])if(patch[key])r[key]=patch[key];
 if(patch.hoursText){const hours=parseOSMHours(patch.hoursText);if(!hours)throw Error('Unparsed hours for '+r.name);r.hours=hours;r.hoursText=patch.hoursText;r.hoursSource='Official venue website';}
 if(patch.discovery)r.discovery=Object.fromEntries(Object.entries(patch.discovery).map(([key,value])=>[key,{...value,source:patch.source,checkedAt:date}]));
 if(patch.photos)r.photos=patch.photos.map(p=>({...p,source:patch.source,checkedAt:date}));
 const add=(url,fields)=>{const s={label:'Official website · discovery update',url,fields,checkedAt:date};r.sources=r.sources.filter(x=>!(x.label===s.label&&x.url===url));r.sources.push(s);};
 add(patch.source,[...patch.fields,...(patch.photos?['photos']:[])]);
 if(patch.menuSource)add(patch.menuSource,[...(patch.dishes?['dishes']:[]),'menuUrl']);
 r.enrichedAt=date;
}
// Preserve user-confirmed cuisine corrections on every data rebuild.
for(const patch of JSON.parse(fs.readFileSync('research/cuisine-corrections.json'))){
 const r=bundle.restaurants.find(r=>r.id===patch.id);if(!r)throw Error('Unknown cuisine correction '+patch.id);Object.assign(r,patch);
}
bundle.enrichmentAt=date;bundle.discoveryAudit={updated:patches.length,photoCount:bundle.restaurants.filter(r=>r.photos?.length||r.photo).length,note:'Targeted official-site enrichment; no full census or confirmation of current service. Date night is editorial. Cafe weekend hours were not inferred from unlisted days.'};
fs.writeFileSync(file,JSON.stringify(bundle,null,2)+'\n');console.log(JSON.stringify(bundle.discoveryAudit,null,2));
