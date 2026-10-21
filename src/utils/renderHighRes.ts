import * as THREE from 'three';
import { RenderOptions } from '../types';

export async function renderHighRes(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  options: RenderOptions,
  hiddenObjects: THREE.Object3D[] = [],
  bgGradientColors?: [string, string]
): Promise<Blob> {
  const originalSize = new THREE.Vector2();
  renderer.getSize(originalSize);
  const originalPixelRatio = renderer.getPixelRatio();
  const originalAspect = camera.aspect;
  const originalClearColor = new THREE.Color();
  const originalClearAlpha = renderer.getClearAlpha();
  renderer.getClearColor(originalClearColor);

  // Determine target dimensions
  let targetWidth: number;
  let targetHeight: number;

  if (options.resolution === '4k') {
    targetWidth = 3840;
    targetHeight = 2160;
  } else if (options.resolution === '2k') {
    targetWidth = 2560;
    targetHeight = 1440;
  } else {
    targetWidth = originalSize.x * originalPixelRatio;
    targetHeight = originalSize.y * originalPixelRatio;
  }

  // Hide UI helpers during render
  const originalVisibility = hiddenObjects.map(o => o.visible);
  hiddenObjects.forEach(o => {
    o.visible = false;
  });

  try {
    // Set 1:1 pixel ratio and exact target size for the render pass
    renderer.setPixelRatio(1);
    renderer.setSize(targetWidth, targetHeight, false);
    camera.aspect = targetWidth / targetHeight;
    camera.updateProjectionMatrix();

    // Configure clear color
    renderer.setClearColor(0x000000, 0); // Always render transparent for composite

    // Render WebGL frame
    renderer.render(scene, camera);

    const webglCanvas = renderer.domElement;

    if (options.transparent || !bgGradientColors) {
      // Pure transparent PNG
      return await new Promise<Blob>((resolve, reject) => {
        webglCanvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('PNG yaratib bo’lmadi'));
        }, 'image/png');
      });
    } else {
      // Composite with background gradient at full 2K/4K resolution
      const compCanvas = document.createElement('canvas');
      compCanvas.width = targetWidth;
      compCanvas.height = targetHeight;
      const ctx = compCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context yaratib bo’lmadi');
      }

      // Draw high-resolution gradient
      const grad = ctx.createLinearGradient(0, 0, 0, targetHeight);
      grad.addColorStop(0, bgGradientColors[0]);
      grad.addColorStop(1, bgGradientColors[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw 3D scene over gradient
      ctx.drawImage(webglCanvas, 0, 0, targetWidth, targetHeight);

      return await new Promise<Blob>((resolve, reject) => {
        compCanvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('PNG yaratib bo’lmadi'));
        }, 'image/png');
      });
    }
  } finally {
    // Restore renderer and camera state
    renderer.setPixelRatio(originalPixelRatio);
    renderer.setSize(originalSize.x, originalSize.y, false);
    renderer.setClearColor(originalClearColor, originalClearAlpha);
    camera.aspect = originalAspect;
    camera.updateProjectionMatrix();

    // Restore helper visibility
    hiddenObjects.forEach((o, i) => {
      o.visible = originalVisibility[i];
    });

    // Re-render to restore viewport
    renderer.render(scene, camera);
  }
}
