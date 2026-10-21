import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { PLYExporter } from 'three/addons/exporters/PLYExporter.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import { ColladaExporter } from './ColladaExporter';

import { exportDff } from './dff';
import { fbxOut, vtkOut, wrlOut, usdaOut, x3mfOut } from './formats';

export async function exportModel(
  root: THREE.Object3D,
  fmt: string,
  zup: boolean,
  name: string
): Promise<{ data: any; mime: string; ext: string }> {
  const meshes: THREE.Mesh[] = [];
  root.traverse(o => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  if (!meshes.length) throw new Error('Avval model oching');

  const r0 = root.rotation.x;
  const dm = meshes.filter(m => m.userData.dummy && fmt !== 'dff');
  dm.forEach(m => (m.visible = false));
  root.rotation.x = zup && fmt !== 'dff' ? Math.PI / 2 : 0;
  root.updateMatrixWorld(true);

  try {
    let result: { data: any; mime: string; ext: string };

    if (fmt === 'glb' || fmt === 'gltf') {
      const exporter = new GLTFExporter();
      const options = { binary: fmt === 'glb' };
      const output = await new Promise<any>((resolve, reject) => {
        exporter.parse(root, resolve, reject, options);
      });
      result = {
        data: fmt === 'glb' ? output : JSON.stringify(output),
        mime: 'model/gltf',
        ext: fmt,
      };
    } else if (fmt === 'dff') {
      result = {
        data: exportDff(root),
        mime: 'application/octet-stream',
        ext: 'dff',
      };
    } else if (fmt === 'dae') {
      const collada = new ColladaExporter().parse(root);
      result = {
        data: collada?.data || '',
        mime: 'model/vnd.collada+xml',
        ext: 'dae',
      };
    } else if (fmt === 'usdz') {
      const usdz = await new Promise<any>((resolve, reject) => {
        const exporter = new USDZExporter() as any;
        if (exporter.parse.length >= 3) {
          exporter.parse(root, resolve, reject, {});
        } else {
          Promise.resolve(exporter.parse(root, {})).then(resolve, reject);
        }
      });
      result = {
        data: usdz,
        mime: 'model/vnd.usdz+zip',
        ext: 'usdz',
      };
    } else if (fmt === 'fbx') {
      result = {
        data: fbxOut(root, zup),
        mime: 'application/octet-stream',
        ext: 'fbx',
      };
    } else if (fmt === 'vtk') {
      result = {
        data: vtkOut(root),
        mime: 'text/plain',
        ext: 'vtk',
      };
    } else if (fmt === 'wrl') {
      result = {
        data: wrlOut(root),
        mime: 'model/vrml',
        ext: 'wrl',
      };
    } else if (fmt === 'usda' || fmt === 'usd') {
      result = {
        data: usdaOut(root, zup),
        mime: 'text/plain',
        ext: fmt,
      };
    } else if (fmt === '3mf') {
      result = {
        data: x3mfOut(root),
        mime: 'model/3mf',
        ext: '3mf',
      };
    } else if (fmt === 'obj') {
      result = {
        data: new OBJExporter().parse(root),
        mime: 'text/plain',
        ext: 'obj',
      };
    } else if (fmt === 'stl') {
      result = {
        data: new STLExporter().parse(root, { binary: true }),
        mime: 'model/stl',
        ext: 'stl',
      };
    } else if (fmt === 'ply') {
      const ply = await new Promise<any>(resolve => {
        new PLYExporter().parse(root, resolve, { binary: true });
      });
      result = {
        data: ply,
        mime: 'application/octet-stream',
        ext: 'ply',
      };
    } else {
      throw new Error('Noma’lum format: ' + fmt);
    }

    return result;
  } finally {
    dm.forEach(m => (m.visible = true));
    root.rotation.x = r0;
    root.updateMatrixWorld(true);
  }
}
