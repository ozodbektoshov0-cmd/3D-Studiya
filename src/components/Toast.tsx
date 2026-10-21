import React from 'react';
import { useStudio } from '../context/StudioContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useStudio();

  if (!toastMessage) return null;

  return (
    <div id="toast" style={{ display: 'block' }}>
      {toastMessage}
    </div>
  );
};
