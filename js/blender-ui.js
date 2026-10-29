/* ---- v37: Blender uslubidagi interfeys qatlami ----
   Mavjud funksiyalarga tegmaydi: faqat yangi panellarni (workspace tablari, navigatsiya gizmosi,
   outliner daraxti, Properties tablari, timeline, holat paneli) mavjud tugma va o’zgaruvchilarga ulaydi.
   Ikonkalar shu faylda o’zimiz chizgan SVG’lar. */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const lang=()=>document.documentElement.lang||'uz';
const L=(u,e,r)=>({uz:u,en:e,ru:r}[lang()]||u);

/* ---------- ikonkalar ---------- */
const P={
 logo:'<path d="M8 1.5l6 3.2v6.6l-6 3.2-6-3.2V4.7z"/><path d="M2 4.7l6 3.2 6-3.2M8 7.9v6.6"/>',
 move:'<path d="M8 1.5v13M1.5 8h13M8 1.5L6 3.5M8 1.5l2 2M8 14.5l-2-2M8 14.5l2-2M1.5 8l2-2M1.5 8l2 2M14.5 8l-2-2M14.5 8l-2 2"/>',
 rot:'<path d="M13.2 8A5.2 5.2 0 1 1 11.6 4.3"/><path d="M13 1.8v3h-3"/>',
 scl:'<rect x="2" y="6.5" width="7.5" height="7.5"/><path d="M7.5 8.5l6-6M9.5 2.5h4v4"/>',
 meas:'<path d="M1.8 11.2l9.4-9.4 3 3-9.4 9.4z"/><path d="M4.3 8.7l1.4 1.4M6.4 6.6l1.4 1.4M8.5 4.5l1.4 1.4"/>',
 cube:'<path d="M8 1.5l6 3.2v6.6l-6 3.2-6-3.2V4.7z"/><path d="M2 4.7l6 3.2 6-3.2M8 7.9v6.6"/>',
 fit:'<path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5"/><circle cx="8" cy="8" r="2"/>',
 obj:'<path d="M8 2l5 2.7v5.6L8 13 3 10.3V4.7z"/><path d="M3 4.7L8 7.4l5-2.7M8 7.4V13"/>',
 folder:'<path d="M1.5 4h4.6l1.4 1.5h7v7.5h-13z"/>',
 eye:'<path d="M1 8s2.4-4.3 7-4.3S15 8 15 8s-2.4 4.3-7 4.3S1 8 1 8z"/><circle cx="8" cy="8" r="1.9"/>',
 eyeoff:'<path d="M1 8s2.4-4.3 7-4.3S15 8 15 8s-2.4 4.3-7 4.3S1 8 1 8z"/><path d="M2.5 13.5l11-11"/>',
 mat:'<circle cx="8" cy="8" r="6"/><path d="M3 5.8q5 3 10 0M3 10.2q5-3 10 0"/>',
 tex:'<rect x="2" y="2" width="12" height="12"/><path d="M2 8h12M8 2v12"/><path class="f" d="M2 2h6v6H2zM8 8h6v6H8z" opacity=".55"/>',
 zoom:'<circle cx="6.8" cy="6.8" r="4.5"/><path d="M10.2 10.2l4.3 4.3"/>',
 pan:'<path d="M5 8.5V3.6a1 1 0 0 1 2 0V7M7 7V2.6a1 1 0 0 1 2 0V7M9 7V3.6a1 1 0 0 1 2 0V9M11 8V6.4a1 1 0 0 1 2 0v3.1c0 3-2 5.5-5 5.5-2 0-3-1-4.5-3L2 9.6a1 1 0 0 1 1.7-1L5 10"/>',
 persp:'<path d="M3.5 13.5L5.5 3h5l2 10.5zM4.5 8.5h7"/>',
 play:'<path class="f" d="M4.5 2.5l9 5.5-9 5.5z"/>',
 pause:'<path class="f" d="M4 3h3v10H4zM9 3h3v10H9z"/>',
 j0:'<path d="M3 3v10"/><path class="f" d="M13 3v10L5 8z"/>',
 p1:'<path class="f" d="M11 3v10L4 8z"/>',
 n1:'<path class="f" d="M5 3v10l7-5z"/>',
 j1:'<path class="f" d="M3 3v10l8-5z"/><path d="M13 3v10"/>',
 clip:'<path d="M2 3h12v10H2zM2 6h12"/>'
};
const ic=n=>'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true">'+P[n]+'</svg>';
const put=(el,n)=>{if(el)el.innerHTML=ic(n)};

const lg=q('.logo');if(lg)lg.insertAdjacentHTML('afterbegin',ic('logo'));
const map={'[data-m=translate]':'move','[data-m=rotate]':'rot','[data-m=scale]':'scl','#tmsr':'meas','#tadd':'cube','#fit':'fit',
 '[data-pt=obj]':'obj','[data-pt=mat]':'mat','[data-pt=tex]':'tex','#gzz':'zoom','#gzp':'pan','#gzo':'persp',
 '#tj0':'j0','#tp1':'p1','#tn1':'n1','#tj1':'j1'};
Object.entries(map).forEach(([s,n])=>put(q(s),n));
qa('[data-ic]').forEach(e=>e.innerHTML=ic(e.dataset.ic));

/* ---------- workspace tablari ---------- */
const app=q('#app');
const WS={layout:'obj',modeling:'obj',shading:'mat',animation:'obj'};
function setProps(k){qa('#ptabs button').forEach(b=>b.classList.toggle('on',b.dataset.pt==k));qa('[data-p]').forEach(p=>p.classList.toggle('on',p.dataset.p==k))}
qa('#ptabs button').forEach(b=>b.onclick=()=>setProps(b.dataset.pt));
function setWs(k){
 app.className=(app.className.replace(/\bws-\w+/g,'')+' ws-'+k).trim();
 qa('#ws [data-ws]').forEach(b=>b.classList.toggle('on',b.dataset.ws==k));
 setProps(WS[k]);
 const em=!!window.em;
 if(k=='modeling'&&!em){if(typeof sel!='undefined'&&sel&&sel.geometry)q('#edit').click();else toast(L('Edit rejimi uchun avval mesh tanlang','Select a mesh first to enter Edit mode','Сначала выберите меш для режима правки'))}
 else if(k!='modeling'&&em)q('#edit').click();
 try{localStorage.setItem('ws37',k)}catch(e){}
}
qa('#ws [data-ws]').forEach(b=>b.onclick=()=>setWs(b.dataset.ws));
setWs('layout');

/* ---------- rejim tanlagich ---------- */
const ms=q('#modesel');
ms.onchange=()=>{const e=!!window.em;if((ms.value=='edit')!=e)q('#edit').click();setTimeout(()=>ms.value=window.em?'edit':'obj',60)};

/* ---------- chap asboblar: o'lchash, kub ---------- */
q('#tmsr').onclick=()=>{const b=q('#msr');b&&b.click()};
q('#tadd').onclick=()=>{const b=qa('#addm button').find(x=>/^(Kub|Cube|Куб)$/.test(x.textContent.trim()))||q('#addm button');b&&b.click()};

/* ---------- navigatsiya gizmosi ---------- */
const gz=q('#gzc'),g=gz.getContext('2d'),AX=[
 {v:[1,0,0],c:'#e5484d',l:'X'},{v:[0,1,0],c:'#86d65f',l:'Y'},{v:[0,0,1],c:'#4a8fe8',l:'Z'}];
let gpts=[];
function drawGz(){
 const W=gz.width,H=gz.height,cx=W/2,cy=H/2,R=W*.33,qi=cam.quaternion.clone().invert();
 g.clearRect(0,0,W,H);
 g.fillStyle='#2b2b2b66';g.beginPath();g.arc(cx,cy,W*.46,0,7);g.fill();
 const it=[];
 AX.forEach(a=>[1,-1].forEach(s=>{const v=new THREE.Vector3(...a.v).multiplyScalar(s).applyQuaternion(qi);
  it.push({x:cx+v.x*R,y:cy-v.y*R,z:v.z,s,a,v:a.v.map(k=>k*s)})}));
 it.sort((m,n)=>m.z-n.z);gpts=it;
 it.forEach(p=>{
  if(p.s>0){g.strokeStyle=p.a.c;g.lineWidth=3;g.beginPath();g.moveTo(cx,cy);g.lineTo(p.x,p.y);g.stroke()}
  g.beginPath();g.arc(p.x,p.y,p.s>0?11:8,0,7);
  if(p.s>0){g.fillStyle=p.a.c;g.fill();g.fillStyle='#101010';g.font='bold 12px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(p.a.l,p.x,p.y+.5)}
  else{g.fillStyle=p.a.c+'55';g.fill();g.strokeStyle=p.a.c+'aa';g.lineWidth=1.5;g.stroke()}
 });
}
function viewDir(v){const d=cam.position.distanceTo(ctl.target)||5,t=new THREE.Vector3(...v);if(Math.abs(t.y)>.5){t.x=0;t.z=.001}
 cam.position.copy(ctl.target).addScaledVector(t.normalize(),d);cam.lookAt(ctl.target);ctl.update()}
gz.addEventListener('click',e=>{const r=gz.getBoundingClientRect(),sx=gz.width/r.width,x=(e.clientX-r.left)*sx,y=(e.clientY-r.top)*sx;
 for(let i=gpts.length-1;i>=0;i--){const p=gpts[i],rr=p.s>0?14:11;if(Math.hypot(p.x-x,p.y-y)<=rr){viewDir(p.v);return}}});
gz.addEventListener('pointermove',e=>{const r=gz.getBoundingClientRect(),sx=gz.width/r.width,x=(e.clientX-r.left)*sx,y=(e.clientY-r.top)*sx;
 gz.style.cursor=gpts.some(p=>Math.hypot(p.x-x,p.y-y)<=(p.s>0?14:11))?'pointer':'default'});

function dragBtn(b,fn,click){let st=null;
 b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);st={x:e.clientX,y:e.clientY,m:0};b.classList.add('on')});
 b.addEventListener('pointermove',e=>{if(!st)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;st.m+=Math.abs(dx)+Math.abs(dy);st.x=e.clientX;st.y=e.clientY;fn(dx,dy)});
 const up=()=>{const m=st&&st.m>3;st=null;b.classList.remove('on');if(!m&&click)click()};
 b.addEventListener('pointerup',up);b.addEventListener('pointercancel',()=>{st=null;b.classList.remove('on')})}
dragBtn(q('#gzz'),(dx,dy)=>{const o=cam.position.clone().sub(ctl.target).multiplyScalar(Math.exp(dy*.012));cam.position.copy(ctl.target).add(o)},()=>fit(typeof sel!='undefined'&&sel||undefined));
dragBtn(q('#gzp'),(dx,dy)=>{const k=cam.position.distanceTo(ctl.target)*.0018,r=new THREE.Vector3().setFromMatrixColumn(cam.matrix,0),u=new THREE.Vector3().setFromMatrixColumn(cam.matrix,1),
 o=r.multiplyScalar(-dx*k).add(u.multiplyScalar(dy*k));cam.position.add(o);ctl.target.add(o)});
q('#gzo').onclick=()=>q('#ortho').click();

const VN={front:['Old','Front','Спереди'],back:['Orqa','Back','Сзади'],right:['O’ng','Right','Справа'],left:['Chap','Left','Слева'],top:['Yuqori','Top','Сверху'],bottom:['Pastki','Bottom','Снизу'],user:['Erkin','User','Пользов.']};
const vl=q('#vlb');
function viewLabel(){const d=new THREE.Vector3();cam.getWorldDirection(d);let k='user';
 const T=.9995;if(d.z<-T)k='front';else if(d.z>T)k='back';else if(d.x<-T)k='right';else if(d.x>T)k='left';else if(d.y<-T)k='top';else if(d.y>T)k='bottom';
 const o=q('#ortho').classList.contains('on'),n=VN[k],i={uz:0,en:1,ru:2}[lang()]??0;
 const tx=n[i]+' · '+(o?L('Ortografik','Orthographic','Ортографический'):L('Perspektiva','Perspective','Перспектива'));
 if(vl.textContent!=tx)vl.textContent=tx;
 q('#gzo').classList.toggle('on',o)}

/* ---------- outliner ---------- */
let CN={v:0,t:0,o:0};
const rf0=refresh;
refresh=function(){rf0.apply(this,arguments);try{deco()}catch(e){console.warn(e)}};
function deco(){
 const ml=meshes(),L0=q('#list');let v=0,t=0;
 ml.forEach(m=>{const p=m.geometry&&m.geometry.getAttribute('position');if(p){v+=p.count;t+=m.geometry.index?m.geometry.index.count/3:p.count/3}});
 CN={v,t:Math.round(t),o:ml.length};
 q('#ocnt').textContent=ml.length?ml.length:'';
 qa(':scope>button',L0).forEach((b,i)=>{const m=ml[i];if(!m)return;
  const txt=b.textContent;b.textContent='';
  const a=document.createElement('span');a.className='ico';a.innerHTML=ic('obj');
  const n=document.createElement('span');n.className='nm';n.textContent=txt;
  const e=document.createElement('span');e.className='ey';e.title=L('Ko’rsatish / yashirish','Show / hide','Показать / скрыть');
  const upd=()=>{e.innerHTML=ic(m.visible?'eye':'eyeoff');b.classList.toggle('hid',!m.visible)};
  e.onclick=ev=>{ev.stopPropagation();m.visible=!m.visible;upd()};upd();
  b.append(a,n,e)});
}
deco();

/* ---------- timeline ---------- */
const FPS=24,cf=q('#cf'),sf=q('#sf'),ef=q('#ef'),tpl=q('#tpl'),rl=q('#tlr'),rc=rl.getContext('2d');
const mix=()=>typeof AN!='undefined'?AN:[];
const t0=()=>{const m=mix();return m.length?m[0].time:0};
function dur(){let d=0;try{mix().forEach(m=>(m._actions||[]).forEach(a=>d=Math.max(d,a.getClip().duration)))}catch(e){}return d}
const fr=()=>Math.round(t0()*FPS)+1;
const setF=f=>{f=Math.max(+sf.value||1,Math.min(+ef.value||250,Math.round(f)));const t=(f-1)/FPS;mix().forEach(m=>m.setTime(t))};
const isPlay=()=>typeof play!='undefined'&&play;
function togglePlay(){if(!mix().length){toast(L('Animatsiya yo’q — Klip menyusidan kalit qo’shib klip yarating','No animation — add keys and build a clip from the Clip menu','Нет анимации — добавьте ключи и создайте клип в меню «Клип»'));return}play=!isPlay()}
tpl.onclick=togglePlay;
q('#tj0').onclick=()=>setF(+sf.value||1);q('#tj1').onclick=()=>setF(+ef.value||250);
q('#tp1').onclick=()=>{play=false;setF(fr()-1)};q('#tn1').onclick=()=>{play=false;setF(fr()+1)};
cf.onchange=()=>{play=false;setF(+cf.value||1)};
q('#pbs').onchange=e=>mix().forEach(m=>m.timeScale=+e.target.value);
[sf,ef].forEach(i=>i.onchange=()=>{i.dataset.u='1'});
let dragR=false;
const rx=e=>{const r=rl.getBoundingClientRect(),a=+sf.value||1,b=+ef.value||250,p=Math.max(0,Math.min(1,(e.clientX-r.left-12)/(r.width-24)));return a+p*(b-a)};
rl.addEventListener('pointerdown',e=>{dragR=true;rl.setPointerCapture(e.pointerId);play=false;setF(rx(e))});
rl.addEventListener('pointermove',e=>{if(dragR)setF(rx(e))});
rl.addEventListener('pointerup',()=>dragR=false);
function drawRuler(){
 if(!rl.offsetParent)return;
 const dpr=devicePixelRatio||1,w=rl.clientWidth,h=rl.clientHeight;
 if(rl.width!=w*dpr||rl.height!=h*dpr){rl.width=w*dpr;rl.height=h*dpr}
 rc.setTransform(dpr,0,0,dpr,0,0);rc.clearRect(0,0,w,h);
 const a=+sf.value||1,b=Math.max(a+1,+ef.value||250),X=f=>12+(f-a)/(b-a)*(w-24);
 rc.fillStyle='#262626';rc.fillRect(0,0,w,20);
 const step=[1,2,5,10,25,50,100,250,500].find(s=>(w-24)/((b-a)/s)>46)||500;
 rc.font='10px sans-serif';rc.textBaseline='middle';rc.strokeStyle='#555';rc.fillStyle='#aaa';rc.lineWidth=1;
 for(let f=Math.ceil(a/step)*step;f<=b;f+=step){const x=Math.round(X(f))+.5;rc.beginPath();rc.moveTo(x,12);rc.lineTo(x,20);rc.stroke();rc.fillText(f,x+3,8)}
 /* kalitlar (Klip menyusi) */
 try{if(typeof KF!='undefined')KF.forEach(k=>{const f=k.t*FPS+1;if(f<a||f>b)return;const x=X(f),y=h*.55;rc.save();rc.translate(x,y);rc.rotate(Math.PI/4);rc.fillStyle='#ffb43c';rc.strokeStyle='#000';rc.fillRect(-5,-5,10,10);rc.strokeRect(-5,-5,10,10);rc.restore()})}catch(e){}
 const x=X(Math.max(a,Math.min(b,fr())));
 rc.fillStyle='#4a86d8';rc.strokeStyle='#4a86d8';rc.beginPath();rc.moveTo(x-7,0);rc.lineTo(x+7,0);rc.lineTo(x+7,12);rc.lineTo(x,19);rc.lineTo(x-7,12);rc.closePath();rc.fill();
 rc.beginPath();rc.moveTo(x+.5,19);rc.lineTo(x+.5,h);rc.stroke();
 rc.fillStyle='#fff';rc.textAlign='center';rc.fillText(fr(),x,8);rc.textAlign='left';
}

/* ---------- holat paneli ---------- */
const chips=q('#chips'),CK=['o','v','t','m','tl','vw','sn','un','re','fr','pb','an','sl'];
CK.forEach(k=>{const s=document.createElement('span');s.dataset.k=k;chips.append(s)});
const setC=(k,l,v)=>{const s=chips.querySelector('[data-k='+k+']'),h=l+'<b></b>';if(s.dataset.l!=l){s.innerHTML=h;s.dataset.l=l}const b=s.firstElementChild||s.lastChild;if(b.textContent!=v)b.textContent=v};
function chipsTick(){
 const em=!!window.em,md=tc.mode,x=q('#xray').classList.contains('on'),wr=typeof wire!='undefined'&&wire,sn=q('#snap').classList.contains('on');
 const m=mix(),d=dur(),end=+ef.value||250;
 setC('o',L('Obyektlar ','Objects ','Объекты '),CN.o);
 setC('v',L('Uchlar ','Verts ','Вершины '),CN.v.toLocaleString());
 setC('t',L('Uchburchak ','Tris ','Треуг. '),CN.t.toLocaleString());
 setC('m',L('Rejim ','Mode ','Режим '),em?L('Edit','Edit','Правка'):L('Obyekt','Object','Объект'));
 setC('tl',L('Asbob ','Tool ','Инстр. '),{translate:L('Ko’chirish','Move','Перемещ.'),rotate:L('Aylantirish','Rotate','Поворот'),scale:L('O’lcham','Scale','Масштаб')}[md]||md);
 setC('vw',L('Ko’rinish ','View ','Вид '),wr?L('Karkas','Wire','Каркас'):x?'X-ray':L('Qattiq','Solid','Тело'));
 setC('sn',L('Magnit ','Snap ','Привязка '),sn?L('Yoqiq','On','Вкл'):L('O’chiq','Off','Выкл'));
 setC('un',L('Bekor ','Undo ','Отмена '),H.length||L('Bo’sh','Empty','Пусто'));
 setC('re',L('Qaytarish ','Redo ','Повтор '),Y.length||L('Bo’sh','Empty','Пусто'));
 setC('fr',L('Kadr ','Frame ','Кадр '),fr()+' / '+end);
 setC('pb',L('Ijro ','Playback ','Воспр. '),isPlay()?L('Ketmoqda','Playing','Идёт'):L('To’xtagan','Stopped','Стоп'));
 setC('an',L('Anim ','Anim ','Аним. '),m.length?m.length+L(' klip',' clips',' клипов'):L('Yo’q','None','Нет'));
 setC('sl',L('Tanlangan ','Selection ','Выбрано '),(typeof sel!='undefined'&&sel)?(sel.name||'—'):'—');
 /* timeline holati */
 const on=isPlay();tpl.classList.toggle('on',on);if(tpl.dataset.s!=(on?1:0)){tpl.dataset.s=on?1:0;put(tpl,on?'pause':'play')}
 if(document.activeElement!==cf)cf.value=fr();
 if(d>0&&!ef.dataset.u){const e=Math.round(d*FPS)+1;if(+ef.value!=e)ef.value=e}
 if(on&&fr()>end+1)setF(+sf.value||1);
 ms.value=em?'edit':'obj';
}
put(tpl,'play');

/* ---------- klaviatura ---------- */
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.code=='Space'){e.preventDefault();togglePlay()}
 else if(e.key=='ArrowRight'&&e.shiftKey)q('#tj1').click();else if(e.key=='ArrowLeft'&&e.shiftKey)q('#tj0').click();
 else if(e.key=='ArrowRight')q('#tn1').click();else if(e.key=='ArrowLeft')q('#tp1').click()});

/* ---------- asosiy sikl ---------- */
let last=0;
(function loop(t){requestAnimationFrame(loop);drawGz();if(t-last>200){last=t;viewLabel();chipsTick();drawRuler()}else if(app.classList.contains('ws-animation'))drawRuler()})(0);
chipsTick();viewLabel();
})();
