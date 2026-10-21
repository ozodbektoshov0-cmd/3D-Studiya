import * as THREE from 'three';
import { LightingPresetId, LightingPresetConfig } from '../types';

export const LIGHTING_PRESETS: Record<LightingPresetId, LightingPresetConfig> = {
  studio: {
    id: 'studio',
    name: 'Studio',
    desc: 'Neytral 3-nuqtali studiya nuri',
    icon: '💡',
    keyLight: {
      color: 0xffffff,
      intensity: 1.3,
      position: [5, 10, 7],
    },
    hemiLight: {
      skyColor: 0xffffff,
      groundColor: 0x445566,
      intensity: 1.2,
    },
    rimLight: {
      color: 0xffffff,
      intensity: 0.4,
      position: [-5, 4, -6],
    },
    bgGradient: 'linear-gradient(#3b3b3b, #4d4d4d)',
    envColors: {
      sky: [0.4, 0.55, 0.8],
      ground: [0.15, 0.14, 0.13],
    },
  },
  daylight: {
    id: 'daylight',
    name: 'Kunduzgi quyosh',
    desc: 'Yorqin quyosh va ko’k osmon',
    icon: '☀️',
    keyLight: {
      color: 0xfff4e0,
      intensity: 1.8,
      position: [12, 18, 8],
    },
    hemiLight: {
      skyColor: 0x87ceeb,
      groundColor: 0xe0d5c1,
      intensity: 0.95,
    },
    rimLight: {
      color: 0xcce5ff,
      intensity: 0.5,
      position: [-10, 6, -10],
    },
    bgGradient: 'linear-gradient(#2d3e50, #4a6984)',
    envColors: {
      sky: [0.55, 0.75, 1.0],
      ground: [0.35, 0.32, 0.28],
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Quyosh botishi',
    desc: 'Issiq oltin-binafsha shafaq',
    icon: '🌅',
    keyLight: {
      color: 0xff9147,
      intensity: 1.7,
      position: [15, 4, 10],
    },
    hemiLight: {
      skyColor: 0x83437e,
      groundColor: 0x3a2016,
      intensity: 0.85,
    },
    rimLight: {
      color: 0xffd166,
      intensity: 0.8,
      position: [-12, 3, -8],
    },
    bgGradient: 'linear-gradient(#3d2334, #623048)',
    envColors: {
      sky: [0.9, 0.45, 0.3],
      ground: [0.25, 0.12, 0.1],
    },
  },
  night: {
    id: 'night',
    name: 'Tungi rejim',
    desc: 'Sovuq oy nuri va quyuq tun',
    icon: '🌙',
    keyLight: {
      color: 0x9db4d4,
      intensity: 0.75,
      position: [-8, 12, 8],
    },
    hemiLight: {
      skyColor: 0x1a2634,
      groundColor: 0x0b0e14,
      intensity: 0.45,
    },
    rimLight: {
      color: 0x4a90e2,
      intensity: 0.6,
      position: [8, 2, -8],
    },
    bgGradient: 'linear-gradient(#15181e, #1f242d)',
    envColors: {
      sky: [0.1, 0.15, 0.25],
      ground: [0.05, 0.05, 0.08],
    },
  },
};

const envCache = new Map<string, THREE.Texture>();

export function getEnvMapForPreset(renderer: THREE.WebGLRenderer, presetId: LightingPresetId): THREE.Texture {
  if (envCache.has(presetId)) {
    return envCache.get(presetId)!;
  }

  const preset = LIGHTING_PRESETS[presetId];
  const s = new THREE.Scene();
  const g = new THREE.SphereGeometry(50, 32, 16);
  const P = g.getAttribute('position');
  const C = new Float32Array(P.count * 3);
  const sky = preset.envColors.sky;
  const gnd = preset.envColors.ground;

  for (let i = 0; i < P.count; i++) {
    const y = P.getY(i) / 50;
    const t = 1 - Math.abs(y);
    if (y > 0) {
      C.set([sky[0] * (0.8 + 0.2 * t), sky[1] * (0.8 + 0.2 * t), sky[2] * (0.8 + 0.2 * t)], i * 3);
    } else {
      C.set([gnd[0] * (0.8 + 0.2 * (1 + y)), gnd[1] * (0.8 + 0.2 * (1 + y)), gnd[2] * (0.8 + 0.2 * (1 + y))], i * 3);
    }
  }

  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: 1, vertexColors: true })));

  // Softbox panels for reflections
  const lightColor = new THREE.Color(preset.keyLight.color).multiplyScalar(preset.keyLight.intensity * 2);
  const softboxCoords = [
    [10, 8, -10],
    [-12, 6, 6],
    [0, 14, 0],
  ];

  softboxCoords.forEach(p => {
    const l = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1, 6),
      new THREE.MeshBasicMaterial({ color: lightColor })
    );
    l.position.set(p[0], p[1], p[2]);
    l.lookAt(0, 0, 0);
    s.add(l);
  });

  const texture = new THREE.PMREMGenerator(renderer).fromScene(s, 0.02).texture;
  envCache.set(presetId, texture);
  return texture;
}

export function getGradientColors(presetId: LightingPresetId): [string, string] {
  switch (presetId) {
    case 'daylight':
      return ['#2d3e50', '#4a6984'];
    case 'sunset':
      return ['#3d2334', '#623048'];
    case 'night':
      return ['#15181e', '#1f242d'];
    case 'studio':
    default:
      return ['#3b3b3b', '#4d4d4d'];
  }
}

