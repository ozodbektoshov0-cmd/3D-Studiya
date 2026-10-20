/* ---- eksport ---- */
$('#ex').onclick=()=>{
 if(!meshes().length)return toast('Avval model oching');
 const fmt=$('#fmt').value,r0=root.rotation.x;tc.detach();
 root.rotation.x=$('#zup').checked&&fmt!='dff'?Math.PI/2:0;root.updateMatrixWorld(true);
 const done=(d,mime)=>{root.rotation.x=r0;root.updateMatrixWorld(true);if(sel)tc.attach(sel);
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([d],{type:mime}));a.download=name+'.'+fmt;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5e3);toast(fmt.toUpperCase()+' tayyor')};
 const fail=e=>{root.rotation.x=r0;toast('Xato: '+(e.message||e))};
 try{
  if(fmt=='glb'||fmt=='gltf'){const x=new THREE.GLTFExporter(),o={binary:fmt=='glb'},cb=r=>done(fmt=='glb'?r:JSON.stringify(r),'model/gltf');
   x.parse.length>3?x.parse(root,cb,fail,o):x.parse(root,cb,o)}
  else if(fmt=='dff')done(dffOut(),'application/octet-stream');
  else if(fmt=='obj')done(new THREE.OBJExporter().parse(root),'text/plain');
  else if(fmt=='stl')done(new THREE.STLExporter().parse(root,{binary:true}),'model/stl');
  else new THREE.PLYExporter().parse(root,r=>done(r,'application/octet-stream'),{binary:true});
 }catch(e){fail(e)}
};
