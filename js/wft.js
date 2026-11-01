/* ---- WFT / WDR / WTD (GTA IV, RSC5) o’qish ----
   RSC5: 12 bayt sarlavha (“RSC\5”, tur, flags) + zlib. flags ning pastki 15 biti — virtual segment hajmi
   ((m&0x7FF)<<(((m>>11)&15)+8)); qolgani physical segment (0x50… = virtual, 0x60… = physical ko’rsatkichlar). */
const R5SIZE=f=>{const m=f&0x7FFF;return(m&0x7FF)<<(((m>>11)&15)+8)};
async function r5inflate(blob){
 const hd=new DataView(await blob.slice(0,12).arrayBuffer());
 if(hd.getUint32(0,true)!=0x05435352)throw Error('Bu RSC5 (GTA IV) resurs emas');
 const flags=hd.getUint32(8,true),src=new Uint8Array(await blob.slice(12).arrayBuffer()),zl=(src[0]&15)==8&&((src[0]<<8|src[1])%31)==0;
 let u;
 if(typeof DecompressionStream!='undefined'){try{u=new Uint8Array(await new Response(new Blob([src]).stream().pipeThrough(new DecompressionStream(zl?'deflate':'deflate-raw'))).arrayBuffer())}catch(e){}}
 if(!u){if(typeof fflate=='undefined'&&typeof lazy=='function')await lazy('vendor/fflate.min.js');
  if(typeof fflate=='undefined')throw Error('Siqilgan faylni ochib bo’lmadi (fflate yo’q)');
  for(const fn of zl?[fflate.unzlibSync,fflate.inflateSync]:[fflate.inflateSync,fflate.unzlibSync]){try{u=fn(src);break}catch(e){}}}
 if(!u)throw Error('Siqilgan ma’lumot buzuq (RSC5 zlib emas)');
 return{raw:u,flags}}
/* sof ma’lumot: WFT/WDR → [{pos,nor,uv,idx,tex,sh}], WTD → [{name,w,h,fmt,lv,dp}] (THREE’siz — sinash oson) */
function r5mk(raw,flags){
 const v=new DataView(raw.buffer,raw.byteOffset,raw.byteLength),V=R5SIZE(flags),N=raw.length;
 const u32=o=>v.getUint32(o,true),u16=o=>v.getUint16(o,true),f4=o=>v.getFloat32(o,true);
 const X=p=>{const k=p>>>28;return k==5?p-0x50000000:k==6?V+p-0x60000000:-1};
 const ptr=o=>o+4>N?-1:X(u32(o)),ok=(o,n)=>o>=0&&o+n<=N;
 const str=o=>{let s='';while(o>=0&&o<N&&raw[o]&&s.length<96)s+=String.fromCharCode(raw[o++]);return s};
 return{v,V,N,u32,u16,f4,X,ptr,ok,str}}
function r5wft(raw,flags,wdr){
 const{V,N,u32,u16,f4,ptr,ok,str}=r5mk(raw,flags),out=[];
 const D=wdr?0:ptr(0xB4);if(!ok(D,0x60)||u32(D)>>>24)throw Error('GTA IV drawable tuzilmasi tanilmadi');
 const SG=ptr(D+8),sa=SG>=0?ptr(SG+8):-1,sn=SG>=0?u16(SG+0xC):0;
 const SZ=[0,4,4,8,8,8,12,16,16,4,4,4,4,4,4,4];
 /* shader → diffuse tekstura nomi: birinchi tekstura parametri (odatda 0-parametr), nom tekstura obyektining +0x14 da */
 const tn=sh=>{if(sa<0||sh>=sn)return'';const s=ptr(sa+sh*4);if(!ok(s,0x28))return'';
  const pa=ptr(s+0x14),ty=ptr(s+0x24),n=Math.min(u32(s+0x1C),64);if(pa<0||ty<0)return'';
  for(let j=0;j<n;j++){if(raw[ty+j])continue;const t=ptr(pa+j*4);if(t<0)continue;const np=ptr(t+0x14);if(np<0)continue;
   const s2=str(np);if(s2)return s2.replace(/^.*[\\/:]/,'').replace(/\.dds$/i,'')}return''};
 let L=-1;for(const k of[0x40,0x44,0x48,0x4C]){const p=ptr(D+k);if(p>=0){L=p;break}}
 if(L<0)throw Error('Modelda geometriya yo’q (LOD bo’sh)');
 const arr=ptr(L),cnt=u16(L+4);if(!ok(arr,cnt*4))throw Error('LOD ro’yxati tanilmadi');
 for(let mi=0;mi<cnt;mi++){const m=ptr(arr+mi*4);if(!ok(m,0x14))continue;
  const ga=ptr(m+4),gc=u16(m+8),sm=ptr(m+0x10);if(!ok(ga,gc*4))continue;
  for(let j=0;j<gc;j++){try{
   const g=ptr(ga+j*4),vb=ptr(g+0x0C),ib=ptr(g+0x1C);if(g<0||vb<0||ib<0)continue;
   const vc=u16(vb+4),dp=ptr(vb+8),st=u16(vb+0x0C),dc=ptr(vb+0x10),ic=u32(ib+4),ip=ptr(ib+8);
   if(!vc||!ic||!ok(dp,vc*st)||!ok(ip,ic*2)||!ok(dc,16)||ic>3e6)continue;
   const fl=u32(dc),ty=[u32(dc+8),u32(dc+12)],off=[];let o=0;
   for(let i=0;i<16;i++)if(fl>>i&1){const t=(ty[i>>3]>>(4*(i&7)))&15;off[i]=[o,t];o+=SZ[t]}
   const good=o==st,P=new Float32Array(vc*3),Nn=good&&off[3]&&off[3][1]==6?new Float32Array(vc*3):null,UV=good&&off[6]&&off[6][1]==5?new Float32Array(vc*2):null;
   for(let i=0;i<vc;i++){const b=dp+i*st;P[i*3]=f4(b);P[i*3+1]=f4(b+4);P[i*3+2]=f4(b+8);
    if(Nn){const q=b+off[3][0];Nn[i*3]=f4(q);Nn[i*3+1]=f4(q+4);Nn[i*3+2]=f4(q+8)}
    if(UV){const q=b+off[6][0];UV[i*2]=f4(q);UV[i*2+1]=1-f4(q+4)}}
   const n3=ic-ic%3,I=new Uint16Array(n3);let bad=false;
   for(let i=0;i<n3;i+=3){const a=u16(ip+i*2),b=u16(ip+i*2+2),c=u16(ip+i*2+4);if(a>=vc||b>=vc||c>=vc){bad=true;break}I[i]=a;I[i+1]=c;I[i+2]=b}
   if(bad)continue;
   const sh=sm>=0?u16(sm+j*2):j;out.push({pos:P,nor:Nn,uv:UV,idx:I,tex:tn(sh),sh,lay:good?fl:-fl,prim:u16(g+0x36)})}catch(e){}}}
 if(!out.length)throw Error('Geometriya topilmadi');
 return out}
function r5wtd(raw,flags){
 const{u32,u16,ptr,ok,str,N}=r5mk(raw,flags),arr=ptr(0x18),cnt=u16(0x14),out=[];
 if(!ok(arr,cnt*4)||!cnt)throw Error('WTD tuzilmasi tanilmadi');
 for(let i=0;i<cnt;i++){const t=ptr(arr+i*4);if(!ok(t,0x50))continue;const np=ptr(t+0x14);if(np<0)continue;
  const name=str(np).replace(/^.*[\\/:]/,'').replace(/\.dds$/i,'');if(!name)continue;
  out.push({name,w:u16(t+0x1C),h:u16(t+0x1E),fmt:u32(t+0x20),lv:raw[t+0x27]||1,dp:ptr(t+0x48)})}
 return out}
async function wft(blob,wdr){
 const{raw,flags}=await r5inflate(blob),G=r5wft(raw,flags,wdr),out=new THREE.Group();let n=0;
 for(const g of G){
  const B=new THREE.BufferGeometry();B.setAttribute('position',new THREE.BufferAttribute(g.pos,3));
  if(g.nor)B.setAttribute('normal',new THREE.BufferAttribute(g.nor,3));if(g.uv)B.setAttribute('uv',new THREE.BufferAttribute(g.uv,2));
  B.setIndex(new THREE.BufferAttribute(g.idx,1));if(!g.nor)B.computeVertexNormals();
  const mt=new THREE.MeshStandardMaterial({color:0xd0d3d8,side:2});
  if(g.tex){mt.userData.tex=mt.name=g.tex;if(/glass|window|tint/i.test(g.tex)){mt.transparent=true;mt.opacity=.5}}
  const me=new THREE.Mesh(B,mt);me.name='geom'+(n++)+'_'+(g.tex||'shader'+g.sh);out.add(me)}
 out.rotation.set(-Math.PI/2,0,0); /* Z-up → Y-up (YFT/DFF bilan bir xil); old = -Z */
 const w=new THREE.Group();w.add(out);return w}
async function wtd(blob){
 const{raw,flags}=await r5inflate(blob),L=r5wtd(raw,flags);let ok=0,bad=0;
 for(const t of L){await new Promise(r=>setTimeout(r));
  let{w,h,fmt:f,lv,dp}=t;const K={0x31545844:8,0x33545844:16,0x35545844:16}[f],bs=K||0;
  if((!bs&&f!=21)||dp<0||dp>=raw.length||!w||!h){bad++;continue}
  const siz=(a,b)=>bs?Math.max(1,a+3>>2)*Math.max(1,b+3>>2)*bs:a*b*4;
  for(let l=0;w>2048&&l<lv-1;l++){dp+=siz(w,h);w>>=1;h>>=1}
  if(dp+siz(w,h)>raw.length){bad++;continue}
  let px;try{px=bs?dxtDec(raw,dp,w,h,(f>>>24)&15):bgra(raw,dp,w,h)}catch(e){bad++;continue}
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').putImageData(new ImageData(px,w,h),0,0);
  const T=new THREE.CanvasTexture(c);T.wrapS=T.wrapT=THREE.RepeatWrapping;T.name=t.name;tex[t.name.toLowerCase()]=T;ok++}
 applyTex();texList();toast(ok+' ta tekstura yuklandi'+(bad?' · '+bad+' tasi qo’llanmaydigan format':''))}
