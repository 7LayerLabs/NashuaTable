import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalize} from '../dist/core.js';
export function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('Unclosed quoted CSV field');if(cell||row.length){row.push(cell);rows.push(row);}return rows;
}
const addressKey=s=>normalize(s).replace(/\b(nashua|new hampshire|nh|0306\d)\b/g,'').replace(/\bst\b/g,'street').replace(/\bave\b/g,'avenue').replace(/\brd\b/g,'road').replace(/\bdr\b/g,'drive').replace(/\bhwy\b/g,'highway').replace(/\s+/g,' ').trim();
export function reconcile(csv,restaurants){
 const [headers,...data]=parseCSV(csv.replace(/^\uFEFF/,''));if(!headers)throw Error('Empty roster');
 const keys=headers.map(normalize);const nameIndex=keys.findIndex(k=>['name','business name','establishment name','facility name'].includes(k)),addressIndex=keys.findIndex(k=>['address','street address','location address'].includes(k));
 if(nameIndex<0||addressIndex<0)throw Error('CSV must include name and address columns. Export Excel to CSV first.');
 const categoryIndex=keys.findIndex(k=>['category','type','facility type','establishment category'].includes(k)),statusIndex=keys.indexOf('status');
 return data.map(row=>{const name=row[nameIndex]?.trim(),address=row[addressIndex]?.trim();const addressMatches=address?restaurants.filter(r=>addressKey(r.address)===addressKey(address)):[];const exact=addressMatches.filter(r=>normalize(r.name)===normalize(name));return{name,address,category:row[categoryIndex]||null,status:row[statusIndex]||null,result:exact.length?'matched_name_and_address':addressMatches.length?'same_address_review_identity':'unmatched_candidate',directoryIds:(exact.length?exact:addressMatches).map(r=>r.id)};});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const input=process.argv[2];if(!input){console.error('Usage: node scripts/reconcile-roster.mjs path/to/roster.csv');process.exit(1);}
 const rows=JSON.parse(fs.readFileSync('dist/data/restaurants.json')).restaurants;const results=reconcile(fs.readFileSync(input,'utf8'),rows);
 const report={runAt:new Date().toISOString(),input:path.basename(input),note:'Unmatched records are candidates for review, not a missing-restaurant count. Confirm public dining scope, municipality, operating status, duplicates and alternate names before adding a record.',counts:results.reduce((a,r)=>(a[r.result]=(a[r.result]||0)+1,a),{}),results};
 fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/roster-reconciliation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.counts));console.log('Wrote reports/roster-reconciliation.json; restaurant data was not modified.');
}
