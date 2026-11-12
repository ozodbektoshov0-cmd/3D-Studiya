/* ---- 0.0.58: Blender “Subdivision Surface” (Catmull–Clark) ----
   Standart Catmull–Clark qoidalari: yuz nuqtalari, qirra nuqtalari, nuqta yangilanishi; chegara (ochiq) qirralar uchun chegara qoidasi.
   Kirish uchburchaklardan iborat bo‘lgani uchun avval tekis (komplanar) uchburchak juftliklari to‘rtburchakka birlashtiriladi
   (kub, silindr yon yuzlari va h.k. Blender’dagi kabi natija beradi). Hozircha yo‘q: crease (o‘tkir qirra), Catmull–Clark’ning “Simple” rejimi. */
(function(){
'use strict';
const T=window.THREE;if(!T)return;
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(a[0],a[1],a[2]);
const ni=g=>g.index?g.toNonIndexed():g.clone();

function build(g0){const g=ni(g0),P=g.attributes.position,L=[];let D=0;
 Object.keys(g.attributes).forEach(n=>{if(n=='position'||n=='normal')return;const a=g.attributes[n];L.push({n,a,s:a.itemSize,o:D});D+=a.itemSize});
 const corner=i=>{const r=new Array(D);L.forEach(l=>{for(let c=0;c<l.s;c++)r[l.o+c]=l.a.array[i*l.s+c]});return r};
 const mp=new Map(),V=[],vid=new Array(P.count);
 for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),k=Math.round(x*1e5)+','+Math.round(y*1e5)+','+Math.round(z*1e5);let id=mp.get(k);if(id===undefined){id=V.length;mp.set(k,id);V.push([x,y,z])}vid[i]=id}
 const F=[];for(let t=0;t<P.count/3;t++){const v=[vid[t*3],vid[t*3+1],vid[t*3+2]];if(v[0]===v[1]||v[1]===v[2]||v[0]===v[2])continue;F.push({v,a:[0,1,2].map(j=>corner(t*3+j))})}
 return {V,F,L,D}}

const sameA=(a,b)=>a.every((x,i)=>Math.abs(x-b[i])<1e-6);
/* tekis uchburchak juftliklarini to‘rtburchakka birlashtirish */
function pairQuads(M){const {V,F}=M,E=new Map();
 F.forEach((f,i)=>{for(let j=0;j<3;j++){const k=f.v[j]+'>'+f.v[(j+1)%3];(E.get(k)||E.set(k,[]).get(k)).push([i,j])}});
 const N=F.map(f=>{const n=cross(sub(V[f.v[1]],V[f.v[0]]),sub(V[f.v[2]],V[f.v[0]])),l=len(n)||1;return [n[0]/l,n[1]/l,n[2]/l]});
 const used=new Array(F.length).fill(false),out=[];
 for(let i=0;i<F.length;i++){if(used[i])continue;
  for(let j=0;j<3;j++){const a=F[i].v[j],b=F[i].v[(j+1)%3],rev=E.get(b+'>'+a),same=E.get(a+'>'+b);
   if(!rev||rev.length!==1||same.length!==1)continue;const [k,jj]=rev[0];if(k===i||used[k]||dot(N[i],N[k])<.9999)continue;
   const t1=[0,1,2].map(x=>(j+x)%3),t2=[0,1,2].map(x=>(jj+x)%3),f1=F[i],f2=F[k];
   if(!sameA(f1.a[t1[0]],f2.a[t2[1]])||!sameA(f1.a[t1[1]],f2.a[t2[0]]))continue;   /* UV chokida birlashtirmaymiz */
   const q=[f1.v[t1[0]],f2.v[t2[2]],f1.v[t1[1]],f1.v[t1[2]]],qa=[f1.a[t1[0]],f2.a[t2[2]],f1.a[t1[1]],f1.a[t1[2]]];
   let convex=true;for(let m=0;m<4;m++){const p0=V[q[m]],p1=V[q[(m+1)%4]],p2=V[q[(m+2)%4]];if(dot(cross(sub(p1,p0),sub(p2,p1)),N[i])<=1e-12){convex=false;break}}
   if(!convex)continue;used[i]=used[k]=true;out.push({v:q,a:qa});break}}
 F.forEach((f,i)=>{if(!used[i])out.push(f)});return {...M,F:out}}

const avg=(list,D)=>{const r=new Array(D).fill(0);list.forEach(x=>{for(let i=0;i<D;i++)r[i]+=x[i]});return r.map(x=>x/list.length)};
const avp=l=>{const r=[0,0,0];l.forEach(p=>{r[0]+=p[0];r[1]+=p[1];r[2]+=p[2]});return [r[0]/l.length,r[1]/l.length,r[2]/l.length]};
/* bitta Catmull–Clark darajasi */
function level(M){const {V,F,D}=M,nv=V.length,EI=new Map(),Ed=[];
 const fe=F.map((f,fi)=>f.v.map((a,i)=>{const b=f.v[(i+1)%f.v.length],k=a<b?a+'_'+b:b+'_'+a;let e=EI.get(k);if(e===undefined){e=Ed.length;EI.set(k,e);Ed.push({a:Math.min(a,b),b:Math.max(a,b),f:[]})}Ed[e].f.push(fi);return e}));
 const ne=Ed.length,FP=F.map(f=>avp(f.v.map(i=>V[i]))),
  EP=Ed.map(e=>{const m=avp([V[e.a],V[e.b]]);return e.f.length===2?avp([V[e.a],V[e.b],FP[e.f[0]],FP[e.f[1]]]):m}),
  vf=Array.from({length:nv},()=>[]),ve=Array.from({length:nv},()=>[]);
 F.forEach((f,fi)=>f.v.forEach(v=>vf[v].push(fi)));Ed.forEach((e,ei)=>{ve[e.a].push(ei);ve[e.b].push(ei)});
 const VP=V.map((p,v)=>{const es=ve[v],n=es.length,bd=es.filter(e=>Ed[e].f.length!==2);
  if(!bd.length){if(n<3)return p;const Fa=avp(vf[v].map(f=>FP[f])),R=avp(es.map(e=>avp([V[Ed[e].a],V[Ed[e].b]])));
   return [0,1,2].map(c=>(Fa[c]+2*R[c]+(n-3)*p[c])/n)}
  if(bd.length===2&&bd.every(e=>Ed[e].f.length===1)){const o=e=>V[Ed[e].a===v?Ed[e].b:Ed[e].a],A=o(bd[0]),B=o(bd[1]);return [0,1,2].map(c=>(6*p[c]+A[c]+B[c])/8)}
  return p});
 const P=[...VP,...EP,...FP],NF=[];
 F.forEach((f,fi)=>{const k=f.v.length,fa=avg(f.a,D);
  for(let i=0;i<k;i++){const ip=(i-1+k)%k,inx=(i+1)%k;
   NF.push({v:[f.v[i],nv+fe[fi][i],nv+ne+fi,nv+fe[fi][ip]],a:[f.a[i],avg([f.a[i],f.a[inx]],D),fa,avg([f.a[ip],f.a[i]],D)]})}});
 return {...M,V:P,F:NF}}

function toGeometry(M){const {V,F,L,D}=M,tris=[],nrm=V.map(()=>[0,0,0]);
 F.forEach(f=>{const q=f.v,k=q.length;if(k===3){tris.push([f,0,1,2]);return}
  const d1=len(sub(V[q[0]],V[q[2]])),d2=len(sub(V[q[1]],V[q[3]]));
  if(d1<=d2){tris.push([f,0,1,2],[f,0,2,3])}else{tris.push([f,1,2,3],[f,1,3,0])}});
 const pos=new Float32Array(tris.length*9),at=L.map(l=>new l.a.array.constructor(tris.length*3*l.s));
 tris.forEach(([f,i,j,k],t)=>{[i,j,k].forEach((ci,c)=>{const p=V[f.v[ci]];pos.set(p,(t*3+c)*3);L.forEach((l,li)=>{for(let s=0;s<l.s;s++)at[li][(t*3+c)*l.s+s]=f.a[ci][l.o+s]})});
  const n=cross(sub(V[f.v[j]],V[f.v[i]]),sub(V[f.v[k]],V[f.v[i]]));[i,j,k].forEach(ci=>{const a=nrm[f.v[ci]];a[0]+=n[0];a[1]+=n[1];a[2]+=n[2]})});
 const N=new Float32Array(tris.length*9);
 tris.forEach(([f,i,j,k],t)=>[i,j,k].forEach((ci,c)=>{const a=nrm[f.v[ci]],l=len(a)||1;N.set([a[0]/l,a[1]/l,a[2]/l],(t*3+c)*3)}));
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(N,3));
 L.forEach((l,li)=>g.setAttribute(l.n,new T.BufferAttribute(at[li],l.s,l.a.normalized)));g.computeBoundingBox();g.computeBoundingSphere();return g}

function subsurf(g,levels,cap=1.5e6){let M=pairQuads(build(g)),done=0;
 if(!M.F.length)return null;
 for(let l=0;l<levels;l++){const next=M.F.reduce((s,f)=>s+f.v.length*2,0);if(next>cap)return {g:toGeometry(M),done,stopped:true};M=level(M);done++}
 return {g:toGeometry(M),done,stopped:false}}
window.BL_SUBSURF={subsurf,build,pairQuads,level,toGeometry};

/* ---------- Obyekt menyusiga ulash ---------- */
const U=window.BL_OBJ;if(!U||!window.THREE)return;
const lv=U.num(1,1,4);
U.row(U.btn('Subdivision Surface',U.run(m=>{const gg=m.geometry;
  if(gg.groups&&gg.groups.length>1&&new Set(gg.groups.map(x=>x.materialIndex)).size>1)return toast('Ko‘p materialli mesh uchun hali mavjud emas');
  const r=subsurf(gg,Math.max(1,Math.min(4,+lv.value|0||1)));if(!r)return toast('Mesh bo‘sh');if(!r.done)return toast('Poligonlar limitiga yetdi — bajarilmadi');
  U.commit(m,r.g);toast((r.stopped?'Limitga yetdi, '+r.done+' daraja bajarildi · ':'')+'Uchburchaklar: '+(r.g.attributes.position.count/3|0).toLocaleString())}),
  'Catmull–Clark: silliq sirt (daraja 1–4). Tekis uchburchak juftliklari to‘rtburchak sifatida qaraladi.'),lv);
})();
