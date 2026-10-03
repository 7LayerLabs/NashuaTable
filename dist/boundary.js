// GeoJSON polygons include their perimeter; holes exclude their interior.
export function pointInRing([x,y],ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [ax,ay]=ring[j],[bx,by]=ring[i];
  const cross=(x-ax)*(by-ay)-(y-ay)*(bx-ax);
  if(Math.abs(cross)<1e-12&&x>=Math.min(ax,bx)-1e-10&&x<=Math.max(ax,bx)+1e-10&&y>=Math.min(ay,by)-1e-10&&y<=Math.max(ay,by)+1e-10)return true;
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
export function inBoundary(point,collection){
 return collection.features.some(({geometry:g})=>(g.type==='Polygon'?[g.coordinates]:g.coordinates).some(rings=>pointInRing(point,rings[0])&&!rings.slice(1).some(r=>pointInRing(point,r))));
}
export function outsideMask(boundary){
 const polygons=boundary.features.flatMap(({geometry:g})=>g.type==='Polygon'?[g.coordinates]:g.coordinates);
 return {type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]],...polygons.map(p=>p[0])]}},...polygons.flatMap(p=>p.slice(1).map(r=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[r]}})))]};
}
