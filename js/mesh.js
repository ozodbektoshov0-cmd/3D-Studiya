/* ---- Mesh asboblari: ierarxiya, boolean (CSG), yuza tahriri, UV, skelet ---- */
/* --- CSG (BSP) --- */
const EPS=1e-5;
class Pl{constructor(n,w){this.n=n;this.w=w}
 static from(a,b,c){const n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();return new Pl(n,n.dot(a))}
 flip(){this.n.negate();this.w=-this.w}
 split(P,cf,cb,f,b){let t=0;const T=P.v.map(v=>{const d=this.n.dot(v)-this.w,k=d<-EPS?2:d>EPS?1:0;t|=k;return k});
  if(t==0)(this.n.dot(P.pl.n)>0?cf:cb).push(P);else if(t==1)f.push(P);else if(t==2)b.push(P);
  else{const F=[],B=[];for(let i=0;i<P.v.length;i++){const j=(i+1)%P.v.length,vi=P.v[i],vj=P.v[j];
   if(T[i]!=2)F.push(vi);if(T[i]!=1)B.push(vi);
   if((T[i]|T[j])==3){const s=(this.w-this.n.dot(vi))/this.n.dot(vj.clone().sub(vi)),v=vi.clone().lerp(vj,s);F.push(v);B.push(v.clone())}}
   if(F.length>=3)f.push(new Po(F));if(B.length>=3)b.push(new Po(B))}}}
class Po{constructor(v){this.v=v;this.pl=Pl.from(v[0],v[1],v[2])}clone(){return new Po(this.v.map(x=>x.clone()))}flip(){this.v.reverse();this.pl.flip()}}
class Nd{constructor(p){this.pl=null;this.f=null;this.b=null;this.p=[];p&&this.build(p)}
 invert(){this.p.forEach(x=>x.flip());this.pl&&this.pl.flip();this.f&&this.f.invert();this.b&&this.b.invert();[this.f,this.b]=[this.b,this.f]}
 clip(ps){if(!this.pl)return ps.slice();let f=[],b=[];ps.forEach(x=>this.pl.split(x,f,b,f,b));f=this.f?this.f.clip(f):f;b=this.b?this.b.clip(b):[];return f.concat(b)}
 clipTo(o){this.p=o.clip(this.p);this.f&&this.f.clipTo(o);this.b&&this.b.clipTo(o)}
 all(){let a=this.p.slice();this.f&&(a=a.concat(this.f.all()));this.b&&(a=a.concat(this.b.all()));return a}
 build(ps){if(!ps.length)return;if(!this.pl)this.pl=new Pl(ps[0].pl.n.clone(),ps[0].pl.w);const f=[],b=[];ps.forEach(x=>this.pl.split(x,this.p,this.p,f,b));
  if(f.length){this.f=this.f||new Nd();this.f.build(f)}if(b.length){this.b=this.b||new Nd();this.b.build(b)}}}
function csgPolys(m){m.updateMatrixWorld(true);const g=m.geometry,P=g.getAttribute('position'),I=g.index?g.index.array:null,n=(I?I.length:P.count)/3,a=[];
 for(let t=0;t<n;t++){const v=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(P,I?I[t*3+j]:t*3+j).applyMatrix4(m.matrixWorld));
  if(v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).lengthSq()>1e-18)a.push(new Po(v))}return a}
function csgGeo(pa,pb,op){const a=new Nd(pa),b=new Nd(pb);
 if(op=='u'){a.clipTo(b);b.clipTo(a);b.invert();b.clipTo(a);b.invert();a.build(b.all())}
 else if(op=='s'){a.invert();a.clipTo(b);b.clipTo(a);b.invert();b.clipTo(a);b.invert();a.build(b.all());a.invert()}
 else{a.invert();b.clipTo(a);b.invert();a.clipTo(b);b.clipTo(a);a.build(b.all());a.invert()}
 const P=[];a.all().forEach(p=>{for(let i=1;i<p.v.length-1;i++)[p.v[0],p.v[i],p.v[i+1]].forEach(v=>P.push(v.x,v.y,v.z))});
 if(!P.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g}
function boolOp(op){const L=real();if(L.length!=2||!L.includes(sel))return toast('Boolean: Outliner’da aynan 2 ta mesh tanlang (Ctrl/Shift), aktiv mesh = A');
 if(edG()===null||fm)return;const A=sel,B=L.find(o=>o!==A),pa=csgPolys(A),pb=csgPolys(B);
 if(pa.length+pb.length>6000)return toast('Boolean uchun mesh katta ('+(pa.length+pb.length)+' uchburchak, limit 6000) — avval poligon kamaytiring');
 toast('Boolean hisoblanmoqda…');const g=csgGeo(pa,pb,op);if(!g)return toast('Natija bo’sh (jismlar kesishmaydi?)');
 const r=new THREE.Mesh(g,[].concat(A.material)[0].clone());r.name=A.name+({u:'_birl',s:'_ayir',i:'_kesish'})[op];
 const pA=A.parent,pB=B.parent;select(null);pA.remove(A);pB.remove(B);root.add(r);hist(()=>{root.remove(r);pA.add(A);pB.add(B)},()=>{pA.remove(A);pB.remove(B);root.add(r)});MS.clear();select(r);toast('Boolean tayyor (UV yo’qoladi — “UV avto” ishlating)')}
/* --- ierarxiya --- */
const dep=o=>{let n=0;while(o.parent&&o.parent!==root){n++;o=o.parent}return n};
const rf1=refresh;refresh=()=>{rf1();const ml=meshes();[...$('#list').children].forEach((x,i)=>{if(ml[i])x.style.paddingLeft=(8+dep(ml[i])*14)+'px'})};
function parentOp(up){const L=real();let A=sel,B;
 if(up){if(!A||A.parent===root)return toast('Bu obyekt allaqachon ildizda');B=root}
 else{if(L.length!=2||!L.includes(sel))return toast('Ota qilish: 2 ta mesh tanlang (aktiv = bola, ikkinchisi = ota)');B=L.find(o=>o!==A);for(let p=B;p;p=p.parent)if(p===A)return toast('Aylana ierarxiya mumkin emas')}
 const op=A.parent;B.attach(A);hist(()=>op.attach(A),()=>B.attach(A));refresh();sync()}
/* --- yuza tahriri --- */
let fm=false,hl=null;const FS=new Set(),wk=v=>Math.round(v.x*1e4)+','+Math.round(v.y*1e4)+','+Math.round(v.z*1e4),
 nrm=t=>t.p[1].clone().sub(t.p[0]).cross(t.p[2].clone().sub(t.p[0])).normalize(),ek=(a,b)=>a<b?a+'|'+b:b+'|'+a;
function toT(g){const P=g.getAttribute('position'),U=g.getAttribute('uv'),I=g.index?g.index.array:null,n=(I?I.length:P.count)/3,G=g.groups,T=[];
 const mi=t=>{for(const q of G)if(t*3>=q.start&&t*3<q.start+q.count)return q.materialIndex;return 0};
 for(let t=0;t<n;t++){const p=[],u=[];for(let j=0;j<3;j++){const v=I?I[t*3+j]:t*3+j;p.push(new THREE.Vector3(P.getX(v),P.getY(v),P.getZ(v)));U&&u.push([U.getX(v),U.getY(v)])}T.push({p,u:U?u:null,m:G.length?mi(t):0})}return T}
function fromT(T,old){const hu=T.some(t=>t.u),multi=old.groups.length>1;if(multi)T.sort((a,b)=>a.m-b.m);
 const P=new Float32Array(T.length*9),U=hu?new Float32Array(T.length*6):null;
 T.forEach((t,i)=>{for(let j=0;j<3;j++){P.set([t.p[j].x,t.p[j].y,t.p[j].z],i*9+j*3);if(U)U.set(t.u?t.u[j]:[0,0],i*6+j*2)}});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));U&&g.setAttribute('uv',new THREE.BufferAttribute(U,2));
 if(multi){let s=0;for(let i=1;i<=T.length;i++)if(i==T.length||T[i].m!=T[s].m){g.addGroup(s*3,(i-s)*3,T[s].m);s=i}}g.computeVertexNormals();return g}
function region(T,t0){const km=T.map(t=>t.p.map(wk)),E=new Map(),N=T.map(nrm);
 km.forEach((k,i)=>{for(let j=0;j<3;j++){const e=ek(k[j],k[(j+1)%3]);(E.get(e)||E.set(e,[]).get(e)).push(i)}});
 const out=new Set([t0]),q=[t0];while(q.length){const i=q.pop(),k=km[i];for(let j=0;j<3;j++)for(const o of E.get(ek(k[j],k[(j+1)%3])))if(!out.has(o)&&N[o].dot(N[i])>.9998){out.add(o);q.push(o)}}return out}
function bnd(T,S){const E=new Map();S.forEach(i=>{const t=T[i];for(let j=0;j<3;j++){const a=t.p[j],b=t.p[(j+1)%3],e=ek(wk(a),wk(b)),r=E.get(e);if(r)r.c++;else E.set(e,{a,b,c:1,m:t.m})}});return[...E.values()].filter(x=>x.c==1)}
function shell(T,S,D,flip){const B=bnd(T,S),mv=v=>v.clone().add(D.get(wk(v))||new THREE.Vector3()),out=T.filter((_,i)=>!S.has(i));
 S.forEach(i=>{const t=T[i];out.push({p:t.p.map(mv),u:t.u,m:t.m,s:1})});
 B.forEach(e=>{const a2=mv(e.a),b2=mv(e.b);out.push({p:flip?[e.a,b2,e.b]:[e.a,e.b,b2],u:null,m:e.m},{p:flip?[e.a,a2,b2]:[e.a,b2,a2],u:null,m:e.m})});return out}
const dExt=d=>(T,S)=>{const D=new Map();S.forEach(i=>{const n=nrm(T[i]);T[i].p.forEach(v=>{const k=wk(v);(D.get(k)||D.set(k,new THREE.Vector3()).get(k)).add(n)})});D.forEach(v=>v.normalize().multiplyScalar(d));return D};
const dIns=f=>(T,S)=>{const P=new Map();S.forEach(i=>T[i].p.forEach(v=>P.set(wk(v),v)));const c=new THREE.Vector3();P.forEach(v=>c.add(v));c.divideScalar(P.size);const D=new Map();P.forEach((v,k)=>D.set(k,c.clone().sub(v).multiplyScalar(f)));return D};
function subdiv(T,S){const out=[],h=(x,y)=>x.clone().add(y).multiplyScalar(.5);T.forEach((t,i)=>{if(S.size&&!S.has(i)){out.push(t);return}
 const[a,b,c]=t.p,ab=h(a,b),bc=h(b,c),ca=h(c,a);let u=null;
 if(t.u){const q=(x,y)=>[(t.u[x][0]+t.u[y][0])/2,(t.u[x][1]+t.u[y][1])/2],uab=q(0,1),ubc=q(1,2),uca=q(2,0);u=[[t.u[0],uab,uca],[uab,t.u[1],ubc],[uca,ubc,t.u[2]],[uab,ubc,uca]]}
 [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]].forEach((p,k)=>out.push({p,u:u&&u[k],m:t.m,s:S.has(i)?1:0}))});return out}
function hlU(){if(hl){sel.remove(hl);hl.geometry.dispose();hl=null}if(!fm||!sel||!FS.size)return;
 const T=toT(sel.geometry),P=[];bnd(T,[...FS].filter(i=>T[i])).forEach(e=>P.push(e.a.x,e.a.y,e.a.z,e.b.x,e.b.y,e.b.z));
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));hl=new THREE.LineSegments(G,new THREE.LineBasicMaterial({color:0xffa028,depthTest:false}));hl.renderOrder=9;sel.add(hl)}
function faceOp(fn){if(!fm||!sel)return toast('Avval “Yuza rejimi” ni yoqing');const T=toT(sel.geometry);if(T.length>60000)return toast('Mesh juda katta (60 000 uchburchakgacha)');
 T.forEach((t,i)=>t.s=FS.has(i)?1:0);const R=fn(T,new Set(FS));if(!R)return;const og=sel.geometry,ng=fromT(R,og),m=sel;m.geometry=ng;
 hist(()=>{m.geometry=og;FS.clear();hlU()},()=>{m.geometry=ng;FS.clear();hlU()});FS.clear();R.forEach((t,i)=>t.s&&FS.add(i));hlU();refresh()}
const ask=(t,d)=>{const v=prompt(t,d);return v===null?null:parseFloat(String(v).replace(',','.'))},gsz=()=>{const g=sel.geometry;g.computeBoundingBox();return g.boundingBox.getSize(new THREE.Vector3()).length()};
function fmSet(on){if(on){if(!sel||!sel.isMesh||sel.userData.dummy)return toast('Avval mesh tanlang');window.em&&editOff();fm=true;FS.clear();toast('Yuza rejimi: yuzani bosing (Ko’p tanlash — qo’shish)')}else{fm=false;FS.clear();hlU()}$('#fmb').classList.toggle('on',fm)}
const sl0=select;select=o=>{if(fm)fmSet(false);sl0(o)};
cv.addEventListener('pointerup',e=>{if(!fm||!sel||!dn||tc.axis||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>5)return;e.stopImmediatePropagation();
 const r=cv.getBoundingClientRect(),rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
 const h=rc.intersectObject(sel,false)[0],add=e.shiftKey||ms;if(!h){add||FS.clear();return hlU()}
 const T=toT(sel.geometry);if(T.length>60000)return toast('Mesh juda katta');const R=region(T,h.faceIndex);
 if(add){const all=[...R].every(i=>FS.has(i));R.forEach(i=>all?FS.delete(i):FS.add(i))}else{FS.clear();R.forEach(i=>FS.add(i))}hlU()},true);
/* --- UV --- */
const uvT=f=>()=>each(L=>L.forEach(m=>actG(m,g=>{const U=g.getAttribute('uv');if(!U)return toast(m.name+': UV yo’q — avval “UV avto”');for(let i=0;i<U.count;i++){const r=f(U.getX(i),U.getY(i));U.setXY(i,r[0],r[1])}U.needsUpdate=true})));
function uvAuto(){each(L=>L.forEach(m=>{if(fm)return;const og=m.geometry,T=toT(og);og.computeBoundingBox();const s=og.boundingBox.getSize(new THREE.Vector3()),k=1/(Math.max(s.x,s.y,s.z)||1);
 T.forEach(t=>{const n=nrm(t),x=Math.abs(n.x),y=Math.abs(n.y),z=Math.abs(n.z);t.u=t.p.map(v=>x>=y&&x>=z?[v.z*k,v.y*k]:y>=z?[v.x*k,v.z*k]:[v.x*k,v.y*k])});
 const ng=fromT(T,og);m.geometry=ng;hist(()=>m.geometry=og,()=>m.geometry=ng)}))}
/* --- skelet --- */
let skh=null,bp=false,bq=null,ci=-1;const CL=[],bones=()=>{const a=[];root.traverse(o=>o.isBone&&a.push(o));return a};
const an0=anim;anim=o=>{an0(o);const m=AN[AN.length-1];o.animations.forEach(c=>CL.push({c,m}))};
tc.addEventListener('mouseDown',()=>{bq=tc.object&&tc.object.isBone?tc.object.quaternion.clone():null});
tc.addEventListener('mouseUp',()=>{if(bq&&tc.object&&tc.object.isBone){const b=tc.object,a=bq,z=b.quaternion.clone();hist(()=>b.quaternion.copy(a),()=>b.quaternion.copy(z))}bq=null});
cv.addEventListener('pointerup',e=>{if(!bp||!dn||tc.axis||Math.hypot(e.clientX-dn[0],e.clientY-dn[1])>5)return;e.stopImmediatePropagation();
 const r=cv.getBoundingClientRect(),v=new THREE.Vector3();let best=null,bd=22;
 bones().forEach(b=>{b.getWorldPosition(v);v.project(cam);if(v.z>1)return;const d=Math.hypot((v.x+1)/2*r.width-(e.clientX-r.left),(1-v.y)/2*r.height-(e.clientY-r.top));if(d<bd){bd=d;best=b}});
 if(best){tc.attach(best);tc.setMode('rotate');toast('Suyak: '+(best.name||'bone')+' (animatsiyani to’xtating)')}},true);
/* --- menyular --- */
menu('Tuzilma',[
 ['par','Ota qilish (aktiv → ikkinchisiga bola)',()=>parentOp(false)],['unp','Ildizga ajratish (Unparent)',()=>parentOp(true)],
 ['bu','Boolean: birlashtirish',()=>boolOp('u')],['bs','Boolean: A − B (ayirish)',()=>boolOp('s')],['bi','Boolean: kesishma',()=>boolOp('i')]]);
menu('Yuza',[
 ['fmb','Yuza rejimi (tanlash)',()=>fmSet(!fm)],
 ['fex','Extrude (tortish)',()=>{if(!fm||!FS.size)return toast('Yuza rejimida yuza tanlang');const d=ask('Extrude masofasi (model birligida)',+(gsz()*.1).toFixed(3));if(!d)return;faceOp((T,S)=>shell(T,S,dExt(d)(T,S),false))}],
 ['fin','Inset (ichkariga kichraytirish)',()=>{if(!fm||!FS.size)return toast('Yuza rejimida yuza tanlang');const f=ask('Inset (0.05–0.9)',0.2);if(!f||f<=0||f>=1)return;faceOp((T,S)=>shell(T,S,dIns(f)(T,S),false))}],
 ['fdl','Yuzani o’chirish',()=>{if(!fm||!FS.size)return toast('Yuza tanlang');faceOp((T,S)=>T.filter((_,i)=>!S.has(i)))}],
 ['fsb','Bo’lish (subdivide: tanlangan yoki hammasi)',()=>faceOp((T,S)=>subdiv(T,S))],
 ['fcl','Tanlovni bekor qilish',()=>{FS.clear();hlU()}],
 ['uva','UV avto (quti proyeksiya)',uvAuto],['uv2','UV ×2',uvT((u,v)=>[u*2,v*2])],['uvh','UV ÷2',uvT((u,v)=>[u/2,v/2])],
 ['uvr','UV 90° burish',uvT((u,v)=>[-v,u])],['uvu','UV aks U',uvT((u,v)=>[1-u,v])],['uvv','UV aks V',uvT((u,v)=>[u,1-v])]]);
menu('Skelet',[
 ['skl','Skelet ko’rsatish',e=>{if(skh){S.remove(skh);skh=null;e.target.classList.remove('on');return}if(!bones().length)return toast('Suyak topilmadi (skinned model kerak)');skh=new THREE.SkeletonHelper(root);skh.material.depthTest=false;skh.renderOrder=9;S.add(skh);e.target.classList.add('on')}],
 ['bpz','Suyak tanlash / burish',e=>{bp=!bp;e.target.classList.toggle('on',bp);if(!bp){tc.detach();sel&&tc.attach(sel)}else toast('Suyak yaqinida bosing')}],
 ['clp','Klip: keyingisi / hammasi',()=>{if(!CL.length)return toast('Animatsiya klipi yo’q');ci=(ci+1)%(CL.length+1);const ms=new Set(CL.map(x=>x.m));ms.forEach(m=>m.stopAllAction());
  CL.forEach((x,i)=>{if(ci==CL.length||ci==i)x.m.clipAction(x.c).reset().play()});toast(ci==CL.length?'Hamma klip':'Klip: '+(CL[ci].c.name||ci+1))}],
 ['spd','Animatsiya tezligi',()=>{const v=ask('Tezlik (1 = oddiy)',1);if(v==null||isNaN(v))return;AN.forEach(m=>m.timeScale=v)}]]);
