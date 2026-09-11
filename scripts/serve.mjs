import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf'};
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    let file=decodeURIComponent(url.pathname);
    if(file==='/')file='/index.html';
    const target=path.resolve(root,'.'+file);
    if(!target.startsWith(root+path.sep) && target!==root) {res.writeHead(403);res.end();return;}
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  } catch {res.writeHead(404);res.end('Ikke fundet');}
});
server.listen(4173,'127.0.0.1',()=>console.log('Dungeon Row: http://127.0.0.1:4173'));
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
