import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { AppMode, HandGesture } from '../types';
import { useTexture } from '@react-three/drei';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      instancedMesh: any;
      planeGeometry: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      mesh: any;
      ambientLight: any;
      hemisphereLight: any;
      directionalLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}

type Vec3 = [number, number, number];

type Particle = {
  treePos: Vec3;
  explodedPos: Vec3;
  scale: number;
};

type Ornament = {
  treePos: Vec3;
  explodedPos: Vec3;
  scale: number;
};

type LightBulb = {
  treePos: Vec3;
  explodedPos: Vec3;
  scale: number;
  phase: number;
  speed: number;
};

// ===== TUNE HERE =====
const TREE_HEIGHT = 10;
const TREE_RADIUS = 3.6;

// 双色粒子层：深绿树体 + 浅绿高光
const FOLIAGE_A_COUNT = 15000; // 深绿数量（树体）
const FOLIAGE_B_COUNT = 10000; // 浅绿数量（高光/外层）

// 红球（装饰）
const ORNAMENT_COUNT = 50; // 红球数量（想更少就降）
const ORNAMENT_SCALE_MIN = 0.14;
const ORNAMENT_SCALE_MAX = 0.24;

// 灯带（发光球）
const LIGHT_COUNT = 250; // 灯球数量（想更密就加）
const LIGHT_TURNS = 8; // 螺旋圈数（越大越密）
const LIGHT_RADIUS_MUL = 1.08;

// 颜色
const GREEN_DARK = '#1b7a45';
const GREEN_LIGHT = '#2aa85e';
const ORNAMENT_RED = '#ff1036';
const LIGHT_WARM = '#ffd7a8';
const STAR_YELLOW = '#ffd36a';

// 交互旋转
const ROTATION_RANGE = Math.PI * 1.5;
const ROTATION_DAMPING = 4.5;
const INERTIA_DAMPING = 0.93;

const randomExplodedPos = (): Vec3 => {
  const radius = 7 + Math.random() * 4;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  ];
};

// 更“圆锥体”的半径函数：平滑、不会炸毛
const treeRadiusAt = (t: number) => {
  // t: 0..1（从底到顶）
  return TREE_RADIUS * Math.pow(1 - t, 0.92);
};

// 生成粒子：偏向外壳（更像树形），但仍有一定厚度
const sampleConePoint = (t: number, shellBias = 0.78) => {
  const maxR = treeRadiusAt(t);
  // r 越接近 maxR 越靠外壳。pow 越小越靠外。
  const r01 = Math.pow(Math.random(), 0.35);
  const r = maxR * (shellBias + (1 - shellBias) * r01);

  const a = Math.random() * Math.PI * 2;
  const y = t * TREE_HEIGHT - TREE_HEIGHT / 2;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;

  return [x, y, z] as Vec3;
};

const buildStarShape = () => {
  const outerRadius = 0.65;
  const innerRadius = 0.28;
  const points = 5;
  const shape = new THREE.Shape();

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points + Math.PI / 2;
    // const angle = (i * Math.PI) / points - Math.PI / 2; // 让一个角天然朝 +Y
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geom = new THREE.ShapeGeometry(shape, 1);
  geom.computeBoundingBox();
  if (geom.boundingBox) {
    geom.translate(0, -geom.boundingBox.min.y, 0);
  }
  return geom;
};

const MagicTree: React.FC = () => {
  const { mode, gesture, handPosition, photos, focusedPhotoIndex, setFocusedPhotoIndex } = useStore();
  const { camera } = useThree();

  const foliageARef = useRef<THREE.InstancedMesh>(null);
  const foliageBRef = useRef<THREE.InstancedMesh>(null);
  const ornamentRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);

  const rotationGroupRef = useRef<THREE.Group>(null);

  const starRef = useRef<THREE.Mesh>(null);
  const starLightRef = useRef<THREE.PointLight>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const focusProbe = useMemo(() => new THREE.Vector3(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const handAnchor = useRef({ x: 0.5, y: 0.5 });
  const rotationAnchor = useRef({ x: 0, y: 0 });
  const hasHandControl = useRef(false);
  const inertiaRef = useRef({ x: 0, y: 0 });
  const transitionProgress = useRef(0);

  const lastStaticProgress = useRef<number>(-999); // 用于减少不必要的 setMatrixAt 开销

  const starGeometry = useMemo(() => buildStarShape(), []);

  const foliageA = useMemo<Particle[]>(() => {
    const items: Particle[] = [];
    for (let i = 0; i < FOLIAGE_A_COUNT; i++) {
      const t = Math.pow(Math.random(), 1.25); // 底部更密一点
      const treePos = sampleConePoint(t, 0.72);
      const explodedPos = randomExplodedPos();

      const scale =
        (0.012 + Math.random() * 0.018) * (0.75 + (1 - t) * 0.9); // 底部略大
      items.push({ treePos, explodedPos, scale });
    }
    return items;
  }, []);

  const foliageB = useMemo<Particle[]>(() => {
    const items: Particle[] = [];
    for (let i = 0; i < FOLIAGE_B_COUNT; i++) {
      const t = Math.pow(Math.random(), 1.15);
      // 高光层更靠外壳
      const treePos = sampleConePoint(t, 0.88);
      const explodedPos = randomExplodedPos();
      const scale =
        (0.010 + Math.random() * 0.016) * (0.7 + (1 - t) * 0.85);
      items.push({ treePos, explodedPos, scale });
    }
    return items;
  }, []);

  const ornaments = useMemo<Ornament[]>(() => {
    const items: Ornament[] = [];
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      // 顶部少一点：把 t 拉偏向中下部
      const t = 0.1 + Math.pow(Math.random(), 1.2) * 0.8;
      const maxR = treeRadiusAt(t) * 1.02;
      const a = Math.random() * Math.PI * 2;
      const r = maxR * (0.9 + 0.1 * Math.random()); // 更靠外
      const y = t * TREE_HEIGHT - TREE_HEIGHT / 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;

      const scale = ORNAMENT_SCALE_MIN + Math.random() * (ORNAMENT_SCALE_MAX - ORNAMENT_SCALE_MIN);
      items.push({
        treePos: [x, y, z],
        explodedPos: randomExplodedPos(),
        scale,
      });
    }
    return items;
  }, []);

  const lights = useMemo<LightBulb[]>(() => {
    const items: LightBulb[] = [];
    for (let i = 0; i < LIGHT_COUNT; i++) {
      const t = i / (LIGHT_COUNT - 1);

      // 让下方也更紧密：对 t 做一个轻微的“拉伸”，让底部采样更密
      const t2 = Math.pow(t, 0.88);

      const radius = treeRadiusAt(t2) * LIGHT_RADIUS_MUL;
      const angle = t2 * Math.PI * 2 * LIGHT_TURNS;

      const y = t2 * TREE_HEIGHT - TREE_HEIGHT / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const scale = 0.075 + Math.random() * 0.05;

      items.push({
        treePos: [x, y, z],
        explodedPos: randomExplodedPos(),
        scale,
        phase: Math.random() * Math.PI * 2,
        speed: 1.1 + Math.random() * 0.9,
      });
    }
    return items;
  }, []);

  useFrame((state, delta) => {
    if (!rotationGroupRef.current) return;

    const targetProgress = mode === AppMode.TREE ? 0 : 1;
    transitionProgress.current = THREE.MathUtils.lerp(transitionProgress.current, targetProgress, delta * 2.5);
    const progress = transitionProgress.current;

    const time = state.clock.getElapsedTime();

    const handActive = mode !== AppMode.TREE && gesture !== HandGesture.NONE;

    // --- rotation control ---
    if (handActive) {
      if (!hasHandControl.current) {
        handAnchor.current = { x: handPosition.x, y: handPosition.y };
        rotationAnchor.current = {
          x: rotationGroupRef.current.rotation.x,
          y: rotationGroupRef.current.rotation.y,
        };
        hasHandControl.current = true;
      }

      const deltaX = handPosition.y - handAnchor.current.y;
      const deltaY = handPosition.x - handAnchor.current.x;
      const targetX = rotationAnchor.current.x + deltaX * ROTATION_RANGE;
      const targetY = rotationAnchor.current.y + deltaY * ROTATION_RANGE;

      const currentX = rotationGroupRef.current.rotation.x;
      const currentY = rotationGroupRef.current.rotation.y;

      inertiaRef.current.x = (targetX - currentX) * 6;
      inertiaRef.current.y = (targetY - currentY) * 6;

      rotationGroupRef.current.rotation.x = THREE.MathUtils.lerp(currentX, targetX, delta * ROTATION_DAMPING);
      rotationGroupRef.current.rotation.y = THREE.MathUtils.lerp(currentY, targetY, delta * ROTATION_DAMPING);
    } else if (mode === AppMode.TREE) {
      hasHandControl.current = false;
      inertiaRef.current.x = 0;
      inertiaRef.current.y = 0;
      rotationGroupRef.current.rotation.y += delta * 0.2;
      rotationGroupRef.current.rotation.x = THREE.MathUtils.lerp(rotationGroupRef.current.rotation.x, 0, delta * 2);
    } else {
      hasHandControl.current = false;
      rotationGroupRef.current.rotation.x += inertiaRef.current.x * delta;
      rotationGroupRef.current.rotation.y += inertiaRef.current.y * delta;
      const damping = Math.pow(INERTIA_DAMPING, delta * 60);
      inertiaRef.current.x *= damping;
      inertiaRef.current.y *= damping;
    }

    // --- focus selection ---
    if (mode === AppMode.FOCUS && photos.length > 0) {
      const focusTargetX = 0.5;
      const focusTargetY = 0.5;
      let bestIndex = 0;
      let bestScore = Number.POSITIVE_INFINITY;

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const px = THREE.MathUtils.lerp(p.treePos[0], p.explodedPos[0], progress);
        const py = THREE.MathUtils.lerp(p.treePos[1], p.explodedPos[1], progress);
        const pz = THREE.MathUtils.lerp(p.treePos[2], p.explodedPos[2], progress);

        focusProbe.set(px, py, pz);
        focusProbe.applyEuler(rotationGroupRef.current.rotation);
        focusProbe.project(camera);

        const sx = (focusProbe.x + 1) * 0.5;
        const sy = (1 - focusProbe.y) * 0.5;
        const dx = sx - focusTargetX;
        const dy = sy - focusTargetY;
        const score = dx * dx + dy * dy;

        if (score < bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex !== focusedPhotoIndex) setFocusedPhotoIndex(bestIndex);
    }

    // --- update static instanced transforms ONLY when progress changes enough ---
    const shouldUpdateStatic = Math.abs(progress - lastStaticProgress.current) > 0.0005;
    if (shouldUpdateStatic) {
      lastStaticProgress.current = progress;

      // foliage A
      if (foliageARef.current) {
        for (let i = 0; i < foliageA.length; i++) {
          const p = foliageA[i];
          const tx = THREE.MathUtils.lerp(p.treePos[0], p.explodedPos[0], progress);
          const ty = THREE.MathUtils.lerp(p.treePos[1], p.explodedPos[1], progress);
          const tz = THREE.MathUtils.lerp(p.treePos[2], p.explodedPos[2], progress);

          dummy.position.set(tx, ty, tz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(p.scale);
          dummy.updateMatrix();
          foliageARef.current.setMatrixAt(i, dummy.matrix);
        }
        foliageARef.current.instanceMatrix.needsUpdate = true;
      }

      // foliage B
      if (foliageBRef.current) {
        for (let i = 0; i < foliageB.length; i++) {
          const p = foliageB[i];
          const tx = THREE.MathUtils.lerp(p.treePos[0], p.explodedPos[0], progress);
          const ty = THREE.MathUtils.lerp(p.treePos[1], p.explodedPos[1], progress);
          const tz = THREE.MathUtils.lerp(p.treePos[2], p.explodedPos[2], progress);

          dummy.position.set(tx, ty, tz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(p.scale);
          dummy.updateMatrix();
          foliageBRef.current.setMatrixAt(i, dummy.matrix);
        }
        foliageBRef.current.instanceMatrix.needsUpdate = true;
      }

      // ornaments
      if (ornamentRef.current) {
        for (let i = 0; i < ornaments.length; i++) {
          const o = ornaments[i];
          const tx = THREE.MathUtils.lerp(o.treePos[0], o.explodedPos[0], progress);
          const ty = THREE.MathUtils.lerp(o.treePos[1], o.explodedPos[1], progress);
          const tz = THREE.MathUtils.lerp(o.treePos[2], o.explodedPos[2], progress);

          dummy.position.set(tx, ty, tz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(o.scale);
          dummy.updateMatrix();
          ornamentRef.current.setMatrixAt(i, dummy.matrix);
        }
        ornamentRef.current.instanceMatrix.needsUpdate = true;
      }

      // lights (matrix 也在这里更新一次就行)
      if (lightRef.current) {
        for (let i = 0; i < lights.length; i++) {
          const l = lights[i];
          const tx = THREE.MathUtils.lerp(l.treePos[0], l.explodedPos[0], progress);
          const ty = THREE.MathUtils.lerp(l.treePos[1], l.explodedPos[1], progress);
          const tz = THREE.MathUtils.lerp(l.treePos[2], l.explodedPos[2], progress);

          dummy.position.set(tx, ty, tz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(l.scale);
          dummy.updateMatrix();
          lightRef.current.setMatrixAt(i, dummy.matrix);
        }
        lightRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // --- lights flicker color every frame ---
    if (lightRef.current) {
      for (let i = 0; i < lights.length; i++) {
        const l = lights[i];
        const flicker = 0.72 + 0.28 * Math.sin(time * l.speed + l.phase);
        tempColor.set(LIGHT_WARM).multiplyScalar(flicker);
        lightRef.current.setColorAt(i, tempColor);
      }
      if (lightRef.current.instanceColor) lightRef.current.instanceColor.needsUpdate = true;
    }

    // --- star: face camera in Y only, keep one point "up" (no Z rotation) ---
    if (starRef.current && rotationGroupRef.current) {
      starRef.current.getWorldPosition(tempVec);
      const yaw = Math.atan2(camera.position.x - tempVec.x, camera.position.z - tempVec.z);
      starRef.current.rotation.set(0, yaw - rotationGroupRef.current.rotation.y, 0);
    }
    if (starLightRef.current) {
      starLightRef.current.intensity = 2.4 + Math.sin(time * 2) * 0.2;
    }
  });

  return (
    <>
      {/* lighting（树体粒子用 basic 不吃光，这些灯主要给红球/照片/星星点光用） */}
      <ambientLight intensity={0.65} />
      <hemisphereLight intensity={0.75} color="#cfe1ff" groundColor="#143021" />
      <directionalLight position={[6, 8, 6]} intensity={1.6} color="#fff2d6" />

      <group ref={rotationGroupRef} position={[0, -1.2, 0]}>
        {/* foliage A：深绿 */}
        <instancedMesh ref={foliageARef} args={[undefined, undefined, FOLIAGE_A_COUNT]}>
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial color={GREEN_DARK} toneMapped={false} />
        </instancedMesh>

        {/* foliage B：浅绿高光 */}
        <instancedMesh ref={foliageBRef} args={[undefined, undefined, FOLIAGE_B_COUNT]}>
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial color={GREEN_LIGHT} toneMapped={false} />
        </instancedMesh>

        {/* ornaments：红球（更鲜艳） */}
        <instancedMesh ref={ornamentRef} args={[undefined, undefined, ORNAMENT_COUNT]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial
            color={ORNAMENT_RED}
            roughness={0.22}
            metalness={0.35}
            emissive={ORNAMENT_RED}
            emissiveIntensity={0.22}
            toneMapped={false}
          />
        </instancedMesh>

        {/* light bulbs：发光小球（螺旋灯带） */}
        <instancedMesh ref={lightRef} args={[undefined, undefined, LIGHT_COUNT]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial
            roughness={0.4}
            metalness={0.05}
            emissive="#ffe6c6"
            emissiveIntensity={3.6}
            toneMapped={false}
            vertexColors
          />
        </instancedMesh>

        {/* star：2D 发光五角星（一个角固定朝上） */}
        <mesh ref={starRef} position={[0, TREE_HEIGHT / 2 - 0.3, 0]} scale={[0.95, 0.95, 0.95]}>
          <primitive object={starGeometry} attach="geometry" />
          <meshStandardMaterial
            color={STAR_YELLOW}
            emissive={STAR_YELLOW}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          ref={starLightRef}
          position={[0, TREE_HEIGHT / 2 - 0.3, 0]}
          intensity={2.4}
          distance={7}
          decay={2}
          color="#ffe0b3"
        />

        {photos.map((photo: any, index: number) => (
          <FloatingPhoto
            key={photo.id}
            data={photo}
            progressRef={transitionProgress}
            isFocused={mode === AppMode.FOCUS && index === focusedPhotoIndex}
          />
        ))}
      </group>
    </>
  );
};

const FloatingPhoto: React.FC<{
  data: any;
  progressRef: React.MutableRefObject<number>;
  isFocused: boolean;
}> = ({ data, progressRef, isFocused }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(data.url);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const progress = progressRef.current;

    let tx: number, ty: number, tz: number;

    if (isFocused) {
      tx = 0;
      ty = 0;
      tz = 4;
      meshRef.current.lookAt(state.camera.position);
    } else {
      tx = THREE.MathUtils.lerp(data.treePos[0], data.explodedPos[0], progress);
      ty = THREE.MathUtils.lerp(data.treePos[1], data.explodedPos[1], progress);
      tz = THREE.MathUtils.lerp(data.treePos[2], data.explodedPos[2], progress);
      meshRef.current.lookAt(0, 0, 0);
    }

    meshRef.current.position.lerp(new THREE.Vector3(tx, ty, tz), delta * 3);

    const targetScale = isFocused ? 3 : progress > 0.1 ? 1.5 : 0.8;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), delta * 3);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent />
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
      </mesh>
    </mesh>
  );
};

export default MagicTree;
