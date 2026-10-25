/* ---- Asboblar: poligon, avto razmer, attach/detach, dummy, material, tekstura ---- */
var MS=new Set();
const pick=()=>{const a=new Set(MS);sel&&a.add(sel);return[...a].filter(o=>o.isMesh)};
const real=()=>pick().filter(o=>!o.userData.dummy);
function mkDummy(name){const d=new THREE.Mesh(new THREE.OctahedronGeometry(.12),new THREE.MeshBasicMaterial({color:0xffa028,wireframe:true,depthTest:false}));d.userData.dummy=true;d.name=name||'dummy';d.renderOrder=8;return d}
$('#dmy').onclick=()=>{const n=prompt('Dummy nomi (masalan wheel_lf_dummy)','dummy');if(!n)return;const d=mkDummy(n);if(sel)new THREE.Box3().setFromObject(sel).getCenter(d.position);add(d)};

/* poligon kamaytirish (vertex klasterlash, UV va materiallar saqlanadi) */
function decimate(m,ratio){
 const g=m.geometry,P=g.getAttribute('position'),n=P.count,I=g.index?g.index.array:Uint32Array.from({length:n},(_,i)=>i);
 g.computeBoundingBox();const bb=g.boundingBox,sz=bb.getSize(new THREE.Vector3()),mx=Math.max(sz.x,sz.y,sz.z)||1,T=I.length/3*ratio;
 const gr=g.groups.length?g.groups:[{start:0,count:I.length,materialIndex:0}];
 const run=c=>{const mp=new Map(),rep=[],map=new Int32Array(n);
  for(let i=0;i<n;i++){const k=((P.getX(i)-bb.min.x)/c|0)+','+((P.getY(i)-bb.min.y)/c|0)+','+((P.getZ(i)-bb.min.z)/c|0);let r=mp.get(k);if(r===undefined){r=rep.length;mp.set(k,r);rep.push(i)}map[i]=r}
  const out=[],G=[];gr.forEach(q=>{const s=out.length;for(let i=q.start;i<q.start+q.count;i+=3){const a=map[I[i]],b=map[I[i+1]],d=map[I[i+2]];if(a!=b&&b!=d&&a!=d)out.push(a,b,d)}G.push([s,out.length-s,q.materialIndex])});
  return{rep,out,G}};
 let lo=mx/4000,hi=mx/2,best=run(lo);
 for(let k=0;k<16;k++){const c=(lo+hi)/2,r=run(c);if(r.out.length/3>T)lo=c;else{hi=c;best=r}}
 if(!best.out.length)return null;
 const ng=new THREE.BufferGeometry();
 ['position','normal','uv'].forEach(nm=>{const a=g.getAttribute(nm);if(!a)return;const s=a.itemSize,f=new Float32Array(best.rep.length*s);
  best.rep.forEach((v,i)=>{for(let c=0;c<s;c++)f[i*s+c]=[a.getX,a.getY,a.getZ][c].call(a,v)});ng.setAttribute(nm,new THREE.BufferAttribute(f,s))});
 ng.setIndex(best.out);if(g.groups.length)best.G.forEach(q=>q[1]&&ng.addGroup(q[0],q[1],q[2]));
 if(!ng.getAttribute('normal'))ng.computeVertexNormals();return ng;
}
$('#decb').onclick=()=>{const L=(real().length?real():meshes().filter(o=>!o.userData.dummy));if(!L.length)return toast('Mesh yo’q');
 const r=Math.min(.95,Math.max(.05,(+$('#dec').value||50)/100)),jobs=[];let a=0,b=0;
 L.forEach(m=>{const g=m.geometry,ng=decimate(m,r);if(ng){a+=(g.index?g.index.count:g.getAttribute('position').count)/3;b+=ng.index.count/3;jobs.push([m,g,ng]);m.geometry=ng}});
 hist(()=>jobs.forEach(([m,g])=>m.geometry=g),()=>jobs.forEach(([m,,ng])=>m.geometry=ng));refresh();toast(Math.round(a)+' → '+Math.round(b)+' uchburchak')};

/* avto razmer: uzun o’q Z, GTA o’lchamiga moslash, yerga qo’yish */
function ground(){root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),c=b.getCenter(new THREE.Vector3());root.children.forEach(o=>o.position.add(new THREE.Vector3(-c.x,-b.min.y,-c.z)))}
function reshape(fn){const ch=[...root.children],a=ch.map(pose);fn(ch);ground();const z=ch.map(pose);hist(()=>a.forEach(put),()=>z.forEach(put));fit();sync()}
$('#asb').onclick=()=>{const v=$('#asz').value,h=v[0]=='h',T=parseFloat(h?v.slice(1):v);root.updateMatrixWorld(true);
 const bb=new THREE.Box3().setFromObject(root);if(bb.isEmpty())return toast('Model yo’q');const s=bb.getSize(new THREE.Vector3()),rot=!h&&s.x>s.z?Math.PI/2:0,k=T/(h?s.y:Math.max(s.x,s.z)),Y=new THREE.Vector3(0,1,0),q=new THREE.Quaternion().setFromAxisAngle(Y,rot);
 reshape(ch=>ch.forEach(o=>{o.position.applyAxisAngle(Y,rot).multiplyScalar(k);o.quaternion.premultiply(q);o.scale.multiplyScalar(k)}));
 toast('Masshtab ×'+k.toFixed(3)+(rot?' · uzun o’q Z ga burildi':''))};
$('#grd').onclick=()=>root.children.length?reshape(()=>0):toast('Model yo’q');

/* attach / detach */
function sub(m,I,ts,mat,nm){const g=m.geometry,mp=new Map(),idx=[],at=['position','normal','uv'].map(k=>g.getAttribute(k)),buf=at.map(()=>[]);
 ts.forEach(t=>{for(let j=0;j<3;j++){const v=I[t*3+j];let r=mp.get(v);if(r===undefined){r=mp.size;mp.set(v,r);at.forEach((a,q)=>{if(a)for(let c=0;c<a.itemSize;c++)buf[q].push([a.getX,a.getY,a.getZ][c].call(a,v))})}idx.push(r)}});
 const ng=new THREE.BufferGeometry();at.forEach((a,q)=>a&&ng.setAttribute(['position','normal','uv'][q],new THREE.BufferAttribute(new Float32Array(buf[q]),a.itemSize)));ng.setIndex(idx);
 const o=new THREE.Mesh(ng,mat);o.name=nm;o.position.copy(m.position);o.quaternion.copy(m.quaternion);o.scale.copy(m.scale);return o}
$('#det').onclick=()=>{const m=sel;if(!m||!m.isMesh||m.userData.dummy)return toast('Mesh tanlang');
 const g=m.geometry,P=g.getAttribute('position'),I=g.index?g.index.array:Uint32Array.from({length:P.count},(_,i)=>i),nt=I.length/3,lab=new Int32Array(nt),ma=[].concat(m.material),byG=g.groups.length>1;
 if(byG)g.groups.forEach((q,k)=>{for(let t=q.start/3;t<(q.start+q.count)/3;t++)lab[t]=k});
 else{const key=new Map(),id=new Int32Array(P.count);for(let i=0;i<P.count;i++){const k=P.getX(i).toFixed(4)+','+P.getY(i).toFixed(4)+','+P.getZ(i).toFixed(4);let r=key.get(k);if(r===undefined){r=key.size;key.set(k,r)}id[i]=r}
  const par=Int32Array.from({length:key.size},(_,i)=>i),f=x=>{while(par[x]!=x)x=par[x]=par[par[x]];return x},u=(a,b)=>{par[f(a)]=f(b)};
  for(let t=0;t<nt;t++){u(id[I[t*3]],id[I[t*3+1]]);u(id[I[t*3+1]],id[I[t*3+2]])}for(let t=0;t<nt;t++)lab[t]=f(id[I[t*3]])}
 const B=new Map();for(let t=0;t<nt;t++){let a=B.get(lab[t]);if(!a)B.set(lab[t],a=[]);a.push(t)}
 if(B.size<2)return toast('Ajratadigan bo’lak yo’q');if(B.size>300)return toast('Bo’laklar juda ko’p ('+B.size+')');
 const parts=[...B.entries()].map(([k,ts],i)=>sub(m,I,ts,byG?ma[g.groups[k].materialIndex]:ma[0],m.name+'_'+(i+1))),p=m.parent;
 select(null);p.remove(m);parts.forEach(x=>p.add(x));hist(()=>{parts.forEach(x=>p.remove(x));p.add(m)},()=>{p.remove(m);parts.forEach(x=>p.add(x))});select(parts[0]);toast(parts.length+' ta bo’lakka ajratildi')};
$('#att').onclick=()=>{const L=real();if(L.length<2||!L.includes(sel))return toast('Attach: Outliner’da Ctrl/Shift bilan 2+ mesh tanlang');
 const A=sel,Ls=[A,...L.filter(o=>o!=A)];A.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(A.matrixWorld).invert(),mats=[],pos=[],nor=[],uv=[],idx=[],grp=[];let vo=0;
 Ls.forEach(m=>{m.updateMatrixWorld(true);const g=m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld));if(!g.getAttribute('normal'))g.computeVertexNormals();
  const P=g.getAttribute('position'),N=g.getAttribute('normal'),U=g.getAttribute('uv'),I=g.index?g.index.array:Uint32Array.from({length:P.count},(_,i)=>i),mo=mats.length,base=idx.length,gr=g.groups.length?g.groups:[{start:0,count:I.length,materialIndex:0}];
  for(let i=0;i<P.count;i++){pos.push(P.getX(i),P.getY(i),P.getZ(i));nor.push(N.getX(i),N.getY(i),N.getZ(i));uv.push(U?U.getX(i):0,U?U.getY(i):0)}
  gr.forEach(q=>grp.push([base+q.start,q.count,mo+q.materialIndex]));for(const x of I)idx.push(x+vo);vo+=P.count;mats.push(...[].concat(m.material))});
 const ng=new THREE.BufferGeometry();ng.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));ng.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(nor),3));ng.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(uv),2));
 ng.setIndex(idx);grp.forEach(q=>ng.addGroup(...q));const og=A.geometry,om=A.material,rem=Ls.slice(1).map(o=>[o,o.parent]);
 A.geometry=ng;A.material=mats;rem.forEach(([o,p])=>p.remove(o));MS.clear();
 hist(()=>{A.geometry=og;A.material=om;rem.forEach(([o,p])=>p.add(o))},()=>{A.geometry=ng;A.material=mats;rem.forEach(([o,p])=>p.remove(o))});select(A);toast(Ls.length+' ta mesh birlashtirildi')};

/* joyini almashtirish / ikkinchisining joyiga qo’yish */
const wp=o=>o.getWorldPosition(new THREE.Vector3()),setW=(o,w)=>{o.parent.updateWorldMatrix(true,false);o.position.copy(o.parent.worldToLocal(w.clone()))};
function two(fn){const L=pick();if(L.length!=2)return toast('Outliner’da aynan 2 ta obyekt tanlang (Ctrl/Shift)');const a=L.map(pose);fn(L);L.forEach(o=>o.updateMatrixWorld(true));const b=L.map(pose);hist(()=>a.forEach(put),()=>b.forEach(put));sync()}
$('#swp').onclick=()=>two(([a,b])=>{const wa=wp(a),wb=wp(b);setW(a,wb);setW(b,wa)});
$('#mov').onclick=()=>two(([a,b])=>{const t=a==sel?a:b,o=t==a?b:a;setW(t,wp(o))});

/* chrome va boshqa material presetlari */
const ENV=(()=>{const s=new THREE.Scene(),g=new THREE.SphereGeometry(50,32,16),P=g.getAttribute('position'),C=new Float32Array(P.count*3);
 for(let i=0;i<P.count;i++){const y=P.getY(i)/50,t=1-Math.abs(y);C.set(y>0?[.4+.4*t,.55+.3*t,.8+.2*t]:[.15+.4*(1+y),.14+.4*(1+y),.13+.4*(1+y)],i*3)}
 g.setAttribute('color',new THREE.BufferAttribute(C,3));s.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:1,vertexColors:true})));
 [[10,8,-10],[-12,6,6],[0,14,0]].forEach(p=>{const l=new THREE.Mesh(new THREE.BoxGeometry(12,1,6),new THREE.MeshBasicMaterial({color:new THREE.Color(5,5,5)}));l.position.set(...p);l.lookAt(0,0,0);s.add(l)});
 return new THREE.PMREMGenerator(R).fromScene(s,.02).texture})();
const PRE={chrome:m=>{m.metalness=1;m.roughness=.04;m.color.set(0xf2f2f2)},paint:m=>{m.metalness=.6;m.roughness=.22},glass:m=>{m.metalness=.9;m.roughness=.02;m.opacity=.35;m.transparent=true;m.color.set(0xaac4d8)},matte:m=>{m.metalness=0;m.roughness=.9}};
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const k=b.dataset.p,L=$('#allm').checked?meshes().filter(o=>!o.userData.dummy):real();if(!L.length)return toast('Mesh tanlang');
 L.forEach(o=>mats(o).forEach(m=>{if(!m.isMeshStandardMaterial)return;PRE[k](m);m.envMap=k=='matte'?null:ENV;m.envMapIntensity=1;m.needsUpdate=true}));sync()});

/* teksturalar: TXD va PNG/JPG ro’yxati, meshga yopishtirish, PNG saqlash */
function applyT(t){const L=real();if(!L.length)return toast('Avval mesh tanlang');
 L.forEach(o=>{if(!o.geometry.getAttribute('uv'))toast(o.name+': UV yo’q');mats(o).forEach(m=>{m.map=t;m.color.set(0xffffff);m.userData.tex=t.name;m.needsUpdate=true})})}
function texList(){const L=$('#tl');L.textContent='';Object.values(tex).forEach(t=>{const r=document.createElement('div'),b=document.createElement('button'),d=document.createElement('button');
 b.textContent=t.name+' ('+t.image.width+'×'+t.image.height+')';b.onclick=()=>applyT(t);d.textContent='⬇';d.title='PNG saqlash';
 d.onclick=()=>t.image.toBlob(x=>saveBlob(x,t.name+'.png'));r.append(b,d);L.append(r)})}
async function img(f){const b=await createImageBitmap(f),c=document.createElement('canvas');c.width=b.width;c.height=b.height;c.getContext('2d').drawImage(b,0,0);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.name=f.name.replace(/\.[^.]+$/,'');tex[t.name.toLowerCase()]=t;texList();toast('Tekstura qo’shildi: '+t.name+' — meshni tanlab, ro’yxatdan bosing')}
