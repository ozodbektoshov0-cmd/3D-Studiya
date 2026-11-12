/* Studiya ichidagi ilova ko’prigi.
   1) “orqaga” tugmasi studiyaga qaytaradi (iframe ichida), alohida ochilganda esa studiya sahifasiga o’tadi.
   2) Pauza: ilova yashirin paytda uning animatsiya tsikli (requestAnimationFrame) to’xtatiladi — studiya sekinlashmaydi, batareya sarflanmaydi.
      Qaytganda tsikl qolgan joyidan davom etadi. Avto-saqlash taymerlariga tegmaydi. */
(function(){
 if(window.parent&&window.parent!==window)document.documentElement.classList.add('in-studio');
 window.__studioBack=function(fallback){
  if(window.parent&&window.parent!==window){try{window.parent.postMessage({studioApp:'close'},'*');return}catch(e){}}
  location.href=fallback||'../../index.html';
 };
 document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest&&e.target.closest('a[data-studio-back]');
  if(!a)return;e.preventDefault();window.__studioBack(a.getAttribute('href'));
 },true);
 var raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window),
     seq=0,live={},held=[],paused=false;
 function sched(id,cb){var o={cb:cb,h:0};live[id]=o;o.h=raf(function(t){delete live[id];cb(t)})}
 window.requestAnimationFrame=function(cb){var id=++seq;if(paused)held.push([id,cb]);else sched(id,cb);return id};
 window.cancelAnimationFrame=function(id){var o=live[id];if(o){caf(o.h);delete live[id]}held=held.filter(function(x){return x[0]!==id})};
 window.__studioPause=function(p){
  p=!!p;if(p===paused)return;paused=p;
  if(p){Object.keys(live).forEach(function(id){var o=live[id];caf(o.h);delete live[id];held.push([+id,o.cb])});return}
  var h=held;held=[];h.forEach(function(x){sched(x[0],x[1])});
 };
 /* 3) studiya fayl oynasidan kelgan fayllarni ilovaning o’z ochuvchisiga uzatish */
 window.addEventListener('message',function(e){
  var d=e.data;if(!d||d.studioApp!=='openFiles')return;
  var fl=Array.prototype.slice.call(d.files||[]);if(!fl.length)return;
  if(typeof window.openImg==='function'){window.openImg(fl);var s=document.getElementById('imgtool');if(s&&s.scrollIntoView)s.scrollIntoView();return}
  var inp=document.getElementById('fileIn');
  if(inp){try{var dt=new DataTransfer();fl.forEach(function(f){dt.items.add(f)});inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}))}catch(x){}}
 });
 /* 4) ilova 3D fayl saqlasa (DFF, OBJ, GLB, STL, 3DS, TXD…), studiya “Studiyaga qo’shish” tugmasini ko’rsatadi (yuklab olish ham davom etadi) */
 if(window.parent&&window.parent!==window){
  var EXT=/\.(dff|obj|glb|gltf|stl|ply|3ds|fbx|dae|txd)$/i,oc=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
   try{var a=this,n=a.download,h=a.href;
    if(n&&EXT.test(n)&&/^blob:/.test(h)){fetch(h).then(function(r){return r.arrayBuffer()}).then(function(b){window.parent.postMessage({studioApp:'file',name:n,buf:b},'*',[b])})['catch'](function(){})}
   }catch(x){}
   return oc.apply(this,arguments);
  };
 }
})();
