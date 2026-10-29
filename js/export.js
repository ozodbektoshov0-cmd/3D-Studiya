/* USDZ eksporti faqat MeshStandardMaterial’ni yozadi (OBJ/STL/PLY/FBX kabi Phong/Lambert/Basic materiallar tashlab ketilib, bo’sh fayl chiqardi).
   Eksport vaqtida vaqtincha Standard materialga almashtiramiz, so’ng qaytaramiz. */
function usdzMats(){const bk=[];
 const cv=m=>{if(!m||m.isMeshStandardMaterial)return m;const s=new THREE.MeshStandardMaterial({color:m.color?m.color.clone():new THREE.Color(0xcccccc),map:m.map||null,opacity:m.opacity==null?1:m.opacity,transparent:!!m.transparent,roughness:.8,metalness:0,side:m.side});s.name=m.name||'';return s};
 root.traverse(o=>{if(!o.isMesh)return;bk.push([o,o.material]);o.material=Array.isArray(o.material)?o.material.map(cv):cv(o.material)});
 return()=>bk.forEach(([o,m])=>o.material=m)}
/* ---- eksport ---- */
$('#ex').onclick=()=>{
 if(!meshes().length)return toast('Avval model oching');
 if($('#onlysel')&&$('#onlysel').checked&&!pick().length)return toast('“Faqat tanlanganlar”: avval obyekt tanlang');
 if(window.xrayPause)xrayPause();const fmt=$('#fmt').value,r0=root.rotation.x;tc.detach();const dm=meshes().filter(m=>m.userData.dummy&&fmt!='dff');dm.forEach(m=>m.visible=false);
 let hid=[];if($('#onlysel')&&$('#onlysel').checked){const ps=new Set(pick());hid=meshes().filter(m=>m.visible&&!ps.has(m)&&!(m.userData.dummy&&fmt=='dff'));hid.forEach(m=>m.visible=false)}
 if(fmt=='dff')try{ensureTexNames()}catch(e){}
 root.rotation.x=$('#zup').checked&&fmt!='dff'&&fmt!='skp'&&fmt!='z3d'?Math.PI/2:0;root.updateMatrixWorld(true);
 const done=(d,mime)=>{if(window.xrayResume)xrayResume();hid.forEach(m=>m.visible=true);dm.forEach(m=>m.visible=true);root.rotation.x=r0;root.updateMatrixWorld(true);if(sel)tc.attach(sel);
  saveBlob(new Blob([d],{type:mime}),name+'.'+fmt);
  if(fmt=='dff'&&$('#txalso')&&$('#txalso').checked)setTimeout(async()=>{try{const b=await txdOut();saveBlob(new Blob([b],{type:'application/octet-stream'}),name+'.txd');toast('TXD ham saqlandi (teksturalar)')}catch(e){}},600);const xi=fmt=='dff'?dffOut.info:fmt=='skp'?skpOut.info:fmt=='z3d'?z3dOut.info:null;toast(fmt.toUpperCase()+' tayyor'+(xi&&xi.length?' ('+xi.join(', ')+')':''))};
 const fail=e=>{if(window.xrayResume)xrayResume();hid.forEach(m=>m.visible=true);dm.forEach(m=>m.visible=true);root.rotation.x=r0;toast('Xato: '+(e.message||e))};
 try{
  if(fmt=='glb'||fmt=='gltf'){const x=new THREE.GLTFExporter(),o={binary:fmt=='glb',animations:window.CLIPS||[]},cb=r=>done(fmt=='glb'?r:JSON.stringify(r),'model/gltf');
   x.parse.length>3?x.parse(root,cb,fail,o):x.parse(root,cb,o)}
  else if(fmt=='dff')done(dffOut(),'application/octet-stream');
  else if(fmt=='skp')skpOut().then(b=>done(b,'application/octet-stream'),fail);
  else if(fmt=='z3d')done(z3dOut(),'application/octet-stream');
  else if(fmt=='dae')new THREE.ColladaExporter().parse(root,r=>done(r.data,'model/vnd.collada+xml'));
  else if(fmt=='usdz'){const rs=usdzMats();new THREE.USDZExporter().parse(root).then(b=>{rs();done(b,'model/vnd.usdz+zip')},e=>{rs();fail(e)})}
  else if(fmt=='fbx')done(fbxOut($('#zup').checked),'application/octet-stream');
  else if(fmt=='vtk')done(vtkOut(),'text/plain');
  else if(fmt=='wrl')done(wrlOut(),'model/vrml');
  else if(fmt=='usda'||fmt=='usd')done(usdaOut($('#zup').checked),'text/plain');
  else if(fmt=='3mf')done(x3mfOut(),'model/3mf');
  else if(fmt=='off')done(offOut(),'text/plain');
  else if(fmt=='x3d')done(x3dOut(),'model/x3d+xml');
  else if(fmt=='xyz')done(xyzOut(),'text/plain');
  else if(fmt=='pcd')done(pcdOut(),'text/plain');
  else if(fmt=='amf')done(amfOut(),'application/xml');
  else if(fmt=='vtp')done(vtpOut(),'application/xml');
  else if(fmt=='3dm')dmOut().then(b=>done(b,'application/octet-stream'),fail);
  else if(fmt=='obj')done(new THREE.OBJExporter().parse(root),'text/plain');
  else if(fmt=='stl')done(new THREE.STLExporter().parse(root,{binary:true}),'model/stl');
  else new THREE.PLYExporter().parse(root,r=>done(r,'application/octet-stream'),{binary:true});
 }catch(e){fail(e)}
};
