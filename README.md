# Interactive Gesture-Controlled 3D Christmas Tree / 手势交互 3D 圣诞树

An interactive browser experience that combines **3D real-time rendering**, **hand gesture recognition**, and **photo storytelling**. Users can upload photos, control scene states with hand gestures, and navigate visual focus in an immersive festive environment.

一个融合了 **3D 实时渲染**、**手势识别** 与 **照片叙事** 的浏览器交互项目。用户可上传照片，通过手势切换场景状态，并在沉浸式节日氛围中进行视觉聚焦。

---

## 🎬 Demo / 演示

- **Live Demo / 在线体验**: `TODO: add your deployment link`
- **Demo Video / 演示视频 (Bilibili)**: `TODO: add bilibili video link`

> Tip: For the best experience, allow camera access and use in a desktop browser.
>
> 提示：建议在桌面浏览器中体验并允许摄像头权限。

---

## ✨ Features / 功能亮点

### 1) Gesture-driven scene states / 手势驱动场景状态
- **Fist (握拳)** → Tree mode (树形聚合)
- **Open hand (张手)** → Exploded mode (粒子散开)
- **Pinch (捏合)** → Focus mode (聚焦照片)

### 2) Photo-integrated visual storytelling / 照片融合式视觉表达
- Upload personal photos and place them into the 3D composition.
- In focus mode, the system automatically selects and enlarges the most central photo in view.

### 3) Real-time 3D atmosphere / 实时 3D 氛围构建
- Built with React Three Fiber + Drei + Postprocessing.
- Uses layered foliage particles, ornaments, light spirals, star glow, and cinematic lighting.

### 4) Robust hand-tracking initialization / 稳健的手势识别初始化
- MediaPipe Hands singleton initialization.
- SIMD capability detection with non-SIMD fallback for wider device compatibility.

---

## 🧠 Technical Highlights / 技术要点

- **Rendering architecture / 渲染架构**
  - Instanced meshes for large-volume particle rendering.
  - Selective matrix updates to reduce unnecessary per-frame overhead.

- **Interaction architecture / 交互架构**
  - Gesture stabilization across frames to reduce accidental mode switching.
  - Mode transitions with interpolation and inertia-based rotation behavior.

- **State management / 状态管理**
  - Centralized app state via Zustand for mode, gesture, hand position, photos, and focus index.

- **Media pipeline / 媒体流程**
  - Camera stream + canvas overlay + landmark inference feedback.

---

## 🏗️ Tech Stack / 技术栈

- **Frontend**: React, TypeScript, Vite
- **3D**: three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- **AI Vision**: @mediapipe/hands
- **State**: Zustand

---

## 🚀 Getting Started / 本地运行

### Prerequisites / 环境要求
- Node.js 18+
- npm

### Install & Run / 安装与启动

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

在浏览器打开 `http://localhost:5173`。

### Build / 生产构建

```bash
npm run build
npm run preview
```

---

## 🎮 Interaction Guide / 交互说明

1. Open the page and allow camera access.
2. Click **Add Photo** to upload one or more images.
3. Use hand gestures to switch modes:
   - Fist → Tree
   - Open hand → Exploded
   - Pinch (while exploded) → Focus
4. (Optional) Tap/click the page to start background music.

---

## ⚠️ Notes / 注意事项

- Camera permission is required for gesture interaction.
- Gesture recognition quality depends on lighting and camera positioning.
- This project is optimized for modern desktop browsers.

---

## 📌 Project Positioning / 项目定位

This project demonstrates how to combine browser-side AI perception, real-time 3D rendering, and interaction design into a complete, demo-ready experience.

该项目展示了如何将浏览器端 AI 感知、实时 3D 渲染与交互设计整合为一个可演示的完整体验。
