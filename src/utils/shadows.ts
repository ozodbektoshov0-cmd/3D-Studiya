import * as THREE from 'three';

let cachedShadowTexture: THREE.CanvasTexture | null = null;

export function getContactShadowTexture(): THREE.CanvasTexture {
  if (cachedShadowTexture) return cachedShadowTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = 256;
    const cy = 256;
    const radius = 240;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  cachedShadowTexture = texture;
  return texture;
}

export function createContactShadowPlane(): THREE.Mesh {
  const geom = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const texture = getContactShadowTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = '__contact_shadow__';
  mesh.renderOrder = 1;
  mesh.visible = true;
  return mesh;
}

export function updateContactShadow(shadowMesh: THREE.Mesh, root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const bb = new THREE.Box3();

  // Compute bounding box of visible, non-dummy, non-shadow objects
  let hasMeshes = false;
  root.traverse(o => {
    if ((o as THREE.Mesh).isMesh && o !== shadowMesh && o.visible && !o.userData.dummy) {
      bb.expandByObject(o);
      hasMeshes = true;
    }
  });

  if (!hasMeshes || bb.isEmpty()) {
    shadowMesh.visible = false;
    return;
  }

  shadowMesh.visible = true;
  const size = bb.getSize(new THREE.Vector3());
  const center = bb.getCenter(new THREE.Vector3());

  // Place shadow slightly above ground level to avoid z-fighting with grid
  shadowMesh.position.set(center.x, bb.min.y + 0.003, center.z);

  // Scale shadow plane nicely according to model width and length
  const scaleX = Math.max(0.4, size.x * 1.35);
  const scaleZ = Math.max(0.4, size.z * 1.35);
  shadowMesh.scale.set(scaleX, 1, scaleZ);
}
