/* ---- Edit mode: nuqtalarni tanlash va siljitish ---- */
var em=null;let ms=false;const pv=new THREE.Object3D();S.add(pv);
const s0=select;select=o=>{em&&editOff();s0(o)};
function paint(){const C=em.pts.geometry.getAttribute('color');
 for(let i=0;i<em.G.length;i++){const o=em.s.has(i);C.setXYZ(i,1,o?.63:.85,o?.12:.85)}C.needsUpdate=true;
 if(!em.s.size){em.B=null;tc.detach();return}
 const c=new THREE.Vector3();em.s.forEach(i=>c.add(em.v(i)));c.divideScalar(em.s.size);
 pv.position.copy(sel.localToWorld(c));em.st=pv.position.clone();em.B=new Map([...em.s].map(i=>[i,em.v(i)]));tc.attach(pv);tc.setMode('translate')}
function editOn(){
 if(em)return;if(!sel||!sel.geometry)return toast('Avval mesh tanlang');
 const A=sel.geometry.getAttribute('position'),mp=new Map();
 for(let i=0;i<A.count;i++){const k=A.getX(i).toFixed(5)+','+A.getY(i).toFixed(5)+','+A.getZ(i).toFixed(5);(mp.get(k)||mp.set(k,[]).get(k)).push(i)}
 const G=[...mp.values()];if(G.length>20000)return toast('Mesh juda katta (20 000 nuqtagacha)');
 const P=new Float32Array(G.length*3);G.forEach((ix,i)=>P.set([A.getX(ix[0]),A.getY(ix[0]),A.getZ(ix[0])],i*3));
 const gm=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(P,3)).setAttribute('color',new THREE.BufferAttribute(new Float32Array(G.length*3),3));
 const pts=new THREE.Points(gm,new THREE.PointsMaterial({size:6,sizeAttenuation:false,vertexColors:true,depthTest:false}));pts.renderOrder=9;pts.frustumCulled=false;sel.add(pts);
 em={G,P,pts,s:new Set(),U:[],B:null,w:!wire,v:i=>new THREE.Vector3(P[i*3],P[i*3+1],P[i*3+2])};
 if(!wire)$('#wf').click();$('#edit').classList.add('on');paint();toast('Edit mode: nuqtani bosing (Esc — chiqish)')}
function editOff(){if(!em)return;const e=em;em=null;sel.remove(e.pts);e.pts.geometry.dispose();tc.attach(sel);$('#edit').classList.remove('on');if(e.w)$('#wf').click()}
function eUndo(){const s=em.U.pop();if(!s)return;const g=sel.geometry,A=g.getAttribute('position');A.array.set(s);A.needsUpdate=true;
 em.G.forEach((ix,i)=>{const k=ix[0]*3;em.P.set([s[k],s[k+1],s[k+2]],i*3)});em.pts.geometry.getAttribute('position').needsUpdate=true;g.computeVertexNormals();paint()}
tc.addEventListener('mouseDown',()=>{if(em)em.U.push(sel.geometry.getAttribute('position').array.slice())});
tc.addEventListener('mouseUp',()=>{if(em){const g=sel.geometry;g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox()}});
tc.addEventListener('objectChange',()=>{if(!em||!em.B)return;
 const d=pv.position.clone().sub(em.st).applyMatrix3(new THREE.Matrix3().setFromMatrix4(sel.matrixWorld).invert());
 const A=sel.geometry.getAttribute('position'),PA=em.pts.geometry.getAttribute('position');
 em.B.forEach((b,i)=>{const x=b.x+d.x,y=b.y+d.y,z=b.z+d.z;PA.setXYZ(i,x,y,z);em.G[i].forEach(k=>A.setXYZ(k,x,y,z))});A.needsUpdate=PA.needsUpdate=true});
cv.addEventListener('pointerup',e=>{if(!em||!dn||tc.axis||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>5)return;
 const r=cv.getBoundingClientRect(),v=new THREE.Vector3();let best=-1,bd=16;
 em.G.forEach((_,i)=>{v.set(em.P[i*3],em.P[i*3+1],em.P[i*3+2]).applyMatrix4(sel.matrixWorld).project(cam);if(v.z>1)return;
  const d=Math.hypot((v.x+1)/2*r.width-(e.clientX-r.left),(1-v.y)/2*r.height-(e.clientY-r.top));if(d<bd){bd=d;best=i}});
 const add=e.shiftKey||ms;if(!add)em.s.clear();
 if(best>=0){em.s.has(best)&&add?em.s.delete(best):em.s.add(best)}paint()});
$('#edit').onclick=()=>em?editOff():editOn();
$('#msel').onclick=e=>ms=e.target.classList.toggle('on');
addEventListener('keydown',e=>{if(/INPUT|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();
 if(k=='tab'){e.preventDefault();e.stopImmediatePropagation();em?editOff():editOn()}
 else if(em&&(k=='escape'||k=='x'||k=='delete'||(e.ctrlKey&&k=='z'))){e.preventDefault();e.stopImmediatePropagation();if(k=='escape')editOff();else if(k=='z')eUndo()}},true);
