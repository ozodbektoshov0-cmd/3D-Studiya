/* ---- v53 · 1-bosqich: Blender “Add → Mesh” to‘plami ----
   Qo‘shildi: Circle, Grid, Ico Sphere va Blender manbasidan aynan ko‘chirilgan Suzanne (js/blender-data.js).
   Shift+A — “Qo‘shish” menyusini ochadi (Blender’dagi kabi). Mavjud primitivlarga tegmaydi. */
(function(){
'use strict';
const T=window.THREE,M=window.BL_MONKEY;if(!T||!M||typeof add!=='function')return;

/* Suzanne: bmo_primitive.cc → bmo_create_monkey_exec algoritmi (chap yarim + ko‘zgu), Y-yuqori o‘qlarga o‘tkazilgan */
function suzanne(){
 const A=[],B=[],P=[],U=[];let ui=0;
 for(let i=0;i<M.nv;i++){const x=(M.v[i*3]+127)/128,y=M.v[i*3+1]/128,z=M.v[i*3+2]/128;A.push([x,y,z]);B.push([-x,y,z])}
 const emit=p=>{for(let k=1;k<p.length-1;k++)for(const j of [0,k,k+1]){P.push(...p[j].v);U.push(p[j].u[0],p[j].u[1])}};
 for(let i=0;i<M.nf;i++){
  const f=[0,1,2,3].map(k=>M.f[i*4+k]+i-M.o),quad=M.f[i*4+3]!==M.f[i*4+2];
  const a=quad?[f[0],f[1],f[2],f[3]]:[f[0],f[1],f[2]],b=quad?[f[2],f[1],f[0],f[3]]:[f[2],f[1],f[0]];
  const mk=(ix,S)=>ix.map(n=>{const o={v:S[n],u:[M.uv[ui*2],M.uv[ui*2+1]]};ui++;return o});
  emit(mk(a,A));emit(mk(b,B));
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
const PR={
 'Circle':()=>new T.CircleGeometry(1,32).rotateX(-Math.PI/2),
 'Grid':()=>new T.PlaneGeometry(2,2,10,10).rotateX(-Math.PI/2),
 'Ico Sphere':()=>{const g=new T.IcosahedronGeometry(1,1);g.computeVertexNormals();return g},
 'Suzanne':suzanne
};
const uniq=n=>{const s=new Set();root.traverse(o=>s.add(o.name));if(!s.has(n))return n;let i=1;while(s.has(n+'.'+String(i).padStart(3,'0')))i++;return n+'.'+String(i).padStart(3,'0')};
const menu=document.querySelector('#addm');if(!menu)return;
Object.entries(PR).forEach(([n,g])=>{
 const b=document.createElement('button');b.textContent=n;
 b.onclick=()=>{const m=new T.Mesh(g(),new T.MeshStandardMaterial({color:0xcccccc,side:T.DoubleSide}));m.name=uniq(n);add(m);const d=menu.parentElement;if(d&&d.tagName=='DETAILS')d.open=false};
 menu.append(b);
});
addEventListener('keydown',e=>{
 if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(window.BL_CFG&&BL_CFG.blShiftA===false)return;
 if(e.shiftKey&&e.key.toLowerCase()=='a'){e.preventDefault();const d=menu.parentElement;if(d&&d.tagName=='DETAILS')d.open=!d.open}
});
window.BL_ADD=PR; /* sinov va keyingi bosqichlar uchun */
})();
