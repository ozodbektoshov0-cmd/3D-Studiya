/* ---- DFF yozish (GTA SA, 0x1803FFFF) ---- */
function dffOut(){
 const VER=0x1803FFFF,U=a=>new Uint8Array(new Uint32Array(a).buffer),f=a=>new Uint8Array(new Float32Array(a).buffer),
  cat=a=>{let n=0;a.forEach(x=>n+=x.length);const o=new Uint8Array(n);let p=0;a.forEach(x=>{o.set(x,p);p+=x.length});return o},
  ck=(t,...a)=>{const d=cat(a);return cat([U([t,d.length,VER]),d])},
  s4=s=>{const o=new Uint8Array(Math.ceil((s.length+1)/4)*4);for(let i=0;i<s.length;i++)o[i]=s.charCodeAt(i);return o},E=()=>ck(3);
 root.updateMatrixWorld(true);const ms=meshes().filter(m=>m.visible&&!m.userData.dummy),Z=new THREE.Matrix4().makeRotationX(Math.PI/2);
 const used=new Set(['root']),uniq=b=>{b=b||'obj';let n=b,i=2;while(used.has(n.toLowerCase())){const sx='_'+i++;n=b.slice(0,23-sx.length)+sx}used.add(n.toLowerCase());return n};
 const names=['root'],fr=[cat([f([1,0,0,0,1,0,0,0,1,0,0,0]),U([-1,0x20003])])];
 const geos=[],atoms=[];dffOut.info=[];
 ms.forEach((m,mi)=>{
  const e=new THREE.Matrix4().multiplyMatrices(Z,m.matrixWorld).elements,base=m.name.replace(/_mesh$/,'')||'obj'+mi,parts=dffParts(m);
  const fm=cat([f([e[0],e[1],e[2],e[4],e[5],e[6],e[8],e[9],e[10],e[12],e[13],e[14]]),U([0,0x20003])]);
  if(parts.length>1)dffOut.info.push(base+': '+parts.length+' qismga bo’lindi');
  parts.forEach(pt=>{
   const ma=pt.ma;names.push(uniq(base));fr.push(fm);
   const UV=pt.uv,n=pt.pos.length/3,pp=pt.pos;let mnx=1e30,mny=1e30,mnz=1e30,mxx=-1e30,mxy=-1e30,mxz=-1e30;
   for(let i=0;i<n;i++){const x=pp[i*3],y=pp[i*3+1],z=pp[i*3+2];mnx=Math.min(mnx,x);mxx=Math.max(mxx,x);mny=Math.min(mny,y);mxy=Math.max(mxy,y);mnz=Math.min(mnz,z);mxz=Math.max(mxz,z)}
   const cx=(mnx+mxx)/2,cy=(mny+mxy)/2,cz=(mnz+mxz)/2;let rr=0;
   for(let i=0;i<n;i++)rr=Math.max(rr,Math.hypot(pp[i*3]-cx,pp[i*3+1]-cy,pp[i*3+2]-cz));
   const fl=0x72|(UV?4|1<<16:0),tn=pt.bins.reduce((s,x)=>s+x[1].length,0);
   const st=ck(1,U([fl,pt.tris.length/4,n,1]),UV?f(UV):new Uint8Array(0),new Uint8Array(new Uint16Array(pt.tris).buffer),f([cx,cy,cz,rr]),U([1,1]),f(pt.pos),f(pt.nor));
   const ml=ck(8,ck(1,U([ma.length,...ma.map(()=>-1)])),...ma.map(x=>{const t=x.userData.tex||(x.map&&x.map.name)||'',c=x.color||{r:1,g:1,b:1};
    return ck(7,ck(1,U([0]),new Uint8Array([c.r*255,c.g*255,c.b*255,255]),U([0,t?1:0]),f([1,1,1])),...(t?[ck(6,ck(1,U([0x1106])),ck(2,s4(rwName(t))),ck(2,s4('')),E())]:[]),E())}));
   atoms.push([fr.length-1,geos.length]);
   geos.push(ck(0xF,st,ml,ck(3,ck(0x50E,U([0,pt.bins.length,tn]),...pt.bins.map(([k,bi])=>cat([U([bi.length,k]),U(bi)]))))));
  });
 });
 meshes().filter(m=>m.userData.dummy).forEach(m=>{names.push(uniq(m.name));const e=new THREE.Matrix4().multiplyMatrices(Z,m.matrixWorld).elements;fr.push(cat([f([e[0],e[1],e[2],e[4],e[5],e[6],e[8],e[9],e[10],e[12],e[13],e[14]]),U([0,0x20003])]))});
 const enc=new TextEncoder();
 return cat([ck(0x10,ck(1,U([atoms.length,0,0])),
  ck(0xE,ck(1,U([fr.length]),...fr),...names.map(nm=>ck(3,ck(0x253F2FE,enc.encode(nm))))),
  ck(0x1A,ck(1,U([geos.length])),...geos),
  ...atoms.map(([fi,gi])=>ck(0x14,ck(1,U([fi,gi,5,0])),E())),E())]);
}

/* Mesh'ni DFF uchun qismlarga bo'lish: bir geometriyada ko'pi bilan 65535 uch (RenderWare cheklovi).
   Avval bir xil uchlar birlashtiriladi (weld), keyin kerak bo'lsa 2, 3... qismga bo'linadi. */
function dffParts(m){
 const MAX=65535,g=m.geometry,P=g.getAttribute('position'),n=P.count;
 let N=g.getAttribute('normal');if(!N){const c=g.clone();c.computeVertexNormals();N=c.getAttribute('normal')}
 const UV=g.getAttribute('uv'),ix=g.index?g.index.array:null,nt=Math.floor((ix?ix.length:n)/3),I=i=>ix?ix[i]:i,
  ma0=[].concat(m.material),gr=g.groups.length?g.groups:[{start:0,count:nt*3,materialIndex:0}];
 const mk=x=>{const c=x.color||{r:1,g:1,b:1};return(x.userData.tex||(x.map&&x.map.name)||'')+'|'+Math.round(c.r*255)+','+Math.round(c.g*255)+','+Math.round(c.b*255)},
  kid=new Map(),ma=[],cm=ma0.map(x=>{const key=mk(x);if(!kid.has(key)){kid.set(key,ma.length);ma.push(x)}return kid.get(key)});
 const T=[];
 gr.forEach(r=>{const k=cm[Math.min(r.materialIndex||0,ma0.length-1)];
  for(let i=r.start;i+2<Math.min(r.start+r.count,nt*3);i+=3)T.push(I(i),I(i+1),I(i+2),k)});
 let W=null;
 if(n>MAX){
  W=new Uint32Array(n);const mp=new Map(),q=(v,s)=>Math.round(v*s);
  for(let i=0;i<n;i++){
   const key=q(P.getX(i),1e5)+','+q(P.getY(i),1e5)+','+q(P.getZ(i),1e5)+','+q(N.getX(i),1e3)+','+q(N.getY(i),1e3)+','+q(N.getZ(i),1e3)+(UV?','+q(UV.getX(i),1e5)+','+q(UV.getY(i),1e5):'');
   const j=mp.get(key);if(j===undefined){mp.set(key,i);W[i]=i}else W[i]=j}
 }
 const raw=[],nw=()=>({map:new Map(),src:[],T:[]});let cur=nw();
 for(let t=0;t<T.length;t+=4){
  const v=[W?W[T[t]]:T[t],W?W[T[t+1]]:T[t+1],W?W[T[t+2]]:T[t+2]];
  const s=[];v.forEach(x=>{if(!cur.map.has(x)&&s.indexOf(x)<0)s.push(x)});
  if(cur.src.length+s.length>MAX){raw.push(cur);cur=nw()}
  v.forEach(x=>{if(!cur.map.has(x)){cur.map.set(x,cur.src.length);cur.src.push(x)}});
  cur.T.push(cur.map.get(v[0]),cur.map.get(v[1]),cur.map.get(v[2]),T[t+3]);
 }
 if(cur.T.length)raw.push(cur);
 return raw.map(r=>{
  const c=r.src.length,pos=new Float32Array(c*3),nor=new Float32Array(c*3),uv=UV?new Float32Array(c*2):null;
  for(let i=0;i<c;i++){const o=r.src[i];pos[i*3]=P.getX(o);pos[i*3+1]=P.getY(o);pos[i*3+2]=P.getZ(o);
   nor[i*3]=N.getX(o);nor[i*3+1]=N.getY(o);nor[i*3+2]=N.getZ(o);if(uv){uv[i*2]=UV.getX(o);uv[i*2+1]=1-UV.getY(o)}}
  const tris=[],bm=new Map(),lm=new Map(),pm=[];
  for(let t=0;t<r.T.length;t+=4){const a=r.T[t],b=r.T[t+1],d=r.T[t+2],g0=r.T[t+3];
   if(!lm.has(g0)){lm.set(g0,pm.length);pm.push(ma[g0])}const k=lm.get(g0);
   tris.push(b,a,k,d);let bi=bm.get(k);if(!bi){bi=[];bm.set(k,bi)}bi.push(a,b,d)}
  return{pos,nor,uv,tris,bins:[...bm.entries()],ma:pm};
 });
}
