/* ---- DFF (RenderWare) o’qish ---- */
function dff(b){
 const v=new DataView(b);
 const K=(p,e)=>{const r=[];while(p+12<=e){const s=v.getUint32(p+4,true);r.push([v.getUint32(p,true),p+12,s]);p+=12+s}return r};
 const str=(p,n)=>{let s='';for(let i=0;i<n&&v.getUint8(p+i);i++)s+=String.fromCharCode(v.getUint8(p+i));return s};
 const f4=p=>v.getFloat32(p,true);
 function G(d,e){
  let ver=v.getUint32(d-4,true);if(ver&0xFFFF0000)ver=((ver>>>14)&0x3FF00)+((ver>>>16)&0x3F)+0x30000;
  const ch=K(d,e);let q=ch[0][1];
  const fl=v.getUint32(q,true),nt=v.getUint32(q+4,true),nv=v.getUint32(q+8,true);q+=16;if(ver<0x34000)q+=12;
  if(fl&0x01000000)throw Error('PS2 native DFF qo’llanmaydi');
  const nu=((fl>>>16)&255)||(fl&4?1:fl&0x80?2:0);if(fl&8)q+=nv*4;
  const uv=nu?new Float32Array(nv*2):null;
  for(let k=0;k<nu;k++)for(let i=0;i<nv;i++,q+=8)if(!k){uv[i*2]=f4(q);uv[i*2+1]=1-f4(q+4)}
  const tri=[];
  for(let i=0;i<nt;i++,q+=8){const m=v.getUint16(q+4,true);(tri[m]=tri[m]||[]).push(v.getUint16(q+2,true),v.getUint16(q,true),v.getUint16(q+6,true))}
  q+=16;const hv=v.getUint32(q,true),hn=v.getUint32(q+4,true);q+=8;
  const pos=new Float32Array(nv*3),nor=hn?new Float32Array(nv*3):null;
  if(hv)for(let i=0;i<nv*3;i++)pos[i]=f4(q+i*4);q+=hv*nv*12;
  if(hn)for(let i=0;i<nv*3;i++)nor[i]=f4(q+i*4);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  if(nor)g.setAttribute('normal',new THREE.BufferAttribute(nor,3));if(uv)g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  let idx=[];tri.forEach((t,m)=>{if(t){g.addGroup(idx.length,t.length,m);idx=idx.concat(t)}});
  g.setIndex(idx);if(!nor)g.computeVertexNormals();
  const mats=[],ml=ch.find(c=>c[0]==8);
  if(ml)K(ml[1],ml[1]+ml[2]).filter(c=>c[0]==7).forEach(c=>{
   const x=c[1]+12,m=new THREE.MeshStandardMaterial({color:new THREE.Color(v.getUint8(x+4)/255,v.getUint8(x+5)/255,v.getUint8(x+6)/255),side:2});
   const tx=K(c[1],c[1]+c[2]).find(z=>z[0]==6);
   if(tx){const s=K(tx[1],tx[1]+tx[2]).find(z=>z[0]==2);if(s)m.name=m.userData.tex=str(s[1],s[2])}mats.push(m)});
  return[g,mats.length?mats:[new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2})]];
 }
 const top=K(0,b.byteLength).find(c=>c[0]==0x10);if(!top)throw Error('Bu DFF fayl emas');
 const cl=K(top[1],top[1]+top[2]),fl=cl.find(c=>c[0]==0x0E),gl=cl.find(c=>c[0]==0x1A);
 const fch=K(fl[1],fl[1]+fl[2]),n=v.getUint32(fch[0][1],true),base=fch[0][1]+4;
 const names=fch.slice(1).map(c=>{const z=K(c[1],c[1]+c[2]).find(y=>y[0]==0x253F2FE);return z?str(z[1],z[2]):''});
 const F=[],par=[];
 for(let i=0;i<n;i++){const p=base+i*56,o=new THREE.Object3D(),r=j=>new THREE.Vector3(f4(p+j*12),f4(p+j*12+4),f4(p+j*12+8));
  o.name=names[i]||'frame'+i;o.applyMatrix4(new THREE.Matrix4().makeBasis(r(0),r(1),r(2)).setPosition(r(3)));F.push(o);par.push(v.getInt32(p+48,true))}
 const out=new THREE.Group();
 F.forEach((o,i)=>(par[i]>=0&&F[par[i]]?F[par[i]]:out).add(o));
 const geos=K(gl[1],gl[1]+gl[2]).filter(c=>c[0]==0xF).map(c=>G(c[1],c[1]+c[2]));
 cl.filter(c=>c[0]==0x14).forEach(c=>{const s=c[1]+12,fi=v.getUint32(s,true),gi=v.getUint32(s+4,true);
  if(F[fi]&&geos[gi]){const m=new THREE.Mesh(geos[gi][0],geos[gi][1]);m.name=F[fi].name+'_mesh';F[fi].add(m)}});
 out.rotation.x=-Math.PI/2;const w=new THREE.Group();w.add(out);return w;
}
