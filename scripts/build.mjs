import {readFile,writeFile,mkdir,rm,cp,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=new URL('../',import.meta.url);
const bank=JSON.parse(await readFile(new URL('data/content.json',root),'utf8'));
if(bank.weeks.length!==52||bank.weeks.some((w,i)=>w.id!==i+1||w.questions.length!==10)||bank.portraits.length!==16)throw new Error('Content is incomplete.');
for(const w of bank.weeks)for(const q of w.questions){if(q.acceptedAnswers.some(k=>!q.options[k]))throw new Error('Invalid answer key.');for(const k of Object.keys(q.options))if(k!==q.answer&&!q.validAlternatives[k]&&!q.optionExplanations[k])throw new Error('Missing explanation.');}
const contentVersion=createHash('sha256').update(JSON.stringify(bank)).digest('hex');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const assets={};for(const file of await readdir(new URL('public/',root))){const extension=file.slice(file.lastIndexOf('.'));if(!types[extension])continue;assets['/'+file]={type:types[extension],body:await readFile(new URL('public/'+file,root),'utf8')};}
const worldBundle=await build({entryPoints:[new URL('src/world.mjs',root).pathname],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,charset:'utf8',write:false});
assets['/world.mjs']={type:'text/javascript; charset=utf-8',body:worldBundle.outputFiles[0].text};
await writeFile(new URL('server/assets.mjs',root),'export default '+JSON.stringify(assets)+';\n');
await writeFile(new URL('server/index.mjs',root),`import {createHandler} from './handler.mjs';\nimport bank from '../data/content.json' with {type:'json'};\nimport assets from './assets.mjs';\nexport default createHandler({bank,assets,contentVersion:${JSON.stringify(contentVersion)}});\n`);
await rm(new URL('dist/',root),{recursive:true,force:true});await mkdir(new URL('dist/server/',root),{recursive:true});
await build({entryPoints:[new URL('server/index.mjs',root).pathname],outfile:new URL('dist/server/index.js',root).pathname,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,charset:'utf8'});
await mkdir(new URL('dist/.openai/',root),{recursive:true});await cp(new URL('.openai/hosting.json',root),new URL('dist/.openai/hosting.json',root));await cp(new URL('drizzle/',root),new URL('dist/drizzle/',root),{recursive:true});
console.log('Built Worker: 52 weeks, 520 questions, 16 portraits. Content version: '+contentVersion.slice(0,12));
