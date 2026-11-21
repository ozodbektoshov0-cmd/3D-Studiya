/* Unit testlar (node:test): Command Pattern + LOW→HQ Car Upgrade + GTA V YFT/YDR/YTD round-trip */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

process.chdir(path.join(__dirname, '..'));

function createStudioVm() {
 const log = [];
 const texMap = {};
 class FakeImageData {
  constructor(data, width, height) {
   this.data = data;
   this.width = width;
   this.height = height;
  }
 }
 const ctx = {
  TextEncoder,
  TextDecoder,
  Blob,
  ImageData: FakeImageData,
  console,
  Uint8Array,
  Uint16Array,
  Uint32Array,
  Int16Array,
  Int32Array,
  Float32Array,
  Uint8ClampedArray,
  DataView,
  ArrayBuffer,
  setTimeout,
  clearTimeout,
  toast: (m) => log.push(String(m)),
  applyTex: () => {},
  texList: () => {},
  refresh: () => {},
  ensureTexNames: () => {},
  tex: texMap,
  document: {
   querySelector: () => null,
   createElement: (tag) => {
    if (tag === 'canvas') {
     const tinyPng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 11, 73, 68, 65, 84, 120, 156, 99, 96, 0, 2, 0, 0, 5, 0, 1, 122, 94, 171, 63, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
     const cvObj = {
      width: 0,
      height: 0,
      _img: null,
      toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      toBlob: (cb) => cb(new Blob([tinyPng], { type: 'image/png' }))
     };
     cvObj.getContext = () => ({
      clearRect() {},
      save() {},
      restore() {},
      translate() {},
      scale() {},
      drawImage(im) { cvObj._img = im && im._img ? im._img : im; },
      putImageData(id) { cvObj._img = id; },
      getImageData() { return cvObj._img; }
     });
     return cvObj;
    }
    return {};
   },
   body: { append() {} }
  }
 };
 ctx.window = ctx;
 ctx.FileReader = class MockFileReader {
  readAsArrayBuffer(blob) {
   blob.arrayBuffer().then((buf) => {
    this.result = buf;
    if (this.onloadend) this.onloadend({ target: this });
    if (this.onload) this.onload({ target: this });
   });
  }
  readAsDataURL(blob) {
   blob.arrayBuffer().then((buf) => {
    this.result = 'data:' + (blob.type || 'application/octet-stream') + ';base64,' + Buffer.from(buf).toString('base64');
    if (this.onloadend) this.onloadend({ target: this });
    if (this.onload) this.onload({ target: this });
   });
  }
 };
 vm.createContext(ctx);
 for (const f of ['vendor/three.min.js', 'vendor/fflate.min.js', 'vendor/OBJLoader.js', 'vendor/GLTFExporter.js', 'js/commands.js', 'js/hq-upgrade.js', 'js/gta5-write.js', 'js/yft.js', 'js/ytd.js', 'js/tex-panel.js']) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
 }
 return { ctx, log };
}

test('Command Pattern: execute, undo, redo, batch (MacroCommand), history limit va register ko‘prigi', () => {
 const { ctx } = createStudioVm();
 const { CMD } = ctx;
 CMD.clear();

 let val = 0;
 const changes = [];
 const unsub = CMD.onChange((s) => changes.push(s));

 CMD.execute({
  label: 'Oshirish +5',
  execute: () => { val += 5; },
  redo: () => { val += 5; },
  undo: () => { val -= 5; }
 });
 assert.equal(val, 5);
 assert.equal(CMD.canUndo(), true);
 assert.equal(CMD.canRedo(), false);
 assert.equal(CMD.undoLabel(), 'Oshirish +5');

 CMD.undo();
 assert.equal(val, 0);
 assert.equal(CMD.canUndo(), false);
 assert.equal(CMD.canRedo(), true);
 assert.equal(CMD.redoLabel(), 'Oshirish +5');

 CMD.redo();
 assert.equal(val, 5);

 /* Batch / MacroCommand teskari tartibda qaytaradi va bitta amal sifatida qayta bajaradi */
 CMD.batch('Kombo', () => {
  CMD.execute({ label: 'A', execute: () => { val *= 2; }, undo: () => { val /= 2; } });
  CMD.execute({ label: 'B', execute: () => { val += 3; }, undo: () => { val -= 3; } });
 });
 assert.equal(val, 13);
 assert.equal(CMD.getHistory().undo.length, 2);
 CMD.undo();
 assert.equal(val, 5);
 CMD.redo();
 assert.equal(val, 13);

 /* Redo stack yangi execute da tozalanishi va maxHistory cheklovi */
 CMD.undo();
 assert.equal(CMD.canRedo(), true);
 CMD.register(() => { val -= 1; }, () => { val += 1; }, 'Legacy hist');
 val += 1;
 assert.equal(CMD.canRedo(), false);
 assert.equal(val, 6);

 CMD.setLimit(2);
 CMD.execute({ label: 'X1', execute: () => { val += 10; }, undo: () => { val -= 10; } });
 CMD.execute({ label: 'X2', execute: () => { val += 20; }, undo: () => { val -= 20; } });
 assert.equal(CMD.getHistory().undo.length, 2);
 assert.deepEqual([...CMD.getHistory().undo], ['X1', 'X2']);
 assert(changes.length >= 4);
 unsub();
});

test('LOW → HQ: qirralarni saqlagan holda 4× poligon oshirish, egri detal silliqlash, PBR tasnif va 2× tekstura', () => {
 const { ctx } = createStudioVm();
 const { THREE: T, HQUpgrade: HQ, CMD } = ctx;
 CMD.clear();

 /* 1) Qutining 90° qirralari yumshab ketmasligi (hajm/burchak saqlanishi) */
 const box = new T.BoxGeometry(2, 1, 4);
 const boxSub = HQ.hqSubdivide(box, { levels: 1, creaseDeg: 48 }, T);
 assert.equal(boxSub.trisBefore, 12);
 assert.equal(boxSub.trisAfter, 48);
 boxSub.geometry.computeBoundingBox();
 const bSz = boxSub.geometry.boundingBox.getSize(new T.Vector3());
 assert(Math.abs(bSz.x - 2) < 1e-4 && Math.abs(bSz.y - 1) < 1e-4 && Math.abs(bSz.z - 4) < 1e-4);

 /* 2) Kam poligonli shar / g'ildirak silliqlanishi va hajmi siqilmasligi */
 const sph = new T.SphereGeometry(1, 8, 6);
 const sphSub = HQ.hqSubdivide(sph, { levels: 1, creaseDeg: 48 }, T);
 assert(sphSub.trisAfter > sphSub.trisBefore * 3);
 const P = sphSub.geometry.getAttribute('position');
 let minR = Infinity, maxR = 0;
 for (let i = 0; i < P.count; i++) {
  const r = Math.hypot(P.getX(i), P.getY(i), P.getZ(i));
  if (r < minR) minR = r;
  if (r > maxR) maxR = r;
 }
 assert(minR > 0.94 && maxR < 1.06, `Shar radiusi buzildi: [${minR}, ${maxR}]`);

 /* 2b) Kam poligonli silindr / g'ildirak chetki halqasi ham doiraviy silliqlanishi va yassi qopqog'i tekis qolishi */
 const cyl = new T.CylinderGeometry(0.5, 0.5, 0.3, 8);
 const cylSub = HQ.hqSubdivide(cyl, { levels: 1, creaseDeg: 48 }, T);
 const cP = cylSub.geometry.getAttribute('position');
 let rimPtsOnCircle = 0, capMaxY = 0;
 for (let i = 0; i < cP.count; i++) {
  const x = cP.getX(i), y = cP.getY(i), z = cP.getZ(i);
  if (Math.abs(Math.abs(y) - 0.15) < 1e-4) {
   capMaxY = Math.max(capMaxY, Math.abs(y));
   const r = Math.hypot(x, z);
   if (r > 0.485 && r < 0.515) rimPtsOnCircle++;
  }
 }
 assert(capMaxY < 0.1501, 'Silindr qopqog‘i yassi qolmadi');
 assert(rimPtsOnCircle >= 16, `Silindr chetki halqasi doira bo‘lmadi (${rimPtsOnCircle})`);

 /* 3) Avto qismlarni tasniflash va HQ upgradeToHQ + Undo/Redo */
 assert.equal(HQ.hqClassifyPart('windscreen', 'mat0', ''), 'glass');
 assert.equal(HQ.hqClassifyPart('chrome_trim', '', ''), 'chrome');
 assert.equal(HQ.hqClassifyPart('tire_lf', '', ''), 'tire');
 assert.equal(HQ.hqClassifyPart('chassis', 'paint', ''), 'body');

 const bodyMesh = new T.Mesh(new T.BoxGeometry(1.8, 0.8, 4.2), new T.MeshBasicMaterial({ color: 0xcc2222 }));
 bodyMesh.name = 'chassis';
 const glassMesh = new T.Mesh(new T.BoxGeometry(1.4, 0.4, 1.2), new T.MeshBasicMaterial({ color: 0x334455 }));
 glassMesh.name = 'windscreen';

 const res = HQ.upgradeToHQ([bodyMesh, glassMesh], { levels: 1, materials: true, upscaleTex: false, THREE: T });
 assert.equal(res.meshesUpgraded, 2);
 assert.equal(res.trisBefore, 24);
 assert.equal(res.trisAfter, 96);
 assert.equal(bodyMesh.material.isMeshStandardMaterial, true);
 assert.equal(glassMesh.material.transparent, true);
 assert(glassMesh.material.opacity < 0.6);

 CMD.undo();
 assert.equal(bodyMesh.material.isMeshBasicMaterial, true);
 assert.equal(bodyMesh.geometry.index.count / 3, 12);
 CMD.redo();
 assert.equal(bodyMesh.material.isMeshStandardMaterial, true);
 assert.equal(bodyMesh.geometry.index.count / 3, 48);

 /* 4) 2× tekstura kattalashtirish */
 const px = new Uint8ClampedArray(8 * 8 * 4);
 for (let i = 0; i < 64; i++) {
  px[i * 4] = (i & 1) ? 220 : 40;
  px[i * 4 + 1] = 120;
  px[i * 4 + 2] = 60;
  px[i * 4 + 3] = 255;
 }
 const up = HQ.hqUpscalePixels(px, 8, 8, 0.35);
 assert.equal(up.width, 16);
 assert.equal(up.height, 16);
 assert.equal(up.data.length, 16 * 16 * 4);
});

test('GTA V YTD: RSC7 bayroqlari, DXT1/DXT5 kodlash va ytd() bilan qayta o‘qish round-trip', async () => {
 const { ctx } = createStudioVm();
 const { GTA5Write, ytd, tex, fflate } = ctx;

 for (const sz of [512, 4096, 32768, 250000, 1400000]) {
  const enc = GTA5Write.encodeRsc7Flags(sz);
  const dec = GTA5Write.decodeRsc7Size(enc.flags);
  assert.equal(dec, enc.size);
  assert(dec >= sz);
 }

 const tex1 = new Uint8ClampedArray(8 * 8 * 4);
 for (let i = 0; i < 64; i++) {
  tex1[i * 4] = 200;
  tex1[i * 4 + 1] = 40;
  tex1[i * 4 + 2] = 30;
  tex1[i * 4 + 3] = 255;
 }
 const tex2 = new Uint8ClampedArray(8 * 8 * 4);
 for (let i = 0; i < 64; i++) {
  tex2[i * 4] = 30;
  tex2[i * 4 + 1] = 160;
  tex2[i * 4 + 2] = 230;
  tex2[i * 4 + 3] = i < 32 ? 90 : 255;
 }

 const ytdBytes = GTA5Write.ytdBuildFromList([
  { name: 'car_paint', width: 8, height: 8, rgba: tex1 },
  { name: 'car_glass', width: 8, height: 8, rgba: tex2 }
 ], { fflate });

 assert.equal(new DataView(ytdBytes.buffer).getUint32(0, true), 0x37435352);

 await ytd(new Blob([ytdBytes]));
 assert(tex.car_paint, 'car_paint YTD dan yuklanmadi');
 assert(tex.car_glass, 'car_glass YTD dan yuklanmadi');
 assert.equal(tex.car_paint.image.width, 8);
 assert.equal(tex.car_glass.image._img.data[3] < 130, true, 'DXT5 alfa saqlanmadi');
 assert.equal(tex.car_glass.image._img.data[60 * 4 + 3] > 230, true, 'DXT5 shaffof emas piksel buzildi');
});

test('GTA V YFT & YDR: mashina ierarxiyasi, qismlar, teksturasiz rang/shaffoflik va yft() round-trip', async () => {
 const { ctx } = createStudioVm();
 const { THREE: T, GTA5Write, yft, fflate } = ctx;

 const mkPart = (name, w, h, d, pos, texName, matOpts) => {
  const m = new T.Mesh(
   new T.BoxGeometry(w, h, d),
   new T.MeshStandardMaterial(Object.assign({ color: 0xdddddd }, matOpts || {}))
  );
  m.name = name;
  if (texName) m.material.userData.tex = texName;
  m.position.set(...pos);
  m.updateMatrixWorld(true);
  return m;
 };

 const carParts = [
  mkPart('chassis', 1.8, 0.7, 4.2, [0, 0.75, 0], 'car_paint'),
  mkPart('windscreen', 1.4, 0.4, 0.9, [0, 1.25, 0.5], null, { color: 0x6699bb, transparent: true, opacity: 0.42, roughness: 0.05 }),
  mkPart('wheel_lf', 0.3, 0.7, 0.7, [-0.85, 0.35, 1.3], 'tire_tex'),
  mkPart('wheel_rf', 0.3, 0.7, 0.7, [0.85, 0.35, 1.3], 'tire_tex'),
  mkPart('door_lf', 0.15, 0.65, 1.1, [-0.9, 0.75, 0.1], null, { name: 'chrome', color: 0x22262b, metalness: 0.9, roughness: 0.1 }),
  mkPart('bonnet', 1.5, 0.12, 1.1, [0, 1.05, 1.45], 'car_paint')
 ];

 const triCount = (obj) => {
  let tris = 0, meshes = 0;
  obj.traverse((o) => {
   if (o.isMesh && o.geometry) {
    meshes++;
    const g = o.geometry;
    tris += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
   }
  });
  return { tris, meshes };
 };

 const origGroup = new T.Group();
 carParts.forEach((p) => origGroup.add(p));
 origGroup.updateMatrixWorld(true);
 const origBox = new T.Box3().setFromObject(origGroup);

 /* YFT round-trip */
 const yftBytes = GTA5Write.yftBuildFromMeshes(carParts, { fflate }, T);
 assert.equal(new DataView(yftBytes.buffer).getUint32(0, true), 0x37435352);

 const loadedYft = await yft(new Blob([yftBytes]), false);
 const statYft = triCount(loadedYft);
 assert.equal(statYft.meshes, 6);
 assert.equal(statYft.tris, 72);

 const loadedNames = [];
 const loadedTexNames = new Set();
 let glassMat = null, doorMat = null;
 loadedYft.traverse((o) => {
  if (o.name) loadedNames.push(o.name);
  if (o.isMesh && o.material) {
   if (o.material.userData.tex) loadedTexNames.add(o.material.userData.tex);
   if (o.parent && o.parent.name === 'windscreen') glassMat = o.material;
   if (o.parent && o.parent.name === 'door_dside_f') doorMat = o.material;
  }
 });
 for (const expected of ['wheel_lf', 'wheel_rf', 'door_dside_f', 'bonnet', 'windscreen']) {
  assert(loadedNames.includes(expected), `${expected} qismi YFT dan topilmadi`);
 }
 assert(loadedTexNames.has('car_paint') && loadedTexNames.has('tire_tex'));
 assert(!loadedTexNames.has('chrome'), 'Teksturasiz chrome materiali soxta tekstura bo‘lib qolmasligi kerak');
 assert(glassMat && !glassMat.userData.tex && glassMat.transparent && Math.abs(glassMat.opacity - 0.42) < 0.02);
 assert(doorMat && !doorMat.userData.tex && doorMat.color.r < 0.2 && doorMat.metalness > 0.8);

 loadedYft.updateMatrixWorld(true);
 const rtBox = new T.Box3().setFromObject(loadedYft);
 const origSize = origBox.getSize(new T.Vector3());
 const rtSize = rtBox.getSize(new T.Vector3());
 assert(Math.abs(origSize.x - rtSize.x) < 1e-3 && Math.abs(origSize.y - rtSize.y) < 1e-3 && Math.abs(origSize.z - rtSize.z) < 1e-3);

 /* YDR round-trip */
 const ydrBytes = GTA5Write.yftBuildFromMeshes(carParts, { ydr: true, fflate }, T);
 const loadedYdr = await yft(new Blob([ydrBytes]), true);
 const statYdr = triCount(loadedYdr);
 assert.equal(statYdr.meshes, 6);
 assert.equal(statYdr.tris, 72);
});

test('GTA V YFT mesh optimizatori: dublikat uchlarni olib tashlash, degenerat uchburchaklarni birlashtirish va fayl hajmini kamaytirish', async () => {
 const { ctx } = createStudioVm();
 const { THREE: T, GTA5Write, yft, fflate } = ctx;

 /* 1-qism: Sof optimizeYftMeshData funksiyasini tekshirish */
 const verts = new Float32Array([
  /* 0..2: oddiy o'ng burchak uchburchak (yuz normali Z+) */
  0, 0, 0,   0, 0, 1,   0, 0,
  1, 0, 0,   0, 0, 1,   1, 0,
  0, 1, 0,   0, 0, 1,   0, 1,
  /* 3..4: 1 va 2-uchlarning deyarli aynan dublikatlari (micro noise bilan) */
  1 + 1e-7, 0, -1e-7,  0, 0, 1,   1, 0,
  0, 1 + 1e-7, 0,      0, 0, 1,   0, 1,
  /* 5: ikkinchi haqiqiy uchburchak uchun yangi uch */
  1, 1, 0,   0, 0, 1,   1, 1,
  /* 6..7: pozitsiyasi (1,0,0) va (0,1,0) bilan bir xil, lekin KESKIN normal (X+) -> saqlanib qolishi shart */
  1, 0, 0,   1, 0, 0,   1, 0,
  0, 1, 0,   1, 0, 0,   0, 1,
  /* 8: keskin qirrali 3-uch */
  1, 0, 1,   1, 0, 0,   1, 1,
  /* 9: pozitsiyasi va normali (0,0,0, 0,0,1) bilan bir xil, lekin BOSHQA UV chok (0.5, 0.5) -> saqlanib qolishi shart */
  0, 0, 0,   0, 0, 1,   0.5, 0.5,
  /* 10..11: mikro-sliver degenerat uchburchak (qisqa qirrasi ~2.8e-4, bir xil normal va UV) va kollinear nuqta */
  1 + 2e-4, 1 + 2e-4, 0,  0, 0, 1,   1, 1,
  0.5, 0, 0,              0, 0, 1,   0.5, 0
 ]);
 const tris = new Uint32Array([
  0, 1, 2,      /* haqiqiy uchburchak 1 */
  3, 5, 4,      /* haqiqiy uchburchak 2 (dublikat uchlardan foydalanadi) */
  6, 8, 7,      /* keskin qirrali haqiqiy uchburchak 3 */
  9, 1, 2,      /* UV chokli haqiqiy uchburchak 4 */
  1, 2, 0,      /* takroriy aylantirilgan dublikat uchburchak -> olib tashlanadi */
  0, 11, 1,     /* kollinear / nol maydonli degenerat uchburchak -> olib tashlanadi */
  5, 10, 0,     /* mikro-sliver degenerat uchburchak (10 -> 5 bilan birlashadi) -> olib tashlanadi */
  0, 0, 1       /* indeks takrorlangan degenerat -> olib tashlanadi */
 ]);

 const opt = GTA5Write.optimizeYftMeshData(verts, tris);
 assert.equal(opt.stats.trisBefore, 8);
 assert.equal(opt.stats.trisAfter, 4, 'Faqat 4 ta haqiqiy uchburchak qolishi kerak');
 assert.equal(opt.stats.degenTrisRemoved, 4, '4 ta degenerat/takroriy uchburchak olib tashlanishi kerak');
 assert.equal(opt.stats.vertsAfter, 8, '6 ta tayanch + keskin normal + UV chok = 8 ta noyob uch saqlanishi kerak');
 assert(opt.stats.dupVertsRemoved >= 4);

 /* 2-qism: Indekslanmagan + degeneratli haqiqiy YFT eksporti hajmini solishtirish va round-trip */
 const rawBox = new T.BoxGeometry(2.0, 1.0, 4.0).toNonIndexed();
 const pos = rawBox.getAttribute('position');
 const nrm = rawBox.getAttribute('normal');
 const uv = rawBox.getAttribute('uv');
 const extraTris = 6; /* nol maydonli degenerat uchburchaklar qo'shamiz */
 const pArr = new Float32Array((pos.count + extraTris * 3) * 3);
 const nArr = new Float32Array((nrm.count + extraTris * 3) * 3);
 const uArr = new Float32Array((uv.count + extraTris * 3) * 2);
 pArr.set(pos.array);
 nArr.set(nrm.array);
 uArr.set(uv.array);
 for (let k = 0; k < extraTris; k++) {
  const b = (pos.count + k * 3);
  /* Kollinear (nol balandlikdagi) degenerat uchburchak */
  pArr.set([0, 0, 0,  0.5, 0, 0,  1, 0, 0], b * 3);
  nArr.set([0, 1, 0,  0, 1, 0,  0, 1, 0], b * 3);
  uArr.set([0, 0,     0.5, 0,   1, 0], b * 2);
 }
 const dirtyGeo = new T.BufferGeometry();
 dirtyGeo.setAttribute('position', new T.BufferAttribute(pArr, 3));
 dirtyGeo.setAttribute('normal', new T.BufferAttribute(nArr, 3));
 dirtyGeo.setAttribute('uv', new T.BufferAttribute(uArr, 2));

 /* Yana bitta yuqori zichlikdagi indekslanmagan shar qismi */
 const sphereGeo = new T.SphereGeometry(0.45, 24, 16).toNonIndexed();

 const mkDirtyMesh = (name, geo, px) => {
  const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0xcc3322 }));
  m.name = name;
  m.material.userData.tex = 'car_paint';
  m.position.set(px, 0.5, 0);
  m.updateMatrixWorld(true);
  return m;
 };
 const dirtyParts = [
  mkDirtyMesh('chassis', dirtyGeo, 0),
  mkDirtyMesh('wheel_lf', sphereGeo, -0.9)
 ];

 const rawBytes = GTA5Write.yftBuildFromMeshes(dirtyParts, { optimize: false, fflate }, T);
 const optBytes = GTA5Write.yftBuildFromMeshes(dirtyParts, { optimize: true, fflate }, T);
 const stats = GTA5Write.yftOut.optStats;

 assert(optBytes.length < rawBytes.length, `Optimizatsiya qilingan YFT (${optBytes.length}B) xom YFT (${rawBytes.length}B) dan kichik bo‘lishi kerak`);
 assert(stats && stats.dupVertsRemoved > 1000, 'Indekslanmagan shardagi minglab dublikat uchlar birlashtirilishi kerak');
 assert.equal(stats.degenTrisRemoved, extraTris, 'Qo‘shilgan 6 ta degenerat uchburchak to‘liq olib tashlanishi kerak');
 assert(GTA5Write.yftOut.info.some((line) => line.includes('opt:')), 'yftOut.info da optimizatsiya statistikasi bo‘lishi kerak');

 /* Qayta import (yft) haqiqiy detali yo'qolmaganini tasdiqlaydi */
 const reloaded = await yft(new Blob([optBytes]), false);
 let loadedTris = 0;
 reloaded.traverse((o) => {
  if (o.isMesh && o.geometry) {
   const g = o.geometry;
   loadedTris += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
  }
 });
 const expectedValidTris = (pos.count / 3) + (sphereGeo.getAttribute('position').count / 3);
 assert.equal(loadedTris, expectedValidTris, 'Barcha haqiqiy uchburchaklar yo‘qotishsiz saqlanishi kerak');

 reloaded.updateMatrixWorld(true);
 const grp = new T.Group();
 dirtyParts.forEach((p) => grp.add(p));
 grp.updateMatrixWorld(true);
 const boxBefore = new T.Box3().setFromObject(grp).getSize(new T.Vector3());
 const boxAfter = new T.Box3().setFromObject(reloaded).getSize(new T.Vector3());
 assert(Math.abs(boxBefore.x - boxAfter.x) < 1e-3 && Math.abs(boxBefore.y - boxAfter.y) < 1e-3 && Math.abs(boxBefore.z - boxAfter.z) < 1e-3);
});

test('Teksturalar paneli: import qilingan va model ichidagi teksturalarni yig‘ish, qidirish va eskiz kartochkalari', () => {
 const { ctx } = createStudioVm();
 const { THREE: T, TexPanel } = ctx;

 const mkTex = (name, w, h) => {
  const cv = ctx.document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const t = new T.CanvasTexture(cv);
  t.name = name;
  return t;
 };

 const tPaint = mkTex('car_paint', 256, 256);
 const tTire = mkTex('tire_tread', 128, 128);
 const tDecal = mkTex('badge_logo', 64, 32);

 const m1 = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ map: tPaint }));
 m1.name = 'chassis';
 const m2 = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ map: tDecal, normalMap: tTire }));
 m2.name = 'emblem';

 const collected = TexPanel.collectImportedTextures(
  { car_paint: tPaint, tire_tread: tTire },
  [m1, m2],
  [m1]
 );
 assert.equal(collected.length, 3, 'Lug‘atdagi 2 ta va model ichidagi 1 ta noyob tekstura yig‘ilishi kerak');
 const cPaint = collected.find((e) => e.name === 'car_paint');
 const cDecal = collected.find((e) => e.name === 'badge_logo');
 assert(cPaint && cPaint.source === 'dict' && cPaint.inUse === true && cPaint.users === 1);
 assert(cDecal && cDecal.source === 'model' && cDecal.inUse === false && cDecal.width === 64 && cDecal.height === 32);

 const filtered = TexPanel.filterTextureEntries(collected, 'TIRE');
 assert.equal(filtered.length, 1);
 assert.equal(filtered[0].name, 'tire_tread');

 /* Minimal DOM daraxtida thumbnail kartochkalari va oldindan ko'rish blokini chizishni tekshirish */
 const origCreateEl = ctx.document.createElement;
 const makeEl = (tag) => {
  if (tag === 'canvas') return origCreateEl('canvas');
  const el = {
   tagName: String(tag).toUpperCase(),
   children: [],
   className: '',
   dataset: {},
   hidden: false,
   _attrs: {},
   setAttribute(k, v) { this._attrs[k] = String(v); },
   getAttribute(k) { return this._attrs[k]; },
   append(...nodes) { for (const n of nodes) if (n) this.children.push(n); },
   querySelector(sel) {
    const id = sel.startsWith('#') ? sel.slice(1) : null;
    const cls = sel.startsWith('.') ? sel.slice(1) : null;
    const walk = (n) => {
     if (id && n.id === id) return n;
     if (cls && String(n.className || '').split(/\s+/).includes(cls)) return n;
     for (const ch of (n.children || [])) {
      const f = walk(ch);
      if (f) return f;
     }
     return null;
    };
    return walk(this);
   },
   set textContent(v) {
    this._text = String(v);
    if (!v) this.children = [];
   },
   get textContent() { return this._text || ''; }
  };
  return el;
 };
 ctx.document.createElement = makeEl;
 const container = makeEl('div');
 const stats = TexPanel.renderPanel(container, {
  texMap: { car_paint: tPaint, tire_tread: tTire },
  meshList: [m1, m2],
  selectedMeshes: [m1]
 });
 assert.equal(stats.total, 3);
 assert.equal(stats.shown, 3);
 assert.equal(stats.active.name, 'car_paint');
 const grid = container.querySelector('#txgrid');
 const prev = container.querySelector('#txprev');
 assert(grid && grid.children.length === 3, 'Grid ichida 3 ta eskiz kartochkasi bo‘lishi kerak');
 assert(prev && prev.hidden === false, 'Tezkor ko‘rish oynasi faol tekstura bilan ko‘rinishi kerak');
});



