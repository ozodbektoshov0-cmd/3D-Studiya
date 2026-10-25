/* ---- TXD yozish (GTA SA, D3D8, DXT1/DXT3 + mipmap) ---- */
const rwName=n=>String(n).replace(/[^\w.-]/g,'_').slice(0,31);
function dxtEnc(d,w,h,al){
 const bs=al?16:8,o=new Uint8Array((w>>2)*(h>>2)*bs),dv=new DataView(o.buffer);let p=0;
 const e=v=>[(v>>11&31)*255/31,(v>>5&63)*255/63,(v&31)*255/31];
 for(let by=0;by<h;by+=4)for(let bx=0;bx<w;bx+=4){
  const K=[];for(let i=0;i<16;i++)K.push(((by+(i>>2))*w+bx+(i&3))*4);
  const mn=[255,255,255],mx=[0,0,0];
  K.forEach(k=>{for(let j=0;j<3;j++){const v=d[k+j];if(v<mn[j])mn[j]=v;if(v>mx[j])mx[j]=v}});
  if(al){for(let i=0;i<16;i+=2)o[p+(i>>1)]=(d[K[i]+3]>>4)|(d[K[i+1]+3]>>4)<<4;p+=8}
  let a=(mx[0]>>3)<<11|(mx[1]>>2)<<5|mx[2]>>3,b=(mn[0]>>3)<<11|(mn[1]>>2)<<5|mn[2]>>3;if(a<b){const t=a;a=b;b=t}
  const A=e(a),B=e(b),pl=[A,B,A.map((x,i)=>(2*x+B[i])/3),A.map((x,i)=>(x+2*B[i])/3)];let bits=0;
  if(a!=b)K.forEach((k,i)=>{let bi=0,bd=1e9;for(let j=0;j<4;j++){const q=pl[j],dd=(q[0]-d[k])**2+(q[1]-d[k+1])**2+(q[2]-d[k+2])**2;if(dd<bd){bd=dd;bi=j}}bits|=bi<<2*i});
  dv.setUint16(p,a,true);dv.setUint16(p+2,b,true);dv.setUint32(p+4,bits>>>0,true);p+=8}
 return o}
async function txdOut(){
 const VER=0x1803FFFF,U=a=>new Uint8Array(new Uint32Array(a).buffer),
  cat=a=>{let n=0;a.forEach(x=>n+=x.length);const o=new Uint8Array(n);let p=0;a.forEach(x=>{o.set(x,p);p+=x.length});return o},
  ck=(t,...a)=>{const d=cat(a);return cat([U([t,d.length,VER]),d])},E=()=>ck(3);
 const used=new Set();meshes().forEach(o=>mats(o).forEach(m=>{const n=m.userData.tex||(m.map&&m.map.name);if(n)used.add(rwName(n).toLowerCase())}));
 let L=Object.values(tex).filter(t=>used.has(rwName(t.name).toLowerCase()));if(!L.length)L=Object.values(tex);
 if(!L.length)throw Error('Tekstura yo’q: avval TXD yoki PNG oching');
 const mxs=+$('#txm').value||1024,p2=n=>Math.max(4,Math.min(mxs,2**Math.round(Math.log2(n)))),nat=[];
 for(const t of L){toast('TXD: '+t.name+'…');await new Promise(r=>setTimeout(r,0));
  const im=t.image,W=p2(im.width),H=p2(im.height),c=document.createElement('canvas'),x=c.getContext('2d',{willReadFrequently:true}),lv=Math.floor(Math.log2(Math.max(W,H)))+1,lvls=[];let al=false;
  for(let l=0;l<lv;l++){const cw=Math.max(4,W>>l),ch=Math.max(4,H>>l);c.width=cw;c.height=ch;x.clearRect(0,0,cw,ch);x.drawImage(im,0,0,cw,ch);
   const d=x.getImageData(0,0,cw,ch).data;if(!l)for(let i=3;i<d.length;i+=4)if(d[i]<250){al=true;break}lvls.push([cw,ch,d])}
  const parts=lvls.map(([cw,ch,d])=>{const b=dxtEnc(d,cw,ch,al);return[U([b.length]),b]}).flat(),n32=new Uint8Array(32),nm=rwName(t.name);
  for(let i=0;i<nm.length;i++)n32[i]=nm.charCodeAt(i);
  nat.push(ck(0x15,ck(1,U([8,0x1106]),n32,new Uint8Array(32),U([al?0x8300:0x8200,al?1:0]),new Uint8Array([W&255,W>>8,H&255,H>>8,16,lv,4,al?3:1]),...parts),E()))}
 return ck(0x16,ck(1,new Uint8Array([nat.length&255,nat.length>>8,0,0])),...nat,E())}
$('#txe').onclick=async()=>{try{const b=await txdOut();saveBlob(new Blob([b],{type:'application/octet-stream'}),name+'.txd');toast('TXD tayyor')}catch(e){toast(e.message)}};
