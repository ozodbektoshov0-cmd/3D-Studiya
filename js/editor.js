/* ---- tanlash va tahrirlash ---- */
const meshes=()=>{const a=[];root.traverse(o=>o.isMesh&&a.push(o));return a};
const mats=o=>[].concat(o.material||[]);
function select(o){sel=o;o?tc.attach(o):tc.detach();$('#prop').hidden=!o;
 if(o){$('#nm').value=o.name;const m=mats(o)[0];if(m&&m.color)$('#col').value='#'+m.color.getHexString()}refresh()}
function refresh(){applyTex();typeof sync=='function'&&sync();
 const L=$('#list');L.textContent='';const ms=meshes();let t=0;
 ms.forEach((m,i)=>{const g=m.geometry,c=g.index?g.index.count:g.getAttribute('position').count;t+=c/3;
  const b=document.createElement('button');b.textContent=m.name||'mesh '+(i+1);if(m==sel)b.className='on';b.onclick=()=>select(m);L.append(b)});
 $('#st').textContent=ms.length?ms.length+' ta mesh · '+Math.round(t).toLocaleString()+' uchburchak':'Model ochilmagan.';
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
 const h=rc.intersectObjects(root.children,true).find(x=>x.object.isMesh&&x.object.visible);select(h?h.object:null)});
addEventListener('keydown',e=>{if(/INPUT/.test(e.target.tagName))return;const k=e.key.toLowerCase();
 const m={g:'translate',w:'translate',r:'rotate',e:'rotate',s:'scale'}[k];if(m)document.querySelector('[data-m='+m+']').click();if(k=='delete')$('#del').click()});
