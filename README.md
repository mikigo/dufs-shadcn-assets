<p align="center">
  <img src="public/logo.svg" alt="Logo" width="64" />
</p>

# dufs-shadcn-assets

> **dufs 的前端主题项目** — 通过 `dufs --assets` 替换 dufs 内置 UI 的现代化文件管理界面。

基于 [shadcn/ui](https://ui.shadcn.com/)构建。文件预览能力由 Open File Viewer 提供，覆盖 30+ 种文件格式。

## 亮点

- **1132 个 vscode-icons 文件图标** — 自动识别 599 种扩展名 + 1923 种文件名 + 524 种文件夹名，媲美 VS Code 的文件图标体验
- **双视图模式** — 图标视图 / 列表视图自由切换，可通过 `config.json` 配置默认模式
- **富媒体文件预览** — 支持 Office 文档、PDF、图片、视频、音频、3D 模型、CAD、GIS 地图、电子书、压缩包等 30+ 格式在线预览
- **侧边栏文件树** — 虚拟滚动 + 懒加载 + 自动跟随导航展开选中，大数据量目录也流畅
- **Vercel Geist 风格** — 深浅色双主题，手动切换 / 跟随系统偏好，CSS 变量体系完备
- **完全离线可用** — 单文件构建，所有资源内联，无任何 CDN 依赖
- **上传增强** — 队列串行上传、断点续传、文件夹递归拖拽、离开保护、上传前认证检查
- **品牌可定制** — Logo、标题、颜色、默认视图全部通过 `config.json` 配置，运行时生效

## 快速开始

从 [Releases](../../releases) 页面下载最新的 `dufs-shadcn-assets.zip`，解压后直接使用：

```bash
# 解压到任意目录，例如 ./assets
unzip dufs-shadcn-assets.zip -d ./assets

# 启动 dufs，指定 assets 目录
./dufs ./serve-path --assets ./assets
```

## 特性一览

### 文件管理与导航

- **侧边栏文件树** — 虚拟滚动树形目录，懒加载子节点，自动跟随浏览位置展开并选中
- **面包屑导航** — 分段路径点击跳转，支持中文路径，Home 图标一键回根
- **搜索** — 居中搜索栏，后端 `?q=` 查询，URL 参数持久化
- **SPA 路由** — `pushState` + `popstate`，浏览器前进后退完整支持

### 文件操作

| 操作 | 说明 |
|------|------|
| 上传 | 多文件选择 / 拖拽上传 / 文件夹递归拖拽 |
| 下载 | 单文件下载 / 目录 ZIP 打包下载 / 认证 token 自动生成 |
| 新建 | 创建文件夹 (MKCOL) / 创建文件 (PUT) |
| 删除 | 确认对话框，操作后自动刷新 |
| 移动/重命名 | 对话框输入新路径，MOVE 方法 + 目标确认 |
| 刷新 | 工具栏一键刷新当前目录 |

### 上传增强

- **队列串行** — 多文件上传按顺序逐一处理，避免并发问题
- **断点续传** — 失败后 HEAD 获取已传字节，PATCH + `X-Update-Range: append` 续传
- **文件夹拖拽** — `webkitGetAsEntry` 递归遍历，自动 MKCOL 创建子目录后上传
- **离开保护** — 上传进行中 `beforeunload` 阻止页面关闭
- **认证预检** — 上传前自动 `CHECKAUTH` 检验认证状态

### 文件预览

- **文本/代码** — highlight.js 语法高亮，30+ 语言支持，智能 UTF-8/GBK 编码检测
- **Markdown** — 目录下 README.md 自动渲染，GFM 表格/任务列表/代码块完整支持
- **富媒体预览 (OFV)** — 基于 [Open File Viewer](https://github.com/shinokada/open-file-viewer)，支持 Office 文档 (.docx/.pptx/.xlsx)、PDF、图片 (.png/.jpg/.gif/.webp/.svg/.psd)、视频 (.mp4/.mkv/.mov/.avi)、音频 (.mp3/.wav/.ogg)、3D 模型 (.glb/.gltf)、CAD (.dwg/.dxf)、GIS (.geojson/.kml)、压缩包 (.zip/.tar/.7z/.gz)、电子书 (.epub)、邮件 (.eml)、XMind 思维导图 等 30+ 格式
- **在线编辑** — 可编辑文本文件支持 Ctrl+S 保存、Esc 取消

### 图标系统

从本地 VS Code 扩展解析 `vsicons-icon-theme.json`，构建时自动生成 1132 个图标 + 完整映射表。匹配顺序：

1. 完整文件名匹配（`.gitignore` → `file_type_git`）
2. 双扩展名匹配（`.tar.gz` → `file_type_zip`）
3. 单扩展名匹配（`.js` → `file_type_js`）
4. 常用扩展名回退（65 个硬编码映射）
5. 默认文件图标

特定文件夹名（`.git`、`node_modules`、`src` 等）自动匹配对应的文件夹图标。暗色模式下自动应用亮度/饱和度滤镜保持辨识度。

### 主题系统

- **深浅色双主题** — 工具栏一键切换，手动切换 / 跟随系统偏好自动检测
- **Vercel Geist 风格** — `shadow-as-border` 技巧，精细的圆角和间距
- **Sidebar 独立配色** — 侧边栏与主内容区视觉分离
- **细滚动条** — 6px 主题色滚动条，hover 加深
- **偏好持久化** — `localStorage` 保存主题和侧边栏宽度

### 认证支持

- HTTP Basic Auth 集成
- Login/Logout 按钮，`CHECKAUTH` 方法触发浏览器认证对话框
- 下载时自动生成临时 token
- 上传前认证预检

### Logo / 品牌定制

通过 `config.json` 配置：

```json
{
  "logo_text": "My Server",
  "logo": "./logo.svg",
  "dark_logo": "./dark-logo.svg",
  "logo_size": "32px",
  "logo_text_font_size": "18px",
  "view_mode": "icons"
}
```

支持深浅色双 Logo 自动切换，构建时内联为 Base64，运行时可通过 XHR 覆盖。浏览器标签页标题自动同步。

### 离线支持

- **单文件构建** — `vite-plugin-singlefile` 将所有 JS/CSS/Font/Icon 内联为单个 HTML
- **PDF.js 资源本地化** — cmaps 和 standard_fonts 随构建复制到 dist/
- **Leaflet CSS 本地导入** — GIS 地图预览无 CDN 依赖
- **Logo/Favicon 内联** — 构建时转为 Data URI
- **无外部请求** — 所有资源自包含，断网环境也能完整使用

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 + vite-plugin-singlefile |
| 样式 | Tailwind CSS 3 + shadcn/ui (base-nova) |
| 基础组件 | @base-ui/react (Dialog, Sheet, Progress...) |
| 虚拟滚动 | @tanstack/react-virtual |
| 文件预览 | @open-file-viewer/core + pdfjs-dist + highlight.js + leaflet |
| 图标 | vscode-icons (1132 SVG) + lucide-react |
| 包管理 | pnpm |

## 项目结构

```
src/
├── components/
│   ├── dialogs/       # DeleteDialog, MoveRenameDialog, UploadProgressSheet
│   ├── dir-table/     # DirTable（列表视图）, IconView（图标视图）
│   ├── file-preview/  # FilePreview, TextPreview, EditPreview, OfvPreview, ReadmePreview
│   ├── file-tree/     # FileTree, TreeNode, VscFileIcon
│   ├── layout/        # Sidebar, MainPanel, ResizablePanel, ThemeToggle
│   ├── toolbar/       # Toolbar, Breadcrumb, SearchBar, ActionButtons, AuthButton
│   └── ui/            # 16 个 shadcn/ui 组件，基于 @base-ui/react
├── hooks/             # useFileTree
├── context/           # AppContext（useReducer 全局状态）
├── api/               # dufs API 封装（fetch、上传、断点续传、认证）
├── types/             # TypeScript 类型定义
├── generated/         # 自动生成：vsc-icon-map.ts, vsc-icon-modules.ts
├── assets/            # vsc-icons: 1132 个 SVG 文件
└── lib/               # 工具函数（格式化、编码检测、样式合并）
scripts/
├── generate-vsc-icon-map.mjs  # 解析 vscode-icons 映射 JSON 生成 TypeScript
└── inject-index-data.mjs      # 构建后处理：内联资源、注入配置、复制 PDF.js 数据
```

## 配置 (config.json)

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `logo_text` | string | (空) | 侧边栏标题 / 浏览器标签页标题 |
| `logo` | string | (空) | 浅色模式 Logo 路径 |
| `dark_logo` | string | (空) | 深色模式 Logo 路径 |
| `logo_size` | string | `28px` | Logo 图片尺寸 |
| `logo_text_font_size` | string | `20px` | 标题文字大小 |
| `view_mode` | string | `icons` | 默认视图模式 (`icons` / `list`) |

## License

MIT