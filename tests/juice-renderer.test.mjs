import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createPortalInput,quizTheme} from '../public/game-input.mjs';
import {stageForWeek,growthForProgress} from '../public/game-journey.mjs';
const source=readFileSync(new URL('../src/quiz.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
// Real Three scene graph and geometry; the renderer is a stub. No GPU or visual QA claim.
function harness(week,motion=true){
  let frame,scene,renders=0,removed=false,disconnected=false;const events=new Map(),chosen=[];
  const context2d={beginPath(){},arc(){},fill(){},stroke(){},fillText(){}};
  const canvas={style:{},setAttribute(){},addEventListener(k,f){events.set(k,f);},removeEventListener(k){events.delete(k);},remove(){removed=true;},focus(){},getBoundingClientRect(){return {left:0,top:0,width:1000,height:340};}};
  class Renderer{constructor(){this.domElement=canvas;this.info={render:{},memory:{}};}setPixelRatio(v){this.dpr=v;}getPixelRatio(){return this.dpr;}setClearColor(){}setSize(){}render(s,c){scene=s;s.updateMatrixWorld();c.updateMatrixWorld();renders++;}dispose(){}}
  const context={THREE:{...THREE,WebGLRenderer:Renderer},mergeGeometries,createPortalInput,quizTheme,stageForWeek,growthForProgress,devicePixelRatio:1,matchMedia:()=>({matches:false}),document:{hidden:false,createElement:()=>({getContext:()=>context2d})},performance:{now:()=>0},ResizeObserver:class{observe(){}disconnect(){disconnected=true;}},requestAnimationFrame:f=>{frame=f;return 1;},cancelAnimationFrame(){}};
  const mount=vm.runInNewContext(source+';mountQuiz',context);
  const controller=mount({container:{clientWidth:1000,clientHeight:340,append(){}},order:['D','B','A','C'],week,answered:2,total:10,motion,onChoose:key=>chosen.push(key),onError:()=>assert.fail('renderer setup failed')});
  function tick(t){frame(t);}
  tick(40);
  return {controller,events,chosen,tick,get scene(){return scene;},get renders(){return renders;},get removed(){return removed;},get disconnected(){return disconnected;}};
}
test('all four quiz stages build real geometry, keep canonical input, grow with progress, and dispose',()=>{
  for(let week=1;week<=4;week++){
    const h=harness(week),c=h.controller;
    assert.equal(c.diagnostics().stage,stageForWeek(week).id);
    const sprout=h.scene.getObjectByName('weekly-sprout');assert.ok(sprout);
    assert.ok(Math.abs(sprout.scale.x-.44)<.001);
    const press=key=>h.events.get('keydown')({key,preventDefault(){}});
    press('1');assert.deepEqual(h.chosen,['D']);
    c.setPending(true);press('2');assert.equal(h.chosen.length,1);c.setPending(false);
    c.setPaused(true);press('2');const prior=h.renders;h.tick(100);assert.equal(h.renders,prior);c.setPaused(false);
    c.setResult('D',['D','B']);press('2');assert.equal(h.chosen.length,1);
    c.setMotion(false);c.setProgress(10,10);h.tick(160);assert.equal(sprout.scale.x,1);
    const avatar=h.scene.getObjectByName('Mầm'),position=avatar.position.clone();h.tick(220);assert.ok(avatar.position.equals(position));
    const geometries=new Set(),materials=new Set();h.scene.traverse(o=>{if(o.isMesh&&o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
    let gd=0,md=0;geometries.forEach(g=>g.addEventListener('dispose',()=>gd++));materials.forEach(m=>m.addEventListener('dispose',()=>md++));
    c.dispose();assert.equal(gd,geometries.size);assert.equal(md,materials.size);assert.equal(h.removed,true);assert.equal(h.disconnected,true);assert.equal(h.events.size,0);c.dispose();
  }
});
test('reduced motion keeps mascot and stations still while answer and growth state remain usable',()=>{
  const h=harness(3,false),avatar=h.scene.getObjectByName('Mầm'),initial=avatar.position.clone();h.tick(2000);assert.ok(avatar.position.equals(initial));
  h.controller.setResult('A',['B']);h.controller.setProgress(5,10);h.tick(2060);assert.equal(avatar.position.x,2.1);assert.ok(Math.abs(h.scene.getObjectByName('weekly-sprout').scale.x-.65)<1e-9);h.controller.dispose();
});
