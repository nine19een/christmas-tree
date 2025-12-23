import { Hands } from '@mediapipe/hands';

type HandsState = {
  instance: Hands | null;
  initializing: Promise<Hands> | null;
  usingSimd: boolean;
};

const GLOBAL_KEY = '__mediapipeHandsState__';

const getState = (): HandsState => {
  const globalAny = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: HandsState;
  };
  if (!globalAny[GLOBAL_KEY]) {
    globalAny[GLOBAL_KEY] = {
      instance: null,
      initializing: null,
      usingSimd: true,
    };
  }
  return globalAny[GLOBAL_KEY]!;
};

const supportsSimd = (): boolean => {
  if (typeof WebAssembly === 'undefined' || typeof WebAssembly.validate !== 'function') {
    return false;
  }
  const simdModule = new Uint8Array([
    0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 11, 1, 9,
    0, 65, 0, 253, 97, 11,
  ]);
  return WebAssembly.validate(simdModule);
};

const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalized}/mediapipe/hands`;
};

const mapFile = (file: string, useSimd: boolean) => {
  if (!useSimd) {
    if (file === 'hands_solution_simd_wasm_bin.wasm') {
      return 'hands_solution_wasm_bin.wasm';
    }
    if (file === 'hands_solution_simd_wasm_bin.js') {
      return 'hands_solution_wasm_bin.js';
    }
  }
  return file;
};

const createHands = async (useSimd: boolean) => {
  const basePath = getBasePath();
  const hands = new Hands({
    locateFile: (file) => `${basePath}/${mapFile(file, useSimd)}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  await hands.initialize();
  return hands;
};

export const getHandsSingleton = async () => {
  const state = getState();

  if (state.instance) return state.instance;
  if (state.initializing) return state.initializing;

  const preferSimd = supportsSimd();
  state.usingSimd = preferSimd;
  state.initializing = (async () => {
    try {
      const hands = await createHands(state.usingSimd);
      state.instance = hands;
      return hands;
    } catch (error) {
      if (state.usingSimd) {
        state.usingSimd = false;
        const hands = await createHands(false);
        state.instance = hands;
        return hands;
      }
      throw error;
    } finally {
      state.initializing = null;
    }
  })();

  return state.initializing;
};

export const fallbackToNonSimd = async () => {
  const state = getState();
  if (!state.usingSimd) {
    return state.instance ?? getHandsSingleton();
  }

  state.usingSimd = false;
  if (state.instance) {
    try {
      await state.instance.close();
    } catch {
      // Ignore close errors and retry initialization.
    }
  }
  state.instance = null;
  state.initializing = null;
  return getHandsSingleton();
};
