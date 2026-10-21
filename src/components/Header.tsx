import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';

export const Header: React.FC = () => {
  const {
    loadFiles,
    exportScene,
    exportTxdFile,
    renderCanvasImage,
    undo,
    redo,
    duplicate,
    deleteSelected,
    addDummyPrompt,
    addPrimitive,
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
  } = useStudio();

  const [exportFormat, setExportFormat] = useState('glb');
  const [zUp, setZUp] = useState(false);
  const [txdMaxSize, setTxdMaxSize] = useState(1024);
  const [allMeshesMat, setAllMeshesMat] = useState(false);
  const [decimateVal, setDecimateVal] = useState(50);
  const [autoSizeVal, setAutoSizeVal] = useState('4.5');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      document.querySelectorAll('details.mn[open]').forEach(d => {
        if (!d.contains(e.target as Node) || (e.target as HTMLElement).closest('button, label.it')) {
          (d as HTMLDetailsElement).open = false;
        }
      });
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      loadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <header>
      <b className="logo">3D Studiya</b>

      {/* Fayl Menu */}
      <details className="mn">
        <summary>Fayl</summary>
        <div>
          <label className="it">
            Ochish (import)…
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept=".glb,.gltf,.obj,.stl,.ply,.dff,.txd,.rpf,.yft,.ytd,.ydr,.fbx,.dae,.wrl,.vrml,.vtk,.3mf,.usd,.usda,.usdc,.usdz,.max,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
            />
          </label>
          <div className="row">
            <select
              id="fmt"
              aria-label="Format"
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value)}
            >
              <option value="glb">glb</option>
              <option value="gltf">gltf</option>
              <option value="obj">obj</option>
              <option value="stl">stl</option>
              <option value="ply">ply</option>
              <option value="dff">dff</option>
              <option value="fbx">fbx</option>
              <option value="dae">dae</option>
              <option value="wrl">wrl</option>
              <option value="vtk">vtk</option>
              <option value="3mf">3mf</option>
              <option value="usda">usda</option>
              <option value="usd">usd</option>
              <option value="usdz">usdz</option>
            </select>
            <label className="chk">
              <input
                type="checkbox"
                id="zup"
                checked={zUp}
                onChange={e => setZUp(e.target.checked)}
              />
              Z-up
            </label>
          </div>
          <button className="pri" onClick={() => exportScene(exportFormat, zUp)}>
            Eksport
          </button>
          <div className="row">
            <select
              aria-label="Maks. tekstura"
              value={txdMaxSize}
              onChange={e => setTxdMaxSize(Number(e.target.value))}
            >
              <option value="256">256</option>
              <option value="512">512</option>
              <option value="1024">1024</option>
              <option value="2048">2048</option>
            </select>
            <button onClick={() => exportTxdFile(txdMaxSize)}>TXD eksport</button>
          </div>
          <button onClick={renderCanvasImage}>Render (PNG)</button>
        </div>
      </details>

      {/* Tahrir Menu */}
      <details className="mn">
        <summary>Tahrir</summary>
        <div>
          <button onClick={undo}>Bekor qilish · Ctrl+Z</button>
          <button onClick={redo}>Qaytarish · Ctrl+Y</button>
          <button onClick={duplicate}>Nusxa · Shift+D</button>
          <button onClick={deleteSelected}>O’chirish · X</button>
        </div>
      </details>

      {/* Qo’shish Menu */}
      <details className="mn">
        <summary>Qo’shish</summary>
        <div id="addm">
          <button onClick={addDummyPrompt}>Dummy…</button>
          <button onClick={() => addPrimitive('Kub')}>Kub</button>
          <button onClick={() => addPrimitive('Shar')}>Shar</button>
          <button onClick={() => addPrimitive('Silindr')}>Silindr</button>
          <button onClick={() => addPrimitive('Konus')}>Konus</button>
          <button onClick={() => addPrimitive('Halqa')}>Halqa</button>
          <button onClick={() => addPrimitive('Tekislik')}>Tekislik</button>
        </div>
      </details>

      {/* Obyekt Menu */}
      <details className="mn">
        <summary>Obyekt</summary>
        <div>
          <button onClick={centerOrigin}>Markazni o’rnatish</button>
          <button onClick={toggleSmooth}>Silliq / qirrali</button>
          <button onClick={mirrorX}>Ko’zgu X</button>
          <button onClick={toggleVisibility}>Yashirish / ko’rsatish</button>
        </div>
      </details>

      {/* Material Menu */}
      <details className="mn">
        <summary>Material</summary>
        <div>
          <label className="chk row">
            <input
              type="checkbox"
              checked={allMeshesMat}
              onChange={e => setAllMeshesMat(e.target.checked)}
            />
            Hamma meshlarga
          </label>
          <button onClick={() => applyMaterialPreset('chrome', allMeshesMat)}>
            Chrome (yaltiratish)
          </button>
          <button onClick={() => applyMaterialPreset('paint', allMeshesMat)}>
            Yaltiroq bo’yoq
          </button>
          <button onClick={() => applyMaterialPreset('glass', allMeshesMat)}>
            Oyna
          </button>
          <button onClick={() => applyMaterialPreset('matte', allMeshesMat)}>
            Mat
          </button>
        </div>
      </details>

      {/* Asboblar Menu */}
      <details className="mn">
        <summary>Asboblar</summary>
        <div>
          <div className="row">
            <input
              type="number"
              id="dec"
              value={decimateVal}
              min="5"
              max="95"
              onChange={e => setDecimateVal(Number(e.target.value))}
            />
            <button onClick={() => runDecimateAction(decimateVal)}>
              Poligon kamaytirish (% qoladi)
            </button>
          </div>
          <div className="row">
            <select
              value={autoSizeVal}
              onChange={e => setAutoSizeVal(e.target.value)}
            >
              <option value="4.5">Yengil mashina 4.5 m</option>
              <option value="3.8">Kichik mashina 3.8 m</option>
              <option value="5.0">Sedan / politsiya 5.0 m</option>
              <option value="5.2">Jip / furgon 5.2 m</option>
              <option value="7.5">Yuk mashinasi 7.5 m</option>
              <option value="11">Avtobus 11 m</option>
              <option value="2.1">Mototsikl 2.1 m</option>
              <option value="1.7">Velosiped 1.7 m</option>
              <option value="h1.8">Odam (bo’yi 1.8 m)</option>
            </select>
            <button onClick={() => runAutoSizeAction(autoSizeVal)}>Avto razmer</button>
          </div>
          <button onClick={runGroundAction}>Yerga qo’yish va markazlash</button>
          <button onClick={runAttachAction}>Attach (birlashtirish)</button>
          <button onClick={runDetachAction}>Detach (ajratish)</button>
          <button onClick={runSwapAction}>Joyini almashtirish (2 obyekt)</button>
          <button onClick={runMoveToAction}>Birinchisini ikkinchisiga qo’yish</button>
        </div>
      </details>

      <span className="sp"></span>
    </header>
  );
};
