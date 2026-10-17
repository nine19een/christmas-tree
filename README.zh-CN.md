**中文** / [ENG](README.md)

# 手势交互 3D 圣诞树

一个把发光的 3D 圣诞树、本地照片、手势和背景音乐组合起来的浏览器演示。添加照片后，可以张手让树散开，再用捏合手势放大查看照片。

[在线体验](https://christmas-tree-phi-seven.vercel.app) · [B 站演示视频](https://www.bilibili.com/video/BV1XALD6TETr/)

![深色背景中的绿色发光圣诞树，树顶有一颗明亮的星星](tree.jpg)

图片和链接均保留自原项目；本次未重新验证远端演示、视频是否可访问，以及是否对应当前版本。

## 体验流程

1. 使用带有可用摄像头的桌面浏览器打开页面，允许摄像头访问以启用手势识别。
2. 点击 **Add Photo**，选择一张本地图片。重复操作可添加多张；当前选择框每次只接收一张图片。
3. 将一只手放在摄像头视野内，按下表切换场景。程序跟踪一只手，手势连续稳定三帧后才触发切换。
4. 点击页面会尝试播放循环背景音乐，实际开始时间受浏览器播放限制影响。

| 手势 | 场景变化 |
| --- | --- |
| 握拳 | 粒子聚合成树形（`TREE`） |
| 张手 | 圣诞树散开（`EXPLODED`） |
| 散开状态下捏合 | 进入照片聚焦（`FOCUS`），放大最靠近屏幕中心的照片 |

也可以用鼠标拖动旋转场景；缩放和平移已禁用。按 **0** 隐藏 **Add Photo** 控件，按 **1** 恢复显示。

照片通过浏览器 object URL 加载，仅保存在页面内存中。当前应用没有照片上传 API、照片集保存或单张删除控制；刷新或关闭页面会丢失已添加的照片。

## 本地运行

使用 **Node.js >=22.12.0** 和 **npm >=10.5.1**。这一范围满足锁定依赖中 Vite、React 插件和 camera-controls 已声明的 engine 要求，并非最低版本实测结论。

```bash
git clone https://github.com/nine19een/christmas-tree.git
cd christmas-tree
npm install
npm run dev
```

打开 Vite 打印的本地地址，通常为 `http://localhost:5173`。仓库没有配置后端服务或 API 密钥。

现有检查与构建命令为：

```bash
npm run lint
npm run build
npm run preview
```

`build` 只运行 `vite build`，将静态资源输出到 `dist`，不执行 TypeScript 类型检查。仓库没有 `test` 脚本。本次文档核对未执行依赖安装、构建、lint、类型检查或浏览器交互；仅使用 Node.js 24.14.0 检查了 `eslint.config.js` 和 `scripts/copy-mediapipe-hands.cjs` 的语法，两项通过。

维护依赖时，可用 `npm run copy:mediapipe-hands` 将已安装 MediaPipe 包内的模型、加载器和二进制文件复制到 `public/mediapipe/hands`，并覆盖现有副本。这是显式维护命令，不是启动必需步骤。

## 实现与限制

界面使用 React 19 和 TypeScript，场景由 Three.js、React Three Fiber、Drei 和 postprocessing 绘制。叶片与装饰物使用实例化网格，形态切换采用插值，旋转带有惯性。Zustand 保存场景、手势和照片状态，MediaPipe Hands 提供手部关键点识别。

- **摄像头与环境：**手势依赖摄像头授权，光照、拍摄角度和设备性能都会影响体验。本次未验证手势准确度、WebGL 性能或移动端兼容性。
- **网络依赖：**页面使用 Tailwind CDN、Google Fonts 和 Drei 的 night 环境资源。即使仓库包含 MediaPipe 资源，也不能据此认为整个演示可离线运行。
- **手势恢复：**代码会检测 SIMD 支持，并包含非 SIMD 路径；SIMD 运行出错后的自动恢复可能无法按预期切换路径。这是源码核对发现的潜在影响，尚未在浏览器中复现。
- **会话内容：**照片没有持久化或导出流程，请另行保留原始图片文件。

## 许可与资源

仓库没有项目许可证，也未明确复用授权；公开可见不代表代码或资源已获复用许可。内置音乐和图片的来源与复用条款仍需确认。第三方库及 MediaPipe 资源适用各自的条款。
