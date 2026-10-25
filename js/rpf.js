/* ---- RPF7 (GTA V arxivi, shifrsiz “OPEN”) ---- */
async function rpfRead(f){
 const rd=async(a,n)=>new DataView(await f.slice(a,a+n).arrayBuffer()),h=await rd(0,16);
 if(h.getUint32(0,true)!=0x52504637)throw Error('Bu RPF7 emas (GTA V arxivi kerak)');
 const n=h.getUint32(4,true),nl=h.getUint32(8,true),enc=h.getUint32(12,true);
 if(enc!=0x4E45504F&&enc!=0)throw Error('Bu RPF shifrlangan (AES/NG). Faqat shifrsiz “OPEN” arxivlar (OpenIV mod) ochiladi');
 const E=await rd(16,n*16),N=new Uint8Array((await rd(16+n*16,nl)).buffer),L=[];
 const nm=o=>{let s='';while(N[o])s+=String.fromCharCode(N[o++]);return s};
 const b3=p=>E.getUint8(p)|E.getUint8(p+1)<<8|E.getUint8(p+2)<<16;
 const walk=(i,pre,dep)=>{if(i>=n||dep>32)return;const p=i*16,name=nm(E.getUint16(p,true));
  if(E.getUint32(p+4,true)==0x7FFFFF00){const a=E.getUint32(p+8,true),c=E.getUint32(p+12,true);for(let k=0;k<c;k++)walk(a+k,i?pre+name+'/':pre,dep+1)}
  else{const o=b3(p+5);L.push({path:pre+name,sz:b3(p+2),off:(o&0x7FFFFF)*512,res:!!(o&0x800000),a:E.getUint32(p+8,true),b:E.getUint32(p+12,true)})}};
 walk(0,'',0);
 const get=async e=>{
  if(e.res){if(e.sz==0xFFFFFF)throw Error('Juda katta resurs qo’llanmaydi');
   if(new DataView(await f.slice(e.off,e.off+4).arrayBuffer()).getUint32(0,true)==0x37435352)return f.slice(e.off,e.off+e.sz);
   const hd=new Uint8Array(new Uint32Array([0x37435352,(e.a>>>28&15)<<4|(e.b>>>28&15),e.a,e.b]).buffer);
   return new Blob([hd,f.slice(e.off,e.off+e.sz)])}
  if(e.b)throw Error('Bu fayl shifrlangan');
  const raw=f.slice(e.off,e.off+(e.sz||e.a));if(!e.sz)return raw;
  return new Blob([await rawInflate(raw)])};
 return{L,get}}
function pairYtd(L,p){const base=p.replace(/\.(yft|ydr)$/i,''),lc=s=>s.toLowerCase();for(const k of[base+'.ytd',base.replace(/_hi$/i,'')+'.ytd']){const e=L.find(x=>lc(x.path)==lc(k));if(e)return e}return null}
async function rpf(f){const{L,get}=await rpfRead(f);
 let d=$('#rp');
 if(!d){d=document.createElement('dialog');d.id='rp';d.innerHTML='<div class="ph"><b id="rt"></b><input id="rq" placeholder="Qidirish…"><button id="rc">Yopish</button></div><div id="rl"></div>';document.body.append(d);$('#rc').onclick=()=>d.close()}
 $('#rt').textContent=f.name+' · '+L.length+' fayl';$('#rq').value='';
 const mk=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.onclick=fn;return b};
 const draw=()=>{const q=$('#rq').value.toLowerCase(),l=$('#rl');l.textContent='';
  L.filter(e=>e.path.toLowerCase().includes(q)).slice(0,300).forEach(e=>{
   const r=document.createElement('div'),s=document.createElement('span'),fn=e.path.split('/').pop();
   s.textContent=e.path+' · '+Math.round((e.res?e.sz:(e.sz||e.a))/1024)+' KB';r.append(s);
   r.append(mk('Yuklab olish',async()=>{try{saveBlob(await get(e),fn)}catch(x){toast(x.message)}}));
   if(/\.(glb|gltf|obj|stl|ply|dff|txd|yft|ytd|ydr)$/i.test(fn))r.append(mk('Ochish',async()=>{try{const b=await get(e);d.close();const y=/\.(yft|ydr)$/i.test(fn)?pairYtd(L,e.path):null;if(y)try{await ytd(await get(y))}catch(z){toast('YTD: '+z.message)}await load(new File([b],fn))}catch(x){toast(x.message)}}));
   if(/\.rpf$/i.test(fn))r.append(mk('Ichini ochish',async()=>{try{await rpf(new File([await get(e)],fn))}catch(x){toast(x.message)}}));
   l.append(r)});
  if(L.length>300&&!q)l.append(Object.assign(document.createElement('small'),{textContent:'Dastlabki 300 tasi ko’rsatildi — qidiruvdan foydalaning.'}))};
 $('#rq').oninput=draw;draw();d.open||d.showModal();
}
