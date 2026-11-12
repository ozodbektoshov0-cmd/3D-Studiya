/* ---- GTA eksport paketlari (v0.0.59) ----
   Mashina:  DFF + TXD                        (zip)
   Obyekt:   DFF + TXD + COL + IDE + IPL      (zip)
   Alohida:  COL, IDE, IPL; shuningdek 3DS, COL (format dvigateli orqali, js/engine.js)
   DFF/TXD studiyaning o’z yozuvchilari bilan (dffOut / txdOut), COL esa format dvigateli bilan yaratiladi. */
(function(){
'use strict';
const KEY='gtapk1',F=[['name','Model nomi',0],['txd','TXD nomi',0],['id','ID',1],['draw','Ko’rinish masofasi',1],['flags','Flags',1],['x','IPL X',1],['y','IPL Y',1],['z','IPL Z',1],['interior','Interior',1]];
const gtaName=s=>(String(s||'model').toLowerCase().replace(/[^a-z0-9_]/g,'_').replace(/^_+|_+$/g,'')||'model').slice(0,20);
const SHOW={'gta-car':['name','txd'],'gta-obj':F.map(f=>f[0]),'col':['name'],'ide':['name','txd','id','draw','flags'],'ipl':['name','id','x','y','z','interior']};
const OPT=[['3ds','3DS'],['col','COL (to’qnashuv)'],['ide','IDE (obyekt ta’rifi)'],['ipl','IPL (joylashuv)'],['gta-car','GTA mashina: DFF + TXD (zip)'],['gta-obj','GTA obyekt: DFF + TXD + COL + IDE + IPL (zip)']];
const sel=document.querySelector('#fmt');
if(sel)OPT.forEach(([v,t])=>{if(![...sel.options].some(o=>o.value==v)){const o=document.createElement('option');o.value=v;o.textContent=t;sel.append(o)}});
const load0=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}};
/* parametrlarni so’rash (dialog); Promise<{...}|null> */
window.gtaAsk=function(fmt){
 return new Promise(res=>{
  const sv=load0(),nm=gtaName(typeof name!='undefined'?name:'model');
  const d={name:nm,txd:nm,id:16000,draw:299,flags:0,x:0,y:0,z:0,interior:0};Object.assign(d,sv,{name:nm});
  if(sv.txd&&sv.txdFor==nm)d.txd=sv.txd;
  const dlg=document.createElement('dialog');dlg.id='gpk';
  const h=document.createElement('div');h.className='ph';h.innerHTML='<b></b>';h.firstChild.textContent=OPT.find(o=>o[0]==fmt)[1];
  const body=document.createElement('div');body.className='db';const grid=document.createElement('div');grid.className='gpg';
  const inp={};
  SHOW[fmt].forEach(k=>{const f=F.find(x=>x[0]==k),l=document.createElement('label'),s=document.createElement('span');s.textContent=f[1];
   const i=document.createElement('input');i.type=f[2]?'number':'text';if(f[2])i.step='any';i.value=d[k];inp[k]=i;l.append(s,i);grid.append(l)});
  const note=document.createElement('p');note.className='gnote';
  note.textContent={'gta-car':'Mashina uchun DFF va TXD bitta zip’da.','gta-obj':'IDE: ID, model, TXD, masofa, flags · IPL: joylashuv va interior · COL: avtomatik to’qnashuv.','col':'Model uchun COL (to’qnashuv) fayli.','ide':'IDE faylida bitta obyekt ta’rifi yoziladi.','ipl':'IPL faylida obyektning xaritadagi joyi yoziladi.'}[fmt];
  const row=document.createElement('div');row.className='row';
  const ok=document.createElement('button');ok.className='pri';ok.textContent='Eksport';const no=document.createElement('button');no.textContent='Bekor';
  row.append(ok,no);body.append(grid,note,row);dlg.append(h,body);document.body.append(dlg);
  const done=v=>{if(dlg.open)dlg.close();dlg.remove();res(v)};
  ok.onclick=()=>{const v={};for(const k in inp)v[k]=F.find(x=>x[0]==k)[2]?(+inp[k].value||0):gtaName(inp[k].value);
   v.name=v.name||nm;v.txd=v.txd||v.name;
   try{localStorage.setItem(KEY,JSON.stringify(Object.assign({},v,{txdFor:v.name})))}catch(e){}
   const full=Object.assign({},d,v);done(full)};
  no.onclick=()=>done(null);dlg.addEventListener('cancel',e=>{e.preventDefault();done(null)});dlg.addEventListener('keydown',e=>e.stopPropagation());
  dlg.showModal();
 });
};
const crlf=a=>a.join('\r\n');
window.gtaIde=P=>crlf(['objs',[P.id,P.name,P.txd,P.draw,P.flags].join(', '),'end','']);
window.gtaIpl=P=>crlf(['inst',[P.id,P.name,P.interior||0,P.x,P.y,P.z,0,0,0,1,-1].join(', '),'end','']);
const u8=async d=>d instanceof Uint8Array?d:new Uint8Array(await new Blob([d]).arrayBuffer());
const T=s=>new TextEncoder().encode(s);
/* tayyor Blob yaratish; dm — ko’rinmas qilinadigan dummy meshlar */
window.gtaBuild=async function(fmt,P,dm){
 const notes=[];
 if(fmt=='ide')return{blob:new Blob([gtaIde(P)],{type:'text/plain'}),ext:'ide',name:P.name,notes};
 if(fmt=='ipl')return{blob:new Blob([gtaIpl(P)],{type:'text/plain'}),ext:'ipl',name:P.name,notes};
 const colBytes=async()=>{const v=dm.map(m=>m.visible);dm.forEach(m=>m.visible=false);
  try{return await engineOut('col',root,P.name)}finally{dm.forEach((m,i)=>m.visible=v[i])}};
 if(fmt=='col'){const b=await colBytes();return{blob:b,ext:'col',name:P.name,notes}}
 const files={};
 files[P.name+'.dff']=await u8(dffOut());
 try{const t=await txdOut();if(t&&(t.byteLength||t.length))files[P.txd+'.txd']=await u8(t);else notes.push('TXD: tekstura yo’q')}catch(e){notes.push('TXD yaratilmadi: '+(e.message||e))}
 if(fmt=='gta-obj'){
  try{files[P.name+'.col']=await u8(await colBytes())}catch(e){notes.push('COL yaratilmadi: '+(e.message||e))}
  files[P.name+'.ide']=T(gtaIde(P));files[P.name+'.ipl']=T(gtaIpl(P));
 }
 return{blob:new Blob([fflate.zipSync(files,{level:6})],{type:'application/zip'}),ext:'zip',name:P.name+(fmt=='gta-car'?'_mashina':'_obyekt'),notes,files:Object.keys(files)};
};
})();
