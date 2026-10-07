import * as THREE from 'three';
import {createPortalInput,quizTheme} from '../public/game-input.mjs';
export const GATE_COLORS=[0xe8b956,0x65b49d,0xa59bdd,0xe39783];
export function gatePosition(index){return [(index-1.5)*4.2,0,0];}
export function quizFrustum(width,height){const aspect=width/height,halfWidth=Math.max(10,4.1*aspect);return {left:-halfWidth,right:halfWidth,top:halfWidth/aspect,bottom:-halfWidth/aspect};}
export function mountQuiz({container,order,selected,acceptedAnswers=[],week=1,motion=true,onChoose,onPreview=()=>{},onError}){
  let renderer,disposed=false,frame,target=null,time=0,rewardAt=-100;
  const input=createPortalInput(order,selected),theme=quizTheme(week);
  let reduced=!motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{onError();return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(theme.sky);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Bốn cổng đáp án 3D. Dùng phím mũi tên để xem cổng, Enter để chọn, hoặc phím 1 đến 4. Nội dung từng đáp án ở ngay dưới.');container.append(canvas);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,100);camera.position.set(0,9,16);camera.lookAt(0,1,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x8da895,2.8));const light=new THREE.DirectionalLight(0xffedca,3);light.position.set(-8,14,9);scene.add(light);
  const geometries=new Set(),materials=new Set(),textures=new Set(),gates=[],hits=[];
  function mesh(geometry,color,x,y,z,parent=scene){geometries.add(geometry);const material=new THREE.MeshStandardMaterial({color,roughness:.8,flatShading:true});materials.add(material);const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);parent.add(object);return object;}
  mesh(new THREE.CylinderGeometry(10.2,9.2,1,32),theme.ground,0,-.7,0);
  mesh(new THREE.CylinderGeometry(10.7,9.5,.65,32),0xead8b0,0,-1.5,0);
  // Backdrop trees and clouds use repeated low-poly geometry without remote assets.
  for(const x of [-8.8,-4.5,4.5,8.8]){mesh(new THREE.CylinderGeometry(.12,.18,1.5,6),0x9e795a,x,.45,-3.3);mesh(new THREE.IcosahedronGeometry(1,0),theme.leaf,x,1.75,-3.3);}
  for(const x of [-6,6]){const cloud=mesh(new THREE.IcosahedronGeometry(1,1),0xfffdf2,x,3.1,-4.5);cloud.scale.set(1.9,.55,.7);}
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;mesh(new THREE.IcosahedronGeometry(.38,0),i%2?0xf4dc84:0x80af92,Math.cos(a)*9,-.05,Math.sin(a)*5);}
  order.forEach((key,i)=>{const [x]=gatePosition(i),group=new THREE.Group();group.position.x=x;scene.add(group);const color=GATE_COLORS[i];
    mesh(new THREE.BoxGeometry(3.45,.3,2.6),0xfff5d9,0,.02,0,group);
    const left=mesh(new THREE.BoxGeometry(.38,3.7,.5),color,-1.25,1.9,0,group),right=mesh(new THREE.BoxGeometry(.38,3.7,.5),color,1.25,1.9,0,group);
    const roof=mesh(new THREE.TorusGeometry(1.25,.2,6,18,Math.PI),color,0,3.7,0,group);
    const door=mesh(new THREE.PlaneGeometry(2.2,3.45),color,0,1.9,.05,group);door.material.transparent=true;door.material.opacity=.22;door.material.side=THREE.DoubleSide;
    for(const obj of [left,right,roof,door]){obj.userData.key=key;hits.push(obj);}
    const labelCanvas=document.createElement('canvas');labelCanvas.width=128;labelCanvas.height=128;const ctx=labelCanvas.getContext('2d');if(ctx){ctx.fillStyle='#fff8e6';ctx.beginPath();ctx.arc(64,64,53,0,Math.PI*2);ctx.fill();ctx.fillStyle='#325448';ctx.font='bold 70px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('ABCD'[i],64,68);const texture=new THREE.CanvasTexture(labelCanvas);textures.add(texture);const material=new THREE.SpriteMaterial({map:texture,depthTest:false});materials.add(material);const sprite=new THREE.Sprite(material);sprite.position.set(0,4.65,0);sprite.scale.set(1.1,1.1,1.1);group.add(sprite);}
    gates.push({key,group,door,color});
  });
  const avatar=new THREE.Group();avatar.position.set(0,0,4.1);scene.add(avatar);
  mesh(new THREE.CylinderGeometry(.48,.62,1.2,8),0x4b927c,0,1.05,0,avatar);
  mesh(new THREE.IcosahedronGeometry(.63,1),0xf4c7a1,0,2,0,avatar);
  mesh(new THREE.ConeGeometry(.72,.6,8),0x80ad67,0,2.65,0,avatar);
  for(const x of [-.22,.22]){mesh(new THREE.SphereGeometry(.075,8,8),0x364a42,x,2.06,.57,avatar);mesh(new THREE.BoxGeometry(.25,.45,.35),0x634c43,x,.24,0,avatar);}
  const sparks=[];for(let i=0;i<14;i++){const star=mesh(new THREE.OctahedronGeometry(.11),0xffda78,0,0,0);star.visible=false;sparks.push(star);}
  function setResult(key,accepted=[],animate=true){input.confirm(key);canvas.style.cursor='default';rewardAt=animate?time:-100;preview(null);const index=order.indexOf(key);if(index<0)return;target=new THREE.Vector3(gatePosition(index)[0],0,1.6);gates.forEach(g=>{const good=accepted.includes(g.key);g.door.material.color.set(good?0x7cc89a:g.key===key?0xe8bc7e:g.color);g.door.material.opacity=good?.6:g.key===key?.45:.22;});sparks.forEach(s=>s.visible=animate&&!reduced);}
  if(selected)setResult(selected,acceptedAnswers,false);
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  function preview(key){gates.forEach(g=>{g.group.scale.setScalar(g.key===key?1.025:1);g.door.material.emissive.set(g.key===key?0x314c2c:0x000000);g.door.material.emissiveIntensity=.3;});if(key)onPreview(key);}
  function choose(key){if(input.choose(key))onChoose(key);}
  function hitKey(e){const box=canvas.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(hits)[0]?.object.userData.key;}
  function pointerMove(e){if(input.state.paused||input.state.selected||input.state.pending)return;const key=hitKey(e);canvas.style.cursor=key?'pointer':'default';preview(key||null);if(key)input.preview(key);}
  function leave(){preview(null);}
  function pointerDown(e){canvas.focus({preventScroll:true});down=[e.clientX,e.clientY];}
  function pointerUp(e){const start=down;down=null;if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>10)return;const box=canvas.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(hits)[0];if(hit)choose(hit.object.userData.key);}
  function keydown(e){const action=input.key(e.key);if(!action)return;e.preventDefault();if(action.type==='preview')preview(action.key);else choose(action.key);}
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);Object.assign(camera,quizFrustum(w,h));camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function lost(e){e.preventDefault();dispose();onError();}
  canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('keydown',keydown);canvas.addEventListener('webglcontextlost',lost);
  let previous=performance.now();function animate(t){if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden||input.state.paused||t-previous<30)return;const dt=Math.min((t-previous)/1000,.05);previous=t;time+=dt;
    if(target){if(reduced)avatar.position.copy(target);else avatar.position.lerp(target,1-Math.exp(-dt*3));}avatar.position.y=reduced?0:Math.sin(time*3)*.055;
    sparks.forEach((s,i)=>{s.visible=!reduced&&time-rewardAt<3.5;const a=(reduced?0:time*.8)+i/14*Math.PI*2;s.position.set(avatar.position.x+Math.cos(a)*1.05,1.8+(i%4)*.38,avatar.position.z+Math.sin(a)*.8);if(!reduced)s.rotation.y=time;});renderer.render(scene,camera);}
  frame=requestAnimationFrame(animate);
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('webglcontextlost',lost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();canvas.remove();}
  return {setResult,dispose,preview:key=>{if(input.preview(key))preview(key);},setPending:value=>input.setPending(value),setPaused:value=>input.setPaused(value),setMotion:value=>{reduced=!value||matchMedia('(prefers-reduced-motion: reduce)').matches;},diagnostics:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
}
