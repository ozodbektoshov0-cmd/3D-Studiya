/* ---- O’yin rejimi: import qilingan mashinani xaritada haydash ----
   Mashina sozlamalari (eshik, chiroq, rul, spidometr…) “Mashina” panelidagi CarFX orqali ishlaydi.
   Xaritalar protsedural: Shahar (svetofor, trafik, piyodalar), Cho’l yo’li, Poyga trassasi.
   Boshqaruv: W/S/A/D yoki strelkalar, Probel — qo’l tormozi, H — chiroq, Q/E — povorotnik, C — kamera, N — tun, Esc — chiqish. */
(function(){
'use strict';
const V3=THREE.Vector3,UPV=new V3(0,1,0),TAU=Math.PI*2;
const T3=`O’yin|Game|Игра
O’yinni boshlash|Start game|Начать игру
Xarita tanlang|Choose a map|Выберите карту
Avval mashina modelini import qiling (Fayl → Ochish)|Import a car model first (File → Open)|Сначала импортируйте модель машины (Файл → Открыть)
Mashinani “Mashina” panelida sozlab oling (eshik, chiroq, rul…), so’ng xaritani tanlang. Mashina o’zingiz import qilgan model bo’ladi.|Set the car up in the “Car” panel (doors, lights, steering wheel…), then choose a map. The car is the model you imported.|Настройте машину в панели «Машина» (двери, свет, руль…), затем выберите карту. Это будет импортированная вами модель.
Shahar|City|Город
Svetoforlar, trafik, piyodalar, binolar|Traffic lights, traffic, pedestrians, buildings|Светофоры, транспорт, пешеходы, здания
Cho’l yo’li|Desert road|Пустынная дорога
Uzun trassa, kaktuslar, qarshi tomondan kelayotgan mashinalar|Long highway, cacti, oncoming cars|Длинная трасса, кактусы, встречные машины
Poyga trassasi|Race track|Гоночная трасса
Egri-bugri trassa, raqib mashinalar, tomoshabinlar|Winding circuit, rival cars, spectators|Извилистая трасса, соперники, зрители
km/soat|km/h|км/ч
Chiqish|Exit|Выход
Kamera|Camera|Камера
Tun / kun|Night / day|Ночь / день
Ovoz|Sound|Звук
Yordam|Help|Помощь
Gaz|Gas|Газ
Tormoz|Brake|Тормоз
W / ↑ gaz · S / ↓ tormoz va orqaga · A D / ← → rul · Probel qo’l tormozi\\nH chiroq · Q E povorotnik · Z avariya · Y artgich · C kamera · N tun/kun\\n1–4 eshiklar · 5 kapot · 6 bagaj · 7 lyuk · 8 oynalar · M ovoz · R joyiga qaytarish · Esc chiqish|W / ↑ gas · S / ↓ brake and reverse · A D / ← → steer · Space handbrake\\nH lights · Q E turn signals · Z hazard · Y wipers · C camera · N night/day\\n1–4 doors · 5 hood · 6 trunk · 7 sunroof · 8 windows · M sound · R reset position · Esc exit|W / ↑ газ · S / ↓ тормоз и назад · A D / ← → руль · Пробел ручник\\nH свет · Q E поворотники · Z аварийка · Y дворники · C камера · N ночь/день\\n1–4 двери · 5 капот · 6 багажник · 7 люк · 8 окна · M звук · R вернуть на место · Esc выход`;
window.I18N&&I18N.add&&I18N.add(T3);
const $q=s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const wrap=(s,l)=>((s%l)+l)%l;
let G=null;                                   // faol o’yin holati

/* ---------- materiallar va teksturalar ---------- */
const MAT={};
const M=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
function facadeTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#8d949c';g.fillRect(0,0,128,128);
 for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=Math.random()<.35?'#ffe9a8':'#33414f';g.fillRect(x*32+6,y*32+7,20,18)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function roadTex(edge){const c=document.createElement('canvas');c.width=64;c.height=64;const g=c.getContext('2d');g.fillStyle='#34363a';g.fillRect(0,0,64,64);
 g.fillStyle='#e8e8e8';g.fillRect(30,6,4,28);if(edge){g.fillRect(3,0,2,64);g.fillRect(59,0,2,64)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function boxGeo(w,h,d,tile){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;
 for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;let u=uv.getX(i),v=uv.getY(i);
  if(f<2){u*=d/tile;v*=h/tile}else if(f<4){u=.03;v=.03}else{u*=w/tile;v*=h/tile}uv.setXY(i,u,v)}return g}
function add(parent,geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m}

/* ---------- yo’l chizig’i (lane) ---------- */
class Lane{
 constructor(pts,closed,off){this.p=pts;this.closed=closed;this.off=off||0;this.cum=[0];const n=pts.length,m=closed?n:n-1;
  for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n];this.cum.push(this.cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1]))}
  this.len=this.cum[m];this.cars=[];this.cross=[]}
 at(s,off){s=wrap(s,this.len);let lo=0,hi=this.cum.length-2;while(lo<hi){const mid=(lo+hi+1)>>1;if(this.cum[mid]<=s)lo=mid;else hi=mid-1}
  const a=this.p[lo],b=this.p[(lo+1)%this.p.length],sl=this.cum[lo+1]-this.cum[lo]||1,t=(s-this.cum[lo])/sl,dx=(b[0]-a[0])/sl,dz=(b[1]-a[1])/sl,o=off==null?this.off:off;
  return{x:a[0]+(b[0]-a[0])*t-dz*o,z:a[1]+(b[1]-a[1])*t+dx*o,h:Math.atan2(dx,dz)}}}
function nearest(pts,x,z){let best=1e12,bx=0,bz=0,bi=0;const n=pts.length;for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n],dx=b[0]-a[0],dz=b[1]-a[1];
  let t=((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1);t=Math.max(0,Math.min(1,t));const px=a[0]+dx*t,pz=a[1]+dz*t,d=(x-px)*(x-px)+(z-pz)*(z-pz);if(d<best){best=d;bx=px;bz=pz;bi=i}}
 return{d:Math.sqrt(best),x:bx,z:bz,i:bi}}
function roadStrip(parent,pts,w,closed,mat,y){const n=pts.length,pos=[],uv=[],idx=[];let s=0;
 const cnt=closed?n+1:n;
 for(let i=0;i<cnt;i++){const a=pts[i%n],pa=pts[(i-1+n)%n],nx=pts[(i+1)%n];let dx,dz;
  if(!closed&&i==0){dx=nx[0]-a[0];dz=nx[1]-a[1]}else if(!closed&&i==n-1){dx=a[0]-pa[0];dz=a[1]-pa[1]}else{dx=nx[0]-pa[0];dz=nx[1]-pa[1]}
  const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;if(i>0){const q=pts[(i-1)%n];s+=Math.hypot(a[0]-q[0],a[1]-q[1])}
  pos.push(a[0]+dz*w/2,y,a[1]-dx*w/2,a[0]-dz*w/2,y,a[1]+dx*w/2);uv.push(0,s/16,1,s/16);
  if(i<cnt-1){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const m=new THREE.Mesh(g,mat);parent.add(m);return m}

let shTex=null;
function shadow(w,l){if(!shTex){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);shTex=new THREE.CanvasTexture(c)}
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.04;m.renderOrder=1;return m}
function glowPoints(W,pos,size){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,230,150,1)');r.addColorStop(.35,'rgba(255,200,90,.5)');r.addColorStop(1,'rgba(255,200,90,0)');x.fillStyle=r;x.fillRect(0,0,64,64);
 const m=new THREE.PointsMaterial({size,map:new THREE.CanvasTexture(c),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});const pt=new THREE.Points(g,m);W.g.add(pt);W.lamps=m}
/* ---------- odamlar va mashinalar (NPC) ---------- */
const NPC_CARS=[0xc0392b,0x2e86c1,0xf1c40f,0xecf0f1,0x27ae60,0x7f8c8d,0x8e44ad,0xe67e22,0x1c2833];
let carMats=null;
function npcCar(color){
 const g=new THREE.Group(),b=M(color),dk=M(0x15191d),gl=M(0x9ecbe8);
 add(g,new THREE.BoxGeometry(1.8,.65,4.2),b,0,.62,0);add(g,new THREE.BoxGeometry(1.6,.55,2.2),gl,0,1.18,-.2);add(g,new THREE.BoxGeometry(1.55,.06,1.9),b,0,1.48,-.2);
 [[-.9,1.4],[.9,1.4],[-.9,-1.4],[.9,-1.4]].forEach(p=>{const w=add(g,new THREE.CylinderGeometry(.36,.36,.26,12),dk,p[0],.36,p[1]);w.rotation.z=Math.PI/2});
 const hl=new THREE.MeshBasicMaterial({color:0xfff2c0}),tl=new THREE.MeshBasicMaterial({color:0xff2a1a});
 [-.6,.6].forEach(x=>{add(g,new THREE.BoxGeometry(.4,.18,.06),hl,x,.7,2.12);add(g,new THREE.BoxGeometry(.4,.18,.06),tl,x,.7,-2.12)});
 g.add(shadow(2.6,5.4));return g}
function npcPed(){
 const g=new THREE.Group(),cl=M(pick([0xd35400,0x2980b9,0x27ae60,0x8e44ad,0xc0392b,0x16a085,0x34495e,0xf39c12])),sk=M(pick([0xf1c27d,0xe0ac69,0x8d5524,0xc68642])),pn=M(pick([0x2c3e50,0x1b2631,0x4a4a4a,0x6b4f2a]));
 add(g,new THREE.BoxGeometry(.5,.7,.28),cl,0,1.2,0);add(g,new THREE.SphereGeometry(.15,10,8),sk,0,1.7,0);
 const legs=[-.12,.12].map(x=>{const h=new THREE.Group();h.position.set(x,.85,0);g.add(h);add(h,new THREE.BoxGeometry(.2,.85,.22),pn,0,-.42,0);return h});
 const arms=[-.33,.33].map(x=>{const h=new THREE.Group();h.position.set(x,1.52,0);g.add(h);add(h,new THREE.BoxGeometry(.14,.6,.16),cl,0,-.28,0);return h});
 g.userData={legs,arms};return g}

/* ---------- xaritalar ---------- */
function newWorld(name){return{name,g:new THREE.Group(),lanes:[],peds:[],box:[],circ:[],spawn:{x:0,z:0,h:0},bound:null,loop:null,roadW:0,lights:null,sky:0x87b6e8,fog:[120,520]}}
function ground(W,col,size){const m=add(W.g,new THREE.PlaneGeometry(size,size),M(col),0,-.02,0);m.rotation.x=-Math.PI/2}
function tree(W,x,z){const g=new THREE.Group();add(g,new THREE.CylinderGeometry(.18,.25,2.4,6),M(0x6b4a2b),0,1.2,0);add(g,new THREE.SphereGeometry(1.5,8,6),M(0x2e8b3e),0,3.4,0);g.position.set(x,0,z);W.g.add(g);W.circ.push([x,z,.5])}

function buildCity(){
 const W=newWorld('Shahar'),B=80,K=3,ext=(K+1)*B-20,rt=roadTex(true),ft=facadeTex();W.bound=ext+20;
 ground(W,0x5a6b4a,1400);
 const rm=new THREE.MeshLambertMaterial({map:rt}),sw=M(0x80868c);
 for(let i=-K;i<=K;i++){
  roadStrip(W.g,[[i*B,-ext],[i*B,ext]],14,false,rm,.01);roadStrip(W.g,[[-ext,i*B],[ext,i*B]],14,false,rm,.012);
 }
 // yo’l chiziqlari (qatnov)
 const axes=[];
 for(let i=-K;i<=K;i++){
  const cz=[];for(let j=-K;j<=K;j++)cz.push(j*B);
  [[ [i*B,-ext],[i*B,ext],'z',cz],[[i*B,ext],[i*B,-ext],'z',cz.slice().reverse()],[[-ext,i*B],[ext,i*B],'x',cz],[[ext,i*B],[-ext,i*B],'x',cz.slice().reverse()]].forEach(([a,b,ax,cr])=>{
   const ln=new Lane([a,b],false,3.5);ln.axis=ax;ln.cross=cr.map(v=>Math.abs(v-(ax=='z'?a[1]:a[0])));W.lanes.push(ln)});
 }
 // binolar
 const cols=[0xb9c2cc,0xc9b79c,0xa7b5a0,0xd2d2d2,0x9fb0c4,0xc7a9a0],mats=cols.map(c=>new THREE.MeshLambertMaterial({color:c,map:ft}));
 for(let i=-K-1;i<=K;i++)for(let j=-K-1;j<=K;j++){
  const cx=i*B+B/2,cz=j*B+B/2,half=B/2-7-3;       // yo’l yarmi 7 + yo’lak 3
  add(W.g,new THREE.BoxGeometry(2*(half+3),.3,2*(half+3)),sw,cx,.15,cz);
  if(i==0&&j==0&&false)continue;
  const n=Math.random()<.5?1:2;
  for(let k=0;k<n;k++){
   const w=n==1?half*2-rnd(0,8):half-1.5,d=half*2-rnd(0,8),h=rnd(10,55),ox=n==1?0:(k?half/2+.5:-half/2-.5),
    x=cx+ox,z=cz+rnd(-2,2);
   const m=add(W.g,boxGeo(w,h,d,8),pick(mats),x,h/2+.3,z);
   W.box.push([x-w/2,x+w/2,z-d/2,z+d/2]);
  }
  if(Math.random()<.5)tree(W,cx+pick([-1,1])*(half+1.8),cz+rnd(-half,half));
 }
 // svetoforlar
 const gm=new THREE.MeshBasicMaterial({color:0x00ff3a}),gx=new THREE.MeshBasicMaterial({color:0xff2a1a});W.lights={z:gm,x:gx};
 for(let i=-K;i<=K;i++)for(let j=-K;j<=K;j++)[[1,1,'z'],[-1,-1,'z'],[1,-1,'x'],[-1,1,'x']].forEach(([sx,sz,ax])=>{
  const g=new THREE.Group();add(g,new THREE.CylinderGeometry(.1,.1,4.2,6),M(0x333333),0,2.1,0);add(g,new THREE.BoxGeometry(.45,.45,.45),M(0x111111),0,4.3,0);
  add(g,new THREE.SphereGeometry(.2,8,6),ax=='z'?gm:gx,0,4.3,.26);add(g,new THREE.SphereGeometry(.2,8,6),ax=='z'?gm:gx,0,4.3,-.26);
  g.position.set(i*B+sx*8.4,0,j*B+sz*8.4);W.g.add(g)});
 // piyodalar (yo’lak bo’ylab)
 for(let i=-K;i<=K;i++)for(const ax of ['z','x'])for(const side of [-1,1]){
  const pts=ax=='z'?[[i*B+side*9.5,-ext],[i*B+side*9.5,ext]]:[[-ext,i*B+side*9.5],[ext,i*B+side*9.5]];
  const ln=new Lane(pts,false,0);for(let n=0;n<3;n++)W.peds.push({lane:ln,s:rnd(0,ln.len),dir:Math.random()<.5?1:-1,v:rnd(1,1.7),ph:rnd(0,6),k:0})}
 W.mini=[];for(let i=-K;i<=K;i++){W.mini.push([i*B,-ext,i*B,ext],[-ext,i*B,ext,i*B])}
 const lp=[],pm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.1,6,5),M(0x444444),400),mt=new THREE.Matrix4();let li=0;
 for(let i=-K;i<=K;i++)for(let j=-K-1;j<=K;j++)for(const sd of [-1,1]){const x=i*B+sd*8.6,z=j*B+B/2;lp.push(x,6,z);mt.makeTranslation(x,3,z);pm.setMatrixAt(li++,mt)}
 pm.count=li;W.g.add(pm);glowPoints(W,lp,9);
 W.spawn={x:3.5,z:-40,h:0};
 // trafik
 W.trafficN=26;return W}

function ringWorld(name,pts,roadW,opt){
 const W=newWorld(name);W.loop=pts;W.roadW=roadW;W.sky=opt.sky;W.fog=opt.fog||[150,700];
 ground(W,opt.ground,2600);
 const rm=new THREE.MeshLambertMaterial({map:roadTex(true)});roadStrip(W.g,pts,roadW,true,rm,.02);
 const l1=new Lane(pts,true,roadW*.2),l2=new Lane(pts.slice().reverse(),true,roadW*.2);
 if(opt.twoWay){W.lanes.push(l1,l2)}else{W.lanes.push(new Lane(pts,true,roadW*.18),new Lane(pts,true,-roadW*.18))}
 const a=pts[0],b=pts[1],h=Math.atan2(b[0]-a[0],b[1]-a[1]);W.spawn={x:a[0]-Math.cos(h)*roadW*.2*0,z:a[1],h:h};
 W.spawn={x:a[0]+Math.cos(h)*roadW*.22,z:a[1]-Math.sin(h)*roadW*.22,h};
 return W}
function buildDesert(){
 const pts=[];for(let i=0;i<180;i++){const t=i/180*TAU;pts.push([Math.cos(t)*320+25*Math.sin(3*t)*Math.cos(t),Math.sin(t)*210+30*Math.sin(2*t+1)])}
 const W=ringWorld('Cho’l yo’li',pts,16,{ground:0xd8b878,sky:0xf2c88a,twoWay:true,fog:[200,900]});
 const rock=M(0x8a7a66),cac=M(0x3f7d3a);
 for(let n=0;n<130;n++){const x=rnd(-560,560),z=rnd(-420,420);if(nearest(pts,x,z).d<18)continue;
  if(Math.random()<.5){const r=rnd(.8,3);const m=add(W.g,new THREE.DodecahedronGeometry(r,0),rock,x,r*.5,z);m.rotation.set(rnd(0,3),rnd(0,3),0);W.circ.push([x,z,r])}
  else{const g=new THREE.Group(),h=rnd(2.5,5);add(g,new THREE.CylinderGeometry(.35,.4,h,8),cac,0,h/2,0);const ar=add(g,new THREE.CylinderGeometry(.2,.2,1.2,6),cac,.7,h*.6,0);ar.rotation.z=Math.PI/2.4;const al=add(g,new THREE.CylinderGeometry(.2,.2,1.1,6),cac,-.7,h*.5,0);al.rotation.z=-Math.PI/2.4;g.position.set(x,0,z);W.g.add(g);W.circ.push([x,z,.6])}}
 // yo’l chetida yuruvchi odamlar
 const ln=new Lane(pts,true,0);for(let n=0;n<14;n++){const side=pick([-1,1]);W.peds.push({lane:new Lane(pts,true,side*(8+rnd(2,6))),s:rnd(0,ln.len),dir:pick([1,-1]),v:rnd(.8,1.4),ph:rnd(0,6),k:0})}
 W.trafficN=14;return W}
function buildRace(){
 const pts=[];const N=240;for(let i=0;i<N;i++){const t=i/N*TAU,r=190+45*Math.sin(2*t)+25*Math.sin(3*t+1.2)+10*Math.sin(5*t);pts.push([Math.cos(t)*r*1.35,Math.sin(t)*r])}
 const W=ringWorld('Poyga trassasi',pts,20,{ground:0x4f8a4a,sky:0x9fd0f5,twoWay:false});
 // to’siqlar (instance)
 const n=pts.length,inst=new THREE.InstancedMesh(new THREE.BoxGeometry(.6,.9,4),new THREE.MeshLambertMaterial({color:0xffffff}),n*2),mtx=new THREE.Matrix4(),q=new THREE.Quaternion(),col=new THREE.Color();
 let k=0;for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);[1,-1].forEach(sd=>{
   const ox=-dz/l*sd*(W.roadW/2+1.2),oz=dx/l*sd*(W.roadW/2+1.2);q.setFromAxisAngle(UPV,Math.atan2(dx,dz));mtx.compose(new V3((a[0]+b[0])/2+ox,.45,(a[1]+b[1])/2+oz),q,new V3(1,1,l/4+.05));inst.setMatrixAt(k,mtx);inst.setColorAt(k,col.set(i%2?0xe22a1c:0xf4f4f4));k++})}
 W.g.add(inst);
 // start chizig’i va arka
 const a=pts[0],b=pts[1],hh=Math.atan2(b[0]-a[0],b[1]-a[1]);const gate=new THREE.Group();
 add(gate,new THREE.BoxGeometry(W.roadW,.04,3),new THREE.MeshLambertMaterial({color:0xf5f5f5}),0,.05,0);
 [-1,1].forEach(s=>add(gate,new THREE.BoxGeometry(.6,7,.6),M(0x333333),s*(W.roadW/2+1.5),3.5,0));add(gate,new THREE.BoxGeometry(W.roadW+4,1.4,.6),M(0xd62828),0,7,0);
 gate.position.set(a[0],0,a[1]);gate.rotation.y=hh;W.g.add(gate);
 // tomoshabinlar
 for(let n2=0;n2<90;n2++){const i=Math.floor(rnd(0,pts.length)),p=pts[i],q2=pts[(i+1)%pts.length],dx=q2[0]-p[0],dz=q2[1]-p[1],l=Math.hypot(dx,dz),sd=pick([-1,1]),o=W.roadW/2+rnd(3,9);
  W.peds.push({fixed:true,x:p[0]-dz/l*sd*o,z:p[1]+dx/l*sd*o,h:Math.atan2(dz/l*sd,-dx/l*sd),ph:rnd(0,6),k:0,v:0})}
 for(let n2=0;n2<40;n2++){const i=Math.floor(rnd(0,pts.length)),p=pts[i],q2=pts[(i+1)%pts.length],l=Math.hypot(q2[0]-p[0],q2[1]-p[1]),dx=(q2[0]-p[0])/l,dz=(q2[1]-p[1])/l,sd=pick([-1,1]),o=W.roadW/2+rnd(14,60);
  tree(W,p[0]-dz*sd*o,p[1]+dx*sd*o)}
 W.trafficN=11;W.race=true;return W}
const MAPS=[{id:'city',ico:'🏙️',name:'Shahar',desc:'Svetoforlar, trafik, piyodalar, binolar',build:buildCity},
 {id:'desert',ico:'🏜️',name:'Cho’l yo’li',desc:'Uzun trassa, kaktuslar, qarshi tomondan kelayotgan mashinalar',build:buildDesert},
 {id:'race',ico:'🏁',name:'Poyga trassasi',desc:'Egri-bugri trassa, raqib mashinalar, tomoshabinlar',build:buildRace}];

/* ---------- mashinani tayyorlash ---------- */
const wheelRe=/(^|[^a-z])(wheel|whl|tyre|tire)/i,badRe=/dummy|_dam|_lo\b|_vlo|lod\d|hub|brake/i;
function prepare(){
 const CX=window.CarFX,ms=meshes().filter(m=>!m.userData.dummy);if(!ms.length)return null;
 const sv={p:root.position.clone(),q:root.quaternion.clone(),s:root.scale.clone(),par:root.parent};
 root.position.set(0,0,0);root.quaternion.identity();root.scale.set(1,1,1);root.updateMatrixWorld(true);
 let n=0;if(CX){try{if(!Object.keys(CX.CAR.map).length)CX.detect();CX.buildRigs();n=Object.keys(CX.CAR.map).length}catch(e){}}
 const bb=new THREE.Box3();ms.filter(m=>m.visible).forEach(m=>bb.union(new THREE.Box3().setFromObject(m)));
 const sz=bb.getSize(new V3()),C=bb.getCenter(new V3()),F=CX?CX.CAR.F.clone():(sz.x>sz.z?new V3(1,0,0):new V3(0,0,1)),Rv=F.clone().cross(UPV).normalize();
 const len=Math.abs(sz.x*F.x)+Math.abs(sz.z*F.z)||4,scale=len>=3&&len<=7?1:4.5/len;
 // g’ildiraklar
 const wh=[],seen=new Set();
 root.traverse(o=>{if(o===root||o.userData.dummy||!wheelRe.test(o.name||'')||badRe.test(o.name||''))return;
  let a=o.parent;while(a&&a!==root){if(seen.has(a))return;a=a.parent}
  const hasMesh=o.isMesh||(()=>{let f=false;o.traverse(c=>{if(c.isMesh)f=true});return f})();if(!hasMesh)return;
  seen.add(o);const b=new THREE.Box3().setFromObject(o);if(b.isEmpty())return;
  const c=b.getCenter(new V3()),s2=b.getSize(new V3()),r=Math.max(.05,Math.min(Math.max(s2.y,Math.abs(s2.x*F.x+s2.z*F.z)),Math.max(s2.x,s2.y,s2.z))/2);
  o.parent.updateWorldMatrix(true,false);const inv=new THREE.Matrix4().copy(o.parent.matrixWorld).invert();
  wh.push({o,p:c.clone().applyMatrix4(inv),a:Rv.clone().transformDirection(inv),u:UPV.clone().transformDirection(inv),p0:o.position.clone(),q0:o.quaternion.clone(),r,front:c.clone().sub(C).dot(F)>0,ang:0})});
 const th=-Math.atan2(F.x,F.z),cr=C.clone().setY(0).applyAxisAngle(UPV,th);
 return{sv,n,wh,scale,th,off:new V3(-cr.x,-bb.min.y,-cr.z),C,F}}

/* ---------- o’yinni boshlash ---------- */
function start(map){
 if(G)return;
 const cp=prepare();if(!cp){toast(window.I18N&&I18N.t&&document.documentElement.lang!='uz'?(I18N.t('Avval mashina modelini import qiling (Fayl → Ochish)')||'Import a car model first'):'Avval mashina modelini import qiling (Fayl → Ochish)');return}
 const CX=window.CarFX,CAR=CX&&CX.CAR,W=map.build();
 const vp=$q('#vp'),sv={fog:S.fog,bg:S.background,hemi:null,dl:dl.intensity,cam:{p:cam.position.clone(),q:cam.quaternion.clone(),fov:cam.fov,t:ctl.target.clone()},upd:ctl.update,en:ctl.enabled,
  grid:grid.visible,axs:axs.visible,tc:tc.visible,tce:tc.enabled,dum:[],camT:CAR?Object.assign({},CAR.T):null,
  car:CAR?{head:CAR.head,ind:CAR.ind,fog:CAR.fog,dome:CAR.dome,wipe:CAR.wipe,speed:CAR.speed,engine:CAR.engine,steer:CAR.steer,brake:CAR.brake,rev:CAR.rev,F:CAR.F.clone(),C:CAR.C.clone()}:null};
 S.traverse(o=>{if(o.isHemisphereLight)sv.hemi=o});sv.hemiI=sv.hemi?sv.hemi.intensity:1;
 root.traverse(o=>{if(o.userData&&o.userData.dummy&&o.visible){sv.dum.push(o);o.visible=false}});
 try{select(null)}catch(e){}
 grid.visible=axs.visible=false;tc.visible=false;tc.enabled=false;ctl.enabled=false;ctl.update=()=>{};
 S.fog=new THREE.Fog(W.sky,W.fog[0],W.fog[1]);S.background=new THREE.Color(W.sky);
 S.add(W.g);
 // mashina o’rami
 const veh=new THREE.Group();veh.scale.setScalar(cp.scale);W.g.add(veh);veh.add(root);
 root.position.copy(cp.off);root.rotation.set(0,cp.th,0);root.scale.set(1,1,1);
 // NPC mashinalar
 const traffic=[];
 for(let i=0;i<W.trafficN;i++){const ln=W.lanes[Math.floor(Math.random()*W.lanes.length)],m=npcCar(pick(NPC_CARS));
  const c={m,lane:ln,s:rnd(0,ln.len),v:0,vmax:W.race?rnd(20,30):rnd(8,14),hold:0};
  // boshlang’ich joy: o’yinchi yaqinida emas
  const q=ln.at(c.s);if(Math.hypot(q.x-W.spawn.x,q.z-W.spawn.z)<30)c.s+=60;
  ln.cars.push(c);traffic.push(c);W.g.add(m)}
 const peds=W.peds;peds.forEach(p=>{p.m=npcPed();W.g.add(p.m)});
 // HUD
 const hud=document.createElement('div');hud.className='ghud';
 hud.innerHTML=`<div class="gmap">${W.name}</div><div class="gtop"><button id="gcam">Kamera</button><button id="gnt">Tun / kun</button><button id="gsn" class="on">Ovoz</button><button id="gps">⏸</button><button id="ghp">Yordam</button><button class="ex" id="gex">Chiqish</button></div>
<div class="ghelp" id="ghh">W / ↑ gaz · S / ↓ tormoz va orqaga · A D / ← → rul · Probel qo’l tormozi\nH chiroq · Q E povorotnik · Z avariya · Y artgich · C kamera · N tun/kun\n1–4 eshiklar · 5 kapot · 6 bagaj · 7 lyuk · 8 oynalar · M ovoz · R joyiga qaytarish · Esc chiqish</div>
<canvas class="gmm" id="gmm" width="150" height="150"></canvas><div class="glap" id="glap"></div><div class="gpause" id="gpz"></div><div class="gind" id="gin"><span id="gil"></span><span id="gir"></span></div><div class="gspd"><b id="gs">0</b><small>km/soat</small><small id="gg" style="margin-top:2px"></small><div class="grpm"><i id="gr"></i></div></div>
<div class="gt l"><button data-k="left">◀</button><button data-k="right">▶</button></div><div class="gt r"><button data-k="up">Gaz</button><button data-k="down">Tormoz</button></div>`;
 vp.append(hud);document.body.classList.add('game');
 const state={W,veh,cp,traffic,peds,sv,hud,P:{x:W.spawn.x,z:W.spawn.z,h:W.spawn.h,v:0,st:0,hb:0},keys:{},cam:0,night:0,tn:0,t:0,lt:0,hudT:0,cx:cam.position.clone(),audio:null,snd:true,sirenT:0,shake:0,laps:0,lapT:0,best:0,half:false,pi:null,paused:false,gear:1,rpm:0};
 G=state;state.lapT=0;
 state.shadow=shadow(2.4,5);W.g.add(state.shadow);
 // asosiy sinf holatini tozalash
 if(CAR){CAR.engine=true;CAR.hold=false}
 // kamera boshlang’ich
 const P=state.P,f=new V3(Math.sin(P.h),0,Math.cos(P.h));cam.fov=62;cam.updateProjectionMatrix();
 cam.position.set(P.x-f.x*8,3.5,P.z-f.z*8);state.cx.copy(cam.position);
 bind(state);audioInit(state);
 requestAnimationFrame(t=>{state.t=t/1000;tick(t)});
 setTimeout(()=>{const h=$q('#ghh');h&&state.t>0&&0},0)}

/* ---------- ttugash ---------- */
function stop(){
 if(!G)return;const s=G;G=null;
 unbind(s);if(s.audio){try{s.audio.o.stop();s.audio.c.close()}catch(e){}}
 const CX=window.CarFX,CAR=CX&&CX.CAR,sv=s.sv,cp=s.cp;
 S.add(root);root.position.copy(cp.sv.p);root.quaternion.copy(cp.sv.q);root.scale.copy(cp.sv.s);
 s.W.g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){[].concat(o.material).forEach(m=>{m.map&&m.map.dispose();m.dispose()})}});
 S.remove(s.W.g);s.hud.remove();document.body.classList.remove('game');
 cp.wh.forEach(w=>{w.o.position.copy(w.p0);w.o.quaternion.copy(w.q0);w.o.updateMatrix()});
 sv.dum.forEach(o=>o.visible=true);
 S.fog=sv.fog;S.background=sv.bg;if(sv.hemi)sv.hemi.intensity=sv.hemiI;dl.intensity=sv.dl;
 cam.position.copy(sv.cam.p);cam.quaternion.copy(sv.cam.q);cam.fov=sv.cam.fov;cam.updateProjectionMatrix();ctl.target.copy(sv.cam.t);
 ctl.update=sv.upd;ctl.enabled=sv.en;grid.visible=sv.grid;axs.visible=sv.axs;tc.visible=sv.tc;tc.enabled=sv.tce;
 if(CAR&&sv.car){Object.assign(CAR,sv.car);CAR.F.copy(sv.car.F);CAR.C.copy(sv.car.C);Object.keys(sv.camT).forEach(k=>CAR.T[k]=sv.camT[k]);try{CX.buildRigs()}catch(e){}}
 root.updateMatrixWorld(true);toast('O’yin tugadi')}

/* ---------- kirish ---------- */
const KEYMAP={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'hb'};
const DOORS={Digit1:['door_lf'],Digit2:['door_rf'],Digit3:['door_lr'],Digit4:['door_rr'],Digit5:['bonnet'],Digit6:['boot'],Digit7:['roof'],Digit8:['win_lf','win_rf','win_lr','win_rr']};
function bind(s){
 s.kd=e=>{if(!G)return;
  if(e.code=='Escape'){e.preventDefault();e.stopImmediatePropagation();stop();return}
  const CAR=window.CarFX&&CarFX.CAR;let used=true;
  if(KEYMAP[e.code])s.keys[KEYMAP[e.code]]=true;
  else if(e.code=='KeyH'&&CAR)CAR.head=(CAR.head+1)%3;
  else if(e.code=='KeyQ'&&CAR)CAR.ind=CAR.ind==1?0:1;
  else if(e.code=='KeyE'&&CAR)CAR.ind=CAR.ind==2?0:2;
  else if(e.code=='KeyZ'&&CAR)CAR.ind=CAR.ind==3?0:3;
  else if(e.code=='KeyY'&&CAR)CAR.wipe=(CAR.wipe+1)%3;
  else if(e.code=='KeyC')s.cam=(s.cam+1)%4;
  else if(e.code=='KeyN')s.night=s.night?0:1;
  else if(e.code=='KeyM')toggleSound(s);
  else if(e.code=='KeyP')pause(s);
  else if(e.code=='KeyR'){const P=s.P;P.v=0;const n=s.W.loop?nearest(s.W.loop,P.x,P.z):null;if(n){P.x=n.x;P.z=n.z}}
  else if(DOORS[e.code]&&CAR){const a=DOORS[e.code],o=CAR.T[a[0]]?0:1;a.forEach(k=>{if(k in CAR.T)CAR.T[k]=o})}
  else used=false;
  if(used){e.preventDefault();e.stopImmediatePropagation()}};
 s.ku=e=>{if(!G)return;if(KEYMAP[e.code]){s.keys[KEYMAP[e.code]]=false;e.preventDefault();e.stopImmediatePropagation()}};
 window.addEventListener('keydown',s.kd,true);window.addEventListener('keyup',s.ku,true);
 const h=s.hud;
 h.querySelector('#gex').onclick=stop;h.querySelector('#gps').onclick=()=>pause(s);h.querySelector('#gcam').onclick=()=>s.cam=(s.cam+1)%4;
 h.querySelector('#gnt').onclick=()=>s.night=s.night?0:1;h.querySelector('#gsn').onclick=e=>toggleSound(s,e.currentTarget);
 h.querySelector('#ghp').onclick=()=>{const x=h.querySelector('#ghh');x.style.display=x.style.display=='none'?'block':'none'};
 h.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;b.onpointerdown=e=>{s.keys[k]=true;b.setPointerCapture(e.pointerId)};b.onpointerup=b.onpointercancel=()=>s.keys[k]=false});
 s.bl=()=>{s.keys={}};window.addEventListener('blur',s.bl)}
function unbind(s){window.removeEventListener('keydown',s.kd,true);window.removeEventListener('keyup',s.ku,true);window.removeEventListener('blur',s.bl)}

/* ---------- ovoz (dvigatel) ---------- */
function audioInit(s){try{const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();
 o.type='sawtooth';f.type='lowpass';f.frequency.value=700;g.gain.value=.0;o.connect(f);f.connect(g);g.connect(c.destination);o.start();s.audio={c,o,g,f}}catch(e){}}
function pause(s){s.paused=!s.paused;s.hud.querySelector('#gpz').textContent=s.paused?'⏸':'';if(s.audio)s.audio.g.gain.value=0}
function crash(s,i){if(i<5)return;s.shake=Math.min(1,i/24);if(s.audio&&s.snd){try{const c=s.audio.c,b=c.createBuffer(1,c.sampleRate*.35,c.sampleRate),d=b.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*Math.pow(1-k/d.length,2);const n=c.createBufferSource(),g=c.createGain();n.buffer=b;g.gain.value=Math.min(.5,i/40);n.connect(g);g.connect(c.destination);n.start()}catch(e){}}}
function fmt(t){const m=Math.floor(t/60),x=t-m*60;return m+':'+(x<10?'0':'')+x.toFixed(1)}
function toggleSound(s,btn){s.snd=!s.snd;btn=btn||s.hud.querySelector('#gsn');btn.classList.toggle('on',s.snd)}

/* ---------- asosiy sikl ---------- */
function resolveBoxes(W,P,cx,cz,r,fn){
 for(const b of W.box){const qx=Math.max(b[0],Math.min(cx,b[1])),qz=Math.max(b[2],Math.min(cz,b[3])),dx=cx-qx,dz=cz-qz,d=Math.hypot(dx,dz);
  if(d<r){let nx,nz,pen;if(d>1e-4){nx=dx/d;nz=dz/d;pen=r-d}else{const l=cx-b[0],rr=b[1]-cx,t=cz-b[2],bt=b[3]-cz,m=Math.min(l,rr,t,bt);nx=m==l?-1:m==rr?1:0;nz=m==t?-1:m==bt?1:0;pen=m+r}
   fn(nx,nz,pen)}}
 for(const c of W.circ){const dx=cx-c[0],dz=cz-c[1],d=Math.hypot(dx,dz),rr=r+c[2];if(d<rr&&d>1e-4)fn(dx/d,dz/d,rr-d)}}
function tick(now){
 const s=G;if(!s)return;requestAnimationFrame(tick);
 const t=now/1000,dt=s.paused?0:Math.min(.05,t-s.t||.016);s.t=t;if(s.paused){s.lapT+=.016;s.pauseT=1;return}s.lt+=dt;
 const W=s.W,P=s.P,k=s.keys,CX=window.CarFX,CAR=CX&&CX.CAR;
 /* --- o’yinchi fizikasi --- */
 const maxF=58,maxR=14,acc=k.up?(P.v<0?18:15):0;
 let braking=false;
 if(k.up)P.v+=acc*dt*(1-Math.max(0,P.v)/maxF*.85);
 if(k.down){if(P.v>.5){P.v-=24*dt;braking=true}else P.v-=8*dt*(1+P.v/maxR*0+1)}
 if(!k.up&&!k.down)P.v-=Math.sign(P.v)*Math.min(Math.abs(P.v),(2.2+Math.abs(P.v)*.035)*dt);
 if(k.hb){P.v-=Math.sign(P.v)*Math.min(Math.abs(P.v),18*dt);braking=true}
 P.v=Math.max(-maxR,Math.min(maxF,P.v));
 // yo’ldan tashqari
 let off=0;if(W.loop){const nr=nearest(W.loop,P.x,P.z),lim=W.roadW/2;if(nr.d>lim+1){off=1;P.v-=Math.sign(P.v)*Math.min(Math.abs(P.v),(W.race?10:7)*dt*Math.min(1,(nr.d-lim)/4))}
  if(nr.d>lim+(W.race?5:16)){const dx=nr.x-P.x,dz=nr.z-P.z,l=Math.hypot(dx,dz)||1,p=nr.d-(lim+(W.race?5:16));P.x+=dx/l*p;P.z+=dz/l*p;P.v*=.9}}
 if(W.race&&W.loop){const nr=nearest(W.loop,P.x,P.z),n=W.loop.length,i=nr.i;if(i>n*.4&&i<n*.6)s.half=true;
  if(s.pi!=null&&s.pi>n*.85&&i<n*.15&&s.half){const lt=t-s.lapT;s.lapT=t;s.half=false;s.laps++;if(!s.best||lt<s.best)s.best=lt;toast('⏱ '+fmt(lt))}s.pi=i}
 const tgt=((k.left?1:0)-(k.right?1:0)),ms=.6/(1+Math.abs(P.v)*.06);   // chap +
 P.st+=(tgt-P.st)*Math.min(1,dt*(tgt?6:9));
 const dl2=P.st*ms;P.h+=P.v/2.7*Math.tan(dl2)*dt*(k.hb&&Math.abs(P.v)>8?1.8:1);
 const fx=Math.sin(P.h),fz=Math.cos(P.h);P.x+=fx*P.v*dt;P.z+=fz*P.v*dt;
 // chegara (shahar)
 if(W.bound){const b=W.bound;if(Math.abs(P.x)>b){P.x=Math.sign(P.x)*b;P.v*=.5}if(Math.abs(P.z)>b){P.z=Math.sign(P.z)*b;P.v*=.5}}
 // to’qnashuvlar: statik
 for(const off2 of [1.4,-1.4]){const cx=P.x+fx*off2,cz=P.z+fz*off2;
  resolveBoxes(W,P,cx,cz,1.05,(nx,nz,pen)=>{P.x+=nx*pen;P.z+=nz*pen;const imp=Math.abs(P.v*(nx*fx+nz*fz));if(imp>2)P.v*=.55;crash(s,imp)})}
 // to’qnashuvlar: trafik
 for(const c of s.traffic){const q=c.pos;if(!q)continue;const dx=P.x-q.x,dz=P.z-q.z,d=Math.hypot(dx,dz);if(d<3.1&&d>1e-3){const pen=3.1-d;P.x+=dx/d*pen*.9;P.z+=dz/d*pen*.9;if(Math.abs(P.v)>2){crash(s,Math.abs(P.v)-c.v*.5);P.v*=.6}c.hold=1.2;c.v*=.3}}
 /* --- NPC mashinalar --- */
 for(const c of s.traffic){const ln=c.lane;let tv=c.vmax;
  if(W.lights){const ph=s.lt%18,green=ln.axis=='z'?ph<7.5:(ph>=9&&ph<16.5);
   if(!green)for(const cs of ln.cross){const d=cs-wrap(c.s,ln.len);if(d>2&&d<12+c.v*c.v/10){tv=0;break}}}
  // oldidagi mashina
  for(const o of ln.cars){if(o===c)continue;let d=wrap(o.s-c.s,ln.len);if(d<Math.max(8,c.v*1.1+6)){tv=Math.min(tv,Math.max(0,o.v-(8-d)*.5));if(d<6)tv=0}}
  if(c.pos){const dx=P.x-c.pos.x,dz=P.z-c.pos.z,fwd=dx*Math.sin(c.pos.h)+dz*Math.cos(c.pos.h),lat=Math.abs(dx*Math.cos(c.pos.h)-dz*Math.sin(c.pos.h));if(fwd>0&&fwd<9&&lat<2.4)tv=0}
  if(c.hold>0){c.hold-=dt;tv=0}
  c.v+=Math.max(-14*dt,Math.min(5*dt,tv-c.v));c.s+=c.v*dt;if(!ln.closed&&c.s>=ln.len)c.s-=ln.len;
  const q=ln.at(c.s);c.pos=q;c.m.position.set(q.x,0,q.z);c.m.rotation.y=q.h}
 if(W.lights){const ph=s.lt%18,Y=0xffb000,Rr=0xff2a1a,Gg=0x00ff3a;W.lights.z.color.set(ph<7.5?Gg:ph<9?Y:Rr);W.lights.x.color.set(ph<9?Rr:ph<16.5?Gg:Y)}
 /* --- odamlar --- */
 for(const p of s.peds){const m=p.m,ud=m.userData;
  if(p.k>0){p.k-=dt;p.vy=(p.vy||0)-12*dt;p.ky=Math.max(0,(p.ky||0)+p.vy*dt);if(p.ky==0)p.vy=0;p.x+=p.vx*dt;p.z+=p.vz*dt;p.vx*=.97;p.vz*=.97;
   m.position.set(p.x,p.ky||0,p.z);m.rotation.x=-Math.min(1.5,(3.5-p.k)*6);if(p.k<=0){m.rotation.x=0}continue}
  let x,z,h,moving=false;
  if(p.fixed){x=p.x;z=p.z;h=p.h;const w=Math.sin(t*4+p.ph);ud.arms[0].rotation.z=2.6+w*.3;ud.arms[1].rotation.z=-2.6-w*.3}
  else{const ln=p.lane;p.s+=p.dir*p.v*dt;if(!ln.closed){if(p.s>ln.len){p.s=ln.len;p.dir=-1}else if(p.s<0){p.s=0;p.dir=1}}
   const q=ln.at(p.s);x=q.x;z=q.z;h=q.h+(p.dir<0?Math.PI:0);moving=true;p.x=x;p.z=z}
  m.position.set(x,0,z);m.rotation.set(0,h,0);
  if(moving){const w=Math.sin(t*p.v*5+p.ph)*.7;ud.legs[0].rotation.x=w;ud.legs[1].rotation.x=-w;ud.arms[0].rotation.x=-w*.7;ud.arms[1].rotation.x=w*.7}
  const dx=x-P.x,dz=z-P.z,d2=dx*dx+dz*dz;
  if(d2<2.2&&Math.abs(P.v)>1.5){p.k=3.5;const l=Math.sqrt(d2)||1;p.vx=(dx/l)*Math.abs(P.v)*.5+fx*P.v*.3;p.vz=(dz/l)*Math.abs(P.v)*.5+fz*P.v*.3;p.vy=Math.min(5,Math.abs(P.v)*.12);p.ky=0;p.x=x;p.z=z}}
 /* --- mashina vizuali --- */
 s.shadow.position.set(P.x,.04,P.z);s.shadow.rotation.z=-P.h;
 const veh=s.veh;veh.position.set(P.x,0,P.z);veh.rotation.y=P.h;veh.updateMatrixWorld(true);
 const lean=-P.st*Math.min(1,Math.abs(P.v)/30)*.05;s.leanC=(s.leanC||0)+(lean-(s.leanC||0))*Math.min(1,dt*5);veh.rotation.z=s.leanC;veh.updateMatrixWorld(true);
 for(const w of s.cp.wh){w.ang+=P.v*dt/(w.r*s.cp.scale);const sp=new THREE.Quaternion().setFromAxisAngle(w.a,-w.ang);let q=sp.premultiply(new THREE.Quaternion());
  if(w.front){const st=new THREE.Quaternion().setFromAxisAngle(w.u,dl2*.9);q=st.multiply(sp)}
  q.multiply(w.q0);w.o.quaternion.copy(q);w.o.position.copy(w.p0).sub(w.p).applyQuaternion(q.clone().multiply(w.q0.clone().invert())).add(w.p);w.o.updateMatrix()}
 if(CAR){CAR.F.set(fx,0,fz);CAR.C.set(P.x,1,P.z);CAR.speed=Math.abs(P.v)*3.6;CAR.engine=true;CAR.steer=P.st*-135;CAR.brake=braking||(k.down&&P.v>.5);CAR.rev=P.v<-.3;CAR.dir=CAR.dir||1}
 const kmh=Math.abs(P.v)*3.6,GS=[0,28,55,88,128,175,999];let gi=1;while(gi<6&&kmh>=GS[gi])gi++;s.gear=gi;const lo=GS[gi-1],hi=GS[gi];s.rpm+=(Math.min(1,.18+(kmh-lo)/(hi-lo)*.82+(k.up?.05:0))-s.rpm)*Math.min(1,dt*8);
 if(s.lamps&&0){}
 /* --- tun / kun --- */
 s.tn+=((s.night?1:0)-s.tn)*Math.min(1,dt*2);
 const sky=new THREE.Color(W.sky).lerp(new THREE.Color(0x070b18),s.tn);S.background.copy(sky);S.fog.color.copy(sky);
 if(W.lamps)W.lamps.opacity=s.tn;
 const hm=S.children.find(o=>o.isHemisphereLight);if(hm)hm.intensity=s.sv.hemiI*(1-.82*s.tn);dl.intensity=s.sv.dl*(1-.9*s.tn);
 /* --- kamera --- */
 const mode=s.cam,sp=Math.abs(P.v);let tp,la;const up=new V3(0,1,0);
 if(mode==0){tp=new V3(P.x-fx*(7.5+sp*.04),3.1+sp*.012,P.z-fz*(7.5+sp*.04));la=new V3(P.x+fx*4,1.2,P.z+fz*4)}
 else if(mode==1){tp=new V3(P.x-fx*16,8,P.z-fz*16);la=new V3(P.x+fx*3,1,P.z+fz*3)}
 else if(mode==2){tp=new V3(P.x+fx*.35,1.25,P.z+fz*.35);la=new V3(P.x+fx*20,1.1,P.z+fz*20)}
 else{const a=t*.25;tp=new V3(P.x+Math.cos(a)*9,3.2,P.z+Math.sin(a)*9);la=new V3(P.x,1,P.z)}
 const lk=mode==2?1:1-Math.exp(-dt*(mode==0?5.5:4));s.cx.lerp(tp,lk);cam.position.copy(s.cx);if(s.shake>.01){cam.position.x+=(Math.random()-.5)*s.shake*.6;cam.position.y+=(Math.random()-.5)*s.shake*.6;s.shake*=Math.exp(-dt*6)}cam.up.copy(up);cam.lookAt(la);
 const fov=(mode==2?72:60)+sp*.18;cam.fov+=(fov-cam.fov)*Math.min(1,dt*3);cam.updateProjectionMatrix();
 /* --- HUD --- */
 s.hudT+=dt;if(s.hudT>.12){s.hudT=0;const e=s.hud.querySelector('#gs');e.textContent=Math.round(sp*3.6);s.hud.querySelector('#gg').textContent=P.v<-.3?'R':'D'+s.gear;s.hud.querySelector('#gr').style.width=Math.round(s.rpm*100)+'%';
  drawMini(s);if(W.race){const lg={uz:['Aylanish','Eng yaxshi'],en:['Lap','Best'],ru:['Круг','Лучший'],ar:['اللفة','الأفضل']}[document.documentElement.lang]||['Aylanish','Eng yaxshi'];s.hud.querySelector('#glap').textContent=lg[0]+' '+(s.laps+1)+' · '+fmt(t-s.lapT)+(s.best?' · '+lg[1]+' '+fmt(s.best):'')}
  const bl=Math.floor(t*3)%2==0,ci=CAR?CAR.ind:0;s.hud.querySelector('#gil').textContent=(ci==1||ci==3)&&bl?'◀':'';s.hud.querySelector('#gir').textContent=(ci==2||ci==3)&&bl?'▶':''}
 /* --- ovoz --- */
 if(s.audio){const a=s.audio;a.o.frequency.setTargetAtTime(40+s.rpm*120,a.c.currentTime,.05);a.f.frequency.setTargetAtTime(380+sp*18,a.c.currentTime,.1);a.g.gain.setTargetAtTime(s.snd?(k.up?.07:.04):0,a.c.currentTime,.08)}
}

function drawMini(s){const c=s.hud.querySelector('#gmm');if(!c)return;const g=c.getContext('2d'),W=s.W,P=s.P,sc=.3,cx=75,cy=100,sn=Math.sin(P.h),cs=Math.cos(P.h);
 const tr=(x,z)=>{const dx=x-P.x,dz=z-P.z;return[cx+(-dx*cs+dz*sn)*sc,cy-(dx*sn+dz*cs)*sc]};
 g.clearRect(0,0,150,150);g.save();g.beginPath();g.arc(75,75,75,0,TAU);g.clip();g.fillStyle='#1d2a1dcc';g.fillRect(0,0,150,150);g.strokeStyle='#8a8f95';g.lineWidth=Math.max(2,(W.roadW||14)*sc);g.lineJoin='round';
 if(W.mini){g.beginPath();W.mini.forEach(l=>{const a=tr(l[0],l[1]),b=tr(l[2],l[3]);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1])});g.stroke()}
 else if(W.loop){g.beginPath();W.loop.forEach((p,i)=>{const a=tr(p[0],p[1]);i?g.lineTo(a[0],a[1]):g.moveTo(a[0],a[1])});g.closePath();g.stroke()}
 g.fillStyle='#ff5a4a';s.traffic.forEach(c2=>{if(!c2.pos)return;const a=tr(c2.pos.x,c2.pos.z);g.fillRect(a[0]-1.5,a[1]-1.5,3,3)});
 g.restore();g.fillStyle='#35e06a';g.beginPath();g.moveTo(75,90);g.lineTo(70,106);g.lineTo(80,106);g.closePath();g.fill();g.strokeStyle='#fff8';g.lineWidth=2;g.beginPath();g.arc(75,75,74,0,TAU);g.stroke()}
/* ---------- menyu ---------- */
function menu(){
 let m=$q('.gmenu');
 if(!m){m=document.createElement('div');m.className='gmenu';
  m.innerHTML=`<div class="gbox"><div class="gh"><span>O’yinni boshlash</span><span class="sp"></span><button class="gx">Yopish</button></div><div class="gp">Mashinani “Mashina” panelida sozlab oling (eshik, chiroq, rul…), so’ng xaritani tanlang. Mashina o’zingiz import qilgan model bo’ladi.</div><div class="gmaps"></div></div>`;
  document.body.append(m);m.onclick=e=>{if(e.target===m)m.classList.remove('on')};m.querySelector('.gx').onclick=()=>m.classList.remove('on');
  const box=m.querySelector('.gmaps');
  MAPS.forEach(mp=>{const b=document.createElement('button');b.innerHTML=`<i>${mp.ico}</i><span><b></b><small></small></span>`;b.querySelector('b').textContent=mp.name;b.querySelector('small').textContent=mp.desc;
   b.onclick=()=>{m.classList.remove('on');start(mp)};box.append(b)})}
 m.classList.add('on')}
function init(){
 const hd=$q('header');if(!hd||$q('#gbtn'))return;
 const b=document.createElement('button');b.id='gbtn';b.className='pri';b.textContent='O’yin';b.title='O’yinni boshlash';
 const sp=hd.querySelector('.sp');sp?hd.insertBefore(b,sp):hd.append(b);
 b.onclick=()=>{if(!meshes().filter(m=>!m.userData.dummy).length){toast(document.documentElement.lang=='uz'?'Avval mashina modelini import qiling (Fayl → Ochish)':(window.I18N&&I18N.t('Avval mashina modelini import qiling (Fayl → Ochish)'))||'Import a car model first');return}menu()};
}
init();
window.Game={start,stop,MAPS};
})();
