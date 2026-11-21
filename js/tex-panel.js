/* ---- Teksturalar paneli: barcha import qilingan teksturalar uchun eskizlar (thumbnail) va tezkor ko'rish ---- */
(function(rootScope){
'use strict';

const thumbCache = new WeakMap();
let activeKey = '';
let lastQuery = '';
let shellMounted = false;
let hiddenFileInput = null;
let refreshHooked = false;

const tr = (s) => {
 if (typeof s !== 'string') return s;
 const g = typeof document !== 'undefined' && document.documentElement ? document.documentElement.lang : 'uz';
 if (!g || g === 'uz') return s;
 return (rootScope.I18N && typeof rootScope.I18N.l === 'function' && rootScope.I18N.l(s)) ||
        (rootScope.I18N && typeof rootScope.I18N.t === 'function' && rootScope.I18N.t(s)) || s;
};

function normalizeTexName(raw, fallback) {
 const s = String(raw || '').trim().replace(/^.*[\\/]/, '').replace(/\.(png|jpe?g|webp|tga|bmp|dds)$/i, '');
 return s || fallback || 'texture';
}

function getImageSize(img) {
 if (!img) return { width: 0, height: 0 };
 const w = Number(img.videoWidth || img.naturalWidth || img.width || 0) || 0;
 const h = Number(img.videoHeight || img.naturalHeight || img.height || 0) || 0;
 return { width: w, height: h };
}

function formatResolution(w, h) {
 return w > 0 && h > 0 ? (w + '×' + h) : '—';
}

function isDrawableImage(img) {
 if (!img) return false;
 if (typeof img.width === 'number' && typeof img.height === 'number' && (img.width <= 0 || img.height <= 0)) return false;
 if (img.data && img.width > 0 && img.height > 0) return true;
 if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) return !!img.complete && img.naturalWidth > 0;
 if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) return true;
 if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) return true;
 if (typeof OffscreenCanvas !== 'undefined' && img instanceof OffscreenCanvas) return true;
 return !!(img.width > 0 && img.height > 0 && (typeof img.getContext === 'function' || img.src || img._img || img.data));
}

/* Global `tex` lug'atidan hamda sahnadagi mesh materiallaridagi ichki (GLB/FBX/...) teksturalardan yagona ro'yxat tuzadi */
function collectImportedTextures(texMap, meshList, selectedMeshes) {
 const list = [];
 const byTexture = new Map();
 const selSet = new Set(Array.isArray(selectedMeshes) ? selectedMeshes : []);
 const dictSet = new Set();

 if (texMap && typeof texMap === 'object') {
  for (const key of Object.keys(texMap)) {
   const t = texMap[key];
   if (!t || !t.image) continue;
   dictSet.add(t);
   const sz = getImageSize(t.image);
   const name = normalizeTexName(t.name || key, key);
   const entry = {
    key: 'dict:' + String(key),
    dictKey: String(key),
    name,
    width: sz.width,
    height: sz.height,
    source: 'dict',
    texture: t,
    users: 0,
    inUse: false,
    channels: []
   };
   byTexture.set(t, entry);
   list.push(entry);
  }
 }

 const arr = Array.isArray(meshList) ? meshList : [];
 let embedSeq = 0;
 for (const o of arr) {
  if (!o || !o.material) continue;
  const ms = Array.isArray(o.material) ? o.material : [o.material];
  const isSel = selSet.has(o);
  for (const m of ms) {
   if (!m) continue;
   const slots = [
    ['map', m.map],
    ['emissive', m.emissiveMap],
    ['normal', m.normalMap],
    ['roughness', m.roughnessMap],
    ['metalness', m.metalnessMap],
    ['ao', m.aoMap]
   ];
   for (const [slotName, t] of slots) {
    if (!t || !t.image) continue;
    let entry = byTexture.get(t);
    if (!entry) {
     embedSeq++;
     const sz = getImageSize(t.image);
     const ud = t.userData || {};
     const rawName = (slotName === 'map' && m.userData && m.userData.tex) || t.name || ud.uri || ud.src || m.name || o.name;
     const name = normalizeTexName(rawName, 'tex_' + embedSeq);
     entry = {
      key: 'mesh:' + embedSeq + ':' + name.toLowerCase(),
      dictKey: '',
      name,
      width: sz.width,
      height: sz.height,
      source: dictSet.has(t) ? 'dict' : 'model',
      texture: t,
      users: 0,
      inUse: false,
      channels: []
     };
     byTexture.set(t, entry);
     list.push(entry);
    }
    if (!entry.channels.includes(slotName)) entry.channels.push(slotName);
    if (slotName === 'map' || entry.channels.length === 1) {
     entry.users += 1;
     if (isSel) entry.inUse = true;
    }
   }
  }
 }

 return list;
}

function filterTextureEntries(entries, query) {
 const list = Array.isArray(entries) ? entries : [];
 const q = String(query || '').trim().toLowerCase();
 if (!q) return list.slice();
 return list.filter((e) => e && String(e.name || '').toLowerCase().includes(q));
}

function drawImageOntoCanvas(canvas, img, maxDim) {
 if (!canvas || !img) return false;
 const sz = getImageSize(img);
 const side = Math.max(32, maxDim || 128);
 if (canvas.width !== side) canvas.width = side;
 if (canvas.height !== side) canvas.height = side;
 const ctx = canvas.getContext && canvas.getContext('2d');
 if (!ctx) return false;
 ctx.clearRect(0, 0, side, side);

 if (!sz.width || !sz.height || !isDrawableImage(img)) return false;

 const aspect = sz.width / sz.height;
 let dw = side;
 let dh = side;
 if (aspect > 1) dh = Math.max(1, Math.round(side / aspect));
 else if (aspect < 1) dw = Math.max(1, Math.round(side * aspect));
 const dx = Math.floor((side - dw) / 2);
 const dy = Math.floor((side - dh) / 2);

 if (img.data && typeof ctx.putImageData === 'function') {
  try {
   const tmp = document.createElement('canvas');
   tmp.width = sz.width;
   tmp.height = sz.height;
   const tctx = tmp.getContext('2d');
   const id = (typeof ImageData !== 'undefined')
    ? new ImageData(new Uint8ClampedArray(img.data), sz.width, sz.height)
    : { data: img.data, width: sz.width, height: sz.height };
   tctx.putImageData(id, 0, 0);
   ctx.imageSmoothingEnabled = sz.width <= side;
   ctx.drawImage(tmp, dx, dy, dw, dh);
   return true;
  } catch (e) {
   return false;
  }
 }

 try {
  ctx.imageSmoothingEnabled = sz.width > 16;
  ctx.drawImage(img, dx, dy, dw, dh);
  return true;
 } catch (e) {
  return false;
 }
}

function getThumbDataUrl(img, size) {
 if (!img || !isDrawableImage(img) || typeof document === 'undefined') return '';
 let entryCache = thumbCache.get(img);
 if (entryCache && entryCache[size]) return entryCache[size];
 const cv = document.createElement('canvas');
 if (!drawImageOntoCanvas(cv, img, size) || typeof cv.toDataURL !== 'function') return '';
 try {
  const url = cv.toDataURL('image/png');
  if (!entryCache) { entryCache = {}; thumbCache.set(img, entryCache); }
  entryCache[size] = url;
  return url;
 } catch (e) {
  return '';
 }
}

const getTexMap = () => (typeof tex !== 'undefined' ? tex : (rootScope.tex || {}));
const getMeshList = () => (typeof meshes === 'function' ? meshes() : (typeof rootScope.meshes === 'function' ? rootScope.meshes() : []));
const getMatsFn = () => (typeof mats === 'function' ? mats : (typeof rootScope.mats === 'function' ? rootScope.mats : (o) => [].concat(o.material || [])));
const getToastFn = () => (typeof toast === 'function' ? toast : rootScope.toast);
const getSaveBlobFn = () => (typeof saveBlob === 'function' ? saveBlob : rootScope.saveBlob);
const getLoadAllFn = () => (typeof loadAll === 'function' ? loadAll : rootScope.loadAll);
const getImgFn = () => (typeof img === 'function' ? img : rootScope.img);

function saveTexturePng(entry) {
 if (!entry || !entry.texture || !entry.texture.image) return;
 const imgEl = entry.texture.image;
 const fileName = (entry.name || 'texture') + '.png';
 const saveFn = getSaveBlobFn();
 if (typeof saveFn !== 'function') return;

 if (typeof imgEl.toBlob === 'function') {
  imgEl.toBlob((blob) => { if (blob) saveFn(blob, fileName); }, 'image/png');
  return;
 }
 const sz = getImageSize(imgEl);
 if (!sz.width || !sz.height || typeof document === 'undefined') return;
 const cv = document.createElement('canvas');
 cv.width = sz.width;
 cv.height = sz.height;
 const ctx = cv.getContext && cv.getContext('2d');
 if (!ctx) return;
 if (imgEl.data) {
  const id = new ImageData(new Uint8ClampedArray(imgEl.data), sz.width, sz.height);
  ctx.putImageData(id, 0, 0);
 } else {
  ctx.drawImage(imgEl, 0, 0, sz.width, sz.height);
 }
 if (typeof cv.toBlob === 'function') {
  cv.toBlob((blob) => { if (blob) saveFn(blob, fileName); }, 'image/png');
 }
}

function getSelectedRealMeshes() {
 if (typeof real === 'function') return real();
 if (typeof rootScope.real === 'function') return rootScope.real();
 const all = getMeshList();
 const s = typeof sel !== 'undefined' ? sel : rootScope.sel;
 const ms = typeof MS !== 'undefined' ? MS : rootScope.MS;
 return all.filter((o) => o && (o === s || (ms && ms.has && ms.has(o))));
}

function applyTextureWithUndo(entry) {
 if (!entry || !entry.texture) return;
 const targets = getSelectedRealMeshes();
 const toastFn = getToastFn();
 if (!targets.length) {
  if (typeof toastFn === 'function') toastFn(tr('Avval mesh tanlang'));
  return;
 }
 const getMats = getMatsFn();
 const prev = [];
 for (const o of targets) {
  if (o.geometry && typeof o.geometry.getAttribute === 'function' && !o.geometry.getAttribute('uv')) {
   if (typeof toastFn === 'function') toastFn(o.name + tr(': UV yo’q — avval “UV avto”'));
  }
  for (const m of getMats(o)) {
   if (!m) continue;
   prev.push({
    m,
    map: m.map,
    color: m.color && typeof m.color.getHex === 'function' ? m.color.getHex() : null,
    tex: m.userData ? m.userData.tex : undefined
   });
   m.map = entry.texture;
   if (m.color && typeof m.color.set === 'function') m.color.set(0xffffff);
   if (!m.userData) m.userData = {};
   m.userData.tex = entry.name;
   m.needsUpdate = true;
  }
 }
 if (rootScope.CMD && typeof rootScope.CMD.register === 'function' && prev.length) {
  const nextTex = entry.texture;
  const nextName = entry.name;
  rootScope.CMD.register(
   () => {
    for (const s of prev) {
     s.m.map = s.map;
     if (s.color !== null && s.m.color) s.m.color.setHex(s.color);
     if (s.m.userData) {
      if (s.tex === undefined) delete s.m.userData.tex;
      else s.m.userData.tex = s.tex;
     }
     s.m.needsUpdate = true;
    }
    renderTexPanel();
   },
   () => {
    for (const s of prev) {
     s.m.map = nextTex;
     if (s.m.color) s.m.color.set(0xffffff);
     if (!s.m.userData) s.m.userData = {};
     s.m.userData.tex = nextName;
     s.m.needsUpdate = true;
    }
    renderTexPanel();
   },
   'Tekstura: ' + entry.name
  );
 }
 activeKey = entry.key;
 renderTexPanel();
}

function triggerTexUpload() {
 if (typeof document === 'undefined') return;
 if (!hiddenFileInput) {
  hiddenFileInput = document.createElement('input');
  hiddenFileInput.type = 'file';
  hiddenFileInput.multiple = true;
  hiddenFileInput.hidden = true;
  hiddenFileInput.accept = '.png,.jpg,.jpeg,.webp,.txd,.ytd,.wtd';
  hiddenFileInput.onchange = (e) => {
   const files = [...(e.target.files || [])];
   e.target.value = '';
   if (!files.length) return;
   const loadAllFn = getLoadAllFn();
   const imgFn = getImgFn();
   if (typeof loadAllFn === 'function') loadAllFn(files);
   else if (typeof imgFn === 'function') files.forEach((f) => imgFn(f));
  };
  document.body.append(hiddenFileInput);
 }
 hiddenFileInput.click();
}

function buildShell(container) {
 if (!container) return null;
 if (!shellMounted || !container.querySelector('.tx-bar')) {
  container.textContent = '';
  const bar = document.createElement('div');
  bar.className = 'tx-bar';

  const search = document.createElement('input');
  search.id = 'txq';
  search.type = 'search';
  search.value = lastQuery;
  search.placeholder = tr('Tekstura qidirish…');
  search.setAttribute('aria-label', tr('Tekstura qidirish…'));
  search.oninput = (e) => {
   lastQuery = e.target.value;
   renderTexPanel();
  };

  const count = document.createElement('span');
  count.id = 'txcnt';
  count.className = 'tx-cnt';
  count.textContent = '0';

  const addBtn = document.createElement('button');
  addBtn.id = 'txadd';
  addBtn.type = 'button';
  addBtn.className = 'tx-add';
  addBtn.textContent = '+';
  addBtn.title = tr('Tekstura qo’shish…');
  addBtn.onclick = triggerTexUpload;

  bar.append(search, count, addBtn);

  const prev = document.createElement('div');
  prev.id = 'txprev';
  prev.hidden = true;

  const grid = document.createElement('div');
  grid.id = 'txgrid';

  container.append(bar, prev, grid);
  shellMounted = true;
 }
 return {
  search: container.querySelector('#txq'),
  count: container.querySelector('#txcnt'),
  addBtn: container.querySelector('#txadd'),
  prev: container.querySelector('#txprev'),
  grid: container.querySelector('#txgrid')
 };
}

function renderPreviewBox(prevEl, entry) {
 if (!prevEl) return;
 prevEl.textContent = '';
 if (!entry) {
  prevEl.hidden = true;
  return;
 }
 prevEl.hidden = false;

 const box = document.createElement('div');
 box.className = 'tx-pv-box';

 const cv = document.createElement('canvas');
 cv.className = 'tx-pv-cv';
 cv.width = 144;
 cv.height = 144;
 const drawn = drawImageOntoCanvas(cv, entry.texture.image, 144);
 if (!drawn && entry.texture.image && typeof entry.texture.image.addEventListener === 'function') {
  entry.texture.image.addEventListener('load', () => renderTexPanel(), { once: true });
 }
 box.append(cv);

 const meta = document.createElement('div');
 meta.className = 'tx-pv-meta';

 const nm = document.createElement('b');
 nm.className = 'tx-pv-name';
 nm.textContent = entry.name;
 nm.title = entry.name;

 const info = document.createElement('small');
 info.className = 'tx-pv-info';
 const srcLabel = entry.source === 'model' ? tr('Modeldan') : tr('Yuklangan');
 const resTxt = formatResolution(entry.width, entry.height);
 info.textContent = resTxt + ' · ' + srcLabel + (entry.users > 0 ? ' · ' + entry.users + ' mesh' : '');

 const btns = document.createElement('div');
 btns.className = 'tx-pv-btns';

 const ap = document.createElement('button');
 ap.type = 'button';
 ap.className = 'pri tx-apply';
 ap.textContent = tr('Meshga qo’llash');
 ap.onclick = () => applyTextureWithUndo(entry);

 const dl = document.createElement('button');
 dl.type = 'button';
 dl.className = 'tx-dl';
 dl.textContent = '⬇';
 dl.title = tr('PNG saqlash');
 dl.onclick = () => saveTexturePng(entry);

 btns.append(ap, dl);
 meta.append(nm, info, btns);
 prevEl.append(box, meta);
}

function createThumbCard(entry, isActive) {
 const card = document.createElement('div');
 card.className = 'tx-card' + (isActive ? ' sel' : '') + (entry.inUse ? ' used' : '');
 card.setAttribute('role', 'button');
 card.tabIndex = 0;
 card.dataset.tx = entry.key;
 card.title = entry.name + ' (' + formatResolution(entry.width, entry.height) + ')';

 const frame = document.createElement('div');
 frame.className = 'tx-th';

 const url = getThumbDataUrl(entry.texture.image, 112);
 if (url && typeof Image !== 'undefined') {
  const im = document.createElement('img');
  im.alt = entry.name;
  im.src = url;
  im.loading = 'lazy';
  frame.append(im);
 } else {
  const cv = document.createElement('canvas');
  cv.className = 'tx-cv';
  cv.width = 112;
  cv.height = 112;
  const drawn = drawImageOntoCanvas(cv, entry.texture.image, 112);
  if (!drawn && entry.texture.image && typeof entry.texture.image.addEventListener === 'function') {
   entry.texture.image.addEventListener('load', () => renderTexPanel(), { once: true });
  }
  frame.append(cv);
 }

 const resBadge = document.createElement('span');
 resBadge.className = 'tx-res';
 resBadge.textContent = formatResolution(entry.width, entry.height);
 frame.append(resBadge);

 if (entry.inUse) {
  const useBadge = document.createElement('span');
  useBadge.className = 'tx-use';
  useBadge.textContent = tr('Faol');
  frame.append(useBadge);
 }

 const foot = document.createElement('div');
 foot.className = 'tx-foot';

 const nm = document.createElement('span');
 nm.className = 'tx-nm';
 nm.textContent = entry.name;

 const dl = document.createElement('button');
 dl.type = 'button';
 dl.className = 'tx-dls';
 dl.textContent = '⬇';
 dl.title = tr('PNG saqlash');
 dl.onclick = (e) => {
  e.stopPropagation();
  saveTexturePng(entry);
 };

 foot.append(nm, dl);
 card.append(frame, foot);

 const pick = () => {
  activeKey = entry.key;
  renderTexPanel();
 };
 card.onclick = pick;
 card.ondblclick = () => applyTextureWithUndo(entry);
 card.onkeydown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
   e.preventDefault();
   pick();
  }
 };
 return card;
}

function renderPanel(container, state) {
 const ui = buildShell(container);
 if (!ui) return;
 const st = state || {};
 const allEntries = collectImportedTextures(st.texMap, st.meshList, st.selectedMeshes);
 const filtered = filterTextureEntries(allEntries, ui.search ? ui.search.value : lastQuery);

 if (ui.search) {
  ui.search.placeholder = tr('Tekstura qidirish…');
  ui.search.setAttribute('aria-label', tr('Tekstura qidirish…'));
 }
 if (ui.addBtn) ui.addBtn.title = tr('Tekstura qo’shish…');
 if (ui.count) {
  ui.count.textContent = filtered.length === allEntries.length
   ? String(allEntries.length)
   : (filtered.length + '/' + allEntries.length);
 }

 let activeEntry = filtered.find((e) => e.key === activeKey) ||
  allEntries.find((e) => e.key === activeKey) ||
  filtered.find((e) => e.inUse) ||
  filtered[0] ||
  null;
 if (activeEntry) activeKey = activeEntry.key;

 renderPreviewBox(ui.prev, activeEntry);

 ui.grid.textContent = '';
 if (!filtered.length) {
  const empty = document.createElement('div');
  empty.className = 'tx-empty';
  const msg = document.createElement('p');
  msg.textContent = allEntries.length
   ? tr('Mos tekstura topilmadi')
   : tr('Hali tekstura yo’q — PNG, JPG, TXD, YTD yoki model yuklang.');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = allEntries.length ? tr('Tozalash') : tr('Tekstura qo’shish…');
  btn.onclick = () => {
   if (allEntries.length) {
    lastQuery = '';
    if (ui.search) ui.search.value = '';
    renderTexPanel();
   } else {
    triggerTexUpload();
   }
  };
  empty.append(msg, btn);
  ui.grid.append(empty);
  return { total: allEntries.length, shown: 0, active: activeEntry };
 }

 const frag = document.createDocumentFragment ? document.createDocumentFragment() : null;
 for (const entry of filtered) {
  const card = createThumbCard(entry, activeEntry && entry.key === activeEntry.key);
  if (frag) frag.append(card);
  else ui.grid.append(card);
 }
 if (frag) ui.grid.append(frag);
 return { total: allEntries.length, shown: filtered.length, active: activeEntry };
}

function renderTexPanel() {
 if (typeof document === 'undefined') return null;
 const container = document.querySelector('#tl');
 if (!container) return null;
 const meshList = getMeshList();
 const selectedMeshes = getSelectedRealMeshes();
 const texMap = getTexMap();
 return renderPanel(container, { texMap, meshList, selectedMeshes });
}

function hookRuntime() {
 if (typeof rootScope === 'object' && rootScope) {
  rootScope.texList = renderTexPanel;
  if (typeof rootScope.applyT === 'function' && !rootScope.applyT._txWrapped) {
   const prevApplyT = rootScope.applyT;
   const wrappedApplyT = function() {
    const out = prevApplyT.apply(this, arguments);
    try { renderTexPanel(); } catch (e) {}
    return out;
   };
   wrappedApplyT._txWrapped = true;
   rootScope.applyT = wrappedApplyT;
  }
  if (!refreshHooked && typeof rootScope.refresh === 'function') {
   refreshHooked = true;
   const prevRefresh = rootScope.refresh;
   rootScope.refresh = function() {
    const out = prevRefresh.apply(this, arguments);
    try { renderTexPanel(); } catch (e) {}
    return out;
   };
  }
 }
 if (typeof document !== 'undefined') {
  if (document.querySelector('#tl')) renderTexPanel();
  const texTabBtn = document.querySelector('#ptabs button[data-pt="tex"]');
  if (texTabBtn && typeof texTabBtn.addEventListener === 'function') {
   texTabBtn.addEventListener('click', () => {
    try { renderTexPanel(); } catch (e) {}
   });
  }
  if (typeof rootScope.addEventListener === 'function') {
   rootScope.addEventListener('i18n-change', () => {
    try { renderTexPanel(); } catch (e) {}
   });
  }
 }
}

const API = {
 collectImportedTextures,
 filterTextureEntries,
 formatResolution,
 normalizeTexName,
 drawImageOntoCanvas,
 renderPanel,
 renderTexPanel,
 applyTextureWithUndo,
 saveTexturePng
};

if (typeof rootScope === 'object' && rootScope) {
 rootScope.TexPanel = API;
 hookRuntime();
}
if (typeof module !== 'undefined' && module.exports) {
 module.exports = API;
}
})(typeof window !== 'undefined' ? window : globalThis);
