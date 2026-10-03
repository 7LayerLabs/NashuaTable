import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const port=Number(process.env.NASHUA_PORT||8770);
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end();return}const f=p===root?path.join(root,'index.html'):p;fs.readFile(f,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(err?'Not found':data)})}).listen(port,'127.0.0.1',()=>console.log('Nashua Table: http://127.0.0.1:'+port));
