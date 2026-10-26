/* ---- eksport ---- */
$('#ex').onclick=()=>{
 if(!meshes().length)return toast('Avval model oching');
 if($('#onlysel')&&$('#onlysel').checked&&!pick().length)return toast('“Faqat tanlanganlar”: avval obyekt tanlang');
 if(window.xrayPause)xrayPause();const fmt=$('#fmt').value,r0=root.rotation.x;tc.detach();const dm=meshes().filter(m=>m.userData.dummy&&fmt!='dff');dm.forEach(m=>m.visible=false);
 let hid=[];if($('#onlysel')&&$('#onlysel').checked){const ps=new Set(pick());hid=meshes().filter(m=>m.visible&&!ps.has(m)&&!(m.userData.dummy&&fmt=='dff'));hid.forEach(m=>m.visible=false)}
 if(fmt=='dff')try{ensureTexNames()}catch(e){}
 root.rotation.x=$('#zup').checked&&fmt!='dff'&&fmt!='skp'?Math.PI/2:0;root.updateMatrixWorld(true);
 const done=(d,mime)=>{if(window.xrayResume)xrayResume();hid.forEach(m=>m.visible=true);dm.forEach(m=>m.visible=true);root.rotation.x=r0;root.updateMatrixWorld(true);if(sel)tc.attach(sel);
  saveBlob(new Blob([d],{type:mime}),name+'.'+fmt);
  if(fmt=='dff'&&$('#txalso')&&$('#txalso').checked)setTimeout(async()=>{try{const b=await txdOut();saveBlob(new Blob([b],{type:'application/octet-stream'}),name+'.txd');toast('TXD ham saqlandi (teksturalar)')}catch(e){}},600);const xi=fmt=='dff'?dffOut.info:fmt=='skp'?skpOut.info:null;toast(fmt.toUpperCase()+' tayyor'+(xi&&xi.length?' ('+xi.join(', ')+')':''))};
 const fail=e=>{if(window.xrayResume)xrayResume();hid.forEach(m=>m.visible=true);dm.forEach(m=>m.visible=true);root.rotation.x=r0;toast('Xato: '+(e.message||e))};
 try{
  if(fmt=='glb'||fmt=='gltf'){const x=new THREE.GLTFExporter(),o={binary:fmt=='glb',animations:window.CLIPS||[]},cb=r=>done(fmt=='glb'?r:JSON.stringify(r),'model/gltf');
   x.parse.length>3?x.parse(root,cb,fail,o):x.parse(root,cb,o)}
  else if(fmt=='dff')done(dffOut(),'application/octet-stream');
  else if(fmt=='skp')skpOut().then(b=>done(b,'application/octet-stream'),fail);
  else if(fmt=='dae')new THREE.ColladaExporter().parse(root,r=>done(r.data,'model/vnd.collada+xml'));
  else if(fmt=='usdz')new THREE.USDZExporter().parse(root).then(b=>done(b,'model/vnd.usdz+zip'),fail);
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
