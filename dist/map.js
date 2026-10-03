import {COLORS,category} from './core.js';
import {outsideMask} from './boundary.js';
import {restaurantFeatures} from './discovery.js';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const el=id=>document.getElementById(id);
export class RestaurantMap{
 constructor(onSelect){this.onSelect=onSelect;this.rows=[];this.markers=new Map();this.revision=0;this.selected=null;this.ready=false;}
 async init(){
  try{
   if(!window.maplibregl)throw Error('Map library could not load');
   const [styleResponse,boundaryResponse]=await Promise.all([fetch('https://tiles.openfreemap.org/styles/liberty',{signal:AbortSignal.timeout(20000)}),fetch('./data/nashua-boundary.geojson')]);
   if(!styleResponse.ok||!boundaryResponse.ok)throw Error('Map resources unavailable');
   const base=await styleResponse.json();this.boundary=await boundaryResponse.json();
   const source=base.layers.find(l=>l['source-layer']==='building')?.source;
   if(!source)throw Error('Building source unavailable');
   const roadLabel=base.layers.find(l=>l.type==='symbol'&&l['source-layer']==='transportation_name');
   const style={version:8,glyphs:base.glyphs,sources:base.sources,light:{anchor:'viewport',color:'#b5d5e0',intensity:.5,position:[1.2,180,40]},layers:[
    {id:'background',type:'background',paint:{'background-color':'#111c27'}},
    {id:'landcover',type:'fill',source,'source-layer':'landcover',paint:{'fill-color':'#182d2b','fill-opacity':.65}},
    {id:'landuse',type:'fill',source,'source-layer':'landuse',paint:{'fill-color':'#172731','fill-opacity':.55}},
    {id:'water',type:'fill',source,'source-layer':'water',paint:{'fill-color':'#071521'}},
    {id:'water-lines',type:'line',source,'source-layer':'waterway',paint:{'line-color':'#123443','line-width':2}},
    {id:'road-glow',type:'line',source,'source-layer':'transportation',paint:{'line-color':'#4c6778','line-width':['interpolate',['linear'],['zoom'],11,.4,16,9],'line-blur':2,'line-opacity':.25}},
    {id:'roads',type:'line',source,'source-layer':'transportation',paint:{'line-color':['match',['get','class'],['motorway','trunk'],'#62727d',['primary','secondary'],'#465b6c','#304453'],'line-width':['interpolate',['linear'],['zoom'],11,.4,16,4],'line-opacity':.85}},
    {id:'buildings',type:'fill-extrusion',source,'source-layer':'building',minzoom:13,paint:{'fill-extrusion-color':['interpolate',['linear'],['coalesce',['get','render_height'],8],0,'#243845',20,'#345266',70,'#517082'],'fill-extrusion-height':['coalesce',['get','render_height'],8],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':.95}},
    ...(roadLabel?[{...roadLabel,id:'street-names',minzoom:13,layout:{...roadLabel.layout,'text-size':11,'text-allow-overlap':false},paint:{'text-color':'#a0b0bc','text-halo-color':'#111c27','text-halo-width':2}}]:[])
   ]};
   this.map=new maplibregl.Map({container:'map',style,center:[-71.49,42.755],zoom:12,pitch:35,maxPitch:70,minZoom:9,maxZoom:19,maxBounds:[[-72.1,42.2],[-70.8,43.3]],attributionControl:true,canvasContextAttributes:{antialias:true},fadeDuration:reduce?0:150});
   this.map.on('load',()=>{
    this.addGeography(roadLabel);this.ready=true;
    this.map.addSource('restaurants',{type:'geojson',data:restaurantFeatures([]),cluster:false});
    // Each restaurant has its own accessible dot at every zoom level.
    this.map.addLayer({id:'restaurant-source-loader',type:'circle',source:'restaurants',paint:{'circle-radius':1,'circle-opacity':0}});
    this.map.on('render',()=>this.syncMarkers());
    this.update(this.rows);this.fitCity(0);el('map-status').hidden=true;
    el('map').dataset.mapReady='true';el('map').dataset.boundaryReady='true';
    el('city-boundary-note').textContent='Nashua city limits · neighboring towns dimmed';
    this.map.on('pitchend',()=>{const tilted=this.map.getPitch()>10;el('dimension').textContent=tilted?'3D':'2D';el('dimension').setAttribute('aria-pressed',String(tilted));});
    this.map.on('moveend',()=>{el('map').dataset.zoom=this.map.getZoom().toFixed(2);});
    this.onReady?.();
   });
   this.map.on('error',e=>{console.warn('Map resource:',e.error?.message);if(!this.ready)this.failure();});
   this.map.getCanvas().addEventListener('webglcontextlost',()=>this.failure());
  }catch(error){console.warn(error.message);this.failure();}
 }
 failure(){el('map-status').textContent='Map unavailable. Use List to search and explore every result.';el('map-status').hidden=false;}
 addGeography(roadLabel){
  const map=this.map;
  map.addSource('nashua-city',{type:'geojson',data:this.boundary,attribution:'City boundary © <a href="https://nashuanh.gov/155/GIS" target="_blank" rel="noopener">Nashua GIS</a>'});
  map.addSource('outside-nashua',{type:'geojson',data:outsideMask(this.boundary)});
  map.addLayer({id:'outside-nashua-shade',type:'fill',source:'outside-nashua',paint:{'fill-color':'#03080f','fill-opacity':.78}});
  map.addLayer({id:'city-limit-glow',type:'line',source:'nashua-city',paint:{'line-color':'#c3f575','line-width':9,'line-blur':7,'line-opacity':.6}});
  map.addLayer({id:'city-limit-line',type:'line',source:'nashua-city',paint:{'line-color':'#d2fa92','line-width':2,'line-dasharray':[5,2]}});
  const labels=[['HUDSON',-71.424,42.76,'town'],['MERRIMACK',-71.50,42.823,'town'],['HOLLIS',-71.589,42.758,'town'],['TYNGSBOROUGH',-71.447,42.682,'town'],['AMHERST STREET',-71.517,42.789,'corridor'],['DOWNTOWN',-71.468,42.769,'corridor'],['DANIEL WEBSTER HWY',-71.450,42.721,'corridor'],['BROAD STREET',-71.510,42.769,'corridor'],['MAIN DUNSTABLE',-71.507,42.740,'corridor'],['SPIT BROOK',-71.474,42.709,'corridor']];
  map.addSource('area-labels',{type:'geojson',data:{type:'FeatureCollection',features:labels.map(([name,lng,lat,kind])=>({type:'Feature',properties:{name,kind},geometry:{type:'Point',coordinates:[lng,lat]}}))}});
  map.addLayer({id:'area-labels',type:'symbol',source:'area-labels',maxzoom:15,layout:{'text-field':['get','name'],'text-font':roadLabel?.layout?.['text-font']||['Noto Sans Regular'],'text-size':['match',['get','kind'],'town',13,10],'text-letter-spacing':.15,'text-padding':18},paint:{'text-color':['match',['get','kind'],'town','#7d8a92','#bed0c5'],'text-halo-color':'#07111a','text-halo-width':2}});
 }
 update(rows,cuisine=this.cuisine||''){
  this.cuisine=cuisine;
  this.rows=rows;el('map').dataset.matchCount=String(rows.length);
  if(!this.ready)return;
  this.revision++;for(const {marker}of this.markers.values())marker.remove();this.markers.clear();
  this.lookup=new Map(rows.map(r=>[r.id,r]));this.groups=new Map();
  for(const r of rows){const key=r.lng.toFixed(5)+','+r.lat.toFixed(5);if(!this.groups.has(key))this.groups.set(key,[]);this.groups.get(key).push(r.id);}
  const data=restaurantFeatures(rows);for(const f of data.features)f.properties.revision=this.revision;
  this.map.getSource('restaurants').setData(data);
 }
 syncMarkers(){
  if(!this.ready)return;
  const needed=new Set(),map=this.map,width=map.getContainer().clientWidth,height=map.getContainer().clientHeight;
  for(const r of this.rows){
   const coords=[r.lng,r.lat],point=map.project(coords);
   if(point.x< -70||point.y< -70||point.x>width+70||point.y>height+70)continue;
   const key=r.id;
   if(needed.has(key))continue;needed.add(key);
   if(this.markers.has(key)){this.markers.get(key).el.classList.toggle('selected',key===this.selected);continue;}
   const button=document.createElement('button');let offset=[0,0];
    button.className='pin'+(r.id===this.selected?' selected':'');button.dataset.id=r.id;
    button.style.setProperty('--c',r.status==='closed'?'#9ba5ad':COLORS[this.cuisine||r.cuisines?.[0]||category(r.cuisine)]);
    button.setAttribute('aria-label',`View ${r.name} on map`);
    const label=document.createElement('span');label.className='pin-label';label.textContent=r.name;
    const top=document.createElement('span');top.className='pin-top';top.setAttribute('aria-hidden','true');
    button.append(label,top);
    button.onclick=()=>this.onSelect(r.id);
    const group=this.groups.get(r.lng.toFixed(5)+','+r.lat.toFixed(5));
    if(group?.length>1){const angle=group.indexOf(r.id)/group.length*Math.PI*2;offset=[Math.cos(angle)*27,Math.sin(angle)*23];}
   const marker=new maplibregl.Marker({element:button,anchor:'center',offset}).setLngLat(coords).addTo(map);
   this.markers.set(key,{marker,el:button});
  }
  for(const [key,value]of this.markers)if(!needed.has(key)){value.marker.remove();this.markers.delete(key);}
  el('map').dataset.renderedGroups=String(this.markers.size);
 }
 fitCity(duration=1000){
  if(!this.ready)return;const b=this.boundary.bbox,mobile=innerWidth<=760;
  const camera=this.map.cameraForBounds([[b[0],b[1]],[b[2],b[3]]],{padding:{top:mobile?160:150,bottom:mobile?220:130,left:mobile?28:70,right:mobile?60:90},bearing:0});
  if(camera)this.map.easeTo({...camera,zoom:camera.zoom+(mobile?0:.15),pitch:35,bearing:0,duration:reduce?0:duration});
 }
 fit(rows){
  if(!this.ready||!rows.length)return;
  const bounds=new maplibregl.LngLatBounds();rows.forEach(r=>bounds.extend([r.lng,r.lat]));const mobile=innerWidth<=760;
  this.map.fitBounds(bounds,{padding:{top:mobile?170:160,bottom:mobile?230:140,left:50,right:mobile?65:90},maxZoom:16,pitch:rows.length>25?35:50,duration:reduce?0:950});
 }
 focus(r,detail=true){
  this.selected=r.id;if(!this.ready)return;
  this.map.flyTo({center:[r.lng,r.lat],zoom:16.3,pitch:55,offset:innerWidth<=760?[0,detail?-120:-45]:detail?[-150,20]:[0,0],duration:reduce?0:950});
 }
 resize(){this.map?.resize();}
 zoom(direction){if(this.ready)direction>0?this.map.zoomIn():this.map.zoomOut();}
 north(){if(this.ready)this.map.easeTo({bearing:0,duration:reduce?0:500});}
 toggle3D(){if(this.ready)this.map.easeTo({pitch:this.map.getPitch()>10?0:55,duration:reduce?0:700});}
}
