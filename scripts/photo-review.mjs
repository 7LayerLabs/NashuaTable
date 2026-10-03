import fs from 'node:fs';
const patches=JSON.parse(fs.readFileSync('research/discovery-enrichment.json'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const html='<!doctype html><meta charset="utf-8"><title>Nashua venue photo review</title><style>body{background:#101c25;color:white;font:14px Arial;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:20px}img{width:100%;height:240px;object-fit:cover}figure{margin:0}figcaption{padding:15px 0}a{color:#c3f575}</style>'+patches.flatMap(p=>(p.photos||[]).map(photo=>'<figure><img src="'+escape(photo.url)+'" alt="'+escape(photo.alt)+'"><figcaption>'+escape(photo.alt)+'<p><a href="'+escape(p.source)+'">'+escape(photo.credit)+'</a></p></figcaption></figure>')).join('');
fs.writeFileSync('dist/photo-review.html',html);
