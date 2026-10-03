import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaults,filterRows,cuisineCounts,quickMatch,openLate,sourceDate,compareToggle,readSaved,restaurantFeatures} from '../dist/discovery.js';
const rows=JSON.parse(fs.readFileSync('dist/data/restaurants.json')).restaurants;
const sample=[{id:'italian',name:'Pasta',cuisine:'Italian',price:3,rating:{value:4.6},district:'Downtown',status:'listed',dishes:['Lasagna'],hours:Array.from({length:7},()=>[[660,1380]])},{id:'cafe',name:'Coffee',cuisine:'Coffee',price:1,rating:{value:4.2},district:'North',status:'listed',dishes:[]},{id:'closed',name:'Old Pizza',cuisine:'Pizza',price:2,status:'closed',dishes:[]},{id:'unknown',name:'Unknown',cuisine:'American',price:null,status:'needs_review',dishes:[]}];
const saturday=new Date('2026-10-03T18:00:00Z');
test('closed places hidden by default and deliberately recoverable',()=>{assert.equal(filterRows(rows,defaults()).length,279);assert.equal(filterRows(rows,{...defaults(),includeClosed:true}).length,282);assert.equal(filterRows(rows,{...defaults(),query:'Pig Tale'}).length,0);assert.equal(filterRows(rows,{...defaults(),query:'Pig Tale',includeClosed:true})[0].status,'closed');});
test('cuisine chips allow overlapping memberships with full unique coverage',()=>{const expected={Seafood:5,Italian:38,American:74,Breakfast:12,'Café & bakery':62,Asian:42,Mexican:18,Other:42};const ids=[];for(const[c,n]of Object.entries(expected)){const found=filterRows(rows,{...defaults(),cuisine:c});assert.equal(found.length,n,c);ids.push(...found.map(r=>r.id));}assert.equal(new Set(ids).size,279);});
test('price, stars, corridor and cuisine combine with AND semantics',()=>{assert.deepEqual(filterRows(sample,{...defaults(),price:'mid',rating:4.5,cuisine:'Italian',district:'Downtown',query:'lasagna'}).map(r=>r.id),['italian']);assert.equal(filterRows(sample,{...defaults(),price:'1',rating:4.5}).length,0);assert.equal(filterRows(sample,{...defaults(),cuisine:'Italian',district:'North'}).length,0);});
test('mid-range includes both price levels but excludes unknown and closed',()=>{assert.deepEqual(filterRows(sample,{...defaults(),price:'mid'}).map(r=>r.id),['italian']);assert.equal(filterRows(sample,{...defaults(),price:'mid',includeClosed:true}).length,2);});
test('facets count available options under other filters',()=>{assert.equal(cuisineCounts(sample,{...defaults(),district:'Downtown',cuisine:'American'})['Italian'],1);assert.equal(cuisineCounts(sample,{...defaults(),rating:4.5})['Café & bakery'],0);});
test('open-now excludes missing hours and unresolved data',()=>{assert.deepEqual(filterRows(sample,{...defaults(),open:true},new Set(),saturday).map(r=>r.id),['italian']);assert.ok(!filterRows(rows,{...defaults(),open:true},new Set(),saturday).some(r=>r.name==='Bobola’s'||r.status!=='listed'));});
test('quick filters require evidence, not a guessed service or ambience',()=>{assert.equal(quickMatch(sample[0],'takeout'),false);assert.equal(quickMatch(sample[0],'date-night'),false);assert.equal(quickMatch(sample[1],'coffee'),true);assert.equal(quickMatch({cuisine:'Cafe',dishes:[]},'coffee'),false);const tag={discovery:{takeout:{source:'https://example.com/menu'}}};assert.equal(quickMatch(tag,'takeout'),true);assert.ok(filterRows(rows,{...defaults(),quick:'takeout'}).length>=7);assert.equal(filterRows(rows,{...defaults(),quick:'date-night'}).length,2);});
test('open late handles evening, midnight, overnight, closed days and uncertainty',()=>{const r={status:'listed',hours:Array.from({length:7},()=>[])};r.hours[6]=[[1020,1320]];assert.equal(openLate(r,saturday),true);r.hours[6]=[[1020,120]];assert.equal(openLate(r,saturday),true);r.hours[6]=[[0,1440]];assert.equal(openLate(r,saturday),true);r.hours[6]=[[660,1319]];assert.equal(openLate(r,saturday),false);r.status='needs_review';r.hours[6]=[[0,1440]];assert.equal(openLate(r,saturday),false);});
test('quick search phrases have the same meaning as quick buttons',()=>{for(const[q,key]of [['date night','date-night'],['takeout','takeout'],['open late','open-late'],['breakfast','breakfast'],['coffee','coffee']])assert.deepEqual(filterRows(rows,{...defaults(),query:q},new Set(),saturday).map(r=>r.id),filterRows(rows,{...defaults(),quick:key},new Set(),saturday).map(r=>r.id));});
test('saved list filtering, safe storage recovery and comparison cap',()=>{assert.deepEqual(filterRows(sample,{...defaults(),favorites:true},new Set(['cafe'])).map(r=>r.id),['cafe']);assert.equal(readSaved({getItem:()=>'{bad json'}).size,0);assert.equal(readSaved({getItem:()=>'{"foo":1}'}).size,0);assert.deepEqual([...readSaved({getItem:()=> '["a",3,"b"]'})],['a','b']);assert.deepEqual(compareToggle(['a','b','c'],'d'),['a','b','c']);assert.deepEqual(compareToggle(['a','b','c'],'b'),['a','c']);});
test('compilation dates never masquerade as field verification',()=>{assert.equal(sourceDate({checkedAt:'2026-10-03',sources:[]},'hours'),null);assert.equal(sourceDate({sources:[{fields:['hours'],checkedAt:'2026-10-02'},{fields:['phone'],checkedAt:'2026-10-03'}]},'hours'),'2026-10-02');});
test('map source contains precisely the filtered set including zero results',()=>{const matches=filterRows(rows,{...defaults(),cuisine:'Seafood'}),geo=restaurantFeatures(matches);assert.deepEqual(geo.features.map(f=>f.properties.id),matches.map(r=>r.id));assert.deepEqual(restaurantFeatures([]).features,[]);});
test('enrichment preserves Bobolas conflicting hours and cites every photo and discovery tag',()=>{assert.equal(rows.find(r=>r.name==='Bobola’s').hours,null);for(const r of rows){for(const p of r.photos||[])assert.ok(p.url&&p.source&&p.credit&&p.checkedAt);for(const d of Object.values(r.discovery||{}))assert.ok(d.source&&d.reason&&d.checkedAt);}});

test('Bobolas appears once in every user-confirmed cuisine and combined search',()=>{
 for(const cuisine of ['Seafood','American','Italian','Breakfast']){
  const found=filterRows(rows,{...defaults(),cuisine,query:'Bobola'});
  assert.deepEqual(found.map(r=>r.id),['nashua-3'],cuisine);
  assert.deepEqual(filterRows(rows,{...defaults(),query:'Bobola '+cuisine}).map(r=>r.id),['nashua-3']);
  assert.equal(cuisineCounts(rows,{...defaults(),query:'Bobola'})[cuisine],1);
 }
 assert.equal(filterRows(rows,defaults()).filter(r=>r.id==='nashua-3').length,1);
});
test('Breakfast cuisine and shortcut agree without inferring breakfast from generic diner labels',()=>{
 assert.deepEqual(filterRows(rows,{...defaults(),cuisine:'Breakfast'}).map(r=>r.id),filterRows(rows,{...defaults(),quick:'breakfast'}).map(r=>r.id));
 for(const id of ['osm-way-203684949','osm-way-204761861'])for(const cuisine of ['American','Breakfast'])assert.ok(filterRows(rows,{...defaults(),cuisine}).some(r=>r.id===id),id+' '+cuisine);
 assert.equal(filterRows([{name:'Unknown diner',cuisine:'American diner',dishes:[]}],{...defaults(),cuisine:'Breakfast'}).length,0);
});
