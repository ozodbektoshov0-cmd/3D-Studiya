/* ---- Rasmdan 3D (v40): relyef + siluet + toza logo kontur ----
   Logo/siluet: binary mask → kontur izlash → soddalashtirish → ekstruziya.
   Relyef: panjara (heightmap). Natija yopiq jism (STL uchun). */
(function () {
  'use strict';

  function otsu(hist, total) {
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, max = 0, thr = 128;
    for (let i = 0; i < 256; i++) {
      wB += hist[i];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sumB += i * hist[i];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > max) { max = between; thr = i; }
    }
    return thr;
  }

  function morph(mask, nx, ny, dilate) {
    const out = new Uint8Array(mask.length);
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        if (dilate) {
          let v = 0;
          for (let dy = -1; dy <= 1 && !v; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const X = x + dx, Y = y + dy;
              if (X < 0 || Y < 0 || X >= nx || Y >= ny) continue;
              if (mask[Y * nx + X]) v = 1;
            }
          }
          out[y * nx + x] = v;
        } else {
          let ok = !!mask[y * nx + x];
          if (ok) {
            for (let dy = -1; dy <= 1 && ok; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const X = x + dx, Y = y + dy;
                if (X < 0 || Y < 0 || X >= nx || Y >= ny || !mask[Y * nx + X]) ok = false;
              }
            }
          }
          out[y * nx + x] = ok ? 1 : 0;
        }
      }
    }
    return out;
  }
  function closeMask(mask, nx, ny) { return morph(morph(mask, nx, ny, true), nx, ny, false); }
  function openMask(mask, nx, ny) { return morph(morph(mask, nx, ny, false), nx, ny, true); }

  function isLogoLike(raw, N) {
    let dark = 0, light = 0, mid = 0;
    for (let i = 0; i < N; i++) {
      const v = raw[i];
      if (v < 0.18) dark++;
      else if (v > 0.82) light++;
      else mid++;
    }
    return (dark + light) / N > 0.78 && mid / N < 0.22;
  }

  /* ---- Ramer–Douglas–Peucker soddalashtirish ---- */
  function rdp(points, eps) {
    if (points.length < 3) return points.slice();
    const sq = eps * eps;
    function dist2(p, a, b) {
      let x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
      if (dx === 0 && dy === 0) return (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y);
      const t = Math.max(0, Math.min(1, ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)));
      const px = x + t * dx - p[0], py = y + t * dy - p[1];
      return px * px + py * py;
    }
    function rec(pts) {
      if (pts.length < 3) return pts;
      let maxD = 0, idx = 0;
      const a = pts[0], b = pts[pts.length - 1];
      for (let i = 1; i < pts.length - 1; i++) {
        const d = dist2(pts[i], a, b);
        if (d > maxD) { maxD = d; idx = i; }
      }
      if (maxD > sq) {
        const left = rec(pts.slice(0, idx + 1));
        const right = rec(pts.slice(idx));
        return left.slice(0, -1).concat(right);
      }
      return [a, b];
    }
    return rec(points);
  }

  /* ---- Kontur izlash (boundary follow, 8-connected) ---- */
  function findContours(mask, nx, ny) {
    const visited = new Uint8Array(nx * ny);
    const contours = [];
    // 8 directions clockwise starting from right
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, 1, 1, 1, 0, -1, -1, -1];

    function isOn(x, y) {
      return x >= 0 && y >= 0 && x < nx && y < ny && mask[y * nx + x];
    }

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const i = y * nx + x;
        if (!mask[i] || visited[i]) continue;
        // start only on boundary pixel
        let boundary = false;
        for (let k = 0; k < 8; k++) {
          if (!isOn(x + dx[k], y + dy[k])) { boundary = true; break; }
        }
        if (!boundary) continue;

        // Trace contour
        const contour = [];
        let cx = x, cy = y, dir = 0;
        let guard = 0;
        const maxSteps = nx * ny * 2;
        do {
          contour.push([cx + 0.5, cy + 0.5]); // pixel center
          visited[cy * nx + cx] = 1;
          // find next boundary neighbor, starting from dir-2 (turn left preference)
          let found = false;
          for (let k = 0; k < 8; k++) {
            const nd = (dir + 6 + k) % 8; // prefer left turns for outer
            const nx_ = cx + dx[nd], ny_ = cy + dy[nd];
            if (isOn(nx_, ny_)) {
              // check it is still boundary-ish or continue
              cx = nx_; cy = ny_; dir = nd; found = true; break;
            }
          }
          if (!found) break;
          guard++;
        } while ((cx !== x || cy !== y) && guard < maxSteps);

        if (contour.length >= 4) {
          // close if needed
          const a = contour[0], b = contour[contour.length - 1];
          if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 1.5) contour.push([a[0], a[1]]);
          contours.push(contour);
        }
      }
    }
    return contours;
  }

  /* ---- Polygon area (signed) for orientation / hole detection ---- */
  function polyArea(pts) {
    let a = 0;
    for (let i = 0, n = pts.length; i < n; i++) {
      const j = (i + 1) % n;
      a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
    }
    return a * 0.5;
  }

  /* ---- Ear-clip triangulation for simple polygon ---- */
  function triangulate(poly) {
    // poly: array of [x,y], CCW preferred
    const n0 = poly.length;
    if (n0 < 3) return [];
    // remove duplicate last point if closed
    let pts = poly.slice();
    if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) {
      pts.pop();
    }
    if (pts.length < 3) return [];
    // ensure CCW
    if (polyArea(pts) < 0) pts = pts.reverse();

    const idx = pts.map((_, i) => i);
    const tris = [];
    let guard = 0;
    while (idx.length > 3 && guard < 10000) {
      guard++;
      let ear = -1;
      for (let i = 0; i < idx.length; i++) {
        const i0 = idx[(i + idx.length - 1) % idx.length];
        const i1 = idx[i];
        const i2 = idx[(i + 1) % idx.length];
        const a = pts[i0], b = pts[i1], c = pts[i2];
        // convex?
        const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (cross <= 0) continue;
        // any point inside triangle?
        let inside = false;
        for (let j = 0; j < idx.length; j++) {
          const k = idx[j];
          if (k === i0 || k === i1 || k === i2) continue;
          const p = pts[k];
          if (pointInTri(p, a, b, c)) { inside = true; break; }
        }
        if (!inside) { ear = i; break; }
      }
      if (ear < 0) break; // fallback
      const i0 = idx[(ear + idx.length - 1) % idx.length];
      const i1 = idx[ear];
      const i2 = idx[(ear + 1) % idx.length];
      tris.push([i0, i1, i2]);
      idx.splice(ear, 1);
    }
    if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
    return { pts, tris };
  }

  function pointInTri(p, a, b, c) {
    const s = (a[0] - c[0]) * (p[1] - c[1]) - (a[1] - c[1]) * (p[0] - c[0]);
    const t = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if ((s < 0) !== (t < 0) && s !== 0 && t !== 0) return false;
    const d = (c[0] - b[0]) * (p[1] - b[1]) - (c[1] - b[1]) * (p[0] - b[0]);
    return d === 0 || (d < 0) === (s + t <= 0);
  }

  /* ---- Build solid from contours (logo / silhouette) ---- */
  function buildFromContours(contours, nx, ny, Wd, Hd, height, simplifyEps) {
    if (!contours.length) return null;
    // Convert pixel coords → world
    const toW = (p) => [
      (p[0] / nx - 0.5) * Wd,
      (0.5 - p[1] / ny) * Hd
    ];

    // Sort by absolute area descending (largest outer first)
    const processed = contours.map(c => {
      let simp = rdp(c, simplifyEps);
      if (simp.length >= 2 && simp[0][0] === simp[simp.length - 1][0] && simp[0][1] === simp[simp.length - 1][1]) {
        // already closed-ish
      }
      // ensure closed for area
      const closed = simp.slice();
      if (closed.length && (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1])) {
        closed.push([closed[0][0], closed[0][1]]);
      }
      const area = polyArea(closed);
      return { pts: simp, area, abs: Math.abs(area) };
    }).filter(c => c.pts.length >= 3 && c.abs > 4);

    processed.sort((a, b) => b.abs - a.abs);
    if (!processed.length) return null;

    const pos = [], idx = [];
    let vBase = 0;

    // For simplicity and robustness: treat each significant contour as separate solid (no complex hole nesting)
    // Largest ones first; skip very small noise
    const minArea = processed[0].abs * 0.008;
    for (const cont of processed) {
      if (cont.abs < minArea) continue;
      let pts2d = cont.pts.map(toW);
      // remove closing duplicate
      if (pts2d.length > 1 && Math.hypot(pts2d[0][0] - pts2d[pts2d.length - 1][0], pts2d[0][1] - pts2d[pts2d.length - 1][1]) < 1e-6) {
        pts2d = pts2d.slice(0, -1);
      }
      if (pts2d.length < 3) continue;

      const tri = triangulate(pts2d);
      if (!tri || !tri.tris.length) continue;
      const { pts, tris } = tri;
      const n = pts.length;

      // Top vertices (z = height)
      for (let i = 0; i < n; i++) {
        pos.push(pts[i][0], pts[i][1], height);
      }
      // Bottom vertices (z = 0)
      for (let i = 0; i < n; i++) {
        pos.push(pts[i][0], pts[i][1], 0);
      }

      // Top faces
      for (const t of tris) {
        idx.push(vBase + t[0], vBase + t[1], vBase + t[2]);
      }
      // Bottom faces (reversed)
      for (const t of tris) {
        idx.push(vBase + n + t[0], vBase + n + t[2], vBase + n + t[1]);
      }
      // Side walls
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const a = vBase + i, b = vBase + j;
        const c = vBase + n + j, d = vBase + n + i;
        idx.push(a, d, c, a, c, b);
      }
      vBase += n * 2;
    }

    if (!idx.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(new THREE.Uint32BufferAttribute(idx, 1));
    g.computeVertexNormals();
    // simple planar UV
    const uv = new Float32Array((pos.length / 3) * 2);
    for (let i = 0; i < pos.length / 3; i++) {
      uv[i * 2] = (pos[i * 3] / Wd) + 0.5;
      uv[i * 2 + 1] = (pos[i * 3 + 1] / Hd) + 0.5;
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }

  /* ---- Classic grid build (for relief) ---- */
  function buildGrid(px, nx, ny, o, mask, lum) {
    const N = nx * ny, Wd = o.width, Hd = Wd * (ny / nx);
    const top = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      top[i] = o.mode === 'sil' ? o.height : o.base + o.height * lum[i];
    }
    const cell = new Uint8Array((nx - 1) * (ny - 1));
    let nc = 0;
    for (let y = 0; y < ny - 1; y++) {
      for (let x = 0; x < nx - 1; x++) {
        const i = y * nx + x;
        if (mask[i] && mask[i + 1] && mask[i + nx] && mask[i + nx + 1]) {
          cell[y * (nx - 1) + x] = 1; nc++;
        }
      }
    }
    if (!nc) return null;
    const pos = [], uv = [], idx = [];
    const px_ = x => (x / (nx - 1) - 0.5) * Wd;
    const py_ = y => (0.5 - y / (ny - 1)) * Hd;
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      pos.push(px_(x), py_(y), top[y * nx + x]);
      uv.push(x / (nx - 1), 1 - y / (ny - 1));
    }
    const T = (x, y) => y * nx + x, Bo = nx * ny;
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      pos.push(px_(x), py_(y), 0);
      uv.push(x / (nx - 1), 1 - y / (ny - 1));
    }
    for (let y = 0; y < ny - 1; y++) {
      for (let x = 0; x < nx - 1; x++) {
        if (!cell[y * (nx - 1) + x]) continue;
        const a = T(x, y), b = T(x + 1, y), c = T(x, y + 1), d = T(x + 1, y + 1);
        idx.push(c, d, b, c, b, a);
        idx.push(Bo + c, Bo + b, Bo + d, Bo + c, Bo + a, Bo + b);
      }
    }
    const has = (x, y) => x >= 0 && y >= 0 && x < nx - 1 && y < ny - 1 && cell[y * (nx - 1) + x] === 1;
    const wall = (p, q) => {
      const pb = pos.length / 3;
      pos.push(pos[p * 3], pos[p * 3 + 1], pos[p * 3 + 2],
               pos[p * 3], pos[p * 3 + 1], 0,
               pos[q * 3], pos[q * 3 + 1], 0,
               pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2]);
      uv.push(uv[p * 2], uv[p * 2 + 1], uv[p * 2], uv[p * 2 + 1],
              uv[q * 2], uv[q * 2 + 1], uv[q * 2], uv[q * 2 + 1]);
      idx.push(pb, pb + 1, pb + 2, pb, pb + 2, pb + 3);
    };
    for (let y = 0; y < ny - 1; y++) {
      for (let x = 0; x < nx - 1; x++) {
        if (!has(x, y)) continue;
        const a = T(x, y), b = T(x + 1, y), c = T(x, y + 1), d = T(x + 1, y + 1);
        if (!has(x - 1, y)) wall(a, c);
        if (!has(x, y + 1)) wall(c, d);
        if (!has(x + 1, y)) wall(d, b);
        if (!has(x, y - 1)) wall(b, a);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(new THREE.Uint32BufferAttribute(idx, 1));
    g.computeVertexNormals();
    return g;
  }

  /* ---- Main build ---- */
  function img3dBuild(px, nx, ny, o) {
    o = Object.assign({
      mode: 'sil', width: 1, height: 0.08, base: 0.015,
      invert: false, blur: 1, athr: 128, thr: 128, logo: true, simplify: 1.2
    }, o || {});
    const N = nx * ny, Wd = o.width, Hd = Wd * (ny / nx);
    const lum = new Float32Array(N), raw = new Float32Array(N);
    let hasAlpha = false;
    for (let i = 0; i < N; i++) {
      const a = px[i * 4 + 3];
      if (a < 250) hasAlpha = true;
      raw[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
    }

    const logoLike = o.logo || (o.mode === 'sil' && isLogoLike(raw, N));
    let mask = new Uint8Array(N);
    let thr = o.thr;

    // Binary mask
    if (o.mode === 'sil' || logoLike) {
      const hist = new Uint32Array(256);
      let total = 0;
      for (let i = 0; i < N; i++) {
        if (px[i * 4 + 3] < o.athr) continue;
        const b = Math.min(255, Math.max(0, Math.round(raw[i] * 255)));
        hist[b]++; total++;
      }
      if (total > 30 && (logoLike || o.thr === 128)) thr = otsu(hist, total);

      for (let i = 0; i < N; i++) {
        const a = px[i * 4 + 3], opaque = a >= o.athr;
        if (hasAlpha) {
          mask[i] = opaque ? 1 : 0;
        } else {
          const on = o.invert ? (raw[i] > thr / 255) : (raw[i] < thr / 255);
          mask[i] = on ? 1 : 0;
        }
      }
      // Strong cleanup for logos
      mask = openMask(mask, nx, ny);
      mask = closeMask(mask, nx, ny);
      if (logoLike) {
        mask = closeMask(mask, nx, ny); // extra close helps thin strokes
      }
    } else {
      for (let i = 0; i < N; i++) mask[i] = px[i * 4 + 3] >= o.athr ? 1 : 0;
    }

    for (let i = 0; i < N; i++) lum[i] = o.invert ? 1 - raw[i] : raw[i];

    // Contrast stretch for relief
    if (o.mode === 'relief') {
      let mn = 1, mx = 0;
      for (let i = 0; i < N; i++) {
        if (mask[i]) {
          if (lum[i] < mn) mn = lum[i];
          if (lum[i] > mx) mx = lum[i];
        }
      }
      const range = mx - mn;
      if (range > 0.02) {
        for (let i = 0; i < N; i++) if (mask[i]) lum[i] = (lum[i] - mn) / range;
      }
      // blur
      const passes = Math.min(4, o.blur | 0);
      for (let p = 0; p < passes; p++) {
        const t = new Float32Array(N);
        for (let y = 0; y < ny; y++) {
          for (let x = 0; x < nx; x++) {
            let s = 0, c = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const X = x + dx, Y = y + dy;
                if (X < 0 || Y < 0 || X >= nx || Y >= ny) continue;
                const k = Y * nx + X;
                if (!mask[k]) continue;
                s += lum[k]; c++;
              }
            }
            t[y * nx + x] = c ? s / c : lum[y * nx + x];
          }
        }
        lum.set(t);
      }
      return buildGrid(px, nx, ny, o, mask, lum);
    }

    // ===== Silhouette / Logo: contour-based clean mesh =====
    // Work at higher internal resolution for better contours, then simplify heavily
    const contours = findContours(mask, nx, ny);
    if (!contours.length) return null;

    // Adaptive simplify: larger images get slightly higher eps in pixel units
    const eps = Math.max(0.8, o.simplify * (Math.max(nx, ny) / 100));
    return buildFromContours(contours, nx, ny, Wd, Hd, o.height, eps);
  }

  function img3dMesh(px, nx, ny, name, o, tex) {
    const g = img3dBuild(px, nx, ny, o);
    if (!g) return null;
    const m = new THREE.MeshStandardMaterial({
      color: tex ? 0xffffff : 0xc8ccd0,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.05
    });
    if (tex) { m.map = tex; m.userData.tex = name; }
    const mesh = new THREE.Mesh(g, m);
    mesh.name = (name || 'rasm') + '_3d';
    return mesh;
  }

  // expose
  window.img3dBuild = img3dBuild;
  window.img3dMesh = img3dMesh;

  /* ---------- Dialog UI ---------- */
  if (typeof document === 'undefined' || !document.createElement) return;

  const d = document.createElement('dialog');
  d.id = 'i3d';
  d.style.cssText = 'background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:0;max-width:94vw;width:400px;box-shadow:0 10px 30px #000c';
  d.innerHTML = `<div class="ph" style="display:flex;align-items:center"><b>Rasmdan 3D</b><span class="sp"></span><button type="button" id="i3x" title="Yopish">✕</button></div>
<div style="padding:8px 10px;display:grid;gap:7px;max-height:78vh;overflow:auto">
<label class="it" style="background:var(--ip);text-align:center">Rasm tanlash (PNG, JPG, WEBP)…<input id="i3f" type="file" accept="image/*" hidden></label>
<canvas id="i3p" width="160" height="100" style="width:100%;max-height:110px;object-fit:contain;background:#222;border-radius:4px"></canvas>
<div id="i3n" style="color:var(--mt)">Rasm tanlanmagan</div>
<label>Rejim <select id="i3m" style="width:100%">
<option value="sil" selected>Siluet / Logo — toza kontur (tavsiya)</option>
<option value="relief">Relyef — yorqinlik balandlikka</option>
</select></label>
<label class="chk"><input id="i3logo" type="checkbox" checked>Logo optimallashtirish (Otsu + tozalash)</label>
<div class="row" style="padding:0">
<label style="flex:1">Kenglik<input id="i3w" type="number" step="0.1" min="0.01" value="1" style="width:100%"></label>
<label style="flex:1">Balandlik<input id="i3h" type="number" step="0.01" min="0.001" value="0.08" style="width:100%"></label>
<label style="flex:1">Asos (relyef)<input id="i3b" type="number" step="0.01" min="0" value="0.015" style="width:100%"></label>
</div>
<label>Aniqlik: <b id="i3rv">120</b><input id="i3r" type="range" min="48" max="256" step="8" value="120" style="width:100%"></label>
<label>Kontur silliqligi: <b id="i3sv">1.2</b><input id="i3s" type="range" min="0.4" max="3" step="0.1" value="1.2" style="width:100%"></label>
<label>Siluet chegarasi: <b id="i3tv">auto</b><input id="i3t" type="range" min="1" max="254" step="1" value="128" style="width:100%"></label>
<label class="chk"><input id="i3i" type="checkbox">Teskari (yorug’ ↔ qorong’i)</label>
<label class="chk"><input id="i3c" type="checkbox" checked>Rasmni tekstura qilib qo’llash</label>
<div class="row" style="padding:0"><button type="button" id="i3g" class="pri" style="flex:1">Yaratish</button><button type="button" id="i3z" style="flex:1">Yopish</button></div>
<div id="i3i2" style="color:var(--mt);font-size:12px;line-height:1.35">
<strong>Logo uchun eng yaxshi:</strong> Siluet rejimi + Logo optimallashtirish yoqilgan. Aniqlik 100–160. Agar chekka notekis bo‘lsa — Kontur silliqligini 1.5–2.0 ga oshiring. Agar umuman chiqmasa — «Teskari»ni bosing.
</div>
</div>`;
  document.body.appendChild(d);

  const Q = s => d.querySelector(s);
  let src = null, fname = 'rasm';
  const safe = n => String(n).replace(/\.[^.]+$/, '').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24) || 'rasm';

  Q('#i3x').onclick = Q('#i3z').onclick = () => d.close();
  d.addEventListener('keydown', e => e.stopPropagation());

  Q('#i3r').oninput = () => Q('#i3rv').textContent = Q('#i3r').value;
  Q('#i3s').oninput = () => Q('#i3sv').textContent = Q('#i3s').value;
  Q('#i3t').oninput = () => Q('#i3tv').textContent = (+Q('#i3t').value === 128 ? 'auto' : Q('#i3t').value);

  Q('#i3m').onchange = () => {
    const sil = Q('#i3m').value === 'sil';
    if (sil) {
      Q('#i3r').value = 120; Q('#i3rv').textContent = '120';
      Q('#i3h').value = 0.08;
      Q('#i3logo').checked = true;
    } else {
      Q('#i3r').value = 140; Q('#i3rv').textContent = '140';
      Q('#i3h').value = 0.12;
    }
  };

  const dims = () => {
    const r = +Q('#i3r').value, A = src.w / src.h;
    return A >= 1 ? [r, Math.max(4, Math.round(r / A))] : [Math.max(4, Math.round(r * A)), r];
  };

  const grab = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    x.clearRect(0, 0, w, h);
    x.drawImage(src.bmp, 0, 0, w, h);
    return { c, x };
  };

  const pow2 = n => 1 << Math.max(5, Math.floor(Math.log2(Math.max(32, n))));

  Q('#i3f').onchange = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      let bmp;
      try { bmp = await createImageBitmap(f, { imageOrientation: 'from-image' }); }
      catch (_) { bmp = await createImageBitmap(f); }
      src = { bmp, w: bmp.width, h: bmp.height };
      fname = safe(f.name);
      const p = Q('#i3p'), px = p.getContext('2d');
      const k = Math.min(160 / src.w, 100 / src.h);
      p.width = Math.max(1, Math.round(src.w * k));
      p.height = Math.max(1, Math.round(src.h * k));
      px.drawImage(bmp, 0, 0, p.width, p.height);
      Q('#i3n').textContent = f.name + ' · ' + src.w + '×' + src.h;

      // auto-detect logo
      const tmp = grab(Math.min(80, src.w), Math.min(80, src.h));
      const data = tmp.x.getImageData(0, 0, tmp.c.width, tmp.c.height).data;
      const raw = new Float32Array(tmp.c.width * tmp.c.height);
      for (let i = 0; i < raw.length; i++) {
        raw[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
      }
      if (isLogoLike(raw, raw.length)) {
        Q('#i3m').value = 'sil';
        Q('#i3logo').checked = true;
        Q('#i3r').value = 128; Q('#i3rv').textContent = '128';
        Q('#i3n').textContent += ' · logo aniqlandi';
      }
    } catch (x) {
      src = null;
      Q('#i3n').textContent = 'Rasm ochilmadi: ' + (x.message || x);
    }
  };

  Q('#i3g').onclick = () => {
    if (!src) return toast('Avval rasm tanlang');
    try {
      const [nx, ny] = dims();
      const { x } = grab(nx, ny);
      const px = x.getImageData(0, 0, nx, ny).data;
      const o = {
        mode: Q('#i3m').value,
        width: +Q('#i3w').value || 1,
        height: +Q('#i3h').value || 0.08,
        base: +Q('#i3b').value || 0,
        invert: Q('#i3i').checked,
        blur: 1,
        thr: +Q('#i3t').value,
        logo: Q('#i3logo').checked,
        simplify: +Q('#i3s').value || 1.2
      };
      let tex = null;
      if (Q('#i3c').checked) {
        const tw = pow2(Math.min(1024, src.w)), th = pow2(Math.min(1024, src.h));
        const t = grab(tw, th);
        tex = new THREE.CanvasTexture(t.c);
        tex.name = fname;
        if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
        else tex.encoding = THREE.sRGBEncoding;
      }
      const mesh = img3dMesh(px, nx, ny, fname, o, tex);
      if (!mesh) {
        return toast('Hech narsa yaratilmadi. «Teskari»ni yoqing yoki chegarani o‘zgartiring');
      }
      mesh.userData.img3d = 1;
      add(mesh);
      fit(mesh);
      d.close();
      const tris = Math.round((mesh.geometry.index ? mesh.geometry.index.count : 0) / 3);
      toast('Yaratildi: ' + tris + ' ta uchburchak' + (tris > 20000 ? ' (aniqlikni kamaytiring)' : ''));
    } catch (x) {
      console.error(x);
      toast('Xato: ' + (x.message || x));
    }
  };

  const b = document.querySelector('#img3d');
  if (b) {
    b.onclick = () => {
      const m = document.querySelector('details.mn[open]');
      if (m) m.removeAttribute('open');
      d.showModal();
    };
  }
})();
