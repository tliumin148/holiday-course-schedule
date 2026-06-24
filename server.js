const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'};
http.createServer((req,res)=>{const file=path.join(__dirname,req.url==='/'?'index.html':req.url);fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});res.end(data)})}).listen(4174,'127.0.0.1',()=>console.log('http://127.0.0.1:4174'));
