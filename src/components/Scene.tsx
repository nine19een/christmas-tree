import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import MagicTree from './MagicTree';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      color: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
    }
  }
}

const Scene: React.FC = () => {
  const [canvasInfo, setCanvasInfo] = useState({
    exists: false,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  });

  useEffect(() => {
    const updateCanvasInfo = () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        setCanvasInfo({ exists: false, width: 0, height: 0, top: 0, left: 0 });
        return;
      }

      const rect = canvas.getBoundingClientRect();
      setCanvasInfo({
        exists: true,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
      });
    };

    updateCanvasInfo();
    const intervalId = window.setInterval(updateCanvasInfo, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0.5, 15], fov: 45 }}
        dpr={[1, 2]} // Optimize for high DPI
        gl={{ antialias: false, toneMappingExposure: 1.5 }}
      >
        <color attach="background" args={['#02030d']} />

        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#FFD700" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#B01B2E" />
        <spotLight 
          position={[0, 15, 0]} 
          angle={0.3} 
          penumbra={1} 
          intensity={2} 
          castShadow 
          color="#FFF" 
        />

        <Stars radius={200} depth={140} count={16000} factor={1.9} saturation={0.35} fade speed={0.2} />

        <Suspense fallback={null}>
           <Environment preset="night" />
           <MagicTree />
        </Suspense>

        {/* Post Processing for the "Cinematic Glow" */}
        <EffectComposer disableNormalPass>
          <Bloom 
              luminanceThreshold={0.2} 
              mipmapBlur 
              intensity={1.5} 
              radius={0.6}
          />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
        
        {/* Fallback control if hand tracking is confusing */}
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 50,
          color: '#ffffff',
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '8px 10px',
          borderRadius: 6,
          fontFamily: 'monospace',
          fontSize: 12,
          pointerEvents: 'none',
        }}
      >
        <div>Scene mounted</div>
        <div>canvas exists: {canvasInfo.exists ? 'true' : 'false'}</div>
        <div>
          canvas rect: {canvasInfo.width}x{canvasInfo.height} @ {canvasInfo.left},{' '}
          {canvasInfo.top}
        </div>
      </div>
    </div>
  );
};

export default Scene;
