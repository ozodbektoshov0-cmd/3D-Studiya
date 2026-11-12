/* ---- v55 · 3-bosqich: Blender Edit Mode asboblari ----
   Extrude (E) · Inset (I) · Delete (X) · Merge at Center (M) · tanlash: All (A) / None (Alt+A) / Invert (Ctrl+I) / Linked (L) / Grow / Shrink.
   “Yuz” = hamma uchta uchi tanlangan uchburchak. Ctrl+Z geometriya o‘zgarishlarini ham qaytaradi.
   Hozircha yo‘q: Loop Cut va Bevel (mesh uchburchaklardan iborat, to‘rtburchak sirtlar kerak). */
(function(){
'use strict';
const T=window.THREE;
if(!T||typeof editOn!=='function'||typeof editOff!=='function'||typeof paint!=='function'||typeof eUndo!=='function')return;

const f5=(x,y,z)=>x.toFixed(5)+','+y.toFixed(5)+','+z.toFixed(5);
const ni=g=>g.index?g.toNonIndexed():g.clone();
function ctx(g){g=ni(g);const P=g.attributes.position,K=new Array(P.count);for(let i=0;i<P.count;i++)K[i]=f5(P.getX(i),P.getY(i),P.getZ(i));return {g,P,n:P.count/3,K,V:i=>new T.Vector3(P.getX(i),P.getY(i),P.getZ(i))}}
function builder(g){const nm=Object.keys(g.attributes),O={};nm.forEach(k=>O[k]=[]);
 return {copy(c,pos,nrm){nm.forEach(k=>{const a=g.attributes[k],s=a.itemSize;
   if(k=='position'&&pos)O[k].push(pos[0],pos[1],pos[2]);else if(k=='normal'&&nrm)O[k].push(nrm[0],nrm[1],nrm[2]);else for(let j=0;j<s;j++)O[k].push(a.array[c*s+j])})},
  done(){const r=new T.BufferGeometry();nm.forEach(k=>{const a=g.attributes[k];r.setAttribute(k,new T.BufferAttribute(new a.array.constructor(O[k]),a.itemSize,a.normalized))});r.computeBoundingBox();r.computeBoundingSphere();return r}}}
const kf=p=>f5(Math.fround(p.x),Math.fround(p.y),Math.fround(p.z));

/* Extrude (d) va Inset (t) — bitta “region” amali: tanlangan yuzlar siljiydi/ichkariga kichrayadi, chegarada devor yuzlari hosil bo‘ladi */
function region(g0,sel,d,t){const {g,n,K,V}=ctx(g0),F=[],fn={},N=new T.Vector3();
 for(let f=0;f<n;f++)if(sel.has(K[f*3])&&sel.has(K[f*3+1])&&sel.has(K[f*3+2]))F.push(f);
 if(!F.length)return null;
 F.forEach(f=>{const a=V(f*3),b=V(f*3+1),c=V(f*3+2),x=b.clone().sub(a).cross(c.clone().sub(a));N.add(x);const l=x.length();fn[f]=l>0?x.divideScalar(l):x});
 N.length()>0?N.normalize():N.set(0,1,0);
 const E=new Map();F.forEach(f=>{for(let j=0;j<3;j++){const a=K[f*3+j],b=K[f*3+(j+1)%3],k=a<b?a+'|'+b:b+'|'+a;(E.get(k)||E.set(k,[]).get(k)).push([f,j])}});
 const B=[];E.forEach(l=>{if(l.length==1)B.push(l[0])});
 const inw=new Map();
 B.forEach(([f,j])=>{const a=V(f*3+j),b=V(f*3+(j+1)%3),v=fn[f].clone().cross(b.clone().sub(a)).normalize();
  [K[f*3+j],K[f*3+(j+1)%3]].forEach(k=>(inw.get(k)||inw.set(k,[]).get(k)).push(v))});
 const off=new Map();inw.forEach((l,k)=>{const s=new T.Vector3();l.forEach(v=>s.add(v));if(s.length()<1e-9){off.set(k,new T.Vector3());return}s.normalize();off.set(k,s.multiplyScalar(1/Math.max(.3,s.dot(l[0]))))});
 const cp=i=>{const p=V(i).addScaledVector(N,d),o=off.get(K[i]);if(o&&t)p.addScaledVector(o,t);return p};
 const O=builder(g),inF=new Set(F),nk=new Set();
 for(let f=0;f<n;f++)if(!inF.has(f))for(let j=0;j<3;j++)O.copy(f*3+j);
 F.forEach(f=>{for(let j=0;j<3;j++){const p=cp(f*3+j);O.copy(f*3+j,[p.x,p.y,p.z]);nk.add(kf(p))}});
 const tri=(c0,p0,c1,p1,c2,p2)=>{const nn=p1.clone().sub(p0).cross(p2.clone().sub(p0));if(nn.lengthSq()<1e-18)return;nn.normalize();
  [[c0,p0],[c1,p1],[c2,p2]].forEach(([c,p])=>O.copy(c,[p.x,p.y,p.z],[nn.x,nn.y,nn.z]))};
 B.forEach(([f,j])=>{const ia=f*3+j,ib=f*3+(j+1)%3,a=V(ia),b=V(ib),a2=cp(ia),b2=cp(ib);tri(ia,a,ib,b,ib,b2);tri(ia,a,ib,b2,ia,a2)});
 return {g:O.done(),keys:nk}}

function del(g0,sel){const {g,n,K}=ctx(g0),O=builder(g);let k=0;
 for(let f=0;f<n;f++)if(!(sel.has(K[f*3])||sel.has(K[f*3+1])||sel.has(K[f*3+2]))){for(let j=0;j<3;j++)O.copy(f*3+j);k++}
 return k?{g:O.done(),keys:new Set()}:null}

function merge(g0,sel){const {g,P,n,K,V}=ctx(g0);if(sel.size<2)return null;
 const c=new T.Vector3(),seen=new Set();for(let i=0;i<K.length;i++)if(sel.has(K[i])&&!seen.has(K[i])){seen.add(K[i]);c.add(V(i))}c.divideScalar(seen.size);
 const ck=kf(c),KK=i=>sel.has(K[i])?ck:K[i],O=builder(g);
 for(let f=0;f<n;f++){const a=KK(f*3),b=KK(f*3+1),d=KK(f*3+2);if(a==b||b==d||a==d)continue;
  for(let j=0;j<3;j++)O.copy(f*3+j,sel.has(K[f*3+j])?[c.x,c.y,c.z]:null)}
 return {g:O.done(),keys:new Set([ck])}}

function selOp(g0,sel,op){const {n,K}=ctx(g0),tris=[];for(let f=0;f<n;f++)tris.push([K[f*3],K[f*3+1],K[f*3+2]]);
 const all=new Set(K);let r=new Set(sel);
 if(op=='all')r=all;else if(op=='none')r=new Set();else if(op=='invert'){r=new Set();all.forEach(k=>sel.has(k)||r.add(k))}
 else if(op=='grow')tris.forEach(t=>{if(t.some(k=>sel.has(k)))t.forEach(k=>r.add(k))});
 else if(op=='shrink')tris.forEach(t=>{if(t.some(k=>!sel.has(k)))t.forEach(k=>r.delete(k))});
 else if(op=='linked'){const nb=new Map();tris.forEach(t=>t.forEach(k=>{const l=nb.get(k)||nb.set(k,[]).get(k);t.forEach(o=>o!=k&&l.push(o))}));
  const q=[...sel];r=new Set(sel);while(q.length){const k=q.pop();(nb.get(k)||[]).forEach(o=>{if(!r.has(o)){r.add(o);q.push(o)}})}}
 return r}

window.BL_EDIT={region,del,merge,selOp,ctx};

/* ---------- Edit rejimiga ulash ---------- */
const keysNow=()=>{const s=new Set();em.s.forEach(i=>s.add(f5(em.P[i*3],em.P[i*3+1],em.P[i*3+2])));return s};
const setKeys=ks=>{em.s.clear();const mp=new Map();for(let i=0;i<em.G.length;i++)mp.set(f5(em.P[i*3],em.P[i*3+1],em.P[i*3+2]),i);ks.forEach(k=>mp.has(k)&&em.s.add(mp.get(k)));paint()};
const guard=()=>{if(!em||!sel)return false;const g=sel.geometry;
 if(g.getAttribute('skinIndex')||Object.keys(g.morphAttributes||{}).length){toast('Suyakli yoki morph meshda bu amal mavjud emas');return false}
 if(g.groups&&g.groups.length>1){toast('Ko‘p materialli mesh uchun bu amal hozircha mavjud emas');return false}return true};
function apply(res,msg){const m=sel,prev=em.U.slice(),og=m.geometry,ok=keysNow();
 editOff();m.geometry=res.g;editOn();
 if(!em){m.geometry=og;editOn();if(em)em.U=prev;setKeys(ok);return toast('Natija Edit rejimi uchun juda katta (20 000 nuqtagacha)')}
 em.U=prev.concat([{geo:{old:og,keys:ok}}]);setKeys(res.keys);refresh();toast(msg)}
const eu0=eUndo;
eUndo=function(){if(!em)return;const top=em.U[em.U.length-1];
 if(top&&top.geo){const U=em.U.slice(0,-1),{old,keys}=top.geo,m=sel;editOff();m.geometry=old;editOn();if(em){em.U=U;setKeys(keys);refresh()}return}
 eu0()};

const num=(v,w,st)=>{const i=document.createElement('input');i.type='number';i.value=v;i.step=st||'.05';i.style.width=w||'58px';return i};
let dI,tI;
const ops={
 extrude(){if(!guard())return;const r=region(sel.geometry,keysNow(),+dI.value||0,0);if(!r)return toast('Extrude: kamida bitta yuz tanlang (uchta bog‘langan nuqta)');apply(r,'Extrude bajarildi — G bilan siljitishingiz mumkin')},
 inset(){if(!guard())return;const r=region(sel.geometry,keysNow(),0,+tI.value||0);if(!r)return toast('Inset: kamida bitta yuz tanlang (uchta bog‘langan nuqta)');apply(r,'Inset bajarildi')},
 del(){if(!guard())return;if(!em.s.size)return toast('Avval nuqta tanlang');const r=del(sel.geometry,keysNow());if(!r)return toast('Hamma yuzni o‘chirib bo‘lmaydi');apply(r,'Tanlangan nuqtalar va ularga tegishli yuzlar o‘chirildi')},
 merge(){if(!guard())return;const r=merge(sel.geometry,keysNow());if(!r)return toast('Merge: kamida 2 ta nuqta tanlang');apply(r,'Nuqtalar markazga birlashtirildi')},
 sel(op){if(!em)return;setKeys(selOp(sel.geometry,keysNow(),op))}
};
window.BL_EDITKEY=(e,k)=>{if(e.ctrlKey&&k!='i'||e.metaKey)return false;
 const hit=f=>{e.preventDefault();e.stopImmediatePropagation();f();return true};
 if(k=='e')return hit(ops.extrude);if(k=='i'&&e.ctrlKey)return hit(()=>ops.sel('invert'));if(k=='i')return hit(ops.inset);
 if(k=='x'||k=='delete')return hit(ops.del);if(k=='m')return hit(ops.merge);if(k=='l')return hit(()=>ops.sel('linked'));
 if(k=='a')return hit(()=>ops.sel(e.altKey?'none':'all'));return false};

const vp=document.querySelector('#vp');if(!vp)return;
const st=document.createElement('style');
st.textContent='#bl-em{position:absolute;left:56px;top:36px;z-index:3;display:flex;flex-direction:column;gap:4px;padding:6px;background:#2a2a2af0;border:1px solid var(--bd,#161616);border-radius:4px;font-size:12px;max-width:210px}#bl-em[hidden]{display:none}#bl-em .r{display:flex;gap:4px;align-items:center;flex-wrap:wrap}#bl-em button{padding:2px 7px;cursor:pointer}#bl-em b{font-weight:600;color:var(--mt,#9a9a9a);font-size:11px}';
document.head.append(st);
const P=document.createElement('div');P.id='bl-em';P.hidden=true;
const B=(t,f,ti)=>{const b=document.createElement('button');b.textContent=t;b.onclick=f;if(ti)b.title=ti;return b};
const R=(...e)=>{const d=document.createElement('div');d.className='r';d.append(...e);P.append(d)};
dI=num(.2);tI=num(.1);
R(Object.assign(document.createElement('b'),{textContent:'EDIT ASBOBLARI'}));
R(B('Extrude (E)',ops.extrude,'Tanlangan yuzlarni normal bo‘ylab suradi'),dI);
R(B('Inset (I)',ops.inset,'Tanlangan yuzlarni ichkariga kichraytiradi'),tI);
R(B('Delete (X)',ops.del,'Tanlangan nuqtalar va ularga tegishli yuzlarni o‘chiradi'),B('Merge (M)',ops.merge,'Tanlangan nuqtalarni markazda birlashtiradi'));
R(Object.assign(document.createElement('b'),{textContent:'TANLASH'}));
R(B('All (A)',()=>ops.sel('all')),B('None',()=>ops.sel('none'),'Alt+A'),B('Invert',()=>ops.sel('invert'),'Ctrl+I'),B('Linked (L)',()=>ops.sel('linked')),B('Grow',()=>ops.sel('grow')),B('Shrink',()=>ops.sel('shrink')));
vp.append(P);
const eb=document.querySelector('#edit');
if(eb){const sync=()=>{P.hidden=!eb.classList.contains('on')||(window.BL_CFG&&BL_CFG.blEm===false);if(!P.hidden&&sel&&sel.geometry){sel.geometry.computeBoundingSphere();const r=sel.geometry.boundingSphere?sel.geometry.boundingSphere.radius:1;if(!P.dataset.s||P.dataset.o!=sel.uuid){P.dataset.s=1;P.dataset.o=sel.uuid;dI.value=+(r*.2).toFixed(3);tI.value=+(r*.1).toFixed(3)}}};
 new MutationObserver(sync).observe(eb,{attributes:true,attributeFilter:['class']});document.addEventListener('bl-cfg',sync);sync()}
})();
