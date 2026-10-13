# OFV 全格式文件预览集成 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 集成 Open File Viewer 为 dufs 前端提供全格式文件预览（Office/PDF/图片/音视频/压缩包/3D/CAD/GIS 等），替换现有 iframe 预览方式。

**Architecture:** 新增 `OfvPreview` 组件封装 OFV imperative `createViewer()` API，在 `FilePreview` 中分流：文本文件走现有 `TextPreview`，其余格式统一由 OfvPreview 接管。保留 `ReadmePreview` 不变。

**Tech Stack:** `@open-file-viewer/core` v1.0.0, `pdfjs-dist`, React 19, Vite 8, vite-plugin-singlefile 2.3.3

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 @open-file-viewer/core 和 pdfjs-dist**

```bash
pnpm add @open-file-viewer/core pdfjs-dist
```

- [ ] **Step 2: 验证安装**

```bash
node -e "require('@open-file-viewer/core/package.json').version"
```

Expected: `1.0.0`

- [ ] **Step 3: 检查 package.json 版本更新**

```bash
git diff package.json | head -30
```

Expected: dependencies 中新增了 `@open-file-viewer/core` 和 `pdfjs-dist`。

---

### Task 2: 创建 OfvPreview 组件

**Files:**
- Create: `src/components/file-preview/OfvPreview.tsx`

- [ ] **Step 1: 创建 OfvPreview.tsx**

```tsx
import { useEffect, useRef } from "react"
import {
  createViewer,
  imagePlugin,
  pdfPlugin,
  videoPlugin,
  audioPlugin,
  textPlugin,
  officePlugin,
  archivePlugin,
  emailPlugin,
  epubPlugin,
  ofdPlugin,
  xpsPlugin,
  drawingPlugin,
  xmindPlugin,
  model3dPlugin,
  cadPlugin,
  gisPlugin,
  assetPlugin,
} from "@open-file-viewer/core"
import type { FileViewer } from "@open-file-viewer/core"
import "@open-file-viewer/core/style.css"
import { baseNameFromUrl } from "@/api/dufs"
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import legacyWorkerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"

interface Props {
  filePath: string
}

const plugins = [
  officePlugin(),
  pdfPlugin({ workerSrc, legacyWorkerSrc }),
  videoPlugin(),
  audioPlugin(),
  imagePlugin(),
  model3dPlugin(),
  cadPlugin(),
  gisPlugin(),
  archivePlugin(),
  emailPlugin(),
  epubPlugin(),
  ofdPlugin(),
  xpsPlugin(),
  drawingPlugin(),
  xmindPlugin(),
  assetPlugin(),
  textPlugin(),
]

export function OfvPreview({ filePath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<FileViewer | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const viewer = createViewer({
      container,
      file: filePath,
      fileName: baseNameFromUrl(filePath),
      height: "100%",
      width: "100%",
      plugins,
      theme: "auto",
      toolbar: true,
    })

    viewerRef.current = viewer

    return () => {
      viewer.destroy()
      viewerRef.current = null
    }
  }, [filePath])

  return <div ref={containerRef} className="h-full w-full" />
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

Expected: 无与 `OfvPreview.tsx` 相关的类型错误（可能有 pdfjs-dist worker import 的类型问题，Task 6 处理）。

---

### Task 3: 更新 FilePreview 组件

**Files:**
- Modify: `src/components/file-preview/FilePreview.tsx`

- [ ] **Step 1: 修改 FilePreview.tsx — 替换 MediaPreview 和空状态为 OfvPreview**

将 `FilePreview.tsx` 内容替换为：

```tsx
import { useAppState } from "@/context/AppContext"
import { baseNameFromUrl } from "@/api/dufs"
import { TextPreview } from "./TextPreview"
import { OfvPreview } from "./OfvPreview"

export function FilePreview() {
  const { state } = useAppState()

  if (!state.selectedPath) return null

  const fileName = baseNameFromUrl(state.selectedPath)
  const isTextLike = [".txt", ".md", ".json", ".xml", ".yml", ".yaml", ".toml", ".ini", ".cfg",
    ".conf", ".log", ".csv", ".tsv", ".html", ".htm", ".css", ".js", ".ts", ".tsx", ".jsx",
    ".rs", ".py", ".rb", ".go", ".java", ".c", ".cpp", ".h", ".sh", ".bash", ".zsh",
    ".sql", ".r", ".lua", ".php", ".swift", ".kt", ".scala", ".elm", ".ex", ".exs", ".erl",
    ".hrl", ".hs", ".clj", ".edn", ".dart", ".groovy", ".Makefile", ".Dockerfile",
  ].some(ext => fileName.toLowerCase().endsWith(ext))

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-border/40 text-sm font-medium flex items-center gap-2 bg-background">
        {fileName}
      </div>
      <div className="flex-1 overflow-hidden bg-muted/30">
        {isTextLike ? (
          <TextPreview filePath={state.selectedPath} />
        ) : (
          <OfvPreview filePath={state.selectedPath} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

Expected: 无与 `FilePreview.tsx` 相关的类型错误。

---

### Task 4: 删除 MediaPreview 组件

**Files:**
- Delete: `src/components/file-preview/MediaPreview.tsx`

- [ ] **Step 1: 删除 MediaPreview.tsx**

```powershell
Remove-Item -LiteralPath "src\components\file-preview\MediaPreview.tsx"
```

- [ ] **Step 2: 确认无残留引用**

```powershell
rg "MediaPreview" src/
```

Expected: 无结果（FilePreview.tsx 中已不引用）。

---

### Task 5: 清理 dufs.ts 中不再使用的代码

**Files:**
- Modify: `src/api/dufs.ts`

- [ ] **Step 1: 移除 IFRAME_FORMATS 和 canIframePreview**

删除 `src/api/dufs.ts` 中的以下代码块：

```typescript
// 删除这段（第 170-177 行）：
export const IFRAME_FORMATS = [
  ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg",
  ".mp4", ".mov", ".avi", ".wmv", ".flv", ".webm",
  ".mp3", ".ogg", ".wav", ".m4a",
]

export function canIframePreview(filename: string): boolean {
  return IFRAME_FORMATS.includes(extName(baseName(filename)))
}
```

- [ ] **Step 2: 确认 `extName` 函数未被删除影响**

查看 `extName` 是否仅被 `canIframePreview` 使用。

```powershell
rg "extName" src/api/dufs.ts
```

Expected: 如果 `extName` 只在 `canIframePreview` 中使用（第 176 行），也一并删除；如果被其他地方使用，则保留。

从现有代码看，`extName` 只在 `canIframePreview`（第 176 行）中使用，一并删除。

- [ ] **Step 3: 验证**

```bash
npx tsc --noEmit
```

Expected: 无错误。

---

### Task 6: 处理 vite-plugin-singlefile 兼容性

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: 构建并检查 worker 引用**

先不做任何修改，直接构建看输出：

```bash
pnpm build
```

Expected: 可能有两种结果：
- **成功**：vite-plugin-singlefile 正确内联了 worker，`dist/index.html` 中包含 worker 代码
- **失败/警告**：worker 文件未被内联，或运行时 pdf.js 报错

- [ ] **Step 2: 如果构建成功，使用 dufs 验证**

启动 dufs 测试：

```bash
dufs ./dist --assets ./dist
```

然后浏览器访问测试：
- 点击一个 .docx 文件，检查 OFV 是否正常渲染
- 点击一个 .pdf 文件，检查 PDF 是否正常渲染（pdf.js worker 是否工作）

- [ ] **Step 3: 如果 worker 有问题，使用内联 worker 策略**

修改 `src/components/file-preview/OfvPreview.tsx`，将 `pdfjs-dist` worker import 替换为内联方式：

```tsx
// 删除这两行：
// import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"
// import legacyWorkerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"

// 替换为内联构造函数：
import pdfjsDist from "pdfjs-dist"

const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs?worker&inline")

const plugins = [
  officePlugin(),
  pdfPlugin({
    pdfjs: pdfjsDist,
    workerSrc: URL.createObjectURL(
      new Blob([await fetch(pdfjsWorker).then(r => r.text())], { type: "text/javascript" })
    ),
    useFetchData: true,
  }),
  // ... 其余插件
]
```

然后重新构建验证：

```bash
pnpm build
```

- [ ] **Step 4: 检查 vite build 是否因 GPL 的 @mlightcad 报错**

`cadPlugin` 以默认参数调用（不传 `webglDwg`），不应引用 `@mlightcad` 相关模块。

```bash
pnpm build 2>&1 | Select-String -Pattern "mlightcad|cad-simple-viewer|libredwg-web"
```

Expected: 无匹配结果（未加载 GPL 依赖）。

---

### Task 7: 最终构建验证

**Files:**
- 无新建文件

- [ ] **Step 1: 完整构建**

```bash
pnpm build
```

Expected: 构建成功，输出到 `dist/` 目录。

- [ ] **Step 2: 检查构建产物大小**

```powershell
Get-ChildItem dist\index.html | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,2)}}
```

Expected: 输出 ~6-7 MB（比原来的 4.8MB 大 1-2MB）。

- [ ] **Step 3: Lint 检查**

```bash
pnpm lint
```

Expected: 无新增 lint 错误。

- [ ] **Step 4: 功能测试清单**

启动 dufs 服务进行全格式测试：

```bash
# 准备测试文件目录，启动 dufs
dufs ./test-files --assets ./dist
```

浏览器中依次测试：

| 格式 | 文件 | 预期结果 |
|------|------|----------|
| .txt | test.txt | TextPreview 渲染（highlight.js + GBK） |
| .md | readme.md | TextPreview 渲染 |
| .docx | test.docx | OfvPreview + officePlugin 渲染 |
| .xlsx | test.xlsx | OfvPreview + officePlugin 渲染表格 |
| .pptx | test.pptx | OfvPreview + officePlugin 渲染幻灯片 |
| .pdf | test.pdf | OfvPreview + pdfPlugin 渲染（搜索/缩放可用） |
| .jpg | test.jpg | OfvPreview + imagePlugin 渲染 |
| .mp4 | test.mp4 | OfvPreview + videoPlugin 渲染 |
| .mp3 | test.mp3 | OfvPreview + audioPlugin 渲染 |
| .zip | test.zip | OfvPreview + archivePlugin 展示文件列表 |
| 图片/视频 | 原 iframe 预览的格式 | OfvPreview 替代后显示正常 |

---

### Task 8: 提交

**Files:**
- 所有已修改和新建的文件

- [ ] **Step 1: 检查变更**

```bash
git status
git diff --stat
```

- [ ] **Step 2: 暂存并提交**

```bash
git add package.json pnpm-lock.yaml
git add src/components/file-preview/OfvPreview.tsx
git add src/components/file-preview/FilePreview.tsx
git add src/api/dufs.ts
git add docs/superpowers/specs/2026-10-13-ofv-full-preview-design.md
git add docs/superpowers/plans/2026-10-13-ofv-full-preview-plan.md
git rm src/components/file-preview/MediaPreview.tsx
git commit -m "feat: 集成 Open File Viewer 实现全格式文件预览

- 新增 OfvPreview 组件，封装 OFV createViewer API
- 支持 Office/PDF/图片/音视频/压缩包/EPUB/3D/CAD/GIS 等 17 类格式
- 保留 TextPreview（文本/代码，含 GBK 支持）
- 保留 ReadmePreview（目录下 README 渲染）
- 移除 MediaPreview（iframe 方式，被 OFV 替代）
- 移除 IFRAME_FORMATS 和 canIframePreview"
```

---

### Task 9: PDF Worker 兼容性兜底

如果在 Task 6 中 worker 问题仍未解决，执行此任务。

- [ ] **Step 1: 使用 CDN 方式加载 pdf.js worker**

修改 `OfvPreview.tsx`：

```tsx
// 移除对 pdfjs-dist worker 的 import
// 改为在 pdfPlugin 中不传 workerSrc，让 pdf.js 使用默认 CDN：

const plugins = [
  officePlugin(),
  pdfPlugin({ useFetchData: true }),
  // ... 其余插件
]
```

或者使用 unpkg CDN：

```tsx
const plugins = [
  officePlugin(),
  pdfPlugin({ 
    workerSrc: "https://unpkg.com/pdfjs-dist@5/build/pdf.worker.min.mjs",
    useFetchData: true 
  }),
  // ... 其余插件
]
```

重新构建验证：

```bash
pnpm build
```