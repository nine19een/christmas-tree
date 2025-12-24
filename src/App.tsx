import React, { useState, useRef, useEffect } from 'react';
import Scene from './components/Scene';
import HandTracker from './components/HandTracker';
import { useStore } from './store';

// 引入音乐
import bgmUrl from './assets/bgm.mp3';

const App: React.FC = () => {
  const { addPhoto } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // UI 开关
  const [showUI, setShowUI] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // 尝试播放音乐
  const tryPlayMusic = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.volume = 0.4;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.log("等待交互播放", e));
    }
  };

  // 全局点击监听：只要朋友点了屏幕（比如传照片），就开始放歌
  useEffect(() => {
    const handleInteraction = () => {
      tryPlayMusic();
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, [isPlaying]);

  // 键盘控制 UI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '0') setShowUI(false);
      if (e.key === '1') setShowUI(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    tryPlayMusic(); // 传照片时也尝试播放
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      addPhoto(url);
    }
  };

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden">
      
      {/* 音乐播放器 */}
      <audio ref={audioRef} src={bgmUrl} loop />

      {/* 3D 场景 */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>

      {/* 手势追踪 */}
      <div className="absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none overflow-hidden z-[-1]">
        <HandTracker />
      </div>

      {/* 隐藏的文件输入框 */}
      <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleUpload} 
         accept="image/*" 
         className="hidden" 
      />

      {/* 朋友圈版本的 UI：让大家自己传照片 */}
      <div 
        className={`absolute top-0 left-0 w-full p-6 flex justify-end transition-opacity duration-500 z-10 ${showUI ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <button 
           onClick={() => fileInputRef.current?.click()}
           className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-5 py-3 rounded-full text-sm transition-all flex items-center gap-2 group cursor-pointer shadow-lg hover:shadow-yellow-500/20"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">📷</span> 
          <span className="font-semibold tracking-wide">Add Photo</span>
        </button>
      </div>

      {/* 音乐提示 (可选) */}
      {!isPlaying && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/50 text-xs animate-pulse pointer-events-none">
           Tap anywhere for music 🎵
        </div>
      )}

    </div>
  );
};

export default App;