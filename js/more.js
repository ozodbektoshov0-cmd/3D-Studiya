/* ---- Qo’shimcha 3D imkoniyatlar: razmer, o’lchash, normal/weld/apply, ko’zgu, yakkalash, soya, fon, animatsiya ---- */
const edG=()=>window.em?(toast('Avval Edit mode’dan chiqing'),null):0;
const actG=(m,fn)=>{const og=m.geometry,ng=og.clone();fn(ng,m);m.geometry=ng;hist(()=>m.geometry=og,()=>m.geometry=ng)};
function flipG(g){const I=g.index;if(I){const a=I.array;for(let i=0;i<a.length;i+=3){const t=a[i+1];a[i+1]=a[i+2];a[i+2]=t}I.needsUpdate=true}
 else for(const k in g.attributes){const a=g.attributes[k],s=a.itemSize,r=a.array;for(let i=0;i+2<a.count;i+=3)for(let c=0;c<s;c++){const x=r[(i+1)*s+c];r[(i+1)*s+c]=r[(i+2)*s+c];r[(i+2)*s+c]=x}}
 const n=g.getAttribute('normal');if(n){for(let i=0;i<n.array.length;i++)n.array[i]*=-1;n.needsUpdate=true}}
function weldG(g){const A=g.getAttribute('position'),U=g.getAttribute('uv'),Cl=g.getAttribute('color');g.computeBoundingBox();const z=g.boundingBox.getSize(new THREE.Vector3()),q=Math.max(z.x,z.y,z.z)*1e-5||1e-6,I=g.index&&g.index.array,n=I?I.length:A.count,mp=new Map(),rep=[],idx=[];
 for(let t=0;t<n;t++){const v=I?I[t]:t,k=Math.round(A.getX(v)/q)+','+Math.round(A.getY(v)/q)+','+Math.round(A.getZ(v)/q)+(U?','+Math.round(U.getX(v)*1e4)+','+Math.round(U.getY(v)*1e4):'');let r=mp.get(k);if(r===undefined){r=rep.length;mp.set(k,r);rep.push(v)}idx.push(r)}
 const pick=a=>{const s=a.itemSize,f=new Float32Array(rep.length*s);rep.forEach((v,i)=>{for(let c=0;c<s;c++)f[i*s+c]=[a.getX,a.getY,a.getZ,a.getW][c].call(a,v)});return new THREE.BufferAttribute(f,s)};
 g.deleteAttribute('normal');g.setAttribute('position',pick(A));U&&g.setAttribute('uv',pick(U));Cl&&g.setAttribute('color',pick(Cl));g.setIndex(idx);g.computeVertexNormals();return[A.count,rep.length]}
const each=fn=>{if(edG()===null)return;const L=real();if(!L.length)return toast('Mesh tanlang');fn(L);refresh()};
const mirA=a=>()=>{if(!sel)return;const p=pose(sel);sel.scale[a]*=-1;const b=pose(sel);hist(()=>put(p),()=>put(b));sync()};
function menu(t,items){const d=document.createElement('details');d.className='mn';d.innerHTML='<summary></summary><div></div>';d.firstChild.textContent=t;
 items.forEach(([id,tx,fn])=>{const b=document.createElement('button');b.id=id;b.textContent=tx;b.onclick=fn;d.lastChild.append(b)});document.querySelector('header .sp').before(d);return d}
menu('Model',[
 ['flp','Normalni teskari (flip)',()=>each(L=>L.forEach(m=>actG(m,flipG)))],
 ['wld','Weld (nuqtalarni birlashtirish + silliq)',()=>each(L=>{let a=0,b=0;L.forEach(m=>actG(m,g=>{const r=weldG(g);a+=r[0];b+=r[1]}));toast('Nuqtalar: '+a+' → '+b)})],
 ['apl','Transformni qotirish (Apply)',()=>each(L=>L.forEach(m=>{if(m.children.length)return toast(m.name+': ichida bolalari bor, o’tkazib yuborildi');
  const a=pose(m),og=m.geometry,ng=og.clone().applyMatrix4(m.matrix);if(m.matrix.determinant()<0)flipG(ng);
  m.position.set(0,0,0);m.quaternion.identity();m.scale.set(1,1,1);m.geometry=ng;const b=pose(m);hist(()=>{m.geometry=og;put(a)},()=>{m.geometry=ng;put(b)})}))],
 ['myy','Ko’zgu Y',mirA('y')],['mzz','Ko’zgu Z',mirA('z')],
 ['iso','Yakkalash (faqat tanlangan)',()=>{const k=new Set(real());if(!k.size)return toast('Mesh tanlang');meshes().forEach(m=>m.visible=k.has(m))}],
 ['shw','Hammasini ko’rsatish',()=>meshes().forEach(m=>m.visible=true)]]);
/* razmer (bounding box) */
const dm=document.createElement('span');dm.id='dm';$('#st').after(dm);
function dim(){if(!sel){dm.textContent='';return}const s=new THREE.Box3().setFromObject(sel).getSize(new THREE.Vector3());dm.textContent='Razmer: '+[s.x,s.y,s.z].map(v=>+v.toFixed(3)).join(' × ')}
const sy0=sync;sync=()=>{sy0();dim()};
/* o’lchash */
let me=false,mp=[],ml=null;
cv.addEventListener('pointerup',e=>{if(!me||!dn||tc.axis||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>5)return;e.stopImmediatePropagation();
 const r=cv.getBoundingClientRect(),rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
 const h=rc.intersectObjects(root.children,true).find(x=>x.object.isMesh&&x.object.visible&&!x.object.userData.dummy);if(!h)return;
 if(mp.length>=2){mp=[];if(ml){S.remove(ml);ml.geometry.dispose();ml=null}}mp.push(h.point.clone());
 if(mp.length==2){ml=new THREE.Line(new THREE.BufferGeometry().setFromPoints(mp),new THREE.LineBasicMaterial({color:0xffa028,depthTest:false}));ml.renderOrder=10;S.add(ml);
  const d=mp[1].clone().sub(mp[0]);toast('Masofa: '+d.length().toFixed(3)+'  (dx '+d.x.toFixed(3)+', dy '+d.y.toFixed(3)+', dz '+d.z.toFixed(3)+')')}else toast('2-nuqtani bosing')},true);
/* soya */
let sh=false;const gp=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.ShadowMaterial({opacity:.35}));gp.receiveShadow=true;gp.visible=false;gp.position.y=.001;S.add(gp);
function shadows(){root.traverse(o=>{if(o.isMesh&&o.castShadow!==sh){o.castShadow=o.receiveShadow=sh;mats(o).forEach(m=>m.needsUpdate=true)}})}
const rf0=refresh;refresh=()=>{rf0();sh&&shadows()};
/* animatsiya */
const AN=[],clk=new THREE.Clock();let play=false;
function anim(o){AN.push(new THREE.AnimationMixer(o));AN[AN.length-1].timeScale=1;o.animations.forEach(c=>AN[AN.length-1].clipAction(c).play());toast(o.animations.length+' ta animatsiya topildi — Ko’rinish → Animatsiya')}
(function lp(){requestAnimationFrame(lp);const d=clk.getDelta();if(play)AN.forEach(m=>m.update(d))})();
const vm=menu('Ko’rinish',[
 ['msr','O’lchash (2 nuqta)',e=>{me=!me;mp=[];if(ml){S.remove(ml);ml=null}e.target.classList.toggle('on',me);toast(me?'O’lchash: modelda 2 nuqtani bosing':'O’lchash o’chirildi')}],
 ['shd','Soya',e=>{sh=!sh;R.shadowMap.enabled=sh;R.shadowMap.type=THREE.PCFSoftShadowMap;dl.castShadow=sh;gp.visible=sh;
  const d=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).length()||10,c=dl.shadow.camera;gp.scale.set(d*3,1,d*3);c.left=c.bottom=-d;c.right=c.top=d;c.near=.1;c.far=d*8;c.updateProjectionMatrix();
  dl.position.set(d*.5,d*1.2,d*.7);dl.shadow.mapSize.set(2048,2048);dl.shadow.bias=-.0005;shadows();e.target.classList.toggle('on',sh)}],
 ['rot','Avto aylanish',e=>{ctl.autoRotate=!ctl.autoRotate;ctl.autoRotateSpeed=2;e.target.classList.toggle('on',ctl.autoRotate)}],
 ['anb','Animatsiya ▶',e=>{if(!AN.length)return toast('Animatsiya yo’q (GLB/FBX da bo’lishi kerak)');play=!play;e.target.textContent=play?'Animatsiya ⏸':'Animatsiya ▶'}],
 ['bgd','Fon: standart',()=>{S.background=null;vp.style.background=''}]]);
const br=document.createElement('div');br.className='row';br.innerHTML='<span>Fon rangi</span><input type="color" id="bgc" value="#444444">';vm.lastChild.append(br);
$('#bgc').oninput=e=>{S.background=new THREE.Color(e.target.value);vp.style.background=e.target.value};
