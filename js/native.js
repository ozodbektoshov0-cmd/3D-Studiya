/* ---- Ilova qobig'i (Android APK / Windows) bilan aloqa: faylni saqlash ---- */
(function(){
 const A=window.AndroidStudio,D=window.desktopStudio;
 /* Ilova ichida ishlayaptimi? (service worker va tashqi havolalar kerak emas) */
 window.APP_SHELL=!!(A&&A.saveBegin)||!!(D&&D.saveFile);
 const say=m=>{if(typeof toast=='function'){try{toast(m)}catch(e){}}};
 const b64=u8=>{let s='',C=0x8000;for(let i=0;i<u8.length;i+=C)s+=String.fromCharCode.apply(null,u8.subarray(i,i+C));return btoa(s)};
 /* saveBlob(blob, 'nom.glb') — brauzerda yuklab oladi, ilovada Downloads'ga yozadi */
 window.saveBlob=async function(blob,name){
  if(A&&A.saveBegin){
   try{
    const u8=new Uint8Array(await blob.arrayBuffer()),SZ=1<<20;
    if(!A.saveBegin(name))throw Error('fayl ochilmadi');
    for(let i=0;i<u8.length;i+=SZ){if(!A.saveChunk(b64(u8.subarray(i,i+SZ))))throw Error('yozish to’xtadi')}
    const p=A.saveEnd();
    if(!p)throw Error('yozish tugamadi');
    say('Saqlandi: '+p);
   }catch(e){if(A.saveAbort)try{A.saveAbort()}catch(_){};say('Saqlash xatosi: '+(e.message||e))}
   return;
  }
  if(D&&D.saveFile){
   try{
    const p=await D.saveFile(name,new Uint8Array(await blob.arrayBuffer()));
    if(p)say('Saqlandi: '+p);
   }catch(e){say('Saqlash xatosi: '+(e.message||e))}
   return;
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5e3);
 };
})();
