# Interactive Gesture-Controlled 3D Christmas Tree / 手势交互 3D 圣诞树

An interactive browser experience that combines 3D real-time rendering, hand gesture recognition, and photo storytelling. Users can upload photos, control scene states with hand gestures, and navigate visual focus in an immersive festive environment.

一个融合了 3D 实时渲染、手势识别与照片叙事的浏览器交互项目。用户可上传照片，通过手势切换场景状态，并在沉浸式节日氛围中进行视觉聚焦。

---

## 🎬 Demo / 演示

* **Live Demo**: christmas-tree-phi-seven.vercel.app
* **Demo Video (Bilibili)**: https://www.bilibili.com/video/BV1XALD6TETr/

> **Tip**: For the best experience, allow camera access and use a desktop browser.

---

* **在线体验**: christmas-tree-phi-seven.vercel.app
* **演示视频 (Bilibili)**: https://www.bilibili.com/video/BV1XALD6TETr/

> **提示**：建议在桌面端浏览器中体验，并允许摄像头权限。

---

## ✨ Features / 功能亮点

1. **Gesture-driven scene states**
* **Fist**: Tree mode (particles cluster into a tree shape).
* **Open hand**: Exploded mode (particles disperse).
* **Pinch**: Focus mode (zooms in on photos).
2. **Photo-integrated visual storytelling**
* Upload personal photos and place them into the 3D composition.
* In focus mode, the system selects and enlarges the photo closest to the screen center.
3. **Real-time 3D atmosphere**
* Built with React Three Fiber, Drei, and Postprocessing.
* Includes layered foliage particles, ornaments, light spirals, star glow, and cinematic lighting.
4. **Robust hand-tracking initialization**
* MediaPipe Hands singleton initialization.
* SIMD capability detection with non-SIMD fallback for wider device compatibility.

---

1. **手势驱动场景状态**
* **握拳**：树形模式（粒子聚合成圣诞树）。
* **张手**：爆炸模式（粒子散开）。
* **捏合**：聚焦模式（放大查看照片）。
2. **照片融合式视觉表达**
* 支持上传个人照片并将其置于 3D 场景空间中。
* 在聚焦模式下，系统会自动识别并放大处于视野中心区域的照片。
3. **实时 3D 氛围构建**
* 基于 React Three Fiber + Drei + Postprocessing 构建。
* 包含层叠叶片粒子、装饰挂件、螺旋灯带和辉光效果。
4. **稳健的手势识别**
* MediaPipe Hands 单例初始化。
* 支持 SIMD 检测及非 SIMD 降级方案，提高设备兼容性。

---

## 🧠 Technical Highlights / 技术要点

* **Rendering architecture**: Instanced meshes for high-volume particle rendering, and selective matrix updates to reduce per-frame CPU-to-GPU overhead.
* **Interaction architecture**: Gesture stabilization across frames to reduce accidental trigger switching. Smooth transitions implemented via interpolation and inertia-based rotation.
* **State management**: Centralized state management via Zustand for coordinate mapping, current gesture, UI transitions, and active photo focus index.
* **Media pipeline**: Smooth mapping from camera stream and canvas overlays to landmark inference feedback.

---

* **渲染架构**：采用实例化网格（Instanced Mesh）进行大批量粒子渲染，配合选择性矩阵更新，降低每帧的 CPU-GPU 传输开销。
* **交互架构**：设计了跨帧手势平滑机制，减少误触和状态跳变。通过插值与惯性旋转算法实现平滑的过渡效果。
* **状态管理**：使用 Zustand 集中管理应用状态，包括手势识别结果、空间坐标映射、场景切换状态及当前聚焦的照片索引。
* **媒体流程**：打通摄像头输入、画布密集层与手势关键点推理的数据流，保证低延迟交互。

---

## 🏗️ Tech Stack / 技术栈

* **Frontend**: React, TypeScript, Vite
* **3D**: three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing
* **AI Vision**: @mediapipe/hands
* **State**: Zustand

---

## 🚀 Getting Started / 本地运行

### Prerequisites

* Node.js 18+
* npm

### 环境要求

* Node.js 18+
* npm

---

### Install & Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 安装与启动

```bash
npm install
npm run dev
```

在浏览器中打开 `http://localhost:5173`。

---

### Build

```bash
npm run build
npm run preview
```

### 生产构建

```bash
npm run build
npm run preview
```

---

## 🎮 Interaction Guide / 交互说明

1. Open the page and grant camera permission when prompted.
2. Click **Add Photo** to upload one or more local images.
3. Show your hand to the camera to trigger different modes:
* **Fist** → Transforms particles into a Christmas Tree.
* **Open hand** → Scatters particles into an exploded state.
* **Pinch** (while in exploded state) → Zooms into the central photo.
4. (Optional) Click anywhere on the screen to play the background music.

---

1. 打开网页并授权浏览器访问摄像头。
2. 点击 **Add Photo** 按钮上传一张或多张本地照片。
3. 面对摄像头展示手势以控制场景：
* **握拳** → 粒子聚合为圣诞树。
* **张手** → 粒子向外散开。
* **捏合**（在散开状态下） → 自动镜头对焦至中心照片。
4. （可选）点击页面任意位置可开启背景音乐。

---

## ⚠️ Notes / 注意事项

* A working camera is required for the gesture recognition features.
* Tracking precision is affected by ambient lighting conditions and camera angles.
* This project is optimized for modern desktop browsers.

---

* 手势识别功能需依赖摄像头权限。
* 识别准确度受环境光照、拍摄角度等物理因素影响。
* 本项目针对现代桌面端浏览器进行了优化。

---

## 📌 Project Positioning / 项目定位

This project demonstrates how to combine browser-side AI perception, real-time 3D rendering, and interaction design into a complete, demo-ready experience.

该项目展示了如何将浏览器端 AI 感知、实时 3D 渲染与交互设计整合为一个可演示的完整体验。