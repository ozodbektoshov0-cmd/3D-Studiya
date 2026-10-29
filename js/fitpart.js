/* ---- Detalni avtomatik moslashtirish: donor detal (masalan BMW old bamperi) → maqsad mashina (masalan Nexia 2) ----
   1) O'lcham/yo'nalish: donor maqsad detalning (yoki ko'rsatilgan joyning) chegara qutisiga X/Y/Z bo'yicha cho'zilib yoki qisqarib joylashadi.
      Yo'nalish avtomatik tanlanadi (Y o'qi atrofida 0/90/180/270°: eng kam cho'zilish).
   2) Qirqish: maqsad qutisidan (ixtiyoriy zaxira bilan) tashqariga chiqqan qismlar tekislik bo'yicha kesib tashlanadi (UV/normal interpolyatsiya qilinadi).
   3) Yopishtirish (snap): kuzovga yaqin (masofa chegarasida) uchlar kuzov sirtiga qarab tortiladi — oralig'i yopiladi, chekkalari silliq o'tadi.
   Hammasi dunyo koordinatalarida, donor geometriyasiga "pishiriladi". Bitta qadamda Undo bilan qaytariladi. */
const FP={};
FP.box=list=>{const b=new THREE.Box3();list.forEach(o=>{o.updateWorldMatrix(true,true);b.expandByObject(o)});return b};
/* donor qutisini maqsad qutisiga o'tkazuvchi matritsa; rot: 'auto' | 0 | 90 | 180 | 270 */
FP.transform=(db,tb,o)=>{
 o=Object.assign({rot:'auto',sx:true,sy:true,sz:true,keep:false},o||{});
 const ds=db.getSize(new THREE.Vector3()),ts=tb.getSize(new THREE.Vector3()),dc=db.getCenter(new THREE.Vector3()),tc=tb.getCenter(new THREE.Vector3());
 const en=[o.sx,o.sy,o.sz],cands=o.rot=='auto'?[0,90,180,270]:[+o.rot||0];let best=null;
 for(const r of cands){
  const sw=(r==90||r==270),dx=sw?ds.z:ds.x,dz=sw?ds.x:ds.z,d=[dx,ds.y,dz],t=[ts.x,ts.y,ts.z];
  const s=d.map((v,i)=>v>1e-9&&t[i]>1e-9?t[i]/v:1);let cost=0,k=0;en.forEach((e,i)=>{if(e){cost+=Math.abs(Math.log(s[i]));k++}});
  if(!best||cost<best.cost-1e-12)best={r,s,cost,k}}
 let s=best.s.slice();
 if(o.keep){const idx=[0,1,2].filter(i=>en[i]);const g=idx.length?Math.exp(idx.reduce((a,i)=>a+Math.log(s[i]),0)/idx.length):1;s=[g,g,g]}
 else en.forEach((e,i)=>{if(!e)s[i]=1});
 const M=new THREE.Matrix4().makeTranslation(tc.x,tc.y,tc.z);
 M.multiply(new THREE.Matrix4().makeScale(s[0],s[1],s[2])).multiply(new THREE.Matrix4().makeRotationY(best.r*Math.PI/180)).multiply(new THREE.Matrix4().makeTranslation(-dc.x,-dc.y,-dc.z));
 return{M,rot:best.r,scale:s}};
/* tekislik bo'yicha qirqish (Sutherland–Hodgman), hamma atributlar interpolyatsiya qilinadi, material guruhlari saqlanadi */
FP.clipBox=(g,box)=>{
 const P=g.getAttribute('position'),ix=g.index?g.index.array:null,nt=Math.floor((ix?ix.length:P.count)/3),I=i=>ix?ix[i]:i;
 const names=Object.keys(g.attributes),sizes=names.map(n=>g.attributes[n].itemSize),offs=[];let L=0;sizes.forEach(s=>{offs.push(L);L+=s});
 const posO=offs[names.indexOf('position')],nrmI=names.indexOf('normal'),nrmO=nrmI>=0?offs[nrmI]:-1;
 const fm=g.groups.length?(()=>{const a=new Uint16Array(nt);g.groups.forEach(r=>{for(let i=r.start/3;i<(r.start+r.count)/3&&i<nt;i++)a[i]=r.materialIndex||0});return a})():new Uint16Array(nt);
 const vert=i=>{const v=new Float64Array(L);names.forEach((n,k)=>{const a=g.attributes[n];for(let c=0;c<sizes[k];c++)v[offs[k]+c]=a.array[i*a.itemSize+c]});return v};
 const planes=[];['x','y','z'].forEach((ax,a)=>{planes.push([a,box.min[ax],1]);planes.push([a,box.max[ax],-1])});
 const inside=v=>{for(const[a,d,s]of planes)if((v[posO+a]-d)*s<-1e-9)return false;return true};
 const out=new Map();let kept=0,touched=0;
 const emit=(m,v)=>{let l=out.get(m);if(!l){l=[];out.set(m,l)}l.push(v)};
 for(let f=0;f<nt;f++){
  let poly=[vert(I(f*3)),vert(I(f*3+1)),vert(I(f*3+2))];
  if(poly.every(inside)){poly.forEach(v=>emit(fm[f],v));kept++;continue}
  touched++;
  for(const[a,d,s]of planes){if(poly.length<3)break;const res=[];
   for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=(p[posO+a]-d)*s,dq=(q[posO+a]-d)*s;
    if(dp>=0)res.push(p);
    if((dp>=0)!=(dq>=0)){const t=dp/(dp-dq),v=new Float64Array(L);for(let k=0;k<L;k++)v[k]=p[k]+(q[k]-p[k])*t;v[posO+a]=d;res.push(v)}}
   poly=res}
  if(poly.length<3)continue;
  for(let i=1;i+1<poly.length;i++){emit(fm[f],poly[0]);emit(fm[f],poly[i]);emit(fm[f],poly[i+1])}kept++}
 if(!kept)return null;
 const mids=[...out.keys()].sort((a,b)=>a-b),total=mids.reduce((s,m)=>s+out.get(m).length,0),o=new THREE.BufferGeometry();
 names.forEach((n,k)=>{const a=g.attributes[n],arr=new a.array.constructor(total*sizes[k]);let p=0;
  mids.forEach(m=>out.get(m).forEach(v=>{for(let c=0;c<sizes[k];c++)arr[p++]=v[offs[k]+c]}));
  if(n=='normal'){for(let i=0;i<total;i++){const x=arr[i*3],y=arr[i*3+1],z=arr[i*3+2],l=Math.hypot(x,y,z)||1;arr[i*3]=x/l;arr[i*3+1]=y/l;arr[i*3+2]=z/l}}
  o.setAttribute(n,new THREE.BufferAttribute(arr,sizes[k],a.normalized))});
 let st=0;if(g.groups.length)mids.forEach(m=>{const c=out.get(m).length;o.addGroup(st,c,m);st+=c});
 o.userData.clipped=touched;
 return o};
/* ---------- kuzov sirtiga yopishtirish: tekis to'r + eng yaqin nuqta ---------- */
FP.surface=meshes=>{
 const tris=[],b=new THREE.Box3(),v=new THREE.Vector3();
 meshes.forEach(m=>{m.updateWorldMatrix(true,false);const g=m.geometry,P=g.getAttribute('position'),ix=g.index?g.index.array:null,n=Math.floor((ix?ix.length:P.count)/3);
  for(let f=0;f<n;f++){const t=new Float32Array(9);for(let j=0;j<3;j++){v.fromBufferAttribute(P,ix?ix[f*3+j]:f*3+j).applyMatrix4(m.matrixWorld);t[j*3]=v.x;t[j*3+1]=v.y;t[j*3+2]=v.z}tris.push(t)}});
 if(!tris.length)return null;
 tris.forEach(t=>{for(let j=0;j<3;j++)b.expandByPoint(v.set(t[j*3],t[j*3+1],t[j*3+2]))});
 const size=b.getSize(new THREE.Vector3()),cs=Math.max(size.x,size.y,size.z,1e-6)/48,cells=new Map(),key=(x,y,z)=>x+','+y+','+z,cc=p=>Math.floor((p-0)/cs);
 const lo=b.min;tris.forEach((t,i)=>{let mn=[1e30,1e30,1e30],mx=[-1e30,-1e30,-1e30];for(let j=0;j<3;j++)for(let a=0;a<3;a++){mn[a]=Math.min(mn[a],t[j*3+a]);mx[a]=Math.max(mx[a],t[j*3+a])}
  for(let x=cc(mn[0]-lo.x);x<=cc(mx[0]-lo.x);x++)for(let y=cc(mn[1]-lo.y);y<=cc(mx[1]-lo.y);y++)for(let z=cc(mn[2]-lo.z);z<=cc(mx[2]-lo.z);z++){const k=key(x,y,z);let l=cells.get(k);if(!l){l=[];cells.set(k,l)}l.push(i)}});
 const seen=new Int32Array(tris.length).fill(-1);let stamp=0;
 const cp=(p,t,out)=>{ /* Ericson: nuqtadan uchburchakkacha eng yaqin nuqta */
  const ax=t[0],ay=t[1],az=t[2],bx=t[3],by=t[4],bz=t[5],cx=t[6],cy=t[7],cz=t[8];
  const abx=bx-ax,aby=by-ay,abz=bz-az,acx=cx-ax,acy=cy-ay,acz=cz-az,apx=p.x-ax,apy=p.y-ay,apz=p.z-az;
  const d1=abx*apx+aby*apy+abz*apz,d2=acx*apx+acy*apy+acz*apz;if(d1<=0&&d2<=0)return out.set(ax,ay,az);
  const bpx=p.x-bx,bpy=p.y-by,bpz=p.z-bz,d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz;if(d3>=0&&d4<=d3)return out.set(bx,by,bz);
  const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0){const w=d1/(d1-d3);return out.set(ax+abx*w,ay+aby*w,az+abz*w)}
  const cpx=p.x-cx,cpy=p.y-cy,cpz=p.z-cz,d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz;if(d6>=0&&d5<=d6)return out.set(cx,cy,cz);
  const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);return out.set(ax+acx*w,ay+acy*w,az+acz*w)}
  const va=d3*d6-d5*d4;if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));return out.set(bx+(cx-bx)*w,by+(cy-by)*w,bz+(cz-bz)*w)}
  const dn=1/(va+vb+vc),vv=vb*dn,ww=vc*dn;return out.set(ax+abx*vv+acx*ww,ay+aby*vv+acy*ww,az+abz*vv+acz*ww)};
 /* r masofa ichidagi eng yaqin nuqta (yo'q bo'lsa null) */
 const q=new THREE.Vector3();
 const nearest=(p,r,out)=>{stamp++;let best=r*r,found=false;
  const x0=cc(p.x-r-lo.x),x1=cc(p.x+r-lo.x),y0=cc(p.y-r-lo.y),y1=cc(p.y+r-lo.y),z0=cc(p.z-r-lo.z),z1=cc(p.z+r-lo.z);
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++){const l=cells.get(key(x,y,z));if(!l)continue;
   for(const i of l){if(seen[i]===stamp)continue;seen[i]=stamp;cp(p,tris[i],q);const d=q.distanceToSquared(p);if(d<best){best=d;out.copy(q);found=true}}}
  return found?Math.sqrt(best):-1};
 return{tris:tris.length,nearest,box:b}};
/* uchlarni sirtga tortish: maxDist ichida, silliq (smoothstep) og'irlik bilan */
FP.snap=(g,surf,maxDist,strength)=>{
 const P=g.getAttribute('position'),p=new THREE.Vector3(),c=new THREE.Vector3();let moved=0;
 for(let i=0;i<P.count;i++){p.fromBufferAttribute(P,i);const d=surf.nearest(p,maxDist,c);if(d<0)continue;
  const t=d/maxDist,k=t<=.5?0:Math.min(1,(t-.5)/.5),w=(1-k*k*(3-2*k))*strength;p.lerp(c,w);P.setXYZ(i,p.x,p.y,p.z);moved++}
 P.needsUpdate=true;return moved};
/* ---------- asosiy amal ---------- */
FP.run=(donors,targets,body,o)=>{
 o=Object.assign({rot:'auto',sx:true,sy:true,sz:true,keep:false,trim:true,margin:.02,snap:true,snapDist:.03,strength:1,smooth:50},o||{});
 const db=FP.box(donors),tb=FP.box(targets),tr=FP.transform(db,tb,o),rec=[];
 const tsize=tb.getSize(new THREE.Vector3()),diag=Math.max(tsize.x,tsize.y,tsize.z);
 let box=tb.clone();const mg=o.margin*diag;box.min.addScalar(-mg);box.max.addScalar(mg);
 const surf=o.snap&&body&&body.length?FP.surface(body):null;
 let trimmed=0,snapped=0;
 donors.forEach(m=>{m.updateWorldMatrix(true,false);
  let g=m.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(tr.M,m.matrixWorld));
  if(new THREE.Matrix4().multiplyMatrices(tr.M,m.matrixWorld).determinant()<0)FP.flip(g);
  if(o.trim){const c=FP.clipBox(g,box);if(c){trimmed+=c.userData.clipped;g=typeof weldGeo=='function'?weldGeo(c,1e-5).g:c}else{trimmed+=g.getAttribute('position').count/3;g=null}}
  if(!g)return;
  if(surf){snapped+=FP.snap(g,surf,o.snapDist*diag,o.strength);if(typeof smoothGeo=='function'&&o.smooth>0)g=smoothGeo(g,o.smooth)}
  g.computeBoundingBox();g.computeBoundingSphere();
  rec.push({m,og:m.geometry,ng:g,op:m.position.clone(),oq:m.quaternion.clone(),os:m.scale.clone(),opar:m.parent})});
 return{rec,tr,trimmed,snapped,box:tb}};
FP.flip=g=>{let ix=g.index;if(!ix){const n=g.getAttribute('position').count;g.setIndex(Array.from({length:n},(_,i)=>i));ix=g.index}const a=ix.array;for(let i=0;i+2<a.length;i+=3){const t=a[i+1];a[i+1]=a[i+2];a[i+2]=t}ix.needsUpdate=true};
FP.apply=(rec,root_,back)=>rec.forEach(r=>{const m=r.m;
 if(back){m.geometry=r.og;m.position.copy(r.op);m.quaternion.copy(r.oq);m.scale.copy(r.os);if(r.opar&&m.parent!==r.opar)r.opar.add(m)}
 else{m.geometry=r.ng;if(m.parent!==root_)root_.add(m);m.position.set(0,0,0);m.quaternion.identity();m.scale.set(1,1,1)}});
/* ---------- oyna ---------- */
(function(){
 if(typeof document=='undefined'||!document.createElement)return;
 const d=document.createElement('dialog');d.id='fpd';
 d.style.cssText='background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:0;max-width:94vw;width:400px;box-shadow:0 10px 30px #000c';
 d.innerHTML=`<div class="ph" style="display:flex;align-items:center"><b>Detalni moslashtirish</b><span class="sp"></span><button type="button" id="fpx" title="Yopish">✕</button></div>
<div style="padding:8px 10px;display:grid;gap:7px;max-height:80vh;overflow:auto">
<div style="color:var(--mt)">1) Olinadigan detalni (donor) tanlang va tugmani bosing. 2) O‘rniga qo‘yiladigan detalni (maqsad) tanlang va tugmani bosing. 3) Moslashtirish.</div>
<div class="row" style="padding:0"><button type="button" id="fpd1" style="flex:1">Tanlanganni donor qil</button><span id="fpi1" style="flex:1;color:var(--mt)">—</span></div>
<div class="row" style="padding:0"><button type="button" id="fpd2" style="flex:1">Tanlanganni maqsad qil</button><span id="fpi2" style="flex:1;color:var(--mt)">—</span></div>
<label>Yo’nalish <select id="fpr" style="width:100%"><option value="auto">Avtomatik (eng kam cho’zilish)</option><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>
<div class="row" style="padding:0"><label class="chk"><input id="fpsx" type="checkbox" checked>Eni (X)</label><label class="chk"><input id="fpsy" type="checkbox" checked>Bo’yi (Y)</label><label class="chk"><input id="fpsz" type="checkbox" checked>Uzunligi (Z)</label></div>
<label class="chk"><input id="fpk" type="checkbox">Nisbatni saqlash (bir xil masshtab)</label>
<label class="chk"><input id="fpt" type="checkbox" checked>Maqsad chegarasidan chiqqanini qirqish</label>
<label>Qirqish zaxirasi: <b id="fpmv">2</b>%<input id="fpm" type="range" min="0" max="15" step="1" value="2" style="width:100%"></label>
<label class="chk"><input id="fps" type="checkbox" checked>Kuzovga yopishtirish (oraliqni yopish)</label>
<label>Yopishtirish masofasi: <b id="fpsv">3</b>%<input id="fpsd" type="range" min="1" max="12" step="1" value="3" style="width:100%"></label>
<label>Eski detal <select id="fph" style="width:100%"><option value="hide">Yashirish</option><option value="del">O’chirish</option><option value="keep">Qoldirish</option></select></label>
<div class="row" style="padding:0"><button type="button" id="fpg" class="pri" style="flex:1">Moslashtirish</button><button type="button" id="fpz" style="flex:1">Yopish</button></div>
<div id="fpo" style="color:var(--mt)"></div></div>`;
 document.body.appendChild(d);
 const Q=s=>d.querySelector(s);let donors=[],targets=[];
 const info=(l)=>{if(!l.length)return'—';const b=FP.box(l),s=b.getSize(new THREE.Vector3());return l.length+' ta · '+s.x.toFixed(2)+'×'+s.y.toFixed(2)+'×'+s.z.toFixed(2)};
 const grab=()=>(typeof pickReal=='function'?pickReal():pick()).slice();
 Q('#fpx').onclick=Q('#fpz').onclick=()=>d.close();d.addEventListener('keydown',e=>e.stopPropagation());
 Q('#fpd1').onclick=()=>{const l=grab();if(!l.length)return toast('Avval donor detalni tanlang');donors=l;Q('#fpi1').textContent=info(donors)};
 Q('#fpd2').onclick=()=>{const l=grab();if(!l.length)return toast('Avval maqsad detalni tanlang');targets=l;Q('#fpi2').textContent=info(targets)};
 Q('#fpm').oninput=()=>Q('#fpmv').textContent=Q('#fpm').value;Q('#fpsd').oninput=()=>Q('#fpsv').textContent=Q('#fpsd').value;
 Q('#fpg').onclick=()=>{
  if(!donors.length||!targets.length)return toast('Donor va maqsadni belgilang');
  if(donors.some(m=>targets.includes(m)))return toast('Donor va maqsad bir xil obyekt bo’lmasligi kerak');
  try{
   const ex=new Set(donors.concat(targets)),body=(typeof realMeshes=='function'?realMeshes():meshes()).filter(m=>m.visible&&!ex.has(m));
   const o={rot:Q('#fpr').value,sx:Q('#fpsx').checked,sy:Q('#fpsy').checked,sz:Q('#fpsz').checked,keep:Q('#fpk').checked,trim:Q('#fpt').checked,margin:+Q('#fpm').value/100,snap:Q('#fps').checked,snapDist:+Q('#fpsd').value/100};
   toast('Moslashtirilmoqda…');
   const r=FP.run(donors,targets,body,o);
   if(!r.rec.length)return toast('Donor maqsad chegarasidan tashqarida qoldi — qirqish zaxirasini oshiring');
   const act=Q('#fph').value,tg=targets.filter(t=>!donors.includes(t)),tp=tg.map(t=>({t,v:t.visible,p:t.parent}));
   FP.apply(r.rec,root,false);
   if(act=='hide')tg.forEach(t=>t.visible=false);else if(act=='del')tg.forEach(t=>t.parent&&t.parent.remove(t));
   hist(()=>{FP.apply(r.rec,root,true);tp.forEach(x=>{x.t.visible=x.v;if(x.p&&x.t.parent!==x.p)x.p.add(x.t)})},
        ()=>{FP.apply(r.rec,root,false);if(act=='hide')tg.forEach(t=>t.visible=false);else if(act=='del')tg.forEach(t=>t.parent&&t.parent.remove(t))});
   MS.clear();donors.forEach(m=>MS.add(m));select(donors[0]);refresh();d.close();
   const ext=r.tr.scale.some(x=>x>3||x<1/3);toast((ext?'Diqqat: kuchli cho’zilish — detallar mos kelmasligi mumkin. ':'')+'Moslashtirildi: masshtab '+r.tr.scale.map(x=>x.toFixed(2)).join('×')+', burish '+r.tr.rot+'°'+(o.trim&&r.trimmed?', qirqildi '+r.trimmed+' uchburchak':'')+(r.snapped?', yopishtirildi '+r.snapped+' uch':''))}
  catch(x){toast('Xato: '+(x.message||x))}};
 const b=$('#fitp');if(b)b.onclick=()=>{const m=document.querySelector('details.mn[open]');m&&m.removeAttribute('open');d.showModal()};
})();
