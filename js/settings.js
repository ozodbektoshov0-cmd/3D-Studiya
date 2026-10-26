/* ---- Sozlamalar va “Ilova haqida” ----
   Sozlamalar brauzer xotirasida (localStorage) saqlanadi. Sxema: pastdagi `sec` ro’yxati. */
(function(){
const KEY='3dstudiya.settings.v1';
const E=(t,p,h)=>{const e=document.createElement(t);p&&Object.assign(e,p);h&&e.append(...[].concat(h));return e};
const TM={'Yo’q':0,'Chiziqli':1,'Reinhard':2,'Cineon':3,'ACES':4};
/* tayyor to’plamlar: sifat va yoritish */
const PS={
 q:{k:['scale','fps','fxaa','shd','aniso','mem'],c:'Maxsus',t:{'Past':[50,30,0,512,1,1],'O’rta':[75,60,0,1024,2,0],'Yuqori':[100,0,0,2048,4,0],'Ultra':[150,0,1,4096,16,0]}},
 lp:{k:['hemi','dirI','az','el','lc'],c:'Maxsus',t:{'Studiya':[1.2,1.3,35,49,'#ffffff'],'Kun':[1,2.2,60,60,'#fff1d6'],'Kechqurun':[.5,1.6,200,15,'#ff9a5a'],'Yumshoq':[2,.6,35,60,'#ffffff'],'Qattiq':[.4,2.8,50,40,'#ffffff']}}
};
const dpr=Math.min(devicePixelRatio||1,2),mxA=R.capabilities.getMaxAnisotropy(),hl0=S.children.find(o=>o.isHemisphereLight);
const remat=()=>meshes().forEach(m=>mats(m).forEach(x=>x.needsUpdate=true));
const dolly=(a,b)=>{const t=ctl.target;cam.position.sub(t).multiplyScalar(Math.tan(a*Math.PI/360)/Math.tan(b*Math.PI/360)).add(t)};
let C={},lm=false;

/* ---------- sifat: o’lcham, soya, tekstura ---------- */
function aniso(){const a=Math.min(C.mem?1:C.aniso,mxA);
 meshes().forEach(m=>mats(m).forEach(x=>['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap','bumpMap'].forEach(p=>{const t=x[p];if(t&&t.anisotropy!==a){t.anisotropy=a;t.needsUpdate=true}})))}
function qual(){
 let pr=dpr*C.scale/100;if(C.mem)pr=Math.min(pr,1);pr=Math.max(.25,Math.min(pr,3));
 if(Math.abs(R.getPixelRatio()-pr)>.001)R.setPixelRatio(pr);
 const ss=C.mem?Math.min(C.shd,1024):C.shd;
 if(dl.shadow.mapSize.x!=ss){dl.shadow.mapSize.set(ss,ss);if(dl.shadow.map){dl.shadow.map.dispose();dl.shadow.map=null}}
 const st={'Yumshoq':THREE.PCFSoftShadowMap,'Aniq':THREE.PCFShadowMap,'Qattiq':THREE.BasicShadowMap}[C.shT];
 if(st!==undefined&&R.shadowMap.type!==st){R.shadowMap.type=st;R.shadowMap.needsUpdate=true;remat()}
 gp.material.opacity=C.shO/100;aniso()}

/* ---------- render: FPS chegarasi, FXAA, shaffof PNG ---------- */
const r0=R.render.bind(R),fm=new THREE.ShaderMaterial({uniforms:{t:{value:null},px:{value:new THREE.Vector2()}},depthTest:false,depthWrite:false,blending:THREE.NoBlending,
 vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform sampler2D t;uniform vec2 px;varying vec2 v;
float L(vec4 c){return dot(c.rgb,vec3(.299,.587,.114))+c.a*.25;}
void main(){vec4 m=texture2D(t,v),a=texture2D(t,v+vec2(-1.,-1.)*px),b=texture2D(t,v+vec2(1.,-1.)*px),c=texture2D(t,v+vec2(-1.,1.)*px),d=texture2D(t,v+vec2(1.,1.)*px);
float lm=L(m),la=L(a),lb=L(b),lc=L(c),ld=L(d),mn=min(lm,min(min(la,lb),min(lc,ld))),mx=max(lm,max(max(la,lb),max(lc,ld)));
vec2 dir=vec2(-((la+lb)-(lc+ld)),(la+lc)-(lb+ld));
float r=1./(min(abs(dir.x),abs(dir.y))+max((la+lb+lc+ld)*.03125,.0078125));
dir=clamp(dir*r,-8.,8.)*px;
vec4 A=.5*(texture2D(t,v+dir*(1./3.-.5))+texture2D(t,v+dir*(2./3.-.5)));
vec4 B=A*.5+.25*(texture2D(t,v+dir*-.5)+texture2D(t,v+dir*.5));
float lB=L(B);gl_FragColor=(lB<mn||lB>mx)?A:B;}`}),
 fs=new THREE.Scene(),fc=new THREE.OrthographicCamera(-1,1,1,-1,0,1),fq=new THREE.Mesh(new THREE.PlaneGeometry(2,2),fm),sz=new THREE.Vector2();
fq.frustumCulled=false;fs.add(fq);
let lt=0,fo=0,png=0,rt=null;
R.render=function(s,c){
 const t=performance.now();
 if(!fo&&C.fps&&t-lt<1000/C.fps-3)return;           /* FPS chegarasi: ortiqcha kadrni o’tkazib yuborish */
 lt=t;const bg=S.background;if(png==2)S.background=null;
 if(C.fxaa&&s===S){
  R.getDrawingBufferSize(sz);
  if(!rt)rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{samples:R.capabilities.isWebGL2?4:0});
  if(rt.width!=sz.x||rt.height!=sz.y)rt.setSize(sz.x,sz.y);
  R.setRenderTarget(rt);r0(s,c);R.setRenderTarget(null);
  fm.uniforms.t.value=rt.texture;fm.uniforms.px.value.set(1/sz.x,1/sz.y);r0(fs,fc);
 }else r0(s,c);
 S.background=bg;fo=png=0};
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#rnd')){fo=1;png=C.pngT?2:1}},true);   /* Render (PNG) har doim chiziladi */

/* ---------- yoritish ---------- */
function light(){hl0.intensity=C.hemi;dl.intensity=C.dirI;dl.color.set(C.lc);
 const L=dl.position.length()||12,def=C.az==35&&C.el==49;
 if(!def||lm){const a=C.az*Math.PI/180,e=C.el*Math.PI/180,v=def?new THREE.Vector3(5,10,7).normalize():new THREE.Vector3(Math.cos(e)*Math.sin(a),Math.sin(e),Math.cos(e)*Math.cos(a));dl.position.copy(v).multiplyScalar(L);lm=!def}}
const snapAp=()=>{if($('#snap').classList.contains('on')){tc.setTranslationSnap(C.snT);tc.setRotationSnap(C.snR*Math.PI/180);tc.setScaleSnap(C.snS)}};
const bgSet=v=>{C.bgOn=true;S.background=new THREE.Color(v);vp.style.background=v;$('#bgc').value=v};
const bgOff=()=>{C.bgOn=false;S.background=null;vp.style.background=''};
const vis=(id,v)=>{$(id).hidden=!v};
const xfer=(ok)=>E('input',{type:'file',accept:'.json,application/json',hidden:true,onchange:ok});

/* ---------- sxema ---------- */
const sec=[
['3D ko’rinish sifati',[
 {k:'q',t:'sel',l:'Ko’rinish sifatini tanlang',h:'Tayyor to’plam. Pastdagi “Sifatni alohida sozlash” o’zgarsa, “Maxsus” bo’ladi.',o:[...Object.keys(PS.q.t),'Maxsus'],v:'Yuqori',ps:'q'},
 {k:'fps',t:'sel',l:'FPS chegarasi',h:'Past FPS batareyani tejaydi.',o:[[0,'Cheklovsiz'],[30,'30 FPS'],[45,'45 FPS'],[60,'60 FPS'],[90,'90 FPS'],[120,'120 FPS']],v:0},
 {k:'bg',t:'col',l:'Orqa fon rangi',v:'#444444',ap:bgSet,on:'bgOn',sw:['#1d1d1d','#444444','#808080','#d9d9d9','#ffffff','#1e3a5f','#2d4a2b','#5a2d2d']},
 {t:'btn',l:'Standart fon',b:'Qaytarish',ap:bgOff},
 {k:'bgOn',v:false,np2:1}]],
['Sifatni alohida sozlash',[
 {k:'scale',t:'sel',l:'Render o’lchami',h:'Kadr piksellari. Kattasi aniqroq, lekin sekinroq. Render (PNG) ham shu o’lchamda.',o:[[50,'50%'],[75,'75%'],[100,'100%'],[125,'125%'],[150,'150%'],[200,'200%']],v:100,ap:qual},
 {k:'fxaa',t:'chk',l:'FXAA qirralarni silliqlash',h:'Qirralardagi “zinapoya”ni yumshatadi.',v:false},
 {k:'shd',t:'sel',l:'Soyalar aniqligi',o:[[512,'Past (512)'],[1024,'O’rta (1024)'],[2048,'Yuqori (2048)'],[4096,'Ultra (4096)']],v:2048,ap:qual},
 {k:'shT',t:'sel',l:'Soya turi',o:['Yumshoq','Aniq','Qattiq'],v:'Yumshoq',ap:qual},
 {k:'aniso',t:'sel',l:'Detallar tiniqligi',h:'Qiya burchakdagi teksturalar tiniqligi (anizotropiya).',o:[[1,'O’chiq'],[2,'2×'],[4,'4×'],[8,'8×'],[16,'16×']],v:4,ap:qual},
 {k:'mem',t:'chk',l:'Xotirani tejash',h:'Render o’lchami ≤ 100%, soya ≤ 1024, anizotropiya o’chiq.',v:false,ap:qual}]],
['Yoritish va ko’rinish',[
 {k:'lp',t:'sel',l:'Yoritish rejimi',o:[...Object.keys(PS.lp.t),'Maxsus'],v:'Studiya',ps:'lp'},
 {k:'hemi',t:'rng',l:'Umumiy yorug’lik',mn:0,mx:3,st:.1,v:1.2,ap:light},
 {k:'dirI',t:'rng',l:'Asosiy yorug’lik',mn:0,mx:4,st:.1,v:1.3,ap:light},
 {k:'az',t:'rng',l:'Yorug’lik yo’nalishi',mn:0,mx:360,st:5,u:'°',v:35,ap:light},
 {k:'el',t:'rng',l:'Yorug’lik balandligi',mn:5,mx:90,st:5,u:'°',v:49,ap:light},
 {k:'lc',t:'col',l:'Yorug’lik rangi',v:'#ffffff',ap:light},
 {k:'tone',t:'sel',l:'Ranglar ishlovi (tone mapping)',o:Object.keys(TM),v:'Yo’q',ap:v=>{R.toneMapping=TM[v]||0;remat()}},
 {k:'exp',t:'rng',l:'Ekspozitsiya',mn:.2,mx:3,st:.1,v:1,ap:v=>R.toneMappingExposure=v},
 {k:'shOn',t:'chk',l:'Soya',v:false,np:1,g:()=>sh,ap:v=>{if(v!=sh)$('#shd').click()}},
 {k:'shO',t:'rng',l:'Soya qoraligi',mn:5,mx:100,st:5,u:'%',v:35,ap:qual},
 {k:'gr',t:'chk',l:'Panjara',v:true,np:1,g:()=>grid.visible,ap:v=>{grid.visible=v;$('#grid').classList.toggle('on',grid.visible||axs.visible)}},
 {k:'ax',t:'chk',l:'Koordinata o’qlari',v:true,np:1,g:()=>axs.visible,ap:v=>{axs.visible=v;$('#grid').classList.toggle('on',grid.visible||axs.visible)}}]],
['Kamera va tahrirlash',[
 {k:'fov',t:'rng',l:'Ko’rish burchagi (FOV)',mn:20,mx:100,st:1,u:'°',v:50,ap:v=>{if(ortho)return;dolly(cam.fov,v);cam.fov=v;cam.updateProjectionMatrix()}},
 {k:'damp',t:'chk',l:'Kamera silliq to’xtashi',v:true,ap:v=>ctl.enableDamping=v},
 {k:'rotS',t:'rng',l:'Aylantirish tezligi',mn:.2,mx:3,st:.1,u:'×',v:1,ap:v=>ctl.rotateSpeed=v},
 {k:'zoomS',t:'rng',l:'Yaqinlashtirish tezligi',mn:.2,mx:3,st:.1,u:'×',v:1,ap:v=>ctl.zoomSpeed=v},
 {k:'panS',t:'rng',l:'Siljitish tezligi',mn:.2,mx:3,st:.1,u:'×',v:1,ap:v=>ctl.panSpeed=v},
 {k:'autoS',t:'rng',l:'Avto aylanish tezligi',mn:.5,mx:10,st:.5,v:2,ap:v=>ctl.autoRotateSpeed=v},
 {k:'gz',t:'rng',l:'Tutqich (gizmo) o’lchami',mn:.5,mx:2,st:.1,u:'×',v:1,ap:v=>tc.setSize(v)},
 {k:'spc',t:'sel',l:'Tutqich koordinatasi',o:[['world','Global'],['local','Lokal']],v:'world',ap:v=>tc.setSpace(v)},
 {k:'snT',t:'rng',l:'Magnit: siljitish qadami',mn:.1,mx:5,st:.1,v:.5,ap:snapAp},
 {k:'snR',t:'rng',l:'Magnit: burish qadami',mn:1,mx:90,st:1,u:'°',v:15,ap:snapAp},
 {k:'snS',t:'rng',l:'Magnit: o’lcham qadami',mn:.01,mx:1,st:.01,v:.1,ap:snapAp},
 {k:'hl',t:'rng',l:'Bekor qilish tarixi',h:'Eng ko’p saqlanadigan amallar soni.',mn:10,mx:500,st:10,v:200}]],
['Interfeys va asboblar',[
 {k:'lang',t:'sel',l:'Dastur tili',o:[['uz','O’zbekcha'],['en','English'],['ru','Русский']],v:'uz',ap:v=>window.I18N&&I18N.set(v)},
 {k:'ui',t:'sel',l:'Interfeys o’lchami',o:[[11,'Kichik'],[12,'Oddiy'],[14,'Katta'],[16,'Juda katta']],v:12,ap:v=>document.body.style.fontSize=v+'px'},
 {k:'acc',t:'col',l:'Asosiy rang',v:'#4772b3',ap:v=>document.documentElement.style.setProperty('--ac',v),sw:['#4772b3','#2e8b57','#8a5cc2','#c0392b','#d98a1f']},
 {k:'tLt',t:'chk',l:'Chap asboblar paneli',v:true,ap:v=>vis('#lt',v)},
 {k:'tVh',t:'chk',l:'Ko’rinish tugmalari (Ortho, Old…)',v:true,ap:v=>vis('#vh',v)},
 {k:'tAs',t:'chk',l:'O’ng panel (Outliner, Xossalar)',v:true,ap:v=>vis('aside',v)},
 {k:'tFt',t:'chk',l:'Pastki holat qatori',v:true,ap:v=>vis('footer',v)},
 {k:'asW',t:'rng',l:'O’ng panel kengligi',mn:200,mx:480,st:10,u:' px',v:280,ap:v=>$('aside').style.width=v+'px'},
 {t:'info',l:'Klaviatura yorliqlari',x:'G ko’chirish · R aylantirish · S o’lcham\nShift+D nusxa · X o’chirish · F kamera\nCtrl+Z / Ctrl+Y bekor qilish / qaytarish\nTab — Edit mode · Ctrl+A hammasi\nNumpad 1 / 3 / 7 — old / o’ng / yuqori'}]],
['Fayllar va tiklash',[
 {k:'fmt',t:'sel',l:'Standart eksport formati',o:()=>[...$('#fmt').options].map(o=>o.value),v:'glb',ap:v=>{$('#fmt').value=v}},
 {k:'txm',t:'sel',l:'Eksport: maks. tekstura',o:[256,512,1024,2048],v:1024,ap:v=>{$('#txm').value=v}},
 {k:'txalso',t:'chk',l:'DFF bilan TXD ham eksport',v:true,ap:v=>{$('#txalso').checked=v}},
 {k:'zup',t:'chk',l:'Eksport: Z-up',v:false,ap:v=>{$('#zup').checked=v}},
 {k:'pngT',t:'chk',l:'Render (PNG): shaffof fon',v:false},
 {k:'warn',t:'chk',l:'Sahifadan chiqishda ogohlantirish',h:'Model ochiq bo’lsa, saqlanmagan o’zgarishlar yo’qolishidan oldin so’raydi.',v:false},
 {t:'btn',l:'Sozlamalarni zaxiralash',b:'Faylga saqlash (.json)',ap:()=>{saveBlob(new Blob([JSON.stringify(C,null,1)],{type:'application/json'}),'3d-studiya-sozlamalar.json')}},
 {t:'btn',l:'Sozlamalarni tiklash',b:'Fayldan yuklash…',ap:()=>fi.click()},
 {t:'btn',l:'Standart sozlamalarga qaytarish',b:'Hammasini asliga qaytarish',ap:()=>{if(!confirm('Barcha sozlamalar standart holatga qaytarilsinmi?'))return;bgOff();C=Object.assign({},DEF);save();applyAll();sync();toast('Sozlamalar asliga qaytarildi')}},
 {t:'btn',l:'Ilova keshi',h:'Yangilanish ko’rinmasa yordam beradi. Modellar o’chmaydi, lekin ochiq sahna yopiladi.',b:'Keshni tozalash va qayta yuklash',ap:async()=>{if(!confirm('Kesh tozalanib, sahifa qayta yuklanadi. Davom etasizmi?'))return;
  try{if(navigator.serviceWorker)(await navigator.serviceWorker.getRegistrations()).forEach(r=>r.unregister());if(window.caches)(await caches.keys()).forEach(k=>caches.delete(k))}catch(e){}location.reload()}}]]
];
const I=sec.flatMap(s=>s[1]),DEF={};I.forEach(i=>{if(i.k)DEF[i.k]=i.v});
const conv=(k,v)=>typeof DEF[k]=='boolean'?!!v:v;
try{C=Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){C=Object.assign({},DEF)}
const save=()=>{try{const o={};for(const k in C)if(!I.find(i=>i.k==k&&i.np))o[k]=C[k];localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}};
function applyAll(keys){I.forEach(i=>{if(!i.ap||i.t=='btn'||i.np||(keys&&!keys.includes(i.k))||(i.on&&!C[i.on]))return;i.ap(C[i.k])})}
function detect(k){for(const g in PS){const p=PS[g];if(p.k.includes(k))C[g]=Object.keys(p.t).find(n=>p.k.every((kk,i)=>C[kk]==conv(kk,p.t[n][i])))||p.c}}
function chg(it,v){
 if(it.ps){C[it.k]=v;const r=PS[it.ps].t[v];if(r){PS[it.ps].k.forEach((k,i)=>C[k]=conv(k,r[i]));applyAll(PS[it.ps].k)}}
 else{C[it.k]=conv(it.k,v);it.ap&&it.ap(C[it.k]);detect(it.k)}
 save();sync()}

/* ---------- oyna (dialog) ---------- */
const dlg=E('dialog',{id:'sp'}),bd=E('div',{className:'db'}),fi=xfer(()=>{const f=fi.files[0];fi.value='';if(!f)return;
 f.text().then(t=>{const o=JSON.parse(t);Object.keys(DEF).forEach(k=>{if(k in o&&typeof o[k]==typeof DEF[k])C[k]=o[k]});save();applyAll();sync();toast('Sozlamalar yuklandi')}).catch(()=>toast('Sozlamalar fayli yaroqsiz'))});
const ctr=[];
function mk(it){
 const r=E('div',{className:'sr'}),lb=E('label',{textContent:it.l});if(it.h)lb.append(E('small',{textContent:it.h}));r.append(lb);
 let c;const cv=x=>x!==''&&!isNaN(x)?+x:x;
 if(it.t=='sel'){c=E('select');(typeof it.o=='function'?it.o():it.o).forEach(o=>{const a=[].concat(o);c.append(E('option',{value:a[0],textContent:a[1]??a[0]}))});c.onchange=()=>chg(it,cv(c.value));it.set=v=>{c.value=v}}
 else if(it.t=='rng'){const o=E('output'),i=E('input',{type:'range',min:it.mn,max:it.mx,step:it.st});i.oninput=()=>chg(it,+i.value);c=E('div',{className:'rg'},[i,o]);it.set=v=>{i.value=v;o.textContent=(+v).toFixed(it.st<.1?2:it.st<1?1:0)+(it.u||'')}}
 else if(it.t=='chk'){c=E('input',{type:'checkbox',onchange:()=>chg(it,c.checked)});it.set=v=>{c.checked=!!v}}
 else if(it.t=='col'){const i=E('input',{type:'color',oninput:()=>chg(it,i.value)});c=E('div',{},[i]);if(it.sw)c.append(E('div',{className:'sw'},it.sw.map(s=>E('button',{type:'button',title:s,style:'background:'+s,onclick:()=>chg(it,s)}))));it.set=v=>{i.value=v}}
 else if(it.t=='btn')c=E('button',{textContent:it.b,onclick:it.ap});
 else{r.className='sr wide';c=E('pre',{className:'in',textContent:it.x})}
 r.append(c);return r}
sec.forEach(([t,items],gi)=>{const d=E('details',{className:'sg',open:gi==0},[E('summary',{textContent:t})]);items.forEach(it=>{if(it.t)d.append(mk(it))});bd.append(d)});
dlg.append(E('div',{className:'ph'},[E('b',{textContent:'Sozlamalar'}),E('span',{className:'sp'}),E('button',{textContent:'✕',title:'Yopish',onclick:()=>dlg.close()})]),bd,fi);
function sync(){I.forEach(i=>{if(i.set)i.set(i.g?i.g():C[i.k])})}
[dlg].forEach(d=>{d.addEventListener('keydown',e=>e.stopPropagation());d.addEventListener('click',e=>{if(e.target==d)d.close()})});

/* ---------- Ilova haqida ---------- */
const ab=E('dialog',{id:'ab'});
ab.innerHTML=`<div class="ph"><b>Ilova haqida</b><span class="sp"></span><button title="Yopish">✕</button></div>
<div class="db ab-body">
<h2>3D STUDIYA <small>v33</small></h2>
<p>3D Studiya — brauzerda ishlaydigan 3D ko’rish, tahrirlash va konvertatsiya dasturi. Fayllar serverga yuklanmaydi: hammasi qurilmangizning o’zida bajariladi. Ilovani telefon yoki kompyuterga o’rnatib, internetsiz ham ishlatish mumkin.</p>
<h3>Imkoniyatlar</h3>
<ul>
<li>GLB, GLTF, OBJ, FBX, STL, PLY, DAE, 3MF, USD, SKP, STEP va boshqa ko’plab formatlarni ochish va eksport qilish.</li>
<li>GTA modlari uchun: DFF, TXD, YFT, YDR, YTD va RPF fayllari, avto razmer, dummy va _ok/_dam vositalari.</li>
<li>Tahrirlash: ko’chirish, aylantirish, o’lcham, Edit mode, Boolean, poligon kamaytirish, material presetlari.</li>
<li>Soya, o’lchash, animatsiya, X-ray, Render (PNG) va ko’rinish sifati sozlamalari.</li>
</ul>
<h3>Ilova yaratuvchilari</h3>
<p><b>Toshov Ozodbek</b> va <b>O’ktamov Ruslan</b></p>
<h3>Manzil</h3>
<p>Buxoro, O’zbekiston</p>
<h3>Ijtimoiy tarmoqlar</h3>
<p class="lk">
<a href="https://t.me/Ozodbek_Toshov" target="_blank" rel="noopener">Telegram — Toshov Ozodbek</a>
<a href="https://t.me/rus_lancik_558" target="_blank" rel="noopener">Telegram — O’ktamov Ruslan</a>
<a href="mailto:ozodbektoshov0@gmail.com">Email — ozodbektoshov0@gmail.com</a>
<a href="https://3d-studiya.vercel.app/" target="_blank" rel="noopener">Sayt — 3d-studiya.vercel.app</a>
</p>
<h3>Texnologiyalar</h3>
<p class="mt">Three.js r147 · OpenCascade (STEP/IGES) · rhino3dm · OpenSKP (MIT) · fflate. Uchinchi tomon litsenziyalari: THIRD_PARTY_LICENSES.md.</p>
<p class="mt">© 2026 3D Studiya · Toshov Ozodbek, O’ktamov Ruslan</p>
</div>`;
ab.querySelector('button').onclick=()=>ab.close();
ab.addEventListener('click',e=>{if(e.target==ab)ab.close()});ab.addEventListener('keydown',e=>e.stopPropagation());
document.body.append(dlg,ab);
$('#bset').onclick=()=>{sync();dlg.showModal()};$('#bab').onclick=()=>ab.showModal();

/* ---------- boshqa modullar bilan bog’lanish ---------- */
const so=setOrtho;   /* Ortho: FOV ni saqlab qolish */
setOrtho=b=>{if(b==ortho)return;if(b&&cam.fov!=50){dolly(cam.fov,50);cam.fov=50}so(b);if(!b&&C.fov!=50){dolly(50,C.fov);cam.fov=C.fov;cam.updateProjectionMatrix()}};
const rf2=refresh;refresh=()=>{rf2();aniso();if(H.length>C.hl)H.splice(0,H.length-C.hl)};
$('#shd').addEventListener('click',()=>{qual();light()});      /* soya yoqilganda o’zgarishlarni qayta qo’llash */
$('#rot').addEventListener('click',()=>{ctl.autoRotateSpeed=C.autoS});
$('#snap').addEventListener('click',snapAp);
$('#bgc').addEventListener('input',e=>{C.bg=e.target.value;C.bgOn=true;save()});
addEventListener('beforeunload',e=>{if(C.warn&&meshes().length){e.preventDefault();e.returnValue=''}});
applyAll();detect('scale');detect('hemi');sync();
})();
