import * as THREE from 'three';
import * as fflate from 'fflate';

export interface MeshSoup {
  name: string;
  n: number;
  p: Float64Array;
  q: Float64Array | null;
  t: Float64Array | null;
  col: [number, number, number];
  I: number[];
}

export function soup(root: THREE.Object3D): MeshSoup[] {
  root.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  root.traverse(o => {
    if ((o as THREE.Mesh).isMesh && o.visible && !o.userData.dummy) {
      meshes.push(o as THREE.Mesh);
    }
  });

  return meshes.map(m => {
    const g = m.geometry;
    const P = g.getAttribute('position');
    const N = g.getAttribute('normal');
    const U = g.getAttribute('uv');
    const n = P.count;
    const nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    const v = new THREE.Vector3();
    const p = new Float64Array(n * 3);
    const q = new Float64Array(n * 3);
    const t = new Float64Array(n * 2);
    const mat0 = [].concat(m.material as any)[0] || {};
    const c = mat0.color || { r: 0.8, g: 0.8, b: 0.8 };

    for (let i = 0; i < n; i++) {
      v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(m.matrixWorld);
      p.set([v.x, v.y, v.z], i * 3);
      if (N) {
        v.set(N.getX(i), N.getY(i), N.getZ(i)).applyMatrix3(nm).normalize();
        q.set([v.x, v.y, v.z], i * 3);
      }
      if (U) {
        t.set([U.getX(i), U.getY(i)], i * 2);
      }
    }

    return {
      name: m.name || 'mesh',
      n,
      p,
      q: N ? q : null,
      t: U ? t : null,
      col: [c.r, c.g, c.b],
      I: g.index ? Array.from(g.index.array) : Array.from({ length: n }, (_, i) => i),
    };
  });
}

const fx = (x: number) => +x.toFixed(6);
const rows = (a: ArrayLike<number>, k: number) => {
  const r: string[] = [];
  for (let i = 0; i < a.length; i += k) {
    const slice = Array.from(Array.prototype.slice.call(a, i, i + k) as number[], fx);
    r.push(slice.join(' '));
  }
  return r;
};

export function vtkOut(root: THREE.Object3D): string {
  const S = soup(root);
  let np = 0;
  const P: string[] = [];
  const F: string[] = [];
  S.forEach(s => {
    P.push(...rows(s.p, 3));
    for (let i = 0; i < s.I.length; i += 3) {
      F.push('3 ' + (s.I[i] + np) + ' ' + (s.I[i + 1] + np) + ' ' + (s.I[i + 2] + np));
    }
    np += s.n;
  });
  return (
    '# vtk DataFile Version 3.0\n3D Studiya\nASCII\nDATASET POLYDATA\nPOINTS ' +
    np +
    ' float\n' +
    P.join('\n') +
    '\nPOLYGONS ' +
    F.length +
    ' ' +
    F.length * 4 +
    '\n' +
    F.join('\n') +
    '\n'
  );
}

export function wrlOut(root: THREE.Object3D): string {
  return (
    '#VRML V2.0 utf8\n' +
    soup(root)
      .map(
        s =>
          'Shape {\n appearance Appearance { material Material { diffuseColor ' +
          s.col.map(fx).join(' ') +
          ' } }\n geometry IndexedFaceSet {\n  solid FALSE\n  coord Coordinate { point [\n' +
          rows(s.p, 3).join(',\n') +
          '\n ] }\n  coordIndex [\n' +
          Array.from({ length: s.I.length / 3 }, (_, i) => s.I[i * 3] + ',' + s.I[i * 3 + 1] + ',' + s.I[i * 3 + 2] + ',-1').join(',\n') +
          '\n ]\n' +
          (s.q ? '  normal Normal { vector [\n' + rows(s.q, 3).join(',\n') + '\n ] }\n' : '') +
          (s.t ? '  texCoord TextureCoordinate { point [\n' + rows(s.t, 2).join(',\n') + '\n ] }\n' : '') +
          ' }\n}\n'
      )
      .join('')
  );
}

export function usdaOut(root: THREE.Object3D, zup: boolean): string {
  const tup = (a: ArrayLike<number>, k: number) => rows(a, k).map(r => '(' + r.split(' ').join(', ') + ')').join(', ');
  return (
    '#usda 1.0\n(\n    defaultPrim = "Root"\n    metersPerUnit = 1\n    upAxis = "' +
    (zup ? 'Z' : 'Y') +
    '"\n)\n\ndef Xform "Root"\n{\n' +
    soup(root)
      .map(
        (s, k) =>
          '    def Mesh "' +
          (/^\d/.test(s.name) ? 'm' : '') +
          s.name.replace(/\W/g, '_') +
          '_' +
          k +
          '"\n    {\n        int[] faceVertexCounts = [' +
          Array(s.I.length / 3).fill(3).join(', ') +
          ']\n        int[] faceVertexIndices = [' +
          s.I.join(', ') +
          ']\n        point3f[] points = [' +
          tup(s.p, 3) +
          ']\n' +
          (s.q ? '        normal3f[] normals = [' + tup(s.q, 3) + '] (\n            interpolation = "vertex"\n        )\n' : '') +
          (s.t ? '        texCoord2f[] primvars:st = [' + tup(s.t, 2) + '] (\n            interpolation = "vertex"\n        )\n' : '') +
          '        color3f[] primvars:displayColor = [(' +
          s.col.map(fx).join(', ') +
          ')]\n        uniform token subdivisionScheme = "none"\n    }\n'
      )
      .join('') +
    '}\n'
  );
}

export function x3mfOut(root: THREE.Object3D): Uint8Array {
  const S = soup(root);
  const E = (s: string) => fflate.strToU8(s);
  const H = '<?xml version="1.0" encoding="UTF-8"?>';
  const objs = S.map(
    (s, k) =>
      '<object id="' +
      (k + 1) +
      '" type="model" name="' +
      s.name.replace(/[<>&"]/g, '_') +
      '"><mesh><vertices>' +
      Array.from({ length: s.n }, (_, i) => '<vertex x="' + fx(s.p[i * 3]) + '" y="' + fx(s.p[i * 3 + 1]) + '" z="' + fx(s.p[i * 3 + 2]) + '"/>').join('') +
      '</vertices><triangles>' +
      Array.from({ length: s.I.length / 3 }, (_, i) => '<triangle v1="' + s.I[i * 3] + '" v2="' + s.I[i * 3 + 1] + '" v3="' + s.I[i * 3 + 2] + '"/>').join('') +
      '</triangles></mesh></object>'
  ).join('');

  return fflate.zipSync({
    '[Content_Types].xml': E(
      H +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'
    ),
    '_rels/.rels': E(
      H +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'
    ),
    '3D/3dmodel.model': E(
      H +
        '<model unit="meter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources>' +
        objs +
        '</resources><build>' +
        S.map((_, k) => '<item objectid="' + (k + 1) + '"/>').join('') +
        '</build></model>'
    ),
  });
}

export function fbxOut(root: THREE.Object3D, zup: boolean): Uint8Array {
  const S = soup(root);
  const enc = new TextEncoder();
  const B: Uint8Array[] = [];
  let off = 0;
  const w = (u: Uint8Array) => {
    B.push(u);
    off += u.length;
  };

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

  const prim = (c: string, len: number, fn: (v: DataView) => void) => {
    const b = new Uint8Array(len + 1);
    const v = new DataView(b.buffer);
    b[0] = c.charCodeAt(0);
    fn(v);
    return b;
  };

  const i32 = (n: number) => prim('I', 4, v => v.setInt32(1, n, true));
  const i64 = (n: number) => prim('L', 8, v => v.setUint32(1, n, true));
  const dbl = (n: number) => prim('D', 8, v => v.setFloat64(1, n, true));

  const str = (s: string) => {
    const e = enc.encode(s);
    const b = new Uint8Array(5 + e.length);
    b[0] = 83;
    new DataView(b.buffer).setUint32(1, e.length, true);
    b.set(e, 5);
    return b;
  };

  const arr = (c: number, T: any, a: any) => {
    const x = new T(a);
    const b = new Uint8Array(13 + x.byteLength);
    const v = new DataView(b.buffer);
    b[0] = c;
    v.setUint32(1, x.length, true);
    v.setUint32(9, x.byteLength, true);
    b.set(new Uint8Array(x.buffer), 13);
    return b;
  };

  const N = (name: string, props: Uint8Array[], kids?: () => void) => {
    const pb = cat(props);
    const nb = enc.encode(name);
    const h = new Uint8Array(13 + nb.length);
    const hv = new DataView(h.buffer);
    hv.setUint32(4, props.length, true);
    hv.setUint32(8, pb.length, true);
    h[12] = nb.length;
    h.set(nb, 13);
    w(h);
    w(pb);
    if (kids) {
      kids();
      w(new Uint8Array(13));
    }
    hv.setUint32(0, off, true);
  };

  w(enc.encode('Kaydara FBX Binary  \0'));
  w(new Uint8Array([0x1a, 0]));
  w(new Uint8Array(new Uint32Array([7400]).buffer));

  N('FBXHeaderExtension', [], () => {
    N('FBXHeaderVersion', [i32(1003)]);
    N('FBXVersion', [i32(7400)]);
  });

  N('GlobalSettings', [], () => {
    N('Version', [i32(1000)]);
    N('Properties70', [], () => {
      [
        ['UpAxis', zup ? 2 : 1],
        ['UpAxisSign', 1],
        ['FrontAxis', zup ? 1 : 2],
        ['FrontAxisSign', zup ? -1 : 1],
        ['CoordAxis', 0],
        ['CoordAxisSign', 1],
      ].forEach(([k, v]) => N('P', [str(k as string), str('int'), str('Integer'), str(''), i32(v as number)]));
      N('P', [str('UnitScaleFactor'), str('double'), str('Number'), str(''), dbl(100)]);
    });
  });

  N('Objects', [], () =>
    S.forEach((s, k) => {
      const g = 1000 + k * 2;
      N('Geometry', [i64(g), str(s.name + '\0\x01Geometry'), str('Mesh')], () => {
        N('Vertices', [arr(100, Float64Array, s.p)]);
        N('PolygonVertexIndex', [arr(105, Int32Array, s.I.map((x, i) => (i % 3 === 2 ? ~x : x)))]);
        N('GeometryVersion', [i32(124)]);
        if (s.q) {
          N('LayerElementNormal', [i32(0)], () => {
            N('Version', [i32(101)]);
            N('Name', [str('')]);
            N('MappingInformationType', [str('ByVertice')]);
            N('ReferenceInformationType', [str('Direct')]);
            N('Normals', [arr(100, Float64Array, s.q)]);
          });
        }
        if (s.t) {
          N('LayerElementUV', [i32(0)], () => {
            N('Version', [i32(101)]);
            N('Name', [str('UVMap')]);
            N('MappingInformationType', [str('ByVertice')]);
            N('ReferenceInformationType', [str('Direct')]);
            N('UV', [arr(100, Float64Array, s.t)]);
          });
        }
        N('Layer', [i32(0)], () => {
          N('Version', [i32(100)]);
          if (s.q) {
            N('LayerElement', [], () => {
              N('Type', [str('LayerElementNormal')]);
              N('TypedIndex', [i32(0)]);
            });
          }
          if (s.t) {
            N('LayerElement', [], () => {
              N('Type', [str('LayerElementUV')]);
              N('TypedIndex', [i32(0)]);
            });
          }
        });
      });
      N('Model', [i64(g + 1), str(s.name + '\0\x01Model'), str('Mesh')], () => {
        N('Version', [i32(232)]);
      });
    })
  );

  N('Connections', [], () =>
    S.forEach((_, k) => {
      const g = 1000 + k * 2;
      N('C', [str('OO'), i64(g), i64(g + 1)]);
      N('C', [str('OO'), i64(g + 1), i64(0)]);
    })
  );

  w(new Uint8Array(13));
  w(new Uint8Array([0xfa, 0xbc, 0xab, 0x09, 0xd0, 0xc8, 0xd4, 0x66, 0xb1, 0x76, 0xfb, 0x83, 0x1c, 0xf7, 0x26, 0x7e, 0, 0, 0, 0]));
  let pad = ((off + 15) & ~15) - off;
  if (!pad) pad = 16;
  w(new Uint8Array(pad));
  w(new Uint8Array(new Uint32Array([7400]).buffer));
  w(new Uint8Array(120));
  w(new Uint8Array([0xf8, 0x5a, 0x8c, 0x6a, 0xde, 0xf5, 0xd9, 0x7e, 0xec, 0xe9, 0x0c, 0xe3, 0x75, 0x8f, 0x29, 0x0b]));
  return cat(B);
}

export function parseUsd(buf: ArrayBuffer): THREE.Group {
  const u = new Uint8Array(buf);
  const dec = (b: Uint8Array) => new TextDecoder().decode(b);
  const bad = (t: string) => {
    if (t.startsWith('PXR-USDC')) {
      throw new Error('USDC (ikkilik) hali o’qilmaydi — USDA yoki USDZ (USDA ichida) ishlating');
    }
  };
  let txt = '';
  if (u[0] === 0x50 && u[1] === 0x4b) {
    const z = fflate.unzipSync(u);
    txt = Object.keys(z)
      .filter(k => /\.usd[ac]?$/i.test(k))
      .map(k => {
        const t = dec(z[k]);
        bad(t);
        return t;
      })
      .join('\n');
  } else {
    txt = dec(u);
    bad(txt);
  }

  const out = new THREE.Group();
  txt
    .split(/\bdef Mesh\b/)
    .slice(1)
    .forEach((b, k) => {
      const g: Record<string, number[]> = {};
      const nm = (b.match(/"([^"]*)"/) || [])[1] || 'mesh' + k;
      for (const m of b.matchAll(/\[\]\s+(?:primvars:)?(\w+)\s*=\s*\[([^\]]*)\]/g)) {
        g[m[1]] = (m[2].match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || []).map(Number);
      }
      if (!g.points || !g.faceVertexIndices) return;

      const cnt = g.faceVertexCounts || Array(g.faceVertexIndices.length / 3).fill(3);
      const I: number[] = [];
      let o = 0;
      cnt.forEach(c => {
        for (let j = 1; j < c - 1; j++) {
          I.push(g.faceVertexIndices[o], g.faceVertexIndices[o + j], g.faceVertexIndices[o + j + 1]);
        }
        o += c;
      });

      const G = new THREE.BufferGeometry();
      const n = g.points.length / 3;
      G.setAttribute('position', new THREE.BufferAttribute(new Float32Array(g.points), 3));
      if (g.normals && g.normals.length === n * 3) {
        G.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(g.normals), 3));
      }
      if (g.st && g.st.length === n * 2) {
        G.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.st), 2));
      }
      G.setIndex(I);
      if (!G.getAttribute('normal')) G.computeVertexNormals();

      const me = new THREE.Mesh(G, new THREE.MeshStandardMaterial({ color: 0xb0b8c4, side: 2 }));
      me.name = nm;
      out.add(me);
    });

  if (!out.children.length) throw new Error('USD ichida mesh topilmadi');
  return out;
}
