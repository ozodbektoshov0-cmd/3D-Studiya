import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { RenderOptions } from '../types';

export const RenderModal: React.FC = () => {
  const { isRenderModalOpen, setIsRenderModalOpen, executeRender, modelName } = useStudio();
  const [resolution, setResolution] = useState<'1x' | '2k' | '4k'>('2k');
  const [transparent, setTransparent] = useState<boolean>(false);
  const [hideHelpers, setHideHelpers] = useState<boolean>(true);
  const [includeShadow, setIncludeShadow] = useState<boolean>(true);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  if (!isRenderModalOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    try {
      const opts: RenderOptions = {
        resolution,
        transparent,
        hideHelpers,
        includeShadow,
      };
      await executeRender(opts);
      setIsRenderModalOpen(false);
    } finally {
      setIsRendering(false);
    }
  };

  const resDetails = {
    '1x': { title: '1x Viewport', desc: 'Joriy ekran o‘lchami', size: 'Standart' },
    '2k': { title: '2K QHD', desc: '2560 × 1440 px', size: 'Yuqori aniqlik' },
    '4k': { title: '4K Ultra HD', desc: '3840 × 2160 px', size: 'Ultra sifat' },
  };

  return (
    <div className="render-modal-backdrop" onClick={() => !isRendering && setIsRenderModalOpen(false)}>
      <div className="render-modal-card" onClick={e => e.stopPropagation()}>
        <div className="render-modal-header">
          <div>
            <h3 className="render-modal-title">Render Studio</h3>
            <p className="render-modal-subtitle">Yuqori sifatli 4K/2K PNG formatida eksport qilish</p>
          </div>
          <button
            className="render-modal-close"
            onClick={() => !isRendering && setIsRenderModalOpen(false)}
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>

        <div className="render-modal-body">
          <div className="render-section">
            <label className="render-section-label">Tasvir o‘lchami (Sifat):</label>
            <div className="render-res-grid">
              {(['1x', '2k', '4k'] as const).map(res => (
                <button
                  key={res}
                  type="button"
                  className={`render-res-card ${resolution === res ? 'active' : ''}`}
                  onClick={() => setResolution(res)}
                >
                  <div className="render-res-title">{resDetails[res].title}</div>
                  <div className="render-res-desc">{resDetails[res].desc}</div>
                  <div className="render-res-badge">{resDetails[res].size}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="render-section">
            <label className="render-section-label">Fon va parametrlar:</label>
            <div className="render-options-list">
              <label className="render-chk-label">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={e => setTransparent(e.target.checked)}
                />
                <div>
                  <div className="render-chk-title">Shaffof fon (Transparent PNG)</div>
                  <div className="render-chk-desc">Obyekt fonsiz (alpha kanal) saqlanadi, kompozitsiya uchun qulay</div>
                </div>
              </label>

              <label className="render-chk-label">
                <input
                  type="checkbox"
                  checked={includeShadow}
                  onChange={e => setIncludeShadow(e.target.checked)}
                />
                <div>
                  <div className="render-chk-title">Kontakt soya (Realistik soya)</div>
                  <div className="render-chk-desc">Model tagidagi yumshoq radial zamin soyasini tasvirda qoldirish</div>
                </div>
              </label>

              <label className="render-chk-label">
                <input
                  type="checkbox"
                  checked={hideHelpers}
                  onChange={e => setHideHelpers(e.target.checked)}
                />
                <div>
                  <div className="render-chk-title">Yordamchi chiziqlarni yashirish</div>
                  <div className="render-chk-desc">Panjara, o‘qlar va o‘lcham chegaralarini toza render uchun yashiradi</div>
                </div>
              </label>
            </div>
          </div>

          <div className="render-info-preview">
            <span>Fayl nomi: <strong>{modelName || 'model'}.png</strong></span>
            <span>Aniqlik: <strong>{resolution === '4k' ? '3840×2160' : resolution === '2k' ? '2560×1440' : 'Ekran'}</strong></span>
          </div>
        </div>

        <div className="render-modal-footer">
          <button
            className="render-btn-cancel"
            disabled={isRendering}
            onClick={() => setIsRenderModalOpen(false)}
          >
            Bekor qilish
          </button>
          <button
            className="render-btn-primary"
            disabled={isRendering}
            onClick={handleStartRender}
          >
            {isRendering ? (
              <>
                <span className="render-spinner"></span>
                <span>Render qilinmoqda…</span>
              </>
            ) : (
              <span>📸 Yuklab olish (PNG)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
