import fs from 'node:fs';
let r=fs.readFileSync('scripts/reconcile-data.mjs','utf8').replace('dist/data/research-snapshot.json','research/research-snapshot.json');fs.writeFileSync('scripts/reconcile-data.mjs',r);
let a=fs.readFileSync('dist/app.js','utf8');const start=a.indexOf('async function enrich()');const end=a.indexOf('function download()',start);if(start!==-1)a=a.slice(0,start)+a.slice(end);a=a.replace('matches,mergeOSM','matches');fs.writeFileSync('dist/app.js',a);
let h=fs.readFileSync('dist/index.html','utf8').replace('Find your<br>next','Find your<br> next');fs.writeFileSync('dist/index.html',h);
