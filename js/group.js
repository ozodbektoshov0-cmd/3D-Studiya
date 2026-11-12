/* ---- Hammasini tanlash, guruh bo'lib ko'chirish/aylantirish, Reset to parent ---- */
const gpv=new THREE.Object3D();gpv.userData.grp=true;S.add(gpv);
/* ---- Ko’p tanlash: alohida guruh paneli (hammasiga birdaniga). Bitta meshning Joy/Burilish/O’lcham maydonlari yashiriladi ---- */
const gXf=document.createElement('details');gXf.className='pn';gXf.id='gxf';gXf.open=true;gXf.hidden=true;
gXf.innerHTML='<summary>Tanlanganlar: <b id="gxn">0</b> ta — hammasiga birdaniga</summary><div id="gxb"></div><p class="gnote">Joy — tanlanganlar markazi. Burilish va o’lcham markaz atrofida hammasiga qo’llanadi.</p>';
const gNm=$('#prop .nmr');gNm.parentNode.insertBefore(gXf,gNm.nextSibling);
$('#xf').closest('details').classList.add('xfd');gNm.classList.add('nmr1');
const GI={};
[['Joy (markaz)','p',.1],['Burilish °','r',5],['O’lcham ×','s',.1]].forEach(([l,k,st])=>{const s=document.createElement('span');s.textContent=l;$('#gxb').append(s);
 for(let i=0;i<3;i++){const e=document.createElement('input');e.type='number';e.step=st;GI[k+i]=e;e.onchange=()=>gApplyInputs();$('#gxb').append(e)}});
function gSyncInputs(){
 const r=gpv.rotation,v={p:[gpv.position.x,gpv.position.y,gpv.position.z],r:[r.x*180/Math.PI,r.y*180/Math.PI,r.z*180/Math.PI],s:[gpv.scale.x,gpv.scale.y,gpv.scale.z]};
 for(const k in v)v[k].forEach((x,i)=>{const e=GI[k+i];if(e&&document.activeElement!==e)e.value=+x.toFixed(3)})}
const tops=()=>{const a=pick(),s=new Set(a);return a.filter(o=>{for(let p=o.parent;p;p=p.parent)if(s.has(p))return false;return true})};
let G0=null;
function groupSync(){
 const t=window.em?[]:tops(),multi=t.length>=2;
 document.body.classList.toggle('multi',multi);
 if(window.em)return;
 if(multi){
  const b=new THREE.Box3();t.forEach(o=>b.expandByObject(o));
  if(!b.isEmpty()){gpv.position.copy(b.getCenter(new THREE.Vector3()));gpv.quaternion.identity();gpv.scale.set(1,1,1);gpv.updateMatrixWorld(true);if(tc.object!==gpv)tc.attach(gpv)}
  gXf.hidden=false;$('#gxn').textContent=pick().length;gSyncInputs();
 }else{gXf.hidden=true;if(tc.object===gpv){sel?tc.attach(sel):tc.detach()}}
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
function gStart(){
 gpv.updateMatrixWorld(true);
 G0={inv:gpv.matrixWorld.clone().invert(),items:tops().map(o=>{o.updateWorldMatrix(true,false);return{o,W:o.matrixWorld.clone(),p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}})}}
function gApply(){
 gpv.updateMatrixWorld(true);
 const d=new THREE.Matrix4().multiplyMatrices(gpv.matrixWorld,G0.inv);
 G0.items.forEach(it=>setLocal(it.o,new THREE.Matrix4().multiplyMatrices(d,it.W)))}
function gEnd(){
 const g=G0;G0=null;if(!g)return;
 const a=g.items,b=a.map(it=>({o:it.o,p:it.o.position.clone(),q:it.o.quaternion.clone(),s:it.o.scale.clone()}));
 hist(()=>{a.forEach(x=>{x.o.position.copy(x.p);x.o.quaternion.copy(x.q);x.o.scale.copy(x.s)});groupSync()},
      ()=>{b.forEach(x=>{x.o.position.copy(x.p);x.o.quaternion.copy(x.q);x.o.scale.copy(x.s)});groupSync()})}
tc.addEventListener('mouseDown',()=>{if(tc.object===gpv)gStart()});
tc.addEventListener('objectChange',()=>{if(tc.object!==gpv||!G0)return;gApply();gSyncInputs()});
tc.addEventListener('mouseUp',()=>{if(tc.object===gpv&&G0)gEnd()});
/* maydonlardan kiritish: hammasiga birdaniga (markaz atrofida) */
function gApplyInputs(){
 if(window.em||tc.object!==gpv)return;
 const v=k=>[0,1,2].map(i=>+GI[k+i].value||0),s=v('s').map(x=>x||1);
 gStart();
 gpv.position.set(...v('p'));gpv.rotation.set(...v('r').map(x=>x*Math.PI/180));gpv.scale.set(...s);
 gApply();gEnd();groupSync()}
/* o’chirish: tanlanganlarning hammasi (X / Delete / o’chirish tugmasi) */
const delOne=$('#del').onclick;
$('#del').onclick=function(){
 if(window.em)return delOne&&delOne.apply(this,arguments);
 const T=tops();if(T.length<2)return delOne&&delOne.apply(this,arguments);
 const rec=T.filter(o=>o.parent).map(o=>({o,p:o.parent,i:o.parent.children.indexOf(o)}));
 select(null);MS.clear();rec.forEach(r=>r.p.remove(r.o));
 hist(()=>rec.slice().reverse().forEach(r=>{r.p.add(r.o);const c=r.p.children;if(r.i>=0&&r.i<c.length-1){c.pop();c.splice(r.i,0,r.o)}}),()=>rec.forEach(r=>r.p.remove(r.o)));
 refresh();toast(rec.length+' ta obyekt o’chirildi')};
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
