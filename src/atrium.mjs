import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const viewThemes=Object.freeze({
  home:{sky:0xe0f0e9,leaf:0x79b68c,accent:0xf5cb77,center:'tree'},
  welcome:{sky:0xe0f0e9,leaf:0x79b68c,accent:0xf5cb77,center:'tree'},
  badges:{sky:0xf2eafb,leaf:0xa6b988,accent:0xe1b8ed,center:'badge'},
  practice:{sky:0xe5f2df,leaf:0x78ad80,accent:0xf9d67c,center:'garden'},
  parents:{sky:0xeee9df,leaf:0x95bba1,accent:0xf1c194,center:'book'},
  reports:{sky:0xe4eaf8,leaf:0x87acb2,accent:0x9fc1ec,center:'stars'},
  journal:{sky:0xe4f2ed,leaf:0x83b8a7,accent:0xb4d8ef,center:'fountain'},
  celebrate:{sky:0xf8edde,leaf:0x89b592,accent:0xffd16e,center:'badge'},
});
export function atriumFrustum(width,height){
  const aspect=Math.max(1,Number(width)||1)/Math.max(1,Number(height)||1);
  const halfHeight=Math.max(10.5,13/aspect);
  return {left:-halfHeight*aspect,right:halfHeight*aspect,top:halfHeight,bottom:-halfHeight};
}

export function mountAtrium({container,view='home',completed=0,onNavigate,onError,motion=true}){
  const theme=Object.hasOwn(viewThemes,view)?viewThemes[view]:viewThemes.home;
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}
  catch{onError?.('Thiết bị chưa mở được ngôi làng 3D. Các mục bên dưới vẫn sẵn sàng để con tiếp tục.');return null;}
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));
  renderer.setClearColor(theme.sky);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.24;
  const canvas=renderer.domElement;canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Làng Mầm Sáng 3D. Dùng mũi tên để chọn: hành trình, huy hiệu, góc cha mẹ, đánh giá, luyện tập. Nhấn Enter để đi vào.');
  canvas.style.touchAction='pan-y';container.appendChild(canvas);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-13,13,10.5,-10.5,.1,120);
  camera.position.set(15,22,26);camera.lookAt(0,2,0);camera.updateMatrixWorld();
  scene.add(new THREE.HemisphereLight(0xfffdf0,0x779f96,2.4));
  const sun=new THREE.DirectionalLight(0xffe7bf,3.1);sun.position.set(-12,22,15);scene.add(sun);
  const resources=new Set(),materials=new Map(),batches=new Map(),pickable=[],landmarks=[],moving=[];
  const geo={box:new THREE.BoxGeometry(1,1,1),ball:new THREE.IcosahedronGeometry(1,1),rock:new THREE.IcosahedronGeometry(1,0),cyl:new THREE.CylinderGeometry(1,1,1,10),cone:new THREE.ConeGeometry(1,1,10),ring:new THREE.TorusGeometry(1,.075,5,40)};
  Object.values(geo).forEach(g=>resources.add(g));
  function mat(color){if(!materials.has(color)){const m=new THREE.MeshStandardMaterial({color,roughness:.86,flatShading:true});materials.set(color,m);resources.add(m);}return materials.get(color);}
  function piece(g,color,pos,scale=[1,1,1],rotation=[0,0,0]){
    const copy=g.index?g.toNonIndexed():g.clone();
    copy.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale)));
    if(!batches.has(color))batches.set(color,[]);batches.get(color).push(copy);
  }
  function mesh(g,color,pos,scale=[1,1,1],parent=scene){const m=new THREE.Mesh(g,mat(color));m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;}
  function pole(x,z,h=1.2){piece(geo.cyl,0xb38b67,[x,h/2+.13,z],[.07,h,.07]);piece(geo.ball,0xfce5a6,[x,h+.18,z],[.12,.12,.12]);}
  function tree(x,z,s=1){piece(geo.cyl,0x9d785b,[x,s*.8,z],[.2*s,s*1.6,.2*s]);piece(geo.ball,theme.leaf,[x,s*2.25,z],[s,s*1.1,s]);piece(geo.ball,0xb5d09b,[x+s*.45,s*2.8,z+s*.1],[s*.65,s*.72,s*.65]);}
  function starGeometry(){const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.46:1;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:true,bevelSize:.08,bevelThickness:.06,bevelSegments:1,steps:1});resources.add(g);return g;}
  const star=starGeometry();
  function sign(text,x,y,z,color){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');if(!ctx)return null;
    ctx.fillStyle='#fffdf5';ctx.beginPath();ctx.roundRect(5,5,502,118,35);ctx.fill();ctx.strokeStyle='#'+color.toString(16).padStart(6,'0');ctx.lineWidth=6;ctx.stroke();ctx.fillStyle='#305849';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,65);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;resources.add(tex);const material=new THREE.SpriteMaterial({map:tex,depthTest:false,depthWrite:false});resources.add(material);
    const sprite=new THREE.Sprite(material);sprite.position.set(x,y,z);sprite.scale.set(3.3,.83,1);sprite.renderOrder=5;scene.add(sprite);return sprite;
  }
  function landmark(route,label,x,z,r,height,color){
    const proxyMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});resources.add(proxyMaterial);
    const proxy=new THREE.Mesh(geo.cyl,proxyMaterial);proxy.scale.set(r,height,r);proxy.position.set(x,height/2+.1,z);proxy.userData.route=route;scene.add(proxy);pickable.push(proxy);
    const labelSprite=sign(label,x,height+.65,z,color);if(labelSprite){labelSprite.userData.route=route;pickable.push(labelSprite);}
    const halo=mesh(geo.ring,color,[x,.22,z],[r*1.15,r*1.15,r*1.15]);halo.rotation.x=-Math.PI/2;halo.visible=false;
    landmarks.push({route,label,halo,sprite:labelSprite});
  }
  // Layered floating island, cut stone rim and a cream walking loop.
  piece(geo.cyl,0x9bc8a1,[0,-.2,0],[9.6,.65,9.6]);piece(geo.cyl,0xc6d9ad,[0,-.65,0],[9.3,.45,9.3]);
  piece(geo.cone,0xb6bfa4,[0,-2.7,0],[9.1,4.1,9.1],[0,0,Math.PI]);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;piece(geo.rock,i%2?0xddd1b5:0xc4c4a8,[Math.cos(a)*8.95,-.3,Math.sin(a)*8.95],[.7,.7,.55],[0,a,0]);}
  for(let i=0;i<30;i++){const a=i*Math.PI*2/30;piece(geo.cyl,0xf1e5c8,[Math.cos(a)*5.9,.16,Math.sin(a)*5.9],[.62,.13,.55]);}
  // Treehouse: trunk, angled supports, hexagonal room, leaf roof, balcony and rope ladder.
  const tx=-4.7,tz=-2.4;
  piece(geo.cyl,0x9c7756,[tx,2,tz],[.52,4,.52]);piece(geo.ball,theme.leaf,[tx-.8,5.3,tz],[1.9,1.7,1.7]);piece(geo.ball,0xb7d99c,[tx+1,5.9,tz-.45],[1.45,1.25,1.3]);
  piece(geo.cyl,0xf0dab2,[tx,3.1,tz+.3],[1.25,1.8,1.25]);piece(geo.cone,0x649b79,[tx,4.35,tz+.3],[1.65,1.3,1.65]);
  piece(geo.cyl,0xad835a,[tx,2.25,tz+.3],[1.75,.22,1.75]);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;piece(geo.cyl,0xb68d63,[tx+Math.cos(a)*1.6,2.7,tz+.3+Math.sin(a)*1.6],[.045,.85,.045]);}
  piece(geo.ring,0xe6c795,[tx,3.1,tz+.3],[1.6,1.6,1.6],[Math.PI/2,0,0]);
  piece(geo.box,0x62989a,[tx,3.4,tz+1.55],[.55,.62,.06]);piece(geo.box,0xffefba,[tx,2.95,tz+1.58],[.52,.17,.09]);
  for(const dx of[-.35,.35])piece(geo.cyl,0xe9cb97,[tx+dx,1.3,tz+1.8],[.045,2.45,.045],[.12,0,0]);
  for(let i=0;i<6;i++)piece(geo.box,0xc19a6c,[tx,.35+i*.35,tz+1.9-i*.04],[.8,.08,.14]);
  landmark('world','52 tuần',tx,tz,1.8,5.7,0x83b58e);
  // Library tower: layered sandstone, cap, door arch and rainbow book spines.
  const lx=4.3,lz=-3;
  piece(geo.cyl,0xe5cfac,[lx,2,lz],[1.5,3.8,1.5]);piece(geo.cyl,0xffefd0,[lx,3.9,lz],[1.7,.25,1.7]);piece(geo.cone,0x9fa9ce,[lx,4.7,lz],[1.9,1.45,1.9]);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;piece(geo.box,0x9ab9b3,[lx+Math.sin(a)*1.43,2.7,lz+Math.cos(a)*1.43],[.45,.9,.09],[0,a,0]);}
  piece(geo.box,0xa47858,[lx,1.1,lz+1.45],[.75,1.8,.12]);piece(geo.ball,0xffdb81,[lx+.23,1.1,lz+1.56],[.06,.06,.06]);
  for(let i=0;i<6;i++)piece(geo.box,[0xbbacd9,0xe6ba95,0x8caf99][i%3],[lx-.8+i*.29,.55,lz+2],[.24,.7+i%2*.2,.8],[0,0,(i-2)*.025]);
  landmark('parents','Góc cha mẹ',lx,lz,1.7,5.3,0xaba7d1);
  // Badge pavilion with authored star crest, columns, flowering garden.
  const bx=-4.8,bz=4;
  piece(geo.cyl,0xffead0,[bx,.35,bz],[1.9,.4,1.9]);
  for(const dx of[-1.2,1.2])piece(geo.cyl,0xddbb93,[bx+dx,1.55,bz],[.15,2.3,.15]);
  piece(geo.box,0xf2dbb6,[bx,2.85,bz],[3.1,.28,.7]);piece(star,0xf3c966,[bx,2.95,bz-.04],[.75,.75,.75]);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;piece(geo.cyl,0x79a884,[bx+Math.cos(a)*1.9,.55,bz+Math.sin(a)*1.9],[.04,.7,.04]);piece(geo.ball,[0xe1b8e6,0xf5b1a1,0xf4d685][i%3],[bx+Math.cos(a)*1.9,.92,bz+Math.sin(a)*1.9],[.22,.18,.22]);}
  landmark('badges','Huy hiệu',bx,bz,1.8,3.8,0xd6a6dd);
  // Report observatory: domed lookout and clearly angled telescope.
  const rx=4.8,rz=3.3;
  piece(geo.cyl,0xefd7b1,[rx,1,rz],[1.5,1.8,1.5]);piece(geo.ball,0x98b9d1,[rx,2.05,rz],[1.6,1.05,1.6]);piece(geo.box,0x305c76,[rx,2.4,rz+.85],[.34,1.18,.2],[.45,0,0]);
  piece(geo.cyl,0xb69272,[rx,2.9,rz],[.1,1.5,.1]);piece(geo.cyl,0x7993aa,[rx,3.6,rz+.3],[.26,1.6,.26],[Math.PI/2+.38,0,-.12]);piece(geo.cyl,0xffe7ad,[rx,3.85,rz+1.1],[.34,.13,.34],[Math.PI/2+.38,0,-.12]);
  landmark('reports','Đánh giá',rx,rz,1.8,4.2,0x90b5de);
  // Practice courtyard behind the village: curved gateway, seedling beds.
  const px=.1,pz=-6.5;
  piece(geo.ring,0xf5d796,[px,1.65,pz],[1.25,1.5,1],[0,0,0]);
  for(const dx of[-1.15,1.15])piece(geo.cyl,0xb99967,[px+dx,.75,pz],[.12,1.5,.12]);
  for(let i=0;i<4;i++){piece(geo.box,0x99775c,[px-1.4+i*.9,.2,pz+1],[.66,.28,.85]);piece(geo.cyl,0x689a72,[px-1.4+i*.9,.65,pz+1],[.045,.65,.045]);piece(geo.ball,0x92bf84,[px-1.6+i*.9,.85,pz+1],[.24,.1,.15]);}
  landmark('practice','Luyện tập',px,pz,1.8,3.4,0xcda86b);
  // A low wooden bridge with rope rails connects the front garden and square.
  for(let i=0;i<7;i++)piece(geo.box,0xcfaa78,[-.6+i*.25,.31,3.8],[.23,.12,1.8]);
  for(const z of[2.95,4.65]){for(const x of[-.8,1.1])pole(x,z,.8);piece(geo.box,0xe4c69c,[.15,1.08,z],[1.9,.07,.07]);}
  // View-specific centerpiece; all routes have distinct silhouettes, not only recoloring.
  const cx=0,cz=-.9;
  piece(geo.cyl,0xf3e4c8,[cx,.3,cz],[1.8,.35,1.8]);
  if(theme.center==='tree'||theme.center==='garden'){tree(cx,cz,1.45);for(let i=0;i<5;i++){const a=i*1.3;piece(geo.ball,theme.accent,[Math.cos(a)*1.55,.42,cz+Math.sin(a)*1.55],[.22,.27,.22]);}}
  else if(theme.center==='book'){
    for(let i=0;i<3;i++)piece(geo.box,[0xb2a5cc,0xd8b992,0x96b4a5][i],[cx,.6+i*.32,cz],[2.6,.27,1.6],[0,i*.1,0]);
    piece(geo.box,0xfff6da,[cx-.58,1.55,cz],[1.15,.18,1.55],[0,0,-.22]);piece(geo.box,0xfff6da,[cx+.58,1.55,cz],[1.15,.18,1.55],[0,0,.22]);
  }else if(theme.center==='fountain'){
    piece(geo.cyl,0xd2be9c,[cx,.63,cz],[1.4,.4,1.4]);piece(geo.cyl,0x9acdcf,[cx,.87,cz],[1.22,.1,1.22]);piece(geo.cyl,0xe9d3b0,[cx,1.15,cz],[.18,.85,.18]);piece(geo.cyl,0xa9dce2,[cx,1.65,cz],[.65,.18,.65]);
    const drop=mesh(geo.ball,0xc9eced,[cx,2.3,cz],[.22,.35,.22]);moving.push({object:drop,base:2.3,phase:0,type:'float'});
  }else if(theme.center==='stars'){
    piece(geo.cyl,0xb8c7de,[cx,1.05,cz],[.23,1.3,.23]);
    for(let i=0;i<3;i++){const ring=mesh(geo.ring,0xeacb88,[cx,2.5,cz],[1.45,1.45,1.45]);ring.rotation.set(i*.65,.5+i*.6,.3);moving.push({object:ring,type:'ring',phase:i});}
    const globe=mesh(geo.ball,0xa7c1df,[cx,2.5,cz],[.8,.8,.8]);moving.push({object:globe,base:2.5,phase:0,type:'float'});
  }else{
    piece(geo.cyl,0xf2ce86,[cx,1,cz],[.7,1.2,.7]);const badge=mesh(star,theme.accent,[cx,2.3,cz],[1.05,1.05,1.05]);moving.push({object:badge,base:2.3,phase:0,type:'float'});
    const earned=Math.min(12,Math.max(0,Math.floor(completed)));for(let i=0;i<earned;i++){const a=i*Math.PI*2/Math.max(1,earned);piece(star,0xffe29a,[Math.cos(a)*1.55,.75,cz+Math.sin(a)*1.55],[.2,.2,.2],[0,a,0]);}
  }
  // Character with cape, backpack, articulated arms, leaf hat and a cheerful face.
  const mascot=new THREE.Group();mascot.position.set(0,.25,2.1);scene.add(mascot);
  mesh(geo.cyl,0x498974,[0,.72,0],[.36,.85,.3],mascot);mesh(geo.ball,0xffd9b2,[0,1.45,0],[.48,.49,.44],mascot);
  mesh(geo.box,0xe6c386,[0,.76,-.32],[.48,.64,.22],mascot);mesh(geo.cone,0x7aac86,[0,1.91,0],[.57,.38,.55],mascot);
  const leaf=mesh(geo.ball,0x94c078,[.24,2.14,0],[.29,.085,.17],mascot);leaf.rotation.z=.3;
  for(const dx of[-.19,.19]){mesh(geo.ball,0x36534a,[dx,1.49,.4],[.045,.065,.04],mascot);mesh(geo.ball,0xf5b8a1,[dx*1.65,1.36,.33],[.085,.035,.035],mascot);mesh(geo.ball,0xc99462,[dx,.15,.06],[.2,.15,.29],mascot);}
  const smile=mesh(geo.ring,0x8a6048,[0,1.32,.415],[.1,.07,.07],mascot);smile.rotation.x=.2;
  for(const dx of[-.48,.48]){mesh(geo.cyl,0x4f977c,[dx,.88,0],[.13,.5,.13],mascot);mesh(geo.ball,0xffd9b2,[dx,.6,.04],[.13,.15,.13],mascot);}
  // Midground bushes, lanterns and a few clouds frame rather than cover decisions.
  for(let i=0;i<12;i++){const a=i*2.399;const r=7.9;piece(geo.ball,i%2?0x83b38f:0xa9c694,[Math.cos(a)*r,.45,Math.sin(a)*r],[.55,.6,.55]);}
  for(const [x,z]of[[-2,4.8],[2.8,-.7],[-2.8,-5.8]]){pole(x,z,1.35);piece(geo.box,0xffefb6,[x,1.6,z],[.28,.35,.28]);piece(geo.cone,0x77917a,[x,1.85,z],[.28,.2,.28]);}
  for(let i=0;i<4;i++){const cloud=new THREE.Group();for(let c=0;c<3;c++)mesh(geo.ball,0xf8fbf2,[c*.65,Math.sin(c)*.15,0],[.8,.4,.55],cloud);cloud.position.set(-8+i*5,-2.3-i%2*.9,6+i%2*3);scene.add(cloud);moving.push({object:cloud,base:cloud.position.y,phase:i,type:'float'});}
  for(const [color,parts]of batches){const merged=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(merged){resources.add(merged);scene.add(new THREE.Mesh(merged,mat(color)));}}
  let disposed=false,paused=false,allowMotion=!!motion&&!reduced,dirty=true,raf=0,last=0,elapsed=0,selected=-1,pointerStart=null;
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function select(index){selected=index;landmarks.forEach((l,i)=>{l.halo.visible=i===index;if(l.sprite)l.sprite.scale.set(i===index?3.52:3.3,i===index?.885:.83,1);});canvas.style.cursor=index>=0?'pointer':'default';dirty=true;}
  function hit(e){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return -1;pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const found=ray.intersectObjects(pickable,false)[0];return found?landmarks.findIndex(l=>l.route===found.object.userData.route):-1;}
  const hover=e=>{if(paused)return;select(hit(e));};const down=e=>{if(paused)return;canvas.focus({preventScroll:true});pointerStart=[e.clientX,e.clientY];};
  const up=e=>{if(paused||!pointerStart)return;const travel=Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1]);pointerStart=null;if(travel>9)return;const index=hit(e);select(index);if(index>=0)onNavigate?.(landmarks[index].route);};
  const leave=()=>select(-1);
  const key=e=>{if(paused)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const direction=['ArrowLeft','ArrowUp'].includes(e.key)?-1:1;select(selected<0?0:(selected+direction+landmarks.length)%landmarks.length);canvas.setAttribute('aria-label',`${landmarks[selected].label}. Nhấn Enter để đi vào, phím mũi tên để chọn mục khác.`);}else if(e.key==='Enter'){e.preventDefault();if(selected<0)select(0);onNavigate?.(landmarks[selected].route);}};
  canvas.addEventListener('pointermove',hover);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('keydown',key);
  function resize(){if(disposed)return;const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);Object.assign(camera,atriumFrustum(width,height));camera.updateProjectionMatrix();dirty=true;}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const lost=e=>{e.preventDefault();dispose();onError?.('Ngôi làng 3D đang tạm nghỉ. Con có thể dùng các nút bên dưới để tiếp tục.');};canvas.addEventListener('webglcontextlost',lost);
  function frame(time){if(disposed)return;raf=requestAnimationFrame(frame);if(document.hidden||paused){last=time;return;}if(time-last<1000/30)return;const dt=Math.min((time-last)/1000,.05);last=time;
    // Ambient welcome lasts eight seconds, then settles; input still highlights landmarks.
    if(allowMotion&&elapsed<8){elapsed=Math.min(8,elapsed+dt);const fade=Math.min(1,(8-elapsed)/1.5);mascot.rotation.y=Math.sin(elapsed*.8)*.08*fade;
      moving.forEach(m=>{if(m.type==='float')m.object.position.y=m.base+Math.sin(elapsed*1.15+m.phase)*.12*fade;else m.object.rotation.y+=dt*.18*fade;});dirty=true;}
    if(dirty){renderer.render(scene,camera);dirty=false;}
  }
  raf=requestAnimationFrame(frame);
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointermove',hover);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',lost);resources.forEach(r=>r.dispose());renderer.dispose();canvas.remove();}
  function setMotion(enabled){allowMotion=!!enabled&&!reduced;if(!allowMotion){mascot.rotation.y=0;moving.forEach(m=>{if(m.type==='float')m.object.position.y=m.base;});}dirty=true;}
  return {dispose,setMotion,setPaused(value){paused=!!value;dirty=true;},diagnostics(){return {view,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,materials:materials.size,postPasses:0,shadowLights:0,dpr:renderer.getPixelRatio(),motion:allowMotion,paused,disposed};}};
}
