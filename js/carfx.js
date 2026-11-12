/* ---- v38: Mashina funksiyalari ----
   Eshik, kapot, bagaj, lyuk, oyna, bakavoy, rul, artgich, chiroqlar (fara, stop, orqaga, povorotnik, tuman, salon),
   panel chiroqchalari, spidometr va tahometr.
   Qismlar nomi bo’yicha avto topiladi yoki qo’lda belgilanadi (tanlang → “Tanlanganni belgilash”).
   Ierarxiyaga tegmaydi: qism o’zining position/quaternion’i o’zgaradi (pivot hisoblab), shuning uchun DFF/GLB eksport ham buzilmaydi
   (eksport paytida hammasi yopiq holatga qaytariladi). Chiroq nuri va yaltirashi sahnada (root’dan tashqarida) turadi — eksportga kirmaydi. */
(function(){
'use strict';
const V3=THREE.Vector3,Q4=THREE.Quaternion,$q=s=>document.querySelector(s);
const lang=()=>document.documentElement.lang||'uz';
const L=(u,e,r)=>{const g=lang();if(g=='ar')return (window.I18N&&I18N.l(u))||e;return {uz:u,en:e,ru:r}[g]||u};
const D2R=Math.PI/180,UP=new V3(0,1,0);

/* ---------- tarjimalar ---------- */
const TR=`
Mashina|Car|Машина
Qismlar|Parts|Детали
Eshik va kapotlar|Doors and hoods|Двери и капоты
Oynalar, lyuk, bakavoy|Windows, sunroof, visors|Окна, люк, козырьки
Chiroqlar|Lights|Свет
Rul, artgich, asboblar|Steering, wipers, gauges|Руль, дворники, приборы
Avto-aniqlash|Auto-detect|Автоопределение
Tozalash|Clear|Очистить
Tanlanganni belgilash|Assign selected|Назначить выбранное
Old tomon|Front side|Перед
Avto|Auto|Авто
Hamma eshiklar|All doors|Все двери
Hamma oynalar|All windows|Все окна
Hammasini yopish|Close everything|Закрыть всё
Eshik · chap old|Door · front left|Дверь · пер. левая
Eshik · o’ng old|Door · front right|Дверь · пер. правая
Eshik · chap orqa|Door · rear left|Дверь · задн. левая
Eshik · o’ng orqa|Door · rear right|Дверь · задн. правая
Old kapot|Hood|Капот
Bagaj kapoti|Trunk lid|Крышка багажника
Tom lyuki|Sunroof|Люк
Oyna · chap old|Window · front left|Окно · пер. левое
Oyna · o’ng old|Window · front right|Окно · пер. правое
Oyna · chap orqa|Window · rear left|Окно · задн. левое
Oyna · o’ng orqa|Window · rear right|Окно · задн. правое
Bakavoy · chap|Sun visor · left|Козырёк · левый
Bakavoy · o’ng|Sun visor · right|Козырёк · правый
Rul|Steering wheel|Руль
Artgich · chap|Wiper · left|Дворник · левый
Artgich · o’ng|Wiper · right|Дворник · правый
Old chiroq (fara)|Headlight|Фара
Orqa chiroq (gabarit)|Tail light|Задний фонарь
Stop-signal|Brake light|Стоп-сигнал
Orqaga yurish chirog’i|Reverse light|Фонарь заднего хода
Povorotnik · chap|Turn signal · left|Поворотник · левый
Povorotnik · o’ng|Turn signal · right|Поворотник · правый
Tuman chirog’i|Fog light|Противотуманка
Salon plafoni|Dome light|Плафон салона
Panel chiroqchalari|Dashboard lamps|Лампы панели
Panel: chap strelka|Dash: left arrow|Панель: левая стрелка
Panel: o’ng strelka|Dash: right arrow|Панель: правая стрелка
Spidometr mili|Speedometer needle|Стрелка спидометра
Tahometr mili|Tachometer needle|Стрелка тахометра
Fara rejimi|Headlight mode|Режим фар
O’chiq|Off|Выкл
Yaqin|Low beam|Ближний
Uzoq|High beam|Дальний
Povorotnik|Turn signal|Поворотник
Chap|Left|Левый
O’ng|Right|Правый
Avariya|Hazard|Аварийка
Gabarit (orqa chiroq)|Parking lights|Габариты
Tormoz (stop-signal)|Brake (stop light)|Тормоз (стоп-сигнал)
Orqaga yurish|Reverse|Задний ход
Tuman chiroqlari|Fog lights|Противотуманки
Salon chirog’i|Interior light|Свет в салоне
Artgich|Wipers|Дворники
Sekin|Slow|Медленно
Tez|Fast|Быстро
Dvigatel (panel yonadi)|Engine (dash lit)|Двигатель (панель горит)
Tezlik|Speed|Скорость
Rul burchagi|Steering angle|Угол руля
Demo haydash|Demo drive|Демо-езда
Strelka yo’li (daraja)|Needle sweep (deg)|Ход стрелки (град.)
Teskari yo’nalish|Reverse direction|Обратное направление
Belgilangan qism yo’q. “Avto-aniqlash” ni bosing yoki modelda qismni tanlab, rolni belgilang.|No parts assigned. Press “Auto-detect” or select a part in the model and assign a role.|Детали не назначены. Нажмите «Автоопределение» или выберите деталь и назначьте роль.
Avval modelda qism(lar)ni tanlang|Select part(s) in the model first|Сначала выберите деталь(и) в модели
Mashina qismlari topilmadi (nomlar tanish emas). Qismlarni qo’lda belgilang.|No car parts found (unfamiliar names). Assign parts manually.|Детали не найдены (незнакомые имена). Назначьте вручную.
Old: +Z|Front: +Z|Перед: +Z
Old: −Z|Front: −Z|Перед: −Z
Old: +X|Front: +X|Перед: +X
Old: −X|Front: −X|Перед: −X
`;
if(window.I18N&&I18N.add)I18N.add(TR);

/* ---------- rollar ---------- */
const ROLES=[
 ['door_lf','Eshik · chap old'],['door_rf','Eshik · o’ng old'],['door_lr','Eshik · chap orqa'],['door_rr','Eshik · o’ng orqa'],
 ['bonnet','Old kapot'],['boot','Bagaj kapoti'],['roof','Tom lyuki'],
 ['win_lf','Oyna · chap old'],['win_rf','Oyna · o’ng old'],['win_lr','Oyna · chap orqa'],['win_rr','Oyna · o’ng orqa'],
 ['visor_l','Bakavoy · chap'],['visor_r','Bakavoy · o’ng'],
 ['steer','Rul'],['wiper_l','Artgich · chap'],['wiper_r','Artgich · o’ng'],
 ['head','Old chiroq (fara)'],['tail','Orqa chiroq (gabarit)'],['brake','Stop-signal'],['rev','Orqaga yurish chirog’i'],
 ['ind_l','Povorotnik · chap'],['ind_r','Povorotnik · o’ng'],['fog','Tuman chirog’i'],['dome','Salon plafoni'],
 ['dash','Panel chiroqchalari'],['dash_l','Panel: chap strelka'],['dash_r','Panel: o’ng strelka'],
 ['speedo','Spidometr mili'],['tacho','Tahometr mili']];
const LBL=Object.fromEntries(ROLES);
const MAXR={door:70,bonnet:60,boot:65,visor:85,wiper:75};

const CAR={map:{},fw:'auto',F:new V3(0,0,1),R:new V3(1,0,0),C:new V3(),L:4,rigs:{},
 T:{},Cu:{},steer:0,wipe:0,wipeAmt:0,head:0,tail:false,brake:false,rev:false,fog:false,dome:false,ind:0,engine:false,speed:0,demo:false,sweep:270,dir:1,hold:false,fx:new Map(),dp:0};
['door_lf','door_rf','door_lr','door_rr','bonnet','boot','roof','win_lf','win_rf','win_lr','win_rr','visor_l','visor_r'].forEach(k=>CAR.T[k]=CAR.Cu[k]=0);

const live=o=>o&&o.parent;
const parts=r=>(CAR.map[r]||[]).filter(live);
const any=()=>Object.values(CAR.map).some(a=>a.some(live));

/* ---------- geometriya yordamchilari ---------- */
function wverts(o,max){
 o.updateWorldMatrix(true,false);const P=o.geometry&&o.geometry.getAttribute('position');if(!P)return[];
 const n=P.count,st=Math.max(1,Math.floor(n/(max||2500))),out=[];
 for(let i=0;i<n;i+=st)out.push(new V3().fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld));return out}
function eig3(C){
 const A=C.map(r=>r.slice()),Vv=[[1,0,0],[0,1,0],[0,0,1]];
 for(let it=0;it<40;it++){
  let p=0,q=1,mx=Math.abs(A[0][1]);
  if(Math.abs(A[0][2])>mx){p=0;q=2;mx=Math.abs(A[0][2])}
  if(Math.abs(A[1][2])>mx){p=1;q=2;mx=Math.abs(A[1][2])}
  if(mx<1e-14)break;
  const th=(A[q][q]-A[p][p])/(2*A[p][q]),t=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
  for(let k=0;k<3;k++){const a=A[k][p],b=A[k][q];A[k][p]=c*a-s*b;A[k][q]=s*a+c*b}
  for(let k=0;k<3;k++){const a=A[p][k],b=A[q][k];A[p][k]=c*a-s*b;A[q][k]=s*a+c*b}
  for(let k=0;k<3;k++){const a=Vv[k][p],b=Vv[k][q];Vv[k][p]=c*a-s*b;Vv[k][q]=s*a+c*b}}
 const e=[0,1,2].map(i=>({v:A[i][i],a:new V3(Vv[0][i],Vv[1][i],Vv[2][i]).normalize()}));
 return e.sort((x,y)=>y.v-x.v)}
function pca(pts){
 const m=new V3();pts.forEach(p=>m.add(p));m.multiplyScalar(1/Math.max(1,pts.length));
 const C=[[0,0,0],[0,0,0],[0,0,0]],d=new V3();
 pts.forEach(p=>{d.copy(p).sub(m);const a=[d.x,d.y,d.z];for(let i=0;i<3;i++)for(let j=0;j<3;j++)C[i][j]+=a[i]*a[j]});
 const e=eig3(C);return{c:m,e:e.map(x=>x.a)}}   // e[0] eng uzun, e[2] eng yupqa (tekislik normali)
const wbox=o=>new THREE.Box3().setFromObject(o);
const bsize=(o)=>{const b=wbox(o),s=b.getSize(new V3()),c=b.getCenter(new V3());
 const F=CAR.F,R=CAR.R;return{c,b,s,eF:s.x*Math.abs(F.x)+s.z*Math.abs(F.z),eR:s.x*Math.abs(R.x)+s.z*Math.abs(R.z),eU:s.y}};
function pickSign(axis,pivot,pt,want){
 const r=pt.clone().sub(pivot).applyAxisAngle(axis,.1).add(pivot).sub(pt);
 if(r.dot(want)<0)axis.negate();return axis}
function carCenter(){
 const b=new THREE.Box3();let n=0;
 meshes().filter(m=>!m.userData.dummy&&m.visible).forEach(m=>{const x=wbox(m);if(!x.isEmpty()){b.union(x);n++}});
 if(!n)return;b.getCenter(CAR.C);CAR.L=Math.max(b.getSize(new V3()).length()*.6,1)}
function resolveF(){
 let F;
 if(CAR.fw!='auto'){const m={'+x':[1,0,0],'-x':[-1,0,0],'+z':[0,0,1],'-z':[0,0,-1]}[CAR.fw];F=new V3(...m)}
 else{
  const cen=r=>{const a=parts(r);if(!a.length)return null;const b=new THREE.Box3();a.forEach(o=>b.union(wbox(o)));return b.getCenter(new V3())};
  let a=cen('bonnet'),b=cen('boot'),d=null;
  if(!(a&&b)){a=cen('head');b=cen('tail')||cen('brake')||cen('rev')}
  if(a&&b)d=a.sub(b);d&&(d.y=0);
  if(!d||Math.hypot(d.x,d.z)<1e-5){const s=new THREE.Box3();meshes().filter(m=>!m.userData.dummy&&m.visible).forEach(m=>s.union(wbox(m)));const z=s.getSize(new V3());d=z.x>z.z?new V3(1,0,0):new V3(0,0,1)}
  F=Math.abs(d.x)>Math.abs(d.z)?new V3(Math.sign(d.x),0,0):new V3(0,0,Math.sign(d.z)||1)}
 CAR.F=F;CAR.R=F.clone().cross(UP).normalize()}

/* ---------- dam olish holati va pivotlar ---------- */
function rest(o){const r=o.userData.carRest;if(r){o.position.copy(r.p);o.quaternion.copy(r.q);o.updateMatrixWorld(true)}}
function restAll(){Object.values(CAR.map).forEach(a=>a.filter(live).forEach(rest))}
function remember(o){if(!o.userData.carRest)o.userData.carRest={p:o.position.clone(),q:o.quaternion.clone()}}
function toParent(o,p,a){o.parent.updateWorldMatrix(true,false);const inv=new THREE.Matrix4().copy(o.parent.matrixWorld).invert();
 return{p:p.clone().applyMatrix4(inv),a:a.clone().transformDirection(inv)}}
function mkRot(o,pW,aW,max){const t=toParent(o,pW,aW);return{o,kind:'rot',p:t.p,a:t.a,max:max,p0:o.position.clone(),q0:o.quaternion.clone()}}
function mkMove(o,vW,max){const inv=new THREE.Matrix4().copy(o.parent.matrixWorld).invert(),v=vW.clone().transformDirection(inv).multiplyScalar(vW.length());
 return{o,kind:'move',v,p0:o.position.clone(),q0:o.quaternion.clone()}}
function buildRigs(){
 restAll();Object.values(CAR.map).forEach(a=>a.filter(live).forEach(o=>o.updateMatrixWorld(true)));
 carCenter();resolveF();
 const F=CAR.F,R=CAR.R,rg={};
 for(const [role] of ROLES){
  const list=parts(role);if(!list.length)continue;rg[role]=[];
  for(const o of list){
   const s=bsize(o),lat=s.c.clone().sub(CAR.C).dot(R),side=R.clone().multiplyScalar(lat>=0?1:-1);
   let x=null;
   if(/^door_/.test(role)){
    const pv=s.c.clone().addScaledVector(F,s.eF/2),ax=pickSign(UP.clone(),pv,s.c.clone().addScaledVector(F,-s.eF/2),side);
    x=mkRot(o,pv,ax,MAXR.door*D2R)}
   else if(role=='bonnet'){const pv=s.c.clone().addScaledVector(F,-s.eF/2),ax=pickSign(R.clone(),pv,s.c.clone().addScaledVector(F,s.eF/2),UP);x=mkRot(o,pv,ax,MAXR.bonnet*D2R)}
   else if(role=='boot'){const pv=s.c.clone().addScaledVector(F,s.eF/2),ax=pickSign(R.clone(),pv,s.c.clone().addScaledVector(F,-s.eF/2),UP);x=mkRot(o,pv,ax,MAXR.boot*D2R)}
   else if(role=='roof')x=mkMove(o,F.clone().multiplyScalar(-s.eF*.6).addScaledVector(UP,s.eF*.03),1);
   else if(/^win_/.test(role))x=mkMove(o,UP.clone().multiplyScalar(-s.eU*.92),1);
   else if(/^visor_/.test(role)){const pv=s.c.clone().addScaledVector(F,s.eF/2).addScaledVector(UP,s.eU/2),ax=pickSign(R.clone(),pv,s.c.clone().addScaledVector(F,-s.eF/2),UP.clone().negate());x=mkRot(o,pv,ax,MAXR.visor*D2R)}
   else if(role=='steer'){const pc=pca(wverts(o));x=mkRot(o,pc.c,pc.e[2],0)}
   else if(/^wiper_/.test(role)){
    const pc=pca(wverts(o)),d=pc.e[0],pts=wverts(o);let lo=1e9,hi=-1e9;pts.forEach(p=>{const t=p.clone().sub(pc.c).dot(d);lo=Math.min(lo,t);hi=Math.max(hi,t)});
    const e1=pc.c.clone().addScaledVector(d,lo),e2=pc.c.clone().addScaledVector(d,hi),pv=e1.y<=e2.y?e1:e2,tip=pv===e1?e2:e1;
    const ax=pickSign(pc.e[2].clone(),pv,tip,UP);x=mkRot(o,pv,ax,MAXR.wiper*D2R)}
   else if(role=='speedo'||role=='tacho'){
    const pts=wverts(o),pc=pca(pts),d=pc.e[0];let lo=1e9,hi=-1e9;pts.forEach(p=>{const t=p.clone().sub(pc.c).dot(d);lo=Math.min(lo,t);hi=Math.max(hi,t)});
    const e1=pc.c.clone().addScaledVector(d,lo),e2=pc.c.clone().addScaledVector(d,hi),O=o.getWorldPosition(new V3()),len=hi-lo;
    const to=O.clone().sub(pc.c).dot(d),mid=Math.abs(to)<len*.15;      // origin o’rtada bo’lsa — shu nuqta atrofida
    const pv=mid?O.clone().addScaledVector(d,-O.clone().sub(pc.c).dot(d)).add(pc.c.clone().sub(pc.c)):(O.distanceTo(e1)<O.distanceTo(e2)?e1:e2);
    const n=pc.e[2].clone();if(n.dot(F)>0)n.negate();x=mkRot(o,mid?pc.c:pv,n,0)}
   if(x)rg[role].push(x)}}
 CAR.rigs=rg;setupFx()}
function applyRig(x,v){
 const o=x.o;if(!live(o))return;
 if(x.kind=='rot'){const q=new Q4().setFromAxisAngle(x.a,v);o.quaternion.copy(q).multiply(x.q0);o.position.copy(x.p0).sub(x.p).applyQuaternion(q).add(x.p)}
 else{o.position.copy(x.p0).addScaledVector(x.v,v)}
 o.updateMatrix();}

/* ---------- chiroq materiallari, yaltirash va nur ---------- */
const GL={head:[0xfff2c8,1.7],tail:[0xff1a10,.9],brake:[0xff1a10,2.4],rev:[0xffffff,1.8],ind_l:[0xff9a00,2.2],ind_r:[0xff9a00,2.2],fog:[0xfff6d0,1.4],dome:[0xffe9b0,1.3],dash:[0x4dff8f,1.4],dash_l:[0x39ff4a,2],dash_r:[0x39ff4a,2]};
let glowTex=null;
function gtex(){if(glowTex)return glowTex;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
 r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return glowTex=new THREE.CanvasTexture(c)}
function emMats(o){
 if(o.userData.carMats)return o.userData.carMats;
 o.userData.carOrig=o.material;
 const cv=m=>{if(m.isMeshStandardMaterial||m.isMeshPhongMaterial||m.isMeshLambertMaterial)return m.clone();
  const s=new THREE.MeshStandardMaterial({color:m.color?m.color.clone():0xffffff,map:m.map||null,opacity:m.opacity==null?1:m.opacity,transparent:!!m.transparent,side:m.side});s.name=m.name||'';return s};
 const a=[].concat(o.material).map(cv);o.material=Array.isArray(o.material)?a:a[0];return o.userData.carMats=a}
function unEm(o){if(o.userData.carMats){o.material=o.userData.carOrig;delete o.userData.carMats;delete o.userData.carOrig}}
function setupFx(){
 /* sprite va spotlarni qayta yaratish */
 CAR.fx.forEach(f=>{f.sp&&S.remove(f.sp);f.spot&&(S.remove(f.spot),S.remove(f.spot.target))});CAR.fx.clear();
 for(const role of Object.keys(GL))for(const o of parts(role)){
  let f=CAR.fx.get(o);if(!f){f={o,roles:[]};CAR.fx.set(o,f);emMats(o);
   const b=bsize(o),m=new THREE.SpriteMaterial({map:gtex(),color:0xffffff,blending:THREE.AdditiveBlending,transparent:true,opacity:0,depthWrite:false,depthTest:true});
   f.sp=new THREE.Sprite(m);f.sz=Math.max(b.eF,b.eR,b.eU)*(role=='dome'||role=='dash'||/^dash/.test(role)?1.6:2.6);S.add(f.sp);
   if(role=='head'){f.spot=new THREE.SpotLight(0xfff1d0,0,0,.5,.55,1);S.add(f.spot,f.spot.target)}}
  f.roles.push(role)}
 CAR.domeLight&&(S.remove(CAR.domeLight),CAR.domeLight=null);
 if(parts('dome').length||CAR.hasDome){CAR.domeLight=new THREE.PointLight(0xffe2a8,0,CAR.L*.9,1.5);S.add(CAR.domeLight)}}
function fxTick(now){
 const blink=((now/1000)*1.5)%1<.5,on={};
 const nb=!parts('brake').length;   /* alohida stop-signal qismi yo’q bo’lsa, orqa chiroq stop vazifasini ham bajaradi */
 on.head=CAR.head>0;on.fog=CAR.fog;on.tail=CAR.tail||CAR.head>0||(CAR.brake&&nb);on.brake=CAR.brake;on.rev=CAR.rev;
 const hz=CAR.ind==3;on.ind_l=(CAR.ind==1||hz)&&blink;on.ind_r=(CAR.ind==2||hz)&&blink;on.dome=CAR.dome;
 on.dash=CAR.engine;on.dash_l=on.ind_l;on.dash_r=on.ind_r;
 CAR.fx.forEach(f=>{
  if(!live(f.o))return;
  let best=null;f.roles.forEach(r=>{if(!on[r])return;let k=GL[r][1];if(r=='tail'&&CAR.brake&&nb)k=GL.brake[1];if(r=='head'&&CAR.head==2)k*=1.4;if(!best||k>best.k)best={c:GL[r][0],k}});
  const key=best?best.c+':'+best.k:'';
  if(f.last!==key){f.last=key;emMats(f.o).forEach(m=>{if(m.emissive){m.emissive.set(best?best.c:0);m.emissiveIntensity=best?best.k:0;m.needsUpdate=false}})}
  const c=wbox(f.o).getCenter(new V3());
  f.sp.position.copy(c);f.sp.scale.setScalar(f.sz*(best?1:.01));f.sp.material.opacity=best?Math.min(.85,.35+best.k*.22):0;if(best)f.sp.material.color.set(best.c);
  if(f.spot){f.spot.position.copy(c);f.spot.target.position.copy(c).addScaledVector(CAR.F,CAR.L*3);f.spot.target.updateMatrixWorld();
   f.spot.intensity=CAR.head==1?1.6:CAR.head==2?3.2:0;f.spot.angle=CAR.head==2?.42:.6}});
 if(CAR.domeLight){CAR.domeLight.position.copy(CAR.C).addScaledVector(UP,CAR.L*.12);CAR.domeLight.intensity=CAR.dome?1.2:0}}

/* ---------- animatsiya sikli ---------- */
let last=performance.now(),t0=0;
function step(c,t,dt,sp){const d=t-c;return Math.abs(d)<1e-4?t:c+Math.sign(d)*Math.min(Math.abs(d),dt*sp)}
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min(.1,(now-last)/1000);last=now;
 if(!any()||CAR.hold)return;
 if(CAR.demo){CAR.dp+=dt;CAR.speed=Math.round(110+105*Math.sin(CAR.dp*.5-1.57));CAR.engine=true;syncUi.speed&&syncUi.speed()}
 for(const k in CAR.T){const c=step(CAR.Cu[k],CAR.T[k],dt,2.4);if(c!==CAR.Cu[k]){CAR.Cu[k]=c;const e=c*c*(3-2*c),R=CAR.rigs[k.replace(/^(door|win|visor)_/,'$1_')];if(R)R.forEach(x=>applyRig(x,x.kind=='rot'?x.max*e:e))}}
 /* rul */
 (CAR.rigs.steer||[]).forEach(x=>applyRig(x,CAR.steer*D2R));
 /* artgich */
 const wt=CAR.wipe?(.5-.5*Math.cos(now/1000*(CAR.wipe==1?3.4:6.2))):0;CAR.wipeAmt=step(CAR.wipeAmt,wt,dt,CAR.wipe?8:1.4);
 ['wiper_l','wiper_r'].forEach(r=>(CAR.rigs[r]||[]).forEach(x=>applyRig(x,x.max*CAR.wipeAmt)));
 /* strelkalar */
 const sp=CAR.engine?CAR.speed:0,sw=CAR.sweep*D2R*CAR.dir*-1,idleT=CAR.engine?.12:0;
 const g=[0,30,60,100,150,200,260];let gi=0;while(gi<6&&sp>=g[gi+1])gi++;const rpm=CAR.engine?900+Math.min(1,(sp-g[gi])/(g[gi+1]-g[gi]))*3300+(sp>0?0:0):0;
 CAR.cs=step(CAR.cs||0,sp/260,dt,1.6);CAR.cr=step(CAR.cr||0,CAR.engine?rpm/8000:0,dt,2.4);
 (CAR.rigs.speedo||[]).forEach(x=>applyRig(x,sw*CAR.cs));(CAR.rigs.tacho||[]).forEach(x=>applyRig(x,sw*CAR.cr));
 fxTick(now);
}
requestAnimationFrame(frame);

/* ---------- avto-aniqlash ---------- */
const BAD=/_dam\b|_dam_|damaged|_vlo\b|_lo\b|lod\d|_l0\d|dummy/i;
function detect(){
 const all=meshes().filter(m=>!m.userData.dummy&&!BAD.test(m.name||'')&&m.geometry);
 if(!all.length)return 0;
 const map={};const add=(r,o)=>{(map[r]=map[r]||[]);if(!map[r].includes(o))map[r].push(o)};
 const nm=o=>(o.name||'')+' '+[].concat(o.material).map(m=>m&&m.name||'').join(' ');
 const kind={};
 const T=[
  ['bonnet',/bonnet|(?<![a-z])hood(?![a-z])|kapot/i],['boot',/(?<![a-z])boot(?![a-z])|trunk|bagaj|tailgate|hatch(?!_?roof)/i],
  ['roof',/sun.?roof|moon.?roof|roof.?(window|glass|hatch|slide)|lyuk|(?<![a-z])luk(?![a-z])/i],
  ['visor',/visor|sun.?shade|bakavoy|kozyr/i],['steer',/steer|(?<![a-z])rul(?![a-z])|volan|steering/i],['wiper',/wiper|wipe|artgich|dvornik/i],
  ['speedo',/speedo|spidom|spido|kmh|speed.?needle/i],['tacho',/tacho|revcount|rpm.?needle/i],
  ['dome',/dome|plafon|interior.?l(ight|amp)|cabin.?l(ight|amp)/i],
  ['dashind',/dash.*(arrow|turn|indic|signal)|(arrow|turn|indic|signal).*dash/i],['dash',/dash.*(light|lamp|led)|warning|telltale|panel.?(light|lamp)/i],
  ['rev',/rever|backup|back.?up|orqaga/i],['brake',/brake.?l|stop.?l|stoplight|(?<![a-z])stop(?![a-z])/i],
  ['ind',/indicator|turn.?sig|blink|signal|povor|(?<![a-z])turn(?![a-z])|flasher/i],['fog',/fog|tuman/i],
  ['head',/head.?(l|lamp)|headlight|front.?l(ight|amp)|(?<![a-z])fara(?![a-z])|(?<![a-z])hl(?![a-z])|lamp_?f/i],['tail',/tail.?l|rear.?l(ight|amp)|taillight|orqa.?chiroq/i],
  ['door',/door|eshik|dver/i],['window',/window|oyna|side.?glass|stekl/i]];
 const SKIP_DOOR=/handle|mirror|glass|window|lock|trim|strip|speaker|panel_|arm|hinge|seal/i;
 all.forEach(o=>{const n=nm(o);for(const [k,re] of T){if(re.test(n)){if(k=='door'&&SKIP_DOOR.test(n))continue;if(k=='window'&&/wind(screen|shield)|front|rear|back/i.test(n))continue;kind[o.uuid]=k;break}}});
 const byK=k=>all.filter(o=>kind[o.uuid]==k);
 /* old tomon: kapot/bagaj yoki chiroqlar */
 ['bonnet','boot','roof','steer','speedo','tacho','dome','dash'].forEach(k=>byK(k).forEach(o=>add(k,o)));
 ['head','tail','brake','rev','fog'].forEach(k=>byK(k).forEach(o=>add(k,o)));
 CAR.map=map;CAR.map.__tmp=1;delete CAR.map.__tmp;
 const keep=CAR.fw;resolveF();carCenter();
 const R=CAR.R,F=CAR.F,lat=o=>wbox(o).getCenter(new V3()).sub(CAR.C).dot(R),fwd=o=>wbox(o).getCenter(new V3()).sub(CAR.C).dot(F);
 /* eshiklar */
 const doors=byK('door');
 if(doors.length){
  const fs=doors.map(fwd),mn=Math.min(...fs),mx=Math.max(...fs),len=doors.reduce((a,o)=>a+bsize(o).eF,0)/doors.length,th=(mn+mx)/2,spread=mx-mn<len*.6;
  doors.forEach(o=>{const s=lat(o)<0?'l':'r',f=(spread||fwd(o)>=th)?'f':'r';add('door_'+s+f,o)})}
 byK('window').forEach(o=>{const s=lat(o)<0?'l':'r',f=fwd(o)>=CAR.C.clone().sub(CAR.C).dot(F)?'f':'r';add('win_'+s+f,o)});
 byK('visor').forEach(o=>add(lat(o)<0?'visor_l':'visor_r',o));
 byK('wiper').forEach(o=>add(lat(o)<0?'wiper_l':'wiper_r',o));
 byK('ind').forEach(o=>add(lat(o)<0?'ind_l':'ind_r',o));
 byK('dashind').forEach(o=>add(lat(o)<0?'dash_l':'dash_r',o));
 /* 2 eshikli mashina: bir tomonda 2 ta “old” eshik chiqsa — orqa deb ajratamiz */
 ['l','r'].forEach(s=>{const a=map['door_'+s+'f'];if(a&&a.length>1){const srt=a.slice().sort((x,y)=>fwd(y)-fwd(x));map['door_'+s+'f']=[srt[0]];map['door_'+s+'r']=(map['door_'+s+'r']||[]).concat(srt.slice(1))}});
 CAR.fw=keep;
 Object.values(map).forEach(a=>a.forEach(remember));
 CAR.map=map;return Object.values(map).reduce((a,x)=>a+x.length,0)}

/* ---------- qo’lda belgilash ---------- */
function assign(role,list){
 if(!list.length)return toast(L('Avval modelda qism(lar)ni tanlang','Select part(s) in the model first','Сначала выберите деталь(и) в модели'));
 restAll();const a=(CAR.map[role]=CAR.map[role]||[]);list.forEach(o=>{remember(o);if(!a.includes(o))a.push(o)});
 buildRigs();renderList();refreshUi()}
function unassign(role,o){const a=CAR.map[role];if(!a)return;rest(o);unEm(o);CAR.map[role]=a.filter(x=>x!==o);if(!CAR.map[role].length)delete CAR.map[role];buildRigs();renderList()}
function clearAll(){restAll();Object.values(CAR.map).forEach(a=>a.forEach(unEm));CAR.map={};CAR.rigs={};setupFx();renderList();refreshUi()}
function closeAll(){Object.keys(CAR.T).forEach(k=>CAR.T[k]=0);refreshUi()}

/* ---------- panel ---------- */
const P=$q('#carp');let syncUi={},tgs=[];
function el(tag,cls,txt,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;if(parent)parent.append(e);return e}
function sec(title,open){const d=el('details','pn');d.open=open!==false;el('summary',null,title,d);P.append(d);return d}
function grid(parent){return el('div','cg',null,parent)}
function toggle(parent,label,get,set){const b=el('button','cb',label,parent);b.onclick=()=>{set(!get());refreshUi()};tgs.push(()=>b.classList.toggle('on',!!get()));return b}
function sel(parent,label,opts,get,set){const w=el('label','cs',null,parent);el('span',null,label,w);const s=el('select',null,null,w);
 opts.forEach(([v,t])=>{const o=el('option',null,t,s);o.value=v});s.onchange=()=>{set(s.value);refreshUi()};tgs.push(()=>{if(document.activeElement!==s)s.value=get()});return s}
function range(parent,label,mn,mx,st,get,set,unit){const w=el('label','cs',null,parent),sp=el('span',null,label,w),r=el('input',null,null,w),o=el('output',null,null,w);
 r.type='range';r.min=mn;r.max=mx;r.step=st;r.oninput=()=>{set(+r.value);o.textContent=r.value+(unit||'')};
 const sync=()=>{if(document.activeElement!==r)r.value=get();o.textContent=Math.round(get())+(unit||'')};tgs.push(sync);return sync}
function refreshUi(){tgs.forEach(f=>f())}
function renderList(){
 const box=$q('#carl');if(!box)return;box.textContent='';
 const rows=ROLES.filter(([r])=>parts(r).length);
 if(!rows.length){el('div','ch',L('Belgilangan qism yo’q. “Avto-aniqlash” ni bosing yoki modelda qismni tanlab, rolni belgilang.','No parts assigned. Press “Auto-detect” or select a part in the model and assign a role.','Детали не назначены. Нажмите «Автоопределение» или выберите деталь и назначьте роль.'),box);return}
 rows.forEach(([r,l])=>{const d=el('div','cr',null,box);el('b',null,l,d);
  const w=el('span',null,null,d);parts(r).forEach(o=>{const c=el('i',null,(o.name||'mesh')+' ✕',w);c.title=L('Olib tashlash','Remove','Убрать');c.onclick=()=>unassign(r,o)})})}
function build(){
 if(!P)return;
 const s1=sec('Qismlar');
 const row=el('div','cg',null,s1);
 const bd=el('button','cb pri','Avto-aniqlash',row);bd.onclick=()=>{const n=detect();buildRigs();renderList();refreshUi();if(n)s1.open=false;toast(n?L(n+' ta qism topildi',n+' parts found',`Найдено деталей: ${n}`):L('Mashina qismlari topilmadi (nomlar tanish emas). Qismlarni qo’lda belgilang.','No car parts found (unfamiliar names). Assign parts manually.','Детали не найдены (незнакомые имена). Назначьте вручную.'))};
 const bc=el('button','cb','Tozalash',row);bc.onclick=clearAll;
 sel(s1,'Old tomon',[['auto','Avto'],['+z','Old: +Z'],['-z','Old: −Z'],['+x','Old: +X'],['-x','Old: −X']],()=>CAR.fw,v=>{CAR.fw=v;restAll();buildRigs()});
 const ar=el('div','cs rr',null,s1);const rs=el('select',null,null,ar);ROLES.forEach(([r,l])=>{const o=el('option',null,l,rs);o.value=r});
 const ab=el('button','cb',null,ar);ab.textContent='Tanlanganni belgilash';ab.onclick=()=>assign(rs.value,pickReal());
 el('div',null,null,s1).id='carl';renderList();
 const s2=sec('Eshik va kapotlar');const g2=grid(s2);
 ['door_lf','door_rf','door_lr','door_rr','bonnet','boot'].forEach(k=>toggle(g2,LBL[k],()=>CAR.T[k]>0,v=>CAR.T[k]=v?1:0));
 toggle(g2,'Hamma eshiklar',()=>['door_lf','door_rf','door_lr','door_rr'].every(k=>CAR.T[k]>0),v=>['door_lf','door_rf','door_lr','door_rr'].forEach(k=>CAR.T[k]=v?1:0));
 const s3=sec('Oynalar, lyuk, bakavoy');const g3=grid(s3);
 ['win_lf','win_rf','win_lr','win_rr','roof','visor_l','visor_r'].forEach(k=>toggle(g3,LBL[k],()=>CAR.T[k]>0,v=>CAR.T[k]=v?1:0));
 toggle(g3,'Hamma oynalar',()=>['win_lf','win_rf','win_lr','win_rr'].every(k=>CAR.T[k]>0),v=>['win_lf','win_rf','win_lr','win_rr'].forEach(k=>CAR.T[k]=v?1:0));
 const cl=el('button','cb','Hammasini yopish',s3);cl.style.margin='0 10px 8px';cl.onclick=closeAll;
 const s4=sec('Chiroqlar');
 sel(s4,'Fara rejimi',[['0','O’chiq'],['1','Yaqin'],['2','Uzoq']],()=>CAR.head,v=>CAR.head=+v);
 sel(s4,'Povorotnik',[['0','O’chiq'],['1','Chap'],['2','O’ng'],['3','Avariya']],()=>CAR.ind,v=>CAR.ind=+v);
 const g4=grid(s4);
 toggle(g4,'Gabarit (orqa chiroq)',()=>CAR.tail,v=>CAR.tail=v);toggle(g4,'Tormoz (stop-signal)',()=>CAR.brake,v=>CAR.brake=v);
 toggle(g4,'Orqaga yurish',()=>CAR.rev,v=>CAR.rev=v);toggle(g4,'Tuman chiroqlari',()=>CAR.fog,v=>CAR.fog=v);
 toggle(g4,'Salon chirog’i',()=>CAR.dome,v=>{CAR.dome=v;if(v&&!CAR.domeLight){CAR.hasDome=true;setupFx()}});
 const s5=sec('Rul, artgich, asboblar');
 range(s5,'Rul burchagi',-540,540,1,()=>CAR.steer,v=>CAR.steer=v,'°');
 sel(s5,'Artgich',[['0','O’chiq'],['1','Sekin'],['2','Tez']],()=>CAR.wipe,v=>CAR.wipe=+v);
 const g5=grid(s5);toggle(g5,'Dvigatel (panel yonadi)',()=>CAR.engine,v=>{CAR.engine=v;if(!v){CAR.demo=false;CAR.speed=0}});toggle(g5,'Demo haydash',()=>CAR.demo,v=>{CAR.demo=v;CAR.dp=0;if(v)CAR.engine=true});
 syncUi.speed=range(s5,'Tezlik',0,260,1,()=>CAR.speed,v=>{CAR.speed=v;if(v>0)CAR.engine=true},' km/h');
 range(s5,'Strelka yo’li (daraja)',90,360,5,()=>CAR.sweep,v=>CAR.sweep=v,'°');
 toggle(s5,'Teskari yo’nalish',()=>CAR.dir<0,v=>CAR.dir=v?-1:1).classList.add('cb');
 const gp=s5.querySelector('button.cb:last-child');if(gp)gp.style.margin='4px 10px 8px';
 P.append(s1);   /* “Qismlar” oxirida: avval boshqaruv tugmalari ko’rinadi */
 refreshUi();setInterval(refreshUi,400)}
build();

/* ---------- eksport paytida yopiq holat ---------- */
const ex=$q('#ex');
if(ex)ex.addEventListener('click',()=>{if(!any())return;CAR.hold=true;
 const snap=[];Object.values(CAR.map).forEach(a=>a.filter(live).forEach(o=>{snap.push([o,o.position.clone(),o.quaternion.clone()]);rest(o)}));
 CAR.fx.forEach(f=>{f.last='';emMats(f.o).forEach(m=>{if(m.emissive){m.emissive.set(0);m.emissiveIntensity=0}})});
 setTimeout(()=>{snap.forEach(([o,p,q])=>{o.position.copy(p);o.quaternion.copy(q)});CAR.hold=false},2500)},true);

/* ---------- menyu va yordamchi ---------- */
menu('Mashina',[['cdet','Avto-aniqlash',()=>{const n=detect();buildRigs();renderList();refreshUi();const b=document.querySelector('[data-ws=car]');b&&b.click();toast(n?L(n+' ta qism topildi',n+' parts found',`Найдено деталей: ${n}`):L('Mashina qismlari topilmadi (nomlar tanish emas). Qismlarni qo’lda belgilang.','No car parts found (unfamiliar names). Assign parts manually.','Детали не найдены (незнакомые имена). Назначьте вручную.'))}],
 ['cclose','Hammasini yopish',closeAll],['cclr','Tozalash',clearAll]]);
window.CarFX={detect,assign,clearAll,closeAll,CAR,buildRigs};
})();
