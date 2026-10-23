/* ---- SKP (SketchUp) import va eksport: OpenSKP (MIT) orqali, brauzerda, serversiz ---- */
const SKP_VER='1.3.0';
/* Kutubxona: avval vendor/openskp.min.js, bo'lmasa CDN (internet kerak) */
async function skpLib(){
 if(window.openskp&&window.openskp.buildScene)return window.openskp;
 try{await lazy('vendor/openskp.min.js')}catch(e){}
 if(window.openskp&&window.openskp.buildScene)return window.openskp;
 for(const u of['https://cdn.jsdelivr.net/npm/openskp@'+SKP_VER+'/+esm','https://esm.sh/openskp@'+SKP_VER]){
  try{const m=await import(u);const O=m.default&&!m.buildScene?m.default:m;if(O&&O.buildScene){window.openskp=O;return O}}catch(e){}}
 throw Error('SKP moduli yuklanmadi. Internetni tekshiring yoki vendor/openskp.min.js qo’ying (README → “SKP qo’llab-quvvatlash”)')}
async function skpImp(buf){
 const mb=buf.byteLength/1048576;
 if(mb>80)toast('Katta SKP ('+Math.round(mb)+' MB): brauzerda xotira yetmasligi mumkin');
 toast('SKP moduli yuklanmoqda…');const O=await skpLib();
 toast('SKP o’qilmoqda…');await new Promise(r=>setTimeout(r,30));
 let sc;
 try{sc=O.buildScene?O.buildScene(buf):(O.SkpFile&&O.SkpFile.fromBuffer?O.SkpFile.fromBuffer(buf).buildScene():null)}
 catch(e){throw Error('SKP o’qilmadi: '+(e.message||e))}
 if(!sc||!O.toGLB)throw Error('openskp API mos emas. Mavjud: '+Object.keys(O).join(', '));
 const r=O.toGLB(sc),ab=r instanceof ArrayBuffer?r:r.buffer.slice(r.byteOffset,r.byteOffset+r.byteLength);
 const g=await new Promise((ok,no)=>new THREE.GLTFLoader().parse(ab,'',x=>ok(x.scene),no));
 let n=0;g.traverse(o=>o.isMesh&&n++);if(!n)throw Error('SKP ichida mesh topilmadi');
 return g}
/* SKP eksport: SketchUp 2013–2020 formati (yangi SketchUp ham ochadi). Sahna: 1 birlik = 1 metr, Y-up → SketchUp: dyuym, Z-up.
   Uchburchaklar SketchUp yuzalari bo'ladi; ranglar saqlanadi, teksturalar saqlanmaydi. */
async function skpOut(){
 skpOut.info=[];toast('SKP moduli yuklanmoqda…');
 const O=await skpLib();if(!O.create)throw Error('Bu openskp versiyasida SKP yozish yo’q (1.3.0 yoki yangisi kerak)');
 root.updateMatrixWorld(true);
 const ms=meshes().filter(m=>m.visible&&!m.userData.dummy),MAXT=250000;let nt=0;
 ms.forEach(m=>{const g=m.geometry;nt+=Math.floor((g.index?g.index.count:g.getAttribute('position').count)/3)});
 if(!nt)throw Error('Eksport uchun mesh yo’q');
 if(nt>MAXT)throw Error(nt+' ta uchburchak: SKP uchun juda ko’p (chegara '+MAXT+'). Avval poligonni kamaytiring');
 const S=39.37007874,B=O.create(),mm=new Map(),un=new Set();
 const matOf=x=>{const c=x&&x.color||{r:.7,g:.7,b:.7},rgb=[Math.round(c.r*255),Math.round(c.g*255),Math.round(c.b*255)],key=(x&&x.name||'')+'|'+rgb;
  if(!mm.has(key)){let n=String(x&&x.name||'Material').replace(/[^\w.-]/g,'_').slice(0,40)||'Material',b=n,i=2;while(un.has(n.toLowerCase()))n=b+'_'+i++;un.add(n.toLowerCase());mm.set(key,B.addMaterial(n,rgb))}return mm.get(key)};
 const v=new THREE.Vector3(),pt=[0,1,2].map(()=>[0,0,0]),A=new THREE.Vector3(),Bv=new THREE.Vector3(),Cv=new THREE.Vector3();
 let done=0,bad=0;
 for(const m of ms){
  const g=m.geometry,P=g.getAttribute('position'),ix=g.index?g.index.array:null,n=Math.floor((ix?ix.length:P.count)/3),I=i=>ix?ix[i]:i,
   ma=[].concat(m.material),gr=g.groups.length?g.groups:[{start:0,count:n*3,materialIndex:0}],W=[];
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m.matrixWorld);W.push(v.x*S,-v.z*S,v.y*S)}
  for(const r of gr){
   const mt=matOf(ma[Math.min(r.materialIndex||0,ma.length-1)]);
   for(let i=r.start;i+2<Math.min(r.start+r.count,n*3);i+=3){
    for(let j=0;j<3;j++){const k=I(i+j)*3;pt[j]=[W[k],W[k+1],W[k+2]]}
    A.set(...pt[0]);Bv.set(...pt[1]);Cv.set(...pt[2]);
    if(Bv.sub(A).cross(Cv.sub(A)).lengthSq()<1e-9){bad++;continue}
    try{B.addFace(pt.map(p=>p.slice()),{material:mt})}catch(e){bad++}
    if(++done%5000==0){toast('SKP yozilmoqda… '+Math.round(done/nt*100)+'%');await new Promise(r=>setTimeout(r,0))}}}}
 if(bad)skpOut.info.push(bad+' ta buzuq uchburchak tashlab ketildi');
 if(done==bad)throw Error('Birorta yuza yozilmadi');
 return B.toBytes()}
