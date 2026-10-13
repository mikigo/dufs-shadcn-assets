# dufs-shadcn-assets 设计方案

## 概述

为 [dufs](https://github.com/sigoden/dufs) 文件服务器提供一套 React + shadcn/ui 的前端 UI 主题。作为独立开源项目，通过 dufs 的 `--assets` 参数使用，不修改 dufs 源代码。

## 架构布局

双面板文件管理器布局：

```
┌──────────────────┬──────────────────────────────────────────┐
│  左侧面板 (可调宽)  │  右侧主区域                                 │
│                  │  ┌──────────────────────────────────────┐ │
│  📁 文件树        │  │ 面包屑导航  │ 搜索栏 │ 🔧工具栏        │ │
│  ├─ docs/        │  ├──────────────────────────────────────┤ │
│  │  ├─ api/      │  │                                      │ │
│  │  └─ guide.md  │  │  目录模式：文件/目录列表表格              │ │
│  ├─ src/         │  │  或                                    │ │
│  │  ├─ main.js   │  │  文件模式：内容预览（文本/图片/音视频）     │ │
│  │  └─ utils.js  │  │                                      │ │
│  └─ README.md    │  │                                      │ │
│                  │  └──────────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────────┘
```

- 左侧：可折叠、可拖拽调整宽度的文件树，子树懒加载
- 右侧顶部：面包屑 + 搜索 + 操作工具栏
- 右侧内容区：目录表格（选中目录时）或文件预览（选中文件时）

## 数据流

```
dufs HTTP 后端 (不修改)
    │  GET /dir/ → HTML (内含 __INDEX_DATA__)
    │  GET /file  → 原始文件
    ▼
dufsApi 数据层
    │  fetchDir(path) → { paths, allow_upload, ... }
    │  fetchFileContent(path) → text|binary
    │  upload / delete / move / mkcol / checkAuth
    ▼
React Context (状态管理)
    │  fileTree: Map<path, TreeNode>
    │  currentDir: PathItem[]
    │  selectedPath: string | null
    │  auth: { isAuth, user, ... }
    ▼
UI 组件层
    FileTree / DirTable / FilePreview / Toolbar / Dialogs
```

**文件树懒加载机制：**
1. 初始加载：解析主 HTML 的 `__INDEX_DATA__` 获取根目录数据
2. 展开节点：`fetchDir(nodePath)` 获取子目录内容
3. 已展开节点缓存，不重复请求

## 功能清单

### 复用 dufs 全部现有功能

| 功能 | 实现方式 |
|------|---------|
| 文件/目录列表 + 排序(Name/Mtime/Size) | shadcn Table 组件 |
| 面包屑导航 | shadcn Breadcrumb |
| 搜索 | shadcn Input + URL 参数 `?q=` |
| 文件上传（文件选择 + 拖拽 + 进度条） | shadcn Progress + XMLHttpRequest |
| 删除文件/目录 | shadcn AlertDialog 确认 |
| 移动/重命名 | shadcn Dialog + Input |
| 新建文件夹 | prompt → MKCOL |
| 新建文件 | prompt → PUT |
| 文本编辑器（保存） | shadcn Textarea |
| 文件下载（含 token） | shadcn Button |
| 暗色/亮色模式 | Tailwind dark: + shadcn 内置 |
| 登录/登出 | CHECKAUTH + LOGOUT |
| 目录打包下载 (.zip) | ?zip 参数 |
| 文件视图（只读） | 文本展示或 iframe |
| 空目录/搜索无结果提示 | Empty 状态 |

### 新增功能

| 功能 | 说明 |
|------|------|
| 左侧文件树面板 | 递归展示目录结构，懒加载展开 |
| 右侧预览面板 | 选中树节点中的文件 → 预览内容 |
| 双击目录进入 | 右侧表格中双击目录 → 进入该目录 |
| 面板宽度可调 | 左侧面板可拖拽调整宽度 |
| 文件格式预览 | 文本文件直接显示，图片/PDF/音视频 via iframe，其他提示不支持 |

## 组件树

```
App
├─ ResizablePanelGroup
│   ├─ Sidebar
│   │   ├─ SidebarHeader (logo/标题)
│   │   ├─ FileTree
│   │   │   └─ TreeNode (递归) ─── 懒加载子节点
│   │   └─ SidebarToggle (折叠按钮)
│   └─ MainPanel
│       ├─ Toolbar
│       │   ├─ Breadcrumb
│       │   ├─ SearchBar
│       │   ├─ UploadButton
│       │   ├─ NewFolderButton
│       │   ├─ NewFileButton
│       │   ├─ ThemeToggle (暗色切换)
│       │   └─ AuthButton (Login / Logout + 用户名)
│       └─ ContentArea
│           ├─ [DirMode]  DirTable (排序表格)
│           ├─ [FileMode] FilePreview
│           │   ├─ TextPreview (代码/文本)
│           │   └─ MediaPreview (图片/音视频/PDF iframe)
│           └─ EmptyState (空目录/无结果)
├─ DeleteDialog (确认删除)
├─ MoveRenameDialog (移动/重命名)
├─ UploadProgressSheet (上传进度列表)
└─ LoginDialog (认证)
```

## 技术栈

| 层面 | 选择 | 原因 |
|------|------|------|
| 框架 | React 18 + TypeScript | |
| 构建 | Vite | 快速 HMR，单文件输出插件 |
| UI 库 | shadcn/ui (Radix + Tailwind) | |
| 图标 | lucide-react | shadcn 默认 |
| 状态 | React Context (useReducer) | 无需额外依赖 |
| 单文件 | vite-plugin-singlefile | JS/CSS 全内联到 index.html |
| 包管理 | pnpm | |

## 构建 & 集成

```
源码 → Vite build → vite-plugin-singlefile → dist/index.html (单文件)
```

**产物目录 `dist/`：**
- `index.html` — 单文件，内嵌所有 JS + CSS
- `favicon.ico` — 从 dufs 原始 assets 复制

**使用方式：**
```bash
dufs ./serve-path --assets ./dist
```

**本地开发：**
```bash
pnpm dev    # Vite 开发服务器，无需 dufs
```

## 项目结构

```
dufs-shadcn-assets/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx              # 入口
│   ├── App.tsx               # 布局 + 路由状态
│   ├── api/
│   │   └── dufs.ts           # dufs HTTP API 封装
│   ├── context/
│   │   └── AppContext.tsx     # 全局状态
│   ├── hooks/
│   │   ├── useFileTree.ts    # 文件树状态
│   │   ├── useDirData.ts     # 当前目录数据
│   │   └── useAuth.ts        # 认证
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainPanel.tsx
│   │   │   └── ResizablePanel.tsx
│   │   ├── file-tree/
│   │   │   ├── FileTree.tsx
│   │   │   └── TreeNode.tsx
│   │   ├── dir-table/
│   │   │   └── DirTable.tsx
│   │   ├── file-preview/
│   │   │   ├── FilePreview.tsx
│   │   │   ├── TextPreview.tsx
│   │   │   └── MediaPreview.tsx
│   │   ├── toolbar/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ActionButtons.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── AuthButton.tsx
│   │   ├── dialogs/
│   │   │   ├── DeleteDialog.tsx
│   │   │   ├── MoveRenameDialog.tsx
│   │   │   ├── UploadProgressSheet.tsx
│   │   │   └── LoginDialog.tsx
│   │   └── ui/                # shadcn 组件
│   ├── lib/
│   │   └── utils.ts           # cn(), formatFileSize 等
│   ├── types/
│   │   └── dufs.ts            # dufs 数据类型
│   └── index.css              # Tailwind + shadcn 主题变量
├── index.html                 # Vite 入口 HTML
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json            # shadcn 配置
└── package.json
```