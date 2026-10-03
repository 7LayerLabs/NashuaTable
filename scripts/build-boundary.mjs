import fs from 'node:fs';
import {inBoundary} from '../dist/boundary.js';
const raw=JSON.parse(fs.readFileSync('research/city-boundary-raw.geojson'));
// Douglas-Peucker simplification: under roughly one metre at Nashua's latitude.
function simplify(points,tolerance=.000008){
 const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
 let max=tolerance*tolerance,index=0;
 for(let i=1;i<points.length-1;i++){
  const p=points[i],t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
  const distance=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;
  if(distance>max){max=distance;index=i;}
 }
 return index?[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)]:[a,b];
}
const boundary=structuredClone(raw);
for(const f of boundary.features){
 if(f.geometry.type!=='Polygon')throw Error('Review unexpected geometry before rebuilding');
 f.geometry.coordinates=f.geometry.coordinates.map(r=>simplify(r).map(p=>p.map(n=>Number(n.toFixed(7)))));
 f.properties={name:'Nashua city limits',source:'City of Nashua GIS · City Boundary (111)',sourceUrl:'https://newgis.nashuanh.gov/arcgisapp3/rest/services/HTML_Viewer/NashuaNH_OperationalLayers_2022/MapServer/111',retrievedAt:'2026-10-03',precision:'City GIS boundary simplified to approximately one metre for display; not a survey'};
}
const points=raw.features.flatMap(f=>f.geometry.coordinates.flat());
boundary.bbox=points.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[180,90,-180,-90]);
fs.writeFileSync('dist/data/nashua-boundary.geojson',JSON.stringify(boundary));
const rows=JSON.parse(fs.readFileSync('dist/data/restaurants.json')).restaurants;
const outside=rows.filter(r=>!inBoundary([r.lng,r.lat],raw)).map(({id,name,address,lng,lat,precision})=>({id,name,address,lng,lat,precision}));
const audit={checkedAt:'2026-10-03',source:boundary.features[0].properties,total:rows.length,inside:rows.length-outside.length,outside,method:'Point-in-polygon against unsimplified city GIS boundary. Tests coordinate placement, not current business identity.',displayAgrees:rows.every(r=>inBoundary([r.lng,r.lat],raw)===inBoundary([r.lng,r.lat],boundary))};
fs.writeFileSync('research/boundary-audit.json',JSON.stringify(audit,null,2));
console.log(JSON.stringify({...audit,vertices:boundary.features[0].geometry.coordinates[0].length},null,2));
