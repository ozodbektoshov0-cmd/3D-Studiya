import React, { useState, useEffect, useRef } from 'react';
import { useStudio } from '../context/StudioContext';
import { RpfEntry } from '../types';
import { parseRpf } from '../utils/rpf';

export const RpfDialog: React.FC = () => {
  const { rpfArchive, setRpfArchive, loadFiles, showToast } = useStudio();
  const [search, setSearch] = useState('');
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (rpfArchive) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [rpfArchive]);

  if (!rpfArchive) return null;

  const entries = rpfArchive.entries;
  const filtered = entries
    .filter(e => e.path.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 300);

  const handleDownload = async (e: RpfEntry) => {
    try {
      const blob = await rpfArchive.getFile(e);
      const fn = e.path.split('/').pop() || 'file';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fn;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (x: any) {
      showToast(x.message || String(x));
    }
  };

  const handleOpen = async (e: RpfEntry) => {
    try {
      const blob = await rpfArchive.getFile(e);
      const fn = e.path.split('/').pop() || 'file';
      const file = new File([blob], fn);
      setRpfArchive(null);
      await loadFiles([file]);
    } catch (x: any) {
      showToast(x.message || String(x));
    }
  };

  const handleOpenNestedRpf = async (e: RpfEntry) => {
    try {
      const blob = await rpfArchive.getFile(e);
      const fn = e.path.split('/').pop() || 'archive.rpf';
      const nestedRpf = await parseRpf(blob, fn);
      setRpfArchive(nestedRpf);
      setSearch('');
    } catch (x: any) {
      showToast(x.message || String(x));
    }
  };

  return (
    <dialog id="rp" ref={dialogRef} onClose={() => setRpfArchive(null)}>
      <div className="ph">
        <b id="rt">
          {rpfArchive.name} · {entries.length} fayl
        </b>
        <input
          id="rq"
          placeholder="Qidirish…"
          value={search}
          onChange={ev => setSearch(ev.target.value)}
        />
        <button id="rc" onClick={() => setRpfArchive(null)}>
          Yopish
        </button>
      </div>
      <div id="rl">
        {filtered.map((e, i) => {
          const fn = e.path.split('/').pop() || '';
          const sizeKb = Math.round((e.res ? e.sz : e.sz || e.a) / 1024);
          const isOpenable = /\.(glb|gltf|obj|stl|ply|dff|txd|yft|ytd|ydr)$/i.test(fn);
          const isNestedRpf = /\.rpf$/i.test(fn);

          return (
            <div key={e.path + i}>
              <span>
                {e.path} · {sizeKb} KB
              </span>
              <button onClick={() => handleDownload(e)}>Yuklab olish</button>
              {isOpenable && <button onClick={() => handleOpen(e)}>Ochish</button>}
              {isNestedRpf && <button onClick={() => handleOpenNestedRpf(e)}>Ichini ochish</button>}
            </div>
          );
        })}
        {entries.length > 300 && !search && (
          <small>Dastlabki 300 tasi ko’rsatildi — qidiruvdan foydalaning.</small>
        )}
      </div>
    </dialog>
  );
};
