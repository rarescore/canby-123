import { defineConfig } from 'vite';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {attachForms} from './server/forms-middleware.mjs';
const entries=JSON.parse(readFileSync(new URL('./scripts/entries.json',import.meta.url)));
const aliases=JSON.parse(readFileSync(new URL('./scripts/redirects.json',import.meta.url)));
const forms={name:'canby-forms',configureServer:attachForms,configurePreviewServer:attachForms};
export default defineConfig({
  server:{host:'0.0.0.0',port:8080,strictPort:true},
  plugins:[forms,{name:'legacy-redirects',configureServer(server){server.middlewares.use((req,res,next)=>{
    const url=new URL(req.url,'http://localhost');
    const key=decodeURI(url.pathname).replace(/^\//,'').replace(/\/index\.html$/,'').replace(/\/$/,'');
    if(aliases[key]){const target=new URL(aliases[key],url.origin);target.search=url.search;res.writeHead(301,{Location:target.pathname+target.search+target.hash});res.end();return;}
    next();
  });}}],
  build:{rollupOptions:{input:entries.map(p=>resolve(import.meta.dirname,p))}}
});
