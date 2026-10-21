import * as THREE from 'three';

export function rsz(f: number): number {
  const s =
    ((f >> 27) & 1) +
    (((f >> 26) & 1) << 1) +
    (((f >> 25) & 1) << 2) +
    (((f >> 24) & 1) << 3) +
    (((f >> 17) & 127) << 4) +
    (((f >> 11) & 63) << 5) +
    (((f >> 7) & 15) << 6) +
    (((f >> 5) & 3) << 7) +
    (((f >> 4) & 1) << 8);
  return (0x200 << (f & 15)) * s;
}

export async function parseYft(blob: Blob, ydr: boolean = false): Promise<THREE.Group> {
  const hd = new DataView(await blob.slice(0, 16).arrayBuffer());
  if (hd.getUint32(0, true) !== 0x37435352) throw new Error('Bu RSC7 resurs emas');
  const sz = rsz(hd.getUint32(8, true));
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Brauzer siqilgan faylni ocholmaydi');
  }

  const raw = await new Response(blob.slice(16).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
  const v = new DataView(raw);
  const u32 = (o: number) => v.getUint32(o, true);
  const u16 = (o: number) => v.getUint16(o, true);
  const f4 = (o: number) => v.getFloat32(o, true);
  const X = (p: number) => {
    const k = p >>> 28;
    return k === 5 ? p - 0x50000000 : k === 6 ? sz + p - 0x60000000 : -1;
  };
  const ptr = (o: number) => X(u32(o));
  const ok = (o: number, n: number) => o >= 0 && o + n <= raw.byteLength;

  if (!ydr && u32(0) !== 0x47415246) throw new Error('Bu fragment (YFT) emas');
  const Dr = ydr ? 0 : ptr(0x30);
  const LS = ptr(Dr + 0x50);
  const arr = ptr(LS);
  const cnt = u16(LS + 8);
  if (!ok(Dr, 0x60) || !ok(arr, cnt * 8)) throw new Error('YFT tuzilmasi tanilmadi');

  const SZ = [0, 4, 4, 8, 8, 8, 12, 16, 16, 4, 4, 4, 4, 4, 4, 4];
  const out = new THREE.Group();
  let n = 0;
  const SG = ptr(Dr + 0x10);
  const sa = SG >= 0 ? ptr(SG + 0x10) : -1;
  const sn = SG >= 0 ? u16(SG + 0x18) : 0;

  const str = (o: number) => {
    let s = '';
    while (o >= 0 && o < raw.byteLength && v.getUint8(o) && s.length < 64) {
      s += String.fromCharCode(v.getUint8(o++));
    }
    return s;
  };

  const dif = (sh: number) => {
    if (sa < 0 || sh >= sn) return '';
    const s = ptr(sa + sh * 8);
    if (s < 0) return '';
    const pp = ptr(s);
    if (pp < 0 || v.getUint8(s + 0x10) < 1 || v.getUint8(pp) !== 0) return '';
    const t = ptr(pp + 8);
    return t < 0 ? '' : str(ptr(t + 0x28));
  };

  for (let mi = 0; mi < cnt; mi++) {
    const m = ptr(arr + mi * 8);
    const ga = ptr(m + 8);
    const gc = u16(m + 0x10);
    const sm = ptr(m + 0x20);

    for (let j = 0; j < gc; j++) {
      const g = ptr(ga + j * 8);
      const vb = ptr(g + 0x18);
      const ib = ptr(g + 0x38);
      const vc = u32(vb + 0x18);
      const st = u16(vb + 8);
      const dp = ptr(vb + 0x10);
      const dc = ptr(vb + 0x30);
      const ic = u32(ib + 8);
      const ip = ptr(ib + 0x10);

      if (!ok(dp, vc * st) || !ok(ip, ic * 2) || !ok(dc, 16)) continue;
      const fl = u32(dc);
      const ty = [u32(dc + 8), u32(dc + 12)];
      const off: [number, number][] = [];
      let o = 0;
      for (let i = 0; i < 16; i++) {
        if ((fl >> i) & 1) {
          const t = (ty[i >> 3] >> (4 * (i & 7))) & 15;
          off[i] = [o, t];
          o += SZ[t];
        }
      }
      const good = o === st;
      const P = new Float32Array(vc * 3);
      const Nn = good && off[3] && off[3][1] === 6 ? new Float32Array(vc * 3) : null;
      const UV = good && off[6] && off[6][1] === 5 ? new Float32Array(vc * 2) : null;

      for (let i = 0; i < vc; i++) {
        const b = dp + i * st;
        P[i * 3] = f4(b);
        P[i * 3 + 1] = f4(b + 4);
        P[i * 3 + 2] = f4(b + 8);
        if (Nn) {
          const q = b + off[3][0];
          Nn[i * 3] = f4(q);
          Nn[i * 3 + 1] = f4(q + 4);
          Nn[i * 3 + 2] = f4(q + 8);
        }
        if (UV) {
          const q = b + off[6][0];
          UV[i * 2] = f4(q);
          UV[i * 2 + 1] = 1 - f4(q + 4);
        }
      }

      const I = new Uint16Array(raw.slice(ip, ip + ic * 2));
      for (let i = 0; i + 2 < ic; i += 3) {
        const t = I[i + 1];
        I[i + 1] = I[i + 2];
        I[i + 2] = t;
      }

      const G = new THREE.BufferGeometry();
      G.setAttribute('position', new THREE.BufferAttribute(P, 3));
      if (Nn) G.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
      if (UV) G.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
      G.setIndex(new THREE.BufferAttribute(I, 1));
      if (!Nn) G.computeVertexNormals();

      const sh = sm >= 0 ? u16(sm + j * 2) : j;
      const mt = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL((sh * 0.137) % 1, 0.3, 0.62),
        side: 2,
      });
      const tn = dif(sh);
      if (tn) {
        mt.userData.tex = mt.name = tn;
        if (/glass|tint/i.test(tn)) {
          mt.transparent = true;
          mt.opacity = 0.5;
        }
      }
      const me = new THREE.Mesh(G, mt);
      me.name = 'geom' + n++ + '_' + (tn || 'shader' + sh);
      out.add(me);
    }
  }

  if (!n) throw new Error('YFT ichida geometriya topilmadi');
  out.rotation.x = -Math.PI / 2;
  const w = new THREE.Group();
  w.add(out);
  return w;
}
