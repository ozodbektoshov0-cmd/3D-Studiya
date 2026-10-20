/* ---- YFT (GTA V fragment, RSC7) o’qish ---- */
function rsz(f){const s=(f>>27&1)+((f>>26&1)<<1)+((f>>25&1)<<2)+((f>>24&1)<<3)+((f>>17&127)<<4)+((f>>11&63)<<5)+((f>>7&15)<<6)+((f>>5&3)<<7)+((f>>4&1)<<8);return(0x200<<(f&15))*s}
async function yft(blob){
 const hd=new DataView(await blob.slice(0,16).arrayBuffer());
 if(hd.getUint32(0,true)!=0x37435352)throw Error('Bu RSC7 resurs emas');
 const sz=rsz(hd.getUint32(8,true));
 if(typeof DecompressionStream=='undefined')throw Error('Brauzer siqilgan faylni ocholmaydi');
 const raw=await new Response(blob.slice(16).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(),v=new DataView(raw);
 const u32=o=>v.getUint32(o,true),u16=o=>v.getUint16(o,true),f4=o=>v.getFloat32(o,true);
 const X=p=>{const k=p>>>28;return k==5?p-0x50000000:k==6?sz+p-0x60000000:-1};
 const ptr=o=>X(u32(o)),ok=(o,n)=>o>=0&&o+n<=raw.byteLength;
 if(u32(0)!=0x47415246)throw Error('Bu fragment (YFT) emas');
 const Dr=ptr(0x30),LS=ptr(Dr+0x50),arr=ptr(LS),cnt=u16(LS+8);
 if(!ok(Dr,0x60)||!ok(arr,cnt*8))throw Error('YFT tuzilmasi tanilmadi');
 const SZ=[0,4,4,8,8,8,12,16,16,4,4,4,4,4,4,4],out=new THREE.Group();let n=0;
 for(let mi=0;mi<cnt;mi++){const m=ptr(arr+mi*8),ga=ptr(m+8),gc=u16(m+0x10),sm=ptr(m+0x20);
  for(let j=0;j<gc;j++){
   const g=ptr(ga+j*8),vb=ptr(g+0x18),ib=ptr(g+0x38),vc=u32(vb+0x18),st=u16(vb+8),dp=ptr(vb+0x10),dc=ptr(vb+0x30),ic=u32(ib+8),ip=ptr(ib+0x10);
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
   const sh=sm>=0?u16(sm+j*2):j,mt=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL((sh*0.137)%1,.3,.62),side:2});
   const me=new THREE.Mesh(G,mt);me.name='geom'+(n++)+'_shader'+sh;out.add(me)}}
 if(!n)throw Error('YFT ichida geometriya topilmadi');
 out.rotation.x=-Math.PI/2;const w=new THREE.Group();w.add(out);return w;
}
