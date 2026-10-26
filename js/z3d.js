/* ---- ZModeler 3 (.z3d) import va eksport ----
   Fayl: "Z3DM" + u32 versiya (0x3103) + u32 ma'lumot uzunligi + zlib oqimi. Ichi: [u32 id][u32 hajm][ma'lumot] chunklar (ichma-ich emas, tekis).
   0x150 yo'l · 0x160 sahna materiali · 0x161 material · 0x101 sozlama · 0x110 mesh · 0x8020 obyektlar ro'yxati (oxirida).
   Mesh (0x110): u32 0x102, u32 nomUzunligi (NUL bilan), nom, u32 0, so'ng ichki chunklar:
     0x121 {u32 vertexSoni,…}  0x122 vertexlar (28 bayt: pos 3f, normal 3f, u32 0) — DUNYO koordinatasida, Y-up
     0x131 {u32 yuzaSoni, u32 0x1000, … , u32 materialIndeksi (28-bayt)} (84 bayt)
     0x132 yuzalar: [a b c] (u8 yoki u16, vertex soniga qarab) + u32 bayroq + 6×f32 (u0 u1 u2 v0 v1 v2) — burchak bo'yicha UV
     0x114 4×4 matritsa (pivot; oxirgi qator = pivot joyi)
   Yuzalar soat mili yo'nalishida (normalga nisbatan) — Three.js uchun (a,c,b) qilib olinadi.
   Material (0x161): u32 0x102, nom, so'ng 4f ambient, 4f diffuse, 4f specular, 4f emissive, f shininess, 4×i32 tekstura(-1 = yo'q), …
   Tekstura chunklari namunada bo'lmagan, shuning uchun teksturalar o'qilmaydi (rang va material nomi saqlanadi). */
(function(){
const FLIPV=true; /* ZModeler (DirectX) UV: v yuqoridan — Three.js uchun 1-v */
const dec=new TextDecoder('utf-8'),enc=new TextEncoder();
const hex=s=>Uint8Array.from(s.match(/../g).map(h=>parseInt(h,16)));
const T160=hex('05000000030000000000803f0000803f0000803f0000803f0000000000000000000000000000803f0000803f0000803f0000803f0000803f0000000000000000000000000000803f00008c42ffffffffffffffffffffffffffffffff0000003f010000000100000001000000010000000200000001000000005004000000000000000000');
const T101=hex('80000000010000000000000000000000000000000000000000000000');

/* ================= IMPORT ================= */
window.z3dImp=function(buf){
 const u=buf instanceof Uint8Array?buf:new Uint8Array(buf);
 if(u.length<16||String.fromCharCode(u[0],u[1],u[2],u[3])!='Z3DM')throw Error('Bu Z3D (ZModeler 3) fayli emas');
 if(typeof fflate=='undefined')throw Error('Z3D: fflate kutubxonasi yuklanmagan');
 const hv=new DataView(u.buffer,u.byteOffset,u.byteLength),declared=hv.getUint32(8,true);
 let d;try{d=fflate.unzlibSync(u.subarray(12))}catch(e){throw Error('Z3D: siqilgan ma’lumotni ochib bo’lmadi (fayl buzilgan yoki boshqa versiya)')}
 const dv=new DataView(d.buffer,d.byteOffset,d.byteLength),end=declared>0&&declared<=d.length?declared:d.length;
 const str=(o,n)=>dec.decode(d.subarray(o,o+Math.max(0,n-(d[o+n-1]==0?1:0))));
 const info=[];let tris=0,bad=0,off=0;const matsRaw=[],meshesRaw=[];
 while(off+8<=end){
  const id=dv.getUint32(off,true),sz=dv.getUint32(off+4,true),b=off+8,e=b+sz;
  if(e>end){info.push('fayl oxiri kesilgan');break}
  if(id==0x161||id==0x110){
   if(sz<8)throw Error('Z3D: buzuq chunk');
   const nl=dv.getUint32(b+4,true);if(nl>sz-8)throw Error('Z3D: buzuq nom');
   const name=str(b+8,nl),p=b+8+nl;
   (id==0x161?matsRaw:meshesRaw).push({name,p,e,b})}
  off=e}
 if(!meshesRaw.length)throw Error('Z3D ichida mesh topilmadi');
 /* materiallar: 0-indeks = "Default Material" */
 const mats=matsRaw.map(r=>{
  const f=i=>r.p+i*4<=r.e-4?dv.getFloat32(r.p+i*4,true):0;
  const sh=f(16),al=f(7),m=new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2,metalness:0,roughness:Math.min(.95,Math.max(.25,1-Math.sqrt(Math.max(sh,0))/12))});
  m.color.setRGB(f(4),f(5),f(6));m.name=r.name;
  if(f(12)+f(13)+f(14)>0)m.emissive.setRGB(f(12),f(13),f(14));
  if(al>0&&al<1){m.transparent=true;m.opacity=al}
  return m});
 if(!mats.length)mats.push(new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2,roughness:.7,metalness:0}));
 const out=new THREE.Group(),used=new Set();
 for(const r of meshesRaw){
  const sub={};let p=r.p+4,ok=true;
  while(p+8<=r.e){const id=dv.getUint32(p,true),sz=dv.getUint32(p+4,true);if(p+8+sz>r.e){ok=false;break}sub[id]=[p+8,sz];p+=8+sz}
  if(!ok||!sub[0x121]||!sub[0x122]||!sub[0x131]||!sub[0x132]){bad++;continue}
  const vc=dv.getUint32(sub[0x121][0],true),vp=sub[0x122][0],fc=dv.getUint32(sub[0x131][0],true),fp=sub[0x132][0],fs=sub[0x132][1];
  const stride=vc?sub[0x122][1]/vc:0,fr=fc?fs/fc:0,isz=Math.round((fr-28)/3);
  if(vc==0||fc==0||stride<24||stride!=Math.floor(stride)||![1,2,4].includes(isz)||fr!=3*isz+28){bad++;continue}
  const mi=sub[0x131][1]>=32?dv.getUint32(sub[0x131][0]+28,true):0,rd=isz==1?o=>d[o]:isz==2?o=>dv.getUint16(o,true):o=>dv.getUint32(o,true);
  const P=new Float32Array(vc*3),N=new Float32Array(vc*3);let zeroN=0;
  for(let i=0;i<vc;i++){const o=vp+i*stride;let x=dv.getFloat32(o+12,true),y=dv.getFloat32(o+16,true),z=dv.getFloat32(o+20,true);
   P[i*3]=dv.getFloat32(o,true);P[i*3+1]=dv.getFloat32(o+4,true);P[i*3+2]=dv.getFloat32(o+8,true);
   const l=Math.hypot(x,y,z);if(l>1e-12){N[i*3]=x/l;N[i*3+1]=y/l;N[i*3+2]=z/l}else zeroN++}
  /* burchak UV → bir xil (vertex,u,v) ni birlashtiramiz */
  const first=new Int32Array(vc).fill(-1),nxt=[],ov=[],ou=[],ow=[],idx=new Uint32Array(fc*3);let nf=0;
  const get=(v,uu,vv)=>{for(let k=first[v];k>=0;k=nxt[k])if(ou[k]===uu&&ow[k]===vv)return k;const k=ov.length;ov.push(v);ou.push(uu);ow.push(vv);nxt.push(first[v]);first[v]=k;return k};
  for(let i=0;i<fc;i++){const o=fp+i*fr,a=rd(o),bb=rd(o+isz),c=rd(o+2*isz),q=o+3*isz+4;
   if(a>=vc||bb>=vc||c>=vc)continue;
   const U=[dv.getFloat32(q,true),dv.getFloat32(q+4,true),dv.getFloat32(q+8,true)],V=[dv.getFloat32(q+12,true),dv.getFloat32(q+16,true),dv.getFloat32(q+20,true)];
   const ia=get(a,U[0],V[0]),ib=get(bb,U[1],V[1]),ic=get(c,U[2],V[2]);
   if(a==bb||bb==c||a==c)continue;
   idx[nf*3]=ia;idx[nf*3+1]=ic;idx[nf*3+2]=ib;nf++}  /* (a,c,b): Three.js uchun CCW */
  if(!nf){bad++;continue}
  const n=ov.length,gp=new Float32Array(n*3),gn=new Float32Array(n*3),gu=new Float32Array(n*2);
  for(let k=0;k<n;k++){const v=ov[k];gp[k*3]=P[v*3];gp[k*3+1]=P[v*3+1];gp[k*3+2]=P[v*3+2];gn[k*3]=N[v*3];gn[k*3+1]=N[v*3+1];gn[k*3+2]=N[v*3+2];gu[k*2]=ou[k];gu[k*2+1]=FLIPV?1-ow[k]:ow[k]}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(gp,3));g.setAttribute('uv',new THREE.BufferAttribute(gu,2));
  g.setIndex(new THREE.BufferAttribute(nf*3==idx.length?idx:idx.slice(0,nf*3),1));
  if(zeroN)g.computeVertexNormals();else g.setAttribute('normal',new THREE.BufferAttribute(gn,3));
  /* pivot: matritsaning oxirgi qatori (bbox ichida bo'lsa), aks holda bbox markazi */
  g.computeBoundingBox();const bb2=g.boundingBox,ctr=bb2.getCenter(new THREE.Vector3()),sz=bb2.getSize(new THREE.Vector3()),pv=ctr.clone();
  if(sub[0x114]&&sub[0x114][1]>=64){const t=new THREE.Vector3(dv.getFloat32(sub[0x114][0]+48,true),dv.getFloat32(sub[0x114][0]+52,true),dv.getFloat32(sub[0x114][0]+56,true)),m=Math.max(sz.x,sz.y,sz.z)*.05+1e-6;
   if(isFinite(t.x+t.y+t.z)&&t.x>=bb2.min.x-m&&t.x<=bb2.max.x+m&&t.y>=bb2.min.y-m&&t.y<=bb2.max.y+m&&t.z>=bb2.min.z-m&&t.z<=bb2.max.z+m)pv.copy(t)}
  g.translate(-pv.x,-pv.y,-pv.z);g.computeBoundingBox();g.computeBoundingSphere();
  const mt=(mats[mi]||mats[0]).clone();used.add(mi);
  const o=new THREE.Mesh(g,mt);o.name=r.name||'mesh';o.position.copy(pv);out.add(o);tris+=nf}
 if(!out.children.length)throw Error('Z3D ichida o’qiladigan mesh topilmadi');
 if(bad)info.push(bad+' ta mesh buzuq');
 z3dImp.info=info;z3dImp.tris=tris;z3dImp.count=out.children.length;
 return out;
};

/* ================= EKSPORT ================= */
const cat=a=>{let n=0;a.forEach(x=>n+=x.length);const o=new Uint8Array(n);let p=0;a.forEach(x=>{o.set(x,p);p+=x.length});return o};
const u32=v=>{const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,v>>>0,true);return b};
const ck=(id,body)=>cat([u32(id),u32(body.length),body]);
const nameB=s=>{const b=enc.encode(String(s||'')),o=new Uint8Array(b.length+1);o.set(b);return o};
const hd=name=>{const n=nameB(name);return cat([u32(0x102),u32(n.length),n])};

window.z3dOut=function(){
 root.updateMatrixWorld(true);
 const mats=[],mIdx=new Map(),info=[],parts=[];
 const matId=m=>{if(!m)return 0;let k=mIdx.get(m);if(k===undefined){k=mats.length+1;mIdx.set(m,k);mats.push(m)}return k};
 const v3=new THREE.Vector3(),nmx=new THREE.Matrix3();
 for(const m of meshes()){
  if(!m.visible||m.userData.dummy)continue;
  let g=m.geometry;const PA=g.getAttribute('position');if(!PA)continue;
  if(!g.getAttribute('normal')){g=g.clone();g.computeVertexNormals()}
  const NA=g.getAttribute('normal'),UA=g.getAttribute('uv'),n=PA.count,ix=g.index?g.index.array:null,total=ix?ix.length:n;
  nmx.getNormalMatrix(m.matrixWorld);
  const P=new Float32Array(n*3),N=new Float32Array(n*3);
  for(let i=0;i<n;i++){v3.set(PA.getX(i),PA.getY(i),PA.getZ(i)).applyMatrix4(m.matrixWorld);P[i*3]=v3.x;P[i*3+1]=v3.y;P[i*3+2]=v3.z;
   v3.set(NA.getX(i),NA.getY(i),NA.getZ(i)).applyMatrix3(nmx).normalize();N[i*3]=v3.x;N[i*3+1]=v3.y;N[i*3+2]=v3.z}
  const ms=[].concat(m.material),grs=g.groups&&g.groups.length?g.groups:[{start:0,count:total,materialIndex:0}];
  const det=m.matrixWorld.determinant()<0; /* ko'zgu (manfiy masshtab): yuza yo'nalishini teskari qilamiz */
  grs.forEach((gr,gi)=>{
   const s=gr.start,c=Math.min(gr.count,total-s);if(c<3)return;
   parts.push({name:(m.name||'mesh')+(grs.length>1?'_'+(gi+1):''),P,N,UA,ix,s,c:c-c%3,mat:matId(ms[gr.materialIndex]||ms[0]),det})})}
 if(!parts.length)throw Error('Eksport uchun mesh yo’q');
 /* ----- chunklar ----- */
 const out=[ck(0x150,nameB('C:\\')),ck(0x160,T160)];
 /* materiallar */
 const mk=(name,col,al,emis,sh)=>{
  const f=new Float32Array(31),iv=new Uint32Array(f.buffer);
  f.set([col.r,col.g,col.b,al,col.r,col.g,col.b,al,1,1,1,1,emis.r,emis.g,emis.b,1,sh],0);
  iv[17]=iv[18]=iv[19]=iv[20]=0xffffffff;f[21]=.5;iv[22]=iv[23]=iv[24]=iv[25]=1;iv[26]=5;iv[27]=6;iv[28]=0x48000;iv[29]=iv[30]=0;
  return ck(0x161,cat([hd(name),new Uint8Array(f.buffer)]))};
 const hx=c=>[c.r,c.g,c.b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('').toUpperCase();
 out.push(mk('Default Material',{r:.8,g:.8,b:.8},1,{r:0,g:0,b:0},50));
 mats.forEach((m,i)=>{const c=m.color||{r:.8,g:.8,b:.8},e=m.emissive||{r:0,g:0,b:0},al=m.transparent?Math.max(0,Math.min(1,m.opacity)):1,
  r=m.roughness==null?.6:m.roughness,sh=Math.round((1-Math.min(1,Math.max(0,r)))**2*144),
  nm=(m.name||'').trim()||('Matte: FF'+hx(c));
  out.push(mk(nm,c,al,e,sh))});
 out.push(ck(0x101,T101));
 /* meshlar (65535 vertexdan oshsa bo'laklarga bo'linadi: indeks u16) */
 const names=[];let tris=0;
 for(const pt of parts){
  const{P,N,UA,ix,s,c,det}=pt,get=ix?i=>ix[i]:i=>i;
  let k=0,bi=0;
  while(k<c){
   const map=new Map(),vl=[],fl=[];
   while(k<c){
    const t=[get(s+k),get(s+k+1),get(s+k+2)],newV=t.filter((v,j)=>!map.has(v)&&t.indexOf(v)==j).length;
    if(vl.length+newV>65535&&fl.length)break;
    const ids=t.map(v=>{let q=map.get(v);if(q===undefined){q=vl.length;map.set(v,q);vl.push(v)}return q});
    fl.push({ids,src:t});k+=3}
   const vc=vl.length,isz=vc<=256?1:2,fc=fl.length;
   const nm=pt.name+(bi?'_p'+(bi+1):'');bi++;
   const vb=new Uint8Array(vc*28),vdv=new DataView(vb.buffer);
   let mnx=1e30,mny=1e30,mnz=1e30,mxx=-1e30,mxy=-1e30,mxz=-1e30;
   vl.forEach((v,i)=>{const o=i*28,x=P[v*3],y=P[v*3+1],z=P[v*3+2];
    vdv.setFloat32(o,x,true);vdv.setFloat32(o+4,y,true);vdv.setFloat32(o+8,z,true);
    vdv.setFloat32(o+12,N[v*3],true);vdv.setFloat32(o+16,N[v*3+1],true);vdv.setFloat32(o+20,N[v*3+2],true);
    mnx=Math.min(mnx,x);mxx=Math.max(mxx,x);mny=Math.min(mny,y);mxy=Math.max(mxy,y);mnz=Math.min(mnz,z);mxz=Math.max(mxz,z)});
   const rs=3*isz+28,fb=new Uint8Array(fc*rs),fdv=new DataView(fb.buffer);
   fl.forEach((f,i)=>{const o=i*rs,[a,b,c2]=det?[f.ids[0],f.ids[1],f.ids[2]]:[f.ids[0],f.ids[2],f.ids[1]],[sa,sb,sc]=det?[f.src[0],f.src[1],f.src[2]]:[f.src[0],f.src[2],f.src[1]];
    if(isz==1){fb[o]=a;fb[o+1]=b;fb[o+2]=c2}else{fdv.setUint16(o,a,true);fdv.setUint16(o+2,b,true);fdv.setUint16(o+4,c2,true)}
    const q=o+3*isz;fdv.setUint32(q,0x1000,true);
    const uv=w=>UA?[UA.getX(w),FLIPV?1-UA.getY(w):UA.getY(w)]:[0,0],A=uv(sa),B=uv(sb),C=uv(sc);
    [A[0],B[0],C[0],A[1],B[1],C[1]].forEach((x,j)=>fdv.setFloat32(q+4+j*4,x,true))});
   const h121=new Uint8Array(28),h121v=new DataView(h121.buffer);h121v.setUint32(0,vc,true);h121v.setUint32(4,1,true);
   const h131=new Uint8Array(84),h131v=new DataView(h131.buffer);h131v.setUint32(0,fc,true);h131v.setUint32(4,0x1000,true);h131v.setUint32(28,pt.mat,true); /* material indeksi: 28-bayt */
   const cx=(mnx+mxx)/2,cy=(mny+mxy)/2,cz=(mnz+mxz)/2,sc=Math.max(mxx-mnx,mxy-mny,mxz-mnz)/2||1e-3;
   const mt=new Float32Array([-sc,0,0,0, -0,0,sc,0, -0,-sc,0,0, cx,cy,cz,1]),
   body=cat([hd(nm),u32(0),ck(0x121,h121),ck(0x122,vb),ck(0x131,h131),ck(0x132,fb),ck(0x114,new Uint8Array(mt.buffer))]);
   out.push(ck(0x110,body));names.push(nm);tris+=fc}
  }
 /* 0x8020: obyektlar ro'yxati */
 out.push(ck(0x8020,cat([...names.map(n=>{const nb=nameB(n);return cat([u32(1),new Uint8Array(1),u32(nb.length),nb])}),new Uint8Array(9)])));
 const data=cat(out),z=fflate.zlibSync(data,{level:6}),h=new Uint8Array(12);
 h.set([0x5a,0x33,0x44,0x4d,0x03,0x31,0,0]);new DataView(h.buffer).setUint32(8,data.length,true);
 z3dOut.info=[names.length+' obyekt, '+tris+' uchburchak'];
 return cat([h,z]);
};
})();
