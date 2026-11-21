/* ---- Zamonaviy, moslashuvchan interfeys qatlami (barcha qurilmalar uchun) ---- */
(function(){
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const L=(u,e,r)=>{const g=document.documentElement.lang||'uz';if(g=='uz')return u;if(g=='en')return e;if(g=='ru')return r;return (window.I18N&&I18N.l(u))||e};
if(window.I18N&&I18N.add)I18N.add(`Boshqa|More|Ещё
Obyektlar|Objects|Объекты
Panel|Panel|Панель
Ko’proq asboblar|More tools|Ещё инструменты
Telefonni yoting|Rotate your phone|Поверните телефон
3D Studiya gorizontal holatda qulayroq ishlaydi: ko’rish oynasi katta bo’ladi.|3D Studiya works best in landscape: the viewport gets much bigger.|3D Studiya удобнее в горизонтальном режиме: окно просмотра становится больше.
Baribir davom etish|Continue anyway|Всё равно продолжить
Gorizontal qilish|Go landscape|Горизонтально`);
const svg=(p,vb)=>'<svg class="ic" viewBox="'+(vb||'0 0 24 24')+'" aria-hidden="true">'+p+'</svg>';

/* ---------- 1) yuqori panel: 4 ta asosiy menyu + “Boshqa” ---------- */
const hd=q('header'),menus=qa(':scope>details.mn',hd);
if(menus.length>4){
 const more=document.createElement('details');more.className='mn';more.id='mmore';
 more.innerHTML='<summary>Boshqa</summary><div class="mm"></div>';
 hd.insertBefore(more,menus[4]);
 menus.slice(4).forEach(m=>q('.mm',more).append(m));
}
const vl=q('.logo');if(vl){const t=[...vl.childNodes].find(n=>n.nodeType==3&&/STUDIYA/i.test(n.textContent));if(t){const s=document.createElement('span');s.textContent='3D Studiya ';t.replaceWith(s)}}

/* Yuqori menyular: ekrandan chiqib ketmasligi uchun fixed joylashuv va tashqariga bosganda yopilish */
const topMenus=qa(':scope>details.mn',hd);
function positionMenu(det){
 const box=det.querySelector(':scope>div'),sum=det.querySelector(':scope>summary');
 if(!box||!sum)return;
 const sr=sum.getBoundingClientRect();
 const vw=window.innerWidth||document.documentElement.clientWidth;
 const vh=window.innerHeight||document.documentElement.clientHeight;
 const mw=Math.min(Math.max(box.offsetWidth||252,236),vw-16);
 const rtl=document.documentElement.dir==='rtl';
 let left=rtl?(sr.right-mw):sr.left;
 left=Math.max(8,Math.min(left,vw-mw-8));
 const top=Math.min(sr.bottom+4,vh-120);
 box.style.position='fixed';
 box.style.left=left+'px';
 box.style.top=top+'px';
 box.style.right='auto';
 box.style.maxHeight=Math.max(160,vh-top-12)+'px';
 box.style.width=mw+'px';
}
topMenus.forEach(det=>{
 det.addEventListener('toggle',()=>{
  if(!det.open)return;
  topMenus.forEach(other=>{if(other!==det&&other.open)other.open=false});
  requestAnimationFrame(()=>positionMenu(det));
 });
});
document.addEventListener('pointerdown',e=>{
 if(e.target&&e.target.closest&&e.target.closest('header details.mn'))return;
 topMenus.forEach(d=>{if(d.open)d.open=false});
},true);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape')topMenus.forEach(d=>{if(d.open)d.open=false});
});
window.addEventListener('resize',()=>topMenus.forEach(d=>{if(d.open)positionMenu(d)}));

/* ---------- 2) ko’rinish oynasi: kerakli tugmalar ochiq, qolgani “⋯” ortida ---------- */
const vh=q('#vh');
if(vh){
 const b=document.createElement('button');b.id='vmore';b.type='button';
 b.innerHTML='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
 b.title=L('Ko’proq asboblar','More tools','Ещё инструменты');
 b.setAttribute('aria-label',b.title);
 b.onclick=()=>{vh.classList.toggle('adv');b.classList.toggle('on',vh.classList.contains('adv'))};
 vh.append(b);
 setInterval(()=>vh.classList.toggle('em',!!window.em),400);
}

/* aksent rang almashganda (Sozlamalar) tugma ustidagi matn rangi o’qiladigan bo’lib qoladi */
(function(){let last='';const de=document.documentElement;
 function sync(){const v=de.style.getPropertyValue('--ac').trim();if(v==last)return;last=v;const m=/^#([0-9a-f]{6})$/i.exec(v);if(!m)return;
  const n=parseInt(m[1],16),c=[n>>16&255,n>>8&255,n&255].map(x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)}),
  Y=.2126*c[0]+.7152*c[1]+.0722*c[2];de.style.setProperty('--on',Y>.35?'#1b1100':'#ffffff')}
 sync();setInterval(sync,500)})();

/* ---------- 3) barcha qurilmalarga moslashuvchan panel va til ---------- */
const app=q('#app'),aside=q('aside'),ws=q('#ws'),main=q('main');
const bp=document.createElement('button');bp.className='hb';bp.id='bpnl';bp.type='button';
bp.title=L('Panel','Panel','Панель');bp.setAttribute('aria-label',bp.title);
bp.innerHTML=svg('<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M15 4v16"/>');
hd.append(bp);

const pback=document.createElement('div');pback.id='pback';pback.setAttribute('aria-hidden','true');
main.append(pback);

const LANGS=[['uz','UZ · O’zbekcha'],['az','AZ · Azərbaycanca'],['tr','TR · Türkçe'],['kk','KK · Қазақша'],['ky','KY · Кыргызча'],['tg','TG · Тоҷикӣ'],['tk','TK · Türkmençe'],['en','EN · English'],['ru','RU · Русский'],['ar','AR · العربية']];
const ls=document.createElement('select');ls.id='langsel';ls.className='hb';ls.setAttribute('aria-label','Dastur tili');ls.title='Dastur tili';
LANGS.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;ls.append(o)});
ls.value=document.documentElement.lang||'uz';
ls.onchange=()=>{if(window.I18N&&I18N.set)I18N.set(ls.value)};
const bset=q('#bset');bset?hd.insertBefore(ls,bset):hd.append(ls);
window.addEventListener('i18n-change',e=>{const l=e&&e.detail&&e.detail.lang;if(l&&ls.value!==l)ls.value=l});

function drawer(o){
 const on=!!o;
 document.body.classList.toggle('pnl',on);
 bp.classList.toggle('on',on);
}
bp.onclick=()=>drawer(!document.body.classList.contains('pnl'));
pback.addEventListener('pointerdown',()=>drawer(false));
q('#vp').addEventListener('pointerdown',()=>{if(document.body.classList.contains('pnl'))drawer(false)},true);

const mqDrawer=matchMedia('(max-width:960px), ((pointer:coarse) and (max-height:600px) and (orientation:landscape))');
const mqCompact=matchMedia('(pointer:coarse) and (max-height:600px) and (orientation:landscape)');
const mqWsInAside=matchMedia('(max-width:760px), ((pointer:coarse) and (max-height:600px) and (orientation:landscape))');

function layout(){
 const isDrawer=mqDrawer.matches;
 const isCompact=mqCompact.matches;
 const wsInSide=mqWsInAside.matches;
 document.body.classList.toggle('drawer',isDrawer);
 document.body.classList.toggle('compact',isCompact);
 if(wsInSide){if(ws.parentNode!==aside)aside.prepend(ws)}
 else{if(ws.parentNode!==app)app.insertBefore(ws,main)}
 if(!isDrawer)drawer(false);
}
[mqDrawer,mqCompact,mqWsInAside].forEach(m=>{
 m.addEventListener?m.addEventListener('change',layout):m.addListener(layout);
});
window.addEventListener('resize',layout);
layout();

if(window.I18N&&I18N.set)I18N.set(document.documentElement.lang||'uz');
})();
