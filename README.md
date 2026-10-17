[中文](README.zh-CN.md) / **ENG**

# Gesture-Controlled 3D Christmas Tree

A browser-based Christmas scene that combines a glowing 3D tree, local photos, hand gestures and background music. Add photos, scatter the tree, then bring a photo into focus with a pinch.

[Open the demo](https://christmas-tree-phi-seven.vercel.app) · [Watch on Bilibili](https://www.bilibili.com/video/BV1XALD6TETr/)

![A glowing green Christmas tree topped with a bright star against a dark background](tree.jpg)

The image and links are from the existing project. The remote demo and video have not been rechecked for availability or version parity.

## Try the interaction

1. Open the page in a desktop browser with a working camera, and allow camera access for hand tracking.
2. Click **Add Photo** and choose one local image. Repeat to add more photos; the current picker accepts one image per selection.
3. Hold a hand in view of the camera and use the gestures below. Tracking follows one hand and requires a gesture to remain stable for three frames before switching.
4. Click the page to try starting the looping background music. Browser playback restrictions may affect when it starts.

| Gesture | Scene response |
| --- | --- |
| Fist | Gather the particles into the tree (`TREE`) |
| Open hand | Scatter the tree (`EXPLODED`) |
| Pinch while scattered | Enter photo focus (`FOCUS`); enlarge the photo closest to the screen center |

You can also drag with the mouse to rotate the scene; zoom and pan are disabled. Press **0** to hide the **Add Photo** control and **1** to show it again.

Photos are loaded through browser object URLs and held in page memory. There is no photo upload API, saved collection or photo deletion control in the current app. Refreshing or closing the page loses the added photos.

## Run locally

Use **Node.js >=22.12.0** and **npm >=10.5.1**. These bounds satisfy the engine requirements found in the locked Vite, React plugin and camera-controls dependencies; minimum-version compatibility has not been tested.

```bash
git clone https://github.com/nine19een/christmas-tree.git
cd christmas-tree
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`. The project has no configured backend service or API key.

The available check and build commands are:

```bash
npm run lint
npm run build
npm run preview
```

`build` runs `vite build` and outputs static assets to `dist`; it does not run a TypeScript type check. There is no `test` script. Dependency installation, build, lint, type checking and browser interaction were not tested in this documentation review. Only syntax checks of `eslint.config.js` and `scripts/copy-mediapipe-hands.cjs` passed with Node.js 24.14.0.

For dependency maintenance, `npm run copy:mediapipe-hands` copies MediaPipe model, loader and binary files from the installed package into `public/mediapipe/hands`, overwriting the existing copies. This is an explicit maintenance command, not a required startup step.

## Implementation and limits

React 19 and TypeScript manage the interface; Three.js, React Three Fiber, Drei and postprocessing render the scene. Instanced meshes draw the foliage and ornaments, with interpolated transitions and inertia-based rotation. Zustand holds scene, gesture and photo state, while MediaPipe Hands handles hand landmarks.

- **Camera and environment:** gestures need camera permission. Lighting, camera angle and device performance affect the experience; hand-tracking accuracy, WebGL performance and mobile compatibility have not been tested here.
- **Network access:** the page loads Tailwind from a CDN, Google Fonts and the Drei night environment. The bundled MediaPipe assets do not make the whole experience offline.
- **Hand-tracking recovery:** the code detects SIMD support and includes a non-SIMD path. Automatic recovery after a SIMD runtime error may not switch paths as intended; this source-level concern has not been reproduced in a browser.
- **Session content:** photos have no persistence or export workflow. Keep the original image files separately.

## License and assets

The repository does not include a project license. Reuse permissions have not been specified; public availability should not be treated as permission to reuse the code or assets. The provenance and reuse terms of the bundled music and image also need confirmation. Third-party libraries and MediaPipe assets remain subject to their own terms.
