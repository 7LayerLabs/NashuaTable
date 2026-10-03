import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isOpen,matches,parseOSMHours,mergeOSM} from '../dist/core.js';
import {inBoundary,outsideMask} from '../dist/boundary.js';
test('city outline includes Nashua but excludes neighboring town centers',()=>{
 const city=JSON.parse(fs.readFileSync('dist/data/nashua-boundary.geojson'));
 assert.equal(inBoundary([-71.4655,42.7619],city),true);
 assert.equal(inBoundary([-71.439,42.7648],city),false);
 assert.equal(inBoundary([-71.493,42.865],city),false);
 const mask=outsideMask(city);
 assert.equal(inBoundary([-71.4655,42.7619],mask),false);
 assert.equal(inBoundary([-71.439,42.7648],mask),true);
 for(const f of city.features)for(const ring of f.geometry.coordinates)assert.deepEqual(ring[0],ring.at(-1));
});
test('all restaurant pins lie within unsimplified city GIS limits',()=>{
 const city=JSON.parse(fs.readFileSync('research/city-boundary-raw.geojson'));
 const display=JSON.parse(fs.readFileSync('dist/data/nashua-boundary.geojson'));
 for(const r of JSON.parse(fs.readFileSync('dist/data/restaurants.json')).restaurants){assert.equal(inBoundary([r.lng,r.lat],city),true,r.name);assert.equal(inBoundary([r.lng,r.lat],display),true,r.name);}
});
test('historical Pig Tale does not appear as open',()=>{
 const r=JSON.parse(fs.readFileSync('dist/data/restaurants.json')).restaurants.find(r=>r.name==='Pig Tale');
 assert.equal(r.status,'closed');assert.equal(matches(r,{open:true}),false);
});
test('Nashua weekly hours include overnight spill and exclude closing minute',()=>{const r={hours:[[],[[1080,120]],[],[],[],[],[]]};assert.equal(isOpen(r,new Date('2026-10-06T05:59:00Z')),true);assert.equal(isOpen(r,new Date('2026-10-06T06:00:00Z')),false);assert.equal(isOpen(r,new Date('2026-10-05T22:00:00Z')),true)});
test('Eastern time handles winter DST offset',()=>{const r={hours:[[],[[540,1020]],[],[],[],[],[]]};assert.equal(isOpen(r,new Date('2026-12-07T13:59:00Z')),false);assert.equal(isOpen(r,new Date('2026-12-07T14:00:00Z')),true)});
test('unknown hours and permanent closure cannot pass open-now',()=>{assert.equal(isOpen({}),null);assert.equal(matches({name:'A',cuisine:'café'},{open:true}),false);assert.equal(isOpen({status:'closed',hours:Array.from({length:7},()=>[[0,1440]])}),false)});
test('dish, cuisine and neighborhood search with best prefix',()=>{const r={name:'Test',cuisine:'Italian',neighborhood:'Downtown',address:'Main Street',dishes:['Burgers'],rating:{value:4.4},price:2};assert.equal(matches(r,{query:'best burger'}),true);assert.equal(matches(r,{query:'downtown Italian'}),true);assert.equal(matches(r,{rating:4.5}),false);assert.equal(matches(r,{price:1}),false)});
test('OSM hours parser fails conservatively on holidays and supports split hours',()=>{assert.equal(parseOSMHours('Mo-Fr 09:00-17:00; PH off'),null);assert.deepEqual(parseOSMHours('Mo-Fr 11:00-14:00,17:00-21:00')[1],[[660,840],[1020,1260]]);assert.deepEqual(parseOSMHours('Fr-Mo 11:00-01:00')[0],[[660,60]])});
test('chain branches are not collapsed across the city',()=>{const records=[{name:'Five Guys',lng:-71.51,lat:42.785,status:'listed',sources:[]}];const merged=mergeOSM(records,[{type:'node',id:1,lon:-71.442,lat:42.711,tags:{name:'Five Guys',amenity:'restaurant'}}]);assert.equal(merged.length,2)});
test('temporary closure and unresolved predecessors cannot pass open-now',()=>{for(const status of ['temporarily_closed','needs_review']){const r={name:'Test',status,hours:Array.from({length:7},()=>[[0,1440]])};assert.notEqual(isOpen(r),true);assert.equal(matches(r,{open:true}),false)}});
test('corridor filters and neighborhood aliases select the right locations',()=>{const r={name:'Test',district:'Kinsley, Lake & Tree Streets',searchAliases:['tree streets'],cuisine:'café'};assert.equal(matches(r,{district:r.district,query:'tree streets'}),true);assert.equal(matches(r,{district:'North End & Greeley Park'}),false)});
test('coverage expansion retains the baseline and sources every added location',()=>{const bundle=JSON.parse(fs.readFileSync('dist/data/restaurants.json'));assert.equal(bundle.restaurants.length,bundle.audit.beforeCount+bundle.audit.added);assert.equal(bundle.audit.added,56);assert.equal(bundle.audit.latestPass.added,16);for(const id of bundle.audit.newIds){const r=bundle.restaurants.find(r=>r.id===id);assert.match(r.address,/Nashua, NH/);assert.ok(r.sources.some(s=>s.fields.includes('coordinates')));assert.ok(r.district)}assert.match(bundle.restaurants.find(r=>r.id==='nashua-19').address,/29 Main/)});
test('directory integrity: unique ids, valid coordinates, sources, no invented defaults',()=>{const rows=JSON.parse(fs.readFileSync('dist/data/restaurants.json')).restaurants;assert.ok(rows.length>=80);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);for(const r of rows){assert.ok(r.lng< -71.4&&r.lng> -71.6);assert.ok(r.lat>42.69&&r.lat<42.85);assert.ok(r.sources.length);assert.ok(r.precision);if(r.rating)assert.ok(r.rating.provider&&r.rating.url)}assert.equal(rows.find(r=>r.name.startsWith('Fratello')).status,'closed');assert.equal(rows.find(r=>r.name==='Bobola’s').hours,null)});
