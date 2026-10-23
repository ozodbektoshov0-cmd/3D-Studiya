/* ---- Hammasini tanlash, guruh bo'lib ko'chirish/aylantirish, Reset to parent ---- */
const gpv=new THREE.Object3D();gpv.userData.grp=true;S.add(gpv);
const tops=()=>{const a=pick(),s=new Set(a);return a.filter(o=>{for(let p=o.parent;p;p=p.parent)if(s.has(p))return false;return true})};
let G0=null;
function groupSync(){
 if(window.em)return;
 const t=tops();
 if(t.length>=2){
  const b=new THREE.Box3();t.forEach(o=>b.expandByObject(o));
  if(!b.isEmpty()){gpv.position.copy(b.getCenter(new THREE.Vector3()));gpv.quaternion.identity();gpv.scale.set(1,1,1);gpv.updateMatrixWorld(true);if(tc.object!==gpv)tc.attach(gpv)}
 }else if(tc.object===gpv){sel?tc.attach(sel):tc.detach()}
}
const _refresh=refresh;
refresh=function(){_refresh.apply(this,arguments);groupSync()};
function selectAll(){
 if(window.em)return toast('Avval Edit rejimidan chiqing');
 const a=meshes();if(!a.length)return toast('Model yo’q');
 MS.clear();a.forEach(m=>MS.add(m));select(a[0]);
 toast(a.length+' ta obyekt tanlandi — ko’chirish/aylantirish hammasiga ta’sir qiladi');
}
function setLocal(o,m){const p=o.parent;if(p){p.updateWorldMatrix(true,false);m=new THREE.Matrix4().copy(p.matrixWorld).invert().multiply(m)}m.decompose(o.position,o.quaternion,o.scale)}
tc.addEventListener('mouseDown',()=>{
 if(tc.object!==gpv)return;gpv.updateMatrixWorld(true);
 G0={inv:gpv.matrixWorld.clone().invert(),items:tops().map(o=>{o.updateWorldMatrix(true,false);return{o,W:o.matrixWorld.clone(),p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}})}});
tc.addEventListener('objectChange',()=>{
 if(tc.object!==gpv||!G0)return;gpv.updateMatrixWorld(true);
 const d=new THREE.Matrix4().multiplyMatrices(gpv.matrixWorld,G0.inv);
 G0.items.forEach(it=>setLocal(it.o,new THREE.Matrix4().multiplyMatrices(d,it.W)))});
tc.addEventListener('mouseUp',()=>{
 if(tc.object!==gpv||!G0)return;const g=G0;G0=null;
 const a=g.items,b=a.map(it=>({o:it.o,p:it.o.position.clone(),q:it.o.quaternion.clone(),s:it.o.scale.clone()}));
 const put=(arr,k)=>arr.forEach(x=>{x.o.position.copy(x[k[0]]);x.o.quaternion.copy(x[k[1]]);x.o.scale.copy(x[k[2]])});
 hist(()=>{a.forEach(x=>{x.o.position.copy(x.p);x.o.quaternion.copy(x.q);x.o.scale.copy(x.s)});groupSync()},
      ()=>{b.forEach(x=>{x.o.position.copy(x.p);x.o.quaternion.copy(x.q);x.o.scale.copy(x.s)});groupSync()})});
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='a'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.preventDefault();selectAll()}});
$('#selall').onclick=selectAll;
/* ---- Reset to parent: har bir obyektning aylanishi va masshtabi geometriyaga "pishiriladi", o'qlari ota-obyekt (ildiz) o'qlariga tenglashadi.
   Vizual joylashuv o'zgarmaydi. DFF eksportda frame matritsalari aylanishsiz bo'ladi (o'yinda hamma qism bir xil yo'nalishda turadi). */
function flipWinding(g){
 let ix=g.index;if(!ix){const n=g.getAttribute('position').count;g.setIndex(Array.from({length:n},(_,i)=>i));ix=g.index}
 const a=ix.array;for(let i=0;i+2<a.length;i+=3){const t=a[i+1];a[i+1]=a[i+2];a[i+2]=t}ix.needsUpdate=true}
function hasSkin(o){let f=false;o.traverse(x=>{if(x.isSkinnedMesh||x.isBone)f=true});return f}
function resetToParent(list){
 const done=[],sk=[],I4=new THREE.Matrix4();
 /* E = ota-obyektlarning allaqachon "pishirilgan" chiziqli matritsasi. Har obyekt: yangi joy = E·joy, geometriya = E·(R·S)·geometriya.
    TRS ga qayta ajratish yo'q, shuning uchun (nomutanosib masshtab + aylanish bo'lsa ham) aniq. */
 const walk=(o,E)=>{
  if(hasSkin(o)){if(o.isMesh)sk.push(o);return}
  const Rs=new THREE.Matrix4().compose(new THREE.Vector3(),o.quaternion,o.scale),L=new THREE.Matrix4().multiplyMatrices(E,Rs),np=o.position.clone().applyMatrix4(E);
  const changed=!L.equals(I4)||!E.equals(I4);
  if(changed){
   const rec={o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),g:o.geometry};
   if(o.isMesh&&!o.userData.dummy&&!L.equals(I4)){const g=o.geometry.clone();g.applyMatrix4(L);if(L.determinant()<0)flipWinding(g);g.computeBoundingBox();g.computeBoundingSphere();o.geometry=g;rec.ng=g}
   o.position.copy(np);o.quaternion.identity();o.scale.set(1,1,1);
   rec.p2=o.position.clone();rec.q2=o.quaternion.clone();rec.s2=o.scale.clone();done.push(rec)}
  o.children.slice().forEach(c=>walk(c,L))};
 list.forEach(o=>{const E=new THREE.Matrix4();walk(o,E)});
 return{done,sk}}
function applyRec(rec,back){
 const o=rec.o;o.position.copy(back?rec.p:rec.p2);o.quaternion.copy(back?rec.q:rec.q2);o.scale.copy(back?rec.s:rec.s2);
 if(rec.ng)o.geometry=back?rec.g:rec.ng}
$('#rtp').onclick=()=>{
 if(window.em)return toast('Avval Edit rejimidan chiqing');
 let list=tops();if(!list.length)list=root.children.slice();
 const r=resetToParent(list);
 if(!r.done.length)return toast(r.sk.length?'Skeletli meshlar o’tkazib yuborildi':'Hamma obyekt allaqachon to’g’ri turibdi (aylanish/masshtab yo’q)');
 hist(()=>{r.done.slice().reverse().forEach(x=>applyRec(x,true));groupSync()},()=>{r.done.forEach(x=>applyRec(x,false));groupSync()});
 refresh();toast('Reset to parent: '+r.done.length+' ta obyekt tekislandi'+(r.sk.length?' ('+r.sk.length+' ta skeletli o’tkazildi)':''))};
