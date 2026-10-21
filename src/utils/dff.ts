import * as THREE from 'three';
import { rwName } from './txd';

export function mkDummy(name?: string): THREE.Mesh {
  const d = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12),
    new THREE.MeshBasicMaterial({ color: 0xffa028, wireframe: true, depthTest: false })
  );
  d.userData.dummy = true;
  d.name = name || 'dummy';
  d.renderOrder = 8;
  return d;
}

export function parseDff(b: ArrayBuffer): THREE.Group {
  const v = new DataView(b);
  const K = (p: number, e: number): [number, number, number][] => {
    const r: [number, number, number][] = [];
    while (p + 12 <= e) {
      const s = v.getUint32(p + 4, true);
      r.push([v.getUint32(p, true), p + 12, s]);
      p += 12 + s;
    }
    return r;
  };

  const str = (p: number, n: number) => {
    let s = '';
    for (let i = 0; i < n && v.getUint8(p + i); i++) s += String.fromCharCode(v.getUint8(p + i));
    return s;
  };

  const f4 = (p: number) => v.getFloat32(p, true);

  function G(d: number, e: number): [THREE.BufferGeometry, THREE.Material[]] {
    let ver = v.getUint32(d - 4, true);
    if (ver & 0xffff0000) {
      ver = ((ver >>> 14) & 0x3ff00) + ((ver >>> 16) & 0x3f) + 0x30000;
    }
    const ch = K(d, e);
    let q = ch[0][1];
    const fl = v.getUint32(q, true);
    const nt = v.getUint32(q + 4, true);
    const nv = v.getUint32(q + 8, true);
    q += 16;
    if (ver < 0x34000) q += 12;
    if (fl & 0x01000000) throw new Error('PS2 native DFF qo’llanmaydi');

    const nu = ((fl >>> 16) & 255) || (fl & 4 ? 1 : fl & 0x80 ? 2 : 0);
    if (fl & 8) q += nv * 4;

    const uv = nu ? new Float32Array(nv * 2) : null;
    for (let k = 0; k < nu; k++) {
      for (let i = 0; i < nv; i++, q += 8) {
        if (!k && uv) {
          uv[i * 2] = f4(q);
          uv[i * 2 + 1] = 1 - f4(q + 4);
        }
      }
    }

    const tri: number[][] = [];
    for (let i = 0; i < nt; i++, q += 8) {
      const m = v.getUint16(q + 4, true);
      (tri[m] = tri[m] || []).push(v.getUint16(q + 2, true), v.getUint16(q, true), v.getUint16(q + 6, true));
    }

    q += 16;
    const hv = v.getUint32(q, true);
    const hn = v.getUint32(q + 4, true);
    q += 8;

    const pos = new Float32Array(nv * 3);
    const nor = hn ? new Float32Array(nv * 3) : null;
    if (hv) {
      for (let i = 0; i < nv * 3; i++) pos[i] = f4(q + i * 4);
    }
    q += hv * nv * 12;
    if (hn) {
      for (let i = 0; i < nv * 3; i++) nor![i] = f4(q + i * 4);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (nor) g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

    let idx: number[] = [];
    tri.forEach((t, m) => {
      if (t) {
        g.addGroup(idx.length, t.length, m);
        idx = idx.concat(t);
      }
    });

    g.setIndex(idx);
    if (!nor) g.computeVertexNormals();

    const mats: THREE.MeshStandardMaterial[] = [];
    const ml = ch.find(c => c[0] === 8);
    if (ml) {
      K(ml[1], ml[1] + ml[2])
        .filter(c => c[0] === 7)
        .forEach(c => {
          const x = c[1] + 12;
          const m = new THREE.MeshStandardMaterial({
            color: new THREE.Color(v.getUint8(x + 4) / 255, v.getUint8(x + 5) / 255, v.getUint8(x + 6) / 255),
            side: 2,
          });
          const tx = K(c[1], c[1] + c[2]).find(z => z[0] === 6);
          if (tx) {
            const s = K(tx[1], tx[1] + tx[2]).find(z => z[0] === 2);
            if (s) m.name = m.userData.tex = str(s[1], s[2]);
          }
          mats.push(m);
        });
    }

    return [g, mats.length ? mats : [new THREE.MeshStandardMaterial({ color: 0xb0b8c4, side: 2 })]];
  }

  const top = K(0, b.byteLength).find(c => c[0] === 0x10);
  if (!top) throw new Error('Bu DFF fayl emas');

  const cl = K(top[1], top[1] + top[2]);
  const fl = cl.find(c => c[0] === 0x0e);
  const gl = cl.find(c => c[0] === 0x1a);
  if (!fl || !gl) throw new Error('DFF tuzilmasi tanilmadi');

  const fch = K(fl[1], fl[1] + fl[2]);
  const n = v.getUint32(fch[0][1], true);
  const base = fch[0][1] + 4;
  const names = fch.slice(1).map(c => {
    const z = K(c[1], c[1] + c[2]).find(y => y[0] === 0x253f2fe);
    return z ? str(z[1], z[2]) : '';
  });

  const F: THREE.Object3D[] = [];
  const par: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = base + i * 56;
    const o = new THREE.Object3D();
    const r = (j: number) => new THREE.Vector3(f4(p + j * 12), f4(p + j * 12 + 4), f4(p + j * 12 + 8));
    o.name = names[i] || 'frame' + i;
    o.applyMatrix4(new THREE.Matrix4().makeBasis(r(0), r(1), r(2)).setPosition(r(3)));
    F.push(o);
    par.push(v.getInt32(p + 48, true));
  }

  const out = new THREE.Group();
  F.forEach((o, i) => (par[i] >= 0 && F[par[i]] ? F[par[i]] : out).add(o));

  const geos = K(gl[1], gl[1] + gl[2])
    .filter(c => c[0] === 0xf)
    .map(c => G(c[1], c[1] + c[2]));

  cl.filter(c => c[0] === 0x14).forEach(c => {
    const s = c[1] + 12;
    const fi = v.getUint32(s, true);
    const gi = v.getUint32(s + 4, true);
    if (F[fi] && geos[gi]) {
      const m = new THREE.Mesh(geos[gi][0], geos[gi][1]);
      m.name = F[fi].name + '_mesh';
      F[fi].add(m);
    }
  });

  F.forEach((o, i) => {
    if (i && !o.children.some(c => (c as THREE.Mesh).isMesh)) {
      o.add(mkDummy(o.name));
    }
  });

  out.rotation.x = -Math.PI / 2;
  const w = new THREE.Group();
  w.add(out);
  return w;
}

export function exportDff(root: THREE.Object3D): Uint8Array {
  const VER = 0x1803ffff;
  const U = (a: number[]) => new Uint8Array(new Uint32Array(a).buffer);
  const f = (a: number[]) => new Uint8Array(new Float32Array(a).buffer);
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
  const s4 = (s: string) => {
    const o = new Uint8Array(Math.ceil((s.length + 1) / 4) * 4);
    for (let i = 0; i < s.length; i++) o[i] = s.charCodeAt(i);
    return o;
  };
  const E = () => ck(3);

  root.updateMatrixWorld(true);
  const allMeshes: THREE.Mesh[] = [];
  root.traverse(o => {
    if ((o as THREE.Mesh).isMesh) allMeshes.push(o as THREE.Mesh);
  });

  const ms = allMeshes.filter(m => m.visible && !m.userData.dummy);
  const Z = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  const names = ['root'];
  const fr = [cat([f([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]), U([-1, 0x20003])])];

  const geos = ms.map((m, mi) => {
    names.push(m.name.replace(/_mesh$/, '') || 'obj' + mi);
    const e = new THREE.Matrix4().multiplyMatrices(Z, m.matrixWorld).elements;
    fr.push(cat([f([e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10], e[12], e[13], e[14]]), U([0, 0x20003])]));

    const g = m.geometry;
    const P = g.getAttribute('position');
    const n = P.count;
    if (n > 65535) throw new Error(names[mi + 1] + ': 65535 ta uchdan ko’p');

    let N = g.getAttribute('normal');
    if (!N) {
      const c = g.clone();
      c.computeVertexNormals();
      N = c.getAttribute('normal');
    }

    const UV = g.getAttribute('uv');
    const ix = g.index ? g.index.array : null;
    const nt = (ix ? ix.length : n) / 3;
    const I = (i: number) => (ix ? ix[i] : i);

    const gr = g.groups.length ? g.groups : [{ start: 0, count: nt * 3, materialIndex: 0 }];
    const ma = [].concat(m.material as any);
    const tris: number[] = [];
    const bins: [number, number[]][] = [];

    const pos = new Float32Array(n * 3);
    const nor = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2);

    for (let i = 0; i < n; i++) {
      pos.set([P.getX(i), P.getY(i), P.getZ(i)], i * 3);
      nor.set([N.getX(i), N.getY(i), N.getZ(i)], i * 3);
      if (UV) uv.set([UV.getX(i), 1 - UV.getY(i)], i * 2);
    }

    let tn = 0;
    gr.forEach(r => {
      const k = Math.min(r.materialIndex || 0, ma.length - 1);
      const bi: number[] = [];
      for (let i = r.start; i < Math.min(r.start + r.count, nt * 3); i += 3) {
        const a = I(i);
        const b = I(i + 1);
        const c = I(i + 2);
        tris.push(b, a, k, c);
        bi.push(a, b, c);
      }
      tn += bi.length;
      bins.push([k, bi]);
    });

    g.computeBoundingSphere();
    const bs = g.boundingSphere || new THREE.Sphere();
    const fl = 0x72 | (UV ? 4 | (1 << 16) : 0);

    const st = ck(
      1,
      U([fl, tris.length / 4, n, 1]),
      UV ? f(Array.from(uv)) : new Uint8Array(0),
      new Uint8Array(new Uint16Array(tris).buffer),
      f([bs.center.x, bs.center.y, bs.center.z, bs.radius]),
      U([1, 1]),
      f(Array.from(pos)),
      f(Array.from(nor))
    );

    const ml = ck(
      8,
      ck(1, U([ma.length, ...ma.map(() => -1)])),
      ...ma.map((x: any) => {
        const t = x.userData?.tex || (x.map && x.map.name) || '';
        const c = x.color || { r: 1, g: 1, b: 1 };
        return ck(
          7,
          ck(1, U([0]), new Uint8Array([c.r * 255, c.g * 255, c.b * 255, 255]), U([0, t ? 1 : 0]), f([1, 1, 1])),
          ...(t ? [ck(6, ck(1, U([0x1106])), ck(2, s4(rwName(t))), ck(2, s4('')), E())] : []),
          E()
        );
      })
    );

    return ck(0xf, st, ml, ck(3, ck(0x50e, U([0, bins.length, tn]), ...bins.map(([k, bi]) => cat([U([bi.length, k]), U(bi)])))));
  });

  allMeshes
    .filter(m => m.userData.dummy)
    .forEach(m => {
      names.push(m.name);
      const e = new THREE.Matrix4().multiplyMatrices(Z, m.matrixWorld).elements;
      fr.push(cat([f([e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10], e[12], e[13], e[14]]), U([0, 0x20003])]));
    });

  const enc = new TextEncoder();
  return cat([
    ck(
      0x10,
      ck(1, U([ms.length, 0, 0])),
      ck(0xe, ck(1, U([fr.length]), ...fr), ...names.map(nm => ck(3, ck(0x253f2fe, enc.encode(nm))))),
      ck(0x1a, ck(1, U([geos.length])), ...geos),
      ...ms.map((_, i) => ck(0x14, ck(1, U([i + 1, i, 5, 0])), E())),
      E()
    ),
  ]);
}
