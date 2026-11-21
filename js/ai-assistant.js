/* ---- AI Studiya: Gemini asosidagi 3D yordamchi, protsedural 3D generator va PBR material sozlovchi ---- */
(function(){
'use strict';
if(typeof document==='undefined'||typeof window==='undefined')return;

if(window.I18N&&I18N.add){
 I18N.add(`AI|AI|ИИ
AI Studiya|AI Studio|ИИ-студия
Suhbat / Tahlil|Chat / Analyze|Чат / Анализ
3D yaratish|Generate 3D|Создать 3D
Material va yorug’lik|Material & Light|Материал и свет
Sahna rasmini yuborish|Include viewport screenshot|Прикрепить снимок сцены
Yuborish|Send|Отправить
Yozing… (masalan: Sport mashina yarat yoki Modelni tahlil qil)|Type a prompt… (e.g. Create a sports car or Analyze the scene)|Введите запрос… (например: Создай спорткар или Проанализируй сцену)
AI o’ylamoqda…|AI is thinking…|ИИ думает…
Tozalash|Clear|Очистить
3D obyekt qo’shildi|3D object added|3D-объект добавлен
Material qo’llandi|Material applied|Материал применён
Yorug’lik yangilandi|Lighting updated|Освещение обновлено
Sport mashina yarat|Create a sports car|Создай спорткар
Daraxt va uy yasab ber|Build a house and tree|Построй дом и дерево
Oltin xrom material|Gold chrome material|Золотой хром материал
Modelni tahlil qil|Analyze current model|Анализ текущей модели`);
}

const q=s=>document.querySelector(s);
const lang=()=>document.documentElement.lang||'uz';
const T=s=>{
 const l=lang();
 if(l==='uz'||!window.I18N||!I18N.t)return s;
 return I18N.t(s)||s;
};

/* ---------- sahna konteksti va rasmga olish ---------- */
function getSceneSummary(){
 try{
  const ml=typeof meshes==='function'?meshes():[];
  let tris=0;
  const names=[];
  ml.forEach(m=>{
   const g=m.geometry;
   if(g){
    const p=g.getAttribute('position');
    if(p)tris+=Math.round((g.index?g.index.count:p.count)/3);
   }
   if(names.length<24&&m.name)names.push(m.name);
  });
  const selName=(typeof sel!=='undefined'&&sel)?(sel.name||'(unnamed)'):'none';
  let dims='empty';
  if(ml.length&&typeof root!=='undefined'){
   const b=new THREE.Box3().setFromObject(root);
   if(!b.isEmpty()){
    const sz=b.getSize(new THREE.Vector3());
    dims=`${sz.x.toFixed(2)}m x ${sz.y.toFixed(2)}m x ${sz.z.toFixed(2)}m`;
   }
  }
  return `Meshes: ${ml.length}, Triangles: ${tris}, Bounds: ${dims}, Selected: ${selName}, Sample names: ${names.join(', ')||'none'}`;
 }catch(e){return '';}
}

function captureViewport(){
 try{
  if(typeof R==='undefined'||typeof S==='undefined'||typeof cam==='undefined'||typeof cv==='undefined')return null;
  const bVis=typeof bh!=='undefined'?bh.visible:false;
  const tVis=typeof tc!=='undefined'?tc.visible:false;
  if(typeof bh!=='undefined')bh.visible=false;
  if(typeof tc!=='undefined')tc.visible=false;
  R.render(S,cam);
  const w=cv.width,h=cv.height;
  let dataUrl;
  if(w>960||h>960){
   const k=960/Math.max(w,h);
   const tmp=document.createElement('canvas');
   tmp.width=Math.max(1,Math.round(w*k));
   tmp.height=Math.max(1,Math.round(h*k));
   tmp.getContext('2d').drawImage(cv,0,0,tmp.width,tmp.height);
   dataUrl=tmp.toDataURL('image/jpeg',0.82);
  }else{
   dataUrl=cv.toDataURL('image/png');
  }
  if(typeof bh!=='undefined')bh.visible=bVis;
  if(typeof tc!=='undefined')tc.visible=tVis;
  return dataUrl;
 }catch(e){return null;}
}

/* ---------- 3D primitiv generatori ---------- */
function buildGeometry(shape){
 switch(String(shape||'box').toLowerCase()){
  case 'sphere': return new THREE.SphereGeometry(0.5,24,16);
  case 'cylinder': return new THREE.CylinderGeometry(0.5,0.5,1,24);
  case 'cone': return new THREE.ConeGeometry(0.5,1,24);
  case 'torus': return new THREE.TorusGeometry(0.5,0.16,16,36);
  case 'plane': return new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  case 'box':
  default: return new THREE.BoxGeometry(1,1,1);
 }
}

function clamp(v,mn,mx,def){
 const n=Number(v);
 return Number.isFinite(n)?Math.max(mn,Math.min(mx,n)):def;
}

function applyGenerated3D(data){
 if(!data||!Array.isArray(data.parts)||!data.parts.length)return 0;
 const grp=new THREE.Group();
 grp.name=String(data.groupName||'AI_Model').slice(0,48);
 const D2R=Math.PI/180;
 let count=0;
 data.parts.slice(0,40).forEach((p,idx)=>{
  const geom=buildGeometry(p.shape);
  const op=clamp(p.opacity,0.05,1,1);
  const mat=new THREE.MeshStandardMaterial({
   color:String(p.color||'#cccccc'),
   roughness:clamp(p.roughness,0,1,0.5),
   metalness:clamp(p.metalness,0,1,0.1),
   opacity:op,
   transparent:op<0.99,
   side:THREE.DoubleSide
  });
  const mesh=new THREE.Mesh(geom,mat);
  mesh.name=String(p.name||('part_'+(idx+1))).slice(0,40);
  const pos=Array.isArray(p.position)?p.position:[0,0,0];
  const rot=Array.isArray(p.rotationDeg)?p.rotationDeg:[0,0,0];
  const scl=Array.isArray(p.scale)?p.scale:[1,1,1];
  mesh.position.set(clamp(pos[0],-500,500,0),clamp(pos[1],-500,500,0),clamp(pos[2],-500,500,0));
  mesh.rotation.set(clamp(rot[0],-360,360,0)*D2R,clamp(rot[1],-360,360,0)*D2R,clamp(rot[2],-360,360,0)*D2R);
  mesh.scale.set(clamp(scl[0],0.01,500,1),clamp(scl[1],0.01,500,1),clamp(scl[2],0.01,500,1));
  grp.add(mesh);
  count++;
 });
 if(!count)return 0;
 if(typeof add==='function'){
  add(grp);
 }else if(typeof root!=='undefined'){
  root.add(grp);
  if(q('#hint'))q('#hint').style.display='none';
 }
 if(typeof refresh==='function')refresh();
 if(typeof fit==='function')fit(grp);
 return count;
}

function applyMaterialAndLight(data){
 const badges=[];
 if(!data)return badges;
 const targets=[];
 if(data.applyToAll&&typeof meshes==='function'){
  targets.push(...meshes());
 }else if(data.applyToSelected){
  if(typeof MS!=='undefined'&&MS.size)targets.push(...MS);
  if(typeof sel!=='undefined'&&sel){
   if(sel.isMesh&&!targets.includes(sel))targets.push(sel);
   else if(sel.traverse)sel.traverse(o=>{if(o.isMesh&&!targets.includes(o))targets.push(o)});
  }
  if(!targets.length&&typeof meshes==='function')targets.push(...meshes());
 }
 if(data.material&&targets.length&&typeof mats==='function'){
  const mCfg=data.material;
  const snapshots=[];
  targets.forEach(mesh=>{
   mats(mesh).forEach(m=>{
    snapshots.push({
     m,
     color:m.color?m.color.getHex():null,
     roughness:m.roughness,
     metalness:m.metalness,
     opacity:m.opacity,
     transparent:m.transparent,
     flatShading:m.flatShading
    });
    if(mCfg.color&&m.color)try{m.color.set(mCfg.color)}catch(e){}
    if(m.roughness!=null&&mCfg.roughness!=null)m.roughness=clamp(mCfg.roughness,0,1,m.roughness);
    if(m.metalness!=null&&mCfg.metalness!=null)m.metalness=clamp(mCfg.metalness,0,1,m.metalness);
    if(m.opacity!=null&&mCfg.opacity!=null){
     m.opacity=clamp(mCfg.opacity,0.05,1,1);
     m.transparent=m.opacity<0.99;
    }
    if(typeof mCfg.flatShading==='boolean'&&m.flatShading!=null)m.flatShading=mCfg.flatShading;
    m.needsUpdate=true;
   });
  });
  if(typeof hist==='function'&&snapshots.length){
   const applySnap=()=>snapshots.forEach(s=>{
    if(s.color!=null&&s.m.color)s.m.color.setHex(s.color);
    if(s.roughness!=null)s.m.roughness=s.roughness;
    if(s.metalness!=null)s.m.metalness=s.metalness;
    if(s.opacity!=null){s.m.opacity=s.opacity;s.m.transparent=s.transparent}
    if(s.flatShading!=null)s.m.flatShading=s.flatShading;
    s.m.needsUpdate=true;
   });
   const redoSnap=()=>targets.forEach(mesh=>mats(mesh).forEach(m=>{
    if(mCfg.color&&m.color)try{m.color.set(mCfg.color)}catch(e){}
    if(m.roughness!=null&&mCfg.roughness!=null)m.roughness=clamp(mCfg.roughness,0,1,m.roughness);
    if(m.metalness!=null&&mCfg.metalness!=null)m.metalness=clamp(mCfg.metalness,0,1,m.metalness);
    if(m.opacity!=null&&mCfg.opacity!=null){m.opacity=clamp(mCfg.opacity,0.05,1,1);m.transparent=m.opacity<0.99}
    if(typeof mCfg.flatShading==='boolean'&&m.flatShading!=null)m.flatShading=mCfg.flatShading;
    m.needsUpdate=true;
   }));
   hist(applySnap,redoSnap);
  }
  if(typeof sync==='function')sync();
  badges.push(T('Material qo’llandi'));
 }
 if(data.scene&&typeof S!=='undefined'){
  const sc=data.scene;
  let litChanged=false;
  const hl=S.children.find(o=>o.isHemisphereLight);
  if(hl&&sc.ambientIntensity!=null){hl.intensity=clamp(sc.ambientIntensity,0.1,3,hl.intensity);litChanged=true}
  if(typeof dl!=='undefined'){
   if(sc.dirIntensity!=null){dl.intensity=clamp(sc.dirIntensity,0.1,4,dl.intensity);litChanged=true}
   if(sc.lightColor){try{dl.color.set(sc.lightColor);litChanged=true}catch(e){}}
  }
  if(sc.bgColor&&/^#[0-9a-f]{3,6}$/i.test(sc.bgColor.trim())){
   try{
    S.background=new THREE.Color(sc.bgColor.trim());
    if(typeof vp!=='undefined'&&vp)vp.style.background=sc.bgColor.trim();
    litChanged=true;
   }catch(e){}
  }
  if(litChanged)badges.push(T('Yorug’lik yangilandi'));
 }
 return badges;
}

/* ---------- UI yaratish ---------- */
const hd=q('header');
if(!hd)return;

const aibtn=document.createElement('button');
aibtn.id='aibtn';
aibtn.className='hb';
aibtn.type='button';
aibtn.innerHTML='<svg class="ic ai-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/></svg><span class="hbt">AI</span>';
aibtn.title='AI Studiya';
aibtn.setAttribute('aria-label','AI Studiya');
const anchor=q('#gbtn')||q('#bset')||q('header .sp');
anchor?hd.insertBefore(aibtn,anchor):hd.append(aibtn);

const panel=document.createElement('section');
panel.id='aipanel';
panel.setAttribute('aria-label','AI Studiya');
panel.hidden=true;
panel.innerHTML=`
 <div class="ai-hd">
  <div class="ai-title"><span class="ai-star">✦</span><b>AI Studiya</b></div>
  <div class="ai-hd-act">
   <button type="button" id="ai-clr" title="Tozalash">Tozalash</button>
   <button type="button" id="ai-close" title="Yopish">✕</button>
  </div>
 </div>
 <div class="ai-tabs" role="tablist">
  <button type="button" data-am="assistant" class="on">Suhbat / Tahlil</button>
  <button type="button" data-am="generate3d">3D yaratish</button>
  <button type="button" data-am="material">Material va yorug’lik</button>
 </div>
 <div class="ai-chips" id="ai-chips"></div>
 <div class="ai-log" id="ai-log"></div>
 <form class="ai-fm" id="ai-fm">
  <label class="ai-snap"><input type="checkbox" id="ai-snap"><span>Sahna rasmini yuborish</span></label>
  <div class="ai-row">
   <textarea id="ai-inp" rows="2" placeholder="Yozing… (masalan: Sport mashina yarat yoki Modelni tahlil qil)"></textarea>
   <button type="submit" id="ai-send" class="pri">Yuborish</button>
  </div>
 </form>
`;
document.body.append(panel);

panel.addEventListener('keydown',e=>e.stopPropagation());

let mode='assistant';
let busy=false;
const history=[];

const PRESETS={
 assistant:['Modelni tahlil qil','Sport mashina yarat'],
 generate3d:['Sport mashina yarat','Daraxt va uy yasab ber'],
 material:['Oltin xrom material']
};

function renderChips(){
 const box=q('#ai-chips');
 if(!box)return;
 box.textContent='';
 (PRESETS[mode]||[]).forEach(txt=>{
  const b=document.createElement('button');
  b.type='button';
  b.textContent=T(txt);
  b.onclick=()=>{
   const inp=q('#ai-inp');
   inp.value=b.textContent;
   inp.focus();
  };
  box.append(b);
 });
}

function addMsg(role,text,badges,isErr){
 const log=q('#ai-log');
 const el=document.createElement('div');
 el.className='ai-msg '+role+(isErr?' err':'');
 const body=document.createElement('div');
 body.className='ai-txt';
 body.textContent=text;
 el.append(body);
 if(badges&&badges.length){
  const br=document.createElement('div');
  br.className='ai-badges';
  badges.forEach(t=>{
   const sp=document.createElement('span');
   sp.textContent=t;
   br.append(sp);
  });
  el.append(br);
 }
 log.append(el);
 log.scrollTop=log.scrollHeight;
 return el;
}

function setMode(m){
 mode=m;
 panel.querySelectorAll('.ai-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.am===m));
 renderChips();
}

panel.querySelectorAll('.ai-tabs button').forEach(b=>{
 b.onclick=()=>setMode(b.dataset.am);
});

aibtn.onclick=()=>{
 panel.hidden=!panel.hidden;
 aibtn.classList.toggle('on',!panel.hidden);
 if(!panel.hidden){
  renderChips();
  setTimeout(()=>q('#ai-inp').focus(),40);
 }
};
q('#ai-close').onclick=()=>{
 panel.hidden=true;
 aibtn.classList.remove('on');
};
q('#ai-clr').onclick=()=>{
 history.length=0;
 q('#ai-log').textContent='';
};

const inp=q('#ai-inp');
inp.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&!e.shiftKey){
  e.preventDefault();
  q('#ai-fm').requestSubmit();
 }
});

q('#ai-fm').onsubmit=async e=>{
 e.preventDefault();
 if(busy)return;
 const prompt=inp.value.trim();
 if(!prompt)return;
 inp.value='';
 addMsg('user',prompt);
 history.push({role:'user',text:prompt});
 busy=true;
 const sendBtn=q('#ai-send');
 sendBtn.disabled=true;
 const waitEl=addMsg('ai',T('AI o’ylamoqda…'));
 waitEl.classList.add('wait');
 const ctrl=typeof AbortController!=='undefined'?new AbortController():null;
 const tm=ctrl?setTimeout(()=>ctrl.abort(),45000):0;
 try{
  const snapOn=q('#ai-snap').checked;
  const imageBase64=snapOn?captureViewport():null;
  const res=await fetch('/api/ai/chat',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   signal:ctrl?ctrl.signal:undefined,
   body:JSON.stringify({
    prompt,
    mode,
    lang:lang(),
    sceneSummary:getSceneSummary(),
    imageBase64,
    history:history.slice(-6)
   })
  });
  const data=await res.json().catch(()=>({}));
  waitEl.remove();
  if(!res.ok){
   const errMsg=data.error||('HTTP '+res.status);
   addMsg('ai',errMsg,null,true);
   return;
  }
  if(mode==='generate3d'){
   const r=data.result||{};
   const n=applyGenerated3D(r);
   const badges=n?[T('3D obyekt qo’shildi')+` (${r.groupName||'AI_Model'} · ${n})`]:[];
   const txt=r.summary||(n?T('3D obyekt qo’shildi'):'');
   addMsg('ai',txt,badges);
   history.push({role:'ai',text:txt});
   if(n&&typeof toast==='function')toast(T('3D obyekt qo’shildi'));
  }else if(mode==='material'){
   const r=data.result||{};
   const badges=applyMaterialAndLight(r);
   const txt=r.summary||T('Material qo’llandi');
   addMsg('ai',txt,badges);
   history.push({role:'ai',text:txt});
   if(badges.length&&typeof toast==='function')toast(badges[0]);
  }else{
   const txt=(data.result&&data.result.text)||'';
   addMsg('ai',txt);
   history.push({role:'ai',text:txt});
  }
 }catch(err){
  waitEl.remove();
  addMsg('ai',String(err&&err.message||err),null,true);
 }finally{
  if(tm)clearTimeout(tm);
  busy=false;
  sendBtn.disabled=false;
 }
};

window.addEventListener('i18n-change',renderChips);
renderChips();
})();
