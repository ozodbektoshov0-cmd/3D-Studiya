/* ---- yuklash ---- */
/*TN-start*/
/* Tekstura nomini saqlash: rasm fayli topilmasa ham nom material.userData.tex ga yoziladi (DFF/TXD eksportida ishlatiladi) */
(function(){const L=THREE.TextureLoader.prototype,o=L.load;
 L.load=function(u,...a){const t=o.call(this,u,...a);try{if(t&&typeof u=='string'&&!/^(blob|data):/i.test(u))t.userData.src=u}catch(e){}return t}})();
const texBase=u=>{u=String(u||'').split(/[?#]/)[0];try{u=decodeURIComponent(u)}catch(e){}return u.split(/[\\/]/).pop().replace(/\.[^.]+$/,'')};
function gltfTexNames(g){try{const P=g.parser,J=P.json;g.scene.traverse(m=>{if(!m.isMesh)return;[].concat(m.material).forEach(x=>{const t=x&&x.map;if(!t||t.userData.uri)return;
 const a=P.associations.get(t);if(!a||a.textures==null)return;const td=J.textures[a.textures],sd=td&&J.images&&J.images[td.source];
 if(sd){if(sd.uri&&!/^data:/i.test(sd.uri))t.userData.uri=sd.uri;else if(sd.name)t.userData.uri=sd.name}})})}catch(e){}}
function texNames(o){o.traverse(m=>{if(!m.isMesh)return;[].concat(m.material).forEach(x=>{if(!x||!x.userData||x.userData.tex)return;const t=x.map;if(!t)return;
 const n=texBase(t.userData&&(t.userData.src||t.userData.uri))||t.name||'';if(n)x.userData.tex=n})})}
/*TN-end*/
const LZ={"fbx":["FBXLoader.js"],"dae":["ColladaLoader.js"],"wrl":["chevrotain.min.js","VRMLLoader.js"],"vrml":["chevrotain.min.js","VRMLLoader.js"],"vtk":["VTKLoader.js"],"vtp":["VTKLoader.js"],"3mf":["3MFLoader.js"],"3ds":["TDSLoader.js"],"amf":["AMFLoader.js"],"lwo":["IFFParser.js","LWO2Parser.js","LWO3Parser.js","LWOLoader.js"],"pcd":["PCDLoader.js"],"vox":["VOXLoader.js"],"pmx":["mmdparser.min.js","MMDLoader.js"],"pmd":["mmdparser.min.js","MMDLoader.js"]};
async function load(f){
 const ext=f.name.split('.').pop().toLowerCase(),buf=/^(rpf|yft|ydr|ytd)$/.test(ext)?null:await f.arrayBuffer(),M=()=>new THREE.MeshStandardMaterial({color:0xb0b8c4,side:2});let o;
 for(const n of LZ[ext]||[])await lazy('vendor/'+n);
 if(ext=='glb'||ext=='gltf')o=await new Promise((ok,no)=>new THREE.GLTFLoader().parse(ext=='gltf'?new TextDecoder().decode(buf):buf,'',g=>{g.scene.animations=g.animations;gltfTexNames(g);ok(g.scene)},no));
 else if(ext=='obj')o=new THREE.OBJLoader().parse(new TextDecoder().decode(buf));
 else if(ext=='stl')o=new THREE.Mesh(new THREE.STLLoader().parse(buf),M());
 else if(ext=='ply'){const g=new THREE.PLYLoader().parse(buf);g.computeVertexNormals();const m=M();m.vertexColors=!!g.getAttribute('color');o=new THREE.Mesh(g,m)}
 else if(ext=='rpf'){await rpf(f);return}
 else if(/^(png|jpe?g|webp)$/.test(ext)){await img(f);return}
 else if(ext=='fbx')o=new THREE.FBXLoader().parse(buf,'');
 else if(ext=='dae')o=new THREE.ColladaLoader().parse(new TextDecoder().decode(buf),'').scene;
 else if(ext=='wrl'||ext=='vrml')o=new THREE.VRMLLoader().parse(new TextDecoder().decode(buf),'');
 else if(ext=='vtk'){const g=new THREE.VTKLoader().parse(buf);if(!g.getAttribute('normal'))g.computeVertexNormals();o=new THREE.Mesh(g,M())}
 else if(ext=='3mf')o=new THREE.ThreeMFLoader().parse(buf);
 else if(/^usd[az]?$/.test(ext))o=usdImp(buf);
 else if(EXT2.test(ext))o=await imp2(ext,buf);
 else if(ext=='skp')o=await skpImp(buf);
 else if(ext=='max')o=maxImp(buf);
 else if(ext=='z3d')o=z3dImp(buf);
 else if(ext=='blend')throw Error('.blend yopiq format, brauzerda o’qib bo’lmaydi — Blender’da GLB yoki FBX qilib saqlang');
 else if(ext=='ytd'){toast(f.name+': teksturalar ochilmoqda…');await ytd(f);return}
 else if(ext=='ydr'){toast(f.name+': GTA V modeli ochilmoqda…');o=await yft(f,true)}
 else if(ext=='yft'){toast(f.name+': GTA V modeli ochilmoqda…');o=await yft(f)}
 else if(ext=='dff')o=dff(buf);
 else if(ext=='txd'){txd(buf);return}
 else throw Error('“.'+ext+'” formati hozircha qo’llanmaydi (YTD/YFT/YDD hozircha yo’q)');
 texNames(o);
 o.name=f.name.replace(/\.[^.]+$/,'');name=o.name;root.add(o);o.animations&&o.animations.length&&anim(o);$('#hint').style.display='none';refresh();fit(o);if(/^(yft|ydr)$/.test(ext))missTex();
 if(ext=='z3d')toast('Z3D: '+z3dImp.count+' obyekt, '+z3dImp.tris+' uchburchak'+(z3dImp.info.length?' ('+z3dImp.info.join('; ')+')':''));
 if(ext=='max')toast('MAX: '+Math.round(maxImp.tris)+' uchburchak'+(maxImp.info.length?' ('+maxImp.info.join('; ')+')':''));
}
async function loadAll(fs){for(const f of fs){try{await load(f)}catch(e){toast(f.name+': '+(e.message||e))}}}
$('#f').onchange=e=>{loadAll([...e.target.files]);e.target.value=''};
vp.ondragover=e=>{e.preventDefault();vp.classList.add('drag')};vp.ondragleave=()=>vp.classList.remove('drag');
vp.ondrop=e=>{e.preventDefault();vp.classList.remove('drag');loadAll([...e.dataTransfer.files])};

/* kutilmagan xatolarni ham ekranda ko'rsatish (ilovada konsol yo'q) */
addEventListener('unhandledrejection',e=>{try{toast('Xato: '+((e.reason&&e.reason.message)||e.reason))}catch(x){}});
