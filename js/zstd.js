/* ---- Zstandard (RFC 8878) dekoderi — sof JS, tashqi kutubxonasiz ----
   Yangi 3ds Max (.max) fayllarida Scene/ClassDirectory3 va boshqa oqimlar zstd bilan siqilgan (“*_Compressed”).
   zstdDecode(Uint8Array|ArrayBuffer) → Uint8Array. Lug'at (dictionary) qo'llab-quvvatlanmaydi; checksum tekshirilmaydi. */
const zstdDecode=(function(){
 const LLB=[],LLX=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,3,3,4,6,7,8,9,10,11,12,13,14,15,16],
  MLX=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,3,3,4,4,5,7,8,9,10,11,12,13,14,15,16],MLB=[];
 {let a=0;for(let i=0;i<36;i++){LLB.push(a);a+=1<<LLX[i]}/* 0..15 → 0..15, 16 → 16, 17 → 18 … */
  a=3;for(let i=0;i<53;i++){MLB.push(a);a+=1<<MLX[i]}}
 const DLL=[4,3,2,2,2,2,2,2,2,2,2,2,2,1,1,1,2,2,2,2,2,2,2,2,2,3,2,1,1,1,1,1,-1,-1,-1,-1],
  DOF=[1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,-1,-1,-1,-1,-1],
  DML=[1,4,3,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,-1,-1,-1,-1,-1,-1,-1];
 /* FSE dekod jadvali: normallangan sanoqlardan */
 function build(cnt,al){
  const size=1<<al,sym=new Uint8Array(size),nb=new Uint8Array(size),base=new Uint16Array(size),next=new Uint16Array(cnt.length);
  let hi=size-1;
  for(let s=0;s<cnt.length;s++){if(cnt[s]===-1){sym[hi--]=s;next[s]=1}else next[s]=cnt[s]}
  const step=(size>>1)+(size>>3)+3,mask=size-1;let pos=0;
  for(let s=0;s<cnt.length;s++)for(let i=0;i<cnt[s];i++){sym[pos]=s;do pos=(pos+step)&mask;while(pos>hi)}
  for(let i=0;i<size;i++){const s=sym[i],ns=next[s]++,b=al-(31-Math.clz32(ns));nb[i]=b;base[i]=(ns<<b)-size}
  return{sym,nb,base,al}}
 const PLL=build(DLL,6),POF=build(DOF,5),PML=build(DML,6);
 const rle=b=>({sym:Uint8Array.of(b),nb:Uint8Array.of(0),base:Uint16Array.of(0),al:0});
 return function zstdDecode(src){
  const u8=src instanceof Uint8Array?src:new Uint8Array(src);
  const E=m=>Error('zstd: '+m);
  let ip=0,out=new Uint8Array(Math.max(1<<16,u8.length*4)),op=0,fs=0;
  const need=n=>{if(op+n>out.length){let c=out.length*2;while(c<op+n)c*=2;const t=new Uint8Array(c);t.set(out.subarray(0,op));out=t}};
  const at=(p,n)=>{const q=p>>3;return((u8[q]|u8[q+1]<<8|u8[q+2]<<16|u8[q+3]<<24)>>>(p&7))&((1<<n)-1)};
  let huf=null,fLL=null,fOF=null,fML=null,rep=[1,4,8];
  /* FSE jadval tavsifini o'qish (oldinga, LSB-birinchi) */
  function readFSE(p,maxAL){
   let bit=p*8;const rb=n=>{const v=at(bit,n);bit+=n;return v};
   const al=rb(4)+5;if(al>maxAL)throw E('FSE aniqlik darajasi juda katta');
   let rem=(1<<al)+1,th=1<<al,nb=al+1,prev0=false;const cnt=[];
   while(rem>1){
    if(prev0){let r;do{r=rb(2);for(let i=0;i<r;i++)cnt.push(0)}while(r===3)}
    const mx=2*th-1-rem,v=at(bit,nb);let val;
    if((v&(th-1))<mx){val=v&(th-1);bit+=nb-1}else{val=v&(2*th-1);if(val>=th)val-=mx;bit+=nb}
    const c=val-1;rem-=c<0?-c:c;cnt.push(c);prev0=c===0;
    while(rem<th){nb--;th>>=1}
    if(cnt.length>256)throw E('FSE jadvali buzuq')}
   if(rem!==1)throw E('FSE jadvali buzuq');
   return{t:build(cnt,al),end:(bit+7)>>3}}
  /* Huffman daraxti */
  function readTree(p){
   const hb=u8[p++],w=new Uint8Array(257);let n;
   if(hb>=128){n=hb-127;for(let i=0;i<n;i+=2){const x=u8[p+(i>>1)];w[i]=x>>4;if(i+1<n)w[i+1]=x&15}p+=(n+1)>>1}
   else{
    const end=p+hb,r=readFSE(p,6),t=r.t,s=r.end,last=u8[end-1];if(!last)throw E('Huffman vazn oqimi buzuq');
    let bp=(end-1-s)*8+(31-Math.clz32(last)),over=false;
    const rd=k=>{bp-=k;if(bp<0){over=true;return bp+k>0?at(s*8,bp+k)<<-bp:0}return at(s*8+bp,k)};
    let s1=rd(t.al),s2=rd(t.al);n=0;
    for(;;){
     let b=t.nb[s1];w[n++]=t.sym[s1];s1=t.base[s1]+rd(b);
     if(over){w[n++]=t.sym[s2];break}
     b=t.nb[s2];w[n++]=t.sym[s2];s2=t.base[s2]+rd(b);
     if(over){w[n++]=t.sym[s1];break}
     if(n>=255)throw E('Huffman vaznlari juda ko‘p')}
    p=end}
   let sum=0;for(let i=0;i<n;i++)if(w[i])sum+=1<<(w[i]-1);
   if(!sum)throw E('Huffman daraxti bo‘sh');
   const mb=32-Math.clz32(sum),rest=(1<<mb)-sum;
   if(!rest||(rest&(rest-1)))throw E('Huffman vaznlari noto‘g‘ri');
   w[n++]=32-Math.clz32(rest);/* log2(rest)+1 */
   if(mb>11)throw E('Huffman kodi juda uzun');
   const size=1<<mb,sym=new Uint8Array(size),nbs=new Uint8Array(size);let pos=0;
   for(let wt=1;wt<=mb;wt++)for(let s=0;s<n;s++)if(w[s]===wt){const c=1<<(wt-1);sym.fill(s,pos,pos+c);nbs.fill(mb+1-wt,pos,pos+c);pos+=c}
   huf={mb,sym,nbs};return p}
  /* Huffman oqimi (orqaga o'qiladi) */
  function hStream(s,e,dst,dp,cnt){
   const last=u8[e-1];if(!last)throw E('Huffman oqimi buzuq');
   let bp=(e-1-s)*8+(31-Math.clz32(last));const mb=huf.mb,ts=huf.sym,tb=huf.nbs,mask=(1<<mb)-1;
   for(let i=0;i<cnt;i++){
    const p=bp-mb;let v;
    if(p>=0)v=at(s*8+p,mb);else v=bp>0?(at(s*8,bp)<<-p)&mask:0;
    dst[dp++]=ts[v];bp-=tb[v]}
   if(bp<0)throw E('Huffman oqimi buzuq')}
  function block(s,e){
   let p=s;const b0=u8[p],lt=b0&3,sf=(b0>>2)&3;let regen,lit;
   if(lt<2){
    if(sf===0||sf===2){regen=b0>>3;p+=1}else if(sf===1){regen=(b0>>4)|(u8[p+1]<<4);p+=2}else{regen=(b0>>4)|(u8[p+1]<<4)|(u8[p+2]<<12);p+=3}
    if(lt===0){lit=u8.subarray(p,p+regen);p+=regen}else{lit=new Uint8Array(regen).fill(u8[p]);p+=1}}
   else{
    let comp;
    if(sf<2){const v=b0|u8[p+1]<<8|u8[p+2]<<16;regen=(v>>4)&1023;comp=(v>>14)&1023;p+=3}
    else{const v=(b0|u8[p+1]<<8|u8[p+2]<<16|u8[p+3]<<24)>>>0;
     if(sf===2){regen=(v>>>4)&16383;comp=(v>>>18)&16383;p+=4}else{regen=(v>>>4)&262143;comp=((v>>>22)|(u8[p+4]<<10))&262143;p+=5}}
    const lend=p+comp;if(lend>e)throw E('literal bo‘limi blokdan chiqib ketdi');
    if(lt===2)p=readTree(p);else if(!huf)throw E('Huffman daraxti yo‘q (treeless)');
    lit=new Uint8Array(regen);
    if(sf===0)hStream(p,lend,lit,0,regen);
    else{
     const a=u8[p]|u8[p+1]<<8,b=u8[p+2]|u8[p+3]<<8,c=u8[p+4]|u8[p+5]<<8,q=p+6,seg=(regen+3)>>2;
     hStream(q,q+a,lit,0,seg);hStream(q+a,q+a+b,lit,seg,seg);hStream(q+a+b,q+a+b+c,lit,seg*2,seg);hStream(q+a+b+c,lend,lit,seg*3,regen-seg*3)}
    p=lend}
   /* ketma-ketliklar */
   let ns=u8[p++];
   if(ns>=128){if(ns===255){ns=u8[p]+(u8[p+1]<<8)+0x7F00;p+=2}else ns=((ns-128)<<8)+u8[p++]}
   if(ns===0){need(lit.length);out.set(lit,op);op+=lit.length;return}
   const md=u8[p++];
   const tbl=(m,prev,def,mx)=>{if(m===0)return def;if(m===1)return rle(u8[p++]);if(m===2){const r=readFSE(p,mx);p=r.end;return r.t}if(!prev)throw E('takrorlanadigan jadval yo‘q');return prev};
   fLL=tbl(md>>6,fLL,PLL,9);fOF=tbl((md>>4)&3,fOF,POF,8);fML=tbl((md>>2)&3,fML,PML,9);
   const last=u8[e-1];if(!last)throw E('ketma-ketlik oqimi buzuq');
   let bp=(e-1-p)*8+(31-Math.clz32(last));const base=p*8;
   const rb=n=>{if(n===0)return 0;if(n>24){const h=rb(n-16);return h*65536+rb(16)}bp-=n;if(bp<0){const r=bp+n>0?at(base,bp+n)<<-bp:0;return r}return at(base+bp,n)};
   let sL=rb(fLL.al),sO=rb(fOF.al),sM=rb(fML.al),lp=0;
   for(let i=0;i<ns;i++){
    const cL=fLL.sym[sL],cO=fOF.sym[sO],cM=fML.sym[sM];
    const ov=Math.pow(2,cO)+rb(cO),ml=MLB[cM]+rb(MLX[cM]),ll=LLB[cL]+rb(LLX[cL]);
    if(i<ns-1){sL=fLL.base[sL]+rb(fLL.nb[sL]);sM=fML.base[sM]+rb(fML.nb[sM]);sO=fOF.base[sO]+rb(fOF.nb[sO])}
    let off;
    if(ov>3){off=ov-3;rep[2]=rep[1];rep[1]=rep[0];rep[0]=off}
    else{
     const ix=ll===0?ov:ov-1;/* 0..3 */
     if(ix===0)off=rep[0];
     else if(ix===1){off=rep[1];rep[1]=rep[0];rep[0]=off}
     else if(ix===2){off=rep[2];rep[2]=rep[1];rep[1]=rep[0];rep[0]=off}
     else{off=rep[0]-1;rep[2]=rep[1];rep[1]=rep[0];rep[0]=off}}
    if(lp+ll>lit.length)throw E('literallar yetishmadi');
    need(ll+ml);
    if(ll<16){for(let j=0;j<ll;j++)out[op++]=lit[lp++]}else{out.set(lit.subarray(lp,lp+ll),op);op+=ll;lp+=ll}
    const f=op-off;if(off<=0||f<fs)throw E('noto‘g‘ri siljish (offset)');
    if(ml>=32&&off>=ml){out.copyWithin(op,f,f+ml);op+=ml}else{for(let j=0;j<ml;j++){out[op]=out[op-off];op++}}}
   const rest=lit.length-lp;need(rest);
   if(rest<16){for(let j=0;j<rest;j++)out[op++]=lit[lp++]}else{out.set(lit.subarray(lp),op);op+=rest}}
  while(ip+4<=u8.length){
   const mg=(u8[ip]|u8[ip+1]<<8|u8[ip+2]<<16|u8[ip+3]<<24)>>>0;
   if((mg&0xFFFFFFF0)>>>0===0x184D2A50){ip+=8+((u8[ip+4]|u8[ip+5]<<8|u8[ip+6]<<16|u8[ip+7]<<24)>>>0);continue}
   if(mg!==0xFD2FB528)throw E('noto‘g‘ri sarlavha (zstd emas)');
   ip+=4;const fd=u8[ip++],fcs=fd>>6,single=(fd>>5)&1,ck=(fd>>2)&1,did=fd&3;
   if(!single)ip++;
   if(did)throw E('lug‘at (dictionary) qo‘llanmaydi');
   if(fcs===0){if(single){need(u8[ip]);ip+=1}}
   else if(fcs===1){need(u8[ip]+(u8[ip+1]<<8)+256);ip+=2}
   else if(fcs===2){const n=(u8[ip]|u8[ip+1]<<8|u8[ip+2]<<16|u8[ip+3]<<24)>>>0;if(n<2e9)need(n);ip+=4}
   else ip+=8;
   huf=fLL=fOF=fML=null;rep=[1,4,8];fs=op;
   let lastB=0;
   while(!lastB){
    if(ip+3>u8.length)throw E('kutilmagan oqim oxiri');
    const h=u8[ip]|u8[ip+1]<<8|u8[ip+2]<<16;ip+=3;lastB=h&1;const ty=(h>>1)&3,sz=h>>>3;
    if(ip+(ty===1?1:sz)>u8.length)throw E('blok oqim chegarasidan chiqdi');
    if(ty===0){need(sz);out.set(u8.subarray(ip,ip+sz),op);op+=sz;ip+=sz}
    else if(ty===1){need(sz);out.fill(u8[ip],op,op+sz);op+=sz;ip+=1}
    else if(ty===2){block(ip,ip+sz);ip+=sz}
    else throw E('zaxiralangan blok turi')}
   if(ck)ip+=4}
  return out.subarray(0,op)}
})();
