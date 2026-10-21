import React from 'react';
import { useStudio } from '../context/StudioContext';

export const Footer: React.FC = () => {
  const { statusText } = useStudio();

  return (
    <footer>
      <span id="st">{statusText}</span>
      <span>
        G ko’chirish · R aylantirish · S o’lcham · Shift+D nusxa · X o’chirish · F kamera · Tab edit mode
      </span>
    </footer>
  );
};
