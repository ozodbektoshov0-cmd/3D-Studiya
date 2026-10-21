import * as THREE from 'three';

export const textures: Record<string, THREE.CanvasTexture> = {};

export const rwName = (n: any) => String(n).replace(/[^\w.-]/g, '_').slice(0, 31);

export function dxtEnc(d: Uint8ClampedArray, w: number, h: number, al: boolean): Uint8Array {
  const bs = al ? 16 : 8;
  const o = new Uint8Array((w >> 2) * (h >> 2) * bs);
  const dv = new DataView(o.buffer);
  let p = 0;
  const e = (v: number) => [(v >> 11 & 31) * 255 / 31, (v >> 5 & 63) * 255 / 63, (v & 31) * 255 / 31];

  for (let by = 0; by < h; by += 4) {
    for (let bx = 0; bx < w; bx += 4) {
      const K: number[] = [];
      for (let i = 0; i < 16; i++) {
        K.push(((by + (i >> 2)) * w + bx + (i & 3)) * 4);
      }
      const mn = [255, 255, 255];
      const mx = [0, 0, 0];
      K.forEach(k => {
        for (let j = 0; j < 3; j++) {
          const v = d[k + j];
          if (v < mn[j]) mn[j] = v;
          if (v > mx[j]) mx[j] = v;
        }
      });

      if (al) {
        for (let i = 0; i < 16; i += 2) {
          o[p + (i >> 1)] = (d[K[i] + 3] >> 4) | ((d[K[i + 1] + 3] >> 4) << 4);
        }
        p += 8;
      }

      let a = ((mx[0] >> 3) << 11) | ((mx[1] >> 2) << 5) | (mx[2] >> 3);
      let b = ((mn[0] >> 3) << 11) | ((mn[1] >> 2) << 5) | (mn[2] >> 3);
      if (a < b) {
        const t = a;
        a = b;
        b = t;
      }

      const A = e(a);
      const B = e(b);
      const pl = [
        A,
        B,
        A.map((x, i) => (2 * x + B[i]) / 3),
        A.map((x, i) => (x + 2 * B[i]) / 3),
      ];

      let bits = 0;
      if (a !== b) {
        K.forEach((k, i) => {
          let bi = 0;
          let bd = 1e9;
          for (let j = 0; j < 4; j++) {
            const q = pl[j];
            const dd = (q[0] - d[k]) ** 2 + (q[1] - d[k + 1]) ** 2 + (q[2] - d[k + 2]) ** 2;
            if (dd < bd) {
              bd = dd;
              bi = j;
            }
          }
          bits |= bi << (2 * i);
        });
      }

      dv.setUint16(p, a, true);
      dv.setUint16(p + 2, b, true);
      dv.setUint32(p + 4, bits >>> 0, true);
      p += 8;
    }
  }
  return o;
}

export function parseTxd(b: ArrayBuffer): { count: number; textures: THREE.CanvasTexture[] } {
  const v = new DataView(b);
  const u8 = (p: number) => v.getUint8(p);
  const u16 = (p: number) => v.getUint16(p, true);
  const u32 = (p: number) => v.getUint32(p, true);
  const str = (p: number, n: number) => {
    let s = '';
    for (let i = 0; i < n && u8(p + i); i++) s += String.fromCharCode(u8(p + i));
    return s;
  };

  if (u32(0) !== 0x16) throw new Error('Bu TXD emas');

  function dxt(q: number, w: number, h: number, t: number, o: Uint8ClampedArray) {
    const bs = t === 1 ? 8 : 16;
    const c5 = (c: number) => [((c >> 11) & 31) * 255 / 31, ((c >> 5) & 63) * 255 / 63, (c & 31) * 255 / 31];
    for (let y0 = 0; y0 < h; y0 += 4) {
      for (let x0 = 0; x0 < w; x0 += 4, q += bs) {
        const a = q + (t === 1 ? 0 : 8);
        const c0 = u16(a);
        const c1 = u16(a + 2);
        const A = c5(c0);
        const B = c5(c1);
        const pl = [A, B];
        const bt = u32(a + 4);
        if (c0 > c1 || t !== 1) {
          pl.push(A.map((x, i) => (2 * x + B[i]) / 3), A.map((x, i) => (x + 2 * B[i]) / 3));
        } else {
          pl.push(A.map((x, i) => (x + B[i]) / 2), [0, 0, 0]);
        }
        const lo = t === 5 ? u32(q + 2) : 0;
        const hi = t === 5 ? u16(q + 6) : 0;
        const a0 = u8(q);
        const a1 = u8(q + 1);

        for (let i = 0; i < 16; i++) {
          const x = x0 + (i & 3);
          const y = y0 + (i >> 2);
          if (x >= w || y >= h) continue;
          const ci = (bt >>> (2 * i)) & 3;
          const c = pl[ci];
          const k = (y * w + x) * 4;
          let al = 255;
          if (t === 1) {
            al = c0 <= c1 && ci === 3 ? 0 : 255;
          } else if (t === 3) {
            al = ((u8(q + (i >> 1)) >> ((i & 1) * 4)) & 15) * 17;
          } else {
            const s = i < 10
              ? (lo >>> (3 * i)) & 7
              : i === 10
              ? ((lo >>> 30) | ((hi & 1) << 2)) & 7
              : (hi >>> (3 * i - 32)) & 7;
            al = s === 0 ? a0 : s === 1 ? a1 : a0 > a1 ? ((8 - s) * a0 + (s - 1) * a1) / 7 : s < 6 ? ((6 - s) * a0 + (s - 1) * a1) / 5 : s === 6 ? 0 : 255;
          }
          o[k] = c[0];
          o[k + 1] = c[1];
          o[k + 2] = c[2];
          o[k + 3] = al;
        }
      }
    }
  }

  function nat(s: number): THREE.CanvasTexture | null {
    const plat = u32(s);
    const name = str(s + 8, 32);
    const rf = u32(s + 72);
    let q = s + 76;
    let w: number, h: number, dep: number, d: number;
    if (plat === 8) {
      q += 4;
      w = u16(q);
      h = u16(q + 2);
      dep = u8(q + 4);
      d = u8(q + 7);
      q += 8;
    } else {
      const f = u32(q);
      q += 4;
      w = u16(q);
      h = u16(q + 2);
      dep = u8(q + 4);
      d = f === 0x31545844 ? 1 : f === 0x33545844 ? 3 : f === 0x35545844 ? 5 : 0;
      q += 8;
    }
    const pal = rf & 0x2000 ? q : 0;
    if (pal) q += 1024;
    q += 4;
    const o = new Uint8ClampedArray(w * h * 4);
    if (d) {
      dxt(q, w, h, d, o);
    } else {
      for (let i = 0; i < w * h; i++) {
        let r: number, g: number, bl: number, a = 255;
        const k = i * 4;
        if (pal) {
          const x = u8(q + i) * 4;
          bl = u8(pal + x);
          g = u8(pal + x + 1);
          r = u8(pal + x + 2);
          a = u8(pal + x + 3);
        } else if (dep === 32) {
          bl = u8(q + k);
          g = u8(q + k + 1);
          r = u8(q + k + 2);
          a = u8(q + k + 3);
        } else {
          const x = u16(q + i * 2);
          const f = rf & 0xF00;
          if (f === 0x200) {
            r = ((x >> 11) & 31) * 8.22;
            g = ((x >> 5) & 63) * 4.05;
            bl = (x & 31) * 8.22;
          } else if (f === 0x300) {
            a = (x >> 12) * 17;
            r = ((x >> 8) & 15) * 17;
            g = ((x >> 4) & 15) * 17;
            bl = (x & 15) * 17;
          } else {
            a = x & 0x8000 ? 255 : 0;
            r = ((x >> 10) & 31) * 8.22;
            g = ((x >> 5) & 31) * 8.22;
            bl = (x & 31) * 8.22;
          }
        }
        o[k] = r;
        o[k + 1] = g;
        o[k + 2] = bl;
        o[k + 3] = (rf & 0xF00) === 0x600 ? 255 : a;
      }
    }
    const z = document.createElement('canvas');
    z.width = w;
    z.height = h;
    z.getContext('2d')?.putImageData(new ImageData(o, w, h), 0, 0);
    const t = new THREE.CanvasTexture(z);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.name = name;
    textures[name.toLowerCase()] = t;
    return t;
  }

  let p = 12;
  let n = 0;
  const loadedList: THREE.CanvasTexture[] = [];
  const end = Math.min(b.byteLength, 12 + u32(4));
  while (p + 12 <= end) {
    if (u32(p) === 0x15) {
      try {
        const texObj = nat(p + 24);
        if (texObj) {
          loadedList.push(texObj);
          n++;
        }
      } catch (e) {
        // skip corrupted texture
      }
    }
    p += 12 + u32(p + 4);
  }
  return { count: n, textures: loadedList };
}

export async function exportTxd(
  root: THREE.Object3D,
  maxSize: number = 1024,
  onProgress?: (text: string) => void
): Promise<Uint8Array> {
  const VER = 0x1803FFFF;
  const U = (a: number[]) => new Uint8Array(new Uint32Array(a).buffer);
  const cat = (a: Uint8Array[]) => {
    let n = 0;
    a.forEach(x => (n += x.length));
    const o = new Uint8Array(n);
    let p = 0;
    a.forEach(x => {
      o.set(x, p);
      p += x.length;
    });
    return o;
  };
  const ck = (t: number, ...a: Uint8Array[]) => {
    const d = cat(a);
    return cat([U([t, d.length, VER]), d]);
  };
  const E = () => ck(3);

  const used = new Set<string>();
  root.traverse(o => {
    if ((o as THREE.Mesh).isMesh) {
      const mats = [].concat((o as THREE.Mesh).material as any);
      mats.forEach(m => {
        const n = m.userData?.tex || (m.map && m.map.name);
        if (n) used.add(rwName(n).toLowerCase());
      });
    }
  });

  let L = Object.values(textures).filter(t => used.has(rwName(t.name).toLowerCase()));
  if (!L.length) L = Object.values(textures);
  if (!L.length) throw new Error('Tekstura yo’q: avval TXD yoki PNG oching');

  const p2 = (n: number) => Math.max(4, Math.min(maxSize, 2 ** Math.round(Math.log2(n))));
  const nat: Uint8Array[] = [];

  for (const t of L) {
    onProgress?.('TXD: ' + t.name + '…');
    await new Promise(r => setTimeout(r, 0));

    const im = t.image as HTMLCanvasElement | HTMLImageElement;
    const W = p2(im.width);
    const H = p2(im.height);
    const c = document.createElement('canvas');
    const x = c.getContext('2d', { willReadFrequently: true })!;
    const lv = Math.floor(Math.log2(Math.max(W, H))) + 1;
    const lvls: [number, number, Uint8ClampedArray][] = [];
    let al = false;

    for (let l = 0; l < lv; l++) {
      const cw = Math.max(4, W >> l);
      const ch = Math.max(4, H >> l);
      c.width = cw;
      c.height = ch;
      x.clearRect(0, 0, cw, ch);
      x.drawImage(im, 0, 0, cw, ch);
      const d = x.getImageData(0, 0, cw, ch).data;
      if (!l) {
        for (let i = 3; i < d.length; i += 4) {
          if (d[i] < 250) {
            al = true;
            break;
          }
        }
      }
      lvls.push([cw, ch, d]);
    }

    const parts = lvls.map(([cw, ch, d]) => {
      const b = dxtEnc(d, cw, ch, al);
      return [U([b.length]), b];
    }).flat();

    const n32 = new Uint8Array(32);
    const nm = rwName(t.name);
    for (let i = 0; i < nm.length; i++) n32[i] = nm.charCodeAt(i);

    nat.push(
      ck(
        0x15,
        ck(1, U([8, 0x1106]), n32, new Uint8Array(32), U([al ? 0x8300 : 0x8200, al ? 1 : 0]), new Uint8Array([W & 255, W >> 8, H & 255, H >> 8, 16, lv, 4, al ? 3 : 1]), ...parts),
        E()
      )
    );
  }

  return ck(0x16, ck(1, new Uint8Array([nat.length & 255, nat.length >> 8, 0, 0])), ...nat, E());
}

export function applyTexturesToScene(root: THREE.Object3D) {
  root.traverse(o => {
    if ((o as THREE.Mesh).isMesh) {
      const mats = [].concat((o as THREE.Mesh).material as any);
      mats.forEach(m => {
        const t = m.userData?.tex && textures[m.userData.tex.toLowerCase()];
        if (t && m.map !== t) {
          m.map = t;
          m.color.set(0xffffff);
          m.alphaTest = 0.05;
          m.needsUpdate = true;
        }
      });
    }
  });
}
