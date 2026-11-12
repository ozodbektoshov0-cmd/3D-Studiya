/* ---- Studiya+ (v45): Prisma3D va ZModeler'da ko’rilgan imkoniyatlarning o’zimizcha (noldan yozilgan) variantlari ----
   1) Video yozish: viewport yoki turntable 360° → .webm (MediaRecorder)
   2) Avto-rig: tanlangan meshga suyak zanjiri + vaznlar (SkinnedMesh), keyin poza berish mumkin
   3) Loyiha fayli (.s3dp): sahna (GLB) + kamera + fon bitta faylda; Ctrl+S
   4) Silliqlash (Taubin): yuzani tekislaydi, hajmni saqlaydi; ochiq chekkalar joyida qoladi
   5) Mesh tekshiruvi: teshik, manifold bo’lmagan qirra, teskari yuza, bog’langan qismlar, watertight (3D bosib chiqarish uchun)
   6) Teshiklarni yopish: ochiq chekka halqalari markaz nuqtaga (fan) ulanadi, yo’nalish mos
   7) Vazn xaritasi (suyak bo’yicha ko’k→qizil) va vaznlarni silliqlash (rig sifatini yaxshilaydi) */
(function(){
const mime=()=>window.MediaRecorder&&['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
let rec=null;
function record(sec){
 if(rec&&rec.state=='recording')return rec.stop();
 const mt=mime();if(!mt)return toast('Bu brauzer video yozishni qo’llamaydi');
 const vis=[grid,axs,tc].map(o=>o.visible),bm=window.bh&&bh.material.visible,ar=ctl.autoRotate,sp=ctl.autoRotateSpeed,ch=[];
 [grid,axs,tc].forEach(o=>o.visible=false);if(window.bh)bh.material.visible=false;
 R.setClearColor(0x1d1d1d,1);
 if(sec){ctl.autoRotate=true;ctl.autoRotateSpeed=60/sec}   // OrbitControls: 60/tezlik = soniya (60 FPS da)
 rec=new MediaRecorder(cv.captureStream(30),{mimeType:mt,videoBitsPerSecond:8e6});
 rec.ondataavailable=e=>e.data.size&&ch.push(e.data);
 rec.onstop=()=>{[grid,axs,tc].forEach((o,i)=>o.visible=vis[i]);if(window.bh)bh.material.visible=bm;
  R.setClearColor(0x000000,0);ctl.autoRotate=ar;ctl.autoRotateSpeed=sp;
  saveBlob(new Blob(ch,{type:'video/webm'}),name+'.webm');toast('Video saqlandi: '+name+'.webm')};
 rec.start();toast(sec?'Turntable yozilmoqda ('+sec+' s)…':'Yozilmoqda — to’xtatish uchun yana bosing');
 if(sec)setTimeout(()=>rec&&rec.state=='recording'&&rec.stop(),sec*1000);
}
/* mesh → SkinnedMesh: eng uzun o’q bo’yicha n ta suyak, qo’shni suyaklar orasida chiziqli vazn */
function rig(m,n){
 const g=m.geometry.clone();g.computeBoundingBox();
 const b=g.boundingBox,sz=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),
  ax=sz.x>=sz.y&&sz.x>=sz.z?'x':sz.z>sz.y?'z':'y',A=ax.toUpperCase(),lo=b.min[ax],h=sz[ax]||1,bones=[];
 for(let i=0;i<n;i++){const k=new THREE.Bone();k.name=(m.name||'mesh')+'_bone'+i;
  if(i){k.position[ax]=h/(n-1);bones[i-1].add(k)}else{k.position.copy(c);k.position[ax]=lo}
  bones.push(k)}
 const P=g.attributes.position,si=new Uint16Array(P.count*4),sw=new Float32Array(P.count*4);
 for(let v=0;v<P.count;v++){
  const t=THREE.MathUtils.clamp((P['get'+A](v)-lo)/h,0,1)*(n-1),i=Math.min(Math.floor(t),n-2),f=t-i;
  si.set([i,i+1,0,0],v*4);sw.set([1-f,f,0,0],v*4)}
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));
 g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
 const sm=new THREE.SkinnedMesh(g,m.material);sm.name=m.name;sm.userData=m.userData;
 sm.position.copy(m.position);sm.quaternion.copy(m.quaternion);sm.scale.copy(m.scale);
 sm.add(bones[0]);sm.updateMatrixWorld(true);sm.bind(new THREE.Skeleton(bones));
 return sm;
}
function autoRig(){
 const m=sel;if(!m||!m.isMesh||m.isSkinnedMesh)return toast('Oddiy (skeletsiz) meshni tanlang');
 if(m.children.length)return toast(m.name+': ichida bolalari bor, avval ajrating');
 const n=Math.round(+prompt('Suyaklar soni (2–24):',6));if(!(n>=2&&n<=24))return toast('2 dan 24 gacha son kiriting');
 const p=m.parent,sm=rig(m,n);p.add(sm);p.remove(m);tc.detach();sel=null;
 if(typeof hist=='function')hist(()=>{p.remove(sm);p.add(m)},()=>{p.remove(m);p.add(sm)});
 if(typeof sync=='function')sync();
 toast('Rig tayyor: '+n+' suyak. Meshni tanlab “Poza: egish” yoki Skelet menyusidan foydalaning');
}
function bend(){
 const m=sel;if(!m||!m.isSkinnedMesh)return toast('Avto-rig qilingan meshni tanlang');
 const a=+prompt('Umumiy egilish burchagi (daraja):',60);if(isNaN(a))return;
 const bs=m.skeleton.bones;bs.forEach((k,i)=>{if(i)k.rotation.z=THREE.MathUtils.degToRad(a)/(bs.length-1)});
}
/* --- loyiha fayli (.s3dp): 'S3DP' + u32 (JSON uzunligi) + JSON(meta) + GLB --- */
const enc=new TextEncoder(),dec=new TextDecoder();
function pack(glb,meta){const j=enc.encode(JSON.stringify(meta)),o=new Uint8Array(8+j.length+glb.byteLength);
 o.set(enc.encode('S3DP'));new DataView(o.buffer).setUint32(4,j.length,true);o.set(j,8);o.set(new Uint8Array(glb),8+j.length);return o}
function unpack(buf){const u=new Uint8Array(buf);if(u.length<12||dec.decode(u.subarray(0,4))!='S3DP')throw Error('Bu 3D Studiya loyiha fayli emas');
 const n=new DataView(buf).getUint32(4,true);if(8+n>u.length)throw Error('Loyiha fayli buzilgan');
 return{meta:JSON.parse(dec.decode(u.subarray(8,8+n))),glb:buf.slice(8+n)}}
function saveProj(){
 if(!meshes().length)return toast('Avval model oching');
 if(window.xrayPause)xrayPause();tc.detach();
 const meta={v:1,name,bg:vp.style.background||'',cam:cam.position.toArray(),tgt:ctl.target.toArray()};
 const hid=[];root.traverse(o=>{if(o!==root&&!o.visible){o.userData.__hid=1;hid.push(o)}});   // glTF yashirinlikni saqlamaydi: belgi qo’yamiz
 const end=()=>{hid.forEach(o=>delete o.userData.__hid);if(window.xrayResume)xrayResume();if(sel)tc.attach(sel)};
 const cb=r=>{end();saveBlob(new Blob([pack(r,meta)],{type:'application/octet-stream'}),name+'.s3dp');toast('Loyiha saqlandi: '+name+'.s3dp')},
  fail=e=>{end();toast('Xato: '+(e.message||e))},x=new THREE.GLTFExporter(),o={binary:true,onlyVisible:false,animations:window.CLIPS||[]};
 try{x.parse.length>3?x.parse(root,cb,fail,o):x.parse(root,cb,o)}catch(e){fail(e)}
}
async function openProj(f){
 const{meta,glb}=unpack(await f.arrayBuffer());
 const g=await new Promise((ok,no)=>new THREE.GLTFLoader().parse(glb,'',ok,no)),o=g.scene;
 o.traverse(n=>{if(n.userData&&n.userData.__hid){n.visible=false;delete n.userData.__hid}});
 o.animations=g.animations;if(typeof gltfTexNames=='function')gltfTexNames(g);texNames(o);
 name=meta.name||f.name.replace(/\.[^.]+$/,'');o.name=name;root.add(o);
 if(o.animations.length)anim(o);$('#hint').style.display='none';refresh();fit(o);
 if(meta.bg)vp.style.background=meta.bg;
 if(meta.cam&&meta.tgt){cam.position.fromArray(meta.cam);ctl.target.fromArray(meta.tgt);ctl.update()}
 toast('Loyiha ochildi: '+name);
}
const l0=load;load=async function(f){return /\.s3dp$/i.test(f.name)?openProj(f):l0(f)};   // loader.js dagi load() ni kengaytiramiz
const pin=document.createElement('input');pin.type='file';pin.accept='.s3dp';pin.hidden=true;
pin.onchange=e=>{loadAll([...e.target.files]);e.target.value=''};document.body.append(pin);
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.code=='KeyS'){e.preventDefault();saveProj()}});
/* bir xil joydagi uchlarni birlashtirish (UV choki, non-indexed) — silliqlash va tekshiruv uchun umumiy */
function topo(g){
 const P=g.attributes.position,n=P.count,key=new Map(),id=new Int32Array(n),q=v=>Math.round(v*1e5);let u=0;
 for(let i=0;i<n;i++){const k=q(P.getX(i))+','+q(P.getY(i))+','+q(P.getZ(i));let j=key.get(k);if(j===undefined)key.set(k,j=u++);id[i]=j}
 const ix=g.index?g.index.array:null;return{P,n,id,u,nt:(ix?ix.length:n)/3,T:(t,c)=>ix?ix[t*3+c]:t*3+c};
}
/* qo’shni uchlar (nb) va qirra soni (ec) — birlashtirilgan uchlar bo’yicha */
function adjacency(tp){
 const{id,u,nt,T}=tp,nb=Array.from({length:u},()=>new Set()),ec=new Map();
 for(let t=0;t<nt;t++)for(let c=0;c<3;c++){const a=id[T(t,c)],b=id[T(t,(c+1)%3)];if(a==b)continue;nb[a].add(b);nb[b].add(a);const e=a<b?a+'_'+b:b+'_'+a;ec.set(e,(ec.get(e)||0)+1)}
 return{nb,ec};
}
/* --- silliqlash: Taubin (λ|μ) — oddiy Laplace kabi kichraytirmaydi. Bir xil joydagi uchlar (UV chokida) birga siljiydi, ochiq chekka qotiriladi --- */
function smooth(g,iter){
 const tp=topo(g),{P,n,id,u,nt,T}=tp,{nb,ec}=adjacency(tp);
 const fix=new Uint8Array(u);ec.forEach((c,e)=>{if(c==1){const[a,b]=e.split('_');fix[a]=fix[b]=1}});
 let X=new Float64Array(u*3);for(let i=0;i<n;i++){X[id[i]*3]=P.getX(i);X[id[i]*3+1]=P.getY(i);X[id[i]*3+2]=P.getZ(i)}
 const pass=f=>{const Y=Float64Array.from(X);for(let v=0;v<u;v++){const N=nb[v];if(fix[v]||!N.size)continue;
  let a=0,b=0,c=0;N.forEach(w=>{a+=X[w*3];b+=X[w*3+1];c+=X[w*3+2]});a/=N.size;b/=N.size;c/=N.size;
  Y[v*3]+=f*(a-X[v*3]);Y[v*3+1]+=f*(b-X[v*3+1]);Y[v*3+2]+=f*(c-X[v*3+2])}X=Y};
 for(let k=0;k<iter;k++){pass(.6307);pass(-.6732)}
 const ng=g.clone(),Q=ng.attributes.position,NA=new Float64Array(u*3);
 for(let i=0;i<n;i++)Q.setXYZ(i,X[id[i]*3],X[id[i]*3+1],X[id[i]*3+2]);
 for(let t=0;t<nt;t++){const a=id[T(t,0)],b=id[T(t,1)],c=id[T(t,2)],
  ux=X[b*3]-X[a*3],uy=X[b*3+1]-X[a*3+1],uz=X[b*3+2]-X[a*3+2],vx=X[c*3]-X[a*3],vy=X[c*3+1]-X[a*3+1],vz=X[c*3+2]-X[a*3+2],
  nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;[a,b,c].forEach(w=>{NA[w*3]+=nx;NA[w*3+1]+=ny;NA[w*3+2]+=nz})}
 const nm=new Float32Array(n*3);for(let i=0;i<n;i++){const w=id[i]*3,l=Math.hypot(NA[w],NA[w+1],NA[w+2])||1;nm[i*3]=NA[w]/l;nm[i*3+1]=NA[w+1]/l;nm[i*3+2]=NA[w+2]/l}
 ng.setAttribute('normal',new THREE.BufferAttribute(nm,3));ng.computeBoundingBox();ng.computeBoundingSphere();return ng;
}
function doSmooth(){
 const m=sel;if(!m||!m.isMesh)return toast('Meshni tanlang');
 const it=Math.round(+prompt('Silliqlash qadamlari (1–50):',5));if(!(it>=1&&it<=50))return toast('1 dan 50 gacha son kiriting');
 const og=m.geometry,ng=smooth(og,it);m.geometry=ng;
 if(typeof hist=='function')hist(()=>{m.geometry=og},()=>{m.geometry=ng});
 if(typeof sync=='function')sync();toast('Silliqlandi: '+it+' qadam (ochiq chekkalar joyida)');
}
/* mesh tekshiruvi: qirralar soni (1 = teshik chekkasi, >2 = manifold emas), bir xil yo’nalishda takrorlangan qirra = teskari yuza */
function analyze(g){
 const{P,id,u,nt,T}=topo(g),ec=new Map(),dc=new Map(),par=Int32Array.from({length:u},(_,i)=>i),used=new Set(),
  find=a=>{while(par[a]!=a)a=par[a]=par[par[a]];return a};let deg=0;
 for(let t=0;t<nt;t++){const i0=T(t,0),i1=T(t,1),i2=T(t,2),a=id[i0],b=id[i1],c=id[i2],
  ux=P.getX(i1)-P.getX(i0),uy=P.getY(i1)-P.getY(i0),uz=P.getZ(i1)-P.getZ(i0),vx=P.getX(i2)-P.getX(i0),vy=P.getY(i2)-P.getY(i0),vz=P.getZ(i2)-P.getZ(i0);
  if(a==b||b==c||a==c||Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-12){deg++;continue}
  [[a,b],[b,c],[c,a]].forEach(([x,y])=>{const e=x<y?x+'_'+y:y+'_'+x,d=x+'>'+y;ec.set(e,(ec.get(e)||0)+1);dc.set(d,(dc.get(d)||0)+1)});
  used.add(a);used.add(b);used.add(c);par[find(a)]=find(b);par[find(b)]=find(c)}
 let bd=0,nm=0,bad=0;ec.forEach(c=>{if(c==1)bd++;else if(c>2)nm++});dc.forEach(c=>{if(c>1)bad++});
 const roots=new Set();used.forEach(v=>roots.add(find(v)));
 const V=used.size,E=ec.size,F=nt-deg,comp=roots.size,wt=F>0&&!bd&&!nm&&!bad;
 return{tris:F,verts:V,edges:E,degenerate:deg,boundary:bd,nonManifold:nm,flipped:bad,components:comp,watertight:wt,genus:wt?(2*comp-(V-E+F))/2:null};
}
function showReport(title,rows){
 let d=document.getElementById('mchk');if(!d){d=document.createElement('dialog');d.id='mchk';document.body.append(d)}
 d.textContent='';const h=document.createElement('div'),b=document.createElement('b'),sp=document.createElement('span'),x=document.createElement('button'),l=document.createElement('div');
 h.className='ph';b.textContent=title;sp.className='sp';x.textContent='Yopish';x.onclick=()=>d.close();h.append(b,sp,x);
 l.style.cssText='padding:8px 12px;font-size:13px;line-height:1.7';rows.forEach(r=>{const p=document.createElement('div');p.textContent=r;l.append(p)});d.append(h,l);d.showModal();
}
function doCheck(){
 const m=sel;if(!m||!m.isMesh)return toast('Meshni tanlang');
 const r=analyze(m.geometry),ok=(c,t,f)=>c?'✓ '+t:'✗ '+f,rows=[
  'Uchburchak: '+r.tris+' · Uch (birlashtirilgan): '+r.verts+' · Qirra: '+r.edges,
  'Bog’langan qismlar: '+r.components,
  ok(!r.boundary,'Teshik yo’q','Ochiq chekka (teshik): '+r.boundary+' ta qirra'),
  ok(!r.nonManifold,'Manifold bo’lmagan qirra yo’q','Manifold bo’lmagan qirra: '+r.nonManifold+' (3+ yuza birlashgan)'),
  ok(!r.flipped,'Yuzalar yo’nalishi mos','Yo’nalishi mos emas: '+r.flipped+' ta qirra (teskari yuza bor — “Normalni teskari” sinab ko’ring)'),
  ok(!r.degenerate,'Buzuq (yuzasiz) uchburchak yo’q','Buzuq uchburchak: '+r.degenerate+' (“Weld” yoki tozalash kerak)'),
  r.watertight?'✓ Suv o’tkazmaydi (3D bosib chiqarish uchun yaroqli)'+(r.genus!=null?' · genus '+r.genus:''):'✗ Suv o’tkazmaydi emas — STL bosib chiqarishda muammo bo’lishi mumkin'];
 showReport((m.name||'mesh')+' — tekshiruv',rows);
}
/* --- teshiklarni yopish: ochiq chekka halqasini topib, markaz nuqtaga “fan” qilib yopadi (yo’nalish qo’shni yuzalarga mos) --- */
function fillHoles(g){
 const{P,n,id,u,nt,T}=topo(g),ec=new Map(),de=[];
 for(let t=0;t<nt;t++){const a=id[T(t,0)],b=id[T(t,1)],c=id[T(t,2)];if(a==b||b==c||a==c)continue;
  [[a,b],[b,c],[c,a]].forEach(([x,y])=>{const e=x<y?x+'_'+y:y+'_'+x;ec.set(e,(ec.get(e)||0)+1);de.push([x,y,e])})}
 const next=new Map();de.forEach(([x,y,e])=>{if(ec.get(e)==1)next.set(x,y)});
 const rep=new Int32Array(u).fill(-1);for(let i=0;i<n;i++)if(rep[id[i]]<0)rep[id[i]]=i;
 const seen=new Set(),loops=[];let skipped=0;
 next.forEach((_,x0)=>{if(seen.has(x0))return;const L=[x0];seen.add(x0);let c=next.get(x0);
  while(c!==undefined&&c!==x0&&!seen.has(c)){L.push(c);seen.add(c);c=next.get(c)}
  if(c===x0&&L.length>=3)loops.push(L);else skipped++});
 if(!loops.length)return{geo:null,holes:0,tris:0,skipped};
 const pt=i=>[P.getX(i),P.getY(i),P.getZ(i)],tr=[];
 loops.forEach(L=>{const k=L.length,C=[0,0,0];L.forEach(w=>pt(rep[w]).forEach((v,j)=>C[j]+=v/k));
  for(let i=0;i<k;i++){const q=rep[L[(i+1)%k]],p=rep[L[i]],A=pt(q),B=pt(p),ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2],
   nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz)||1;tr.push({src:[q,p,rep[L[0]]],pos:[A,B,C],nrm:[nx/l,ny/l,nz/l]})}});   // (q,p,c): qo’shni yuzaga teskari yo’nalishda
 const add=tr.length*3,ng=new THREE.BufferGeometry(),ix=g.index?g.index.array:null,XYZW='XYZW';
 for(const name in g.attributes){const a=g.attributes[name],s=a.itemSize,A=new a.array.constructor((n+add)*s);
  for(let i=0;i<n;i++)for(let k=0;k<s;k++)A[i*s+k]=a['get'+XYZW[k]](i);
  tr.forEach((f,ti)=>{for(let vi=0;vi<3;vi++){const o=(n+ti*3+vi)*s;
   if(name=='position')f.pos[vi].forEach((v,k)=>A[o+k]=v);else if(name=='normal')f.nrm.forEach((v,k)=>A[o+k]=v);
   else for(let k=0;k<s;k++)A[o+k]=a['get'+XYZW[k]](f.src[vi])}});
  ng.setAttribute(name,new THREE.BufferAttribute(A,s,a.normalized))}
 if(ix){const I=new Uint32Array(ix.length+add);I.set(ix);for(let i=0;i<add;i++)I[ix.length+i]=n+i;ng.setIndex(new THREE.BufferAttribute(I,1))}
 g.groups.forEach(gr=>ng.addGroup(gr.start,gr.count,gr.materialIndex));if(g.groups.length)ng.addGroup(ix?ix.length:n,add,g.groups[0].materialIndex);
 ng.computeBoundingBox();ng.computeBoundingSphere();return{geo:ng,holes:loops.length,tris:tr.length,skipped};
}
function doFill(){
 const m=sel;if(!m||!m.isMesh)return toast('Meshni tanlang');
 const r=fillHoles(m.geometry);if(!r.geo)return toast(r.skipped?'Teshiklar murakkab (yopiq halqa emas), yopilmadi':'Teshik topilmadi — mesh yopiq');
 const og=m.geometry,ng=r.geo;m.geometry=ng;
 if(typeof hist=='function')hist(()=>{m.geometry=og},()=>{m.geometry=ng});if(typeof sync=='function')sync();
 toast('Yopildi: '+r.holes+' ta teshik, +'+r.tris+' uchburchak'+(r.skipped?' ('+r.skipped+' tasi murakkab, o’tkazildi)':''));
}
/* --- vaznlar: xarita (rang) va silliqlash --- */
const XYZW='XYZW';
function weightColors(g,b){   // 0 = ko’k, 0.5 = yashil, 1 = qizil
 const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,n=si.count,C=new Float32Array(n*3);
 for(let i=0;i<n;i++){let w=0;for(let k=0;k<4;k++)if(si['get'+XYZW[k]](i)==b)w+=sw['get'+XYZW[k]](i);w=Math.min(1,w);
  C[i*3]=w<.5?0:2*w-1;C[i*3+1]=w<.5?2*w:2-2*w;C[i*3+2]=w<.5?1-2*w:0}
 return C;
}
function smoothWeights(g,B,iter){   // har uchda B ta suyak vazni; qo’shnilar bilan aralashtiriladi, eng kuchli 4 tasi qoladi
 const tp=topo(g),{n,id,u}=tp,{nb}=adjacency(tp),si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
 let W=new Float32Array(u*B);const seen=new Uint8Array(u);
 for(let i=0;i<n;i++){const w=id[i];if(seen[w])continue;seen[w]=1;for(let k=0;k<4;k++){const x=sw['get'+XYZW[k]](i);if(x>0)W[w*B+si['get'+XYZW[k]](i)]+=x}}
 for(let it=0;it<iter;it++){const Y=Float32Array.from(W);
  for(let v=0;v<u;v++){const N=nb[v];if(!N.size)continue;for(let b=0;b<B;b++){let a=0;N.forEach(w=>a+=W[w*B+b]);Y[v*B+b]=.5*W[v*B+b]+.5*a/N.size}}W=Y}
 const I=new Uint16Array(n*4),S=new Float32Array(n*4);
 for(let i=0;i<n;i++){const o=id[i]*B,top=[];for(let b=0;b<B;b++)if(W[o+b]>1e-4)top.push([b,W[o+b]]);
  top.sort((x,y)=>y[1]-x[1]);const t4=top.slice(0,4),sum=t4.reduce((a,x)=>a+x[1],0)||1;t4.forEach(([b,w],k)=>{I[i*4+k]=b;S[i*4+k]=w/sum})}
 return{si:new THREE.Uint16BufferAttribute(I,4),sw:new THREE.Float32BufferAttribute(S,4)};
}
const WV=new WeakMap();
function doWeightView(){
 const m=sel;if(!m||!m.isSkinnedMesh)return toast('Avto-rig qilingan meshni tanlang');
 const g=m.geometry,ms=[].concat(m.material);
 if(WV.has(m)){const o=WV.get(m);WV.delete(m);o.col?g.setAttribute('color',o.col):g.deleteAttribute('color');ms.forEach((x,i)=>{x.vertexColors=o.vc[i];x.needsUpdate=true});return toast('Vazn xaritasi o’chirildi')}
 const B=m.skeleton.bones.length,b=Math.round(+prompt('Qaysi suyak vazni (0–'+(B-1)+'):',0));if(!(b>=0&&b<B))return toast('0 dan '+(B-1)+' gacha son kiriting');
 WV.set(m,{col:g.getAttribute('color')||null,vc:ms.map(x=>x.vertexColors)});
 g.setAttribute('color',new THREE.BufferAttribute(weightColors(g,b),3));ms.forEach(x=>{x.vertexColors=true;x.needsUpdate=true});
 toast('Suyak '+b+': ko’k = 0, yashil = 0.5, qizil = 1. Eksportdan oldin yana bosib o’chiring');
}
function doSmoothWeights(){
 const m=sel;if(!m||!m.isSkinnedMesh)return toast('Avto-rig qilingan meshni tanlang');
 const it=Math.round(+prompt('Vazn silliqlash qadamlari (1–20):',3));if(!(it>=1&&it<=20))return toast('1 dan 20 gacha son kiriting');
 if(WV.has(m))doWeightView();
 const g=m.geometry,o={si:g.attributes.skinIndex,sw:g.attributes.skinWeight},nw=smoothWeights(g,m.skeleton.bones.length,it),
  set=x=>{g.setAttribute('skinIndex',x.si);g.setAttribute('skinWeight',x.sw)};set(nw);
 if(typeof hist=='function')hist(()=>set(o),()=>set(nw));toast('Vaznlar silliqlandi: '+it+' qadam');
}
menu('Studiya+',[
 ['rcv','Video yozish (boshlash / to’xtatish)',()=>record(0)],
 ['rct','Turntable 360° video (8 s)',()=>record(8)],
 ['rig','Avto-rig (suyak zanjiri + vazn)…',autoRig],
 ['rgb','Poza: skeletni egish…',bend],
 ['wvw','Vazn xaritasi (suyak bo’yicha)…',doWeightView],
 ['wsm','Vaznlarni silliqlash…',doSmoothWeights],
 ['mck','Mesh tekshiruvi (teshik, watertight)…',doCheck],
 ['fhl','Teshiklarni yopish…',doFill],
 ['smt','Silliqlash (Taubin, hajmni saqlaydi)…',doSmooth],
 ['spv','Loyihani saqlash (.s3dp) · Ctrl+S',saveProj],
 ['spo','Loyihani ochish (.s3dp)…',()=>pin.click()]]);
window.StudioPlus={record,rig,pack,unpack,saveProj,smooth,analyze,fillHoles,weightColors,smoothWeights};
})();
