/* ---- v52: soddalashtirilgan interfeys + telefonda avtomatik gorizontal rejim ----
   Mavjud tugma va id’larga tegmaydi: menyularni “Boshqa”ga ko’chiradi (obyekt tugunlari o’zi ko’chadi, hodisalari saqlanadi),
   ilg’or ko’rinish tugmalarini “⋯” ortiga yashiradi, telefon gorizontal holatida o’ng panelni yon oynaga aylantiradi. */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const L=(u,e,r)=>{const g=document.documentElement.lang||'uz';return {uz:u,en:e,ru:r}[g]||u};
if(window.I18N&&I18N.add)I18N.add(`Boshqa|More|Ещё
Obyektlar|Objects|Объекты
Panel|Panel|Панель
Ko’proq asboblar|More tools|Ещё инструменты
Telefonni yoting|Rotate your phone|Поверните телефон
3D Studiya gorizontal holatda qulayroq ishlaydi: ko’rish oynasi katta bo’ladi.|3D Studiya works best in landscape: the viewport gets much bigger.|3D Studiya удобнее в горизонтальном режиме: окно просмотра становится больше.
Baribir davom etish|Continue anyway|Всё равно продолжить
Gorizontal qilish|Go landscape|Горизонтально`);
const svg=(p,vb)=>'<svg viewBox="'+(vb||'0 0 24 24')+'" aria-hidden="true">'+p+'</svg>';

/* ---------- 1) yuqori panel: 4 ta asosiy menyu + “Boshqa” ---------- */
const hd=q('header'),menus=qa(':scope>details.mn',hd);
if(menus.length>4){
 const more=document.createElement('details');more.className='mn';more.id='mmore';
 more.innerHTML='<summary>Boshqa</summary><div class="mm"></div>';
 hd.insertBefore(more,menus[4]);
 menus.slice(4).forEach(m=>q('.mm',more).append(m));
}
const vl=q('.logo');if(vl){const t=[...vl.childNodes].find(n=>n.nodeType==3&&/STUDIYA/i.test(n.textContent));if(t){const s=document.createElement('span');s.textContent='3D Studiya ';t.replaceWith(s)}}

/* ---------- 2) ko’rinish oynasi: kerakli tugmalar ochiq, qolgani “⋯” ortida ---------- */
const vh=q('#vh');
if(vh){
 const b=document.createElement('button');b.id='vmore';b.textContent='⋯';b.title=L('Ko’proq asboblar','More tools','Ещё инструменты');
 b.onclick=()=>{vh.classList.toggle('adv');b.classList.toggle('on',vh.classList.contains('adv'))};
 vh.append(b);
 /* Edit rejimida tanlash asboblari kerak — o’zi ochiladi */
 setInterval(()=>vh.classList.toggle('em',!!window.em),400);
}
/* aksent rang almashganda (Sozlamalar) tugma ustidagi matn rangi o’qiladigan bo’lib qoladi */
(function(){let last='';const de=document.documentElement;
 function sync(){const v=de.style.getPropertyValue('--ac').trim();if(v==last)return;last=v;const m=/^#([0-9a-f]{6})$/i.exec(v);if(!m)return;
  const n=parseInt(m[1],16),c=[n>>16&255,n>>8&255,n&255].map(x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)}),
  Y=.2126*c[0]+.7152*c[1]+.0722*c[2];de.style.setProperty('--on',Y>.35?'#1b1100':'#ffffff')}
 sync();setInterval(sync,500)})();

/* ---------- 3) telefon, gorizontal: yon panel ---------- */
const app=q('#app'),aside=q('aside'),ws=q('#ws'),main=q('main');
const bp=document.createElement('button');bp.className='hb';bp.id='bpnl';bp.title=L('Panel','Panel','Панель');
bp.innerHTML=svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>');
const sp=q('header .sp');hd.append(bp);
function drawer(o){document.body.classList.toggle('pnl',o);bp.classList.toggle('on',o)}
bp.onclick=()=>drawer(!document.body.classList.contains('pnl'));
q('#vp').addEventListener('pointerdown',()=>{if(document.body.classList.contains('pnl'))drawer(false)},true);
const mq=matchMedia('(pointer:coarse) and (max-height:600px) and (orientation:landscape)');
function layout(){
 const c=mq.matches;document.body.classList.toggle('compact',c);
 if(c){if(ws.parentNode!==aside)aside.prepend(ws)}
 else{if(ws.parentNode!==app)app.insertBefore(ws,main);drawer(false)}
}
mq.addEventListener?mq.addEventListener('change',layout):mq.addListener(layout);layout();

/* ---------- 4) telefonda avtomatik gorizontal ---------- */
const phone=()=>matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<700;
const so=screen.orientation;
const lock=()=>phone()&&so&&so.lock?so.lock('landscape').then(()=>true,()=>false):Promise.resolve(false);
const portrait=()=>matchMedia('(orientation:portrait)').matches;
let locked=false;
const tryLock=()=>lock().then(ok=>{if(ok)locked=true;return ok});
tryLock();   /* o’rnatilgan ilova (manifest) va ba’zi brauzerlarda to’g’ridan-to’g’ri ishlaydi */
function fsLock(){
 if(!phone()||locked)return Promise.resolve();
 const d=document.documentElement,rq=d.requestFullscreen||d.webkitRequestFullscreen;
 if(!rq)return Promise.resolve();
 const go=()=>tryLock();
 if(document.fullscreenElement||document.webkitFullscreenElement)return go();
 try{const p=rq.call(d,{navigationUI:'hide'});return (p&&p.then?p:Promise.resolve()).then(go).catch(()=>{})}catch(e){return Promise.resolve()}
}
/* oddiy brauzer varag’ida qulf faqat to’liq ekranda ishlaydi: har bir bosishda (muvaffaqiyatli bo’lguncha) to’liq ekran + gorizontal */
['touchend','pointerup','click'].forEach(t=>addEventListener(t,()=>{if(phone()&&!locked)fsLock()},true));
['fullscreenchange','webkitfullscreenchange','orientationchange'].forEach(t=>addEventListener(t,()=>{locked=false;if(phone()&&(document.fullscreenElement||document.webkitFullscreenElement))tryLock()}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){locked=false;tryLock()}});

/* iPhone Safari to’liq ekran/qulfni bermaydi — yoting oynasi ko’rsatiladi */
const rot=document.createElement('div');rot.id='rot';rot.setAttribute('role','dialog');rot.setAttribute('aria-modal','true');
rot.innerHTML='<div>'+svg('<rect class="phn" x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>')+
 '<b>Telefonni yoting</b><p>3D Studiya gorizontal holatda qulayroq ishlaydi: ko’rish oynasi katta bo’ladi.</p>'+
 '<button class="go" type="button">Gorizontal qilish</button><button class="skip" type="button">Baribir davom etish</button></div>';
document.body.append(rot);
q('.skip',rot).onclick=()=>document.body.classList.add('norot');
q('.go',rot).onclick=()=>{fsLock();lock()};
if(window.I18N&&I18N.set)I18N.set(document.documentElement.lang||'uz');
})();
