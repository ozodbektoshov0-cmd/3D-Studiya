/* ---- v54: format dvigateli ----
   “3D Model Studio Pro” konvertori (apps/3d-model) ko’rinmas oynada ishlaydi va studiyaga yetishmagan formatlarni beradi:
   import: DXF, SVG (3D ga extrude), KMZ · eksport: 3DS, COL (GTA to’qnashuv fayli). Faqat birinchi ishlatilganda yuklanadi. */
(function(){
'use strict';
let P=null;
function eng(){
 if(P)return P;
 P=new Promise((ok,no)=>{
  const f=document.createElement('iframe');f.src='apps/3d-model/index.html';f.tabIndex=-1;f.setAttribute('aria-hidden','true');
  f.style.cssText='position:fixed;left:-9999px;top:0;width:1024px;height:768px;border:0;visibility:hidden;pointer-events:none';
  const t0=Date.now();
  f.onload=()=>{const w=f.contentWindow;(function wait(){
   if(w.CVCONV&&w.CVCONV.loadFiles&&w.CVCONV.S){try{w.__studioPause&&w.__studioPause(true)}catch(e){}ok(w)}
   else if(Date.now()-t0>20000){P=null;f.remove();no(Error('Format dvigateli yuklanmadi'))}
   else setTimeout(wait,100)})()};
  f.onerror=()=>{P=null;no(Error('Format dvigateli yuklanmadi'))};
  document.body.append(f);
 });
 return P;
}
async function toModel(w,file){
 const C=w.CVCONV;
 for(let i=0;i<100&&C.S.busy;i++)await new Promise(r=>setTimeout(r,100));
 C.S.model=null;
 await C.loadFiles([file]);
 for(let i=0;i<300&&C.S.busy;i++)await new Promise(r=>setTimeout(r,100));
 if(!C.S.model)throw Error((C.S.warn&&C.S.warn.length?C.S.warn[C.S.warn.length-1]:'Model o’qilmadi'));
 return C.S.model;
}
const baseOf=n=>String(n||'model').replace(/\.[^.]+$/,'').replace(/[^\w.-]+/g,'_').slice(0,40)||'model';

/* import: DXF/SVG/KMZ → dvigatel → GLB → studiya */
window.engineImport=async function(file){
 toast(file.name+': konvertor orqali ochilmoqda…');
 const w=await eng(),m=await toModel(w,file),glb=await w.CVCONV.exportGlb(m);
 await load(new File([glb],baseOf(file.name)+'.glb',{type:'model/gltf-binary'}));
};
/* eksport: sahna → GLB → dvigatel → 3DS / COL */
window.engineExport=async function(fmt,glbBuf,name){
 const w=await eng(),C=w.CVCONV,m=await toModel(w,new File([glbBuf],baseOf(name)+'.glb',{type:'model/gltf-binary'}));
 if(fmt=='3ds'){const r=C.export3ds(m,{crease:30});return {bytes:r.bytes,keys:r.keys||[],model:m,C}}
 if(fmt=='col'){const r=await colBytes(C,m);return {bytes:r,keys:[],model:m,C}}
 throw Error('Noma’lum format: '+fmt);
};
async function colBytes(C,m){
 const r=await C.exportCol(m,{});
 const b=r&&(r.bytes||r.data||r);
 if(b instanceof Uint8Array)return b;
 if(b&&b.buffer)return new Uint8Array(b.buffer);
 if(b instanceof ArrayBuffer)return new Uint8Array(b);
 throw Error('COL yaratilmadi');
}
/* studiya sahnasini GLB ga aylantirish (dvigatel uchun) */
window.sceneGlb=function(rootObj){
 return new Promise((ok,no)=>{
  const x=new THREE.GLTFExporter(),o={binary:true},cb=r=>ok(r);
  try{x.parse.length>3?x.parse(rootObj,cb,no,o):x.parse(rootObj,cb,o)}catch(e){no(e)}
 });
};
window.engineOut=async function(fmt,rootObj,name){
 const glb=await sceneGlb(rootObj),r=await engineExport(fmt,glb,name);
 return new Blob([r.bytes],{type:'application/octet-stream'});
};
})();
