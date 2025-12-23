import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
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
  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 45 }}
      dpr={[1, 2]}
      gl={{ 
        antialias: false, 
        toneMapping: THREE.ACESFilmicToneMapping, 
        toneMappingExposure: 1.0 
      }}
    >
      <color attach="background" args={['#020504']} />
      
      {/* --- Cinematic Lighting Setup --- */}
      
      {/* 1. Base Ambient: Deep Blue/Green Night fill */}
      <ambientLight intensity={0.6} color="#112233" />

      {/* 2. Key Light: Warm Spotlight from top-right */}
      <spotLight 
        position={[10, 15, 10]} 
        angle={0.4} 
        penumbra={0.5} 
        intensity={100} 
        color="#ffeebb" 
        castShadow 
        distance={40}
        decay={1.5}
      />

      {/* 3. Rim Light: Cool blue backlight to outline the tree */}
      <pointLight position={[-8, 5, -8]} intensity={40} color="#4466ff" distance={20} decay={1.5} />
      
      {/* 4. Ground Bounce: Warm low fill */}
      <pointLight position={[0, -8, 5]} intensity={10} color="#aa7744" distance={15} decay={2} />

      <Stars radius={80} depth={20} count={3000} factor={3} saturation={0} fade speed={0.5} />

      <Suspense fallback={null}>
         <Environment preset="night" blur={0.7} background={false} />
         <MagicTree />
      </Suspense>

      <EffectComposer enableNormalPass={false}>
        {/* Bloom: High threshold so only emissive lights and star glow, not the leaves */}
        <Bloom 
            luminanceThreshold={1.1} 
            mipmapBlur 
            intensity={0.8} 
            radius={0.3} 
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
      
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
};

export default Scene;