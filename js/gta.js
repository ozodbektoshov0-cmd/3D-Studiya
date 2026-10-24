/* ---- Mesh asboblari (weld, normal, ajratish), tanlash yordamchilari, GTA avtomobil ierarxiyasi ---- */
const realMeshes=()=>meshes().filter(m=>!m.userData.dummy);
const pickReal=()=>pick().filter(m=>!m.userData.dummy);
function visHist(fn,msg){const a=meshes().map(m=>[m,m.visible]);fn();const b=meshes().map(m=>[m,m.visible]);
 hist(()=>a.forEach(([m,v])=>m.visible=v),()=>b.forEach(([m,v])=>m.visible=v));refresh();if(msg)toast(msg)}
/* ---------- tanlash ---------- */
$('#invsel').onclick=()=>{const cur=new Set(pickReal()),rest=realMeshes().filter(m=>!cur.has(m));if(!rest.length)return toast('Teskari tanlash uchun obyekt yo’q');
 MS.clear();rest.forEach(m=>MS.add(m));select(rest[0]);toast(rest.length+' ta obyekt tanlandi')};
$('#clrsel').onclick=()=>{MS.clear();select(null);refresh()};
$('#showall').onclick=()=>visHist(()=>meshes().forEach(m=>m.visible=true),'Hammasi ko’rsatildi');
$('#hideall').onclick=()=>visHist(()=>realMeshes().forEach(m=>m.visible=false),'Hammasi yashirildi');
$('#onlysel2').onclick=()=>{const s=new Set(pickReal());if(!s.size)return toast('Avval obyekt tanlang');visHist(()=>realMeshes().forEach(m=>m.visible=s.has(m)),'Faqat tanlangan ko’rinadi')};
/* ---------- geometriya yordamchilari ---------- */
function cloneAttrs(g){const o={};for(const k in g.attributes)o[k]=g.attributes[k];return o}
function weldGeo(g,tol){
 tol=tol||1e-4;const P=g.getAttribute('position'),N=g.getAttribute('normal'),U=g.getAttribute('uv'),n=P.count,ix=g.index?g.index.array:null;
 const q=(v,s)=>Math.round(v/s),mp=new Map(),map=new Uint32Array(n),keep=[];
 for(let i=0;i<n;i++){
  const k=q(P.getX(i),tol)+','+q(P.getY(i),tol)+','+q(P.getZ(i),tol)+(N?','+q(N.getX(i),.02)+','+q(N.getY(i),.02)+','+q(N.getZ(i),.02):'')+(U?','+q(U.getX(i),1e-5)+','+q(U.getY(i),1e-5):'');
  let j=mp.get(k);if(j===undefined){j=keep.length;mp.set(k,j);keep.push(i)}map[i]=j}
 const out=new THREE.BufferGeometry();
 for(const name in g.attributes){const a=g.attributes[name],s=a.itemSize,arr=new a.array.constructor(keep.length*s);
  for(let j=0;j<keep.length;j++)for(let c=0;c<s;c++)arr[j*s+c]=a.array[keep[j]*s+c];out.setAttribute(name,new THREE.BufferAttribute(arr,s,a.normalized))}
 const m=ix?ix.length:n,idx=new(keep.length>65535?Uint32Array:Uint16Array)(m);for(let i=0;i<m;i++)idx[i]=map[ix?ix[i]:i];
 out.setIndex(new THREE.BufferAttribute(idx,1));g.groups.forEach(r=>out.addGroup(r.start,r.count,r.materialIndex));
 return{g:out,removed:n-keep.length}}
function flipGeo(g){
 const o=g.clone();let ix=o.index;if(!ix){const n=o.getAttribute('position').count;o.setIndex(Array.from({length:n},(_,i)=>i));ix=o.index}
 const a=ix.array;for(let i=0;i+2<a.length;i+=3){const t=a[i+1];a[i+1]=a[i+2];a[i+2]=t}ix.needsUpdate=true;
 const N=o.getAttribute('normal');if(N){for(let i=0;i<N.array.length;i++)N.array[i]=-N.array[i];N.needsUpdate=true}return o}
/* Qirra burchagi (daraja) bo'yicha normallarni qayta hisoblash; burchakdan kichik qirralar silliq, katta qirralar qattiq */
function smoothGeo(g,angle){
 const P=g.getAttribute('position'),n=P.count,ix=g.index?g.index.array:null,nf=Math.floor((ix?ix.length:n)/3),I=i=>ix?ix[i]:i,cosA=Math.cos(angle*Math.PI/180);
 const fn=new Float32Array(nf*3),fa=new Float32Array(nf),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let f=0;f<nf;f++){a.fromBufferAttribute(P,I(f*3));b.fromBufferAttribute(P,I(f*3+1));c.fromBufferAttribute(P,I(f*3+2));
  b.sub(a);c.sub(a);b.cross(c);const l=b.length();fa[f]=l;if(l>0)b.multiplyScalar(1/l);fn[f*3]=b.x;fn[f*3+1]=b.y;fn[f*3+2]=b.z}
 const key=i=>Math.round(P.getX(i)*1e4)+','+Math.round(P.getY(i)*1e4)+','+Math.round(P.getZ(i)*1e4),gid=new Map(),vg=new Uint32Array(n);let ng=0;
 for(let i=0;i<n;i++){const k=key(i);let j=gid.get(k);if(j===undefined){j=ng++;gid.set(k,j)}vg[i]=j}
 const lst=Array.from({length:ng},()=>[]);for(let f=0;f<nf;f++)for(let j=0;j<3;j++)lst[vg[I(f*3+j)]].push(f);
 const cn=new Float32Array(nf*9);
 for(let f=0;f<nf;f++)for(let j=0;j<3;j++){let x=0,y=0,z=0;const l=lst[vg[I(f*3+j)]];
  for(const h of l){const d=fn[f*3]*fn[h*3]+fn[f*3+1]*fn[h*3+1]+fn[f*3+2]*fn[h*3+2];if(d>=cosA-1e-6){x+=fn[h*3]*fa[h];y+=fn[h*3+1]*fa[h];z+=fn[h*3+2]*fa[h]}}
  const L=Math.hypot(x,y,z)||1;cn[f*9+j*3]=x/L;cn[f*9+j*3+1]=y/L;cn[f*9+j*3+2]=z/L}
 /* burchaklar bo'yicha yangi nusxa: har burchak alohida, keyin weld */
 const o=new THREE.BufferGeometry();
 for(const name in g.attributes){if(name=='normal')continue;const at=g.attributes[name],s=at.itemSize,arr=new at.array.constructor(nf*3*s);
  for(let i=0;i<nf*3;i++)for(let k=0;k<s;k++)arr[i*s+k]=at.array[I(i)*s+k];o.setAttribute(name,new THREE.BufferAttribute(arr,s,at.normalized))}
 o.setAttribute('normal',new THREE.BufferAttribute(cn,3));g.groups.forEach(r=>o.addGroup(r.start,r.count,r.materialIndex));
 return weldGeo(o,1e-5).g}
/* Yuzalar → alohida geometriya (uchlar ixchamlanadi); fm = [yuz boshiga material indeksi] */
function faceMats(g){const nf=Math.floor((g.index?g.index.count:g.getAttribute('position').count)/3),fm=new Uint16Array(nf);
 g.groups.forEach(r=>{for(let i=r.start/3;i<(r.start+r.count)/3&&i<nf;i++)fm[i]=r.materialIndex||0});return fm}
function subGeo(g,faces,fm){
 const ix=g.index?g.index.array:null,I=i=>ix?ix[i]:i,mp=new Map(),src=[],idx=[],mats=new Map(),order=faces.slice().sort((a,b)=>fm[a]-fm[b]||a-b);
 order.forEach(f=>{for(let j=0;j<3;j++){const v=I(f*3+j);let id=mp.get(v);if(id===undefined){id=src.length;mp.set(v,id);src.push(v)}idx.push(id)}
  if(!mats.has(fm[f]))mats.set(fm[f],mats.size)});
 const o=new THREE.BufferGeometry();
 for(const name in g.attributes){const a=g.attributes[name],s=a.itemSize,arr=new a.array.constructor(src.length*s);
  for(let j=0;j<src.length;j++)for(let c=0;c<s;c++)arr[j*s+c]=a.array[src[j]*s+c];o.setAttribute(name,new THREE.BufferAttribute(arr,s,a.normalized))}
 o.setIndex(new THREE.BufferAttribute(new(src.length>65535?Uint32Array:Uint16Array)(idx),1));
 for(let i=0;i<order.length;){let j=i;while(j<order.length&&fm[order[j]]==fm[order[i]])j++;o.addGroup(i*3,(j-i)*3,mats.get(fm[order[i]]));i=j}
 return{g:o,mats:[...mats.keys()]}}
function islands(g){ /* uchburchaklarni geometrik bog'langan qismlarga ajratadi (pozitsiya bo'yicha, UV chok ajratmaydi) */
 const P=g.getAttribute('position'),n=P.count,ix=g.index?g.index.array:null,nf=Math.floor((ix?ix.length:n)/3),I=i=>ix?ix[i]:i;
 const gid=new Map(),vg=new Uint32Array(n);let ng=0;
 for(let i=0;i<n;i++){const k=Math.round(P.getX(i)*1e4)+','+Math.round(P.getY(i)*1e4)+','+Math.round(P.getZ(i)*1e4);let j=gid.get(k);if(j===undefined){j=ng++;gid.set(k,j)}vg[i]=j}
 const par=new Uint32Array(ng);for(let i=0;i<ng;i++)par[i]=i;const find=x=>{while(par[x]!=x){par[x]=par[par[x]];x=par[x]}return x};
 for(let f=0;f<nf;f++){const a=find(vg[I(f*3)]),b=find(vg[I(f*3+1)]),c=find(vg[I(f*3+2)]);par[b]=a;par[find(c)]=find(a)}
 const comp=new Map();for(let f=0;f<nf;f++){const r=find(vg[I(f*3)]);let l=comp.get(r);if(!l){l=[];comp.set(r,l)}l.push(f)}
 return[...comp.values()].sort((a,b)=>b.length-a.length)}
function separateMesh(m,mode,opt){
 const g=m.geometry,fm=faceMats(g),mats=[].concat(m.material),nf=Math.floor((g.index?g.index.count:g.getAttribute('position').count)/3);
 let parts=[];
 if(mode=='mat'){const by=new Map();for(let f=0;f<nf;f++){let l=by.get(fm[f]);if(!l){l=[];by.set(fm[f],l)}l.push(f)}parts=[...by.entries()].map(([k,l])=>({faces:l,tag:(mats[k]&&mats[k].name)||('mat'+k)}))}
 else{const is=islands(g),min=opt.min||1,max=opt.max||12,big=is.filter(l=>l.length>=min).slice(0,max),small=[];
  const set=new Set(big);is.forEach(l=>{if(!set.has(l))small.push(...l)});
  parts=big.map((l,i)=>({faces:l,tag:String(i+1)}));if(small.length)parts.push({faces:small,tag:'qolgan'})}
 if(parts.length<2)return null;
 return parts.map(p=>{const s=subGeo(g,p.faces,fm),mm=s.mats.map(k=>mats[Math.min(k,mats.length-1)]);
  const o=new THREE.Mesh(s.g,mm.length==1?mm[0]:mm);o.name=m.name+'_'+p.tag;o.position.copy(m.position);o.quaternion.copy(m.quaternion);o.scale.copy(m.scale);return o})}
/* ---------- tugmalar ---------- */
function forPicked(fn,msg){const L=pickReal();if(!L.length)return toast('Avval mesh tanlang');
 const rec=[];L.forEach(m=>{const r=fn(m);if(r)rec.push({m,old:m.geometry,ng:r.g,info:r.info})});
 if(!rec.length)return toast('O’zgarish yo’q');
 rec.forEach(r=>r.m.geometry=r.ng);hist(()=>rec.forEach(r=>r.m.geometry=r.old),()=>rec.forEach(r=>r.m.geometry=r.ng));refresh();
 toast(msg(rec))}
$('#weld').onclick=()=>{const t=parseFloat(prompt('Birlashtirish masofasi','0.0001'));if(!(t>0))return;forPicked(m=>{const r=weldGeo(m.geometry,t);return r.removed?{g:r.g,info:r.removed}:null},rec=>'Weld: '+rec.reduce((s,r)=>s+r.info,0)+' ta ortiqcha uch olib tashlandi')};
$('#flip').onclick=()=>forPicked(m=>({g:flipGeo(m.geometry)}),rec=>rec.length+' ta meshda normallar teskari qilindi');
$('#rnorm').onclick=()=>{const a=parseFloat(prompt('Silliqlash burchagi (daraja): shu burchakdan kichik qirralar silliq bo’ladi','60'));if(!(a>=0))return;
 forPicked(m=>({g:smoothGeo(m.geometry,a)}),rec=>'Normallar qayta hisoblandi (burchak '+a+'°)')};
function doSeparate(mode){
 const L=pickReal();if(L.length!=1)return toast('Bitta mesh tanlang');const m=L[0];let opt={};
 if(mode=='isl'){const mx=parseInt(prompt('Eng ko’pi bilan nechta qism?','12'),10),mn=parseInt(prompt('Eng kam uchburchak (kichiklari “qolgan”ga qo’shiladi)','8'),10);if(!(mx>0))return;opt={max:mx,min:mn>0?mn:1}}
 const parts=separateMesh(m,mode,opt);if(!parts)return toast('Ajratadigan qism topilmadi');
 const p=m.parent,idx=p.children.indexOf(m);select(null);p.remove(m);parts.forEach(o=>p.add(o));
 hist(()=>{parts.forEach(o=>p.remove(o));p.add(m)},()=>{p.remove(m);parts.forEach(o=>p.add(o))});
 MS.clear();parts.forEach(o=>MS.add(o));select(parts[0]);toast(parts.length+' ta qismga ajratildi')}
$('#sepisl').onclick=()=>doSeparate('isl');$('#sepmat').onclick=()=>doSeparate('mat');
$('#cen').onclick=()=>{const L=pickReal();if(!L.length)return toast('Avval mesh tanlang');
 const rec=L.map(m=>{m.geometry.computeBoundingBox();const c=m.geometry.boundingBox.getCenter(new THREE.Vector3()),g=m.geometry.clone().translate(-c.x,-c.y,-c.z);
  return{m,og:m.geometry,ng:g,op:m.position.clone(),np:m.position.clone().add(c.multiply(m.scale).applyQuaternion(m.quaternion))}});
 const go=back=>rec.forEach(r=>{r.m.geometry=back?r.og:r.ng;r.m.position.copy(back?r.op:r.np)});
 go(false);hist(()=>go(true),()=>go(false));refresh();toast('Tayanch nuqta geometriya markaziga o’rnatildi')};
/* ---------- GTA avtomobil ierarxiyasi ---------- */
const VEH_REQ=['chassis_dummy','wheel_lf_dummy','wheel_rf_dummy','wheel_lb_dummy','wheel_rb_dummy'];
const VEH_REC=['door_lf_dummy','door_rf_dummy','door_lr_dummy','door_rr_dummy','bonnet_dummy','boot_dummy','bump_front_dummy','bump_rear_dummy','windscreen_dummy','wing_lf_dummy','wing_rf_dummy','wing_lr_dummy','wing_rr_dummy'];
const baseName=n=>String(n||'').toLowerCase().replace(/_mesh$/,'').replace(/(\.\d+|_\d{3})$/,'');
function vehCheck(names){
 const set=new Set(names.map(baseName)),miss=VEH_REQ.filter(n=>!set.has(n)),rec=VEH_REC.filter(n=>!set.has(n)),pairs=[];
 set.forEach(n=>{if(/_ok$/.test(n)&&!set.has(n.replace(/_ok$/,'_dam')))pairs.push(n.replace(/_ok$/,'_dam'));else if(/_dam$/.test(n)&&!set.has(n.replace(/_dam$/,'_ok')))pairs.push(n.replace(/_dam$/,'_ok'))});
 return{miss,rec,pairs}}
const gtaOut=t=>{$('#gtainfo').textContent=t};
$('#vchk').onclick=()=>{const names=[];root.traverse(o=>{if(o!==root&&o.name)names.push(o.name)});if(!names.length)return toast('Model yo’q');
 const r=vehCheck(names);
 gtaOut((r.miss.length?'Majburiy yo’q: '+r.miss.join(', '):'Majburiy dummylar bor ✓')+'\n'+(r.rec.length?'Tavsiya etiladi (modelga qarab): '+r.rec.join(', '):'Tavsiya etilgan dummylar bor ✓')+'\n'+(r.pairs.length?'Juftligi yo’q _ok/_dam: '+r.pairs.join(', '):'_ok/_dam juftliklari to’liq ✓'))};
$('#vmk').onclick=()=>{const names=[];root.traverse(o=>{if(o!==root&&o.name)names.push(o.name)});const r=vehCheck(names),all=r.miss.concat(r.rec);
 if(!all.length)return toast('Yaratadigan dummy yo’q');const b=new THREE.Box3();realMeshes().forEach(m=>b.expandByObject(m));const c=b.isEmpty()?new THREE.Vector3():b.getCenter(new THREE.Vector3());
 const made=all.map(n=>{const d=mkDummy(n);d.position.copy(c);root.add(d);return d});
 hist(()=>made.forEach(d=>root.remove(d)),()=>made.forEach(d=>root.add(d)));refresh();toast(made.length+' ta dummy yaratildi (markazda) — kerakli joyga suring')};
$('#vpair').onclick=()=>{const rec=[];root.traverse(o=>{if(!o.isMesh||o.userData.dummy)return;const n=o.name.replace(/_mesh$/,'');
  const m=n.match(/^(.*)_(ok|dam)$/i);if(!m)return;const other=m[1]+'_'+(m[2].toLowerCase()=='ok'?'dam':'ok');
  if(!meshes().some(x=>x.name.replace(/_mesh$/,'').toLowerCase()==other.toLowerCase())&&!rec.some(r=>r.name==other)){const d=o.clone();d.material=Array.isArray(o.material)?o.material.map(x=>x.clone()):o.material.clone();d.geometry=o.geometry.clone();d.name=other;d.userData.pairOf=o;rec.push(d)}});
 if(!rec.length)return toast('Juftligi yo’q qism topilmadi');rec.forEach(d=>d.userData.pairOf.parent.add(d));
 hist(()=>rec.forEach(d=>d.parent&&d.parent.remove(d)),()=>rec.forEach(d=>d.userData.pairOf.parent.add(d)));refresh();toast(rec.length+' ta juft nusxa yaratildi: '+rec.map(d=>d.name).join(', '))};
