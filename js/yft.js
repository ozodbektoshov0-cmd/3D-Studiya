/* ---- YFT / YDR (GTA V, RSC7) o’qish: kuzov + skelet bo’yicha joylangan bo’laklar ---- */
function rsz(f){const s=(f>>27&1)+((f>>26&1)<<1)+((f>>25&1)<<2)+((f>>24&1)<<3)+((f>>17&127)<<4)+((f>>11&63)<<5)+((f>>7&15)<<6)+((f>>5&3)<<7)+((f>>4&1)<<8);return(0x200<<(f&15))*s}
/* RSC7 ichidagi raw-deflate ni ochish: avval brauzerning DecompressionStream i, bo'lmasa (eski Android WebView) fflate */
async function rawInflate(blob){
 if(typeof DecompressionStream!='undefined'&&blob.stream){try{return await new Response(blob.stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()}catch(e){}}
 if(typeof fflate=='undefined'&&typeof lazy=='function')await lazy('vendor/fflate.min.js');
 if(typeof fflate=='undefined')throw Error('Siqilgan faylni ochib bo’lmadi (fflate yo’q)');
 const src=new Uint8Array(await blob.arrayBuffer());let u;
 for(const fn of[fflate.inflateSync,fflate.unzlibSync]){try{u=fn(src);break}catch(e){}}
 if(!u)throw Error('Siqilgan ma’lumot buzuq yoki qo’llanmaydigan format (RSC7 deflate emas)');
 return u.byteOffset==0&&u.length==u.buffer.byteLength?u.buffer:u.slice().buffer}
async function yft(blob,ydr){
 const hd=new DataView(await blob.slice(0,32).arrayBuffer()),skip=hd.getUint32(16,true)==0x37435352?32:16; /* ba'zi fayllarda RSC7 sarlavha ikki marta yozilgan */
 if(hd.getUint32(0,true)!=0x37435352)throw Error('Bu RSC7 resurs emas');
 const sz=rsz(hd.getUint32(8,true));
 const raw=await rawInflate(blob.slice(skip)),v=new DataView(raw);
 const u32=o=>v.getUint32(o,true),u16=o=>v.getUint16(o,true),f4=o=>v.getFloat32(o,true);
 const X=p=>{const k=p>>>28;return k==5?p-0x50000000:k==6?sz+p-0x60000000:-1};
 const ptr=o=>X(u32(o)),ok=(o,n)=>o>=0&&o+n<=raw.byteLength;
 if(!ydr&&u32(0)!=0x47415246)throw Error('Bu fragment (YFT) emas');
 const Dr=ydr?0:ptr(0x30);if(!ok(Dr,0x60))throw Error('YFT tuzilmasi tanilmadi');
 const SZ=[0,4,4,8,8,8,12,16,16,4,4,4,4,4,4,4],out=new THREE.Group();let n=0;
 const str=o=>{let s='';while(o>=0&&o<raw.byteLength&&v.getUint8(o)&&s.length<64)s+=String.fromCharCode(v.getUint8(o++));return s};
 function drw(D,grp){
  const LS=ptr(D+0x50);if(LS<0)return 0;const arr=ptr(LS),cnt=u16(LS+8);if(arr<0||!ok(arr,cnt*8))return 0;
  const SG=ptr(D+0x10),sa=SG>=0?ptr(SG+0x10):-1,sn=SG>=0?u16(SG+0x18):0,n0=n;
  const dif=sh=>{if(sa<0||sh>=sn)return'';const s=ptr(sa+sh*8);if(s<0)return'';const pp=ptr(s);if(pp<0||v.getUint8(s+0x10)<1||v.getUint8(pp)!=0)return'';const t=ptr(pp+8);return t<0?'':str(ptr(t+0x28))};
  for(let mi=0;mi<cnt;mi++){const m=ptr(arr+mi*8),ga=ptr(m+8),gc=u16(m+0x10),sm=ptr(m+0x20);if(m<0||ga<0)continue;
   for(let j=0;j<gc;j++){try{
    const g=ptr(ga+j*8),vb=ptr(g+0x18),ib=ptr(g+0x38);if(g<0||vb<0||ib<0)continue;
    const vc=u32(vb+0x18),st=u16(vb+8),dp=ptr(vb+0x10),dc=ptr(vb+0x30),ic=u32(ib+8),ip=ptr(ib+0x10);
    if(!ok(dp,vc*st)||!ok(ip,ic*2)||!ok(dc,16))continue;
    const fl=u32(dc),ty=[u32(dc+8),u32(dc+12)],off=[];let o=0;
    for(let i=0;i<16;i++)if(fl>>i&1){const t=(ty[i>>3]>>(4*(i&7)))&15;off[i]=[o,t];o+=SZ[t]}
    const good=o==st,P=new Float32Array(vc*3),Nn=good&&off[3]&&off[3][1]==6?new Float32Array(vc*3):null,UV=good&&off[6]&&off[6][1]==5?new Float32Array(vc*2):null;
    for(let i=0;i<vc;i++){const b=dp+i*st;P[i*3]=f4(b);P[i*3+1]=f4(b+4);P[i*3+2]=f4(b+8);
     if(Nn){const q=b+off[3][0];Nn[i*3]=f4(q);Nn[i*3+1]=f4(q+4);Nn[i*3+2]=f4(q+8)}
     if(UV){const q=b+off[6][0];UV[i*2]=f4(q);UV[i*2+1]=1-f4(q+4)}}
    const I=new Uint16Array(raw.slice(ip,ip+ic*2));for(let i=0;i+2<ic;i+=3){const t=I[i+1];I[i+1]=I[i+2];I[i+2]=t}
    const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P,3));
    if(Nn)G.setAttribute('normal',new THREE.BufferAttribute(Nn,3));if(UV)G.setAttribute('uv',new THREE.BufferAttribute(UV,2));
    G.setIndex(new THREE.BufferAttribute(I,1));if(!Nn)G.computeVertexNormals();
    const sh=sm>=0?u16(sm+j*2):j,mt=new THREE.MeshStandardMaterial({color:0xd0d3d8,side:2});
    const tn=dif(sh);if(tn){mt.userData.tex=mt.name=tn;if(/glass|tint/i.test(tn)){mt.transparent=true;mt.opacity=.5}}
    const me=new THREE.Mesh(G,mt);me.name='geom'+(n++)+'_'+(tn||'shader'+sh);grp.add(me)}catch(e){}}}
  return n-n0}
 drw(Dr,out);
 let placed=0;
 if(!ydr){try{
  const S=ptr(Dr+0x18),nb=u16(S+0x1A),bk=u16(S+0x18),tr=ptr(S+0x30),pr=ptr(S+0x38),ar=ptr(S+0x10),Bn=ptr(S+0x20),tags=new Map();
  const bn=i=>{const p=Bn>=0?ptr(Bn+i*0x50+0x38):-1;return p>0?str(p):''};
  for(let i=0;i<bk;i++){let p=u32(ar+i*8);for(let k=0;p>>>28==5&&k<64;k++){const o=X(p);tags.set(u32(o),u32(o+4));p=u32(o+8)}}
  const W=[],world=i=>W[i]||(W[i]=(()=>{const m=new THREE.Matrix4().fromArray(Array.from({length:16},(_,k)=>f4(tr+i*64+k*4))),p=v.getInt16(pr+i*2,true);return p>=0&&p<nb&&p!=i?new THREE.Matrix4().multiplyMatrices(world(p),m):m})());
  const done=new Set(),tpl={};
  for(let o=0;o+0xb0<=raw.byteLength;o+=16)if(u32(o)==0x43425553&&u32(o+4)==0){
   const dp=ptr(o+0xa0);if(dp<0||u32(dp)!=0x52465244)continue;
   const idx=tags.get(u16(o+0x12));if(idx===undefined||idx>=nb)continue;
   try{const g=new THREE.Group();g.name=bn(idx)||'bone'+idx;if(drw(dp,g)){tpl[g.name]=g.clone();g.applyMatrix4(world(idx));out.add(g);placed++;done.add(idx)}}catch(e){}}
  /* GTA V: g'ildirak modeli ko'pincha faqat bitta (wheel_lf) saqlanadi — qolgan g'ildirak bo'g'imlariga nusxa qo'yiladi */
  const pickTpl=nm=>{const k=nm.slice(7),c=['wheel_l'+k,'wheel_r'+k];if(k[0]=='r')c.push('wheel_lr','wheel_lf');else if(k[0]=='m')c.push('wheel_lm1','wheel_lr','wheel_lf');else c.push('wheel_lf');
   for(const t of c)if(tpl[t])return t;return null};
  for(let i=0;i<nb;i++){const nm=bn(i);if(!/^wheel_[lr][fmr]\d*$/.test(nm)||done.has(i))continue;const t=pickTpl(nm);if(!t)continue;
   /* Qarama-qarshi tomondagi g'ildirak: model vertikal o'q atrofida 180° buriladi (bone markazi atrofida), nusxa/siljitish yo'q */
   const flip=t[6]!=nm[6],g=tpl[t].clone();g.name=nm;
   g.applyMatrix4(flip?new THREE.Matrix4().multiplyMatrices(world(i),new THREE.Matrix4().makeRotationZ(Math.PI)):world(i));out.add(g);placed++;done.add(i)}
 }catch(e){}}
 if(!n)throw Error('YFT ichida geometriya topilmadi');
 out.userData.parts=placed;out.rotation.set(-Math.PI/2,0,0); /* faqat Z-up → Y-up (DFF bilan bir xil): fayldagi haqiqiy koordinatalar o'zgarmaydi, old = -Z */const w=new THREE.Group();w.add(out);return w;
}
