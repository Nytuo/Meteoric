import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { platform } from '@tauri-apps/plugin-os';
import { configDir } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useAppStore } from '@/stores/appStore';

const appWindow = getCurrentWebviewWindow();

export function Splash() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const devMode = import.meta.env.DEV;

  const goToHome = async () => {
    navigate('/games');
    await appWindow.setFullscreen(false);
  };

  useEffect(() => {
    if (devMode) {
      goToHome();
      return;
    }
    loadVideo();
  }, []);

  const loadVideo = async () => {
    try {
      let configPath = await configDir();
      const os = await platform();
      if (os === 'windows') {
        configPath =
          configPath + '\\Nytuo\\Meteoric\\config\\meteoric_extra_content\\';
      } else {
        configPath = configPath + '/meteoric/meteoric_extra_content/';
      }
      if (videoRef.current) {
        videoRef.current.volume = 1;
        videoRef.current.src = convertFileSrc(configPath + 'startup.mp4');
      }
    } catch {
      goToHome();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <video
        ref={videoRef}
        autoPlay
        onEnded={goToHome}
        onError={goToHome}
        onDoubleClick={goToHome}
        className="h-full w-full object-cover"
      >
        <source src="" type="video/mp4" />
      </video>
    </div>
  );
}
