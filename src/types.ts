import * as THREE from 'three';

export interface HistoryItem {
  u: () => void;
  r: () => void;
}

export interface TransformPose {
  o: THREE.Object3D;
  p: THREE.Vector3;
  q: THREE.Quaternion;
  s: THREE.Vector3;
}

export interface RpfEntry {
  path: string;
  sz: number;
  off: number;
  res: boolean;
  a: number;
  b: number;
}

export interface EditModeState {
  G: number[][];
  P: Float32Array;
  pts: THREE.Points;
  s: Set<number>;
  U: Float32Array[];
  B: Map<number, THREE.Vector3> | null;
  w: boolean;
  st: THREE.Vector3;
  v: (i: number) => THREE.Vector3;
}

export type LightingPresetId = 'studio' | 'daylight' | 'sunset' | 'night';

export interface LightingPresetConfig {
  id: LightingPresetId;
  name: string;
  desc: string;
  icon: string;
  keyLight: {
    color: number;
    intensity: number;
    position: [number, number, number];
  };
  hemiLight: {
    skyColor: number;
    groundColor: number;
    intensity: number;
  };
  rimLight: {
    color: number;
    intensity: number;
    position: [number, number, number];
  };
  bgGradient: string;
  envColors: {
    sky: [number, number, number];
    ground: [number, number, number];
  };
}

export interface ModelDimensions {
  length: number; // X axis in meters
  height: number; // Y axis in meters
  width: number;  // Z axis in meters
  volume: number; // m^3
  center: [number, number, number];
  min?: [number, number, number];
  max?: [number, number, number];
  isSelection?: boolean;
}

export interface RenderOptions {
  resolution: '1x' | '2k' | '4k';
  transparent: boolean;
  hideHelpers?: boolean;
  includeShadow?: boolean;
}
