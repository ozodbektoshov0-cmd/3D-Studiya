/* Oflayn kesh — barcha fayllar ilova bilan birga keladi, internet kerak emas.
   Yangilash: V ni oshiring (v25 → v26) va barcha fayllarni bu ro'yxatga qo'shing. */
const V='3d-studiya-v37';
const ASSETS=[
 ".","index.html","manifest.webmanifest","css/style.css","css/blender.css","icon-192.png","icon-512.png","og.png",
 "js/native.js","js/core.js","js/dff-read.js","js/txd.js","js/dff-write.js","js/yft.js","js/ytd.js",
 "js/loader.js","js/rpf.js","js/editor.js","js/export.js","js/features.js","js/edit.js","js/formats.js",
 "js/formats2.js","js/tools.js","js/txd-write.js","js/skp.js","js/maxread.js","js/z3d.js","js/group.js","js/gta.js",
 "js/extra.js","js/img3d.js","js/fitpart.js","js/more.js","js/mesh.js","js/settings.js","js/blender-ui.js","js/i18n.js",
 "vendor/three.min.js","vendor/OrbitControls.js","vendor/TransformControls.js","vendor/GLTFLoader.js",
 "vendor/OBJLoader.js","vendor/STLLoader.js","vendor/PLYLoader.js","vendor/GLTFExporter.js",
 "vendor/OBJExporter.js","vendor/STLExporter.js","vendor/PLYExporter.js","vendor/fflate.min.js",
 "vendor/chevrotain.min.js","vendor/FBXLoader.js","vendor/ColladaLoader.js","vendor/VRMLLoader.js",
 "vendor/VTKLoader.js","vendor/3MFLoader.js","vendor/ColladaExporter.js","vendor/USDZExporter.js",
 "vendor/TDSLoader.js","vendor/AMFLoader.js","vendor/IFFParser.js","vendor/LWO2Parser.js",
 "vendor/LWO3Parser.js","vendor/LWOLoader.js","vendor/PCDLoader.js","vendor/VOXLoader.js",
 "vendor/XYZLoader.js","vendor/mmdparser.min.js","vendor/MMDLoader.js",
 "vendor/occt-import-js.js","vendor/occt-import-js.wasm","vendor/rhino3dm.min.js","vendor/rhino3dm.wasm",
 "vendor/openskp.min.js","vendor/t2d/index.mjs","vendor/t2d/wasm/texture2ddecoder.js",
 "vendor/t2d/wasm/texture2ddecoder.wasm"
];
self.addEventListener('install',e=>e.waitUntil(
 caches.open(V).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(
 caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!='GET')return;
 const u=new URL(r.url);
 if(u.origin!=location.origin)return;              // tashqi so'rovlar keshlanmaydi
 const code=r.mode=='navigate'||/\.(html|js|css|webmanifest)$/.test(u.pathname)&&!u.pathname.includes('/vendor/');
 if(code){  // kod va HTML: avval tarmoq (yangilanish darrov ko'rinadi), internet yo'q bo'lsa kesh
  e.respondWith(fetch(r).then(x=>{if(x&&x.ok){const y=x.clone();caches.open(V).then(c=>c.put(r.mode=='navigate'?'index.html':r,y))}return x})
   .catch(()=>caches.match(r.mode=='navigate'?'index.html':r).then(m=>m||caches.match('index.html'))));
  return;
 }
 e.respondWith(caches.match(r).then(m=>{
  if(m)return m;   // vendor/ va rasmlar: keshdan
  return fetch(r).then(x=>{if(x&&x.ok){const y=x.clone();caches.open(V).then(c=>c.put(r,y))}return x});
 }));
});
