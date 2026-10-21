import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useStudio } from '../context/StudioContext';

export const Sidebar: React.FC = () => {
  const {
    meshesList,
    selectedObject,
    multiSelection,
    select,
    toggleMultiSelectMesh,
    textureList,
    applyTextureToSelected,
    updateSelectedProps,
  } = useStudio();

  // Local state for numeric transform properties
  const [name, setName] = useState('');
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [posZ, setPosZ] = useState(0);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [rotZ, setRotZ] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [scaleZ, setScaleZ] = useState(1);
  const [color, setColor] = useState('#cccccc');
  const [roughness, setRoughness] = useState(0.5);
  const [metalness, setMetalness] = useState(0);
  const [opacity, setOpacity] = useState(1);

  // Sync state whenever selectedObject changes or transforms
  useEffect(() => {
    if (!selectedObject) return;
    setName(selectedObject.name || '');
    setPosX(+selectedObject.position.x.toFixed(3));
    setPosY(+selectedObject.position.y.toFixed(3));
    setPosZ(+selectedObject.position.z.toFixed(3));

    const rx = (selectedObject.rotation.x * 180) / Math.PI;
    const ry = (selectedObject.rotation.y * 180) / Math.PI;
    const rz = (selectedObject.rotation.z * 180) / Math.PI;
    setRotX(+rx.toFixed(3));
    setRotY(+ry.toFixed(3));
    setRotZ(+rz.toFixed(3));

    setScaleX(+selectedObject.scale.x.toFixed(3));
    setScaleY(+selectedObject.scale.y.toFixed(3));
    setScaleZ(+selectedObject.scale.z.toFixed(3));

    const mats = [].concat((selectedObject as THREE.Mesh).material as any);
    const m = mats[0];
    if (m) {
      if (m.color) setColor('#' + m.color.getHexString());
      if (m.roughness !== undefined) setRoughness(m.roughness);
      if (m.metalness !== undefined) setMetalness(m.metalness);
      if (m.opacity !== undefined) setOpacity(m.opacity);
    }
  }, [selectedObject]);

  const handleMeshClick = (m: THREE.Mesh, e: React.MouseEvent) => {
    if (e.ctrlKey || e.shiftKey) {
      toggleMultiSelectMesh(m);
    } else {
      select(m);
    }
  };

  const handleDownloadTexture = (t: THREE.CanvasTexture) => {
    const im = t.image as HTMLCanvasElement;
    if (im && typeof im.toBlob === 'function') {
      im.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${t.name}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      });
    }
  };

  return (
    <aside>
      <div className="ph">Outliner</div>
      <div id="list">
        {meshesList.map((m, i) => {
          const isSelected = m === selectedObject || multiSelection.has(m);
          return (
            <button
              key={m.uuid || i}
              className={isSelected ? 'on' : ''}
              onClick={e => handleMeshClick(m, e)}
            >
              {m.name || `mesh ${i + 1}`}
            </button>
          );
        })}
      </div>

      <div className="ph">Teksturalar</div>
      <div id="tl">
        {textureList.map(t => {
          const w = (t.image as any)?.width || 0;
          const h = (t.image as any)?.height || 0;
          return (
            <div key={t.uuid || t.name}>
              <button onClick={() => applyTextureToSelected(t)}>
                {t.name} ({w}×{h})
              </button>
              <button
                onClick={() => handleDownloadTexture(t)}
                title="PNG saqlash"
              >
                ⬇
              </button>
            </div>
          );
        })}
      </div>

      {selectedObject && (
        <div id="prop">
          <div className="ph">Xossalar</div>
          <label>
            Nom
            <input
              type="text"
              id="nm"
              value={name}
              onChange={e => {
                setName(e.target.value);
                updateSelectedProps({ name: e.target.value });
              }}
            />
          </label>

          <div id="xf">
            <span>Joy</span>
            <input
              type="number"
              step="0.1"
              value={posX}
              onChange={e => {
                const v = +e.target.value || 0;
                setPosX(v);
                updateSelectedProps({ pos: [v, posY, posZ] });
              }}
            />
            <input
              type="number"
              step="0.1"
              value={posY}
              onChange={e => {
                const v = +e.target.value || 0;
                setPosY(v);
                updateSelectedProps({ pos: [posX, v, posZ] });
              }}
            />
            <input
              type="number"
              step="0.1"
              value={posZ}
              onChange={e => {
                const v = +e.target.value || 0;
                setPosZ(v);
                updateSelectedProps({ pos: [posX, posY, v] });
              }}
            />

            <span>Burilish</span>
            <input
              type="number"
              step="5"
              value={rotX}
              onChange={e => {
                const v = +e.target.value || 0;
                setRotX(v);
                updateSelectedProps({ rot: [v, rotY, rotZ] });
              }}
            />
            <input
              type="number"
              step="5"
              value={rotY}
              onChange={e => {
                const v = +e.target.value || 0;
                setRotY(v);
                updateSelectedProps({ rot: [rotX, v, rotZ] });
              }}
            />
            <input
              type="number"
              step="5"
              value={rotZ}
              onChange={e => {
                const v = +e.target.value || 0;
                setRotZ(v);
                updateSelectedProps({ rot: [rotX, rotY, v] });
              }}
            />

            <span>O’lcham</span>
            <input
              type="number"
              step="0.1"
              value={scaleX}
              onChange={e => {
                const v = +e.target.value || 0;
                setScaleX(v);
                updateSelectedProps({ scale: [v, scaleY, scaleZ] });
              }}
            />
            <input
              type="number"
              step="0.1"
              value={scaleY}
              onChange={e => {
                const v = +e.target.value || 0;
                setScaleY(v);
                updateSelectedProps({ scale: [scaleX, v, scaleZ] });
              }}
            />
            <input
              type="number"
              step="0.1"
              value={scaleZ}
              onChange={e => {
                const v = +e.target.value || 0;
                setScaleZ(v);
                updateSelectedProps({ scale: [scaleX, scaleY, v] });
              }}
            />
          </div>

          <label>
            Rang
            <input
              type="color"
              id="col"
              value={color}
              onChange={e => {
                setColor(e.target.value);
                updateSelectedProps({ color: e.target.value });
              }}
            />
          </label>
          <label>
            G’adir-budurlik
            <input
              type="range"
              id="rg"
              min="0"
              max="1"
              step="0.01"
              value={roughness}
              onChange={e => {
                const v = +e.target.value;
                setRoughness(v);
                updateSelectedProps({ roughness: v });
              }}
            />
          </label>
          <label>
            Metallik
            <input
              type="range"
              id="mt"
              min="0"
              max="1"
              step="0.01"
              value={metalness}
              onChange={e => {
                const v = +e.target.value;
                setMetalness(v);
                updateSelectedProps({ metalness: v });
              }}
            />
          </label>
          <label>
            Shaffoflik
            <input
              type="range"
              id="op"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onChange={e => {
                const v = +e.target.value;
                setOpacity(v);
                updateSelectedProps({ opacity: v });
              }}
            />
          </label>
        </div>
      )}
    </aside>
  );
};
