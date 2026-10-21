import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';
import { VTKLoader } from 'three/addons/loaders/VTKLoader.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';

import { parseDff } from './dff';
import { parseTxd } from './txd';
import { parseYft } from './yft';
import { parseYtd } from './ytd';
import { parseRpf, RpfArchive } from './rpf';
import { parseUsd } from './formats';
import { loadTextureImage } from './tools';

export interface LoadResult {
  type: 'object' | 'texture' | 'rpf';
  object?: THREE.Object3D;
  texture?: THREE.CanvasTexture;
  rpf?: RpfArchive;
  name: string;
}

export async function loadModelFile(f: File | Blob, originalName: string): Promise<LoadResult> {
  const ext = originalName.split('.').pop()?.toLowerCase() || '';
  const buf = ext === 'rpf' ? null : await f.slice().arrayBuffer();
  const M = () => new THREE.MeshStandardMaterial({ color: 0xb0b8c4, side: 2 });
  const modelName = originalName.replace(/\.[^.]+$/, '');

  if (ext === 'glb' || ext === 'gltf') {
    const gltfLoader = new GLTFLoader();
    const parsed = await new Promise<any>((resolve, reject) => {
      const data = ext === 'gltf' ? new TextDecoder().decode(buf!) : buf!;
      gltfLoader.parse(data, '', resolve, reject);
    });
    const o = parsed.scene;
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'obj') {
    const o = new OBJLoader().parse(new TextDecoder().decode(buf!));
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'stl') {
    const geom = new STLLoader().parse(buf!);
    const o = new THREE.Mesh(geom, M());
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'ply') {
    const geom = new PLYLoader().parse(buf!);
    geom.computeVertexNormals();
    const m = M();
    m.vertexColors = !!geom.getAttribute('color');
    const o = new THREE.Mesh(geom, m);
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'rpf') {
    const rpf = await parseRpf(f, originalName);
    return { type: 'rpf', rpf, name: modelName };
  } else if (/^(png|jpe?g|webp)$/.test(ext)) {
    const tex = await loadTextureImage(f instanceof File ? f : new File([f], originalName));
    return { type: 'texture', texture: tex, name: modelName };
  } else if (ext === 'fbx') {
    const o = new FBXLoader().parse(buf!, '');
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'dae') {
    const res = new ColladaLoader().parse(new TextDecoder().decode(buf!), '');
    const o = res.scene;
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'wrl' || ext === 'vrml') {
    const o = new VRMLLoader().parse(new TextDecoder().decode(buf!), '');
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'vtk') {
    const geom = new VTKLoader().parse(buf!, '');
    if (!geom.getAttribute('normal')) geom.computeVertexNormals();
    const o = new THREE.Mesh(geom, M());
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === '3mf') {
    const o = new ThreeMFLoader().parse(buf!);
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (/^usd[az]?$/.test(ext)) {
    const o = parseUsd(buf!);
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'max') {
    throw new Error('MAX (3ds Max) yopiq format, brauzerda o’qib bo’lmaydi — 3ds Max’dan FBX yoki DAE qilib saqlang');
  } else if (ext === 'ytd') {
    await parseYtd(f);
    return { type: 'texture', name: modelName };
  } else if (ext === 'ydr') {
    const o = await parseYft(f, true);
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'yft') {
    const o = await parseYft(f);
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'dff') {
    const o = parseDff(buf!);
    o.name = modelName;
    return { type: 'object', object: o, name: modelName };
  } else if (ext === 'txd') {
    parseTxd(buf!);
    return { type: 'texture', name: modelName };
  } else {
    throw new Error('“.' + ext + '” formati hozircha qo’llanmaydi (YTD/YFT/YDD hozircha yo’q)');
  }
}
