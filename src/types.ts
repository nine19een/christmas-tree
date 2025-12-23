export type Vec3 = [number, number, number];

export enum AppMode {
  TREE = 'TREE',
  EXPLODED = 'EXPLODED',
  FOCUS = 'FOCUS',
}

export enum HandGesture {
  NONE = 'NONE',
  FIST = 'FIST',
  OPEN = 'OPEN',
  PINCH = 'PINCH',
}

export interface ParticleData {
  id: number;
  type: 'sphere' | 'cube' | 'candy';
  color: string;
  scale: number;
  treePos: Vec3;
  explodedPos: Vec3;
  rotationSpeed: Vec3;
}

export interface PhotoData {
  id: string;
  url: string;
  treePos: Vec3;
  explodedPos: Vec3;
}
