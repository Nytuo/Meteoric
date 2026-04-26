import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTauriListener } from '@/stores/tauriEvents';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { BlockingOverlay } from '@/components/layout/BlockingOverlay';
import UpdaterModal from '@/components/common/UpdaterModal';
import { Splash } from '@/pages/Splash';
import { DisplayManager } from '@/pages/DisplayManager';
import { GameDetails } from '@/pages/GameDetails';
import { EditGame } from '@/pages/EditGame';
import { Stats } from '@/pages/Stats';
import { BigPicture } from '@/pages/BigPicture';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function App() {
  const location = useLocation();
  const isBigPicture = location.pathname === '/bigpicture';
  const { fetchSettings } = useSettingsStore();

  useTauriListener();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <TooltipProvider>
      <UpdaterModal />
      <div
        className={`flex h-screen overflow-hidden ${isBigPicture ? '' : ''}`}
      >
        <Toaster position="bottom-right" theme="dark" richColors />
        {!isBigPicture && <BlockingOverlay />}
        {!isBigPicture && <Sidebar />}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!isBigPicture && <Topbar />}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DisplayManager />} />
              <Route path="/games" element={<DisplayManager />} />
              <Route path="/game/:id" element={<GameDetails />} />
              <Route path="/edit/:id" element={<EditGame />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/bigpicture" element={<BigPicture />} />
            </Routes>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
