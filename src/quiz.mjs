import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createPortalInput,quizTheme} from '../public/game-input.mjs';
import {stageForWeek,growthForProgress} from '../public/game-journey.mjs';
export const GATE_COLORS=[0xe8b956,0x65b49d,0xa59bdd,0xe39783];
export function gatePosition(index){return [(index-1.5)*4.2,0,0];}
export function quizFrustum(width,height){const aspect=width/height,halfWidth=Math.max(10,4.1*aspect);return {left:-halfWidth,right:halfWidth,top:halfWidth/aspect,bottom:-halfWidth/aspect};}
export function mountQuiz({container,order,selected,acceptedAnswers=[],week=1,answered=0,total=10,motion=true,onChoose,onPreview=()=>{},onError}){
  let renderer,disposed=false,frame,target=null,time=0,rewardAt=-100;
  const input=createPortalInput(order,selected),theme=quizTheme(week),stage=stageForWeek(week);
  let reduced=!motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{onError();return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(theme.sky);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label',`${stage.name}. Bốn đáp án 3D. Dùng phím mũi tên để xem, Enter để chọn, hoặc phím 1 đến 4. Nội dung từng đáp án ở ngay dưới.`);container.append(canvas);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,100);camera.position.set(0,9,16);camera.lookAt(0,1,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x8da895,2.5));const light=new THREE.DirectionalLight(0xffedca,2.8);light.position.set(-8,14,9);scene.add(light);
  const geometries=new Set(),materials=new Set(),textures=new Set(),materialKit=new Map(),gates=[],hits=[],staticParts=[];
  function material(color){if(!materialKit.has(color)){const m=new THREE.MeshStandardMaterial({color,roughness:.82});materialKit.set(color,m);materials.add(m);}return materialKit.get(color);}
  function mesh(geometry,color,x,y,z,parent=scene){geometries.add(geometry);const object=new THREE.Mesh(geometry,material(color));object.position.set(x,y,z);parent.add(object);return object;}
  function stationary(geometry,color,x,y,z,scale){const m=mesh(geometry,color,x,y,z);if(scale)m.scale.set(...scale);staticParts.push(m);return m;}
  function stem(a,b,r,color,parent=scene){const direction=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const m=mesh(new THREE.CylinderGeometry(r,r,direction.length(),6),color,...new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5).toArray(),parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return m;}
  stationary(new THREE.CylinderGeometry(10.2,9.2,1,40),theme.ground,0,-.7,0);
  stationary(new THREE.CylinderGeometry(10.7,9.5,.65,40),0xead8b0,0,-1.5,0);
  // Layered garden silhouettes and a pale stepping path ground the answer stations.
  for(let i=0;i<13;i++)stationary(new THREE.CylinderGeometry(.36,.4,.09,8),i%2?0xf7ead1:0xebdbc2,(i-6)*1.3,-.13,2.55+Math.sin(i)*.18);
  for(const [i,x] of [-8.8,-4.5,4.5,8.8].entries()){
    stationary(new THREE.CylinderGeometry(.14,.22,1.8,6),0x997052,x,.55,-3.5);
    stationary(new THREE.IcosahedronGeometry(1,1),theme.leaf,x,2,-3.5,[1.05,1.4,.9]);
    stationary(new THREE.IcosahedronGeometry(.7,1),i%2?0xa8c88d:0x92be9d,x+.45,2.5,-3.5);
  }
  for(const x of [-6,6])for(let i=0;i<3;i++)stationary(new THREE.IcosahedronGeometry(.75,1),0xfffdf2,x+i*.6-.6,3.25+(i===1?.2:0),-5,[1.2,.55,.65]);
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,x=Math.cos(a)*9,z=Math.sin(a)*5;stationary(new THREE.IcosahedronGeometry(.35,0),i%2?0x80af92:0xa8c894,x,-.07,z,[1,.7,1]);if(i%3===0)stationary(new THREE.SphereGeometry(.13,6,4),0xf4dc84,x,.24,z);}
  function label(group,index){const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');if(!ctx)return;ctx.fillStyle='#fff8e6';ctx.beginPath();ctx.arc(64,64,53,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d4bd8d';ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#325448';ctx.font='bold 70px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('ABCD'[index],64,68);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);const m=new THREE.SpriteMaterial({map:texture,depthTest:false});materials.add(m);const sprite=new THREE.Sprite(m);sprite.position.set(0,4.65,.4);sprite.scale.set(1.05,1.05,1.05);group.add(sprite);}
  order.forEach((key,i)=>{
    const [x]=gatePosition(i),group=new THREE.Group();group.position.x=x;scene.add(group);const color=GATE_COLORS[i];
    mesh(new THREE.CylinderGeometry(1.65,1.75,.2,12),0xfff5d9,0,-.01,0,group);
    const cue=mesh(new THREE.CylinderGeometry(1.42,1.42,.055,24),color,0,.12,0,group);cue.material=cue.material.clone();materials.add(cue.material);
    const ornament=new THREE.Group();group.add(ornament);
    if(stage.id==='lanterns'){
      mesh(new THREE.CylinderGeometry(.12,.18,3.8,8),0x947456,-1.1,1.95,0,ornament);
      const beam=mesh(new THREE.BoxGeometry(2.6,.18,.2),0x947456,0,3.85,0,ornament);beam.rotation.z=.04;
      mesh(new THREE.CylinderGeometry(.045,.045,.45,6),0xb39260,.35,3.55,0,ornament);
      mesh(new THREE.SphereGeometry(.93,16,10),color,.35,2.55,0,ornament).scale.set(.9,1.2,.9);
      for(const y of [1.5,3.55])mesh(new THREE.CylinderGeometry(.43,.43,.18,10),0x8b6651,.35,y,0,ornament);
      for(const px of [-.12,.35,.82])mesh(new THREE.CylinderGeometry(.025,.025,1.7,5),0xffe6b5,px,2.55,.76,ornament);
      mesh(new THREE.ConeGeometry(.13,.38,6),0xe8b956,.35,1.16,0,ornament);
    }else if(stage.id==='balloons'){
      mesh(new THREE.SphereGeometry(1.05,16,12),color,0,2.95,0,ornament).scale.set(1,1.13,1);
      mesh(new THREE.CylinderGeometry(.33,.7,.5,12),color,0,1.93,0,ornament);
      for(const px of [-.43,.43])stem([px,.78,0],[px*.75,1.93,0],.026,0xb2926e,ornament);
      mesh(new THREE.CylinderGeometry(.59,.48,.63,10),0xae815a,0,.72,0,ornament);
      mesh(new THREE.TorusGeometry(.58,.065,5,12),0xf1d6a1,0,1.05,0,ornament).rotation.x=Math.PI/2;
      mesh(new THREE.SphereGeometry(.44,12,8),0xffe4b1,-.28,3.3,.77,ornament).scale.set(.25,.7,.08);
    }else if(stage.id==='stones'){
      mesh(new THREE.CylinderGeometry(1.08,1.3,.65,8),0xb9c6b9,0,.45,0,ornament);
      mesh(new THREE.CylinderGeometry(.8,1.02,.9,8),0xd2d9c6,0,1.22,0,ornament);
      mesh(new THREE.CylinderGeometry(1.04,.85,.25,8),0xfff1d0,0,1.78,0,ornament);
      const crystal=mesh(new THREE.OctahedronGeometry(.77,0),color,0,2.67,0,ornament);crystal.scale.y=1.25;
      mesh(new THREE.TorusGeometry(.85,.065,6,24),0xe6c36f,0,2.67,0,ornament).rotation.x=.45;
      for(const px of [-.75,.75])mesh(new THREE.IcosahedronGeometry(.25,0),theme.leaf,px,.87,.5,ornament);
    }else{
      for(const px of [-1.25,1.25]){
        mesh(new THREE.BoxGeometry(.42,3.55,.5),color,px,1.85,0,ornament);
        for(const y of [.35,3.52])mesh(new THREE.BoxGeometry(.6,.16,.68),0xffecc1,px,y,0,ornament);
      }
      mesh(new THREE.TorusGeometry(1.25,.24,8,20,Math.PI),color,0,3.55,0,ornament);
      mesh(new THREE.OctahedronGeometry(.28),0xffd878,0,3.95,.1,ornament);
    }
    // A generous proxy has the same canonical key for every authored station.
    const door=mesh(new THREE.PlaneGeometry(2.8,4.05),color,0,2.1,.95,group);door.material=door.material.clone();materials.add(door.material);door.material.transparent=true;door.material.opacity=.035;door.material.side=THREE.DoubleSide;door.material.depthWrite=false;door.userData.key=key;hits.push(door);
    label(group,i);gates.push({key,group,door,cue,ornament,color});
  });
  const avatar=new THREE.Group();avatar.name='Mầm';avatar.position.set(0,0,4.1);scene.add(avatar);
  // Mầm: leaf cap, rounded overalls, backpack, jointed waving arms and a smile.
  mesh(new THREE.CapsuleGeometry(.43,.6,4,10),0x4b927c,0,1.05,0,avatar);
  mesh(new THREE.BoxGeometry(.56,.65,.28),0xd2a565,0,1.22,-.4,avatar);
  mesh(new THREE.SphereGeometry(.61,16,12),0xf4c7a1,0,1.98,0,avatar);
  mesh(new THREE.SphereGeometry(.72,12,8),0x78a768,0,2.39,0,avatar).scale.set(1,.3,1);
  const capLeaf=mesh(new THREE.SphereGeometry(.38,10,6),0x9ec77a,.26,2.66,0,avatar);capLeaf.scale.set(.45,1,.16);capLeaf.rotation.z=-.5;
  const eyes=[];for(const x of [-.22,.22]){
    eyes.push(mesh(new THREE.SphereGeometry(.067,8,6),0x364a42,x,2.05,.56,avatar));
    mesh(new THREE.SphereGeometry(.105,8,6),0xeaa68e,x*1.5,1.9,.5,avatar).scale.z=.25;
    mesh(new THREE.CapsuleGeometry(.14,.21,3,6),0x634c43,x,.24,0,avatar).rotation.x=Math.PI/2;
    mesh(new THREE.SphereGeometry(.05,6,4),0xf2d684,x*.55,1.36,.4,avatar);
  }
  const smile=mesh(new THREE.TorusGeometry(.13,.018,4,12,Math.PI),0x925d4b,0,1.89,.585,avatar);smile.rotation.z=Math.PI;
  const arms=[];for(const x of [-.47,.47]){const arm=new THREE.Group();arm.position.set(x,1.5,0);avatar.add(arm);mesh(new THREE.CapsuleGeometry(.12,.35,3,6),0x4b927c,Math.sign(x)*.1,-.23,0,arm);mesh(new THREE.SphereGeometry(.14,8,6),0xf4c7a1,Math.sign(x)*.12,-.48,0,arm);arms.push(arm);}
  const sprout=new THREE.Group();sprout.position.set(0,0,-2.8);scene.add(sprout);
  mesh(new THREE.CylinderGeometry(.6,.48,.42,12),0xc38b64,0,.15,0,sprout);
  mesh(new THREE.CylinderGeometry(.62,.62,.12,12),0xe4b88b,0,.39,0,sprout);
  mesh(new THREE.CylinderGeometry(.52,.52,.04,12),0x765d44,0,.46,0,sprout);
  const growing=new THREE.Group();growing.name='weekly-sprout';growing.position.y=.48;sprout.add(growing);
  mesh(new THREE.CylinderGeometry(.055,.08,1.5,7),0x759b58,0,.75,0,growing);
  for(const [x,y] of [[-.3,.5],[.3,.85],[-.3,1.15]]){const leaf=mesh(new THREE.SphereGeometry(.42,10,6),0x8fb968,x,y,0,growing);leaf.scale.set(1,.35,.35);leaf.rotation.z=x>0?.45:-.45;}
  const flower=mesh(new THREE.IcosahedronGeometry(.28,1),0xffd57e,0,1.65,0,growing);
  let growth=growthForProgress(answered,total),growthTarget=growth;
  function applyGrowth(){growing.scale.setScalar(.3+growth*.7);flower.visible=growth>=.95;}
  applyGrowth();
  // Static scenery is merged per material. Dynamic station and mascot parts stay separate.
  const batches=new Map();for(const part of staticParts){part.updateMatrix();const baked=part.geometry.clone().applyMatrix4(part.matrix);if(!batches.has(part.material))batches.set(part.material,[]);batches.get(part.material).push(baked);scene.remove(part);}
  for(const [m,parts] of batches){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(g){geometries.add(g);scene.add(new THREE.Mesh(g,m));}}
  const sparks=[];const sparkGeometry=new THREE.OctahedronGeometry(.1),sparkMaterial=material(0xffda78);geometries.add(sparkGeometry);for(let i=0;i<14;i++){const star=new THREE.Mesh(sparkGeometry,sparkMaterial);star.visible=false;scene.add(star);sparks.push(star);}
  const ripple=mesh(new THREE.TorusGeometry(.65,.035,5,32),0xf0cd81,0,.18,0);ripple.rotation.x=Math.PI/2;ripple.visible=false;
  function setProgress(count,questionTotal=total){growthTarget=growthForProgress(count,questionTotal);if(reduced){growth=growthTarget;applyGrowth();}}
  function setResult(key,accepted=[],animate=true){input.confirm(key);canvas.style.cursor='default';rewardAt=animate?time:-100;preview(null);const index=order.indexOf(key);if(index<0)return;target=new THREE.Vector3(gatePosition(index)[0],0,1.6);gates.forEach(g=>{const good=accepted.includes(g.key),color=good?0x7cc89a:g.key===key?0xe8bc7e:g.color;g.cue.material.color.set(color);g.door.material.color.set(color);g.door.material.opacity=good?.22:g.key===key?.13:.035;});if(animate)setProgress(Math.min(total,answered+1));sparks.forEach(s=>s.visible=animate&&!reduced);}
  if(selected)setResult(selected,acceptedAnswers,false);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  function preview(key){gates.forEach(g=>{g.group.scale.setScalar(g.key===key?1.025:1);g.cue.material.emissive.set(g.key===key?0x314c2c:0x000000);g.cue.material.emissiveIntensity=.3;});if(key)onPreview(key);}
  function choose(key){if(input.choose(key))onChoose(key);}
  function hitKey(e){const box=canvas.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(hits)[0]?.object.userData.key;}
  function pointerMove(e){if(input.state.paused||input.state.selected||input.state.pending)return;const key=hitKey(e);canvas.style.cursor=key?'pointer':'default';preview(key||null);if(key)input.preview(key);}
  function leave(){preview(null);}
  function cancelPointer(){down=null;}
  function pointerDown(e){if(input.state.paused)return;canvas.focus({preventScroll:true});down=[e.clientX,e.clientY];}
  function pointerUp(e){const start=down;down=null;if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>10)return;const key=hitKey(e);if(key)choose(key);}
  function keydown(e){const action=input.key(e.key);if(!action)return;e.preventDefault();if(action.type==='preview')preview(action.key);else choose(action.key);}
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);Object.assign(camera,quizFrustum(w,h));camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function lost(e){e.preventDefault();dispose();onError();}
  canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('blur',cancelPointer);canvas.addEventListener('keydown',keydown);canvas.addEventListener('webglcontextlost',lost);
  let previous=performance.now();function animate(t){if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden||input.state.paused){previous=t;return;}if(t-previous<30)return;const dt=Math.min((t-previous)/1000,.05);previous=t;time+=dt;
    if(target){if(reduced)avatar.position.copy(target);else avatar.position.lerp(target,1-Math.exp(-dt*3));}avatar.position.y=reduced?0:Math.sin(time*3)*.045;
    const active=!reduced&&(time<7||time-rewardAt<3.5);
    eyes.forEach(e=>e.scale.y=active&&time%4.4>4.23?.12:1);
    arms[0].rotation.z=active?-.2+Math.sin(time*2)*.07:0;
    arms[1].rotation.z=active&&(time<2.5||time-rewardAt<2)?1.8+Math.sin(time*7)*.23:0;
    gates.forEach((g,i)=>{g.ornament.position.y=active&&stage.id==='balloons'?Math.sin(time*1.2+i)*.08:0;g.ornament.rotation.y=active&&stage.id==='stones'?Math.sin(time*.7+i)*.06:0;});
    growth=reduced?growthTarget:THREE.MathUtils.lerp(growth,growthTarget,1-Math.exp(-dt*4));applyGrowth();
    const elapsed=time-rewardAt; sparks.forEach((s,i)=>{s.visible=!reduced&&elapsed>=0&&elapsed<2.3;const a=i/14*Math.PI*2,spread=.35+Math.min(elapsed,2.3)*.65;s.position.set(avatar.position.x+Math.cos(a)*spread,1.2+(i%4)*.25+Math.max(0,elapsed)*.35,avatar.position.z+Math.sin(a)*spread);s.scale.setScalar(Math.max(.01,1-elapsed/2.3));if(!reduced)s.rotation.y=time;});
    ripple.visible=!reduced&&elapsed>=0&&elapsed<1; if(ripple.visible){ripple.position.set(avatar.position.x,.18,avatar.position.z);ripple.scale.setScalar(1+elapsed*1.5);}
    renderer.render(scene,camera);}
  frame=requestAnimationFrame(animate);
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',cancelPointer);canvas.removeEventListener('blur',cancelPointer);canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('webglcontextlost',lost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();canvas.remove();}
  return {setResult,setProgress,dispose,preview:key=>{if(input.preview(key))preview(key);},setPending:value=>input.setPending(value),setPaused:value=>{input.setPaused(value);if(value)cancelPointer();},setMotion:value=>{reduced=!value||matchMedia('(prefers-reduced-motion: reduce)').matches;},diagnostics:()=>({stage:stage.id,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,materials:materials.size,dpr:renderer.getPixelRatio()})};
}
