import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { HistoryItem, TransformPose, EditModeState, LightingPresetId, ModelDimensions, RenderOptions } from '../types';
import { textures, applyTexturesToScene, exportTxd } from '../utils/txd';
import { mkDummy } from '../utils/dff';
import { decimate, autoSize, ground, detach, attach, swapPositions, moveToPosition, PRESETS } from '../utils/tools';
import { LIGHTING_PRESETS, getEnvMapForPreset, getGradientColors } from '../utils/lighting';
import { createContactShadowPlane, updateContactShadow } from '../utils/shadows';
import { renderHighRes } from '../utils/renderHighRes';
import { exportModel } from '../utils/exporter';
import { loadModelFile } from '../utils/loader';
import { RpfArchive } from '../utils/rpf';

interface StudioContextType {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  root: THREE.Group;
  selectedObject: THREE.Object3D | null;
  multiSelection: Set<THREE.Object3D>;
  modelName: string;
  setModelName: (name: string) => void;
  statusText: string;
  transformMode: 'translate' | 'rotate' | 'scale';
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  wireframe: boolean;
  setWireframe: (w: boolean | ((prev: boolean) => boolean)) => void;
  gridVisible: boolean;
  snapEnabled: boolean;
  orthoMode: boolean;
  lightingPreset: LightingPresetId;
  setLightingPreset: (preset: LightingPresetId) => void;
  editMode: boolean;
  multiSelectToggle: boolean;
  textureList: THREE.CanvasTexture[];
  toastMessage: string | null;
  rpfArchive: RpfArchive | null;
  setRpfArchive: (rpf: RpfArchive | null) => void;
  select: (obj: THREE.Object3D | null) => void;
  toggleMultiSelectMesh: (obj: THREE.Object3D) => void;
  clearMultiSelect: () => void;
  fit: (obj?: THREE.Object3D) => void;
  undo: () => void;
  redo: () => void;
  duplicate: () => void;
  deleteSelected: () => void;
  addPrimitive: (name: string) => void;
  addDummyPrompt: () => void;
  centerOrigin: () => void;
  toggleSmooth: () => void;
  mirrorX: () => void;
  toggleVisibility: () => void;
  applyMaterialPreset: (preset: string, allMeshes: boolean) => void;
  runDecimateAction: (percent: number) => void;
  runAutoSizeAction: (spec: string) => void;
  runGroundAction: () => void;
  runAttachAction: () => void;
  runDetachAction: () => void;
  runSwapAction: () => void;
  runMoveToAction: () => void;
  applyTextureToSelected: (tex: THREE.CanvasTexture) => void;
  showToast: (msg: string) => void;
  loadFiles: (files: File[]) => Promise<void>;
  exportScene: (format: string, zup: boolean) => Promise<void>;
  exportTxdFile: (maxSize: number) => Promise<void>;
  renderCanvasImage: () => void;
  setCameraPreset: (dir: string) => void;
  toggleOrtho: () => void;
  toggleWireframe: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleEditMode: () => void;
  toggleMultiSelectMode: () => void;
  editUndo: () => void;
  meshesList: THREE.Mesh[];
  shadowsVisible: boolean;
  toggleShadows: () => void;
  dimensionsVisible: boolean;
  toggleDimensions: () => void;
  modelDimensions: ModelDimensions | null;
  isRenderModalOpen: boolean;
  setIsRenderModalOpen: (open: boolean) => void;
  executeRender: (options: RenderOptions) => Promise<void>;
  updateSelectedProps: (props: {
    name?: string;
    pos?: [number, number, number];
    rot?: [number, number, number];
    scale?: [number, number, number];
    color?: string;
    roughness?: number;
    metalness?: number;
    opacity?: number;
  }) => void;
}

const StudioContext = createContext<StudioContextType | null>(null);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera>(new THREE.PerspectiveCamera(50, 1, 0.01, 5000));
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitRef = useRef<OrbitControls | null>(null);
  const transformRef = useRef<TransformControls | null>(null);
  const boxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const pivotRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const rootRef = useRef<THREE.Group>(new THREE.Group());

  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [multiSelection, setMultiSelection] = useState<Set<THREE.Object3D>>(new Set());
  const [modelName, setModelName] = useState<string>('model');
  const [statusText, setStatusText] = useState<string>('Model ochilmagan.');
  const [transformMode, setTransformModeState] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(false);
  const [orthoMode, setOrthoMode] = useState<boolean>(false);
  const [lightingPreset, setLightingPresetState] = useState<LightingPresetId>('studio');
  const lightingPresetRef = useRef<LightingPresetId>('studio');
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [multiSelectToggle, setMultiSelectToggle] = useState<boolean>(false);
  const [textureList, setTextureList] = useState<THREE.CanvasTexture[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [rpfArchive, setRpfArchive] = useState<RpfArchive | null>(null);
  const [meshesList, setMeshesList] = useState<THREE.Mesh[]>([]);

  const [shadowsVisible, setShadowsVisible] = useState<boolean>(true);
  const [dimensionsVisible, setDimensionsVisible] = useState<boolean>(true);
  const [modelDimensions, setModelDimensions] = useState<ModelDimensions | null>(null);
  const [isRenderModalOpen, setIsRenderModalOpen] = useState<boolean>(false);

  const contactShadowMeshRef = useRef<THREE.Mesh | null>(null);
  const dimensionBoxHelperRef = useRef<THREE.Box3Helper | null>(null);

  const historyH = useRef<HistoryItem[]>([]);
  const historyY = useRef<HistoryItem[]>([]);
  const editStateRef = useRef<EditModeState | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const getMeshes = useCallback(() => {
    const list: THREE.Mesh[] = [];
    rootRef.current.traverse(o => {
      if ((o as THREE.Mesh).isMesh && o.name !== '__contact_shadow__') list.push(o as THREE.Mesh);
    });
    return list;
  }, []);

  const computeDimensions = useCallback(() => {
    const ms = getMeshes();
    if (ms.length === 0) {
      setModelDimensions(null);
      if (dimensionBoxHelperRef.current) dimensionBoxHelperRef.current.visible = false;
      return;
    }
    const box = new THREE.Box3();
    ms.forEach(m => {
      box.expandByObject(m);
    });
    if (box.isEmpty()) {
      setModelDimensions(null);
      if (dimensionBoxHelperRef.current) dimensionBoxHelperRef.current.visible = false;
      return;
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const volume = size.x * size.y * size.z;
    setModelDimensions({
      length: size.x,
      width: size.z,
      height: size.y,
      volume,
      center: [center.x, center.y, center.z],
      min: [box.min.x, box.min.y, box.min.z],
      max: [box.max.x, box.max.y, box.max.z],
    });
    if (dimensionBoxHelperRef.current) {
      dimensionBoxHelperRef.current.box.copy(box);
      dimensionBoxHelperRef.current.visible = dimensionsVisible;
    }
  }, [getMeshes, dimensionsVisible]);

  const toggleDimensions = useCallback(() => {
    setDimensionsVisible(prev => {
      const next = !prev;
      if (dimensionBoxHelperRef.current) {
        dimensionBoxHelperRef.current.visible = next && getMeshes().length > 0;
      }
      return next;
    });
  }, [getMeshes]);

  const toggleShadows = useCallback(() => {
    setShadowsVisible(prev => {
      const next = !prev;
      if (contactShadowMeshRef.current) {
        contactShadowMeshRef.current.visible = next;
      }
      return next;
    });
  }, []);

  const setLightingPreset = useCallback((id: LightingPresetId) => {
    lightingPresetRef.current = id;
    setLightingPresetState(id);
    const cfg = LIGHTING_PRESETS[id];
    if (keyLightRef.current) {
      keyLightRef.current.color.setHex(cfg.keyLight.color);
      keyLightRef.current.intensity = cfg.keyLight.intensity;
      keyLightRef.current.position.set(...cfg.keyLight.position);
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.setHex(cfg.hemiLight.skyColor);
      hemiLightRef.current.groundColor.setHex(cfg.hemiLight.groundColor);
      hemiLightRef.current.intensity = cfg.hemiLight.intensity;
    }
    if (rimLightRef.current) {
      rimLightRef.current.color.setHex(cfg.rimLight.color);
      rimLightRef.current.intensity = cfg.rimLight.intensity;
      rimLightRef.current.position.set(...cfg.rimLight.position);
    }
    if (rendererRef.current) {
      const env = getEnvMapForPreset(rendererRef.current, id);
      sceneRef.current.environment = env;
      getMeshes().forEach(m => {
        const mats = [].concat((m as THREE.Mesh).material as any);
        mats.forEach((mat: any) => {
          if (mat.envMap) {
            mat.envMap = env;
            mat.needsUpdate = true;
          }
        });
      });
    }
    showToast(`Yorug'lik: ${cfg.name}`);
  }, [getMeshes, showToast]);

  const refreshUI = useCallback(() => {
    applyTexturesToScene(rootRef.current);
    const ms = getMeshes();
    setMeshesList([...ms]);
    let t = 0;
    ms.forEach(m => {
      const g = m.geometry;
      const c = g.index ? g.index.count : g.getAttribute('position')?.count || 0;
      t += c / 3;
    });
    setStatusText(ms.length ? `${ms.length} ta mesh · ${Math.round(t).toLocaleString()} uchburchak` : 'Model ochilmagan.');
    setTextureList(Object.values(textures));

    if (contactShadowMeshRef.current) {
      updateContactShadow(contactShadowMeshRef.current, rootRef.current);
    }
    computeDimensions();
  }, [getMeshes, computeDimensions]);

  const addHistory = useCallback((u: () => void, r: () => void) => {
    historyH.current.push({ u, r });
    historyY.current.length = 0;
  }, []);

  const pose = (o: THREE.Object3D): TransformPose => ({
    o,
    p: o.position.clone(),
    q: o.quaternion.clone(),
    s: o.scale.clone(),
  });

  const putPose = (a: TransformPose) => {
    a.o.position.copy(a.p);
    a.o.quaternion.copy(a.q);
    a.o.scale.copy(a.s);
    refreshUI();
  };

  const select = useCallback(
    (o: THREE.Object3D | null) => {
      if (editStateRef.current) {
        // Exit edit mode if selection changes
        exitEditModeInternal();
      }
      setSelectedObject(o);
      if (transformRef.current) {
        if (o) {
          transformRef.current.attach(o);
        } else {
          transformRef.current.detach();
        }
      }
      refreshUI();
    },
    [refreshUI]
  );

  const toggleMultiSelectMesh = useCallback((m: THREE.Object3D) => {
    setMultiSelection(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }, []);

  const clearMultiSelect = useCallback(() => {
    setMultiSelection(new Set());
  }, []);

  const fit = useCallback(
    (o?: THREE.Object3D) => {
      const targetObj = o || rootRef.current;
      const b = new THREE.Box3().setFromObject(targetObj);
      if (b.isEmpty()) return;
      const c = b.getCenter(new THREE.Vector3());
      const d = b.getSize(new THREE.Vector3()).length() || 1;
      const ctl = orbitRef.current;
      const cam = cameraRef.current;
      if (!ctl || !cam) return;

      ctl.target.copy(c);
      cam.position.copy(c).add(new THREE.Vector3(0.8, 0.6, 1).normalize().multiplyScalar(d * 1.3));
      cam.near = d / 500;
      cam.far = d * 50;
      cam.updateProjectionMatrix();
    },
    []
  );

  const toggleOrtho = useCallback(() => {
    const cam = cameraRef.current;
    const ctl = orbitRef.current;
    if (!cam || !ctl) return;
    const T = Math.tan((25 * Math.PI) / 180) / Math.tan(Math.PI / 180);
    setOrthoMode(prev => {
      const next = !prev;
      cam.position.sub(ctl.target).multiplyScalar(next ? T : 1 / T).add(ctl.target);
      cam.fov = next ? 2 : 50;
      cam.far = next ? 1e5 : 5000;
      cam.updateProjectionMatrix();
      return next;
    });
  }, []);

  const setCameraPreset = useCallback((dir: string) => {
    const cam = cameraRef.current;
    const ctl = orbitRef.current;
    if (!cam || !ctl) return;
    const coords = dir.split(',').map(Number);
    const v = new THREE.Vector3(coords[0], coords[1], coords[2]).normalize();
    const d = cam.position.distanceTo(ctl.target);
    cam.position.copy(ctl.target).addScaledVector(v, d);
  }, []);

  const undo = useCallback(() => {
    const a = historyH.current.pop();
    if (a) {
      a.u();
      historyY.current.push(a);
      refreshUI();
    }
  }, [refreshUI]);

  const redo = useCallback(() => {
    const a = historyY.current.pop();
    if (a) {
      a.r();
      historyH.current.push(a);
      refreshUI();
    }
  }, [refreshUI]);

  const duplicate = useCallback(() => {
    if (!selectedObject) return;
    const d = selectedObject.clone(true);
    const M = (selectedObject as THREE.Mesh).material;
    if (M) {
      (d as THREE.Mesh).material = Array.isArray(M) ? M.map(x => x.clone()) : (M as THREE.Material).clone();
    }
    d.name = (selectedObject.name || 'object') + '.001';
    d.position.x += 0.3;
    const parent = selectedObject.parent || rootRef.current;
    parent.add(d);
    addHistory(
      () => {
        if (selectedObject === d) select(null);
        parent.remove(d);
      },
      () => parent.add(d)
    );
    select(d);
    refreshUI();
  }, [selectedObject, addHistory, select, refreshUI]);

  const deleteSelected = useCallback(() => {
    if (!selectedObject) return;
    const o = selectedObject;
    const p = o.parent || rootRef.current;
    select(null);
    p.remove(o);
    addHistory(
      () => p.add(o),
      () => p.remove(o)
    );
    refreshUI();
  }, [selectedObject, select, addHistory, refreshUI]);

  const addPrimitive = useCallback(
    (name: string) => {
      let g: THREE.BufferGeometry;
      if (name === 'Kub') g = new THREE.BoxGeometry(1, 1, 1);
      else if (name === 'Shar') g = new THREE.SphereGeometry(0.6, 32, 16);
      else if (name === 'Silindr') g = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
      else if (name === 'Konus') g = new THREE.ConeGeometry(0.5, 1, 32);
      else if (name === 'Halqa') g = new THREE.TorusGeometry(0.5, 0.2, 16, 48);
      else if (name === 'Tekislik') g = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
      else return;

      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xcccccc, side: 2 }));
      m.name = name;
      rootRef.current.add(m);
      addHistory(
        () => {
          if (selectedObject === m) select(null);
          rootRef.current.remove(m);
        },
        () => rootRef.current.add(m)
      );
      select(m);
      refreshUI();
    },
    [addHistory, select, selectedObject, refreshUI]
  );

  const addDummyPrompt = useCallback(() => {
    const n = prompt('Dummy nomi (masalan wheel_lf_dummy)', 'dummy');
    if (!n) return;
    const d = mkDummy(n);
    if (selectedObject) {
      new THREE.Box3().setFromObject(selectedObject).getCenter(d.position);
    }
    rootRef.current.add(d);
    addHistory(
      () => {
        if (selectedObject === d) select(null);
        rootRef.current.remove(d);
      },
      () => rootRef.current.add(d)
    );
    select(d);
    refreshUI();
  }, [selectedObject, addHistory, select, refreshUI]);

  const centerOrigin = useCallback(() => {
    if (!selectedObject || !(selectedObject as THREE.Mesh).geometry) return;
    const m = selectedObject as THREE.Mesh;
    const g = m.geometry;
    g.computeBoundingBox();
    const c = g.boundingBox!.getCenter(new THREE.Vector3());
    g.translate(-c.x, -c.y, -c.z);
    m.position.add(c.multiply(m.scale).applyQuaternion(m.quaternion));
    refreshUI();
  }, [selectedObject, refreshUI]);

  const toggleSmooth = useCallback(() => {
    if (!selectedObject) return;
    const mats = [].concat((selectedObject as THREE.Mesh).material as any);
    mats.forEach((m: any) => {
      m.flatShading = !m.flatShading;
      m.needsUpdate = true;
    });
  }, [selectedObject]);

  const mirrorX = useCallback(() => {
    if (!selectedObject) return;
    const a = pose(selectedObject);
    selectedObject.scale.x *= -1;
    const b = pose(selectedObject);
    addHistory(
      () => putPose(a),
      () => putPose(b)
    );
    refreshUI();
  }, [selectedObject, addHistory, refreshUI]);

  const toggleVisibility = useCallback(() => {
    if (!selectedObject) return;
    selectedObject.visible = !selectedObject.visible;
    refreshUI();
  }, [selectedObject, refreshUI]);

  const applyMaterialPreset = useCallback(
    (preset: string, allMeshes: boolean) => {
      const list = allMeshes
        ? getMeshes().filter(o => !o.userData.dummy)
        : [selectedObject as THREE.Mesh].filter(o => o && o.isMesh && !o.userData.dummy);
      if (!list.length) return showToast('Mesh tanlang');

      const renderer = rendererRef.current;
      const envMap = renderer ? getEnvMapForPreset(renderer, lightingPresetRef.current) : null;
      list.forEach(o => {
        const mats = [].concat(o.material as any);
        mats.forEach((m: any) => {
          if (!m.isMeshStandardMaterial) return;
          PRESETS[preset]?.(m);
          m.envMap = preset === 'matte' ? null : envMap;
          m.envMapIntensity = 1;
          m.needsUpdate = true;
        });
      });
      refreshUI();
    },
    [getMeshes, selectedObject, showToast, refreshUI]
  );

  const runDecimateAction = useCallback(
    (percent: number) => {
      const activeMeshes = multiSelection.size
        ? Array.from(multiSelection).filter((o: any) => o.isMesh && !o.userData.dummy)
        : selectedObject && (selectedObject as any).isMesh && !selectedObject.userData.dummy
        ? [selectedObject as THREE.Mesh]
        : getMeshes().filter(o => !o.userData.dummy);

      if (!activeMeshes.length) return showToast('Mesh yo’q');
      const r = Math.min(0.95, Math.max(0.05, percent / 100));
      const jobs: [THREE.Mesh, THREE.BufferGeometry, THREE.BufferGeometry][] = [];
      let a = 0;
      let b = 0;

      (activeMeshes as THREE.Mesh[]).forEach(m => {
        const g = m.geometry;
        const ng = decimate(m, r);
        if (ng) {
          a += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
          b += ng.index!.count / 3;
          jobs.push([m, g, ng]);
          m.geometry = ng;
        }
      });

      addHistory(
        () => jobs.forEach(([m, g]) => (m.geometry = g)),
        () => jobs.forEach(([m, , ng]) => (m.geometry = ng))
      );
      refreshUI();
      showToast(`${Math.round(a)} → ${Math.round(b)} uchburchak`);
    },
    [multiSelection, selectedObject, getMeshes, showToast, addHistory, refreshUI]
  );

  const runAutoSizeAction = useCallback(
    (spec: string) => {
      try {
        const ch = [...rootRef.current.children];
        const a = ch.map(pose);
        const res = autoSize(rootRef.current, spec);
        const z = ch.map(pose);
        addHistory(
          () => a.forEach(putPose),
          () => z.forEach(putPose)
        );
        fit();
        refreshUI();
        showToast(`Masshtab ×${res.scale.toFixed(3)}${res.rotated ? ' · uzun o’q Z ga burildi' : ''}`);
      } catch (e: any) {
        showToast(e.message || String(e));
      }
    },
    [addHistory, fit, refreshUI, showToast]
  );

  const runGroundAction = useCallback(() => {
    if (!rootRef.current.children.length) return showToast('Model yo’q');
    const ch = [...rootRef.current.children];
    const a = ch.map(pose);
    ground(rootRef.current);
    const z = ch.map(pose);
    addHistory(
      () => a.forEach(putPose),
      () => z.forEach(putPose)
    );
    fit();
    refreshUI();
    showToast('Yerga qo’yildi va markazlandi');
  }, [showToast, addHistory, fit, refreshUI]);

  const runDetachAction = useCallback(() => {
    const m = selectedObject as THREE.Mesh;
    if (!m || !m.isMesh || m.userData.dummy) return showToast('Mesh tanlang');
    try {
      const parts = detach(m);
      const p = m.parent || rootRef.current;
      select(null);
      p.remove(m);
      parts.forEach(x => p.add(x));
      addHistory(
        () => {
          parts.forEach(x => p.remove(x));
          p.add(m);
        },
        () => {
          p.remove(m);
          parts.forEach(x => p.add(x));
        }
      );
      select(parts[0]);
      refreshUI();
      showToast(`${parts.length} ta bo’lakka ajratildi`);
    } catch (e: any) {
      showToast(e.message || String(e));
    }
  }, [selectedObject, showToast, select, addHistory, refreshUI]);

  const runAttachAction = useCallback(() => {
    const active = Array.from(new Set([...Array.from(multiSelection), ...(selectedObject ? [selectedObject] : [])])).filter(
      (o: any) => o.isMesh && !o.userData.dummy
    ) as THREE.Mesh[];

    if (active.length < 2 || !selectedObject || !active.includes(selectedObject as THREE.Mesh)) {
      return showToast('Attach: Outliner’da Ctrl/Shift bilan 2+ mesh tanlang');
    }

    try {
      const A = selectedObject as THREE.Mesh;
      const others = active.filter(o => o !== A);
      const rem = others.map(o => [o, o.parent || rootRef.current] as [THREE.Mesh, THREE.Object3D]);
      const res = attach(A, others);
      rem.forEach(([o, p]) => p.remove(o));
      clearMultiSelect();

      addHistory(
        () => {
          A.geometry = res.originalGeom;
          A.material = res.originalMat;
          rem.forEach(([o, p]) => p.add(o));
        },
        () => {
          A.geometry = res.merged.geometry;
          A.material = res.merged.material;
          rem.forEach(([o, p]) => p.remove(o));
        }
      );

      select(A);
      refreshUI();
      showToast(`${active.length} ta mesh birlashtirildi`);
    } catch (e: any) {
      showToast(e.message || String(e));
    }
  }, [multiSelection, selectedObject, showToast, clearMultiSelect, addHistory, select, refreshUI]);

  const runSwapAction = useCallback(() => {
    const active = Array.from(new Set([...Array.from(multiSelection), ...(selectedObject ? [selectedObject] : [])]));
    if (active.length !== 2) return showToast('Outliner’da aynan 2 ta obyekt tanlang (Ctrl/Shift)');
    const [a, b] = active;
    const pA = pose(a);
    const pB = pose(b);
    swapPositions(a, b);
    const nA = pose(a);
    const nB = pose(b);
    addHistory(
      () => {
        putPose(pA);
        putPose(pB);
      },
      () => {
        putPose(nA);
        putPose(nB);
      }
    );
    refreshUI();
  }, [multiSelection, selectedObject, showToast, addHistory, refreshUI]);

  const runMoveToAction = useCallback(() => {
    const active = Array.from(new Set([...Array.from(multiSelection), ...(selectedObject ? [selectedObject] : [])]));
    if (active.length !== 2) return showToast('Outliner’da aynan 2 ta obyekt tanlang (Ctrl/Shift)');
    const t = active[0] === selectedObject ? active[0] : active[1];
    const target = t === active[0] ? active[1] : active[0];
    const pT = pose(t);
    moveToPosition(t, target);
    const nT = pose(t);
    addHistory(
      () => putPose(pT),
      () => putPose(nT)
    );
    refreshUI();
  }, [multiSelection, selectedObject, showToast, addHistory, refreshUI]);

  const applyTextureToSelected = useCallback(
    (t: THREE.CanvasTexture) => {
      const active = Array.from(new Set([...Array.from(multiSelection), ...(selectedObject ? [selectedObject] : [])])).filter(
        (o: any) => o.isMesh
      ) as THREE.Mesh[];

      if (!active.length) return showToast('Avval mesh tanlang');
      active.forEach(o => {
        if (!o.geometry.getAttribute('uv')) showToast(`${o.name}: UV yo’q`);
        const mats = [].concat(o.material as any);
        mats.forEach((m: any) => {
          m.map = t;
          m.color.set(0xffffff);
          m.userData.tex = t.name;
          m.needsUpdate = true;
        });
      });
      refreshUI();
      showToast(`Tekstura qo’yildi: ${t.name}`);
    },
    [multiSelection, selectedObject, showToast, refreshUI]
  );

  const loadFiles = useCallback(
    async (files: File[]) => {
      for (const f of files) {
        try {
          const res = await loadModelFile(f, f.name);
          if (res.type === 'object' && res.object) {
            rootRef.current.add(res.object);
            setModelName(res.name);
            select(res.object);
            fit(res.object);
            refreshUI();
          } else if (res.type === 'texture') {
            refreshUI();
            showToast(`Tekstura yuklandi: ${f.name}`);
          } else if (res.type === 'rpf' && res.rpf) {
            setRpfArchive(res.rpf);
          }
        } catch (e: any) {
          showToast(`${f.name}: ${e.message || String(e)}`);
        }
      }
    },
    [select, fit, refreshUI, showToast]
  );

  const exportScene = useCallback(
    async (format: string, zup: boolean) => {
      try {
        const { data, mime, ext } = await exportModel(rootRef.current, format, zup, modelName);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([data], { type: mime }));
        a.download = `${modelName}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        showToast(`${format.toUpperCase()} tayyor`);
      } catch (e: any) {
        showToast(`Xato: ${e.message || String(e)}`);
      }
    },
    [modelName, showToast]
  );

  const exportTxdFile = useCallback(
    async (maxSize: number) => {
      try {
        const b = await exportTxd(rootRef.current, maxSize, msg => showToast(msg));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([b as any], { type: 'application/octet-stream' }));
        a.download = `${modelName}.txd`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        showToast('TXD tayyor');
      } catch (e: any) {
        showToast(e.message || String(e));
      }
    },
    [modelName, showToast]
  );

  const renderCanvasImage = useCallback(() => {
    setIsRenderModalOpen(true);
  }, []);

  const executeRender = useCallback(
    async (options: RenderOptions) => {
      const r = rendererRef.current;
      const cv = canvasRef.current;
      if (!r || !cv) return;

      const hiddenObjects: THREE.Object3D[] = [];
      if (options.hideHelpers) {
        if (gridHelperRef.current) hiddenObjects.push(gridHelperRef.current);
        if (axesHelperRef.current) hiddenObjects.push(axesHelperRef.current);
        if (boxHelperRef.current) hiddenObjects.push(boxHelperRef.current);
        if (dimensionBoxHelperRef.current) hiddenObjects.push(dimensionBoxHelperRef.current);
        if (transformRef.current) {
          const tcHelper = (transformRef.current as any).getHelper
            ? (transformRef.current as any).getHelper()
            : transformRef.current;
          if (tcHelper) hiddenObjects.push(tcHelper);
        }
      }
      if (options.includeShadow === false && contactShadowMeshRef.current) {
        hiddenObjects.push(contactShadowMeshRef.current);
      }

      const grad = getGradientColors(lightingPresetRef.current);

      try {
        const blob = await renderHighRes(
          r,
          sceneRef.current,
          cameraRef.current,
          options,
          hiddenObjects,
          grad
        );

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${modelName || 'model'}_${options.resolution}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        showToast(`Render tayyor: ${options.resolution.toUpperCase()} PNG`);
      } catch (err: any) {
        console.error('Render error:', err);
        showToast('Render jarayonida xatolik yuz berdi');
      }
    },
    [modelName, showToast]
  );

  const toggleWireframe = useCallback(() => {
    setWireframe(prev => {
      const next = !prev;
      getMeshes().forEach(m => {
        const mats = [].concat(m.material as any);
        mats.forEach((x: any) => (x.wireframe = next));
      });
      return next;
    });
  }, [getMeshes]);

  const toggleGrid = useCallback(() => {
    setGridVisible(prev => {
      const next = !prev;
      if (gridHelperRef.current) gridHelperRef.current.visible = next;
      if (axesHelperRef.current) axesHelperRef.current.visible = next;
      return next;
    });
  }, []);

  const toggleSnap = useCallback(() => {
    setSnapEnabled(prev => {
      const next = !prev;
      if (transformRef.current) {
        transformRef.current.setTranslationSnap(next ? 0.5 : null);
        transformRef.current.setRotationSnap(next ? Math.PI / 12 : null);
        transformRef.current.setScaleSnap(next ? 0.1 : null);
      }
      return next;
    });
  }, []);

  const setTransformMode = useCallback((m: 'translate' | 'rotate' | 'scale') => {
    setTransformModeState(m);
    if (transformRef.current) {
      transformRef.current.setMode(m);
    }
  }, []);

  const paintVertices = useCallback(() => {
    const em = editStateRef.current;
    if (!em) return;
    const C = em.pts.geometry.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i < em.G.length; i++) {
      const o = em.s.has(i);
      C.setXYZ(i, 1, o ? 0.63 : 0.85, o ? 0.12 : 0.85);
    }
    C.needsUpdate = true;

    const tc = transformRef.current;
    if (!em.s.size) {
      em.B = null;
      if (tc) tc.detach();
      return;
    }

    const c = new THREE.Vector3();
    em.s.forEach(i => c.add(em.v(i)));
    c.divideScalar(em.s.size);

    if (selectedObject) {
      pivotRef.current.position.copy(selectedObject.localToWorld(c));
    }
    em.st = pivotRef.current.position.clone();
    em.B = new Map([...em.s].map(i => [i, em.v(i)]));
    if (tc) {
      tc.attach(pivotRef.current);
      tc.setMode('translate');
    }
  }, [selectedObject]);

  const enterEditMode = useCallback(() => {
    if (editStateRef.current) return;
    if (!selectedObject || !(selectedObject as THREE.Mesh).geometry) {
      return showToast('Avval mesh tanlang');
    }
    const mesh = selectedObject as THREE.Mesh;
    const A = mesh.geometry.getAttribute('position');
    const mp = new Map<string, number[]>();
    for (let i = 0; i < A.count; i++) {
      const k = A.getX(i).toFixed(5) + ',' + A.getY(i).toFixed(5) + ',' + A.getZ(i).toFixed(5);
      (mp.get(k) || mp.set(k, []).get(k)!).push(i);
    }
    const G = [...mp.values()];
    if (G.length > 20000) return showToast('Mesh juda katta (20 000 nuqtagacha)');

    const P = new Float32Array(G.length * 3);
    G.forEach((ix, i) => P.set([A.getX(ix[0]), A.getY(ix[0]), A.getZ(ix[0])], i * 3));
    const gm = new THREE.BufferGeometry()
      .setAttribute('position', new THREE.BufferAttribute(P, 3))
      .setAttribute('color', new THREE.BufferAttribute(new Float32Array(G.length * 3), 3));
    const pts = new THREE.Points(
      gm,
      new THREE.PointsMaterial({ size: 6, sizeAttenuation: false, vertexColors: true, depthTest: false })
    );
    pts.renderOrder = 9;
    pts.frustumCulled = false;
    mesh.add(pts);

    editStateRef.current = {
      G,
      P,
      pts,
      s: new Set(),
      U: [],
      B: null,
      w: !wireframe,
      st: new THREE.Vector3(),
      v: i => new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]),
    };

    if (!wireframe) toggleWireframe();
    setEditMode(true);
    paintVertices();
    showToast('Edit mode: nuqtani bosing (Esc yoki Tab — chiqish)');
  }, [selectedObject, showToast, wireframe, toggleWireframe, paintVertices]);

  const exitEditModeInternal = useCallback(() => {
    const e = editStateRef.current;
    if (!e) return;
    editStateRef.current = null;
    if (selectedObject) {
      selectedObject.remove(e.pts);
      if (transformRef.current) transformRef.current.attach(selectedObject);
    }
    e.pts.geometry.dispose();
    setEditMode(false);
    if (e.w && wireframe) toggleWireframe();
  }, [selectedObject, wireframe, toggleWireframe]);

  const toggleEditMode = useCallback(() => {
    if (editStateRef.current) exitEditModeInternal();
    else enterEditMode();
  }, [enterEditMode, exitEditModeInternal]);

  const toggleMultiSelectMode = useCallback(() => {
    setMultiSelectToggle(prev => !prev);
  }, []);

  const editUndo = useCallback(() => {
    const em = editStateRef.current;
    if (!em || !selectedObject) return;
    const s = em.U.pop();
    if (!s) return;
    const g = (selectedObject as THREE.Mesh).geometry;
    const A = g.getAttribute('position') as THREE.BufferAttribute;
    (A.array as Float32Array).set(s);
    A.needsUpdate = true;
    em.G.forEach((ix, i) => {
      const k = ix[0] * 3;
      em.P.set([s[k], s[k + 1], s[k + 2]], i * 3);
    });
    (em.pts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    g.computeVertexNormals();
    paintVertices();
  }, [selectedObject, paintVertices]);

  const updateSelectedProps = useCallback(
    (props: {
      name?: string;
      pos?: [number, number, number];
      rot?: [number, number, number];
      scale?: [number, number, number];
      color?: string;
      roughness?: number;
      metalness?: number;
      opacity?: number;
    }) => {
      if (!selectedObject) return;
      if (props.name !== undefined) {
        selectedObject.name = props.name;
        refreshUI();
      }
      if (props.pos) {
        const a = pose(selectedObject);
        selectedObject.position.set(...props.pos);
        const b = pose(selectedObject);
        addHistory(
          () => putPose(a),
          () => putPose(b)
        );
        refreshUI();
      }
      if (props.rot) {
        const a = pose(selectedObject);
        selectedObject.rotation.set(...props.rot.map(x => (x * Math.PI) / 180) as [number, number, number]);
        const b = pose(selectedObject);
        addHistory(
          () => putPose(a),
          () => putPose(b)
        );
        refreshUI();
      }
      if (props.scale) {
        const a = pose(selectedObject);
        selectedObject.scale.set(...props.scale);
        const b = pose(selectedObject);
        addHistory(
          () => putPose(a),
          () => putPose(b)
        );
        refreshUI();
      }
      const mats = [].concat((selectedObject as THREE.Mesh).material as any);
      mats.forEach((m: any) => {
        if (props.color && m.color) m.color.set(props.color);
        if (props.roughness !== undefined && m.roughness !== undefined) m.roughness = props.roughness;
        if (props.metalness !== undefined && m.metalness !== undefined) m.metalness = props.metalness;
        if (props.opacity !== undefined && m.opacity !== undefined) {
          m.opacity = props.opacity;
          m.transparent = props.opacity < 1;
        }
      });
      refreshUI();
    },
    [selectedObject, addHistory, refreshUI]
  );

  // Initialize Three.js scene and viewport
  useEffect(() => {
    const cv = canvasRef.current;
    const vp = containerRef.current;
    if (!cv || !vp) return;

    const S = sceneRef.current;
    const cam = cameraRef.current;
    cam.position.set(4, 3, 5);

    const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = R;

    const initialPreset = LIGHTING_PRESETS[lightingPresetRef.current];
    const hemi = new THREE.HemisphereLight(
      initialPreset.hemiLight.skyColor,
      initialPreset.hemiLight.groundColor,
      initialPreset.hemiLight.intensity
    );
    hemiLightRef.current = hemi;
    S.add(hemi);

    const dl = new THREE.DirectionalLight(initialPreset.keyLight.color, initialPreset.keyLight.intensity);
    dl.position.set(...initialPreset.keyLight.position);
    keyLightRef.current = dl;
    S.add(dl);

    const rim = new THREE.DirectionalLight(initialPreset.rimLight.color, initialPreset.rimLight.intensity);
    rim.position.set(...initialPreset.rimLight.position);
    rimLightRef.current = rim;
    S.add(rim);

    S.environment = getEnvMapForPreset(R, lightingPresetRef.current);

    const grid = new THREE.GridHelper(20, 20, 0x6a6a6a, 0x4f4f4f);
    const axs = new THREE.AxesHelper(10);
    gridHelperRef.current = grid;
    axesHelperRef.current = axs;
    S.add(grid, axs);

    const shadowMesh = createContactShadowPlane();
    contactShadowMeshRef.current = shadowMesh;
    shadowMesh.visible = shadowsVisible;
    S.add(shadowMesh);

    const dimBox = new THREE.Box3();
    const dimHelper = new THREE.Box3Helper(dimBox, 0x4772b3);
    dimHelper.visible = dimensionsVisible;
    dimensionBoxHelperRef.current = dimHelper;
    S.add(dimHelper);

    const bh = new THREE.BoxHelper(new THREE.Object3D(), 0xffa028);
    boxHelperRef.current = bh;
    S.add(bh);

    const pv = pivotRef.current;
    S.add(pv);

    const ctl = new OrbitControls(cam, cv);
    ctl.enableDamping = true;
    orbitRef.current = ctl;

    const tc = new TransformControls(cam, cv);
    transformRef.current = tc;
    S.add((tc as any).getHelper ? (tc as any).getHelper() : tc);

    tc.addEventListener('dragging-changed', e => {
      ctl.enabled = !e.value;
    });

    let p0: TransformPose | null = null;
    tc.addEventListener('mouseDown', () => {
      if (!editStateRef.current && selectedObject) {
        p0 = pose(selectedObject);
      } else if (editStateRef.current && selectedObject) {
        const g = (selectedObject as THREE.Mesh).geometry;
        const A = g.getAttribute('position');
        editStateRef.current.U.push((A.array as Float32Array).slice());
      }
    });

    tc.addEventListener('mouseUp', () => {
      if (p0 && selectedObject === p0.o) {
        const a = p0;
        const b = pose(selectedObject);
        addHistory(
          () => putPose(a),
          () => putPose(b)
        );
      } else if (editStateRef.current && selectedObject) {
        const g = (selectedObject as THREE.Mesh).geometry;
        g.computeVertexNormals();
        g.computeBoundingSphere();
        g.computeBoundingBox();
      }
    });

    tc.addEventListener('objectChange', () => {
      const em = editStateRef.current;
      if (!em || !em.B || !selectedObject) {
        refreshUI();
        return;
      }
      const d = pv.position
        .clone()
        .sub(em.st)
        .applyMatrix3(new THREE.Matrix3().setFromMatrix4(selectedObject.matrixWorld).invert());
      const A = (selectedObject as THREE.Mesh).geometry.getAttribute('position') as THREE.BufferAttribute;
      const PA = em.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      em.B.forEach((b, i) => {
        const x = b.x + d.x;
        const y = b.y + d.y;
        const z = b.z + d.z;
        PA.setXYZ(i, x, y, z);
        em.G[i].forEach(k => A.setXYZ(k, x, y, z));
      });
      A.needsUpdate = true;
      PA.needsUpdate = true;
    });

    S.add(rootRef.current);

    const resizeObserver = new ResizeObserver(() => {
      const r = vp.getBoundingClientRect();
      if (!r.width || !r.height) return;
      R.setSize(r.width, r.height, false);
      cam.aspect = r.width / r.height;
      cam.updateProjectionMatrix();
    });
    resizeObserver.observe(vp);

    let animId: number;
    const loop = () => {
      animId = requestAnimationFrame(loop);
      ctl.update();
      if (boxHelperRef.current) {
        boxHelperRef.current.visible = !!selectedObject && !editStateRef.current;
        if (selectedObject) boxHelperRef.current.setFromObject(selectedObject);
      }
      R.render(S, cam);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      R.dispose();
    };
  }, [addHistory, refreshUI, selectedObject]);

  // Pointer selection handling
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    let dn: [number, number] | null = null;

    const onPointerDown = (e: PointerEvent) => {
      dn = [e.clientX, e.clientY];
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dn) return;
      const dist = Math.hypot(e.clientX - dn[0], e.clientY - dn[1]);
      if (dist > 5) return;
      if (transformRef.current?.axis) return;

      const em = editStateRef.current;
      const cam = cameraRef.current;
      const r = cv.getBoundingClientRect();

      if (em && selectedObject) {
        const v = new THREE.Vector3();
        let best = -1;
        let bd = 16;
        em.G.forEach((_, i) => {
          v.set(em.P[i * 3], em.P[i * 3 + 1], em.P[i * 3 + 2]).applyMatrix4(selectedObject.matrixWorld).project(cam);
          if (v.z > 1) return;
          const d = Math.hypot(((v.x + 1) / 2) * r.width - (e.clientX - r.left), ((1 - v.y) / 2) * r.height - (e.clientY - r.top));
          if (d < bd) {
            bd = d;
            best = i;
          }
        });

        const isMulti = e.shiftKey || multiSelectToggle;
        if (!isMulti) em.s.clear();
        if (best >= 0) {
          if (em.s.has(best) && isMulti) em.s.delete(best);
          else em.s.add(best);
        }
        paintVertices();
        return;
      }

      const rc = new THREE.Raycaster();
      rc.setFromCamera(
        new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)),
        cam
      );
      const hits = rc.intersectObjects(rootRef.current.children, true).find(x => (x.object as THREE.Mesh).isMesh && x.object.visible && x.object.name !== '__contact_shadow__');
      const hitObj = hits ? hits.object : null;

      if (e.shiftKey || e.ctrlKey || multiSelectToggle) {
        if (hitObj) {
          toggleMultiSelectMesh(hitObj);
        }
      } else {
        clearMultiSelect();
        select(hitObj);
      }
    };

    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointerup', onPointerUp);
    return () => {
      cv.removeEventListener('pointerdown', onPointerDown);
      cv.removeEventListener('pointerup', onPointerUp);
    };
  }, [select, multiSelectToggle, toggleMultiSelectMesh, clearMultiSelect, selectedObject, paintVertices]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      const k = e.key.toLowerCase();
      if (editStateRef.current) {
        if (k === 'tab' || k === 'escape') {
          e.preventDefault();
          exitEditModeInternal();
        } else if (e.ctrlKey && k === 'z') {
          e.preventDefault();
          editUndo();
        }
        return;
      }

      if (e.ctrlKey && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.ctrlKey && k === 'y') {
        e.preventDefault();
        redo();
      } else if (e.shiftKey && k === 'd') {
        e.preventDefault();
        duplicate();
      } else if (k === 'x' || k === 'delete') {
        e.preventDefault();
        deleteSelected();
      } else if (k === 'f') {
        e.preventDefault();
        fit(selectedObject || undefined);
      } else if (k === 'g' || k === 'w') {
        setTransformMode('translate');
      } else if (k === 'r' || k === 'e') {
        setTransformMode('rotate');
      } else if (k === 's') {
        setTransformMode('scale');
      } else if (k === 'tab') {
        e.preventDefault();
        enterEditMode();
      } else if (e.code.startsWith('Numpad')) {
        const v = { '1': '0,0,1', '3': '1,0,0', '7': '0,1,.001' }[e.key];
        if (v) setCameraPreset(v);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    undo,
    redo,
    duplicate,
    deleteSelected,
    fit,
    selectedObject,
    setTransformMode,
    enterEditMode,
    exitEditModeInternal,
    editUndo,
    setCameraPreset,
  ]);

  return (
    <StudioContext.Provider
      value={{
        canvasRef,
        containerRef,
        root: rootRef.current,
        selectedObject,
        multiSelection,
        modelName,
        setModelName,
        statusText,
        transformMode,
        setTransformMode,
        wireframe,
        setWireframe,
        gridVisible,
        snapEnabled,
        orthoMode,
        lightingPreset,
        setLightingPreset,
        editMode,
        multiSelectToggle,
        textureList,
        toastMessage,
        rpfArchive,
        setRpfArchive,
        select,
        toggleMultiSelectMesh,
        clearMultiSelect,
        fit,
        undo,
        redo,
        duplicate,
        deleteSelected,
        addPrimitive,
        addDummyPrompt,
        centerOrigin,
        toggleSmooth,
        mirrorX,
        toggleVisibility,
        applyMaterialPreset,
        runDecimateAction,
        runAutoSizeAction,
        runGroundAction,
        runAttachAction,
        runDetachAction,
        runSwapAction,
        runMoveToAction,
        applyTextureToSelected,
        showToast,
        loadFiles,
        exportScene,
        exportTxdFile,
        renderCanvasImage,
        setCameraPreset,
        toggleOrtho,
        toggleWireframe,
        toggleGrid,
        toggleSnap,
        toggleEditMode,
        toggleMultiSelectMode,
        editUndo,
        meshesList,
        shadowsVisible,
        toggleShadows,
        dimensionsVisible,
        toggleDimensions,
        modelDimensions,
        isRenderModalOpen,
        setIsRenderModalOpen,
        executeRender,
        updateSelectedProps,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
};
