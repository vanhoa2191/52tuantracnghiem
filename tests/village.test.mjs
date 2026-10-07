import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {scenePage,welcomeContent,viewKind,SCENE_PAGES,DESTINATIONS} from '../public/scene-ui.mjs';
import {atriumFrustum,viewThemes} from '../src/atrium.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
const renderSource=source.slice(source.indexOf('async function render(){'),source.indexOf('function download('));
test('every page route mounts exactly one real-scene adapter and disposes previous controllers',async()=>{
 for(const r of ['home','world','journey','map','badges','practice','parents','reports','quiz','journal','celebrate']){
  const mounted=[],disposed=[],main={innerHTML:'',classList:{toggle(){}}};const location={hash:'#'+r+(r==='quiz'?'/attempt':r==='reports'?'/q1':r==='journal'?'/3':'')};
  const context={renderId:0,state:{},atriumController:{dispose:()=>disposed.push('atrium')},worldController:{dispose:()=>disposed.push('world')},quizController:{dispose:()=>disposed.push('quiz')},route:()=>r,main,profile:()=>({name:'Bé An'}),document:{querySelectorAll:()=>[]},$:()=>({textContent:''}),library:{},report:null,assessmentRequestId:null,activeId:'child',attempt:{id:'attempt'},quizCursor:0,location,viewKind,scenePage,welcomeContent,esc,doneCount:()=>2,api:async()=>({}),window:{lastCompletion:{week:1}},toast:()=>{},encodeURIComponent,activateAtrium:async(id,view)=>mounted.push(['atrium',view]),activateWorld:async()=>mounted.push(['world']),activateQuiz:async()=>mounted.push(['quiz'])};
  for(const name of ['worldView','badges','practice','parents','reports','quiz','journalView','celebration','home'])context[name]=()=>'<form data-content="preserved">Readable original content</form>';
  await vm.runInNewContext(renderSource+';render()',context);
  assert.equal(disposed.length,3,r);assert.equal(mounted.length,1,r);assert.equal(mounted[0][0],viewKind(r),r);assert.ok(main.innerHTML.includes('data-content="preserved"'),r);
  if(viewKind(r)==='atrium')assert.ok(main.innerHTML.includes('id="atrium-canvas"'),r);
 }
});
test('welcome scene works before any child exists and retains creation/import actions',async()=>{const mounted=[],main={innerHTML:'',classList:{toggle(){}}};const context={renderId:0,state:{},atriumController:null,worldController:null,quizController:null,route:()=> 'home',profile:()=>undefined,main,document:{querySelectorAll:()=>[]},$:()=>({textContent:''}),viewKind,scenePage,welcomeContent,esc,activateAtrium:async(id,view)=>mounted.push(view)};await vm.runInNewContext(renderSource+';render()',context);assert.deepEqual(mounted,['welcome']);assert.ok(main.innerHTML.includes('data-action="add-profile"'));assert.ok(main.innerHTML.includes('data-action="import"'));assert.ok(main.innerHTML.includes('id="atrium-canvas"'));});
test('all eight content destinations have a scene theme, readable content and navigation fallback',()=>{for(const view of Object.keys(SCENE_PAGES)){assert.ok(viewThemes[view],view);const html=scenePage({view,content:'<p>Important interpretation</p>',name:'<script>bad</script>',completed:2,escape:esc});assert.ok(html.includes('Important interpretation'));assert.ok(!html.includes('<script>bad</script>'));for(const d of DESTINATIONS.filter(d=>d.id!==view))assert.ok(html.includes('href="#'+d.id+'"'));}assert.ok(!scenePage({view:'"><img src=x onerror=1>',content:'safe',escape:esc}).includes('data-scene-view=""><img'));});
test('camera framing contains all village landmarks on phone, tablet and desktop',()=>{for(const [w,h]of [[320,330],[390,330],[520,490],[768,400],[1280,500]]){const f=atriumFrustum(w,h),camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,120);camera.position.set(15,22,26);camera.lookAt(0,2,0);camera.updateMatrixWorld();for(const [x,y,z]of [[-4.7,6.35,-2.4],[4.3,5.95,-3],[-4.8,4.45,4],[4.8,4.85,3.3],[.1,4.05,-6.5],[0,-4.8,0]]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${w}x${h}: ${x},${y},${z}`);}}});
