/* ---- LOW → HQ avtomobil va mesh sifatini oshirish moduli ---- */
(function(rootScope){
'use strict';

function getT(T){
 return T||(typeof rootScope!=='undefined'&&rootScope.THREE)||(typeof THREE!=='undefined'?THREE:null);
}
const g_meshes=()=>typeof rootScope.meshes==='function'?rootScope.meshes():(typeof meshes==='function'?meshes():[]);
const g_real=()=>typeof rootScope.pickReal==='function'?rootScope.pickReal():(typeof rootScope.real==='function'?rootScope.real():(typeof real==='function'?real():[]));
const g_tex=()=>rootScope.tex||(typeof tex!=='undefined'?tex:null);
const g_env=()=>rootScope.ENV||(typeof ENV!=='undefined'?ENV:null);
const g_toast=m=>{if(typeof rootScope.toast==='function')rootScope.toast(m);else if(typeof toast==='function')toast(m)};
const g_refresh=()=>{if(typeof rootScope.refresh==='function')rootScope.refresh();else if(typeof refresh==='function')refresh()};
const g_applyTex=()=>{if(typeof rootScope.applyTex==='function')rootScope.applyTex();else if(typeof applyTex==='function')applyTex()};
const g_texList=()=>{if(typeof rootScope.texList==='function')rootScope.texList();else if(typeof texList==='function')texList()};

/* Bir xil joydagi uchlarni aniqlash va degenerat uchburchaklarni tozalash */
function hqClean(g,T){
 T=getT(T);
 const P=g.getAttribute('position');
 if(!P||P.count<3)return g.clone();
 const N=g.getAttribute('normal'),U=g.getAttribute('uv');
 const ix=g.index?g.index.array:null,nf=Math.floor((ix?ix.length:P.count)/3),I=i=>ix?ix[i]:i;
 const fm=new Uint16Array(nf);
 if(g.groups&&g.groups.length){
  g.groups.forEach(r=>{
   const end=Math.min(nf,Math.ceil((r.start+r.count)/3));
   for(let f=Math.floor(r.start/3);f<end;f++)fm[f]=r.materialIndex||0;
  });
 }
 const mp=new Map(),src=[],idx=[],trisByMat=new Map();
 const q=(v,s)=>Math.round(v*s);
 for(let f=0;f<nf;f++){
  const i0=I(f*3),i1=I(f*3+1),i2=I(f*3+2);
  const ax=P.getX(i0),ay=P.getY(i0),az=P.getZ(i0);
  const bx=P.getX(i1),by=P.getY(i1),bz=P.getZ(i1);
  const cx=P.getX(i2),cy=P.getY(i2),cz=P.getZ(i2);
  const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az;
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  if(nx*nx+ny*ny+nz*nz<1e-20)continue;
  const vIds=[];
  for(const vi of[i0,i1,i2]){
   const key=q(P.getX(vi),1e4)+','+q(P.getY(vi),1e4)+','+q(P.getZ(vi),1e4)
    +(U?','+q(U.getX(vi),1e4)+','+q(U.getY(vi),1e4):'')
    +(N?','+q(N.getX(vi),50)+','+q(N.getY(vi),50)+','+q(N.getZ(vi),50):'');
   let id=mp.get(key);
   if(id===undefined){id=src.length;mp.set(key,id);src.push(vi)}
   vIds.push(id);
  }
  if(vIds[0]===vIds[1]||vIds[1]===vIds[2]||vIds[0]===vIds[2])continue;
  const mi=fm[f];
  let arr=trisByMat.get(mi);
  if(!arr){arr=[];trisByMat.set(mi,arr)}
  arr.push(vIds[0],vIds[1],vIds[2]);
 }
 if(!src.length)return g.clone();
 const out=new T.BufferGeometry();
 for(const name in g.attributes){
  const a=g.attributes[name],s=a.itemSize,arr=new a.array.constructor(src.length*s);
  for(let j=0;j<src.length;j++){
   const si=src[j]*s;
   for(let c=0;c<s;c++)arr[j*s+c]=a.array[si+c];
  }
  out.setAttribute(name,new T.BufferAttribute(arr,s,a.normalized));
 }
 const mats=[...trisByMat.keys()].sort((a,b)=>a-b);
 mats.forEach(mi=>{
  const a=trisByMat.get(mi),st=idx.length;
  for(let k=0;k<a.length;k++)idx.push(a[k]);
  if(g.groups&&g.groups.length)out.addGroup(st,a.length,mi);
 });
 out.setIndex(new T.BufferAttribute(new(src.length>65535?Uint32Array:Uint16Array)(idx),1));
 out.computeBoundingBox();out.computeBoundingSphere();
 return out;
}

/* Maydon va burchak bo’yicha vaznlangan silliq normallar (qirra burchagidan kattasi o’tkir qoladi) */
function hqNormals(g,creaseDeg,T){
 T=getT(T);
 creaseDeg=creaseDeg==null?48:creaseDeg;
 const P=g.getAttribute('position');
 if(!P||P.count<3)return g.clone();
 const n=P.count,ix=g.index?g.index.array:null,nf=Math.floor((ix?ix.length:n)/3),I=i=>ix?ix[i]:i;
 if(!nf)return g.clone();
 const cosA=Math.cos(creaseDeg*Math.PI/180);
 const fn=new Float32Array(nf*3),fa=new Float32Array(nf);
 const posKey=i=>Math.round(P.getX(i)*1e4)+','+Math.round(P.getY(i)*1e4)+','+Math.round(P.getZ(i)*1e4);
 const spMap=new Map(),spOf=new Uint32Array(n);let spCount=0;
 for(let i=0;i<n;i++){
  const k=posKey(i);let id=spMap.get(k);
  if(id===undefined){id=spCount++;spMap.set(k,id)}
  spOf[i]=id;
 }
 const spFaces=Array.from({length:spCount},()=>[]);
 for(let f=0;f<nf;f++){
  const i0=I(f*3),i1=I(f*3+1),i2=I(f*3+2);
  const ax=P.getX(i0),ay=P.getY(i0),az=P.getZ(i0);
  const bx=P.getX(i1)-ax,by=P.getY(i1)-ay,bz=P.getZ(i1)-az;
  const cx=P.getX(i2)-ax,cy=P.getY(i2)-ay,cz=P.getZ(i2)-az;
  const nx=by*cz-bz*cy,ny=bz*cx-bx*cz,nz=bx*cy-by*cx;
  const len=Math.hypot(nx,ny,nz);
  fa[f]=len;
  if(len>1e-12){fn[f*3]=nx/len;fn[f*3+1]=ny/len;fn[f*3+2]=nz/len}
  spFaces[spOf[i0]].push(f);
  spFaces[spOf[i1]].push(f);
  spFaces[spOf[i2]].push(f);
 }
 const cn=new Float32Array(nf*9);
 for(let f=0;f<nf;f++){
  const fx=fn[f*3],fy=fn[f*3+1],fz=fn[f*3+2];
  for(let j=0;j<3;j++){
   const lst=spFaces[spOf[I(f*3+j)]];
   let sx=0,sy=0,sz=0;
   for(let k=0;k<lst.length;k++){
    const h=lst[k],d=fx*fn[h*3]+fy*fn[h*3+1]+fz*fn[h*3+2];
    if(d>=cosA-1e-6){
     const w=fa[h]||1;
     sx+=fn[h*3]*w;sy+=fn[h*3+1]*w;sz+=fn[h*3+2]*w;
    }
   }
   const L=Math.hypot(sx,sy,sz)||1;
   cn[f*9+j*3]=sx/L;cn[f*9+j*3+1]=sy/L;cn[f*9+j*3+2]=sz/L;
  }
 }
 const o=new T.BufferGeometry();
 for(const name in g.attributes){
  if(name==='normal')continue;
  const at=g.attributes[name],s=at.itemSize,arr=new at.array.constructor(nf*3*s);
  for(let i=0;i<nf*3;i++){
   const si=I(i)*s;
   for(let k=0;k<s;k++)arr[i*s+k]=at.array[si+k];
  }
  o.setAttribute(name,new T.BufferAttribute(arr,s,at.normalized));
 }
 o.setAttribute('normal',new T.BufferAttribute(cn,3));
 if(g.groups)g.groups.forEach(r=>o.addGroup(r.start,r.count,r.materialIndex));
 return hqClean(o,T);
}

/* Qirralarni saqlovchi silliq subdivision (Curved PN-Triangle midpoint + crease threshold):
   - Tekis yuzalar tekis qoladi
   - O’tkir burchaklar (eshik choki, bamper qirrasi, oyna romi) yumshab ketmaydi
   - Egri kuzov panellari, g’ildirak arkalari va shinalar silliq va zich bo’ladi, hajm kichraymaydi */
function hqSubdivideOnce(g,creaseDeg,T){
 T=getT(T);
 creaseDeg=creaseDeg==null?48:creaseDeg;
 const P=g.getAttribute('position'),U=g.getAttribute('uv');
 if(!P||P.count<3)return g.clone();
 const n=P.count,ix=g.index?g.index.array:null,nf=Math.floor((ix?ix.length:n)/3),I=i=>ix?ix[i]:i;
 if(!nf)return g.clone();
 const cosA=Math.cos(creaseDeg*Math.PI/180);

 /* Fazoviy tugunlar (pozitsiya bo’yicha, UV choki bo’yicha emas) */
 const posKey=i=>Math.round(P.getX(i)*1e4)+','+Math.round(P.getY(i)*1e4)+','+Math.round(P.getZ(i)*1e4);
 const spMap=new Map(),spOf=new Uint32Array(n);let spCount=0;
 for(let i=0;i<n;i++){
  const k=posKey(i);let id=spMap.get(k);
  if(id===undefined){id=spCount++;spMap.set(k,id)}
  spOf[i]=id;
 }

 /* Har uchburchak uchun material indeksi va normali */
 const fm=new Uint16Array(nf);
 if(g.groups&&g.groups.length){
  g.groups.forEach(r=>{
   const end=Math.min(nf,Math.ceil((r.start+r.count)/3));
   for(let f=Math.floor(r.start/3);f<end;f++)fm[f]=r.materialIndex||0;
  });
 }
 const fn=new Float32Array(nf*3),fa=new Float32Array(nf);
 const spFaces=Array.from({length:spCount},()=>[]);
 for(let f=0;f<nf;f++){
  const i0=I(f*3),i1=I(f*3+1),i2=I(f*3+2);
  const ax=P.getX(i0),ay=P.getY(i0),az=P.getZ(i0);
  const bx=P.getX(i1)-ax,by=P.getY(i1)-ay,bz=P.getZ(i1)-az;
  const cx=P.getX(i2)-ax,cy=P.getY(i2)-ay,cz=P.getZ(i2)-az;
  const nx=by*cz-bz*cy,ny=bz*cx-bx*cz,nz=bx*cy-by*cx;
  const len=Math.hypot(nx,ny,nz);
  fa[f]=len;
  if(len>1e-12){fn[f*3]=nx/len;fn[f*3+1]=ny/len;fn[f*3+2]=nz/len}
  spFaces[spOf[i0]].push(f);
  spFaces[spOf[i1]].push(f);
  spFaces[spOf[i2]].push(f);
 }

 /* Fazoviy qirra xaritasi: dihedral burchak va chegara qirralarini aniqlash */
 const edgeMap=new Map();
 const eKey=(a,b)=>a<b?a+'_'+b:b+'_'+a;
 for(let f=0;f<nf;f++){
  const vs=[spOf[I(f*3)],spOf[I(f*3+1)],spOf[I(f*3+2)]];
  for(let j=0;j<3;j++){
   const k=eKey(vs[j],vs[(j+1)%3]);
   let arr=edgeMap.get(k);if(!arr){arr=[];edgeMap.set(k,arr)}
   arr.push(f);
  }
 }

 const cornerNormal=(f,spId)=>{
  const fx=fn[f*3],fy=fn[f*3+1],fz=fn[f*3+2];
  const lst=spFaces[spId];
  let sx=0,sy=0,sz=0;
  for(let k=0;k<lst.length;k++){
   const h=lst[k],d=fx*fn[h*3]+fy*fn[h*3+1]+fz*fn[h*3+2];
   if(d>=cosA-1e-6){
    const w=fa[h]||1;
    sx+=fn[h*3]*w;sy+=fn[h*3+1]*w;sz+=fn[h*3+2]*w;
   }
  }
  const L=Math.hypot(sx,sy,sz)||1;
  return[sx/L,sy/L,sz/L];
 };

 /* Silliq qirra o’rta nuqtalari uchun kesh */
 const smoothEdgeMid=new Map();
 const getEdgeMid=(f,iA,iB)=>{
  const sa=spOf[iA],sb=spOf[iB],ek=eKey(sa,sb);
  const ax=P.getX(iA),ay=P.getY(iA),az=P.getZ(iA);
  const bx=P.getX(iB),by=P.getY(iB),bz=P.getZ(iB);
  const mx=0.5*(ax+bx),my=0.5*(ay+by),mz=0.5*(az+bz);
  const adj=edgeMap.get(ek);
  if(!adj||adj.length!==2)return[mx,my,mz];
  if(smoothEdgeMid.has(ek))return smoothEdgeMid.get(ek);
  const f0=adj[0],f1=adj[1];
  const dx=bx-ax,dy=by-ay,dz=bz-az;
  const edgeLen=Math.hypot(dx,dy,dz);
  const sheetOff=(fi)=>{
   const nA=cornerNormal(fi,sa),nB=cornerNormal(fi,sb);
   const diff=Math.hypot(nA[0]-nB[0],nA[1]-nB[1],nA[2]-nB[2]);
   if(diff<0.04)return null;
   const wAB=dx*nA[0]+dy*nA[1]+dz*nA[2];
   const wBA=(-dx)*nB[0]+(-dy)*nB[1]+(-dz)*nB[2];
   return[-0.14*(wAB*nA[0]+wBA*nB[0]),-0.14*(wAB*nA[1]+wBA*nB[1]),-0.14*(wAB*nA[2]+wBA*nB[2])];
  };
  const dot=fn[f0*3]*fn[f1*3]+fn[f0*3+1]*fn[f1*3+1]+fn[f0*3+2]*fn[f1*3+2];
  let ox=0,oy=0,oz=0;
  if(dot>=cosA&&fm[f0]===fm[f1]){
   const o=sheetOff(f0)||sheetOff(f1);
   if(o){ox=o[0];oy=o[1];oz=o[2]}
  }else{
   /* Qirra chegara (masalan g'ildirak shinasi va yon devori): egri tomon siljishini tekis tomon tekisligiga proyeksiya qilamiz */
   const o0=sheetOff(f0),o1=sheetOff(f1);
   if(o0&&!o1){
    const nx=fn[f1*3],ny=fn[f1*3+1],nz=fn[f1*3+2],d=o0[0]*nx+o0[1]*ny+o0[2]*nz;
    ox=o0[0]-d*nx;oy=o0[1]-d*ny;oz=o0[2]-d*nz;
   }else if(o1&&!o0){
    const nx=fn[f0*3],ny=fn[f0*3+1],nz=fn[f0*3+2],d=o1[0]*nx+o1[1]*ny+o1[2]*nz;
    ox=o1[0]-d*nx;oy=o1[1]-d*ny;oz=o1[2]-d*nz;
   }else if(o0&&o1){
    ox=0.5*(o0[0]+o1[0]);oy=0.5*(o0[1]+o1[1]);oz=0.5*(o0[2]+o1[2]);
   }
  }
  const oLen=Math.hypot(ox,oy,oz),lim=edgeLen*0.25;
  if(oLen>lim&&oLen>1e-12){const k=lim/oLen;ox*=k;oy*=k;oz*=k}
  const res=[mx+ox,my+oy,mz+oz];
  smoothEdgeMid.set(ek,res);
  return res;
 };

 const hasUV=!!U;
 const posOut=new Float32Array(nf*4*9);
 const uvOut=hasUV?new Float32Array(nf*4*6):null;
 const matBins=new Map();
 let triIdx=0;

 const pushTri=(p0,p1,p2,u0,u1,u2,mi)=>{
  const pOff=triIdx*9;
  posOut[pOff]=p0[0];posOut[pOff+1]=p0[1];posOut[pOff+2]=p0[2];
  posOut[pOff+3]=p1[0];posOut[pOff+4]=p1[1];posOut[pOff+5]=p1[2];
  posOut[pOff+6]=p2[0];posOut[pOff+7]=p2[1];posOut[pOff+8]=p2[2];
  if(uvOut){
   const uOff=triIdx*6;
   uvOut[uOff]=u0[0];uvOut[uOff+1]=u0[1];
   uvOut[uOff+2]=u1[0];uvOut[uOff+3]=u1[1];
   uvOut[uOff+4]=u2[0];uvOut[uOff+5]=u2[1];
  }
  matBins.set(mi,(matBins.get(mi)||0)+1);
  triIdx++;
 };

 /* Material guruhlari tartibini saqlash uchun f ni material bo’yicha saralaymiz */
 const order=[];
 for(let f=0;f<nf;f++)order.push(f);
 if(g.groups&&g.groups.length>1)order.sort((a,b)=>fm[a]-fm[b]||a-b);

 for(let k=0;k<order.length;k++){
  const f=order[k],mi=fm[f];
  const i0=I(f*3),i1=I(f*3+1),i2=I(f*3+2);
  const p0=[P.getX(i0),P.getY(i0),P.getZ(i0)];
  const p1=[P.getX(i1),P.getY(i1),P.getZ(i1)];
  const p2=[P.getX(i2),P.getY(i2),P.getZ(i2)];
  const m01=getEdgeMid(f,i0,i1),m12=getEdgeMid(f,i1,i2),m20=getEdgeMid(f,i2,i0);
  let u0,u1,u2,u01,u12,u20;
  if(hasUV){
   u0=[U.getX(i0),U.getY(i0)];u1=[U.getX(i1),U.getY(i1)];u2=[U.getX(i2),U.getY(i2)];
   u01=[(u0[0]+u1[0])*0.5,(u0[1]+u1[1])*0.5];
   u12=[(u1[0]+u2[0])*0.5,(u1[1]+u2[1])*0.5];
   u20=[(u2[0]+u0[0])*0.5,(u2[1]+u0[1])*0.5];
  }
  pushTri(p0,m01,m20,u0,u01,u20,mi);
  pushTri(m01,p1,m12,u01,u1,u12,mi);
  pushTri(m20,m12,p2,u20,u12,u2,mi);
  pushTri(m01,m12,m20,u01,u12,u20,mi);
 }

 const rawGeo=new T.BufferGeometry();
 rawGeo.setAttribute('position',new T.BufferAttribute(posOut,3));
 if(uvOut)rawGeo.setAttribute('uv',new T.BufferAttribute(uvOut,2));
 if(g.groups&&g.groups.length){
  let start=0;
  [...matBins.entries()].sort((a,b)=>a[0]-b[0]).forEach(([mi,cnt])=>{
   rawGeo.addGroup(start,cnt*3,mi);
   start+=cnt*3;
  });
 }
 return hqNormals(rawGeo,creaseDeg,T);
}

function hqSubdivide(geo,opts,T){
 T=getT(T);
 opts=opts||{};
 const levels=Math.max(0,Math.min(3,opts.levels==null?1:opts.levels|0));
 const creaseDeg=opts.creaseDeg==null?48:+opts.creaseDeg;
 const maxTris=opts.maxTris||90000;
 const triCount=g=>{const ix=g.index;return Math.floor((ix?ix.count:g.getAttribute('position').count)/3)};
 let cur=hqClean(geo,T),done=0;
 for(let l=0;l<levels;l++){
  const t=triCount(cur);
  if(t*4>maxTris)break;
  cur=hqSubdivideOnce(cur,creaseDeg,T);
  done++;
 }
 if(!done){
  cur=hqNormals(cur,creaseDeg,T);
 }
 return{geometry:cur,levelsApplied:done,trisBefore:triCount(geo),trisAfter:triCount(cur)};
}

/* Avtomobil qism turini nomi/materiali/teksturasiga ko’ra aniqlash */
function hqClassifyPart(meshName,matName,texName){
 const s=(String(meshName||'')+' '+String(matName||'')+' '+String(texName||'')).toLowerCase();
 if(/windscreen|windshield|glass|window|oyna|stekl|shisha|tint|visorglass|sunroof/.test(s))return'glass';
 if(/headlight|head_light|fara|taillight|tail_light|brakelight|stop|indicator|povorot|lamp|light/.test(s)){
  return /tail|brake|stop|rear/.test(s)?'taillight':'headlight';
 }
 if(/tire|tyre|rubber|shina|rezin|tread/.test(s))return'tire';
 if(/chrome|xrom|exhaust|glush|muffler|trim|emblem|badge|logo|mirror|handle|grill|grille|rad/.test(s))return'chrome';
 if(/wheel|rim|disk|hub|caliper|alloy/.test(s))return'wheel_rim';
 if(/seat|interior|salon|dash|carpet|steer|leather|panel|cabin/.test(s))return'interior';
 if(/chassis|body|bodyshell|door|bonnet|hood|boot|trunk|fender|wing|bumper|bump|roof|kuzov|kapot|bagaj|eshik/.test(s))return'body';
 return'default';
}

function hqCreateMaterial(origMat,partKind,envMap,T){
 T=getT(T);
 const hasTex=!!(origMat&&(origMat.map||(origMat.userData&&origMat.userData.tex)));
 const baseCol=origMat&&origMat.color?origMat.color.clone():new T.Color(0xd8dde6);
 const m=new T.MeshStandardMaterial({
  color:hasTex?new T.Color(0xffffff):baseCol,
  map:(origMat&&origMat.map)||null,
  side:(origMat&&origMat.side!=null)?origMat.side:T.DoubleSide,
  roughness:0.35,
  metalness:0.25,
  transparent:!!(origMat&&origMat.transparent),
  opacity:(origMat&&origMat.opacity!=null)?origMat.opacity:1
 });
 m.name=(origMat&&origMat.name)||partKind;
 m.userData=Object.assign({},(origMat&&origMat.userData)||{});
 if(envMap){m.envMap=envMap;m.envMapIntensity=1}
 if(partKind==='glass'){
  m.transparent=true;
  m.opacity=Math.min(m.opacity<0.95?m.opacity:0.42,0.55);
  m.roughness=0.04;
  m.metalness=envMap?0.85:0.22;
  if(!hasTex)m.color.set(0x7fa4be);
 }else if(partKind==='chrome'){
  m.roughness=0.06;
  m.metalness=envMap?0.96:0.75;
  if(!hasTex)m.color.set(0xeef2f7);
 }else if(partKind==='tire'){
  m.roughness=0.86;
  m.metalness=0.04;
  m.envMap=null;
  if(!hasTex&&(baseCol.r+baseCol.g+baseCol.b)/3>0.45)m.color.set(0x202328);
 }else if(partKind==='wheel_rim'){
  m.roughness=0.16;
  m.metalness=envMap?0.88:0.6;
 }else if(partKind==='headlight'||partKind==='taillight'){
  m.roughness=0.08;
  m.metalness=0.25;
  if(!hasTex&&partKind==='taillight')m.color.set(0xc91d1d);
 }else if(partKind==='interior'){
  m.roughness=0.72;
  m.metalness=0.05;
  m.envMap=null;
 }else if(partKind==='body'){
  m.roughness=0.18;
  m.metalness=envMap?0.52:0.22;
 }else{
  m.roughness=Math.min(origMat&&origMat.roughness!=null?origMat.roughness:0.4,0.42);
  m.metalness=origMat&&origMat.metalness!=null?origMat.metalness:0.2;
 }
 m.needsUpdate=true;
 return m;
}

/* Sof pikselli 2× bilinear + Unsharp Mask tiniqlashtirish (Node va brauzerda ishlaydi) */
function hqUpscalePixels(src,w,h,sharp){
 sharp=sharp==null?0.38:sharp;
 const W=w*2,H=h*2,bil=new Float32Array(W*H*4),out=new Uint8ClampedArray(W*H*4);
 const sample=(x,y,c)=>{
  const cx=Math.max(0,Math.min(w-1,x)),cy=Math.max(0,Math.min(h-1,y));
  return src[(cy*w+cx)*4+c];
 };
 for(let y=0;y<H;y++){
  const sy=(y+0.5)*0.5-0.5,y0=Math.floor(sy),fy=sy-y0;
  for(let x=0;x<W;x++){
   const sx=(x+0.5)*0.5-0.5,x0=Math.floor(sx),fx=sx-x0;
   const dst=(y*W+x)*4;
   for(let c=0;c<4;c++){
    const a=sample(x0,y0,c),b=sample(x0+1,y0,c),d=sample(x0,y0+1,c),e=sample(x0+1,y0+1,c);
    bil[dst+c]=(a*(1-fx)+b*fx)*(1-fy)+(d*(1-fx)+e*fx)*fy;
   }
  }
 }
 for(let y=0;y<H;y++){
  for(let x=0;x<W;x++){
   const i=(y*W+x)*4;
   const xm=Math.max(0,x-1),xp=Math.min(W-1,x+1),ym=Math.max(0,y-1),yp=Math.min(H-1,y+1);
   for(let c=0;c<3;c++){
    const v=bil[i+c];
    const blur=(bil[(ym*W+x)*4+c]+bil[(yp*W+x)*4+c]+bil[(y*W+xm)*4+c]+bil[(y*W+xp)*4+c]+v*4)/8;
    out[i+c]=Math.max(0,Math.min(255,Math.round(v+sharp*(v-blur))));
   }
   out[i+3]=Math.max(0,Math.min(255,Math.round(bil[i+3])));
  }
 }
 return{data:out,width:W,height:H};
}

function hqUpscaleTexture(texObj,maxSize){
 if(typeof document==='undefined'||!texObj||!texObj.image)return null;
 const im=texObj.image,w=im.width||0,h=im.height||0;
 maxSize=maxSize||1024;
 if(!w||!h||w*2>maxSize||h*2>maxSize||w>512||h>512)return null;
 const sc=document.createElement('canvas');sc.width=w;sc.height=h;
 const sx=sc.getContext('2d',{willReadFrequently:true});
 sx.drawImage(im,0,0,w,h);
 const src=sx.getImageData(0,0,w,h).data;
 const up=hqUpscalePixels(src,w,h,0.38);
 const dc=document.createElement('canvas');dc.width=up.width;dc.height=up.height;
 dc.getContext('2d').putImageData(new ImageData(up.data,up.width,up.height),0,0);
 return{oldImage:im,newCanvas:dc};
}

function collectTexTargets(meshesList){
 const map=new Map();
 const tx=g_tex();
 if(tx){
  Object.entries(tx).forEach(([k,t])=>{if(t&&t.image)map.set(k,t)});
 }
 meshesList.forEach(m=>{
  [].concat(m.material||[]).forEach(mt=>{
   if(mt&&mt.map&&mt.map.image){
    const key=(mt.map.name||mt.userData&&mt.userData.tex||mt.map.uuid).toLowerCase();
    if(!map.has(key))map.set(key,mt.map);
   }
  });
 });
 return[...map.values()];
}

/* Asosiy HQ yaxshilash funksiyasi (Commit / Undo yoki vaqtinchalik eksport rejimi bilan) */
function upgradeToHQ(targets,opts){
 const T=getT(opts&&opts.THREE);
 opts=opts||{};
 const list=(targets||[]).filter(m=>m&&m.isMesh&&!m.userData.dummy&&m.geometry);
 if(!list.length)return{meshesUpgraded:0,trisBefore:0,trisAfter:0,texturesUpscaled:0,restore:()=>{}};
 const levels=opts.levels==null?1:opts.levels|0;
 const creaseDeg=opts.creaseDeg==null?48:+opts.creaseDeg;
 const upgradeMats=opts.materials!==false;
 const upscaleTex=opts.upscaleTex!==false;
 const maxTex=opts.maxTex||(typeof document!=='undefined'&&document.querySelector('#txm')?+document.querySelector('#txm').value||1024:1024);
 const envMap=opts.envMap!==undefined?opts.envMap:g_env();

 const meshRecords=[];
 let trisBefore=0,trisAfter=0;
 list.forEach(m=>{
  const oldGeo=m.geometry,oldMat=m.material;
  const sub=hqSubdivide({
   attributes:oldGeo.attributes,
   index:oldGeo.index,
   groups:oldGeo.groups,
   getAttribute:k=>oldGeo.getAttribute(k)
  },{levels,creaseDeg,maxTris:opts.maxTris||90000},T);
  trisBefore+=sub.trisBefore;
  trisAfter+=sub.trisAfter;
  let newMat=oldMat;
  if(upgradeMats){
   const arr=[].concat(oldMat||[]).map(mt=>{
    const tn=(mt&&mt.userData&&mt.userData.tex)||(mt&&mt.map&&mt.map.name)||'';
    const kind=hqClassifyPart(m.name,mt&&mt.name,tn);
    return hqCreateMaterial(mt,kind,envMap,T);
   });
   newMat=Array.isArray(oldMat)?arr:arr[0];
  }
  meshRecords.push({m,oldGeo,newGeo:sub.geometry,oldMat,newMat});
 });

 const texRecords=[];
 if(upscaleTex){
  collectTexTargets(list).forEach(t=>{
   const r=hqUpscaleTexture(t,maxTex);
   if(r)texRecords.push({t,oldImage:r.oldImage,newImage:r.newCanvas});
  });
 }

 const apply=(forward)=>{
  meshRecords.forEach(r=>{
   r.m.geometry=forward?r.newGeo:r.oldGeo;
   r.m.material=forward?r.newMat:r.oldMat;
  });
  texRecords.forEach(r=>{
   r.t.image=forward?r.newImage:r.oldImage;
   r.t.needsUpdate=true;
  });
  g_applyTex();
  g_texList();
  g_refresh();
 };

 if(opts.commit===false){
  apply(true);
  return{
   meshesUpgraded:meshRecords.length,
   trisBefore,
   trisAfter,
   texturesUpscaled:texRecords.length,
   restore:()=>apply(false)
  };
 }

 if(typeof rootScope.CMD!=='undefined'&&rootScope.CMD.execute){
  rootScope.CMD.execute({
   label:opts.label||'LOW → HQ yaxshilash',
   execute:()=>apply(true),
   redo:()=>apply(true),
   undo:()=>apply(false)
  });
 }else{
  apply(true);
  if(typeof rootScope.hist==='function')rootScope.hist(()=>apply(false),()=>apply(true),'LOW → HQ yaxshilash');
  else if(typeof hist==='function')hist(()=>apply(false),()=>apply(true),'LOW → HQ yaxshilash');
 }

 return{
  meshesUpgraded:meshRecords.length,
  trisBefore,
  trisAfter,
  texturesUpscaled:texRecords.length,
  restore:()=>apply(false)
 };
}

/* ---------- Brauzer UI: HQ dialogi (#hqd) va menyu tugmalari ---------- */
if(typeof document!=='undefined'){
 const openHqDialog=()=>{
  const picked=g_real().filter(m=>!m.userData.dummy);
  const all=g_meshes().filter(m=>!m.userData.dummy);
  const targets=picked.length?picked:all;
  if(!targets.length){
   g_toast('Avval model oching');
   return;
  }
  let dlg=document.querySelector('#hqd');
  if(!dlg){
   dlg=document.createElement('dialog');
   dlg.id='hqd';
   dlg.innerHTML=`<div class="ph"><b>LOW → HQ (sifatli qilish)</b><span class="sp"></span><button type="button" id="hqx" title="Yopish">✕</button></div>
<div class="db">
 <div class="gpg">
  <label><span>Silliqlash darajasi (subdivision)</span><select id="hqlv"><option value="0">0 (faqat normallar)</option><option value="1" selected>1× (4× poligon — tavsiya)</option><option value="2">2× (16× poligon — ultra)</option></select></label>
  <label><span>O’tkir qirra burchagi (°)</span><input type="number" id="hqcr" value="48" min="15" max="85" step="1"></label>
  <label class="chk row"><input type="checkbox" id="hqmt" checked>Avto PBR materiallar (kuzov, oyna, xrom, shina)</label>
  <label class="chk row"><input type="checkbox" id="hqtx" checked>Past sifatli teksturalarni 2× tiniqlashtirish</label>
 </div>
 <p class="gnote" id="hqinf"></p>
 <div class="row"><button type="button" id="hqgo" class="pri">HQ qilish</button><button type="button" id="hqno">Bekor</button></div>
</div>`;
   document.body.append(dlg);
   dlg.querySelector('#hqx').onclick=()=>dlg.close();
   dlg.querySelector('#hqno').onclick=()=>dlg.close();
   dlg.addEventListener('keydown',e=>e.stopPropagation());
   dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
  }
  const inf=dlg.querySelector('#hqinf');
  let tris=0;
  targets.forEach(m=>{const g=m.geometry;tris+=(g.index?g.index.count:g.getAttribute('position').count)/3});
  inf.textContent=(picked.length?'Tanlanganlar: ':'Barcha meshlar: ')+targets.length+' ta · '+Math.round(tris).toLocaleString()+' uchburchak';
  dlg.querySelector('#hqgo').onclick=()=>{
   const lv=+dlg.querySelector('#hqlv').value||0;
   const cr=Math.max(15,Math.min(85,+dlg.querySelector('#hqcr').value||42));
   const mt=dlg.querySelector('#hqmt').checked;
   const tx=dlg.querySelector('#hqtx').checked;
   dlg.close();
   const res=upgradeToHQ(targets,{levels:lv,creaseDeg:cr,materials:mt,upscaleTex:tx});
   g_toast('HQ tayyor: '+Math.round(res.trisBefore).toLocaleString()+' → '+Math.round(res.trisAfter).toLocaleString()+' uchburchak'+(res.texturesUpscaled?' · '+res.texturesUpscaled+' tekstura 2×':''));
  };
  dlg.showModal();
 };
 const b1=document.querySelector('#hqcar'),b2=document.querySelector('#gtahq');
 if(b1)b1.onclick=openHqDialog;
 if(b2)b2.onclick=openHqDialog;
}

const api={
 hqClean,
 hqNormals,
 hqSubdivideOnce,
 hqSubdivide,
 hqClassifyPart,
 hqCreateMaterial,
 hqUpscalePixels,
 hqUpscaleTexture,
 upgradeToHQ
};

if(typeof rootScope!=='undefined')rootScope.HQUpgrade=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
