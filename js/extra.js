/* ---- Qo'shimcha asboblar: LOD to'plami, ko'zgu nusxa, X-ray, ramka bilan tanlash, material bo'yicha tanlash ---- */
/* LOD: tanlangan meshlardan soddalashtirilgan yashirin nusxalar yaratadi (decimate() — poligon kamaytirish bilan bir xil) */
$('#lod').onclick=()=>{const L=pickReal();if(!L.length)return toast('Avval mesh tanlang');
 const rs=String(prompt('LOD nisbatlari (qoladigan ulush, vergul bilan)','0.5,0.25,0.1')||'').split(',').map(parseFloat).filter(x=>x>0&&x<1);if(!rs.length)return;
 const made=[];L.forEach(m=>rs.forEach(r=>{const g=decimate(m,r);if(!g)return;const o=new THREE.Mesh(g,m.material);o.name=m.name.replace(/_mesh$/,'')+'_lod'+Math.round(r*100);
  o.position.copy(m.position);o.quaternion.copy(m.quaternion);o.scale.copy(m.scale);o.visible=false;made.push({o,p:m.parent})}));
 if(!made.length)return toast('LOD yaratilmadi');made.forEach(x=>x.p.add(x.o));
 hist(()=>made.forEach(x=>x.p.remove(x.o)),()=>made.forEach(x=>x.p.add(x.o)));refresh();
 toast(made.length+' ta LOD nusxa yaratildi (yashirin). Kerakli birini “Yashirish/ko’rsatish” bilan ochasiz')};
/* Ko'zgu nusxa: dunyo koordinatalarida, tanlangan o'q bo'yicha koordinata boshi tekisligidan akslantirib, geometriyaga pishirilgan nusxa */
function swapLR(n,axis){if(axis!='x')return n.replace(/_mesh$/,'')+'_mirror';
 const m=n.replace(/_mesh$/,'');const r=m.replace(/_([lr])([frbm])(?=_|\.|$)/i,(a,c,d)=>'_'+(c==c.toLowerCase()?(c=='l'?'r':'l'):(c=='L'?'R':'L'))+d);return r!==m?r:m+'_mirror'}
function mirrorCopy(m,axis){
 m.updateWorldMatrix(true,false);const R=new THREE.Matrix4().makeScale(axis=='x'?-1:1,axis=='y'?-1:1,axis=='z'?-1:1);
 const g=m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(R,m.matrixWorld));flipWinding(g);g.computeBoundingBox();g.computeBoundingSphere();
 const o=new THREE.Mesh(g,Array.isArray(m.material)?m.material.slice():m.material);o.name=swapLR(m.name,axis);return o}
['x','y','z'].forEach(ax=>{$('#mir'+ax).onclick=()=>{const L=pickReal();if(!L.length)return toast('Avval mesh tanlang');
 const made=L.map(m=>mirrorCopy(m,ax));made.forEach(o=>root.add(o));hist(()=>made.forEach(o=>root.remove(o)),()=>made.forEach(o=>root.add(o)));
 MS.clear();made.forEach(o=>MS.add(o));select(made[0]);toast(made.length+' ta ko’zgu nusxa: '+made.map(o=>o.name).slice(0,4).join(', '))}});
/* X-ray: materiallarni vaqtincha shaffof qiladi; eksportda avtomatik o'chirib turiladi */
let xr=false;
function xrayApply(on){meshes().forEach(m=>[].concat(m.material).forEach(x=>{
 if(on&&!x.userData._xr){x.userData._xr={t:x.transparent,o:x.opacity,d:x.depthWrite};x.transparent=true;x.opacity=Math.min(x.opacity,.35);x.depthWrite=false;x.needsUpdate=true}
 else if(!on&&x.userData._xr){const s=x.userData._xr;x.transparent=s.t;x.opacity=s.o;x.depthWrite=s.d;delete x.userData._xr;x.needsUpdate=true}}))}
$('#xray').onclick=()=>{xr=!xr;xrayApply(xr);$('#xray').classList.toggle('on',xr)};
function xrayPause(){if(xr)xrayApply(false)}function xrayResume(){if(xr)xrayApply(true)}
/* Ramka bilan tanlash: tugma yoqilganda ekranda to'rtburchak chizing — markazi ichida qolgan meshlar tanlanadi */
function boxPick(x0,y0,x1,y1,rect){const a=[Math.min(x0,x1),Math.min(y0,y1),Math.max(x0,x1),Math.max(y0,y1)],out=[],b=new THREE.Box3(),c=new THREE.Vector3();cam.updateMatrixWorld(true);
 realMeshes().forEach(m=>{if(!m.visible)return;b.setFromObject(m);if(b.isEmpty())return;b.getCenter(c).project(cam);if(c.z>1||c.z<-1)return;
  const sx=(c.x+1)/2*rect.width+rect.left,sy=(1-c.y)/2*rect.height+rect.top;if(sx>=a[0]&&sx<=a[2]&&sy>=a[1]&&sy<=a[3])out.push(m)});return out}
let bm=false,bd=null;const bx=document.createElement('div');bx.style.cssText='position:fixed;border:1px dashed #6cf;background:rgba(80,160,255,.15);pointer-events:none;display:none;z-index:50';document.body.appendChild(bx);
$('#bsel').onclick=()=>{bm=!bm;$('#bsel').classList.toggle('on',bm);ctl.enabled=!bm;toast(bm?'Ramka rejimi: ekranda barmoq bilan to’rtburchak chizing':'Ramka rejimi o’chdi')};
cv.addEventListener('pointerdown',e=>{if(!bm||tc.axis)return;bd=[e.clientX,e.clientY];e.stopImmediatePropagation();e.preventDefault()},true);
addEventListener('pointermove',e=>{if(!bd)return;const x=Math.min(bd[0],e.clientX),y=Math.min(bd[1],e.clientY);Object.assign(bx.style,{display:'block',left:x+'px',top:y+'px',width:Math.abs(e.clientX-bd[0])+'px',height:Math.abs(e.clientY-bd[1])+'px'})});
addEventListener('pointerup',e=>{if(!bd)return;const d=bd;bd=null;bx.style.display='none';if(Math.hypot(e.clientX-d[0],e.clientY-d[1])<8)return;
 const L=boxPick(d[0],d[1],e.clientX,e.clientY,cv.getBoundingClientRect());if(!L.length)return toast('Ramka ichida obyekt yo’q');
 if(!e.shiftKey&&!e.ctrlKey)MS.clear();L.forEach(m=>MS.add(m));select(L[0]);toast(L.length+' ta obyekt tanlandi')});
/* Material bo'yicha tanlash: tanlangan meshning birinchi materiali bilan bir xil tekstura/nomli hamma meshlar */
$('#selmat').onclick=()=>{const m=pickReal()[0];if(!m)return toast('Avval mesh tanlang');const x=[].concat(m.material)[0],key=x.userData.tex||x.name||x.uuid;
 const L=realMeshes().filter(o=>[].concat(o.material).some(y=>(y.userData.tex||y.name||y.uuid)==key));MS.clear();L.forEach(o=>MS.add(o));select(L[0]);toast(L.length+' ta obyekt: “'+key+'” materiali')};
