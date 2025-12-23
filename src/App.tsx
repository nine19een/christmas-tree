import React, { useRef, useState, useEffect } from 'react';
import Scene from './components/Scene';
import HandTracker from './components/HandTracker';
import { useStore } from './store';

const App: React.FC = () => {
  const { addPhoto } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 控制 UI 显示的状态，默认显示 (true) 方便你一开始操作
  const [showUI, setShowUI] = useState(true);

  // 监听键盘事件 0 和 1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '0') setShowUI(false); // 按 0 隐藏
      if (e.key === '1') setShowUI(true);  // 按 1 显示
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      addPhoto(url);
    }
  };

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden">
      
      {/* 1. 3D 场景层 (始终显示) */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>

      {/* 2. 逻辑层 (HandTracker) - 始终运行但隐藏 */}
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

      {/* 3. UI 层 (受 showUI 控制) */}
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

    </div>
  );
};

export default App;