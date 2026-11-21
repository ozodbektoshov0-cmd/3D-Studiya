/* ---- YFT / YDR / YTD (GTA V, RSC7) yozish moduli ---- */
(function(rootScope){
'use strict';

function getT(T){
 return T||(typeof rootScope!=='undefined'&&rootScope.THREE)||(typeof THREE!=='undefined'?THREE:null);
}
function getFflate(){
 return(typeof rootScope!=='undefined'&&rootScope.fflate)||(typeof fflate!=='undefined'?fflate:null);
}
const g_meshes=()=>typeof rootScope.meshes==='function'?rootScope.meshes():(typeof meshes==='function'?meshes():[]);
const g_tex=()=>rootScope.tex||(typeof tex!=='undefined'?tex:{});
const g_root=()=>rootScope.root||(typeof root!=='undefined'?root:null);
const g_name=()=>typeof rootScope.name==='string'&&rootScope.name?rootScope.name:(typeof name!=='undefined'?name:'model');
const g_toast=m=>{if(typeof rootScope.toast==='function')rootScope.toast(m);else if(typeof toast==='function')toast(m)};
const g_saveBlob=(b,n)=>{if(typeof rootScope.saveBlob==='function')rootScope.saveBlob(b,n);else if(typeof saveBlob==='function')saveBlob(b,n)};
const g_ensureTexNames=()=>{if(typeof rootScope.ensureTexNames==='function')rootScope.ensureTexNames();else if(typeof ensureTexNames==='function')ensureTexNames()};

/* RSC7 sahifa bayroqlarini hisoblash (js/yft.js dagi rsz() ning aniq teskarisi) */
function encodeRsc7Flags(byteSize){
 if(!byteSize||byteSize<=0)return{flags:0,size:0};
 for(let shift=0;shift<=15;shift++){
  const base=0x200<<shift;
  const s=Math.ceil(byteSize/base);
  if(s<=2047){
   const b0=s&1,b1=(s>>1)&1,b2=(s>>2)&1,b3=(s>>3)&1,hi=(s>>4)&127;
   const flags=(shift&15)|(hi<<17)|(b3<<24)|(b2<<25)|(b1<<26)|(b0<<27);
   return{flags:flags>>>0,size:base*s};
  }
 }
 throw new Error('RSC7 hajmi juda katta');
}

function decodeRsc7Size(f){
 const s=(f>>27&1)+((f>>26&1)<<1)+((f>>25&1)<<2)+((f>>24&1)<<3)+((f>>17&127)<<4)+((f>>11&63)<<5)+((f>>7&15)<<6)+((f>>5&3)<<7)+((f>>4&1)<<8);
 return(0x200<<(f&15))*s;
}

function joaat(str){
 let h=0;
 const s=String(str||'').toLowerCase();
 for(let i=0;i<s.length;i++){
  h=(h+s.charCodeAt(i))>>>0;
  h=(h+(h<<10))>>>0;
  h=(h^(h>>>6))>>>0;
 }
 h=(h+(h<<3))>>>0;
 h=(h^(h>>>11))>>>0;
 h=(h+(h<<15))>>>0;
 return h>>>0;
}

const cleanTexName=n=>String(n||'tex').replace(/[^\w.-]/g,'_').slice(0,31)||'tex';

/* Virtual (0x50000000) va Physical (0x60000000) segmentlar uchun dinamik ajratgich */
class RscBuilder{
 constructor(){
  this.vBuf=new Uint8Array(65536);
  this.vLen=0;
  this.pBuf=new Uint8Array(65536);
  this.pLen=0;
  this.vView=new DataView(this.vBuf.buffer);
  this.pView=new DataView(this.pBuf.buffer);
  this.strCache=new Map();
 }
 _grow(isPhys,need){
  let buf=isPhys?this.pBuf:this.vBuf;
  if(need<=buf.length)return;
  let cap=buf.length;
  while(cap<need)cap*=2;
  const next=new Uint8Array(cap);
  next.set(buf);
  if(isPhys){this.pBuf=next;this.pView=new DataView(next.buffer)}
  else{this.vBuf=next;this.vView=new DataView(next.buffer)}
 }
 allocVirt(size,align=16){
  const off=(this.vLen+(align-1))&~(align-1);
  this._grow(false,off+size);
  this.vLen=off+size;
  return off;
 }
 allocPhys(size,align=16){
  const off=(this.pLen+(align-1))&~(align-1);
  this._grow(true,off+size);
  this.pLen=off+size;
  return off;
 }
 wu32(off,val){this.vView.setUint32(off,val>>>0,true)}
 wi16(off,val){this.vView.setInt16(off,val,true)}
 wu16(off,val){this.vView.setUint16(off,val&0xFFFF,true)}
 wu8(off,val){this.vBuf[off]=val&0xFF}
 wf4(off,val){this.vView.setFloat32(off,val,true)}
 wvPtr(at,targetVirtOff){
  if(targetVirtOff<0){this.wu32(at,0);this.wu32(at+4,0);return}
  this.wu32(at,(0x50000000+targetVirtOff)>>>0);
  this.wu32(at+4,0);
 }
 wpPtr(at,targetPhysOff){
  if(targetPhysOff<0){this.wu32(at,0);this.wu32(at+4,0);return}
  this.wu32(at,(0x60000000+targetPhysOff)>>>0);
  this.wu32(at+4,0);
 }
 wBytesVirt(off,bytes){this.vBuf.set(bytes,off)}
 wBytesPhys(off,bytes){this.pBuf.set(bytes,off)}
 writeStr(str){
  const s=String(str||'');
  if(this.strCache.has(s))return this.strCache.get(s);
  const off=this.allocVirt(s.length+1,4);
  for(let i=0;i<s.length;i++)this.vBuf[off+i]=s.charCodeAt(i)&0x7F;
  this.vBuf[off+s.length]=0;
  this.strCache.set(s,off);
  return off;
 }
 pack(version=13,fflateInst){
  const ff=fflateInst||getFflate();
  if(!ff||!ff.deflateSync)throw new Error('fflate kutubxonasi topilmadi');
  const sf=encodeRsc7Flags(Math.max(16,this.vLen));
  const pf=this.pLen>0?encodeRsc7Flags(this.pLen):{flags:0,size:0};
  const raw=new Uint8Array(sf.size+pf.size);
  raw.set(this.vBuf.subarray(0,this.vLen),0);
  if(this.pLen>0)raw.set(this.pBuf.subarray(0,this.pLen),sf.size);
  const comp=ff.deflateSync(raw,{level:6});
  const out=new Uint8Array(16+comp.length);
  const hd=new DataView(out.buffer);
  hd.setUint32(0,0x37435352,true);
  hd.setUint32(4,version>>>0,true);
  hd.setUint32(8,sf.flags>>>0,true);
  hd.setUint32(12,pf.flags>>>0,true);
  out.set(comp,16);
  return out;
 }
}

/* ---------- DXT1 (BC1) va DXT5 (BC3) kodlash ---------- */
function dxt1Enc(rgba,w,h){
 const bw=Math.max(1,(w+3)>>2),bh=Math.max(1,(h+3)>>2);
 const o=new Uint8Array(bw*bh*8),dv=new DataView(o.buffer);
 let p=0;
 const unpack565=v=>[(v>>11&31)*255/31,(v>>5&63)*255/63,(v&31)*255/31];
 for(let by=0;by<bh;by++){
  for(let bx=0;bx<bw;bx++){
   const K=[];
   for(let i=0;i<16;i++){
    const px=Math.min(w-1,bx*4+(i&3)),py=Math.min(h-1,by*4+(i>>2));
    K.push((py*w+px)*4);
   }
   let mnr=255,mng=255,mnb=255,mxr=0,mxg=0,mxb=0;
   for(let i=0;i<16;i++){
    const k=K[i],r=rgba[k],g=rgba[k+1],b=rgba[k+2];
    if(r<mnr)mnr=r;if(g<mng)mng=g;if(b<mnb)mnb=b;
    if(r>mxr)mxr=r;if(g>mxg)mxg=g;if(b>mxb)mxb=b;
   }
   let a=(mxr>>3)<<11|(mxg>>2)<<5|(mxb>>3);
   let b=(mnr>>3)<<11|(mng>>2)<<5|(mnb>>3);
   if(a<b){const t=a;a=b;b=t}
   const A=unpack565(a),B=unpack565(b);
   const pl=[A,B,A.map((x,i)=>(2*x+B[i])/3),A.map((x,i)=>(x+2*B[i])/3)];
   let bits=0;
   if(a!==b){
    for(let i=0;i<16;i++){
     const k=K[i];let bi=0,bd=1e9;
     for(let j=0;j<4;j++){
      const q=pl[j],dr=q[0]-rgba[k],dg=q[1]-rgba[k+1],db=q[2]-rgba[k+2];
      const dd=dr*dr+dg*dg+db*db;
      if(dd<bd){bd=dd;bi=j}
     }
     bits|=bi<<(2*i);
    }
   }
   dv.setUint16(p,a,true);
   dv.setUint16(p+2,b,true);
   dv.setUint32(p+4,bits>>>0,true);
   p+=8;
  }
 }
 return o;
}

function dxt5Enc(rgba,w,h){
 const bw=Math.max(1,(w+3)>>2),bh=Math.max(1,(h+3)>>2);
 const o=new Uint8Array(bw*bh*16),dv=new DataView(o.buffer);
 let p=0;
 const unpack565=v=>[(v>>11&31)*255/31,(v>>5&63)*255/63,(v&31)*255/31];
 for(let by=0;by<bh;by++){
  for(let bx=0;bx<bw;bx++){
   const K=[];
   for(let i=0;i<16;i++){
    const px=Math.min(w-1,bx*4+(i&3)),py=Math.min(h-1,by*4+(i>>2));
    K.push((py*w+px)*4);
   }
   /* Alfa bloki (8 bayt: a0 > a1, 16 x 3-bit indeks) */
   let mna=255,mxa=0;
   for(let i=0;i<16;i++){const al=rgba[K[i]+3];if(al<mna)mna=al;if(al>mxa)mxa=al}
   const a0=mxa,a1=mna;
   o[p]=a0;o[p+1]=a1;
   let lo24=0,hi24=0;
   if(a0>a1){
    const pal=[a0,a1];
    for(let s=2;s<=7;s++)pal.push(((8-s)*a0+(s-1)*a1)/7);
    for(let i=0;i<16;i++){
     const al=rgba[K[i]+3];let bi=0,bd=1e9;
     for(let j=0;j<8;j++){const d=Math.abs(pal[j]-al);if(d<bd){bd=d;bi=j}}
     if(i<8)lo24|=(bi<<(i*3));else hi24|=(bi<<((i-8)*3));
    }
   }
   o[p+2]=lo24&0xFF;o[p+3]=(lo24>>8)&0xFF;o[p+4]=(lo24>>16)&0xFF;
   o[p+5]=hi24&0xFF;o[p+6]=(hi24>>8)&0xFF;o[p+7]=(hi24>>16)&0xFF;
   p+=8;
   /* Rang bloki (8 bayt, DXT1 kabi) */
   let mnr=255,mng=255,mnb=255,mxr=0,mxg=0,mxb=0;
   for(let i=0;i<16;i++){
    const k=K[i],r=rgba[k],g=rgba[k+1],b=rgba[k+2];
    if(r<mnr)mnr=r;if(g<mng)mng=g;if(b<mnb)mnb=b;
    if(r>mxr)mxr=r;if(g>mxg)mxg=g;if(b>mxb)mxb=b;
   }
   let a=(mxr>>3)<<11|(mxg>>2)<<5|(mxb>>3);
   let b=(mnr>>3)<<11|(mng>>2)<<5|(mnb>>3);
   if(a<b){const t=a;a=b;b=t}
   const A=unpack565(a),B=unpack565(b);
   const pl=[A,B,A.map((x,i)=>(2*x+B[i])/3),A.map((x,i)=>(x+2*B[i])/3)];
   let bits=0;
   if(a!==b){
    for(let i=0;i<16;i++){
     const k=K[i];let bi=0,bd=1e9;
     for(let j=0;j<4;j++){
      const q=pl[j],dr=q[0]-rgba[k],dg=q[1]-rgba[k+1],db=q[2]-rgba[k+2];
      const dd=dr*dr+dg*dg+db*db;
      if(dd<bd){bd=dd;bi=j}
     }
     bits|=bi<<(2*i);
    }
   }
   dv.setUint16(p,a,true);
   dv.setUint16(p+2,b,true);
   dv.setUint32(p+4,bits>>>0,true);
   p+=8;
  }
 }
 return o;
}

function downsample2x(src,w,h){
 const nw=Math.max(4,w>>1),nh=Math.max(4,h>>1);
 const dst=new Uint8ClampedArray(nw*nh*4);
 for(let y=0;y<nh;y++){
  const sy=Math.min(h-1,y*2),sy1=Math.min(h-1,sy+1);
  for(let x=0;x<nw;x++){
   const sx=Math.min(w-1,x*2),sx1=Math.min(w-1,sx+1);
   const i0=(sy*w+sx)*4,i1=(sy*w+sx1)*4,i2=(sy1*w+sx)*4,i3=(sy1*w+sx1)*4;
   const o=(y*nw+x)*4;
   for(let c=0;c<4;c++)dst[o+c]=(src[i0+c]+src[i1+c]+src[i2+c]+src[i3+c]+2)>>2;
  }
 }
 return{rgba:dst,width:nw,height:nh};
}

/* Sof YTD quruvchi: { name, width, height, rgba } massividan RSC7 YTD yaratadi */
function ytdBuildFromList(texEntries,opts){
 opts=opts||{};
 if(!texEntries||!texEntries.length)throw new Error('Tekstura yo’q: avval YTD/TXD yoki PNG oching');
 const rb=new RscBuilder();
 const cnt=texEntries.length;
 const dictOff=rb.allocVirt(0x40,16);
 rb.wu32(dictOff+0x18,1);
 const hashesOff=rb.allocVirt(cnt*4,16);
 const ptrsOff=rb.allocVirt(cnt*8,16);
 rb.wvPtr(dictOff+0x20,hashesOff);
 rb.wu16(dictOff+0x28,cnt);
 rb.wu16(dictOff+0x2A,cnt);
 rb.wvPtr(dictOff+0x30,ptrsOff);
 rb.wu16(dictOff+0x38,cnt);
 rb.wu16(dictOff+0x3A,cnt);

 for(let i=0;i<cnt;i++){
  const item=texEntries[i];
  const nm=cleanTexName(item.name);
  rb.wu32(hashesOff+i*4,joaat(nm));
  const texOff=rb.allocVirt(0x90,16);
  rb.wvPtr(ptrsOff+i*8,texOff);
  const nameOff=rb.writeStr(nm);
  rb.wvPtr(texOff+0x28,nameOff);

  let curW=Math.max(4,item.width|0),curH=Math.max(4,item.height|0),curRgba=item.rgba;
  let hasAlpha=false;
  for(let k=3;k<curRgba.length;k+=4){if(curRgba[k]<250){hasAlpha=true;break}}
  const fourCC=hasAlpha?0x35545844:0x31545844;
  const maxDim=Math.max(curW,curH);
  const lv=Math.max(1,Math.floor(Math.log2(maxDim))-1);
  const mips=[];
  let w=curW,h=curH,px=curRgba;
  for(let l=0;l<lv;l++){
   mips.push(hasAlpha?dxt5Enc(px,w,h):dxt1Enc(px,w,h));
   if(w<=4&&h<=4)break;
   const next=downsample2x(px,w,h);
   w=next.width;h=next.height;px=next.rgba;
  }
  let totalBytes=0;
  mips.forEach(b=>totalBytes+=b.length);
  const physOff=rb.allocPhys(totalBytes,16);
  let cursor=physOff;
  mips.forEach(b=>{rb.wBytesPhys(cursor,b);cursor+=b.length});

  rb.wu16(texOff+0x50,curW);
  rb.wu16(texOff+0x52,curH);
  rb.wu16(texOff+0x54,1);
  rb.wu16(texOff+0x56,Math.max(1,(curW+3)>>2)*(hasAlpha?16:8));
  rb.wu32(texOff+0x58,fourCC);
  rb.wu8(texOff+0x5C,0);
  rb.wu8(texOff+0x5D,mips.length);
  rb.wpPtr(texOff+0x70,physOff);
 }
 return rb.pack(13,opts.fflate);
}

/* Brauzerdagi faol sahnadan YTD yaratish */
async function ytdOut(opts){
 opts=opts||{};
 try{g_ensureTexNames()}catch(e){}
 const mList=g_meshes();
 const txMap=g_tex();
 const used=new Set();
 mList.forEach(o=>[].concat(o.material||[]).forEach(m=>{
  const n=(m&&m.userData&&m.userData.tex)||(m&&m.map&&m.map.name);
  if(n)used.add(cleanTexName(n).toLowerCase());
 }));
 const okImg=t=>t&&t.image&&t.image.width>0;
 const cand=new Map();
 Object.values(txMap).forEach(t=>{if(okImg(t))cand.set(cleanTexName(t.name).toLowerCase(),t)});
 mList.forEach(o=>[].concat(o.material||[]).forEach(m=>{
  const n=m&&m.userData&&m.userData.tex;
  if(n&&okImg(m.map)&&!cand.has(cleanTexName(n).toLowerCase())){
   cand.set(cleanTexName(n).toLowerCase(),{name:n,image:m.map.image});
  }
 }));
 let L=[...cand.entries()].filter(([k])=>used.has(k)).map(e=>e[1]);
 if(!L.length)L=[...cand.values()];
 if(!L.length)throw new Error('Tekstura yo’q: avval YTD/TXD yoki PNG oching');

 const mxs=opts.maxSize||(typeof document!=='undefined'&&document.querySelector('#txm')?+document.querySelector('#txm').value||1024:1024);
 const p2=n=>Math.max(4,Math.min(mxs,2**Math.round(Math.log2(n))));
 const entries=[];
 for(const t of L){
  g_toast('YTD: '+t.name+'…');
  await new Promise(r=>setTimeout(r,0));
  const im=t.image,W=p2(im.width),H=p2(im.height);
  const c=document.createElement('canvas');
  c.width=W;c.height=H;
  const x=c.getContext('2d',{willReadFrequently:true});
  x.clearRect(0,0,W,H);
  x.drawImage(im,0,0,W,H);
  const rgba=x.getImageData(0,0,W,H).data;
  entries.push({name:t.name,width:W,height:H,rgba});
 }
 return ytdBuildFromList(entries,opts);
}

/* ---------- YFT / YDR (RSC7) quruvchi ---------- */
const GTA5_PART_ALIASES=[
 [/^wheel_lf(_dummy|_mesh)?$/i,'wheel_lf'],
 [/^wheel_rf(_dummy|_mesh)?$/i,'wheel_rf'],
 [/^wheel_l[br](_dummy|_mesh)?$/i,'wheel_lr'],
 [/^wheel_r[br](_dummy|_mesh)?$/i,'wheel_rr'],
 [/^wheel_lm\d*(_dummy|_mesh)?$/i,'wheel_lm1'],
 [/^wheel_rm\d*(_dummy|_mesh)?$/i,'wheel_rm1'],
 [/^(door_dside_f|door_lf(_dummy|_mesh)?)$/i,'door_dside_f'],
 [/^(door_pside_f|door_rf(_dummy|_mesh)?)$/i,'door_pside_f'],
 [/^(door_dside_r|door_lr(_dummy|_mesh)?)$/i,'door_dside_r'],
 [/^(door_pside_r|door_rr(_dummy|_mesh)?)$/i,'door_pside_r'],
 [/^(bonnet|hood)(_dummy|_mesh)?$/i,'bonnet'],
 [/^(boot|trunk)(_dummy|_mesh)?$/i,'boot'],
 [/^(bumper_f|bump_front)(_dummy|_mesh)?$/i,'bumper_f'],
 [/^(bumper_r|bump_rear)(_dummy|_mesh)?$/i,'bumper_r'],
 [/^windscreen(_dummy|_mesh)?$/i,'windscreen']
];

function mapGta5PartName(rawName){
 const base=String(rawName||'').replace(/_mesh$/i,'').replace(/(\.\d+|_\d{3})$/,'');
 for(const[re,canon]of GTA5_PART_ALIASES){
  if(re.test(base))return canon;
 }
 return null;
}

/* YFT eksporti uchun mesh optimizatori:
   1) Pozitsiya, normal va UV bo'yicha dublikat uchlarni birlashtiradi (qirra normallari va UV choklarini buzmasdan)
   2) Degenerat (nol maydonli, kollinear, mikro-qirrali va takroriy) uchburchaklarni birlashtiradi/olib tashlaydi
   3) Ishlatilmay qolgan uchlarni tozalab, keshi uchun ketma-ket qayta indekslaydi */
function optimizeYftMeshData(verts,tris,opts){
 opts=opts||{};
 const vCount=Math.floor((verts?verts.length:0)/8);
 const tCount=Math.floor((tris?tris.length:0)/3);
 if(!vCount||!tCount){
  return{verts:new Float32Array(0),tris:new Uint32Array(0),stats:{vertsBefore:vCount,vertsAfter:0,trisBefore:tCount,trisAfter:0,dupVertsRemoved:vCount,degenTrisRemoved:tCount}};
 }
 let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
 for(let i=0;i<vCount;i++){
  const x=verts[i*8],y=verts[i*8+1],z=verts[i*8+2];
  if(x<mnx)mnx=x;if(x>mxx)mxx=x;
  if(y<mny)mny=y;if(y>mxy)mxy=y;
  if(z<mnz)mnz=z;if(z>mxz)mxz=z;
 }
 const span=Math.max(mxx-mnx,mxy-mny,mxz-mnz,1e-4);
 const posEps=opts.posEps!=null?+opts.posEps:Math.max(1e-7,Math.min(1e-4,span*1e-5));
 const norEps=opts.norEps!=null?+opts.norEps:1.5e-2;
 const uvEps=opts.uvEps!=null?+opts.uvEps:1e-4;
 const edgeEps=opts.edgeEps!=null?+opts.edgeEps:Math.max(1e-6,Math.min(1e-4,span*2.5e-5));
 const heightEps=opts.heightEps!=null?+opts.heightEps:Math.max(1e-7,Math.min(1e-5,span*1e-6));
 const areaEps=opts.areaEps!=null?+opts.areaEps:Math.max(1e-12,heightEps*heightEps);

 const pInv=1/posEps,nInv=1/norEps,uInv=1/uvEps;
 const vMap=new Map(),vRemap=new Uint32Array(vCount);
 const uPos=[],uNor=[],uUv=[];
 let uCount=0;

 for(let i=0;i<vCount;i++){
  const b=i*8;
  const px=verts[b],py=verts[b+1],pz=verts[b+2];
  let nx=verts[b+3],ny=verts[b+4],nz=verts[b+5];
  const nL=Math.hypot(nx,ny,nz);
  if(nL>1e-8){nx/=nL;ny/=nL;nz/=nL}else{nx=0;ny=0;nz=1}
  const u=verts[b+6],v=verts[b+7];
  const key=(Math.round(px*pInv)||0)+','+(Math.round(py*pInv)||0)+','+(Math.round(pz*pInv)||0)+'|'
   +(Math.round(nx*nInv)||0)+','+(Math.round(ny*nInv)||0)+','+(Math.round(nz*nInv)||0)+'|'
   +(Math.round(u*uInv)||0)+','+(Math.round(v*uInv)||0);
  let id=vMap.get(key);
  if(id===undefined){
   id=uCount++;
   vMap.set(key,id);
   uPos.push(px,py,pz);
   uNor.push(nx,ny,nz);
   uUv.push(u,v);
  }else{
   uNor[id*3]+=nx;uNor[id*3+1]+=ny;uNor[id*3+2]+=nz;
  }
  vRemap[i]=id;
 }
 for(let i=0;i<uCount;i++){
  const b=i*3,l=Math.hypot(uNor[b],uNor[b+1],uNor[b+2]);
  if(l>1e-8){uNor[b]/=l;uNor[b+1]/=l;uNor[b+2]/=l}
 }

 /* Degenerat / mikro-chiziqli uchburchaklarning juda yaqin uchlarini birlashtirish (Union-Find) */
 const parent=new Uint32Array(uCount);
 for(let i=0;i<uCount;i++)parent[i]=i;
 const find=x=>{while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x]}return x};
 const canMerge=(a,b)=>{
  const dot=uNor[a*3]*uNor[b*3]+uNor[a*3+1]*uNor[b*3+1]+uNor[a*3+2]*uNor[b*3+2];
  if(dot<0.97)return false;
  return Math.abs(uUv[a*2]-uUv[b*2])<=1e-3&&Math.abs(uUv[a*2+1]-uUv[b*2+1])<=1e-3;
 };
 const snapLim=Math.max(edgeEps*5,5e-4);

 for(let t=0;t<tCount;t++){
  const a=find(vRemap[tris[t*3]]),b=find(vRemap[tris[t*3+1]]),c=find(vRemap[tris[t*3+2]]);
  if(a===b||b===c||a===c)continue;
  const ax=uPos[a*3],ay=uPos[a*3+1],az=uPos[a*3+2];
  const bx=uPos[b*3],by=uPos[b*3+1],bz=uPos[b*3+2];
  const cx=uPos[c*3],cy=uPos[c*3+1],cz=uPos[c*3+2];
  const e0x=bx-ax,e0y=by-ay,e0z=bz-az;
  const e1x=cx-ax,e1y=cy-ay,e1z=cz-az;
  const e2x=cx-bx,e2y=cy-by,e2z=cz-bz;
  const crx=e0y*e1z-e0z*e1y,cry=e0z*e1x-e0x*e1z,crz=e0x*e1y-e0y*e1x;
  const crossLen=Math.hypot(crx,cry,crz);
  const l01=Math.hypot(e0x,e0y,e0z),l02=Math.hypot(e1x,e1y,e1z),l12=Math.hypot(e2x,e2y,e2z);
  const maxL=Math.max(l01,l02,l12),h=maxL>1e-12?crossLen/maxL:0;
  if(crossLen>areaEps&&h>heightEps)continue;
  let u=a,v=b,minL=l01;
  if(l02<minL){minL=l02;u=a;v=c}
  if(l12<minL){minL=l12;u=b;v=c}
  if(minL<=snapLim&&canMerge(u,v)){
   const ru=find(u),rv=find(v);
   if(ru!==rv)parent[ru]=rv;
  }
 }

 /* Degenerat va aynan takroriy uchburchaklarni chiqarib tashlash */
 const seenTris=new Set(),kept=[];
 let degenRemoved=0;
 for(let t=0;t<tCount;t++){
  const a=find(vRemap[tris[t*3]]),b=find(vRemap[tris[t*3+1]]),c=find(vRemap[tris[t*3+2]]);
  if(a===b||b===c||a===c){degenRemoved++;continue}
  const ax=uPos[a*3],ay=uPos[a*3+1],az=uPos[a*3+2];
  const bx=uPos[b*3],by=uPos[b*3+1],bz=uPos[b*3+2];
  const cx=uPos[c*3],cy=uPos[c*3+1],cz=uPos[c*3+2];
  const e0x=bx-ax,e0y=by-ay,e0z=bz-az;
  const e1x=cx-ax,e1y=cy-ay,e1z=cz-az;
  const e2x=cx-bx,e2y=cy-by,e2z=cz-bz;
  const crx=e0y*e1z-e0z*e1y,cry=e0z*e1x-e0x*e1z,crz=e0x*e1y-e0y*e1x;
  const crossLen=Math.hypot(crx,cry,crz);
  const maxL=Math.max(Math.hypot(e0x,e0y,e0z),Math.hypot(e1x,e1y,e1z),Math.hypot(e2x,e2y,e2z));
  const h=maxL>1e-12?crossLen/maxL:0;
  if(crossLen<=areaEps||h<=heightEps){degenRemoved++;continue}
  let k0=a,k1=b,k2=c;
  if(b<=a&&b<=c){k0=b;k1=c;k2=a}
  else if(c<=a&&c<=b){k0=c;k1=a;k2=b}
  const tk=k0+'_'+k1+'_'+k2;
  if(seenTris.has(tk)){degenRemoved++;continue}
  seenTris.add(tk);
  kept.push(a,b,c);
 }

 /* Foydalanilmaydigan uchlarni qisqartirish va ketma-ket qayta indekslash */
 const usedMap=new Int32Array(uCount).fill(-1);
 const finalVerts=[];
 const finalTris=new Uint32Array(kept.length);
 let fCount=0;
 for(let i=0;i<kept.length;i++){
  const oldId=kept[i];
  let newId=usedMap[oldId];
  if(newId===-1){
   newId=fCount++;
   usedMap[oldId]=newId;
   finalVerts.push(
    uPos[oldId*3],uPos[oldId*3+1],uPos[oldId*3+2],
    uNor[oldId*3],uNor[oldId*3+1],uNor[oldId*3+2],
    uUv[oldId*2],uUv[oldId*2+1]
   );
  }
  finalTris[i]=newId;
 }

 return{
  verts:new Float32Array(finalVerts),
  tris:finalTris,
  stats:{
   vertsBefore:vCount,
   vertsAfter:fCount,
   trisBefore:tCount,
   trisAfter:finalTris.length/3,
   dupVertsRemoved:Math.max(0,vCount-fCount),
   degenTrisRemoved:degenRemoved
  }
 };
}

/* Geometriyani <=65535 uchli va bitta materialli bo’laklarga ajratish */
function splitGta5Chunks(mesh,xfMatrix,T,opts,optTotals){
 T=getT(T);
 opts=opts||{};
 const g=mesh.geometry,P=g.getAttribute('position');
 if(!P||P.count<3)return[];
 let N=g.getAttribute('normal');
 if(!N){const cl=g.clone();cl.computeVertexNormals();N=cl.getAttribute('normal')}
 const UV=g.getAttribute('uv');
 const ix=g.index?g.index.array:null,nt=Math.floor((ix?ix.length:P.count)/3),I=i=>ix?ix[i]:i;
 const ma0=[].concat(mesh.material||[]);
 const gr=g.groups&&g.groups.length&&ma0.length>1?g.groups:[{start:0,count:nt*3,materialIndex:0}];
 const flip=xfMatrix.determinant()<0;
 const nrmMat=new T.Matrix3().getNormalMatrix(xfMatrix);
 const v=new T.Vector3(),nVec=new T.Vector3();
 const useOpt=opts.optimize!==false;

 const MAX=65535;
 const chunks=[];
 gr.forEach(r=>{
  const mat=ma0[Math.min(r.materialIndex||0,ma0.length-1)]||ma0[0];
  const triEnd=Math.min(r.start+r.count,nt*3);
  if(triEnd-r.start<3)return;

  const rawTex=(mat&&mat.userData&&mat.userData.tex)||(mat&&mat.map&&mat.map.name)||((mat&&mat.map&&mat.map.image)?('tex_'+String(mat.map.uuid||'0').slice(0,6)):'');
  const texName=rawTex?cleanTexName(rawTex):'';
  const c=(mat&&mat.color)?mat.color:{r:0.85,g:0.86,b:0.88};
  const alpha=(mat&&mat.opacity!=null&&(mat.transparent||mat.opacity<0.99))?Math.max(0,Math.min(1,mat.opacity)):1;
  const rough=(mat&&mat.roughness!=null)?Math.max(0,Math.min(1,mat.roughness)):0.45;
  const metal=(mat&&mat.metalness!=null)?Math.max(0,Math.min(1,mat.metalness)):0.15;

  /* Avval ushbu material guruhi uchlari va uchburchaklarini yig'amiz */
  const locMap=new Map(),locSrc=[],locTris=[];
  for(let t=r.start;t+2<triEnd;t+=3){
   for(let j=0;j<3;j++){
    const oi=I(t+j);
    let id=locMap.get(oi);
    if(id===undefined){id=locSrc.length;locMap.set(oi,id);locSrc.push(oi)}
    locTris.push(id);
   }
  }
  const rawVerts=new Float32Array(locSrc.length*8);
  for(let i=0;i<locSrc.length;i++){
   const oi=locSrc[i];
   v.set(P.getX(oi),P.getY(oi),P.getZ(oi)).applyMatrix4(xfMatrix);
   nVec.set(N.getX(oi),N.getY(oi),N.getZ(oi)).applyMatrix3(nrmMat).normalize();
   rawVerts[i*8]=v.x;rawVerts[i*8+1]=v.y;rawVerts[i*8+2]=v.z;
   rawVerts[i*8+3]=nVec.x;rawVerts[i*8+4]=nVec.y;rawVerts[i*8+5]=nVec.z;
   rawVerts[i*8+6]=UV?UV.getX(oi):0;
   rawVerts[i*8+7]=UV?(1-UV.getY(oi)):0;
  }

  let optVerts=rawVerts,optTris=locTris;
  if(useOpt){
   const opt=optimizeYftMeshData(rawVerts,locTris,opts);
   optVerts=opt.verts;
   optTris=opt.tris;
   if(optTotals){
    optTotals.vertsBefore+=opt.stats.vertsBefore;
    optTotals.vertsAfter+=opt.stats.vertsAfter;
    optTotals.trisBefore+=opt.stats.trisBefore;
    optTotals.trisAfter+=opt.stats.trisAfter;
    optTotals.dupVertsRemoved+=opt.stats.dupVertsRemoved;
    optTotals.degenTrisRemoved+=opt.stats.degenTrisRemoved;
   }
  }else if(optTotals){
   optTotals.vertsBefore+=locSrc.length;
   optTotals.vertsAfter+=locSrc.length;
   optTotals.trisBefore+=locTris.length/3;
   optTotals.trisAfter+=locTris.length/3;
  }
  if(!optTris.length)return;

  let map=new Map(),src=[],indices=[];
  const flush=()=>{
   if(!indices.length)return;
   const vc=src.length;
   const vtx=new Float32Array(vc*8); /* 3 pos + 3 nor + 2 uv = 32 bayt stride */
   for(let i=0;i<vc;i++){
    const oi=src[i]*8,di=i*8;
    vtx[di]=optVerts[oi];vtx[di+1]=optVerts[oi+1];vtx[di+2]=optVerts[oi+2];
    vtx[di+3]=optVerts[oi+3];vtx[di+4]=optVerts[oi+4];vtx[di+5]=optVerts[oi+5];
    vtx[di+6]=optVerts[oi+6];vtx[di+7]=optVerts[oi+7];
   }
   /* yft.js o'qiganda [i+1,i+2] ni almashtiradi — shunga mos teskari yozamiz */
   const idxU16=new Uint16Array(indices.length);
   for(let i=0;i+2<indices.length;i+=3){
    if(flip){
     idxU16[i]=indices[i];idxU16[i+1]=indices[i+1];idxU16[i+2]=indices[i+2];
    }else{
     idxU16[i]=indices[i];idxU16[i+1]=indices[i+2];idxU16[i+2]=indices[i+1];
    }
   }
   chunks.push({vc,vtxBytes:new Uint8Array(vtx.buffer),idxU16,texName,rgba:[c.r,c.g,c.b,alpha],pbr:[rough,metal,0,0]});
   map=new Map();src=[];indices=[];
  };
  for(let t=0;t+2<optTris.length;t+=3){
   const vs=[optTris[t],optTris[t+1],optTris[t+2]];
   let add=0;for(let j=0;j<3;j++)if(!map.has(vs[j]))add++;
   if(src.length+add>MAX)flush();
   for(let j=0;j<3;j++){
    const vi=vs[j];
    let id=map.get(vi);
    if(id===undefined){id=src.length;map.set(vi,id);src.push(vi)}
    indices.push(id);
   }
  }
  flush();
 });
 return chunks;
}

/* bitta gtaDrawable (DRFR) yozish; skeletonPtr >= 0 bo'lsa D+0x18 ga ulanadi */
function writeDrawable(rb,chunks,skeletonOff){
 const drwOff=rb.allocVirt(0x60,16);
 rb.wu32(drwOff+0x00,0x52465244); /* 'DRFR' */

 /* ShaderGroup */
 const shSpecs=[];const chunkToShader=new Map();
 const shKey=c=>c.texName?('T:'+c.texName):('C:'+Math.round(c.rgba[0]*255)+','+Math.round(c.rgba[1]*255)+','+Math.round(c.rgba[2]*255)+','+Math.round(c.rgba[3]*255)+','+Math.round(c.pbr[0]*100)+','+Math.round(c.pbr[1]*100));
 chunks.forEach(c=>{
  const k=shKey(c);
  if(!chunkToShader.has(k)){
   chunkToShader.set(k,shSpecs.length);
   shSpecs.push(c);
  }
 });
 const sn=Math.max(1,shSpecs.length);
 const sgOff=rb.allocVirt(0x28,16);
 const saOff=rb.allocVirt(sn*8,16);
 rb.wvPtr(drwOff+0x10,sgOff);
 rb.wvPtr(sgOff+0x10,saOff);
 rb.wu16(sgOff+0x18,sn);
 rb.wu16(sgOff+0x1A,sn);

 for(let si=0;si<sn;si++){
  const sp=shSpecs[si];
  const sOff=rb.allocVirt(0x20,16);
  rb.wvPtr(saOff+si*8,sOff);
  if(sp&&sp.texName){
   const ppOff=rb.allocVirt(0x10,16);
   const tOff=rb.allocVirt(0x40,16);
   const strOff=rb.writeStr(sp.texName);
   rb.wvPtr(sOff+0x00,ppOff);
   rb.wu8(sOff+0x10,1);
   rb.wu8(ppOff+0x00,0);
   rb.wvPtr(ppOff+0x08,tOff);
   rb.wvPtr(tOff+0x28,strOff);
  }else{
   /* Teksturasiz material rangi va PBR (diffuse RGBA + roughness/metalness): soxta tekstura nomi yozilmaydi */
   const rgba=(sp&&sp.rgba)||[0.85,0.86,0.88,1];
   const pbr=(sp&&sp.pbr)||[0.45,0.15,0,0];
   const ppOff=rb.allocVirt(0x20,16);
   const v0Off=rb.allocVirt(16,16);
   const v1Off=rb.allocVirt(16,16);
   for(let k=0;k<4;k++){
    rb.wf4(v0Off+k*4,rgba[k]);
    rb.wf4(v1Off+k*4,pbr[k]);
   }
   rb.wvPtr(sOff+0x00,ppOff);
   rb.wu8(sOff+0x10,2);
   rb.wu32(sOff+0x18,0x4C4F4353); /* 'SCOL' */
   rb.wu8(ppOff+0x00,1);rb.wu8(ppOff+0x01,0);rb.wvPtr(ppOff+0x08,v0Off);
   rb.wu8(ppOff+0x10,1);rb.wu8(ppOff+0x11,1);rb.wvPtr(ppOff+0x18,v1Off);
  }
 }

 if(skeletonOff>=0)rb.wvPtr(drwOff+0x18,skeletonOff);

 /* LODGroup -> 1 Model (yoki bo'sh bo'lsa 0) -> N Geometries */
 const lsOff=rb.allocVirt(0x20,16);
 const modelsArrOff=rb.allocVirt(8,16);
 const mOff=rb.allocVirt(0x30,16);
 const modelCnt=chunks.length?1:0;
 rb.wvPtr(drwOff+0x50,lsOff);
 rb.wvPtr(lsOff+0x00,modelsArrOff);
 rb.wu16(lsOff+0x08,modelCnt);
 rb.wu16(lsOff+0x0A,modelCnt);
 rb.wvPtr(modelsArrOff,mOff);

 const gc=chunks.length;
 const gaOff=rb.allocVirt(Math.max(1,gc)*8,16);
 const smOff=rb.allocVirt(Math.max(1,gc)*2,16);
 rb.wvPtr(mOff+0x08,gaOff);
 rb.wu16(mOff+0x10,gc);
 rb.wu16(mOff+0x12,gc);
 rb.wvPtr(mOff+0x20,smOff);

 /* Umumiy vertex deklaratsiyasi: stride=32 (pos=6 @0, normal=6 @12, uv=5 @24) */
 const declOff=rb.allocVirt(16,16);
 rb.wu32(declOff+0x00,(1<<0)|(1<<3)|(1<<6)); /* 73 */
 rb.wu32(declOff+0x04,0);
 rb.wu32(declOff+0x08,(6<<0)|(6<<12)|(5<<24)); /* 0x05006006 */
 rb.wu32(declOff+0x0C,0);

 chunks.forEach((ch,j)=>{
  const gOff=rb.allocVirt(0x48,16);
  const vbOff=rb.allocVirt(0x40,16);
  const ibOff=rb.allocVirt(0x20,16);
  const vDataOff=rb.allocVirt(ch.vtxBytes.length,16);
  const iDataOff=rb.allocVirt(ch.idxU16.byteLength,16);
  rb.wBytesVirt(vDataOff,ch.vtxBytes);
  rb.wBytesVirt(iDataOff,new Uint8Array(ch.idxU16.buffer,ch.idxU16.byteOffset,ch.idxU16.byteLength));

  rb.wvPtr(gaOff+j*8,gOff);
  rb.wvPtr(gOff+0x18,vbOff);
  rb.wvPtr(gOff+0x38,ibOff);
  rb.wu16(smOff+j*2,chunkToShader.get(shKey(ch))||0);

  rb.wu16(vbOff+0x08,32);
  rb.wvPtr(vbOff+0x10,vDataOff);
  rb.wu32(vbOff+0x18,ch.vc);
  rb.wvPtr(vbOff+0x30,declOff);

  rb.wu32(ibOff+0x08,ch.idxU16.length);
  rb.wvPtr(ibOff+0x10,iDataOff);
 });

 return drwOff;
}

function writeSkeleton(rb,bones){
 const nb=bones.length,bk=Math.max(4,nb);
 const sOff=rb.allocVirt(0x48,16);
 const arOff=rb.allocVirt(bk*8,16);
 const bnOff=rb.allocVirt(nb*0x50,16);
 const trOff=rb.allocVirt(nb*64,16);
 const prOff=rb.allocVirt(Math.max(4,nb*2),16);

 rb.wvPtr(sOff+0x10,arOff);
 rb.wu16(sOff+0x18,bk);
 rb.wu16(sOff+0x1A,nb);
 rb.wvPtr(sOff+0x20,bnOff);
 rb.wvPtr(sOff+0x30,trOff);
 rb.wvPtr(sOff+0x38,prOff);

 const usedTags=new Set([0]);
 for(let i=0;i<nb;i++){
  const b=bones[i];
  const nameOff=rb.writeStr(b.name);
  rb.wvPtr(bnOff+i*0x50+0x38,nameOff);
  const el=b.matrix.elements;
  for(let k=0;k<16;k++)rb.wf4(trOff+i*64+k*4,el[k]);
  rb.wi16(prOff+i*2,b.parentIndex);

  let tag=i===0?0:((joaat(b.name)&0xFFFE)|1);
  while(i>0&&usedTags.has(tag))tag=(tag+2)&0xFFFF;
  usedTags.add(tag);
  b.tag=tag;

  const bucket=tag%bk;
  const nodeOff=rb.allocVirt(12,16);
  rb.wu32(nodeOff+0x00,tag);
  rb.wu32(nodeOff+0x04,i);
  /* oldingi bucket boshini zanjirlash */
  const headPtr=rb.vView.getUint32(arOff+bucket*8,true);
  rb.wu32(nodeOff+0x08,headPtr);
  rb.wvPtr(arOff+bucket*8,nodeOff);
 }
 return sOff;
}

function yftBuildFromMeshes(meshList,opts,T){
 T=getT(T);
 opts=opts||{};
 const real=(meshList||[]).filter(m=>m&&m.isMesh&&!m.userData.dummy&&m.geometry&&m.visible!==false);
 if(!real.length)throw new Error('Eksport uchun mesh yo’q');

 const Z=new T.Matrix4().makeRotationX(Math.PI/2);
 const rb=new RscBuilder();
 const optTotals={vertsBefore:0,vertsAfter:0,trisBefore:0,trisAfter:0,dupVertsRemoved:0,degenTrisRemoved:0};

 if(opts.ydr){
  const chunks=[];
  real.forEach(m=>{
   m.updateMatrixWorld(true);
   const xf=new T.Matrix4().multiplyMatrices(Z,m.matrixWorld);
   chunks.push(...splitGta5Chunks(m,xf,T,opts,optTotals));
  });
  if(!chunks.length)throw new Error('YDR geometriyasi bo’sh');
  writeDrawable(rb,chunks,-1);
  yftOut.optStats=optTotals;
  yftOut.info=[];
  if(optTotals.dupVertsRemoved||optTotals.degenTrisRemoved){
   yftOut.info.push('opt: -'+optTotals.dupVertsRemoved+' uch, -'+optTotals.degenTrisRemoved+' degen');
  }
  return rb.pack(13,opts.fflate);
 }

 /* YFT (gtaFragType) */
 const fragOff=rb.allocVirt(0x60,16);
 rb.wu32(fragOff+0x00,0x47415246); /* 'FRAG' */

 const chassisMeshes=[];
 const partGroups=new Map();

 real.forEach(m=>{
  m.updateMatrixWorld(true);
  let part=mapGta5PartName(m.name);
  if(!part&&m.parent&&m.parent.name&&m.parent!==g_root()){
   part=mapGta5PartName(m.parent.name);
  }
  if(part){
   let arr=partGroups.get(part);if(!arr){arr=[];partGroups.set(part,arr)}
   arr.push(m);
  }else{
   chassisMeshes.push(m);
  }
 });

 const bones=[{name:'chassis',parentIndex:-1,matrix:new T.Matrix4()}];
 const childJobs=[];

 partGroups.forEach((list,partName)=>{
  const box=new T.Box3();
  list.forEach(m=>{
   const g=m.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(Z,m.matrixWorld));
   g.computeBoundingBox();
   if(g.boundingBox)box.union(g.boundingBox);
  });
  const center=box.isEmpty()?new T.Vector3():box.getCenter(new T.Vector3());
  const boneMat=new T.Matrix4().makeTranslation(center.x,center.y,center.z);
  const invBone=new T.Matrix4().makeTranslation(-center.x,-center.y,-center.z);
  const boneIdx=bones.length;
  bones.push({name:partName,parentIndex:0,matrix:boneMat});
  const chunks=[];
  list.forEach(m=>{
   const xf=new T.Matrix4().multiplyMatrices(invBone,new T.Matrix4().multiplyMatrices(Z,m.matrixWorld));
   chunks.push(...splitGta5Chunks(m,xf,T,opts,optTotals));
  });
  if(chunks.length)childJobs.push({boneIdx,chunks});
 });

 const skelOff=writeSkeleton(rb,bones);

 const mainChunks=[];
 chassisMeshes.forEach(m=>{
  const xf=new T.Matrix4().multiplyMatrices(Z,m.matrixWorld);
  mainChunks.push(...splitGta5Chunks(m,xf,T,opts,optTotals));
 });
 const mainDrwOff=writeDrawable(rb,mainChunks,skelOff);
 rb.wvPtr(fragOff+0x30,mainDrwOff);

 /* Har bir harakatlanuvchi qism uchun SUBC (fragTypeChild) + childDrawable */
 childJobs.forEach(job=>{
  const subOff=rb.allocVirt(0xB0,16);
  const childDrwOff=writeDrawable(rb,job.chunks,-1);
  rb.wu32(subOff+0x00,0x43425553); /* 'SUBC' */
  rb.wu32(subOff+0x04,0);
  rb.wu16(subOff+0x12,bones[job.boneIdx].tag);
  rb.wvPtr(subOff+0xA0,childDrwOff);
 });

 yftOut.optStats=optTotals;
 yftOut.info=[bones.length+' suyak',childJobs.length+' bo’lak'];
 if(optTotals.dupVertsRemoved||optTotals.degenTrisRemoved){
  yftOut.info.push('opt: -'+optTotals.dupVertsRemoved+' uch, -'+optTotals.degenTrisRemoved+' degen');
 }
 return rb.pack(13,opts.fflate);
}

function yftOut(opts){
 opts=Object.assign({},opts||{});
 if(opts.optimize===undefined&&typeof document!=='undefined'){
  const chk=document.querySelector('#yftopt');
  if(chk)opts.optimize=chk.checked;
 }
 const mList=g_meshes().filter(m=>m.visible&&!m.userData.dummy);
 try{g_ensureTexNames()}catch(e){}
 return yftBuildFromMeshes(mList,opts,getT(opts.THREE));
}
yftOut.info=[];
yftOut.optStats=null;

if(typeof document!=='undefined'){
 const yte=document.querySelector('#ytde');
 if(yte){
  yte.onclick=async()=>{
   try{
    const b=await ytdOut();
    const nm=g_name()+'.ytd';
    g_saveBlob(new Blob([b],{type:'application/octet-stream'}),nm);
    g_toast('YTD tayyor');
   }catch(e){
    g_toast(e.message||String(e));
   }
  };
 }
}

const api={
 encodeRsc7Flags,
 decodeRsc7Size,
 joaat,
 dxt1Enc,
 dxt5Enc,
 downsample2x,
 optimizeYftMeshData,
 ytdBuildFromList,
 ytdOut,
 yftBuildFromMeshes,
 yftOut
};

if(typeof rootScope!=='undefined'){
 rootScope.GTA5Write=api;
 rootScope.ytdOut=ytdOut;
 rootScope.yftOut=yftOut;
}
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
