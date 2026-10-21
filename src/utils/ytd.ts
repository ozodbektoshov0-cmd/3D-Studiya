import * as THREE from 'three';
import { textures } from './txd';
import { rsz } from './yft';

export function dxtDec(a: Uint8Array, q: number, w: number, h: number, t: number): Uint8ClampedArray {
  const o = new Uint8ClampedArray(w * h * 4);
  const bs = t === 1 ? 8 : 16;
  const c5 = (c: number) => [((c >> 11) & 31) * 255 / 31, ((c >> 5) & 63) * 255 / 63, (c & 31) * 255 / 31];

  for (let y0 = 0; y0 < h; y0 += 4) {
    for (let x0 = 0; x0 < w; x0 += 4, q += bs) {
      const p = q + (t === 1 ? 0 : 8);
      const c0 = a[p] | (a[p + 1] << 8);
      const c1 = a[p + 2] | (a[p + 3] << 8);
      const A = c5(c0);
      const B = c5(c1);
      const pl = [A, B];
      const bt = (a[p + 4] | (a[p + 5] << 8) | (a[p + 6] << 16) | (a[p + 7] << 24)) >>> 0;
      if (c0 > c1 || t !== 1) {
        pl.push(A.map((x, i) => (2 * x + B[i]) / 3), A.map((x, i) => (x + 2 * B[i]) / 3));
      } else {
        pl.push(A.map((x, i) => (x + B[i]) / 2), [0, 0, 0]);
      }
      const a0 = a[q];
      const a1 = a[q + 1];
      const lo = (a[q + 2] | (a[q + 3] << 8) | (a[q + 4] << 16) | (a[q + 5] << 24)) >>> 0;
      const hi = a[q + 6] | (a[q + 7] << 8);

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
          al = ((a[q + (i >> 1)] >> ((i & 1) * 4)) & 15) * 17;
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
  return o;
}

export const bgra = (a: Uint8Array, q: number, w: number, h: number): Uint8ClampedArray => {
  const o = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    o[i * 4] = a[q + i * 4 + 2];
    o[i * 4 + 1] = a[q + i * 4 + 1];
    o[i * 4 + 2] = a[q + i * 4];
    o[i * 4 + 3] = a[q + i * 4 + 3];
  }
  return o;
};

export async function parseYtd(blob: Blob): Promise<{ ok: number; skip: number; textures: THREE.CanvasTexture[] }> {
  const hd = new DataView(await blob.slice(0, 16).arrayBuffer());
  if (hd.getUint32(0, true) !== 0x37435352) throw new Error('Bu RSC7 resurs emas');
  const sz = rsz(hd.getUint32(8, true));
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Brauzer siqilgan faylni ocholmaydi');
  }

  const raw = new Uint8Array(
    await new Response(blob.slice(16).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()
  );
  const v = new DataView(raw.buffer);
  const u32 = (o: number) => v.getUint32(o, true);
  const u16 = (o: number) => v.getUint16(o, true);
  const X = (p: number) => {
    const k = p >>> 28;
    return k === 5 ? p - 0x50000000 : k === 6 ? sz + p - 0x60000000 : -1;
  };
  const ptr = (o: number) => X(u32(o));

  const L = ptr(0x30);
  const cnt = u16(0x38);
  if (L < 0 || !cnt) throw new Error('YTD tuzilmasi tanilmadi');

  let ok = 0;
  let skip = 0;
  const list: THREE.CanvasTexture[] = [];

  for (let i = 0; i < cnt; i++) {
    await new Promise(r => setTimeout(r, 0));
    const t = ptr(L + i * 8);
    const np = t < 0 ? -1 : ptr(t + 0x28);
    if (np < 0) continue;
    let name = '';
    for (let o = np; raw[o] && name.length < 64; o++) {
      name += String.fromCharCode(raw[o]);
    }
    let w = u16(t + 0x50);
    let h = u16(t + 0x52);
    let dp = ptr(t + 0x70);
    const f = u32(t + 0x58);
    const lv = raw[t + 0x5d] || 1;
    const bs = f === 0x31545844 ? 8 : f === 0x33545844 || f === 0x35545844 ? 16 : 0;
    if ((!bs && f !== 21) || dp < 0 || dp >= raw.length) {
      skip++;
      continue;
    }
    const siz = (a: number, b: number) => (bs ? Math.max(1, (a + 3) >> 2) * Math.max(1, (b + 3) >> 2) * bs : a * b * 4);
    for (let l = 0; w > 1024 && l < lv - 1; l++) {
      dp += siz(w, h);
      w >>= 1;
      h >>= 1;
    }
    const px = bs ? dxtDec(raw, dp, w, h, (f >>> 24) & 15) : bgra(raw, dp, w, h);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d')?.putImageData(new ImageData(px as any, w, h), 0, 0);
    const T = new THREE.CanvasTexture(c);
    T.wrapS = T.wrapT = THREE.RepeatWrapping;
    T.name = name;
    textures[name.toLowerCase()] = T;
    list.push(T);
    ok++;
  }

  return { ok, skip, textures: list };
}
