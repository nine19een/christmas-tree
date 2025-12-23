import { create } from 'zustand';
import { AppMode, HandGesture } from './types';
import type { PhotoData } from './types';

interface AppState {
  mode: AppMode;
  gesture: HandGesture;
  handPosition: { x: number; y: number }; // Normalized 0-1
  photos: PhotoData[];
  isAiReady: boolean;
  
  // Actions
  setMode: (mode: AppMode) => void;
  setGesture: (gesture: HandGesture) => void;
  setHandPosition: (x: number, y: number) => void;
  addPhoto: (url: string) => void;
  focusedPhotoIndex: number;
  setFocusedPhotoIndex: (index: number) => void;
  setAiReady: (ready: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  mode: AppMode.TREE,
  gesture: HandGesture.NONE,
  handPosition: { x: 0.5, y: 0.5 },
  photos: [
    {
       id: 'default1',
       url: 'https://picsum.photos/400/400?random=1',
       treePos: [0.5, 2, 0.5],
       explodedPos: [2, 1, 2]
    },
    {
       id: 'default2',
       url: 'https://picsum.photos/400/400?random=2',
       treePos: [-0.5, 1, 0.5],
       explodedPos: [-2, -1, 3]
    }
  ],
  focusedPhotoIndex: 0,
  isAiReady: false,

  setMode: (mode) => set({ mode }),
  setGesture: (gesture) => set({ gesture }),
  setHandPosition: (x, y) => set({ handPosition: { x, y } }),
  addPhoto: (url) => set((state) => {
    // Generate random positions for new photo
    const r = Math.random() * 2 + 0.5;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 6;
    
    // Tree approximate spiral
    const ty = (state.photos.length % 10) * 0.5 - 2;
    const tr = (1 - (ty + 2) / 5) * 2;
    const tTheta = state.photos.length;
    
    const newPhoto: PhotoData = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      treePos: [tr * Math.cos(tTheta), ty, tr * Math.sin(tTheta)],
      explodedPos: [Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3]
    };

    return { photos: [...state.photos, newPhoto] };
  }),
  setFocusedPhotoIndex: (index) => set({ focusedPhotoIndex: index }),
  setAiReady: (ready) => set({ isAiReady: ready })
}));
