/* ---- yuklash ---- */
async function load(f){
 const ext=f.name.split('.').pop().toLowerCase(),buf=ext=='rpf'?null:await f.arrayBuffer(),M=()=>new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2});let o;
 if(ext=='glb'||ext=='gltf')o=await new Promise((ok,no)=>new THREE.GLTFLoader().parse(ext=='gltf'?new TextDecoder().decode(buf):buf,'',g=>ok(g.scene),no));
 else if(ext=='obj')o=new THREE.OBJLoader().parse(new TextDecoder().decode(buf));
 else if(ext=='stl')o=new THREE.Mesh(new THREE.STLLoader().parse(buf),M());
 else if(ext=='ply'){const g=new THREE.PLYLoader().parse(buf);g.computeVertexNormals();const m=M();m.vertexColors=!!g.getAttribute('color');o=new THREE.Mesh(g,m)}
 else if(ext=='rpf'){await rpf(f);return}
 else if(ext=='yft')o=await yft(f);
 else if(ext=='dff')o=dff(buf);
 else if(ext=='txd'){txd(buf);return}
 else throw Error('“.'+ext+'” formati hozircha qo’llanmaydi (YTD/YFT/YDD hozircha yo’q)');
 o.name=f.name.replace(/\.[^.]+$/,'');name=o.name;root.add(o);$('#hint').style.display='none';refresh();fit(o);
}
async function loadAll(fs){for(const f of fs){try{await load(f)}catch(e){toast(f.name+': '+(e.message||e))}}}
$('#f').onchange=e=>{loadAll([...e.target.files]);e.target.value=''};
vp.ondragover=e=>{e.preventDefault();vp.classList.add('drag')};vp.ondragleave=()=>vp.classList.remove('drag');
vp.ondrop=e=>{e.preventDefault();vp.classList.remove('drag');loadAll([...e.dataTransfer.files])};
