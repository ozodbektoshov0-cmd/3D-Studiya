/* ---- DFF yozish (GTA SA, 0x1803FFFF) ---- */
function dffOut(){
 const VER=0x1803FFFF,U=a=>new Uint8Array(new Uint32Array(a).buffer),f=a=>new Uint8Array(new Float32Array(a).buffer),
  cat=a=>{let n=0;a.forEach(x=>n+=x.length);const o=new Uint8Array(n);let p=0;a.forEach(x=>{o.set(x,p);p+=x.length});return o},
  ck=(t,...a)=>{const d=cat(a);return cat([U([t,d.length,VER]),d])},
  s4=s=>{const o=new Uint8Array(Math.ceil((s.length+1)/4)*4);for(let i=0;i<s.length;i++)o[i]=s.charCodeAt(i);return o},E=()=>ck(3);
 root.updateMatrixWorld(true);const ms=meshes().filter(m=>m.visible),Z=new THREE.Matrix4().makeRotationX(Math.PI/2);
 const names=['root'],fr=[cat([f([1,0,0,0,1,0,0,0,1,0,0,0]),U([-1,0x20003])])];
 const geos=ms.map((m,mi)=>{
  names.push(m.name.replace(/_mesh$/,'')||'obj'+mi);
  const e=new THREE.Matrix4().multiplyMatrices(Z,m.matrixWorld).elements;
  fr.push(cat([f([e[0],e[1],e[2],e[4],e[5],e[6],e[8],e[9],e[10],e[12],e[13],e[14]]),U([0,0x20003])]));
  const g=m.geometry,P=g.getAttribute('position'),n=P.count;if(n>65535)throw Error(names[mi+1]+': 65535 ta uchdan ko’p');
  let N=g.getAttribute('normal');if(!N){const c=g.clone();c.computeVertexNormals();N=c.getAttribute('normal')}
  const UV=g.getAttribute('uv'),ix=g.index?g.index.array:null,nt=(ix?ix.length:n)/3,I=i=>ix?ix[i]:i;
  const gr=g.groups.length?g.groups:[{start:0,count:nt*3,materialIndex:0}],ma=[].concat(m.material),tris=[],bins=[];
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);
  for(let i=0;i<n;i++){pos.set([P.getX(i),P.getY(i),P.getZ(i)],i*3);nor.set([N.getX(i),N.getY(i),N.getZ(i)],i*3);if(UV)uv.set([UV.getX(i),1-UV.getY(i)],i*2)}
  let tn=0;gr.forEach(r=>{const k=Math.min(r.materialIndex||0,ma.length-1),bi=[];
   for(let i=r.start;i<Math.min(r.start+r.count,nt*3);i+=3){const a=I(i),b=I(i+1),c=I(i+2);tris.push(b,a,k,c);bi.push(a,b,c)}
   tn+=bi.length;bins.push([k,bi])});
  g.computeBoundingSphere();const bs=g.boundingSphere,fl=0x72|(UV?4|1<<16:0);
  const st=ck(1,U([fl,tris.length/4,n,1]),UV?f(uv):new Uint8Array(0),new Uint8Array(new Uint16Array(tris).buffer),f([bs.center.x,bs.center.y,bs.center.z,bs.radius]),U([1,1]),f(pos),f(nor));
  const ml=ck(8,ck(1,U([ma.length,...ma.map(()=>-1)])),...ma.map(x=>{const t=x.userData.tex||(x.map&&x.map.name)||'',c=x.color||{r:1,g:1,b:1};
   return ck(7,ck(1,U([0]),new Uint8Array([c.r*255,c.g*255,c.b*255,255]),U([0,t?1:0]),f([1,1,1])),...(t?[ck(6,ck(1,U([0x1106])),ck(2,s4(t)),ck(2,s4('')),E())]:[]),E())}));
  return ck(0xF,st,ml,ck(3,ck(0x50E,U([0,bins.length,tn]),...bins.map(([k,bi])=>cat([U([bi.length,k]),U(bi)])))));
 });
 const enc=new TextEncoder();
 return cat([ck(0x10,ck(1,U([ms.length,0,0])),
  ck(0xE,ck(1,U([fr.length]),...fr),...names.map(nm=>ck(3,ck(0x253F2FE,enc.encode(nm))))),
  ck(0x1A,ck(1,U([geos.length])),...geos),
  ...ms.map((m,i)=>ck(0x14,ck(1,U([i+1,i,5,0])),E())),E())]);
}
