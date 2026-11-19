/* ---- Shakl bilan Detach (v0.0.71) ----
   Mesh ustiga chiziq, ramka, aylana, ellips, uchburchak, romb, olti burchak, yulduz, lasso (erkin shakl)
   yoki ko’pburchak chizib yuzlarni belgilaydi va yangi meshga ajratadi (Detach).
   Tanlash: “Ko’rinadigan” — ekranda ko’rinib turgan yuzlar (ID-bufer, boshqa meshlar to’sib turgani hisobga olinadi),
            “Orqasi bilan” — mesh orqasidagi yuzlar ham (X-ray).
   Qamrov:  Markaz ichida / To’liq ichida / Tegsa.  Chiziq asboblari har doim “Tegsa” (cho’tka qalinligi bilan).
   Shift — qo’shish, Alt/Ctrl — ayirish. O’ng/o’rta tugma — kamerani aylantirish (asbob ochiq bo’lsa ham). */
(function(){
'use strict';
if(typeof subGeo!=='function'||typeof faceMats!=='function'||typeof hist!=='function'||!window.THREE||typeof cv==='undefined'||typeof tc==='undefined')return;
const TH=window.THREE;
const TOOLS=[['line','╱','Chiziq'],['brush','✎','Erkin chiziq'],['rect','▭','Ramka'],['circle','◯','Aylana'],['ellipse','⬭','Ellips'],['tri','△','Uchburchak'],['diamond','◇','Romb'],['hex','⬡','Olti burchak'],['star','☆','Yulduz'],['lasso','➰','Lasso (erkin shakl)'],['poly','⬠','Ko’pburchak']];
const st={on:false,tool:'rect',nav:false,vis:true,cover:'center',w:14,mode:'new',m:null,nf:0,nf0:0,wg:null,exact:true,gid:'',fs:null,cnt:0,d:null,poly:null,mx:0,my:0,sw:0,pd:false,ov:null,idc:null,rt:null};
const isStroke=t=>t=='line'||t=='brush';

/* ---------- yordamchi: ekran fazosidagi geometriya ---------- */
const inPoly=(px,py,p)=>{let c=false;for(let i=0,j=p.length-2;i<p.length;i+=2){const xi=p[i],yi=p[i+1],xj=p[j],yj=p[j+1];if((yi>py)!=(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)c=!c;j=i}return c};
const inTri=(px,py,ax,ay,bx,by,cx,cy)=>{const d1=(px-bx)*(ay-by)-(ax-bx)*(py-by),d2=(px-cx)*(by-cy)-(bx-cx)*(py-cy),d3=(px-ax)*(cy-ay)-(cx-ax)*(py-ay);return !(((d1<0)||(d2<0)||(d3<0))&&((d1>0)||(d2>0)||(d3>0)))};
const segX=(ax,ay,bx,by,cx,cy,dx,dy)=>{const d1=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax),d2=(bx-ax)*(dy-ay)-(by-ay)*(dx-ax),d3=(dx-cx)*(ay-cy)-(dy-cy)*(ax-cx),d4=(dx-cx)*(by-cy)-(dy-cy)*(bx-cx);return((d1>0)!=(d2>0))&&((d3>0)!=(d4>0))};
const dPS=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=t<0?0:t>1?1:t;const qx=ax+t*dx-px,qy=ay+t*dy-py;return Math.sqrt(qx*qx+qy*qy)};
const dSS=(ax,ay,bx,by,cx,cy,dx,dy)=>segX(ax,ay,bx,by,cx,cy,dx,dy)?0:Math.min(dPS(ax,ay,cx,cy,dx,dy),dPS(bx,by,cx,cy,dx,dy),dPS(cx,cy,ax,ay,bx,by),dPS(dx,dy,ax,ay,bx,by));
const bbox=p=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;for(let i=0;i<p.length;i+=2){a=Math.min(a,p[i]);c=Math.max(c,p[i]);b=Math.min(b,p[i+1]);d=Math.max(d,p[i+1])}return[a,b,c,d]};
function ngon(cx,cy,rx,ry,n,a0){const p=[];for(let i=0;i<n;i++){const a=a0+i*2*Math.PI/n;p.push(cx+rx*Math.cos(a),cy+ry*Math.sin(a))}return p}
/* sudrash (drag) → yopiq shakl nuqtalari */
function dragPoly(t,x0,y0,x1,y1,shift){
 let a=Math.min(x0,x1),c=Math.max(x0,x1),b=Math.min(y0,y1),d=Math.max(y0,y1);
 if(shift&&t!='circle'){const s=Math.max(c-a,d-b);if(x1<x0)a=c-s;else c=a+s;if(y1<y0)b=d-s;else d=b+s}
 const cx=(a+c)/2,cy=(b+d)/2,rx=(c-a)/2,ry=(d-b)/2;
 switch(t){
  case'rect':return[a,b,c,b,c,d,a,d];
  case'circle':{const r=Math.hypot(x1-x0,y1-y0);return ngon(x0,y0,r,r,56,0)}
  case'ellipse':return ngon(cx,cy,rx,ry,56,0);
  case'tri':return[cx,b,c,d,a,d];
  case'diamond':return[cx,b,c,cy,cx,d,a,cy];
  case'hex':return ngon(cx,cy,rx,ry,6,0);
  case'star':{const p=[];for(let i=0;i<10;i++){const q=-Math.PI/2+i*Math.PI/5,k=i%2?.42:1;p.push(cx+rx*k*Math.cos(q),cy+ry*k*Math.sin(q))}return p}
 }return null}
/* joriy chizilayotgan shakl: {kind:'poly'|'stroke', pts, bb, r} yoki null */
function curShape(final){
 const d=st.d,P=st.poly;
 if(d){
  const t=d.t;
  if(t=='line')return{kind:'stroke',pts:[d.x0,d.y0,d.x1,d.y1],r:st.w/2};
  if(t=='brush')return{kind:'stroke',pts:d.pts.slice(),r:st.w/2};
  if(t=='lasso'){if(d.pts.length<6)return null;return{kind:'poly',pts:d.pts.slice()}}
  if(Math.hypot(d.x1-d.x0,d.y1-d.y0)<4)return null;
  const p=dragPoly(t,d.x0,d.y0,d.x1,d.y1,d.shift);return p?{kind:'poly',pts:p}:null}
 if(P&&P.length){const p=P.slice();if(!final)p.push(st.mx,st.my);return{kind:'poly',pts:p,open:!final}}
 return null}

/* ---------- target mesh va keshlar ---------- */
const okMesh=m=>!!(m&&m.isMesh&&!m.isSkinnedMesh&&!(m.userData&&m.userData.dummy)&&m.geometry&&m.geometry.getAttribute&&m.geometry.getAttribute('position')&&!m.geometry.getAttribute('skinIndex')&&!Object.keys(m.geometry.morphAttributes||{}).length);
const nfOf=g=>Math.floor((g.index?g.index.count:g.getAttribute('position').count)/3);
function disposeIds(){const c=st.idc;if(!c)return;c.geo.dispose();st.idc=null}
const G=()=>st.wg||(st.m&&st.m.geometry);
function dropWork(){if(st.wg){st.wg.dispose();st.wg=null}}
function retarget(){
 const m=okMesh(sel)?sel:null;
 if(m!==st.m||(m&&(m.geometry.uuid!==st.gid||nfOf(m.geometry)!==st.nf0))){
  st.m=m;st.d=null;st.poly=null;disposeIds();dropWork();
  if(m){st.gid=m.geometry.uuid;st.nf0=st.nf=nfOf(m.geometry);st.fs=new Uint8Array(st.nf)}else{st.gid='';st.nf0=st.nf=0;st.fs=null}
  st.cnt=0;rebuildOv()}
 if(st.on)tc.visible=false;
 info()}

/* ---------- ko’rinadigan yuzlar: ID-bufer ---------- */
const VS='attribute vec3 col;varying vec3 vc;void main(){vc=col;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const FS='varying vec3 vc;void main(){gl_FragColor=vec4(vc,1.0);}';
const BVS='void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',BFS='void main(){gl_FragColor=vec4(0.0,0.0,0.0,1.0);}';
let idMat=null,blackMat=null;
function renderIds(m){
 const g=G(),nf=st.nf;if(nf>1500000)return null;
 const P=g.getAttribute('position');
 if(!idMat){idMat=new TH.ShaderMaterial({vertexShader:VS,fragmentShader:FS,side:TH.DoubleSide});blackMat=new TH.ShaderMaterial({vertexShader:BVS,fragmentShader:BFS,side:TH.DoubleSide})}
 let c=st.idc;
 if(!c||c.gid!==g.uuid||c.nf!==nf||c.ver!==P.version||c.cnt!==P.count){
  disposeIds();
  const ix=g.index?g.index.array:null,pos=new Float32Array(nf*9),col=new Uint8Array(nf*9);
  for(let f=0;f<nf;f++){const id=f+1,r=id&255,gg=(id>>8)&255,b=(id>>16)&255;
   for(let j=0;j<3;j++){const v=ix?ix[f*3+j]:f*3+j,o=f*9+j*3;pos[o]=P.getX(v);pos[o+1]=P.getY(v);pos[o+2]=P.getZ(v);col[o]=r;col[o+1]=gg;col[o+2]=b}}
  const ig=new TH.BufferGeometry();ig.setAttribute('position',new TH.BufferAttribute(pos,3));ig.setAttribute('col',new TH.BufferAttribute(col,3,true));
  const mesh=new TH.Mesh(ig,idMat);mesh.frustumCulled=false;mesh.matrixAutoUpdate=false;
  const sc=new TH.Scene();sc.add(mesh);
  c=st.idc={gid:g.uuid,nf,ver:P.version,cnt:P.count,geo:ig,mesh,sc}}
 const sz=new TH.Vector2();R.getDrawingBufferSize(sz);
 const k=Math.min(1,1600/Math.max(sz.x,sz.y)),tw=Math.max(1,Math.round(sz.x*k)),th=Math.max(1,Math.round(sz.y*k));
 if(!st.rt||st.rt.width!==tw||st.rt.height!==th){st.rt&&st.rt.dispose();st.rt=new TH.WebGLRenderTarget(tw,th,{minFilter:TH.NearestFilter,magFilter:TH.NearestFilter,format:TH.RGBAFormat,type:TH.UnsignedByteType,depthBuffer:true})}
 m.updateWorldMatrix(true,false);c.mesh.matrix.copy(m.matrixWorld);c.mesh.matrixWorldNeedsUpdate=true;
 /* boshqa obyektlar (yordamchilar, to’r, gizmo) va target yashiriladi; qolgan meshlar faqat chuqurlikni to’sadi */
 const hid=[];S.children.forEach(o=>{if(o!==root&&o.visible){o.visible=false;hid.push(o)}});
 root.traverse(o=>{if(o.visible&&(o===m||(o.userData&&o.userData.dummy))){o.visible=false;hid.push(o)}});
 const oc=new TH.Color();R.getClearColor(oc);const oa=R.getClearAlpha(),oac=R.autoClear,oro=S.overrideMaterial,ort=R.getRenderTarget(),obg=S.background;
 const buf=new Uint8Array(tw*th*4);
 try{
  S.background=null;R.setRenderTarget(st.rt);R.setClearColor(0x000000,0);R.autoClear=true;
  S.overrideMaterial=blackMat;R.render(S,cam);S.overrideMaterial=oro;
  R.autoClear=false;R.render(c.sc,cam);
  R.readRenderTargetPixels(st.rt,0,0,tw,th,buf);
 }finally{R.setRenderTarget(ort);R.setClearColor(oc,oa);R.autoClear=oac;S.overrideMaterial=oro;S.background=obg;hid.forEach(o=>o.visible=true)}
 const vis=new Uint8Array(nf);
 for(let p=0;p<tw*th;p++){const id=buf[p*4]|(buf[p*4+1]<<8)|(buf[p*4+2]<<16);if(id>0&&id<=nf)vis[id-1]=1}
 return{buf,tw,th,vis}}

/* ---------- ekranga proyeksiya ---------- */
function project(m){
 const P=G().getAttribute('position'),n=P.count,r=cv.getBoundingClientRect(),W=r.width,H=r.height;
 m.updateWorldMatrix(true,false);cam.updateMatrixWorld();
 const M=new TH.Matrix4().multiplyMatrices(cam.projectionMatrix,new TH.Matrix4().copy(cam.matrixWorld).invert()).multiply(m.matrixWorld),e=M.elements;
 const X=new Float32Array(n),Y=new Float32Array(n),V=new Uint8Array(n);
 for(let i=0;i<n;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),w=e[3]*x+e[7]*y+e[11]*z+e[15];if(w<=1e-6)continue;
  X[i]=((e[0]*x+e[4]*y+e[8]*z+e[12])/w*.5+.5)*W;Y[i]=(1-((e[1]*x+e[5]*y+e[9]*z+e[13])/w*.5+.5))*H;V[i]=1}
 return{X,Y,V,W,H}}

/* ---------- shakl bo’yicha yuzlarni tanlash ---------- */
function testFn(sh,cover){
 const p=sh.pts,bb=sh.bb=bbox(p);
 if(sh.kind=='stroke'){
  const r=sh.r,n=p.length/2;
  return(ax,ay,bx,by,cx,cy)=>{
   if(Math.max(ax,bx,cx)<bb[0]-r||Math.min(ax,bx,cx)>bb[2]+r||Math.max(ay,by,cy)<bb[1]-r||Math.min(ay,by,cy)>bb[3]+r)return false;
   const mx=(ax+bx+cx)/3,my=(ay+by+cy)/3;
   for(let i=0;i<Math.max(1,n-1);i++){
    const x0=p[i*2],y0=p[i*2+1],x1=n>1?p[i*2+2]:x0,y1=n>1?p[i*2+3]:y0;
    if(cover=='center'){if(dPS(mx,my,x0,y0,x1,y1)<=r)return true;continue}
    if(Math.max(x0,x1)<Math.min(ax,bx,cx)-r||Math.min(x0,x1)>Math.max(ax,bx,cx)+r||Math.max(y0,y1)<Math.min(ay,by,cy)-r||Math.min(y0,y1)>Math.max(ay,by,cy)+r)continue;
    if(inTri(x0,y0,ax,ay,bx,by,cx,cy)||inTri(x1,y1,ax,ay,bx,by,cx,cy))return true;
    if(dSS(x0,y0,x1,y1,ax,ay,bx,by)<=r||dSS(x0,y0,x1,y1,bx,by,cx,cy)<=r||dSS(x0,y0,x1,y1,cx,cy,ax,ay)<=r)return true}
   return false}}
 const M=p.length/2;
 return(ax,ay,bx,by,cx,cy)=>{
  if(Math.max(ax,bx,cx)<bb[0]||Math.min(ax,bx,cx)>bb[2]||Math.max(ay,by,cy)<bb[1]||Math.min(ay,by,cy)>bb[3])return false;
  if(cover=='center')return inPoly((ax+bx+cx)/3,(ay+by+cy)/3,p);
  if(cover=='in')return inPoly(ax,ay,p)&&inPoly(bx,by,p)&&inPoly(cx,cy,p);
  if(inPoly(ax,ay,p)||inPoly(bx,by,p)||inPoly(cx,cy,p))return true;
  for(let i=0;i<M;i++)if(inTri(p[i*2],p[i*2+1],ax,ay,bx,by,cx,cy))return true;
  for(let i=0;i<M;i++){const j=(i+1)%M,x0=p[i*2],y0=p[i*2+1],x1=p[j*2],y1=p[j*2+1];
   if(segX(x0,y0,x1,y1,ax,ay,bx,by)||segX(x0,y0,x1,y1,bx,by,cx,cy)||segX(x0,y0,x1,y1,cx,cy,ax,ay))return true}
  return false}}
/* ---------- ANIQ KESISH: shakl chizig’i kesib o’tgan uchburchaklar bo’linadi (qirra tekis chiqadi) ----------
   Chegara uchburchaklari qirralarining o’rtasidan bo’linadi (kerak bo’lsa ~1 piksel aniqlikkacha, 6 darajagacha);
   qo’shni uchburchaklar bir xil qirrani bo’ladi (yoriq/T-tugun bo’lmaydi). Yangi uchlarda atributlar (UV, normal…) interpolyatsiya qilinadi. */
function refineGeo(g,sh,fs){
 const m=st.m,P=g.getAttribute('position'),nv0=P.count;
 if(nv0>3000000)return null;
 const names=Object.keys(g.attributes),A=names.map(n=>g.attributes[n]),ix=g.index?g.index.array:null,nf0=st.nf;
 m.updateWorldMatrix(true,false);cam.updateMatrixWorld();
 const e=new TH.Matrix4().multiplyMatrices(cam.projectionMatrix,new TH.Matrix4().copy(cam.matrixWorld).invert()).multiply(m.matrixWorld).elements,rc=cv.getBoundingClientRect(),W=rc.width,H=rc.height;
 const SX=[],SY=[],SV=[],SW=[],VK=[],kmap=new Map(),ext=A.map(()=>[]),pi=names.indexOf('position'),ni=names.indexOf('normal');
 const attr=(q,v,c)=>v<nv0?A[q].array[v*A[q].itemSize+c]:ext[q][(v-nv0)*A[q].itemSize+c];
 const addV=(x,y,z)=>{const w=e[3]*x+e[7]*y+e[11]*z+e[15];SW.push(w);if(w<=1e-6){SX.push(0);SY.push(0);SV.push(0)}else{SX.push(((e[0]*x+e[4]*y+e[8]*z+e[12])/w*.5+.5)*W);SY.push((1-((e[1]*x+e[5]*y+e[9]*z+e[13])/w*.5+.5))*H);SV.push(1)}
  const k=Math.round(x*1e5)+','+Math.round(y*1e5)+','+Math.round(z*1e5);let id=kmap.get(k);if(id===undefined){id=kmap.size;kmap.set(k,id)}VK.push(id)};
 for(let i=0;i<nv0;i++)addV(P.getX(i),P.getY(i),P.getZ(i));
 let nv=nv0;const fm0=faceMats(g);
 let T=[],TM=[],TS=[];for(let f=0;f<nf0;f++){for(let j=0;j<3;j++)T.push(ix?ix[f*3+j]:f*3+j);TM.push(fm0[f]);TS.push(f)}
 const p=sh.pts,bb=sh.bb||(sh.bb=bbox(p)),stroke=sh.kind=='stroke',r=sh.r||0,M=p.length/2;
 const dPoly=(x,y)=>{let d=1e9;for(let i=0;i<Math.max(1,M-1);i++){const x1=M>1?p[i*2+2]:p[0],y1=M>1?p[i*2+3]:p[1];d=Math.min(d,dPS(x,y,p[i*2],p[i*2+1],x1,y1))}return d};
 const cross=(ax,ay,bx,by,cx,cy)=>{
  const t0=Math.min(ax,bx,cx),t1=Math.max(ax,bx,cx),u0=Math.min(ay,by,cy),u1=Math.max(ay,by,cy),rr=stroke?r:0;
  if(t1<bb[0]-rr||t0>bb[2]+rr||u1<bb[1]-rr||u0>bb[3]+rr)return false;
  if(stroke){
   if(dPoly(ax,ay)<=r&&dPoly(bx,by)<=r&&dPoly(cx,cy)<=r)return false;
   for(let i=0;i<Math.max(1,M-1);i++){const x0=p[i*2],y0=p[i*2+1],x1=M>1?p[i*2+2]:x0,y1=M>1?p[i*2+3]:y0;
    if(inTri(x0,y0,ax,ay,bx,by,cx,cy)||inTri(x1,y1,ax,ay,bx,by,cx,cy))return true;
    if(dSS(x0,y0,x1,y1,ax,ay,bx,by)<=r||dSS(x0,y0,x1,y1,bx,by,cx,cy)<=r||dSS(x0,y0,x1,y1,cx,cy,ax,ay)<=r)return true}
   return false}
  const n=(inPoly(ax,ay,p)?1:0)+(inPoly(bx,by,p)?1:0)+(inPoly(cx,cy,p)?1:0);
  if(n==1||n==2)return true;
  if(n==0)for(let i=0;i<M;i++)if(inTri(p[i*2],p[i*2+1],ax,ay,bx,by,cx,cy))return true;
  for(let i=0;i<M;i++){const j=(i+1)%M,x0=p[i*2],y0=p[i*2+1],x1=p[j*2],y1=p[j*2+1];
   if(segX(x0,y0,x1,y1,ax,ay,bx,by)||segX(x0,y0,x1,y1,bx,by,cx,cy)||segX(x0,y0,x1,y1,cx,cy,ax,ay))return true}
  return false};
 const ek=(a,b)=>{const u=VK[a],v=VK[b];return u<v?u*8388608+v:v*8388608+u};
 const mid=new Map(),MIN=stroke?4:3,BUDGET=Math.max(300000,nf0*2.5);let did=false;
 /* qirra bo’yicha chegara kesishi: faqat ko’pburchakda; c=1 bo’lsa aniq t (3D parametr) */
 let ecache=new Map();
 const einfo=(a,b)=>{const k=ek(a,b),lo=VK[a]<=VK[b]?a:b,hi=lo===a?b:a;let r=ecache.get(k);
  if(!r){r={c:stroke?2:0,tc:.5};
   if(!stroke&&SV[lo]&&SV[hi]){const x0=SX[lo],y0=SY[lo],x1=SX[hi],y1=SY[hi];
    if(!(Math.max(x0,x1)<bb[0]||Math.min(x0,x1)>bb[2]||Math.max(y0,y1)<bb[1]||Math.min(y0,y1)>bb[3])){
     let c=0,s1=.5;
     for(let i=0;i<M;i++){const j=(i+1)%M,px0=p[i*2],py0=p[i*2+1],px1=p[j*2],py1=p[j*2+1];
      const d=(x1-x0)*(py1-py0)-(y1-y0)*(px1-px0);if(Math.abs(d)<1e-9)continue;
      const s=((px0-x0)*(py1-py0)-(py0-y0)*(px1-px0))/d,u=((px0-x0)*(y1-y0)-(py0-y0)*(x1-x0))/d;
      if(s>1e-4&&s<1-1e-4&&u>=0&&u<1){c++;s1=s}}
     r.c=c;if(c==1){const wa=SW[lo],wb=SW[hi];r.tc=s1*wa/((1-s1)*wb+s1*wa)}}}
   ecache.set(k,r)}
  return{c:r.c,t:VK[a]<=VK[b]?r.tc:1-r.tc}};
 const tOf=(a,b)=>{const i=einfo(a,b);return i.c===1?i.t:.5};
 const midv=(a,b)=>{const k=a<b?a*16777216+b:b*16777216+a;let id=mid.get(k);if(id!==undefined)return id;id=nv++;mid.set(k,id);const t=tOf(a,b);
  A.forEach((at,q)=>{const sz=at.itemSize,o=[];for(let c=0;c<sz;c++){const va=attr(q,a,c),vb=attr(q,b,c);o.push(va+(vb-va)*t)}
   if(q===ni){const l=Math.hypot(o[0],o[1],o[2])||1;o[0]/=l;o[1]/=l;o[2]/=l}o.forEach(v=>ext[q].push(v))});
  const n=ext[pi].length/3-1;addV(ext[pi][n*3],ext[pi][n*3+1],ext[pi][n*3+2]);return id};
 let TD=new Array(T.length/3).fill(0);
 for(let lv=0;lv<6;lv++){
  ecache=new Map();
  const nT=T.length/3,marked=new Set(),exact=new Set();
  for(let f=0;f<nT;f++){
   if(TD[f])continue;
   const a=T[f*3],b=T[f*3+1],c=T[f*3+2];if(!(SV[a]&&SV[b]&&SV[c]))continue;
   const ax=SX[a],ay=SY[a],bx=SX[b],by=SY[b],cx=SX[c],cy=SY[c];
   if(!cross(ax,ay,bx,by,cx,cy))continue;
   if(!stroke){
    const i0=einfo(a,b),i1=einfo(b,c),i2=einfo(c,a);
    if(i0.c+i1.c+i2.c===2&&i0.c<2&&i1.c<2&&i2.c<2){
     let pin=false;for(let i=0;i<M&&!pin;i++)if(inTri(p[i*2],p[i*2+1],ax,ay,bx,by,cx,cy))pin=true;
     if(!pin){if(i0.c)marked.add(ek(a,b));if(i1.c)marked.add(ek(b,c));if(i2.c)marked.add(ek(c,a));exact.add(f);continue}}}
   if(Math.max(Math.max(ax,bx,cx)-Math.min(ax,bx,cx),Math.max(ay,by,cy)-Math.min(ay,by,cy))<=MIN)continue;
   if(!stroke){ /* faqat chegara kesib o’tgan qirralar (aniq nuqtada) bo’linadi; hech biri kesilmasa — hammasi */
    const i0=einfo(a,b),i1=einfo(b,c),i2=einfo(c,a);
    if(i0.c||i1.c||i2.c){if(i0.c)marked.add(ek(a,b));if(i1.c)marked.add(ek(b,c));if(i2.c)marked.add(ek(c,a));continue}}
   marked.add(ek(a,b));marked.add(ek(b,c));marked.add(ek(c,a))}
  if(!marked.size||nT+marked.size*2>BUDGET)break;
  const T2=[],M2=[],S2=[],D2=[];
  for(let f=0;f<nT;f++){
   const a=T[f*3],b=T[f*3+1],c=T[f*3+2],m0=marked.has(ek(a,b)),m1=marked.has(ek(b,c)),m2=marked.has(ek(c,a)),mt=TM[f],sr=TS[f];
   const n=m0+m1+m2,dn=(exact.has(f)&&n===2)?1:TD[f];
   const push=(x,y,z)=>{T2.push(x,y,z);M2.push(mt);S2.push(sr);D2.push(dn)};
   if(!n){push(a,b,c);continue}
   did=true;const ab=m0?midv(a,b):-1,bc=m1?midv(b,c):-1,ca=m2?midv(c,a):-1;
   if(n==3){push(a,ab,ca);push(ab,b,bc);push(ca,bc,c);push(ab,bc,ca)}
   else if(n==1){if(m0){push(a,ab,c);push(ab,b,c)}else if(m1){push(b,bc,a);push(bc,c,a)}else{push(c,ca,b);push(ca,a,b)}}
   else if(!m2){push(ab,b,bc);push(a,ab,bc);push(a,bc,c)}
   else if(!m0){push(bc,c,ca);push(b,bc,ca);push(b,ca,a)}
   else{push(ca,a,ab);push(ab,b,c);push(ab,c,ca)}}
  T=T2;TM=M2;TS=S2;TD=D2}
 if(!did)return null;
 /* yangi geometriya: material bo’yicha tartiblab guruhlanadi */
 const nF=T.length/3,order=Array.from({length:nF},(_,i)=>i);
 if(g.groups.length)order.sort((a,b)=>TM[a]-TM[b]||a-b);
 const o=new TH.BufferGeometry();
 names.forEach((nm,q)=>{const at=A[q],sz=at.itemSize,arr=new at.array.constructor(nv*sz);arr.set(at.array.subarray?at.array.subarray(0,nv0*sz):at.array);
  const ex=ext[q];for(let i=0;i<ex.length;i++)arr[nv0*sz+i]=ex[i];o.setAttribute(nm,new TH.BufferAttribute(arr,sz,at.normalized))});
 const idx=new(nv>65535?Uint32Array:Uint16Array)(nF*3),src=new Int32Array(nF);
 order.forEach((f,i)=>{idx[i*3]=T[f*3];idx[i*3+1]=T[f*3+1];idx[i*3+2]=T[f*3+2];src[i]=TS[f]});
 o.setIndex(new TH.BufferAttribute(idx,1));
 if(g.groups.length)for(let i=0;i<nF;){let j=i;while(j<nF&&TM[order[j]]===TM[order[i]])j++;o.addGroup(i*3,(j-i)*3,TM[order[i]]);i=j}
 o.computeBoundingBox();o.computeBoundingSphere();
 return{g:o,src}}

/* yuz tanlovidagi “qoldiq”lar: butunlay tanlangan yuzlar bilan o’ralgan tanlanmagan yuzlarni to’ldiradi */
function fillHoles(){
 const g=G(),P=g.getAttribute('position'),ix=g.index?g.index.array:null,nf=st.nf;if(!st.cnt||nf>800000)return;
 const mp=new Map(),u=new Int32Array(P.count);
 for(let i=0;i<P.count;i++){const k=Math.round(P.getX(i)*1e5)+','+Math.round(P.getY(i)*1e5)+','+Math.round(P.getZ(i)*1e5);let id=mp.get(k);if(id===undefined){id=mp.size;mp.set(k,id)}u[i]=id}
 const E=new Map(),V=(f,j)=>u[ix?ix[f*3+j]:f*3+j],ekk=(a,b)=>a<b?a*8388608+b:b*8388608+a;
 for(let f=0;f<nf;f++)for(let j=0;j<3;j++){const k=ekk(V(f,j),V(f,(j+1)%3));const l=E.get(k);l?l.push(f):E.set(k,[f])}
 let add=0;
 for(let it=0;it<4;it++){let ch=0;
  for(let f=0;f<nf;f++){if(st.fs[f])continue;let nb=0,sl=0;
   for(let j=0;j<3;j++){const l=E.get(ekk(V(f,j),V(f,(j+1)%3)));for(const q of l)if(q!==f){nb++;if(st.fs[q])sl++}}
   if(nb>=2&&sl===nb){st.fs[f]=1;ch++}}
  add+=ch;if(!ch)break}
 if(add){let c=0;for(let f=0;f<nf;f++)c+=st.fs[f];st.cnt=c}}

function pickFaces(sh){
 const m=st.m,cover=isStroke(st.tool)||sh.kind=='stroke'?'touch':st.cover;
 let ids=null;if(st.vis){ids=renderIds(m);if(!ids)toast('Mesh juda katta — “Orqasi bilan” rejimi ishlatildi')}
 const exact=st.exact&&(sh.kind=='stroke'||cover!=='touch');
 if(exact){
  /* 1) chegara uchburchaklarini bo’lish  2) yangi yuzlarni markaz bo’yicha tasniflash (ko’rinishlik ota-yuzdan meros) */
  const rf=refineGeo(G(),sh,st.fs);
  let vis=ids?ids.vis:null,g2=G();
  if(rf){
   const nfs=new Uint8Array(rf.src.length),nv=vis?new Uint8Array(rf.src.length):null;
   for(let f=0;f<nfs.length;f++){nfs[f]=st.fs[rf.src[f]];if(nv)nv[f]=vis[rf.src[f]]}
   dropWork();disposeIds();st.wg=rf.g;st.nf=rf.src.length;st.fs=nfs;vis=nv;g2=rf.g;st.cnt=0;for(let f=0;f<st.nf;f++)st.cnt+=nfs[f]}
  const nf=st.nf,hit=new Uint8Array(nf),pr=project(m),ix=g2.index?g2.index.array:null,{X,Y,V}=pr,p=sh.pts,M=p.length/2,r=sh.r||0;
  for(let f=0;f<nf;f++){
   if(vis&&!vis[f])continue;
   const a=ix?ix[f*3]:f*3,b=ix?ix[f*3+1]:f*3+1,c=ix?ix[f*3+2]:f*3+2;if(!(V[a]&&V[b]&&V[c]))continue;
   const mx=(X[a]+X[b]+X[c])/3,my=(Y[a]+Y[b]+Y[c])/3;
   if(sh.kind=='stroke'){let d=1e9;for(let i=0;i<Math.max(1,M-1);i++){const x1=M>1?p[i*2+2]:p[0],y1=M>1?p[i*2+3]:p[1];d=Math.min(d,dPS(mx,my,p[i*2],p[i*2+1],x1,y1))}if(d<=r)hit[f]=1}
   else if(inPoly(mx,my,p))hit[f]=1}
  return hit}
 const g=G(),nf=st.nf,hit=new Uint8Array(nf),test=testFn(sh,cover);
 if(ids&&cover=='touch'){ /* piksel bo’yicha: shakl niqobi ∩ ID-bufer */
  const{buf,tw,th}=ids,r=cv.getBoundingClientRect(),sx=tw/r.width,sy=th/r.height,c=document.createElement('canvas');c.width=tw;c.height=th;
  const x=c.getContext('2d',{willReadFrequently:true});x.setTransform(sx,0,0,sy,0,0);x.fillStyle=x.strokeStyle='#fff';
  const p=sh.pts;x.beginPath();x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);
  if(sh.kind=='stroke'){if(p.length==2)x.lineTo(p[0]+.01,p[1]);x.lineWidth=sh.r*2;x.lineCap=x.lineJoin='round';x.stroke()}else{x.closePath();x.fill()}
  const md=x.getImageData(0,0,tw,th).data;
  for(let y=0;y<th;y++){const by=(th-1-y)*tw;for(let xx=0;xx<tw;xx++){if(md[(y*tw+xx)*4+3]<40)continue;const q=(by+xx)*4,id=buf[q]|(buf[q+1]<<8)|(buf[q+2]<<16);if(id>0&&id<=nf)hit[id-1]=1}}
  return hit}
 const pr=project(m),ix=g.index?g.index.array:null,{X,Y,V}=pr,vis=ids?ids.vis:null;
 for(let f=0;f<nf;f++){
  if(vis&&!vis[f])continue;
  const a=ix?ix[f*3]:f*3,b=ix?ix[f*3+1]:f*3+1,c=ix?ix[f*3+2]:f*3+2;
  if(!(V[a]&&V[b]&&V[c]))continue;
  if(test(X[a],Y[a],X[b],Y[b],X[c],Y[c]))hit[f]=1}
 return hit}

/* ---------- tanlovni qo’llash, ajratib ko’rsatish ---------- */
function applyHit(hit,mode){
 const fs=st.fs,n=fs.length;if(hit.length!==n)return;
 if(mode=='new')fs.fill(0);
 if(mode=='sub'){for(let f=0;f<n;f++)if(hit[f])fs[f]=0}else{for(let f=0;f<n;f++)if(hit[f])fs[f]=1;fillHoles()}
 recount()}
function recount(){let c=0;for(let f=0;f<st.fs.length;f++)c+=st.fs[f];st.cnt=c;rebuildOv();info()}
function rebuildOv(){
 if(st.ov){S.remove(st.ov);st.ov.geometry.dispose();st.ov=null}
 const m=st.m;if(!m||!st.cnt)return;
 const g=G(),P=g.getAttribute('position'),ix=g.index?g.index.array:null,pos=new Float32Array(st.cnt*9);let o=0;
 for(let f=0;f<st.nf;f++){if(!st.fs[f])continue;for(let j=0;j<3;j++){const v=ix?ix[f*3+j]:f*3+j;pos[o++]=P.getX(v);pos[o++]=P.getY(v);pos[o++]=P.getZ(v)}}
 const og=new TH.BufferGeometry();og.setAttribute('position',new TH.BufferAttribute(pos,3));
 const ov=new TH.Mesh(og,new TH.MeshBasicMaterial({color:0xff9a1f,transparent:true,opacity:.6,side:TH.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
 ov.matrixAutoUpdate=false;ov.frustumCulled=false;ov.renderOrder=8;ov.userData.sdOverlay=true;S.add(ov);st.ov=ov;syncOv()}
function syncOv(){if(st.ov&&st.m){st.m.updateWorldMatrix(true,false);st.ov.matrix.copy(st.m.matrixWorld);st.ov.matrixWorldNeedsUpdate=true}}
function linked(){ /* tanlangan yuzlar tegishli bog’langan qismlarni to’liq tanlash */
 if(!st.cnt||typeof islands!=='function')return toast('Avval yuz tanlang');
 const is=islands(G());let add=0;
 is.forEach(l=>{if(l.some(f=>st.fs[f])){l.forEach(f=>{if(!st.fs[f]){st.fs[f]=1;add++}})}});
 recount();toast('Bog’langan qismlar qo’shildi: +'+add+' yuz')}
function invert(){if(!st.fs)return;for(let f=0;f<st.fs.length;f++)st.fs[f]^=1;recount()}
function resetWork(){ /* ishchi (kesilgan) geometriyani tashlab, asl mesh yuzlariga qaytadi */
 if(!st.m)return;dropWork();disposeIds();st.nf=st.nf0;st.fs=new Uint8Array(st.nf);st.cnt=0}
function clearSel(){if(!st.fs)return;if(st.wg){resetWork();rebuildOv();info();return}st.fs.fill(0);recount()}

/* ---------- Detach ---------- */
function detach(copy){
 const m=st.m;if(!m)return toast('Avval mesh tanlang');
 if(!st.cnt)return toast('Avval shakl chizib yuz tanlang');
 const g=G(),nf=st.nf,fm=faceMats(g),mats=[].concat(m.material),A=[],B=[];
 for(let f=0;f<nf;f++)(st.fs[f]?A:B).push(f);
 if(!copy&&!B.length)return toast('Hamma yuz tanlangan — ajratgandan keyin hech narsa qolmaydi');
 const pick=s=>{const mm=s.mats.map(k=>mats[Math.min(k,mats.length-1)]);return mm.length==1?mm[0]:mm};
 const sA=subGeo(g,A,fm),nm=new TH.Mesh(sA.g,pick(sA));
 const par=m.parent,base=m.name+'_ajratma';let n=1,name=base+'_1';while(par.children.some(o=>o.name===name))name=base+'_'+(++n);
 nm.name=name;nm.position.copy(m.position);nm.quaternion.copy(m.quaternion);nm.scale.copy(m.scale);nm.visible=m.visible;nm.castShadow=m.castShadow;nm.receiveShadow=m.receiveShadow;
 const oG=m.geometry,oM=m.material;let nG=oG,nM=oM;
 if(!copy){const sB=subGeo(g,B,fm);nG=sB.g;nM=pick(sB)}
 const set=(geo,mat,add)=>{m.geometry=geo;m.material=mat;if(add)par.add(nm);else par.remove(nm);refresh();if(st.on)retarget()};
 set(nG,nM,true);
 hist(()=>set(oG,oM,false),()=>set(nG,nM,true));
 clearSel();
 toast((copy?'Nusxa ajratildi: ':'Detach: ')+A.length+' ta yuz → “'+name+'”'+(copy?'':' (qolgan: '+B.length+')'))}

/* ---------- ko’rinish: asboblar paneli ---------- */
const css=document.createElement('style');
css.textContent='#sd-bar{position:absolute;left:56px;top:36px;z-index:4;display:flex;flex-direction:column;gap:5px;padding:7px 8px;background:#2a2a2af2;border:1px solid var(--bd,#161616);border-radius:6px;font-size:12px;width:238px;max-height:calc(100% - 48px);overflow:auto;box-shadow:0 6px 24px #0008}#sd-bar[hidden]{display:none}'
+'#sd-bar .r{display:flex;flex-wrap:wrap;gap:4px;align-items:center}#sd-bar .r.t{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}#sd-bar b{color:var(--or,#ffa028);letter-spacing:.4px;flex:1}#sd-bar .i{color:var(--mt,#9a9a9a);width:100%}'
+'#sd-bar button{background:var(--ip,#545454);color:var(--tx,#e6e6e6);border:1px solid #0006;border-radius:4px;padding:4px 7px;cursor:pointer;font:inherit}#sd-bar button:hover{background:#666}#sd-bar button.on{background:var(--ac,#4772b3);border-color:var(--ac,#4772b3);color:#fff}#sd-bar button:disabled{opacity:.4;cursor:default}'
+'#sd-bar .tb{display:flex;flex-direction:column;align-items:center;padding:3px 1px;line-height:1.1;min-width:0}#sd-bar .tb i{font-style:normal;font-size:19px;line-height:1.1}#sd-bar .tb span{font-size:9.5px;opacity:.85;text-align:center}'
+'#sd-bar .pri{background:var(--or,#ffa028);color:#1d1d1d;font-weight:700;border-color:var(--or,#ffa028);flex:1 1 100%}#sd-bar .pri:hover{background:#ffb44f}'
+'#sd-bar label{color:var(--mt,#9a9a9a);min-width:58px}#sd-bar input[type=number]{width:52px;background:var(--bd,#161616);color:var(--tx,#e6e6e6);border:1px solid #0008;border-radius:4px;padding:3px 4px}#sd-bar .h{font-size:10.5px;color:var(--mt,#9a9a9a);line-height:1.35}#sd-bar .no{color:#ff9a8a}'
+'#sd-bar.min>.r:not(.hd),#sd-bar.min>.h{display:none}#sd-bar.min{width:auto;min-width:150px}'
+'#sd-ov{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3}body.sd-on #c{cursor:crosshair}';
document.head.append(css);
const bar=document.createElement('div');bar.id='sd-bar';bar.hidden=true;
const mk=(tag,txt,cls,fn,title)=>{const e=document.createElement(tag);if(txt!=null)e.textContent=txt;if(cls)e.className=cls;if(fn)e.onclick=fn;if(title)e.title=title;return e};
const row=(...els)=>{const r=mk('div',null,'r');r.append(...els);bar.append(r);return r};
const tbtn={};
const rT=mk('div',null,'r t');TOOLS.forEach(([k,g,t])=>{const b=mk('button',null,'tb',()=>setTool(k),t);b.append(mk('i',g),mk('span',t));tbtn[k]=b;rT.append(b)});
const hd=row(mk('b','SHAKL BILAN DETACH'),mk('button','▾',null,()=>bar.classList.toggle('min'),'Yig’ish / ochish'),mk('button','✕',null,()=>close(),'Yopish (Esc)'));hd.classList.add('hd');
const infoEl=mk('span','','i');const ir=row(infoEl);ir.classList.add('hd');
bar.append(rT);
const seg=(arr,get,set)=>{const bs=arr.map(([v,t,ti])=>mk('button',t,null,()=>{set(v);sync()},ti));bs.forEach((b,i)=>b._v=arr[i][0]);return{bs,get}};
const gVis=seg([[true,'Ko’rinadigan','Faqat ekranda ko’rinib turgan yuzlar (boshqa meshlar to’ssa — tanlanmaydi)'],[false,'Orqasi bilan','Mesh orqasidagi (ko’rinmaydigan) yuzlar ham']],()=>st.vis,v=>st.vis=v);
const gCov=seg([['center','Markaz','Yuz markazi shakl ichida'],['in','To’liq','Yuzning uchala uchi shakl ichida'],['touch','Tegsa','Shakl yuzga tegsa ham']],()=>st.cover,v=>st.cover=v);
const gMode=seg([['new','Yangi','Oldingi tanlovni almashtiradi'],['add','+ Qo’sh','Shift'],['sub','− Ayir','Alt / Ctrl']],()=>st.mode,v=>st.mode=v);
const wI=mk('input');wI.type='number';wI.min=2;wI.max=200;wI.value=st.w;wI.oninput=()=>{st.w=Math.max(2,Math.min(200,+wI.value||14));draw()};
const exB=mk('button','✂ Aniq kesish','',()=>{st.exact=!st.exact;sync()},'Yoqilsa, shakl chizig’i kesib o’tgan uchburchaklar bo’linadi — qirra tekis chiqadi, qoldiq qolmaydi. “Tegsa” rejimida ishlamaydi.');
const navB=mk('button','✥ Aylantirish','',()=>{st.nav=!st.nav;st.d=null;sync()},'Yoqilsa, sichqoncha/barmoq bilan kamerani aylantirasiz (chizmaysiz)');
row(mk('label','Ko’rinish:'),...gVis.bs,mk('span',null,'sep'),mk('label','Qamrov:'),...gCov.bs);
row(mk('label','Qalinlik (px):'),wI,mk('span',null,'sep'),navB);
row(exB);
row(mk('label','Tanlov:'),...gMode.bs,mk('span',null,'sep'),mk('button','Bog’langan (L)','',linked,'Tanlangan yuzlar tegishli butun bog’langan qismni tanlash'),mk('button','Teskari (Ctrl+I)','',invert),mk('button','Tozalash','',clearSel));
row(mk('button','Detach — yangi mesh (Enter)','pri',()=>detach(false)),mk('button','Nusxa sifatida','',()=>detach(true),'Asl meshdan yuzlarni olib tashlamasdan nusxasini ajratadi'));
const hint=mk('div','Chizing: Shift — qo’shish, Alt — ayirish. O’ng/o’rta tugma — kamera. Ko’pburchak: bosib nuqta qo’ying, Enter/ikki marta bosish — yopish.','h');bar.append(hint);
const ov=document.createElement('canvas');ov.id='sd-ov';
vp.append(ov,bar);
function setTool(k){st.tool=k;st.d=null;st.poly=null;sync();draw()}
function sync(){
 TOOLS.forEach(([k])=>tbtn[k].classList.toggle('on',st.tool==k));
 [gVis,gCov,gMode].forEach(g=>g.bs.forEach(b=>b.classList.toggle('on',g.get()===b._v)));
 const sk=isStroke(st.tool);gCov.bs.forEach(b=>{b.disabled=sk;b.style.opacity=sk?.4:1});wI.disabled=!sk;wI.style.opacity=sk?1:.4;
 navB.classList.toggle('on',st.nav);exB.classList.toggle('on',st.exact);document.body.classList.toggle('sd-on',st.on&&!st.nav);info()}
function info(){
 if(!st.on)return;
 infoEl.className='i'+(st.m?'':' no');
 infoEl.textContent=st.m?('Tanlangan: '+st.cnt+' / '+st.nf+' yuz'):'Avval bitta mesh tanlang'+(sel&&!okMesh(sel)?' (suyakli/morph mesh yoki dummy qo’llanmaydi)':'')}

/* ---------- chizish (preview) ---------- */
function draw(){
 const r=vp.getBoundingClientRect(),dpr=devicePixelRatio||1,w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);
 if(ov.width!==w||ov.height!==h){ov.width=w;ov.height=h}
 const x=ov.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,r.width,r.height);
 const sh=st.on&&!st.nav?curShape(false):null;if(!sh)return;
 const cr=cv.getBoundingClientRect();x.translate(cr.left-r.left,cr.top-r.top);
 const p=sh.pts;x.lineJoin=x.lineCap='round';
 if(sh.kind=='stroke'){
  x.beginPath();x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);if(p.length==2)x.lineTo(p[0]+.01,p[1]);
  x.strokeStyle='rgba(255,160,40,.35)';x.lineWidth=sh.r*2;x.stroke();x.strokeStyle='#ffa028';x.lineWidth=1.5;x.stroke();return}
 x.beginPath();x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);if(!sh.open)x.closePath();
 x.fillStyle='rgba(255,160,40,.14)';if(!sh.open)x.fill();x.setLineDash([6,4]);x.strokeStyle='#ffa028';x.lineWidth=1.6;x.stroke();x.setLineDash([]);
 if(st.poly){x.fillStyle='#fff';for(let i=0;i<st.poly.length;i+=2){x.beginPath();x.arc(st.poly[i],st.poly[i+1],i?3:5,0,7);x.fill()}}}

/* ---------- sichqoncha / klaviatura ---------- */
const rel=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
const modeOf=e=>e.shiftKey?'add':(e.altKey||e.ctrlKey||e.metaKey)?'sub':st.mode;
function finish(shape,mode){
 if(!shape||!st.m)return;
 if(mode=='new'&&st.wg)resetWork();
 const t0=performance.now();let hit;
 try{hit=pickFaces(shape)}catch(err){console.error(err);return toast('Tanlashda xato: '+(err&&err.message||err))}
 applyHit(hit,mode);
 if(!st.cnt)toast('Shakl ichida yuz topilmadi — “Orqasi bilan” yoki “Tegsa” ni sinab ko’ring')}
function down(e){
 if(!st.on||st.nav||e.button!==0||e.target!==cv)return;
 e.preventDefault();e.stopImmediatePropagation();st.sw=performance.now();st.pd=true;
 retarget();if(!st.m)return toast('Avval bitta oddiy mesh tanlang');
 const[x,y]=rel(e);
 if(st.tool=='poly'){return}
 try{cv.setPointerCapture(e.pointerId)}catch(_){}
 st.d={t:st.tool,x0:x,y0:y,x1:x,y1:y,pts:[x,y],shift:false,id:e.pointerId};draw()}
function move(e){
 if(!st.on||st.nav)return;
 const[x,y]=rel(e);st.mx=x;st.my=y;
 if(st.d){
  e.stopImmediatePropagation();const d=st.d;d.x1=x;d.y1=y;d.shift=e.shiftKey&&!isStroke(d.t)&&d.t!='lasso';
  if(d.t=='brush'||d.t=='lasso'){const n=d.pts.length,mn=d.t=='brush'?Math.max(2.5,st.w*.25):3;if(Math.hypot(x-d.pts[n-2],y-d.pts[n-1])>=mn)d.pts.push(x,y)}
  draw()}else if(st.poly)draw()}
function up(e){
 if(!st.on||st.nav||!st.pd||e.button!==0)return;
 e.stopImmediatePropagation();st.pd=false;
 const[x,y]=rel(e);
 if(st.d){
  const d=st.d;d.x1=x;d.y1=y;d.shift=e.shiftKey&&!isStroke(d.t)&&d.t!='lasso';
  if(d.t=='brush'||d.t=='lasso')d.pts.push(x,y);
  const sh=curShape(true);st.d=null;draw();
  try{cv.releasePointerCapture(d.id)}catch(_){}
  finish(sh,modeOf(e));return}
 if(st.tool=='poly'&&st.m){
  const P=st.poly||(st.poly=[]),n=P.length;
  if(n>=6&&Math.hypot(x-P[0],y-P[1])<10){closePoly(e);return}
  if(n>=2&&Math.hypot(x-P[n-2],y-P[n-1])<6){if(n>=6){closePoly(e);return}}
  else P.push(x,y);
  st.mx=x;st.my=y;draw()}}
function closePoly(e){const sh=st.poly&&st.poly.length>=6?curShape(true):null;st.poly=null;draw();if(sh)finish(sh,modeOf(e||{}));else toast('Ko’pburchak uchun kamida 3 nuqta kerak')}
function key(e){
 if(!st.on||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 const k=e.key.toLowerCase(),eat=()=>{e.preventDefault();e.stopImmediatePropagation()};
 if(k=='escape'){eat();if(st.d||st.poly){st.d=null;st.poly=null;draw()}else if(st.cnt)clearSel();else close();return}
 if(k=='enter'){eat();if(st.poly&&st.poly.length>=6)closePoly(e);else detach(false);return}
 if(k=='backspace'&&st.poly){eat();st.poly.length>=2&&st.poly.splice(-2,2);if(!st.poly.length)st.poly=null;draw();return}
 if(k=='l'&&!e.ctrlKey&&!e.metaKey){eat();linked();return}
 if(k=='i'&&e.ctrlKey){eat();invert();return}
 if(k=='a'&&e.altKey){eat();clearSel();return}}
vp.addEventListener('pointerdown',down,true);
vp.addEventListener('pointermove',move,true);
vp.addEventListener('pointerup',up,true);
vp.addEventListener('click',e=>{if(st.on&&!st.nav&&e.target===cv&&performance.now()-st.sw<1500){e.stopImmediatePropagation()}},true);
addEventListener('keydown',key,true);
vp.addEventListener('contextmenu',e=>{if(st.on&&st.d)e.preventDefault()});

/* ---------- ochish / yopish ---------- */
function open(){
 if(st.on)return close();
 if(window.em&&typeof editOff==='function')editOff();
 st.on=true;bar.hidden=false;retarget();sync();draw();
 if(!st.m)toast('Avval bitta mesh tanlang (Outliner’da bosing)');
 else toast('Shakl tanlang va mesh ustiga chizing — yuzlar belgilanadi, so’ng Enter (Detach)');
 const b=$('#sdet');b&&b.classList.add('on')}
function close(){
 if(!st.on)return;st.on=false;st.d=null;st.poly=null;bar.hidden=true;document.body.classList.remove('sd-on');
 if(st.ov){S.remove(st.ov);st.ov.geometry.dispose();st.ov=null}
 st.cnt=0;st.fs=null;st.m=null;st.gid='';disposeIds();dropWork();if(st.rt){st.rt.dispose();st.rt=null}
 draw();tc.visible=true;sel&&tc.attach(sel)
 const b=$('#sdet');b&&b.classList.remove('on')}
/* tanlov o’zgarsa — yangi mesh target bo’ladi */
const s0=select;select=o=>{s0(o);if(st.on){retarget();draw()}};
/* har kadrda: overlay mesh target bilan birga yuradi; edit rejimi yoqilsa asbob yopiladi */
(function loop(){requestAnimationFrame(loop);if(!st.on)return;if(window.em){close();return}syncOv();if(tc.visible)tc.visible=false})();
const btn=$('#sdet');if(btn)btn.onclick=open;
window.openShapeDetach=open;
})();
