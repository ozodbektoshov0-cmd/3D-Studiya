/* ---- 3ds Max (.max) import: OLE2 konteyner → Scene/ClassDirectory3 → Editable Mesh/Poly, transform, ierarxiya, material ----
   Yopiq format bo'lgani uchun faqat ko'rinadigan tuzilma o'qiladi (4 ta haqiqiy fayl asosida):
   Editable Mesh va Editable Poly, PRS transform, pivot, ota-bola bog'lanish, instance, UV, smoothing group,
   Multi/Sub material (nom, diffuse rang, tekstura fayl nomi). Parametrik obyektlar (Box, Sphere…) va modifikatorlar o'qilmaydi. */
function maxImp(buf){
 const u8=new Uint8Array(buf);
 /* ---------- OLE2 (Compound File) ---------- */
 const D=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
 if(u8.length<512||D.getUint32(0,true)!=0xE011CFD0||D.getUint32(4,true)!=0xE11AB1A1)throw Error('MAX fayli emas (OLE2 sarlavha topilmadi)');
 const ss=1<<D.getUint16(30,true),mss=1<<D.getUint16(32,true),nfat=D.getUint32(44,true),dirStart=D.getUint32(48,true),cut=D.getUint32(56,true),mfStart=D.getUint32(60,true),difStart=D.getUint32(68,true),ndif=D.getUint32(72,true),END=0xFFFFFFF0;
 const sec=n=>(n+1)*ss;
 const difat=[];for(let i=0;i<109;i++)difat.push(D.getUint32(76+i*4,true));
 for(let ds=difStart,k=0;k<ndif&&ds<END;k++){const o=sec(ds),m=ss/4;for(let i=0;i<m-1;i++)difat.push(D.getUint32(o+i*4,true));ds=D.getUint32(o+(m-1)*4,true)}
 const fat=[];for(let i=0;i<nfat;i++){const o=sec(difat[i]);for(let j=0;j<ss/4;j++)fat.push(D.getUint32(o+j*4,true))}
 const chain=(st,size)=>{const idx=[];let x=st;while(x<END&&idx.length<1e7){idx.push(x);x=fat[x]}
  const out=new Uint8Array(idx.length*ss);idx.forEach((s,i)=>{const o=sec(s);out.set(u8.subarray(o,o+ss),i*ss)});return size!=null?out.subarray(0,size):out};
 const dirb=chain(dirStart),DD=new DataView(dirb.buffer,dirb.byteOffset,dirb.byteLength),ents=[];
 for(let i=0;i<dirb.length/128;i++){const o=i*128,nl=DD.getUint16(o+64,true);let nm='';for(let j=0;j<Math.max(nl-2,0);j+=2)nm+=String.fromCharCode(DD.getUint16(o+j,true));
  ents.push({name:nm,type:dirb[o+66],start:DD.getUint32(o+116,true),size:DD.getUint32(o+120,true)+DD.getUint32(o+124,true)*4294967296})}
 let mfat=[],mini=new Uint8Array(0);
 if(mfStart<END){const mf=chain(mfStart),M=new DataView(mf.buffer,mf.byteOffset,mf.byteLength);for(let i=0;i<mf.length/4;i++)mfat.push(M.getUint32(i*4,true))}
 if(ents[0]&&ents[0].start<END)mini=chain(ents[0].start,ents[0].size);
 const stream=nm=>{const e=ents.find(x=>x.type==2&&x.name==nm);if(!e)return null;
  if(e.size<cut){const idx=[];let x=e.start;while(x<END&&idx.length<1e6){idx.push(x);x=mfat[x]}const out=new Uint8Array(idx.length*mss);idx.forEach((s,i)=>out.set(mini.subarray(s*mss,s*mss+mss),i*mss));return out.subarray(0,e.size)}
  return chain(e.start,e.size)};
 const SC=stream('Scene'),CD=stream('ClassDirectory3'),FA=stream('FileAssetMetaData2');
 /* yangi Max: tekstura fayllari alohida ro'yxatda (GUID → yo'l) */
 const assets=new Map();
 if(FA&&FA.length>24){try{const d=new DataView(FA.buffer,FA.byteOffset,FA.byteLength),str=(o,n)=>{let t='';for(let j=0;j<n;j++)t+=String.fromCharCode(d.getUint16(o+j*2,true));return t};
  let p=0;while(p+24<=FA.length){let g='';for(let j=0;j<16;j++)g+=(FA[p+j]+256).toString(16).slice(1);p+=16;
   const n1=d.getUint32(p,true);p+=4;p+=n1*2+2;const n2=d.getUint32(p,true);p+=4;if(n2>1000||p+n2*2>FA.length)break;const path=str(p,n2);p+=n2*2+2;assets.set(g,path)}}catch(e){}}
 if(!SC||!CD)throw Error('MAX ichida Scene/ClassDirectory3 topilmadi (qo’llanmaydigan versiya)');
 /* ---------- chunk daraxti ---------- */
 const mk=a=>({u8:a,dv:new DataView(a.buffer,a.byteOffset,a.byteLength)});
 const S=mk(SC),C=mk(CD);
 const chunks=(P,start,end)=>{const out=[],dv=P.dv;let o=start;
  while(o+6<=end){const id=dv.getUint16(o,true);let ln=dv.getUint32(o+2,true),hdr=6,cont;
   if(ln===0){if(o+14>end)break;const lo=dv.getUint32(o+6,true),hi=dv.getUint32(o+10,true);cont=!!(hi>>>31);ln=lo+(hi&0x7fffffff)*4294967296;hdr=14}
   else{cont=!!(ln>>>31);ln=ln&0x7fffffff}
   if(ln<hdr||o+ln>end)break;out.push({id,off:o,hdr,len:ln,cont});o+=ln}return out};
 const kids=(P,c)=>{if(!c.cont)return[];return c._k||(c._k=chunks(P,c.off+c.hdr,c.off+c.len))};
 const cl=[];
 for(const n of chunks(C,0,CD.length)){let nm='';for(const k of kids(C,n)){if(k.id==0x2042){for(let j=k.off+k.hdr;j+1<k.off+k.len;j+=2)nm+=String.fromCharCode(C.dv.getUint16(j,true))}}cl.push(nm)}
 const rootC=chunks(S,0,SC.length)[0];if(!rootC)throw Error('MAX Scene oqimi buzuq');
 const top=kids(S,rootC);
 const cname=i=>{const c=top[i];return c&&c.id<cl.length?cl[c.id]:''};
 /* ---------- yordamchilar ---------- */
 const kid=(P,c,id)=>{for(const k of kids(P,c))if(k.id==id)return k;return null};
 const tk=(i,id)=>{const c=top[i];return c?kid(S,c,id):null};
 const u32=(k,o)=>S.dv.getUint32(k.off+k.hdr+(o||0),true),f32=(k,o)=>S.dv.getFloat32(k.off+k.hdr+(o||0),true),blen=k=>k.len-k.hdr;
 const utf16=k=>{let s='';for(let j=k.off+k.hdr;j+1<k.off+k.len;j+=2){const c=S.dv.getUint16(j,true);if(c)s+=String.fromCharCode(c)}return s};
 const refs=i=>{const r={},k=tk(i,0x2035);if(k)for(let j=0;j<(blen(k)-4)/8;j++)r[u32(k,4+j*8)]=u32(k,8+j*8);return r};
 const refl=i=>{const k=tk(i,0x2034),r=[];if(k)for(let j=0;j<blen(k)/4;j++)r.push(u32(k,j*4));return r};
 const sub=(i,id)=>{let k=tk(i,id);if(k)return{P:S,k};const w=tk(i,0x7127);
  if(w){const P2={dv:new DataView(S.u8.buffer,S.u8.byteOffset+w.off+w.hdr,blen(w))};const n=chunks(P2,0,blen(w)).find(x=>x.id==id);if(n)return{P:P2,k:n}}return null};
 const fval=i=>{const s=sub(i,0x2501);return s?s.P.dv.getFloat32(s.k.off+s.k.hdr,true):0};
 const valid=i=>i<top.length;
 /* ---------- transform ---------- */
 const M4=THREE.Matrix4;
 const rotM=(a,b,c)=>{const m=new M4(),x=new M4().makeRotationX(a),y=new M4().makeRotationY(b),z=new M4().makeRotationZ(c);return m.multiplyMatrices(z,y).multiply(x)}; /* Max Euler XYZ = Rz·Ry·Rx (ustun-vektor) */
 const nodeTM=ni=>{const r=refs(ni),prs=r[0];let pos=[0,0,0],rot=[0,0,0],sc=[1,1,1];
  if(prs!==undefined&&valid(prs)&&cname(prs)=='Position/Rotation/Scale'){const [p,ro,sa]=refl(prs);
   if(valid(p)&&cname(p)=='Position XYZ')pos=refl(p).slice(0,3).map(fval);
   if(valid(ro)&&cname(ro)=='Euler XYZ')rot=refl(ro).slice(0,3).map(fval);
   if(valid(sa)&&cname(sa)=='Bezier Scale'){const s=sub(sa,0x2505);if(s)sc=[0,1,2].map(j=>s.P.dv.getFloat32(s.k.off+s.k.hdr+j*4,true))}}
  const m=rotM(rot[0],rot[1],rot[2]);m.scale(new THREE.Vector3(sc[0],sc[1],sc[2]));m.setPosition(pos[0],pos[1],pos[2]);return m};
 const offTM=ni=>{const p=tk(ni,0x96A),q=tk(ni,0x96B),s=tk(ni,0x96C),m=new M4();
  if(q&&blen(q)>=16){const qq=new THREE.Quaternion(f32(q,0),f32(q,4),f32(q,8),f32(q,12));if(Math.abs(qq.x)+Math.abs(qq.y)+Math.abs(qq.z)>1e-7)m.makeRotationFromQuaternion(qq.normalize())}
  if(s&&blen(s)>=12)m.scale(new THREE.Vector3(f32(s,0),f32(s,4),f32(s,8)));
  if(p&&blen(p)>=12)m.setPosition(f32(p,0),f32(p,4),f32(p,8));return m};
 const isId=m=>{const e=m.elements;for(let i=0;i<16;i++)if(Math.abs(e[i]-((i%5)?0:1))>1e-9)return false;return true};
 /* ---------- geometriya ---------- */
 const baseObj=oi=>{const c=cname(oi);if(c=='Editable Mesh'||c=='Editable Poly')return oi;
  if(c=='Derived Object'){for(const r of refl(oi))if(valid(r)&&/^Editable (Mesh|Poly)$/.test(cname(r)))return r}return null};
 function readMesh(oi){
  const m=tk(oi,0x8FE);if(!m)return null;const g={};for(const k of kids(S,m))if(!(k.id in g)||k.id==0x2394||k.id==0x2396)g[k.id]=g[k.id]||k;
  const T=[]; /* uchburchaklar: a,b,c,smg,mat */
  let V,uvV=null,uvF=null,poly=cname(oi)=='Editable Poly';
  if(!poly){
   const v=g[0x914],f=g[0x912];if(!v||!f)return null;const nv=u32(v,0),nf=u32(f,0);V=new Float32Array(nv*3);
   for(let i=0;i<nv*3;i++)V[i]=f32(v,4+i*4);
   for(let i=0;i<nf;i++){const o=4+i*20;T.push(u32(f,o),u32(f,o+4),u32(f,o+8),u32(f,o+12),u32(f,o+16)>>>16)}
   /* UV: 2398 = kanal raqami, undan keyin 2394 (uvw) va 2396 (yuz) */
   let ch=-1;const maps={};for(const k of kids(S,m)){if(k.id==0x2398)ch=u32(k,0);else if(k.id==0x2394&&ch>=0)(maps[ch]=maps[ch]||{}).v=k;else if(k.id==0x2396&&ch>=0)(maps[ch]=maps[ch]||{}).f=k}
   const use=maps[1]&&maps[1].v&&maps[1].f?maps[1]:Object.keys(maps).filter(x=>+x>0).map(x=>maps[x]).find(x=>x.v&&x.f);
   if(use){const nu=u32(use.v,0),nt=u32(use.f,0);uvV=new Float32Array(nu*2);for(let i=0;i<nu;i++){uvV[i*2]=f32(use.v,4+i*12);uvV[i*2+1]=f32(use.v,8+i*12)}
    uvF=new Uint32Array(nt*3);for(let i=0;i<nt*3;i++)uvF[i]=u32(use.f,4+i*4);if(nt<nf)uvF=null}
  }else{
   const v=g[0x100],f=g[0x11A];if(!v||!f)return null;const nv=u32(v,0);V=new Float32Array(nv*3);
   for(let i=0;i<nv;i++)for(let j=0;j<3;j++)V[i*3+j]=f32(v,8+i*16+j*4);
   const nf=u32(f,0),fr=[];let o=4;
   for(let i=0;i<nf;i++){if(o+4>blen(f))return null;const d=u32(f,o);if(d<3||d>256)return null;const sz=12*d-10;if(o+sz>blen(f))return null;
    const vs=[];for(let j=0;j<d;j++)vs.push(u32(f,o+4+j*4));fr.push({vs,smg:S.dv.getUint16(f.off+f.hdr+o+4+4*d+6,true)});o+=sz}
   if(o!=blen(f))return null;
   /* UV (kanal 1): 0x128 uvw, 0x12B yuzlar [deg, idx...] */
   const uv=g[0x128],uf=g[0x12B];let uvFaces=null;
   if(uv&&uf){const nu=u32(uv,0);uvV=new Float32Array(nu*2);for(let i=0;i<nu;i++){uvV[i*2]=f32(uv,4+i*12);uvV[i*2+1]=f32(uv,8+i*12)}
    uvFaces=[];let p=0;for(let i=0;i<nf&&p+4<=blen(uf);i++){const d=u32(uf,p);if(d!=fr[i].vs.length){uvFaces=null;break}const a=[];for(let j=0;j<d;j++)a.push(u32(uf,p+4+j*4));uvFaces.push(a);p+=4+d*4}
    if(uvFaces&&uvFaces.length!=nf)uvFaces=null}
   const uA=[];
   fr.forEach((q,i)=>{for(let j=1;j+1<q.vs.length;j++){T.push(q.vs[0],q.vs[j],q.vs[j+1],q.smg,0);
     if(uvFaces)uA.push(uvFaces[i][0],uvFaces[i][j],uvFaces[i][j+1])}});
   if(uvFaces)uvF=Uint32Array.from(uA);else uvV=null;
  }
  return{V,T,uvV,uvF};
 }
 /* Smoothing group asosida normal + (vertex,uv,normal) bo'yicha indekslangan BufferGeometry */
 function buildGeom(md,off){
  const {V,T,uvV,uvF}=md,nf=T.length/5,nv=V.length/3;let P=V;
  if(off){P=new Float32Array(V.length);const v=new THREE.Vector3();for(let i=0;i<nv;i++){v.set(V[i*3],V[i*3+1],V[i*3+2]).applyMatrix4(off);P[i*3]=v.x;P[i*3+1]=v.y;P[i*3+2]=v.z}}
  const fn=new Float32Array(nf*3);
  for(let f=0;f<nf;f++){const a=T[f*5]*3,b=T[f*5+1]*3,c=T[f*5+2]*3;if(a>=P.length||b>=P.length||c>=P.length)return null;
   const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
   fn[f*3]=uy*vz-uz*vy;fn[f*3+1]=uz*vx-ux*vz;fn[f*3+2]=ux*vy-uy*vx}
  const cnt=new Uint32Array(nv+1);for(let f=0;f<nf;f++)for(let j=0;j<3;j++)cnt[T[f*5+j]+1]++;
  for(let i=0;i<nv;i++)cnt[i+1]+=cnt[i];const pos=cnt.slice(0,nv),inc=new Uint32Array(nf*3);
  for(let f=0;f<nf;f++)for(let j=0;j<3;j++)inc[pos[T[f*5+j]]++]=f;
  const mp=new Map(),opos=[],onor=[],ouv=[],idx=[],mats=[];const hasUV=!!(uvV&&uvF);
  const cache=new Map();
  for(let f=0;f<nf;f++){const sg=T[f*5+3];
   for(let j=0;j<3;j++){const v=T[f*5+j],t=hasUV?uvF[f*3+j]:0,key=v+'|'+t+'|'+(sg?sg:'f'+f);let id=mp.get(key);
    if(id===undefined){let nx,ny,nz;
     if(sg){const ck=v+'|'+sg;let nn=cache.get(ck);if(!nn){nx=ny=nz=0;for(let q=cnt[v];q<cnt[v+1];q++){const g=inc[q];if(T[g*5+3]&sg){nx+=fn[g*3];ny+=fn[g*3+1];nz+=fn[g*3+2]}}nn=[nx,ny,nz];cache.set(ck,nn)}[nx,ny,nz]=nn}
     else{nx=fn[f*3];ny=fn[f*3+1];nz=fn[f*3+2]}
     const l=Math.hypot(nx,ny,nz)||1;id=opos.length/3;mp.set(key,id);
     opos.push(P[v*3],P[v*3+1],P[v*3+2]);onor.push(nx/l,ny/l,nz/l);
     if(hasUV){const u=t*2<uvV.length?uvV[t*2]:0,w=t*2<uvV.length?uvV[t*2+1]:0;ouv.push(u,w)}}
    idx.push(id)}
   mats.push(T[f*5+4])}
  /* material guruhlari: yuzlarni material bo'yicha tartiblash */
  const ids=[...new Set(mats)].sort((a,b)=>a-b),order=[],groups=[];let st=0;
  for(const m of ids){let c=0;for(let f=0;f<nf;f++)if(mats[f]==m){order.push(idx[f*3],idx[f*3+1],idx[f*3+2]);c++}groups.push({start:st*3,count:c*3,id:m});st+=c}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(opos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(onor,3));
  if(hasUV)g.setAttribute('uv',new THREE.Float32BufferAttribute(ouv,2));
  g.setIndex(opos.length/3>65535?new THREE.Uint32BufferAttribute(order,1):new THREE.Uint16BufferAttribute(order,1));
  return{g,groups};
 }
 /* ---------- material ---------- */
 const IMG=/[^\\\/:*?"<>|\u0000-\u001f]+\.(?:jpe?g|png|tga|bmp|tiff?|dds|gif|exr|hdr|webp)/gi;
 function texFile(i){ /* Bitmap obyekti ichidan fayl nomi */
  if(assets.size){const lst=[i].concat(refl(i));for(const r of lst){if(!valid(r))continue;for(const k of kids(S,top[r])){if(k.id==0x0F&&blen(k)==22){let g='';for(let j=0;j<16;j++)g+=(S.u8[k.off+k.hdr+6+j]+256).toString(16).slice(1);const a=assets.get(g);if(a)return a.split(/[\\\/]/).pop()}}}}
  const seen=new Set(),q=[i];let n=0;
  while(q.length&&n++<60){const x=q.shift();if(seen.has(x)||!valid(x))continue;seen.add(x);
   const c=top[x];
   const scan=(k)=>{const a=S.u8.subarray(k.off+k.hdr,k.off+k.len);if(a.length<8)return null;
    for(let al=0;al<2;al++){const b=a.subarray(al,al+((a.length-al)&~1));const s=new TextDecoder('utf-16le').decode(b);const m=s.match(IMG);if(m)return m[0]}return null};
   const walk=k=>{if(k.cont){for(const kk of kids(S,k)){const r=walk(kk);if(r)return r}return null}return scan(k)};
   for(const k of kids(S,c)){const r=walk(k);if(r)return r}
   if(cname(x)!='Bitmap'&&n>1)continue;
   for(const r of refl(x))if(valid(r)&&r<top.length)q.push(r)}
  return null};
 const noext=s=>s.replace(/\.[^.]+$/,'');
 function findBitmap(i,depth,seen){ /* i dan boshlab birinchi 'Bitmap' */
  if(!valid(i)||seen.has(i)||depth>7)return -1;seen.add(i);
  if(cname(i)=='Bitmap')return i;
  const lst=refl(i).concat(Object.values(refs(i)));
  for(const r of lst){const b=findBitmap(r,depth+1,seen);if(b>=0)return b}return -1}
 const matCache=new Map();
 function mkMat(mi){
  if(matCache.has(mi))return matCache.get(mi);
  const c=cname(mi),nk=tk(mi,0x4000);let name='';
  if(nk){const k=kid(S,nk,0x4001);if(k)name=utf16(k)}
  const mat=new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2,roughness:.7,metalness:0});mat.name=name||c||'Material';
  try{
   if(c=='Standard'){
    for(const r of refl(mi)){if(!valid(r))continue;const sh=cname(r);
     if(/^(Blinn|Phong|Metal|Anisotropic|Multi-Layer|Oren-Nayar-Blinn|Strauss|Translucent Shader)$/.test(sh)){
      const pb=refl(r)[0];if(valid(pb)&&cname(pb)=='ParamBlock2'){for(const e of kids(S,top[pb])){if(e.id!=0x0E||blen(e)<27)continue;
        if(S.dv.getUint16(e.off+e.hdr,true)==1&&u32(e,2)==2){const o=e.off+e.hdr+blen(e)-12;mat.color.setRGB(S.dv.getFloat32(o,true),S.dv.getFloat32(o+4,true),S.dv.getFloat32(o+8,true));break}}}}
     if(sh=='Texmaps'){const rr=refs(r);if(rr[3]!==undefined&&valid(rr[3])&&cname(rr[3])=='Bitmap'){const f=texFile(rr[3]);if(f)mat.userData.tex=noext(f)}}}
   }else{const b=findBitmap(mi,0,new Set());if(b>=0){const f=texFile(b);if(f)mat.userData.tex=noext(f)}}
  }catch(e){}
  matCache.set(mi,mat);return mat};
 const subMats=mi=>{ /* [materiallar], Multi/Sub bo'lmasa bitta */
  if(mi===undefined||!valid(mi))return[mkMat0()];
  if(cname(mi)=='Multi/Sub-Object'){const a=refl(mi).filter(r=>valid(r)&&cname(r)!='ParamBlock2'&&cname(r)!='ParamBlock').map(mkMat);return a.length?a:[mkMat0()]}
  return[mkMat(mi)]};
 let m0=null;const mkMat0=()=>m0||(m0=new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2,roughness:.7,metalness:0}));
 /* ---------- sahna ---------- */
 const nodes=[];for(let i=0;i<top.length;i++)if(cname(i)=='Node'){
  const nk=tk(i,0x962),pk=tk(i,0x960),r=refs(i),par=pk?u32(pk,0):-1;
  nodes.push({i,name:nk?utf16(nk):'node'+i,parent:valid(par)&&cname(par)=='Node'?par:null,obj:r[1],mat:r[3],tm:nodeTM(i)})}
 if(!nodes.length)throw Error('MAX ichida obyektlar (Node) topilmadi');
 const ZY=new M4().makeRotationX(-Math.PI/2); /* Max Z-up → sayt Y-up */
 const out=new THREE.Group(),byI=new Map(),geomCache=new Map(),bad={};let nm=0,skipped=0,total=0;
 for(const n of nodes){
  let o=null;const oi=n.obj;let base=oi!==undefined&&valid(oi)?baseObj(oi):null;
  if(base!==null){
   const off=offTM(n.i),offK=isId(off)?'':off.elements.join(',');const key=base+'|'+offK;
   let G=geomCache.get(key);
   if(G===undefined){const md=readMesh(base);G=md?buildGeom(md,offK?off:null):null;geomCache.set(key,G||null)}
   if(G){const mats=subMats(n.mat),ns=mats.length,arr=[];
    const geo=G.g.clone();geo.clearGroups();
    const slot=new Map();G.groups.forEach(gr=>{const k=gr.id%ns;if(!slot.has(k))slot.set(k,arr.length),arr.push(mats[k])});
    /* guruhlarni qayta yig'ish (bir xil slotga tushganlar alohida guruh bo'lib qolaveradi) */
    G.groups.forEach(gr=>geo.addGroup(gr.start,gr.count,slot.get(gr.id%ns)));
    o=new THREE.Mesh(geo,arr.length==1?arr[0]:arr);nm++;total+=G.g.index.count/3}
   else skipped++
  }else{const c=oi!==undefined&&valid(oi)?cname(oi):'(yo‘q)';if(c!='Dummy'&&c!='(yo‘q)')bad[c]=(bad[c]||0)+1;
   o=c=='Dummy'?mkDummy(n.name):new THREE.Group()}
  if(!o)o=new THREE.Group();
  o.name=n.name;o.matrixAutoUpdate=true;
  const L=n.parent===null?new M4().multiplyMatrices(ZY,n.tm):n.tm.clone();
  L.decompose(o.position,o.quaternion,o.scale);byI.set(n.i,o)}
 for(const n of nodes){const o=byI.get(n.i),p=n.parent!==null?byI.get(n.parent):null;(p||out).add(o)}
 if(!nm)throw Error('MAX ichida o’qiladigan mesh topilmadi (faqat Editable Mesh/Poly qo’llanadi; boshqa turlar: '+Object.entries(bad).map(([k,v])=>k+'×'+v).join(', ')+')');
 const info=[];const bs=Object.entries(bad);
 if(bs.length)info.push('o’qilmadi: '+bs.map(([k,v])=>k+'×'+v).join(', '));
 if(skipped)info.push(skipped+' ta mesh buzuq');
 maxImp.info=info;maxImp.tris=total;
 return out;
}
