const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'node_modules', '@mediapipe', 'hands');
const destDir = path.join(rootDir, 'public', 'mediapipe', 'hands');

const files = [
  'hands.binarypb',
  'hand_landmark_full.tflite',
  'hand_landmark_lite.tflite',
  'hands_solution_packed_assets.data',
  'hands_solution_packed_assets_loader.js',
  'hands_solution_simd_wasm_bin.data',
  'hands_solution_simd_wasm_bin.js',
  'hands_solution_simd_wasm_bin.wasm',
  'hands_solution_wasm_bin.js',
  'hands_solution_wasm_bin.wasm',
];

fs.mkdirSync(destDir, { recursive: true });

for (const file of files) {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file);
  if (!fs.existsSync(srcPath)) {
    console.warn(`Missing source file: ${srcPath}`);
    continue;
  }
  fs.copyFileSync(srcPath, destPath);
}

console.log(`Copied MediaPipe Hands assets to ${destDir}`);
