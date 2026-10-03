import {matches,isOpen,localTime,normalize,category,categories,hasBreakfast,COLORS} from './core.js';
export const QUICK={breakfast:'Breakfast',coffee:'Coffee','date-night':'Date night',takeout:'Takeout','open-late':'Open late'};
export const defaults=()=>({query:'',cuisine:'',district:'',price:'',rating:0,open:false,quick:'',includeClosed:false,favorites:false});
export function openLate(r,date=new Date()){
 if(r.status==='closed'||r.status==='temporarily_closed'||r.status==='needs_review'||!r.hours)return false;
 const {day}=localTime(date);
 return r.hours[day]?.some(([start,end])=>end===1440||end>=1320||end<start)||false;
}
export function quickMatch(r,quick,date){
 if(!quick)return true;
 if(quick==='open-late')return openLate(r,date);
 if(r.discovery?.[quick]?.source)return true;
 // These two shortcuts can also use explicit menu or cuisine evidence.
 const text=normalize([r.cuisine,...(r.dishes||[])].join(' '));
 if(quick==='breakfast')return hasBreakfast(r);
 if(quick==='coffee')return /\bcoffee\b|\bespresso\b|\blatte\b|\bcappuccino\b/.test(text);
 return false;
}
export function filterRows(rows,f=defaults(),saved=new Set(),date=new Date()){
 const query=normalize(f.query);
 const queryQuick=Object.keys(QUICK).find(k=>normalize(QUICK[k])===query);
 return rows.filter(r=>{
  if(!f.includeClosed&&r.status==='closed')return false;
  if(f.favorites&&!saved.has(r.id))return false;
  if(!quickMatch(r,f.quick,date)||!quickMatch(r,queryQuick,date))return false;
  if(f.price==='mid'&&![2,3].includes(r.price))return false;
  return matches(r,{...f,query:queryQuick?'':f.query,price:f.price==='mid'?'':f.price},date);
 });
}
export function cuisineCounts(rows,f,saved,date){
 const eligible=filterRows(rows,{...f,cuisine:''},saved,date);
 return Object.fromEntries([['',eligible.length],...Object.keys(COLORS).map(c=>[c,eligible.filter(r=>categories(r).includes(c)).length])]);
}
export function sourceDate(r,field){
 // A record compilation date is never silently used as a field verification date.
 if(field==='rating'&&r.rating?.capturedAt)return r.rating.capturedAt;
 return r.sources?.filter(s=>s.fields?.includes(field)&&s.checkedAt).map(s=>s.checkedAt).sort().at(-1)||null;
}
export function statusText(r,date=new Date()){
 if(r.status==='closed')return'Permanently closed';
 if(r.status==='temporarily_closed')return'Temporarily closed';
 if(r.status==='needs_review')return'Needs review';
 const open=isOpen(r,date);
 return open===true?'Open · published hours':open===false?'Closed now · published hours':'Hours unconfirmed';
}
export function sortRows(rows,sort){
 return [...rows].sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='rating'?(b.rating?.value??-1)-(a.rating?.value??-1)||a.name.localeCompare(b.name):Number(!!b.featured)-Number(!!a.featured)||a.name.localeCompare(b.name));
}
export function restaurantFeatures(rows){return{type:'FeatureCollection',features:rows.map(r=>({type:'Feature',id:r.id,geometry:{type:'Point',coordinates:[r.lng,r.lat]},properties:{id:r.id,color:COLORS[category(r.cuisine)]}}))};}
export function compareToggle(ids,id){if(ids.includes(id))return ids.filter(x=>x!==id);return ids.length<3?[...ids,id]:ids;}
export function readSaved(storage){try{const data=JSON.parse(storage.getItem('nashua-table-favorites')||'[]');return new Set(Array.isArray(data)?data.filter(v=>typeof v==='string'):[])}catch{return new Set()}}
