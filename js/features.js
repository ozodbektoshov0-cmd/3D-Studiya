/* ---- Blender uslubidagi qo’shimchalar ---- */
var bh=new THREE.BoxHelper(new THREE.Object3D(),0xffa028);S.add(bh);
const H=window.CMD?CMD.undoStack:[],Y=window.CMD?CMD.redoStack:[];
const hist=(u,r,l)=>window.CMD?CMD.register(u,r,l):(H.push({u,r}),Y.length=0);
const undo=()=>{if(window.CMD)return CMD.undo();const a=H.pop();if(a){a.u();Y.push(a);refresh()}};
const redo=()=>{if(window.CMD)return CMD.redo();const a=Y.pop();if(a){a.r();H.push(a);refresh()}};
$('#undo').onclick=undo;$('#redo').onclick=redo;
if(window.CMD){
 const syncHistUi=s=>{
  const ub=$('#undo'),rb=$('#redo');
  if(ub){ub.disabled=!s.canUndo;ub.title=s.undoLabel||'Ctrl+Z'}
  if(rb){rb.disabled=!s.canRedo;rb.title=s.redoLabel||'Ctrl+Y'}
 };
 CMD.onChange(syncHistUi);
 syncHistUi({canUndo:CMD.canUndo(),canRedo:CMD.canRedo(),undoLabel:CMD.undoLabel(),redoLabel:CMD.redoLabel()});
}
const pose=o=>({o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}),put=a=>{a.o.position.copy(a.p);a.o.quaternion.copy(a.q);a.o.scale.copy(a.s);sync()};
let p0=null;tc.addEventListener('mouseDown',()=>p0=!window.em&&!(tc.object&&tc.object.userData&&tc.object.userData.grp)&&sel&&pose(sel));
tc.addEventListener('mouseUp',()=>{if(p0&&sel===p0.o){const a=p0,b=pose(sel);hist(()=>put(a),()=>put(b),'Transformatsiya')}});
tc.addEventListener('objectChange',()=>sync());
function add(o,par=root){if(window.CMD){CMD.execute({label:'Qo’shish: '+(o.name||'obyekt'),execute:()=>par.add(o),undo:()=>{if(sel===o)select(null);par.remove(o)},redo:()=>par.add(o)})}else{par.add(o);hist(()=>{if(sel===o)select(null);par.remove(o)},()=>par.add(o))}select(o);$('#hint').style.display='none'}
$('#del').onclick=()=>{if(!sel)return;const o=sel,p=o.parent;select(null);if(window.CMD){CMD.execute({label:'O’chirish: '+(o.name||'obyekt'),execute:()=>p.remove(o),undo:()=>p.add(o),redo:()=>p.remove(o)})}else{p.remove(o);hist(()=>p.add(o),()=>p.remove(o))}refresh()};
const PR={Kub:()=>new THREE.BoxGeometry(1,1,1),Shar:()=>new THREE.SphereGeometry(.6,32,16),Silindr:()=>new THREE.CylinderGeometry(.5,.5,1,32),Konus:()=>new THREE.ConeGeometry(.5,1,32),Halqa:()=>new THREE.TorusGeometry(.5,.2,16,48),Tekislik:()=>new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2)};
Object.entries(PR).forEach(([n,g])=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>{const m=new THREE.Mesh(g(),new THREE.MeshStandardMaterial({color:0xcccccc,side:2}));m.name=n;add(m)};$('#addm').append(b)});
$('#dup').onclick=()=>{if(!sel)return;const d=sel.clone(),M=sel.material;d.material=Array.isArray(M)?M.map(x=>x.clone()):M.clone();d.geometry=sel.geometry.clone();d.name=sel.name+'.001';d.position.x+=.3;add(d,sel.parent)};
document.addEventListener('click',e=>document.querySelectorAll('details.mn[open]').forEach(d=>{if(!d.contains(e.target)||e.target.closest('button,label.it'))d.open=false}));
const X=$('#xf'),I={};
[['Joy','p'],['Burilish','r'],['O’lcham','s']].forEach(([l,k])=>{const s=document.createElement('span');s.textContent=l;X.append(s);
 for(let i=0;i<3;i++){const e=document.createElement('input');e.type='number';e.step=k=='r'?5:.1;I[k+i]=e;
  e.onchange=()=>{if(!sel)return;const a=pose(sel),v=[0,1,2].map(j=>+I[k+j].value||0);
   k=='p'?sel.position.set(...v):k=='r'?sel.rotation.set(...v.map(x=>x*Math.PI/180)):sel.scale.set(...v);const b=pose(sel);hist(()=>put(a),()=>put(b),'Transformatsiya')};X.append(e)}});
function sync(){if(!sel)return;const e=sel.rotation,r={x:e.x*180/Math.PI,y:e.y*180/Math.PI,z:e.z*180/Math.PI};
 [sel.position,r,sel.scale].forEach((o,j)=>['x','y','z'].forEach((c,i)=>I['prs'[j]+i].value=+o[c].toFixed(3)));
 const m=mats(sel)[0];if(m)[['rg','roughness'],['mt','metalness'],['op','opacity']].forEach(([id,k])=>{if(m[k]!=null)$('#'+id).value=m[k]})}
['rg:roughness','mt:metalness','op:opacity'].forEach(s=>{
 const[id,k]=s.split(':'),el=$('#'+id);let snap=null;
 const take=()=>{if(!sel)return null;return mats(sel).map(m=>({m,v:m[k],tr:m.transparent}))};
 el.onpointerdown=()=>{snap=take()};
 el.onfocus=()=>{if(!snap)snap=take()};
 el.oninput=e=>{if(!snap)snap=take();if(sel)mats(sel).forEach(m=>{if(m[k]!=null){m[k]=+e.target.value;if(k=='opacity')m.transparent=m.opacity<1}})};
 el.onchange=()=>{if(!sel||!snap)return;const a=snap,b=take();snap=null;const apply=L=>L.forEach(x=>{if(x.m[k]!=null){x.m[k]=x.v;if(k=='opacity')x.m.transparent=x.tr}});hist(()=>apply(a),()=>apply(b),'Material: '+k);sync()};
});
$('#org').onclick=()=>{if(!sel||!sel.geometry)return;const o=sel,g=o.geometry;g.computeBoundingBox();const c=g.boundingBox.getCenter(new THREE.Vector3());
 const og=g,ng=g.clone().translate(-c.x,-c.y,-c.z),op=o.position.clone(),np=op.clone().add(c.clone().multiply(o.scale).applyQuaternion(o.quaternion));
 const run=fwd=>{o.geometry=fwd?ng:og;o.position.copy(fwd?np:op);sync()};
 if(window.CMD)CMD.execute({label:'Markazni o’rnatish',execute:()=>run(true),redo:()=>run(true),undo:()=>run(false)});
 else{run(true);hist(()=>run(false),()=>run(true),'Markazni o’rnatish')}
};
$('#smo').onclick=()=>{if(!sel)return;const ms=mats(sel),a=ms.map(m=>!!m.flatShading),b=a.map(v=>!v);
 const set=v=>ms.forEach((m,i)=>{m.flatShading=v[i];m.needsUpdate=true});
 if(window.CMD)CMD.execute({label:'Silliq / qirrali',execute:()=>set(b),redo:()=>set(b),undo:()=>set(a)});
 else{set(b);hist(()=>set(a),()=>set(b),'Silliq / qirrali')}
};
$('#mir').onclick=()=>{if(sel){const a=pose(sel);sel.scale.x*=-1;const b=pose(sel);hist(()=>put(a),()=>put(b),'Ko’zgu X');sync()}};
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{const d=cam.position.distanceTo(ctl.target),v=new THREE.Vector3(...b.dataset.v.split(',').map(Number)).normalize();cam.position.copy(ctl.target).addScaledVector(v,d)});
let ortho=false;const T=Math.tan(25*Math.PI/180)/Math.tan(Math.PI/180);
function setOrtho(b){if(b==ortho)return;cam.position.sub(ctl.target).multiplyScalar(b?T:1/T).add(ctl.target);cam.fov=b?2:50;cam.far=b?1e5:5000;cam.updateProjectionMatrix();ortho=b;$('#ortho').classList.toggle('on',b)}
const f0=fit;fit=o=>{const w=ortho;setOrtho(false);f0(o);if(w)setOrtho(true)};
$('#ortho').onclick=()=>setOrtho(!ortho);
$('#grid').onclick=e=>{grid.visible=axs.visible=e.target.classList.toggle('on')};
$('#snap').onclick=e=>{const b=e.target.classList.toggle('on');tc.setTranslationSnap(b?.5:null);tc.setRotationSnap(b?Math.PI/12:null);tc.setScaleSnap(b?.1:null)};
$('#rnd').onclick=()=>{const v=[grid.visible,axs.visible];grid.visible=axs.visible=bh.visible=tc.visible=false;R.render(S,cam);
 cv.toBlob(b=>saveBlob(b,name+'.png'));
 grid.visible=v[0];axs.visible=v[1];tc.visible=true;toast('Render (PNG) tayyor')};
addEventListener('keydown',e=>{if(/INPUT|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase(),c=e.ctrlKey||e.metaKey;
 if(c&&k=='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(c&&k=='y'){e.preventDefault();redo()}
 else if(e.shiftKey&&k=='d'){e.preventDefault();$('#dup').click()}else if(k=='x'&&!c)$('#del').click();else if(k=='f'&&!c)fit(sel||undefined);
 else{const v={1:'0,0,1',3:'1,0,0',7:'0,1,.001'}[e.key];if(v&&e.code.startsWith('Numpad'))document.querySelector('[data-v="'+v+'"]').click()}});
