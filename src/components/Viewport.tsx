import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { LIGHTING_PRESETS } from '../utils/lighting';

export const Viewport: React.FC = () => {
  const {
    canvasRef,
    containerRef,
    orthoMode,
    toggleOrtho,
    setCameraPreset,
    editMode,
    toggleEditMode,
    multiSelectToggle,
    toggleMultiSelectMode,
    wireframe,
    toggleWireframe,
    gridVisible,
    toggleGrid,
    snapEnabled,
    toggleSnap,
    meshesList,
    loadFiles,
    lightingPreset,
    shadowsVisible,
    toggleShadows,
    dimensionsVisible,
    toggleDimensions,
    modelDimensions,
  } = useStudio();

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      loadFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      id="vp"
      ref={containerRef}
      className={isDragging ? 'drag' : ''}
      style={{ background: LIGHTING_PRESETS[lightingPreset].bgGradient }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas id="c" ref={canvasRef} />

      <div id="vh">
        <button
          id="ortho"
          className={orthoMode ? 'on' : ''}
          onClick={toggleOrtho}
        >
          Ortho
        </button>
        <button onClick={() => setCameraPreset('0,0,1')}>Old</button>
        <button onClick={() => setCameraPreset('1,0,0')}>O’ng</button>
        <button onClick={() => setCameraPreset('0,1,.001')}>Yuqori</button>
        <button
          id="edit"
          className={editMode ? 'on' : ''}
          onClick={toggleEditMode}
        >
          Edit (Tab)
        </button>
        <button
          id="msel"
          className={multiSelectToggle ? 'on' : ''}
          onClick={toggleMultiSelectMode}
        >
          Ko’p tanlash
        </button>
        <button
          id="wf"
          className={wireframe ? 'on' : ''}
          onClick={toggleWireframe}
        >
          Karkas
        </button>
        <button
          id="grid"
          className={gridVisible ? 'on' : ''}
          onClick={toggleGrid}
        >
          Panjara
        </button>
        <button
          id="snap"
          className={snapEnabled ? 'on' : ''}
          onClick={toggleSnap}
        >
          Magnit
        </button>
        <button
          id="dim"
          className={dimensionsVisible ? 'on' : ''}
          onClick={toggleDimensions}
          title="Model o'lchamlari va chizg'ichni ko'rsatish"
        >
          O’lcham
        </button>
        <button
          id="shd"
          className={shadowsVisible ? 'on' : ''}
          onClick={toggleShadows}
          title="Kontakt soyalarni yoqish/o'chirish"
        >
          Soya
        </button>
      </div>

      {dimensionsVisible && modelDimensions && meshesList.length > 0 && (
        <div className="dimension-hud" title="Model gabarit o'lchamlari">
          <div className="dimension-title">
            <span className="dimension-icon">📐</span>
            <span>Gabarit o’lchamlar</span>
          </div>
          <div className="dimension-grid">
            <div className="dim-item">
              <span className="dim-label">Uzunlik (X):</span>
              <span className="dim-val">{modelDimensions.length.toFixed(2)} m</span>
            </div>
            <div className="dim-item">
              <span className="dim-label">Balandlik (Y):</span>
              <span className="dim-val">{modelDimensions.height.toFixed(2)} m</span>
            </div>
            <div className="dim-item">
              <span className="dim-label">Kenglik (Z):</span>
              <span className="dim-val">{modelDimensions.width.toFixed(2)} m</span>
            </div>
            <div className="dim-item">
              <span className="dim-label">Hajm:</span>
              <span className="dim-val">{modelDimensions.volume.toFixed(2)} m³</span>
            </div>
          </div>
        </div>
      )}

      {meshesList.length === 0 && (
        <div id="hint">
          Modelni shu yerga tashlang yoki Fayl → Ochish (import).
          <br />
          GLB · GLTF · OBJ · STL · PLY · FBX · DAE · WRL · VTK · 3MF · USD/USDA/USDZ · DFF + TXD + YFT / YDR / YTD + RPF (GTA)
        </div>
      )}
    </div>
  );
};
