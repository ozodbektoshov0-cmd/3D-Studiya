/* ---- v56 · 4-bosqich: Blender import/export imkoniyatlari ----
   • OBJ + MTL (+ teksturalar) ZIP eksporti — Blender (io/wavefront_obj) formulalari bilan: Ns=(1−roughness)²·1000, Ka=metallic, illum qoidasi.
   • MTL import: OBJ bilan birga .mtl va tekstura rasmlarini tanlang/tashlang — materiallar tiklanadi (Ns→roughness=1−√(Ns/1000)).
   • ASCII STL va ASCII PLY eksporti.
   Alembic (.abc) va SPZ hozircha yo‘q. */
(function(){
'use strict';
const T=window.THREE;
if(!T||typeof $!=='function'||typeof root==='undefined'||typeof saveBlob!=='function')return;

/* ================= MTL o‘qish ================= */
function mapFile(v){let s=v.trim();
 for(;;){const m=s.match(/^-mm\s+\S+\s+\S+\s*/i)||s.match(/^-(?:o|s|t)\s+\S+(?:\s+[-\d.eE+]+(?=\s|$)){0,2}\s*/i)||s.match(/^-\w+\s+\S+\s*/);if(!m)break;s=s.slice(m[0].length)}
 return s.trim()}
function parseMtl(text){const M=new Map();let c=null;
 text.split(/\r?\n/).forEach(raw=>{const l=raw.replace(/#.*/,'').trim();if(!l)return;
  const i=l.search(/\s/),k=(i<0?l:l.slice(0,i)).toLowerCase(),v=i<0?'':l.slice(i).trim();
  if(k=='newmtl'){c={name:v};M.set(v,c);return}if(!c)return;
  const n=v.split(/\s+/).map(Number);
  if(k=='kd'||k=='ka'||k=='ks'||k=='ke'){if(isNaN(n[0]))return;c[k]=[n[0],isNaN(n[1])?n[0]:n[1],isNaN(n[2])?n[0]:n[2]]}
  else if(/^(ns|d|tr|ni|illum|pr|pm)$/.test(k)){if(!isNaN(n[0]))c[k]=n[0]}
  else if(/^(map_|bump|norm|disp)/.test(k)){const f=mapFile(v);if(f)c[k]=f}});
 return M}
const bn=p=>String(p).split(/[\\/]/).pop().toLowerCase();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const srgb=t=>{if(T.SRGBColorSpace!==undefined&&'colorSpace' in t)t.colorSpace=T.SRGBColorSpace;else if(T.sRGBEncoding!==undefined&&typeof R!=='undefined'&&R.outputEncoding===T.sRGBEncoding)t.encoding=T.sRGBEncoding};
function mkTex(file,color){const t=new T.TextureLoader().load(URL.createObjectURL(file));t.wrapS=t.wrapT=T.RepeatWrapping;t.name=file.name;t.userData.src=file.name;if(color)srgb(t);return t}
function mkMat(d,imgs){const m=new T.MeshStandardMaterial({side:T.DoubleSide});m.name=d.name;
 const kd=d.kd||[.8,.8,.8],illum=d.illum==null?2:d.illum,find=k=>d[k]&&imgs&&imgs.get(bn(d[k]));
 m.color.setRGB(kd[0],kd[1],kd[2]);
 m.roughness=d.pr!=null?clamp(d.pr,0,1):d.ns!=null?1-Math.sqrt(clamp(d.ns,0,1000)/1000):.5;
 m.metalness=d.pm!=null?clamp(d.pm,0,1):([3,5,6,7,8].includes(illum)&&d.ka?clamp((d.ka[0]+d.ka[1]+d.ka[2])/3,0,1):0);
 const op=d.d!=null?d.d:d.tr!=null?1-d.tr:1;if(op<1){m.opacity=clamp(op,0,1);m.transparent=true}
 if(d.ke&&(d.ke[0]||d.ke[1]||d.ke[2]))m.emissive.setRGB(d.ke[0],d.ke[1],d.ke[2]);
 let f;
 if(f=find('map_kd')){m.map=mkTex(f,true);m.color.setRGB(1,1,1)}
 if(f=find('map_ke')){m.emissiveMap=mkTex(f,true);m.emissive.setRGB(1,1,1)}
 if(f=find('map_bump')||find('bump'))m.bumpMap=mkTex(f,false);
 if(f=find('norm')||find('map_kn'))m.normalMap=mkTex(f,false);
 if(f=find('map_d')){m.alphaMap=mkTex(f,false);m.transparent=true}
 if(f=find('map_pr'))m.roughnessMap=mkTex(f,false);
 if(f=find('map_pm'))m.metalnessMap=mkTex(f,false);
 return m}
function applyMtl(obj,B){const cache=new Map(),get=x=>{if(!x||!B.defs.has(x.name))return x;if(!cache.has(x.name))cache.set(x.name,mkMat(B.defs.get(x.name),B.imgs));return cache.get(x.name)};
 obj.traverse(o=>{if(o.isMesh||o.isLine||o.isPoints){if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(get):get(o.material)}})}
if(T.OBJLoader){const P=T.OBJLoader.prototype,p0=P.parse;P.parse=function(t){const o=p0.call(this,t);if(window.BL_MTL)try{applyMtl(o,window.BL_MTL)}catch(e){console.error(e)}return o}}
const accept=$('#f');if(accept&&accept.accept&&!/\.mtl/.test(accept.accept))accept.accept+=',.mtl';
if(typeof loadAll==='function'){const la0=loadAll;
 loadAll=async function(fs){fs=[...fs];const ext=f=>f.name.split('.').pop().toLowerCase(),mt=fs.filter(f=>ext(f)=='mtl');
  if(!mt.length)return la0(fs);
  if(!fs.some(f=>ext(f)=='obj')){toast('MTL fayli OBJ bilan birga tanlanishi kerak (teksturalar ham)');return la0(fs.filter(f=>ext(f)!='mtl'))}
  const defs=new Map(),imgs=new Map(),used=new Set();
  for(const f of mt)try{parseMtl(await f.text()).forEach((v,k)=>defs.set(k,v))}catch(e){}
  fs.forEach(f=>{if(/^(png|jpe?g|webp|bmp|gif)$/.test(ext(f)))imgs.set(f.name.toLowerCase(),f)});
  defs.forEach(d=>Object.keys(d).forEach(k=>/^(map_|bump|norm|disp)/.test(k)&&used.add(bn(d[k]))));
  const rest=fs.filter(f=>ext(f)!='mtl'&&!(imgs.has(f.name.toLowerCase())&&used.has(f.name.toLowerCase())));
  window.BL_MTL={defs,imgs};try{await la0(rest)}finally{window.BL_MTL=null}}}

/* ================= OBJ + MTL eksport ================= */
const safe=s=>String(s||'').trim().replace(/[\s#]+/g,'_')||'Mesh';
async function texPng(t){try{const im=t&&t.image;if(!im)return null;const w=im.width||im.videoWidth,h=im.height||im.videoHeight;if(!w||!h)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
 if(im.data){const id=x.createImageData(w,h);if(im.data.length!==w*h*4)return null;id.data.set(im.data);x.putImageData(id,0,0)}else x.drawImage(im,0,0);
 const b=await new Promise(r=>c.toBlob(r,'image/png'));return b?new Uint8Array(await b.arrayBuffer()):null}catch(e){return null}}
const f6=x=>(x===0?0:x).toFixed(6);
async function buildObj(list,nm){
 const out=['# 3D Studiya — OBJ eksport (Blender OBJ/MTL formulalari)','mtllib '+nm+'.mtl'],mt=new Map(),used=new Set(),tx=new Map(),files=[],warn=[];
 const uniq=(n,S)=>{let b=safe(n),r=b,i=1;while(S.has(r))r=b+'.'+String(i++).padStart(3,'0');S.add(r);return r};
 const mname=m=>{if(!mt.has(m))mt.set(m,uniq(m.name||'Material',used));return mt.get(m)};
 let vo=1,to=1,no=1;
 for(const mesh of list){const g=mesh.geometry,P=g&&g.getAttribute('position');if(!P)continue;
  const U=g.getAttribute('uv'),N=g.getAttribute('normal'),mw=mesh.matrixWorld,nmx=new T.Matrix3().getNormalMatrix(mw),neg=mw.determinant()<0;
  const mm=[].concat(mesh.material),m0=mm[0],flipV=!!(m0&&m0.map&&m0.map.flipY===false),v=new T.Vector3();
  out.push('o '+safe(mesh.name));
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(mw);out.push('v '+f6(v.x)+' '+f6(v.y)+' '+f6(v.z))}
  if(U)for(let i=0;i<U.count;i++)out.push('vt '+f6(U.getX(i))+' '+f6(flipV?1-U.getY(i):U.getY(i)));
  if(N)for(let i=0;i<N.count;i++){v.fromBufferAttribute(N,i).applyMatrix3(nmx).normalize();out.push('vn '+f6(v.x)+' '+f6(v.y)+' '+f6(v.z))}
  const idx=g.index?g.index.array:null,cnt=idx?idx.length:P.count,gr=g.groups&&g.groups.length>1?g.groups:[{start:0,count:cnt,materialIndex:0}];
  let last=null;
  for(const r of gr){const m=mm[r.materialIndex]||m0;if(m&&m!==last){out.push('usemtl '+mname(m));last=m}
   const e=Math.min(cnt,r.start+r.count);
   for(let k=r.start;k+2<e;k+=3){let a=[k,k+1,k+2].map(j=>idx?idx[j]:j);if(neg)a=[a[0],a[2],a[1]];
    out.push('f '+a.map(i=>U&&N?(vo+i)+'/'+(to+i)+'/'+(no+i):U?(vo+i)+'/'+(to+i):N?(vo+i)+'//'+(no+i):''+(vo+i)).join(' '))}}
  vo+=P.count;if(U)to+=U.count;if(N)no+=N.count}
 const tex=async t=>{if(!t)return null;if(tx.has(t))return tx.get(t);const u8=await texPng(t);
  if(!u8){warn.push('tekstura saqlanmadi: '+(t.name||'nomsiz'));tx.set(t,null);return null}
  const S=new Set(files.map(f=>f[0].toLowerCase())),b=safe((t.name||t.userData.src||'texture').split(/[\\/]/).pop().replace(/\.[^.]+$/,''));let p='textures/'+b+'.png',i=1;
  while(S.has(p.toLowerCase()))p='textures/'+b+'.'+String(i++).padStart(3,'0')+'.png';files.push([p,u8]);tx.set(t,p);return p};
 const mtl=['# 3D Studiya — MTL (Blender formulalari: Ns=(1-roughness)^2*1000, Ka=metallic)'];
 for(const [m,n] of mt){const phong=!!m.isMeshPhongMaterial,metal=m.isMeshStandardMaterial?m.metalness||0:0,rough=m.isMeshStandardMaterial?(m.roughness==null?.5:m.roughness):.5;
  const ns=phong?clamp(m.shininess==null?30:m.shininess,0,1000):(1-rough)*(1-rough)*1000,op=m.opacity==null?1:m.opacity,transp=op!==1||!!m.transparent&&op<1;
  const spec=phong&&m.specular?[m.specular.r,m.specular.g,m.specular.b]:[.5,.5,.5],em=m.emissive?m.emissive.clone().multiplyScalar(m.emissiveIntensity==null?1:m.emissiveIntensity):null;
  const illum=spec[0]+spec[1]+spec[2]===0?1:metal>0?(transp?6:3):transp?9:2,col=m.color||{r:.8,g:.8,b:.8};
  const mp=await tex(m.map),me=await tex(m.emissiveMap),mb=await tex(m.normalMap||m.bumpMap),ma=await tex(m.alphaMap);
  mtl.push('','newmtl '+n,'Ns '+f6(ns),'Ka '+f6(metal)+' '+f6(metal)+' '+f6(metal),mp?'Kd 1.000000 1.000000 1.000000':'Kd '+f6(col.r)+' '+f6(col.g)+' '+f6(col.b),
   'Ks '+spec.map(f6).join(' '),'Ke '+(em?[em.r,em.g,em.b].map(f6).join(' '):'0.000000 0.000000 0.000000'),'Ni '+f6(m.ior||1.5),'d '+f6(op),'illum '+illum);
  if(mp)mtl.push('map_Kd '+mp);if(me)mtl.push('map_Ke '+me);if(mb)mtl.push((m.normalMap?'map_Bump -bm 1.000000 ':'map_Bump ')+mb);if(ma)mtl.push('map_d '+ma)}
 return {obj:out.join('\n')+'\n',mtl:mtl.join('\n')+'\n',files,warn}}

/* ================= eksport oqimi ================= */
async function run(f){
 if(!meshes().length)return toast('Avval model oching');
 const os=$('#onlysel')&&$('#onlysel').checked;if(os&&!pick().length)return toast('“Faqat tanlanganlar”: avval obyekt tanlang');
 if(window.xrayPause)xrayPause();const r0=root.rotation.x;tc.detach();
 const dm=meshes().filter(m=>m.userData.dummy);dm.forEach(m=>m.visible=false);
 let hid=[];if(os){const ps=new Set(pick());hid=meshes().filter(m=>m.visible&&!ps.has(m));hid.forEach(m=>m.visible=false)}
 root.rotation.x=$('#zup')&&$('#zup').checked?Math.PI/2:0;root.updateMatrixWorld(true);
 const back=()=>{if(window.xrayResume)xrayResume();hid.forEach(m=>m.visible=true);dm.forEach(m=>m.visible=true);root.rotation.x=r0;root.updateMatrixWorld(true);if(sel)tc.attach(sel)};
 try{
  if(f=='objzip'){
   const list=meshes().filter(m=>{for(let o=m;o&&o!==S;o=o.parent)if(!o.visible)return false;return true});
   const nm=safe(name),r=await buildObj(list,nm);back();
   const z={};z[nm+'.obj']=fflate.strToU8(r.obj);z[nm+'.mtl']=fflate.strToU8(r.mtl);r.files.forEach(([p,u])=>z[p]=u);
   saveBlob(new Blob([fflate.zipSync(z,{level:6})],{type:'application/zip'}),nm+'.zip');
   toast('OBJ + MTL (ZIP) tayyor'+(r.files.length?' · '+r.files.length+' tekstura':'')+(r.warn.length?' · '+r.warn.join('; '):''))}
  else if(f=='stl-ascii'){const d=new T.STLExporter().parse(root,{binary:false});back();saveBlob(new Blob([d],{type:'model/stl'}),name+'.stl');toast('STL (ASCII) tayyor')}
  else{await new Promise((ok,no)=>{try{new T.PLYExporter().parse(root,r=>{back();saveBlob(new Blob([r],{type:'text/plain'}),name+'.ply');toast('PLY (ASCII) tayyor');ok()},{binary:false})}catch(e){no(e)}})}
 }catch(e){back();toast('Xato: '+(e.message||e))}}
const fm=$('#fmt');
if(fm){[['objzip','obj+mtl (ZIP)'],['stl-ascii','stl (ASCII)'],['ply-ascii','ply (ASCII)']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;fm.append(o)});
 const ex=$('#ex');if(ex)ex.addEventListener('click',e=>{const f=fm.value;if(f!=='objzip'&&f!=='stl-ascii'&&f!=='ply-ascii')return;e.stopImmediatePropagation();e.preventDefault();run(f)},true)}
window.BL_IO={parseMtl,mapFile,mkMat,applyMtl,buildObj,texPng};
})();
