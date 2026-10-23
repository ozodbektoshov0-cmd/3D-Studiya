/* ---- TXD o’qish ---- */
const tex={};
function applyTex(){meshes().forEach(o=>mats(o).forEach(m=>{const t=m.userData.tex&&tex[m.userData.tex.toLowerCase()];if(t&&m.map!==t){m.map=t;m.color.set(0xffffff);m.alphaTest=.05;m.needsUpdate=true}}))}
function txd(b){
 const v=new DataView(b),u8=p=>v.getUint8(p),u16=p=>v.getUint16(p,true),u32=p=>v.getUint32(p,true);
 const str=(p,n)=>{let s='';for(let i=0;i<n&&u8(p+i);i++)s+=String.fromCharCode(u8(p+i));return s};
 if(u32(0)!=0x16)throw Error('Bu TXD emas');
 function dxt(q,w,h,t,o){const bs=t==1?8:16,c5=c=>[(c>>11&31)*255/31,(c>>5&63)*255/63,(c&31)*255/31];
  for(let y0=0;y0<h;y0+=4)for(let x0=0;x0<w;x0+=4,q+=bs){
   const a=q+(t==1?0:8),c0=u16(a),c1=u16(a+2),A=c5(c0),B=c5(c1),pl=[A,B],bt=u32(a+4);
   if(c0>c1||t!=1)pl.push(A.map((x,i)=>(2*x+B[i])/3),A.map((x,i)=>(x+2*B[i])/3));else pl.push(A.map((x,i)=>(x+B[i])/2),[0,0,0]);
   const lo=t==5?u32(q+2):0,hi=t==5?u16(q+6):0,a0=u8(q),a1=u8(q+1);
   for(let i=0;i<16;i++){const x=x0+(i&3),y=y0+(i>>2);if(x>=w||y>=h)continue;
    const ci=bt>>>(2*i)&3,c=pl[ci],k=(y*w+x)*4;let al=255;
    if(t==1)al=c0<=c1&&ci==3?0:255;
    else if(t==3)al=(u8(q+(i>>1))>>(i&1)*4&15)*17;
    else{const s=i<10?lo>>>(3*i)&7:i==10?(lo>>>30|(hi&1)<<2)&7:hi>>>(3*i-32)&7;
     al=s==0?a0:s==1?a1:a0>a1?((8-s)*a0+(s-1)*a1)/7:s<6?((6-s)*a0+(s-1)*a1)/5:s==6?0:255}
    o[k]=c[0];o[k+1]=c[1];o[k+2]=c[2];o[k+3]=al}}}
 function nat(s){
  const plat=u32(s),name=str(s+8,32),rf=u32(s+72);let q=s+76,w,h,dep,d;
  if(plat==8){q+=4;w=u16(q);h=u16(q+2);dep=u8(q+4);d=u8(q+7);q+=8}
  else{const f=u32(q);q+=4;w=u16(q);h=u16(q+2);dep=u8(q+4);d=f==0x31545844?1:f==0x33545844?3:f==0x35545844?5:0;q+=8}
  const pal=rf&0x2000?q:0;if(pal)q+=1024;q+=4;
  const o=new Uint8ClampedArray(w*h*4);
  if(d)dxt(q,w,h,d,o);
  else for(let i=0;i<w*h;i++){let r,g,bl,a=255,k=i*4;
   if(pal){const x=u8(q+i)*4;bl=u8(pal+x);g=u8(pal+x+1);r=u8(pal+x+2);a=u8(pal+x+3)}
   else if(dep==32){bl=u8(q+k);g=u8(q+k+1);r=u8(q+k+2);a=u8(q+k+3)}
   else{const x=u16(q+i*2),f=rf&0xF00;if(f==0x200){r=(x>>11&31)*8.22;g=(x>>5&63)*4.05;bl=(x&31)*8.22}else if(f==0x300){a=(x>>12)*17;r=(x>>8&15)*17;g=(x>>4&15)*17;bl=(x&15)*17}else{a=x&0x8000?255:0;r=(x>>10&31)*8.22;g=(x>>5&31)*8.22;bl=(x&31)*8.22}}
   o[k]=r;o[k+1]=g;o[k+2]=bl;o[k+3]=(rf&0xF00)==0x600?255:a}
  const z=document.createElement('canvas');z.width=w;z.height=h;z.getContext('2d').putImageData(new ImageData(o,w,h),0,0);
  const t=new THREE.CanvasTexture(z);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.name=name;tex[name.toLowerCase()]=t}
 let p=12,n=0;const end=Math.min(b.byteLength,12+u32(4));
 while(p+12<=end){if(u32(p)==0x15){try{nat(p+24);n++}catch(e){}}p+=12+u32(p+4)}
 applyTex();texList();toast(n+' ta tekstura yuklandi');
}
