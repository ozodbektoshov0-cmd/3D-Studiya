/* ---- v57 · 5-bosqich: Blender sozlamalari, statistika va yorliqlar xaritasi ----
   Sozlamalar oynasidagi “Blender” bo‘limi (js/settings.js) shu fayl bilan bog‘lanadi: window.BL_CFG.on(kalit, qiymat). */
(function(){
'use strict';
const T=window.THREE;if(!T||typeof $!=='function')return;
const C=window.BL_CFG=window.BL_CFG||{},vp=$('#vp'),n=x=>Number(x).toLocaleString('en-US');

/* ---------- Statistika (Blender “Statistics” overlay) ---------- */
const weld=new WeakMap();
function uniqV(g){const P=g.getAttribute&&g.getAttribute('position');if(!P)return 0;if(P.count>3e5)return P.count;   /* juda katta meshda payvandlash o‘tkazib yuboriladi */
 const w=weld.get(g);if(w&&w.c===P.count&&w.v===P.version)return w.n;
 const s=new Set();for(let i=0;i<P.count;i++)s.add(Math.round(P.getX(i)*1e4)+','+Math.round(P.getY(i)*1e4)+','+Math.round(P.getZ(i)*1e4));
 weld.set(g,{c:P.count,v:P.version,n:s.size});return s.size}
const triOf=g=>{const P=g.getAttribute&&g.getAttribute('position');return !P?0:(g.index?g.index.count:P.count)/3|0};
function count(list){let v=0,t=0;const seen=new Set();list.forEach(m=>{if(!m.geometry||seen.has(m.geometry))return;seen.add(m.geometry);v+=uniqV(m.geometry);t+=triOf(m.geometry)});
 /* bir xil geometriyani bir necha obyekt ishlatsa (instans), har obyekt alohida sanaladi */
 let v2=0,t2=0;list.forEach(m=>{if(m.geometry){v2+=uniqV(m.geometry);t2+=triOf(m.geometry)}});return {v:v2,t:t2}}
function statsText(all,chosen,emState){
 const A=count(all),S=count(chosen);
 if(emState)return ['Objects  1 / '+all.length,'Vertices '+n(emState.sel)+' / '+n(emState.total),'Triangles '+n(triOf(chosen[0].geometry))].join('\n');
 const sl=chosen.length?'':'';return ['Objects  '+chosen.length+' / '+all.length,'Vertices '+(chosen.length?n(S.v)+' / ':'')+n(A.v),'Triangles '+(chosen.length?n(S.t)+' / ':'')+n(A.t)].join('\n')+sl}
window.BL_STATS={count,statsText,uniqV};
let box=null,tm=0;
function tick(){if(!box)return;const all=meshes().filter(m=>!m.userData.dummy),chosen=pick().filter(m=>!m.userData.dummy);
 const e=window.em&&sel&&sel.geometry?{sel:em.s.size,total:em.G.length}:null;
 box.textContent=statsText(all,chosen,e&&chosen.length?e:null)}
function stats(on){if(on&&!box&&vp){box=document.createElement('div');box.id='bl-stats';
  const st=document.createElement('style');st.textContent='#bl-stats{position:absolute;left:8px;bottom:8px;z-index:2;white-space:pre;font:11px/1.45 ui-monospace,Consolas,monospace;color:#fff;text-shadow:0 1px 2px #000,0 0 3px #000;pointer-events:none;opacity:.9}#bl-stats[hidden]{display:none}';
  document.head.append(st);vp.append(box)}
 if(box)box.hidden=!on;clearInterval(tm);if(on){tick();tm=setInterval(tick,400)}}

/* ---------- Klaviatura xaritasi (F1) ---------- */
const MAP=[
 ['Ko‘rinish',[['Chap tugma sudrash','Aylantirish'],['O‘ng tugma sudrash','Surish'],['G‘ildirak','Yaqinlashtirish'],['O‘rta tugma (Blender boshqaruvi yoqilsa)','Aylantirish · Shift bilan surish'],['Numpad 1 / 3 / 7','Old / o‘ng / yuqori ko‘rinish'],['F','Kamerani obyektga moslash']]],
 ['Obyekt',[['G / R / S','Ko‘chirish / aylantirish / o‘lcham'],['Shift+D','Nusxa'],['X','O‘chirish'],['Ctrl+A','Hammasini tanlash'],['Ctrl+Z / Ctrl+Y','Bekor qilish / qaytarish'],['Tab','Edit rejimi'],['Shift+A','Qo‘shish menyusi']]],
 ['Edit rejimi',[['E','Extrude (tanlangan yuzlar)'],['I','Inset'],['X / Delete','Tanlangan nuqtalarni o‘chirish'],['M','Markazda birlashtirish'],['A / Alt+A','Hammasini / hech birini tanlash'],['Ctrl+I','Tanlovni teskari qilish'],['L','Bog‘langan qismni tanlash'],['Ctrl+Z','Edit amallarini bekor qilish']]],
 ['Boshqa',[['F1','Shu ro‘yxat']]]];
let dk=null;
function keys(){if(!dk){dk=document.createElement('dialog');dk.id='bl-keys';
  const st=document.createElement('style');st.textContent='#bl-keys{max-width:min(92vw,560px);max-height:86vh;overflow:auto;background:var(--pn,#303030);color:var(--tx,#e6e6e6);border:1px solid var(--bd,#161616);border-radius:6px;padding:14px 16px}#bl-keys::backdrop{background:#0008}#bl-keys h3{margin:12px 0 6px;font-size:13px;color:var(--ac,#ffa028)}#bl-keys h3:first-child{margin-top:0}#bl-keys table{width:100%;border-collapse:collapse;font-size:12.5px}#bl-keys td{padding:3px 6px;border-bottom:1px solid #ffffff14;vertical-align:top}#bl-keys td:first-child{white-space:nowrap;font-family:ui-monospace,Consolas,monospace;color:var(--mt,#9a9a9a)}#bl-keys button{margin-top:12px;padding:4px 14px}';
  document.head.append(st);
  MAP.forEach(([h,rows])=>{const t=document.createElement('h3');t.textContent=h;const tb=document.createElement('table');
   rows.forEach(([k,d])=>{const r=tb.insertRow();r.insertCell().textContent=k;r.insertCell().textContent=d});dk.append(t,tb)});
  const b=document.createElement('button');b.textContent='Yopish';b.onclick=()=>dk.close();dk.append(b);
  dk.addEventListener('click',e=>{if(e.target===dk)dk.close()});dk.addEventListener('keydown',e=>e.stopPropagation());document.body.append(dk)}
 dk.open?dk.close():dk.showModal()}
addEventListener('keydown',e=>{if(e.key!=='F1'||e.ctrlKey||e.altKey||e.metaKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;e.preventDefault();keys()});

/* ---------- sozlamalar bilan bog‘lanish ---------- */
const nav=v=>{if(typeof ctl!=='undefined'&&ctl.mouseButtons)ctl.mouseButtons.MIDDLE=v?T.MOUSE.ROTATE:T.MOUSE.DOLLY};
C.on=(k,v)=>{
 if(k=='blNav')nav(v);else if(k=='blStats')stats(v);else if(k=='keys')keys();
 else if(k=='blSm'&&C.saInput)C.saInput.value=v;
 if(k=='blEm')document.dispatchEvent(new Event('bl-cfg'));};
/* settings.js bu faylgacha yuklangan: saqlangan qiymatlarni hozir qo‘llaymiz */
if(C.blNav)nav(true);if(C.blStats)stats(true);
})();
