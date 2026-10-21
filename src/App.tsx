import React from 'react';
import { StudioProvider } from './context/StudioContext';
import { Header } from './components/Header';
import { LeftToolbar } from './components/LeftToolbar';
import { Viewport } from './components/Viewport';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { RpfDialog } from './components/RpfDialog';
import { RenderModal } from './components/RenderModal';

export const App: React.FC = () => {
  return (
    <StudioProvider>
      <div id="app">
        <Header />
        <main>
          <LeftToolbar />
          <Viewport />
          <Sidebar />
        </main>
        <Footer />
        <Toast />
        <RpfDialog />
        <RenderModal />
      </div>
    </StudioProvider>
  );
};

export default App;
