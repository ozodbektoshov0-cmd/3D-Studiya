/* ---- v54 · 2-bosqich: Blender “Object” amallari ----
   Apply Transform · Subdivide · Array · Mirror (qo‘llash) · Auto Smooth (burchak bo‘yicha).
   Hammasi Ctrl+Z bilan qaytariladi. Skinli (suyakli) meshlarda ishlamaydi. */
(function(){
'use strict';
const T=window.THREE,org=document.querySelector('#org'),menu=org&&org.parentElement;
if(!T||!menu||typeof hist!=='function'||typeof pose!=='function'||typeof put!=='function')return;

const ni=g=>g.index?g.toNonIndexed():g.clone();
const names=g=>Object.keys(g.attributes);
function rebuild(g,fn){ /* har bir atribut uchun yangi massiv: fn(attr)->TypedArray */
 const r=new T.BufferGeometry();names(g).forEach(n=>{const a=g.attributes[n];r.setAttribute(n,new T.BufferAttribute(fn(a,n),a.itemSize,a.normalized))});return r}

/* uchburchaklar tartibini teskari qilish (2-va 3-uchni almashtirish) */
function flip(g){g=ni(g);return rebuild(g,a=>{const s=a.itemSize,o=a.array.slice();
 for(let t=0;t<a.count/3;t++)for(let c=0;c<s;c++){o[(t*3+1)*s+c]=a.array[(t*3+2)*s+c];o[(t*3+2)*s+c]=a.array[(t*3+1)*s+c]}return o})}

/* Subdivide: har uchburchakni 4 ga bo‘ladi (qirra o‘rtalari) */
function subdiv(g,levels,cap=1.5e6){g=ni(g);
 for(let l=0;l<levels;l++){const tris=g.attributes.position.count/3;if(tris*4>cap)return {g,stopped:true};
  g=rebuild(g,(a)=>{const s=a.itemSize,A=a.array,o=new A.constructor(a.count*4*s);let w=0;
   for(let t=0;t<tris;t++){const v=i=>A.subarray((t*3+i)*s,(t*3+i)*s+s),p=[v(0),v(1),v(2)],m=[[0,1],[1,2],[2,0]].map(([i,j])=>p[i].map((x,c)=>(x+p[j][c])/2));
    for(const q of [[p[0],m[0],m[2]],[m[0],p[1],m[1]],[m[2],m[1],p[2]],[m[0],m[1],m[2]]])for(const u of q)for(let c=0;c<s;c++)o[w++]=u[c]}
   return o});
  if(g.attributes.normal){const N=g.attributes.normal;for(let i=0;i<N.count;i++){const x=N.getX(i),y=N.getY(i),z=N.getZ(i),d=Math.hypot(x,y,z)||1;N.setXYZ(i,x/d,y/d,z/d)}}}
 return {g,stopped:false}}

/* Array: n nusxa, tanlangan o‘q bo‘ylab (o‘lcham × koeffitsient) */
function arr(g,n,ax,k){g=ni(g);g.computeBoundingBox();const sz=g.boundingBox.getSize(new T.Vector3()),step=[sz.x,sz.y,sz.z][ax]*k;
 return rebuild(g,(a,nm)=>{const s=a.itemSize,o=new a.array.constructor(a.count*n*s);
  for(let i=0;i<n;i++){o.set(a.array,i*a.count*s);if(nm=='position')for(let j=0;j<a.count;j++)o[(i*a.count+j)*s+ax]+=i*step}return o})}

/* Mirror: koordinata o‘qi bo‘yicha ko‘zgu nusxasi (boshlang‘ich nuqtaga nisbatan) bilan birlashtiradi */
function mir(g,ax){g=ni(g);const f=flip(g);
 return rebuild(g,(a,nm)=>{const s=a.itemSize,o=new a.array.constructor(a.count*2*s),B=f.attributes[nm].array;o.set(a.array,0);o.set(B,a.count*s);
  if(nm=='position'||nm=='normal')for(let j=a.count;j<a.count*2;j++)o[j*s+ax]*=-1;return o})}

/* Auto Smooth: burchagi chegaradan kichik bo‘lgan qo‘shni yuzlar normallarini (burchak bo‘yicha og‘irlik bilan, Blender kabi) o‘rtalashtiradi */
function autoSmooth(g,deg){g=ni(g);const P=g.attributes.position,n=P.count/3,cs=Math.cos(deg*Math.PI/180),fn=new Float32Array(n*3),ca=new Float32Array(n*3),mp=new Map(),V=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
 const key=i=>Math.round(P.getX(i)*1e4)+','+Math.round(P.getY(i)*1e4)+','+Math.round(P.getZ(i)*1e4);
 for(let t=0;t<n;t++){V.forEach((v,j)=>v.fromBufferAttribute(P,t*3+j));const c=V[1].clone().sub(V[0]).cross(V[2].clone().sub(V[0])),l=c.length();if(l>0)c.divideScalar(l);fn.set([c.x,c.y,c.z],t*3);
  for(let j=0;j<3;j++){const e1=V[(j+1)%3].clone().sub(V[j]).normalize(),e2=V[(j+2)%3].clone().sub(V[j]).normalize();ca[t*3+j]=Math.acos(Math.max(-1,Math.min(1,e1.dot(e2))))||0;
   const k=key(t*3+j);(mp.get(k)||mp.set(k,[]).get(k)).push(t*3+j)}}
 const N=new Float32Array(n*9);
 for(let t=0;t<n;t++)for(let j=0;j<3;j++){let x=0,y=0,z=0;
  for(const ci of mp.get(key(t*3+j))){const u=ci/3|0;if(fn[u*3]*fn[t*3]+fn[u*3+1]*fn[t*3+1]+fn[u*3+2]*fn[t*3+2]>=cs-1e-6){x+=fn[u*3]*ca[ci];y+=fn[u*3+1]*ca[ci];z+=fn[u*3+2]*ca[ci]}}
  const d=Math.hypot(x,y,z)||1;N.set([x/d,y/d,z/d],(t*3+j)*3)}
 g.setAttribute('normal',new T.BufferAttribute(N,3));return g}

/* ---------- UI va tarix ---------- */
const need=()=>{if(window.em){toast('Avval Edit rejimidan chiqing');return null}
 if(!sel||!sel.isMesh){toast('Avval mesh tanlang');return null}
 if(sel.geometry.getAttribute('skinIndex')){toast('Suyakli (skinli) mesh uchun bu amal mavjud emas');return null}return sel};
function commit(m,ng,pre){const og=m.geometry,a=pose(m);m.geometry=ng;if(pre)pre(m);const b=pose(m);
 hist(()=>{m.geometry=og;put(a)},()=>{m.geometry=ng;put(b)});refresh()}
const run=fn=>()=>{const m=need();if(!m)return;try{fn(m)}catch(e){console.error(e);toast('Xato: '+e.message)}};
const btn=(t,f,title)=>{const b=document.createElement('button');b.textContent=t;b.onclick=f;if(title)b.title=title;return b};
const num=(v,min,max,w)=>{const i=document.createElement('input');i.type='number';i.value=v;i.min=min;i.max=max;i.style.width=w||'52px';return i};
const row=(...e)=>{const d=document.createElement('div');d.className='row';d.append(...e);menu.append(d)};

menu.append(btn('Apply Transform',run(m=>{
 if(m.children.length)return toast('Ichki obyektlari bor obyektga qo‘llab bo‘lmaydi');
 m.updateMatrix();let g=m.geometry.clone();const neg=m.matrix.determinant()<0;g.applyMatrix4(m.matrix);if(neg)g=flip(g);
 commit(m,g,o=>{o.position.set(0,0,0);o.quaternion.identity();o.scale.set(1,1,1)});toast('Transformatsiya geometriyaga qo‘llandi')}),'Joylashuv, burilish va o‘lchamni geometriyaga o‘tkazadi'));

const lv=num(1,1,4);row(btn('Subdivide',run(m=>{const r=subdiv(m.geometry,+lv.value|0||1);commit(m,r.g);
 toast(r.stopped?'Poligonlar limitiga yetdi — to‘xtatildi':'Poligonlar: '+(r.g.attributes.position.count/3|0).toLocaleString())}),'Har uchburchakni 4 ga bo‘ladi (silliqlamaydi)'),lv);

const an=num(3,2,50,'46px'),ax=document.createElement('select');ax.innerHTML='<option value="0">X<option value="1">Y<option value="2">Z</option>';const kf=num(1,-10,10,'52px');kf.step='.1';
row(btn('Array',run(m=>{const n=Math.max(2,Math.min(50,+an.value|0));const g=arr(m.geometry,n,+ax.value,+kf.value);
 if(g.attributes.position.count/3>2e6)return toast('Juda katta natija');commit(m,g)}),'Nusxalar soni · o‘q · masofa (o‘lchamga nisbatan)'),an,ax,kf);

row(...['X','Y','Z'].map((c,i)=>btn('Mirror '+c,run(m=>commit(m,mir(m.geometry,i))),c+' o‘qi bo‘yicha ko‘zgu nusxasini birlashtiradi (nol nuqtaga nisbatan)')));

const sa=num((window.BL_CFG&&+BL_CFG.blSm)||30,1,180);(window.BL_CFG=window.BL_CFG||{}).saInput=sa;row(btn('Auto Smooth °',run(m=>commit(m,autoSmooth(m.geometry,+sa.value||30))),'Burchagi shu qiymatdan kichik qirralar silliq, qolganlari o‘tkir bo‘ladi'),sa);

window.BL_OPS={subdiv,arr,mir,autoSmooth,flip};
window.BL_OBJ={need,commit,run,btn,num,row};   /* keyingi bosqichlar (blender-subsurf.js) uchun */
})();
