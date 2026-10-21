import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { LightingPresetId } from '../types';
import { LIGHTING_PRESETS } from '../utils/lighting';

export const LeftToolbar: React.FC = () => {
  const {
    transformMode,
    setTransformMode,
    fit,
    selectedObject,
    lightingPreset,
    setLightingPreset,
  } = useStudio();

  const [isLightingOpen, setIsLightingOpen] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsLightingOpen(false);
      }
    };
    if (isLightingOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isLightingOpen]);

  const presetList: { id: LightingPresetId; label: string; icon: string; desc: string }[] = [
    {
      id: 'studio',
      label: LIGHTING_PRESETS.studio.name,
      icon: LIGHTING_PRESETS.studio.icon,
      desc: LIGHTING_PRESETS.studio.desc,
    },
    {
      id: 'daylight',
      label: LIGHTING_PRESETS.daylight.name,
      icon: LIGHTING_PRESETS.daylight.icon,
      desc: LIGHTING_PRESETS.daylight.desc,
    },
    {
      id: 'sunset',
      label: LIGHTING_PRESETS.sunset.name,
      icon: LIGHTING_PRESETS.sunset.icon,
      desc: LIGHTING_PRESETS.sunset.desc,
    },
    {
      id: 'night',
      label: LIGHTING_PRESETS.night.name,
      icon: LIGHTING_PRESETS.night.icon,
      desc: LIGHTING_PRESETS.night.desc,
    },
  ];

  return (
    <nav id="lt" ref={containerRef}>
      <button
        className={transformMode === 'translate' ? 'on' : ''}
        onClick={() => setTransformMode('translate')}
        title="Ko’chirish (G)"
      >
        ✥
      </button>
      <button
        className={transformMode === 'rotate' ? 'on' : ''}
        onClick={() => setTransformMode('rotate')}
        title="Aylantirish (R)"
      >
        ⟳
      </button>
      <button
        className={transformMode === 'scale' ? 'on' : ''}
        onClick={() => setTransformMode('scale')}
        title="O’lcham (S)"
      >
        ⤢
      </button>
      <button
        id="fit"
        onClick={() => fit(selectedObject || undefined)}
        title="Kamera (F)"
      >
        ⌖
      </button>

      {/* Lighting Presets Toggle Button */}
      <div className="lighting-tool-wrap">
        <button
          id="light-btn"
          className={isLightingOpen ? 'on' : ''}
          onClick={() => setIsLightingOpen(prev => !prev)}
          title={`Yorug’lik: ${LIGHTING_PRESETS[lightingPreset].name}`}
        >
          {LIGHTING_PRESETS[lightingPreset].icon}
        </button>

        {/* Popover Menu */}
        {isLightingOpen && (
          <div className="lighting-popover">
            <div className="lighting-popover-title">Yorug’lik rejimi</div>
            <div className="lighting-popover-list">
              {presetList.map(item => {
                const isActive = lightingPreset === item.id;
                return (
                  <button
                    key={item.id}
                    className={`lighting-preset-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setLightingPreset(item.id);
                      setIsLightingOpen(false);
                    }}
                  >
                    <span className="lighting-preset-icon">{item.icon}</span>
                    <div className="lighting-preset-info">
                      <span className="lighting-preset-name">{item.label}</span>
                      <span className="lighting-preset-desc">{item.desc}</span>
                    </div>
                    {isActive && <span className="lighting-active-dot">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
