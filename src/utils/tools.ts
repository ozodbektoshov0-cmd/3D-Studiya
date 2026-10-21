import * as THREE from 'three';
import { textures } from './txd';

export function decimate(m: THREE.Mesh, ratio: number): THREE.BufferGeometry | null {
  const g = m.geometry;
  const P = g.getAttribute('position');
  const n = P.count;
  const I = g.index ? g.index.array : Uint32Array.from({ length: n }, (_, i) => i);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  const sz = bb.getSize(new THREE.Vector3());
  const mx = Math.max(sz.x, sz.y, sz.z) || 1;
  const T = ((I.length / 3) * ratio);
  const gr = g.groups.length ? g.groups : [{ start: 0, count: I.length, materialIndex: 0 }];

  const run = (c: number) => {
    const mp = new Map<string, number>();
    const rep: number[] = [];
    const map = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const k =
        (((P.getX(i) - bb.min.x) / c) | 0) +
        ',' +
        (((P.getY(i) - bb.min.y) / c) | 0) +
        ',' +
        (((P.getZ(i) - bb.min.z) / c) | 0);
      let r = mp.get(k);
      if (r === undefined) {
        r = rep.length;
        mp.set(k, r);
        rep.push(i);
      }
      map[i] = r;
    }
    const out: number[] = [];
    const G: [number, number, number][] = [];
    gr.forEach(q => {
      const s = out.length;
      for (let i = q.start; i < q.start + q.count; i += 3) {
        const a = map[I[i]];
        const b = map[I[i + 1]];
        const d = map[I[i + 2]];
        if (a !== b && b !== d && a !== d) out.push(a, b, d);
      }
      G.push([s, out.length - s, q.materialIndex || 0]);
    });
    return { rep, out, G };
  };

  let lo = mx / 4000;
  let hi = mx / 2;
  let best = run(lo);
  for (let k = 0; k < 16; k++) {
    const c = (lo + hi) / 2;
    const r = run(c);
    if (r.out.length / 3 > T) lo = c;
    else {
      hi = c;
      best = r;
    }
  }
  if (!best.out.length) return null;

  const ng = new THREE.BufferGeometry();
  ['position', 'normal', 'uv'].forEach(nm => {
    const a = g.getAttribute(nm);
    if (!a) return;
    const s = a.itemSize;
    const f = new Float32Array(best.rep.length * s);
    best.rep.forEach((v, i) => {
      for (let c = 0; c < s; c++) {
        f[i * s + c] = [a.getX, a.getY, a.getZ][c].call(a, v);
      }
    });
    ng.setAttribute(nm, new THREE.BufferAttribute(f, s));
  });

  ng.setIndex(best.out);
  if (g.groups.length) {
    best.G.forEach(q => q[1] && ng.addGroup(q[0], q[1], q[2]));
  }
  if (!ng.getAttribute('normal')) ng.computeVertexNormals();
  return ng;
}

export function ground(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(root);
  if (b.isEmpty()) return;
  const c = b.getCenter(new THREE.Vector3());
  root.children.forEach(o => o.position.add(new THREE.Vector3(-c.x, -b.min.y, -c.z)));
}

export function autoSize(root: THREE.Object3D, value: string): { scale: number; rotated: boolean } {
  const h = value[0] === 'h';
  const T = parseFloat(h ? value.slice(1) : value);
  root.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(root);
  if (bb.isEmpty()) throw new Error('Model yo’q');

  const s = bb.getSize(new THREE.Vector3());
  const rot = !h && s.x > s.z ? Math.PI / 2 : 0;
  const k = T / (h ? s.y : Math.max(s.x, s.z));
  const Y = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromAxisAngle(Y, rot);

  root.children.forEach(o => {
    o.position.applyAxisAngle(Y, rot).multiplyScalar(k);
    o.quaternion.premultiply(q);
    o.scale.multiplyScalar(k);
  });
  ground(root);

  return { scale: k, rotated: rot !== 0 };
}

function subMesh(m: THREE.Mesh, I: ArrayLike<number>, ts: number[], mat: any, nm: string): THREE.Mesh {
  const g = m.geometry;
  const mp = new Map<number, number>();
  const idx: number[] = [];
  const at = ['position', 'normal', 'uv'].map(k => g.getAttribute(k));
  const buf: number[][] = at.map(() => []);

  ts.forEach(t => {
    for (let j = 0; j < 3; j++) {
      const v = I[t * 3 + j];
      let r = mp.get(v);
      if (r === undefined) {
        r = mp.size;
        mp.set(v, r);
        at.forEach((a, q) => {
          if (a) {
            for (let c = 0; c < a.itemSize; c++) {
              buf[q].push([a.getX, a.getY, a.getZ][c].call(a, v));
            }
          }
        });
      }
      idx.push(r);
    }
  });

  const ng = new THREE.BufferGeometry();
  at.forEach((a, q) => {
    if (a) {
      ng.setAttribute(['position', 'normal', 'uv'][q], new THREE.BufferAttribute(new Float32Array(buf[q]), a.itemSize));
    }
  });
  ng.setIndex(idx);

  const o = new THREE.Mesh(ng, mat);
  o.name = nm;
  o.position.copy(m.position);
  o.quaternion.copy(m.quaternion);
  o.scale.copy(m.scale);
  return o;
}

export function detach(m: THREE.Mesh): THREE.Mesh[] {
  const g = m.geometry;
  const P = g.getAttribute('position');
  const I = g.index ? g.index.array : Uint32Array.from({ length: P.count }, (_, i) => i);
  const nt = I.length / 3;
  const lab = new Int32Array(nt);
  const ma = [].concat(m.material as any);
  const byG = g.groups.length > 1;

  if (byG) {
    g.groups.forEach((q, k) => {
      for (let t = q.start / 3; t < (q.start + q.count) / 3; t++) lab[t] = k;
    });
  } else {
    const key = new Map<string, number>();
    const id = new Int32Array(P.count);
    for (let i = 0; i < P.count; i++) {
      const k = P.getX(i).toFixed(4) + ',' + P.getY(i).toFixed(4) + ',' + P.getZ(i).toFixed(4);
      let r = key.get(k);
      if (r === undefined) {
        r = key.size;
        key.set(k, r);
      }
      id[i] = r;
    }
    const par = Int32Array.from({ length: key.size }, (_, i) => i);
    const f = (x: number) => {
      while (par[x] !== x) x = par[x] = par[par[x]];
      return x;
    };
    const u = (a: number, b: number) => {
      par[f(a)] = f(b);
    };
    for (let t = 0; t < nt; t++) {
      u(id[I[t * 3]], id[I[t * 3 + 1]]);
      u(id[I[t * 3 + 1]], id[I[t * 3 + 2]]);
    }
    for (let t = 0; t < nt; t++) lab[t] = f(id[I[t * 3]]);
  }

  const B = new Map<number, number[]>();
  for (let t = 0; t < nt; t++) {
    let a = B.get(lab[t]);
    if (!a) B.set(lab[t], (a = []));
    a.push(t);
  }

  if (B.size < 2) throw new Error('Ajratadigan bo’lak yo’q');
  if (B.size > 300) throw new Error('Bo’laklar juda ko’p (' + B.size + ')');

  return [...B.entries()].map(([k, ts], i) =>
    subMesh(m, I, ts, byG ? ma[g.groups[k].materialIndex || 0] : ma[0], m.name + '_' + (i + 1))
  );
}

export function attach(A: THREE.Mesh, others: THREE.Mesh[]): { merged: THREE.Mesh; originalGeom: THREE.BufferGeometry; originalMat: any } {
  const Ls = [A, ...others.filter(o => o !== A)];
  A.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(A.matrixWorld).invert();
  const mats: any[] = [];
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const grp: [number, number, number][] = [];
  let vo = 0;

  Ls.forEach(m => {
    m.updateMatrixWorld(true);
    const g = m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    const P = g.getAttribute('position');
    const N = g.getAttribute('normal');
    const U = g.getAttribute('uv');
    const I = g.index ? g.index.array : Uint32Array.from({ length: P.count }, (_, i) => i);
    const mo = mats.length;
    const base = idx.length;
    const gr = g.groups.length ? g.groups : [{ start: 0, count: I.length, materialIndex: 0 }];

    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      nor.push(N.getX(i), N.getY(i), N.getZ(i));
      uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0);
    }
    gr.forEach(q => grp.push([base + q.start, q.count, mo + (q.materialIndex || 0)]));
    for (let i = 0; i < I.length; i++) idx.push(I[i] + vo);
    vo += P.count;
    mats.push(...[].concat(m.material as any));
  });

  const ng = new THREE.BufferGeometry();
  ng.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  ng.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
  ng.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
  ng.setIndex(idx);
  grp.forEach(q => ng.addGroup(q[0], q[1], q[2]));

  const og = A.geometry;
  const om = A.material;

  A.geometry = ng;
  A.material = mats;
  return { merged: A, originalGeom: og, originalMat: om };
}

const wp = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
const setW = (o: THREE.Object3D, w: THREE.Vector3) => {
  if (!o.parent) return;
  o.parent.updateWorldMatrix(true, false);
  o.position.copy(o.parent.worldToLocal(w.clone()));
};

export function swapPositions(a: THREE.Object3D, b: THREE.Object3D) {
  const wa = wp(a);
  const wb = wp(b);
  setW(a, wb);
  setW(b, wa);
}

export function moveToPosition(source: THREE.Object3D, target: THREE.Object3D) {
  setW(source, wp(target));
}

let cachedEnvMap: THREE.Texture | null = null;
export function getEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  if (cachedEnvMap) return cachedEnvMap;
  const s = new THREE.Scene();
  const g = new THREE.SphereGeometry(50, 32, 16);
  const P = g.getAttribute('position');
  const C = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) {
    const y = P.getY(i) / 50;
    const t = 1 - Math.abs(y);
    C.set(
      y > 0
        ? [0.4 + 0.4 * t, 0.55 + 0.3 * t, 0.8 + 0.2 * t]
        : [0.15 + 0.4 * (1 + y), 0.14 + 0.4 * (1 + y), 0.13 + 0.4 * (1 + y)],
      i * 3
    );
  }
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: 1, vertexColors: true })));
  [
    [10, 8, -10],
    [-12, 6, 6],
    [0, 14, 0],
  ].forEach(p => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5, 5) }));
    l.position.set(p[0], p[1], p[2]);
    l.lookAt(0, 0, 0);
    s.add(l);
  });
  cachedEnvMap = new THREE.PMREMGenerator(renderer).fromScene(s, 0.02).texture;
  return cachedEnvMap;
}

export const PRESETS: Record<string, (m: THREE.MeshStandardMaterial) => void> = {
  chrome: m => {
    m.metalness = 1;
    m.roughness = 0.04;
    m.color.set(0xf2f2f2);
  },
  paint: m => {
    m.metalness = 0.6;
    m.roughness = 0.22;
  },
  glass: m => {
    m.metalness = 0.9;
    m.roughness = 0.02;
    m.opacity = 0.35;
    m.transparent = true;
    m.color.set(0xaac4d8);
  },
  matte: m => {
    m.metalness = 0;
    m.roughness = 0.9;
  },
};

export async function loadTextureImage(f: File): Promise<THREE.CanvasTexture> {
  const b = await createImageBitmap(f);
  const c = document.createElement('canvas');
  c.width = b.width;
  c.height = b.height;
  c.getContext('2d')?.drawImage(b, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.name = f.name.replace(/\.[^.]+$/, '');
  textures[t.name.toLowerCase()] = t;
  return t;
}
