/* ---- SKP (SketchUp) import: OpenSKP (MIT) orqali, brauzerda, serversiz ---- */
async function skpImp(buf){
 const mb=buf.byteLength/1048576;
 if(mb>80)toast('Katta SKP ('+Math.round(mb)+' MB): brauzerda xotira yetmasligi mumkin');
 try{await lazy('vendor/openskp.min.js')}catch(e){throw Error('SKP moduli yo’q: vendor/openskp.min.js (README → “SKP qo’llab-quvvatlash”)')}
 const O=window.openskp;if(!O)throw Error('openskp yuklanmadi');
 toast('SKP o’qilmoqda…');await new Promise(r=>setTimeout(r,30));
 let sc;
 try{sc=O.buildScene?O.buildScene(buf):(O.SkpFile&&O.SkpFile.fromBuffer?O.SkpFile.fromBuffer(buf).buildScene():null)}
 catch(e){throw Error('SKP o’qilmadi: '+(e.message||e))}
 if(!sc||!O.toGLB)throw Error('openskp API mos emas. Mavjud: '+Object.keys(O).join(', '));
 const r=O.toGLB(sc),ab=r instanceof ArrayBuffer?r:r.buffer.slice(r.byteOffset,r.byteOffset+r.byteLength);
 const g=await new Promise((ok,no)=>new THREE.GLTFLoader().parse(ab,'',x=>ok(x.scene),no));
 let n=0;g.traverse(o=>o.isMesh&&n++);if(!n)throw Error('SKP ichida mesh topilmadi');
 return g}
