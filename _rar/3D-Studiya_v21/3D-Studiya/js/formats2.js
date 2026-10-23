/* ---- Yana formatlar: STEP/IGES/BREP, 3DM, 3DS, AMF, LWO, PCD, XYZ, PTX, VOX, PMD/PMX, OFF, X3D, X, VTP ---- */
const EXT2=/^(step|stp|igs|iges|brep|3dm|3ds|amf|lwo|pcd|xyz|ptx|vox|pmd|pmx|off|x3d|x|vtp)$/;
const lazy=u=>lazy[u]?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=()=>{lazy[u]=1;ok()};s.onerror=()=>no(Error(u+' yuklanmadi'));document.head.append(s)});
const mk=(P,I,nm)=>{const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));G.setIndex(I);G.computeVertexNormals();const m=new THREE.Mesh(G,new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2}));m.name=nm;return m};
const pts=(P,C)=>{const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(new Float32Array(P),3));if(C)G.setAttribute('color',new THREE.BufferAttribute(new Float32Array(C),3));return new THREE.Points(G,new THREE.PointsMaterial({size:3,sizeAttenuation:false,vertexColors:!!C,color:0xcfd8e3}))};
async function stepImp(u8,ext){await lazy('vendor/occt-import-js.js');const O=await occtimportjs({locateFile:n=>'vendor/'+n}),p={linearUnit:'meter'};
 const r=ext=='igs'||ext=='iges'?O.ReadIgesFile(u8,p):ext=='brep'?O.ReadBrepFile(u8,p):O.ReadStepFile(u8,p);
 if(!r.success||!r.meshes.length)throw Error('CAD fayl o’qilmadi (STEP/IGES/BREP)');
 const g=new THREE.Group();r.meshes.forEach((m,i)=>{const G=new THREE.BufferGeometry(),a=m.attributes;G.setAttribute('position',new THREE.BufferAttribute(Float32Array.from(a.position.array),3));
  if(a.normal)G.setAttribute('normal',new THREE.BufferAttribute(Float32Array.from(a.normal.array),3));G.setIndex(Array.from(m.index.array));if(!a.normal)G.computeVertexNormals();
  const c=m.color,me=new THREE.Mesh(G,new THREE.MeshStandardMaterial({color:c?new THREE.Color(c[0],c[1],c[2]):0xb0b8c4,side:2}));me.name=m.name||'part'+(i+1);g.add(me)});
 g.rotation.x=-Math.PI/2;const w=new THREE.Group();w.add(g);return w}
async function dmImp(u8){await lazy('vendor/rhino3dm.min.js');const R=await rhino3dm({locateFile:n=>'vendor/'+n}),doc=R.File3dm.fromByteArray(u8),ob=doc.objects(),g=new THREE.Group();
 for(let i=0;i<ob.count;i++){const o=ob.get(i),geo=o.geometry(),t=geo.objectType;let me=null;
  if(t==R.ObjectType.Mesh)me=geo;
  else if(t==R.ObjectType.Brep){me=new R.Mesh();const fc=geo.faces();for(let j=0;j<fc.count;j++){const m=fc.get(j).getMesh(R.MeshType.Any);if(m)me.append(m)}}
  else if(t==R.ObjectType.Extrusion)me=geo.getMesh(R.MeshType.Any);
  if(!me||!me.vertices().count)continue;
  let j=me.toThreejsJSON();if(typeof j=='string')j=JSON.parse(j);
  const mm=new THREE.Mesh(new THREE.BufferGeometryLoader().parse(j),new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2}));mm.name=o.attributes().name||'obj'+i;g.add(mm)}
 if(!g.children.length)throw Error('3DM ichida mesh topilmadi (Brep uchun fayl render mesh bilan saqlangan bo’lishi kerak)');
 g.rotation.x=-Math.PI/2;const w=new THREE.Group();w.add(g);return w}
async function dmOut(){await lazy('vendor/rhino3dm.min.js');const R=await rhino3dm({locateFile:n=>'vendor/'+n}),doc=new R.File3dm();
 soup().forEach(s=>{const m=new R.Mesh(),V=m.vertices(),F=m.faces();for(let i=0;i<s.n;i++)V.add(s.p[i*3],-s.p[i*3+2],s.p[i*3+1]);for(let i=0;i<s.I.length;i+=3)F.addTriFace(s.I[i],s.I[i+1],s.I[i+2]);m.normals().computeNormals();m.compact();const a=new R.ObjectAttributes();a.name=s.name;doc.objects().add(m,a)});
 return doc.toByteArray()}
function offImp(t){const L=t.split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!='#');if(!/^OFF/.test(L[0]))throw Error('Bu OFF emas');let k=1;const h=(L[0].slice(3).trim()||L[k++]).split(/\s+/).map(Number),P=[],I=[];
 for(let i=0;i<h[0];i++)for(const x of L[k++].split(/\s+/).slice(0,3))P.push(+x);
 for(let i=0;i<h[1];i++){const a=L[k++].split(/\s+/).map(Number);for(let j=1;j<a[0]-1;j++)I.push(a[1],a[1+j],a[2+j])}return mk(P,I,'off')}
function x3dImp(t){const d=new DOMParser().parseFromString(t,'text/xml'),g=new THREE.Group(),sp=s=>(s||'').split(/[\s,]+/).filter(Boolean).map(Number);
 d.querySelectorAll('IndexedFaceSet,IndexedTriangleSet').forEach((s,i)=>{const c=s.querySelector('Coordinate'),I=[];if(!c)return;
  if(s.tagName=='IndexedTriangleSet')sp(s.getAttribute('index')).forEach(x=>I.push(x));
  else{let f=[];sp(s.getAttribute('coordIndex')).forEach(x=>{if(x<0){for(let j=1;j<f.length-1;j++)I.push(f[0],f[j],f[j+1]);f=[]}else f.push(x)})}
  g.add(mk(sp(c.getAttribute('point')),I,'x3d'+i))});
 if(!g.children.length)throw Error('X3D ichida mesh topilmadi');return g}
function xImp(t){if(/^xof\s+\w*(bin|zip)/i.test(t))throw Error('Ikkilik .X hali o’qilmaydi (faqat matnli .X)');
 const g=new THREE.Group();t.split(/\bMesh\b\s*\w*\s*\{/).slice(1).forEach((b,k)=>{const n=(b.match(/-?\d+\.?\d*(?:[eE][-+]?\d+)?/g)||[]).map(Number);let p=0;const nv=n[p++],P=n.slice(p,p+nv*3),I=[];p+=nv*3;const nf=n[p++];
  for(let i=0;i<nf;i++){const c=n[p++],a=n.slice(p,p+c);p+=c;for(let j=1;j<c-1;j++)I.push(a[0],a[j],a[j+1])}g.add(mk(P,I,'x'+k))});
 if(!g.children.length)throw Error('.X ichida mesh topilmadi');return g}
function ptxImp(t){const L=t.split('\n'),P=[],C=[];for(let k=10;k<L.length;k++){const a=L[k].trim().split(/\s+/);if(a.length<3)break;const x=+a[0],y=+a[1],z=+a[2];if(!x&&!y&&!z)continue;P.push(x,y,z);if(a.length>=7)C.push(a[4]/255,a[5]/255,a[6]/255)}
 if(!P.length)throw Error('PTX ichida nuqta topilmadi');return pts(P,C.length==P.length?C:null)}
async function imp2(ext,buf){const txt=()=>new TextDecoder().decode(buf);
 if(/^(step|stp|igs|iges|brep)$/.test(ext))return stepImp(new Uint8Array(buf),ext);
 if(ext=='3dm')return dmImp(new Uint8Array(buf));
 if(ext=='3ds')return new THREE.TDSLoader().parse(buf,'');
 if(ext=='amf')return new THREE.AMFLoader().parse(buf);
 if(ext=='lwo'){const r=new THREE.LWOLoader().parse(buf,'',''),g=new THREE.Group();r.meshes.forEach(m=>g.add(m));return g}
 if(ext=='pcd')return new THREE.PCDLoader().parse(buf,'');
 if(ext=='xyz'){const G=new THREE.XYZLoader().parse(txt());return new THREE.Points(G,new THREE.PointsMaterial({size:3,sizeAttenuation:false,vertexColors:!!G.getAttribute('color')}))}
 if(ext=='ptx')return ptxImp(txt());
 if(ext=='vox'){const g=new THREE.Group();new THREE.VOXLoader().parse(buf).forEach(c=>g.add(new THREE.VOXMesh(c)));return g}
 if(ext=='pmx'||ext=='pmd'){const P=new MMDParser.Parser();return new THREE.MMDLoader().meshBuilder.build(ext=='pmx'?P.parsePmx(buf,true):P.parsePmd(buf,true),'')}
 if(ext=='off')return offImp(txt());
 if(ext=='x3d')return x3dImp(txt());
 if(ext=='x')return xImp(txt());
 if(ext=='vtp'){const G=new THREE.VTKLoader().parse(buf);if(!G.getAttribute('normal'))G.computeVertexNormals();return new THREE.Mesh(G,new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2}))}
 throw Error('Format qo’llanmaydi')}
const tri=(s,np)=>Array.from({length:s.I.length/3},(_,i)=>(s.I[i*3]+np)+' '+(s.I[i*3+1]+np)+' '+(s.I[i*3+2]+np));
function allP(){const P=[];let np=0;const F=[];soup().forEach(s=>{for(const r of rows(s.p,3))P.push(r);for(const f of tri(s,np))F.push(f);np+=s.n});return{P,F,np}}
function offOut(){const{P,F,np}=allP();return 'OFF\n'+np+' '+F.length+' 0\n'+P.join('\n')+'\n'+F.map(f=>'3 '+f).join('\n')+'\n'}
function xyzOut(){return allP().P.join('\n')+'\n'}
function pcdOut(){const{P,np}=allP();return '# .PCD v0.7 - Point Cloud Data file format\nVERSION 0.7\nFIELDS x y z\nSIZE 4 4 4\nTYPE F F F\nCOUNT 1 1 1\nWIDTH '+np+'\nHEIGHT 1\nVIEWPOINT 0 0 0 1 0 0 0\nPOINTS '+np+'\nDATA ascii\n'+P.join('\n')+'\n'}
function x3dOut(){return '<?xml version="1.0" encoding="UTF-8"?>\n<X3D profile="Immersive" version="3.3"><Scene>\n'+soup().map(s=>'<Shape><Appearance><Material diffuseColor="'+s.col.map(fx).join(' ')+'"/></Appearance><IndexedFaceSet solid="false" coordIndex="'+Array.from({length:s.I.length/3},(_,i)=>s.I[i*3]+' '+s.I[i*3+1]+' '+s.I[i*3+2]+' -1').join(' ')+'"><Coordinate point="'+rows(s.p,3).join(', ')+'"/></IndexedFaceSet></Shape>\n').join('')+'</Scene></X3D>\n'}
function amfOut(){return '<?xml version="1.0" encoding="UTF-8"?>\n<amf unit="meter" version="1.1">\n'+soup().map((s,k)=>'<object id="'+k+'"><mesh><vertices>'+Array.from({length:s.n},(_,i)=>'<vertex><coordinates><x>'+fx(s.p[i*3])+'</x><y>'+fx(s.p[i*3+1])+'</y><z>'+fx(s.p[i*3+2])+'</z></coordinates></vertex>').join('')+'</vertices><volume>'+Array.from({length:s.I.length/3},(_,i)=>'<triangle><v1>'+s.I[i*3]+'</v1><v2>'+s.I[i*3+1]+'</v2><v3>'+s.I[i*3+2]+'</v3></triangle>').join('')+'</volume></mesh></object>\n').join('')+'</amf>\n'}
function vtpOut(){const S=soup(),P=[],C=[],O=[];let np=0,o=0;S.forEach(s=>{for(const r of rows(s.p,3))P.push(r);for(const f of tri(s,np)){C.push(f);o+=3;O.push(o)}np+=s.n});
 return '<?xml version="1.0"?>\n<VTKFile type="PolyData" version="0.1" byte_order="LittleEndian">\n<PolyData><Piece NumberOfPoints="'+np+'" NumberOfPolys="'+O.length+'" NumberOfVerts="0" NumberOfLines="0" NumberOfStrips="0">\n<Points><DataArray type="Float32" NumberOfComponents="3" format="ascii">\n'+P.join('\n')+'\n</DataArray></Points>\n<Polys><DataArray type="Int32" Name="connectivity" format="ascii">\n'+C.join('\n')+'\n</DataArray><DataArray type="Int32" Name="offsets" format="ascii">\n'+O.join(' ')+'\n</DataArray></Polys>\n</Piece></PolyData></VTKFile>\n'}
