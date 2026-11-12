/* ---- tanlash va tahrirlash ---- */
const meshes=()=>{const a=[];root.traverse(o=>o.isMesh&&a.push(o));return a};
const mats=o=>[].concat(o.material||[]);
function select(o){sel=o;o?tc.attach(o):tc.detach();$('#prop').hidden=!o;
 if(o){$('#nm').value=o.name;const m=mats(o)[0];if(m&&m.color)$('#col').value='#'+m.color.getHexString()}refresh()}
function refresh(){applyTex();typeof sync=='function'&&sync();
 const L=$('#list');L.textContent='';const ml=meshes();let t=0;
 ml.forEach(m=>{const g=m.geometry,c=g.index?g.index.count:g.getAttribute('position').count;t+=c/3});
 /* outliner daraxti: meshlar + nomli freym/dummy/guruhlar (Object3D, Group); har biri ochiladi-yopiladi */
 const nmI=new Map();ml.forEach((m,i)=>nmI.set(m,i+1));
 const OLC=window.OLC||(window.OLC=new Set());
 const cont=o=>!o.isMesh&&!o.isBone&&!o.isCamera&&!o.isLight&&!o.userData.grp&&(o.isGroup||o.type=='Object3D')&&!!o.name;
 const skip=o=>o.isBone||o.isCamera||o.isLight||(o.userData&&o.userData.grp);
 const hasRow=o=>o.children.some(c=>!skip(c)&&(c.isMesh||cont(c)||hasRow(c)));
 const rows=[];
 const walk=(p,d)=>p.children.forEach(c=>{
  if(skip(c))return;
  if(c.isMesh||cont(c)){const k=hasRow(c);rows.push({o:c,d,k});if(k&&!OLC.has(c))walk(c,d+1)}
  else walk(c,d)});
 walk(root,0);
 const under=o=>{const a=[];o.traverse(x=>x.isMesh&&a.push(x));return a};
 rows.forEach(r=>{
  const o=r.o,isM=o.isMesh,b=document.createElement('button');
  b._o=o;b._d=r.d;b._k=r.k;
  b.textContent=o.name||(isM?'mesh '+nmI.get(o):'Group');
  const mine=isM?[o]:under(o);
  if(isM?(o==sel||MS.has(o)):(mine.length&&mine.every(x=>x==sel||MS.has(x))))b.className='on';
  b.onclick=e=>{
   const add=e.ctrlKey||e.shiftKey||ms;
   if(isM){if(add){if(!MS.size&&sel)MS.add(sel);MS.has(o)?MS.delete(o):MS.add(o);refresh()}else{MS.clear();select(o)}return}
   if(!mine.length)return toast((o.name||'Group')+': ichida mesh yo’q');
   if(add){if(!MS.size&&sel)MS.add(sel);const all=mine.every(x=>MS.has(x)||x==sel);
    mine.forEach(x=>all?MS.delete(x):MS.add(x));if(all&&mine.includes(sel)){const n=[...MS][0];MS.delete(n);select(n||null);return}refresh()}
   else{MS.clear();mine.forEach(x=>MS.add(x));select(mine[0])}};
  L.append(b)});
 $('#st').textContent=ml.length?ml.length+' ta mesh · '+Math.round(t).toLocaleString()+' uchburchak':'Model ochilmagan.';
}
function fit(o){const b=new THREE.Box3().setFromObject(o||root);if(b.isEmpty())return;
 const c=b.getCenter(new THREE.Vector3()),d=b.getSize(new THREE.Vector3()).length()||1;
 ctl.target.copy(c);cam.position.copy(c).add(new THREE.Vector3(.8,.6,1).normalize().multiplyScalar(d*1.3));cam.near=d/500;cam.far=d*50;cam.updateProjectionMatrix()}
$('#fit').onclick=()=>fit();
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{tc.setMode(b.dataset.m);document.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x==b))});
$('#wf').onclick=e=>{wire=!wire;e.target.classList.toggle('on',wire);meshes().forEach(m=>mats(m).forEach(x=>x.wireframe=wire))};
$('#nm').oninput=e=>{if(sel){sel.name=e.target.value;refresh()}};
$('#col').oninput=e=>{if(sel)mats(sel).forEach(m=>m.color&&m.color.set(e.target.value))};
$('#vis').onclick=()=>{if(sel)sel.visible=!sel.visible};
$('#del').onclick=()=>{if(sel){const o=sel;select(null);o.parent.remove(o);refresh()}};
let dn=null;cv.addEventListener('pointerdown',e=>dn=[e.clientX,e.clientY]);
cv.addEventListener('pointerup',e=>{if(!dn||tc.axis||window.em||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>5)return;
 const r=cv.getBoundingClientRect(),rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
 const h=rc.intersectObjects(root.children,true).find(x=>x.object.isMesh&&x.object.visible);if(!e.shiftKey&&!e.ctrlKey)MS.clear();select(h?h.object:null)});
addEventListener('keydown',e=>{if(/INPUT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();
 const m={g:'translate',w:'translate',r:'rotate',e:'rotate',s:'scale'}[k];if(m)document.querySelector('[data-m='+m+']').click();if(k=='delete')$('#del').click()});
