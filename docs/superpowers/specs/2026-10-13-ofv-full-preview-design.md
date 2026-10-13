# dufs-shadcn-assets 全格式文件预览集成方案

## 概述

集成 [Open File Viewer](https://github.com/xushanpei/open-file-viewer)（MIT 协议）为 dufs 前端提供全格式文件预览能力，覆盖 Office、PDF、图片、音视频、压缩包、3D、CAD、GIS 等 17 类文件格式。

## 目标

- 新增 Office（doc/docx/xls/xlsx/ppt/pptx）预览能力
- 替换现有 iframe 方式的图片/视频/音频/PDF 预览为功能更丰富的 OFV 渲染
- 新增压缩包、邮件、EPUB、DrawIO、思维导图等格式预览
- 保留现有文本预览（highlight.js + GBK 编码支持）和 README.md 预览（react-markdown）

## 技术选型

| 项目 | 选择 |
|------|------|
| 预览引擎 | `@open-file-viewer/core` v1.0.0 |
| 调用方式 | imperative `createViewer()` API（非 React 组件封装） |
| PDF 渲染 | `pdfjs-dist`（OFV pdfPlugin 依赖） |
| CAD 渲染 | 仅 LibreDWG SVG 路径（排除 GPL 的 webglDwg + `@mlightcad/*`） |
| 构建 | 保持 `vite-plugin-singlefile` 单文件输出 |

## 架构变更

```
FilePreview.tsx
  ├── TextPreview        → 保留：文本/代码/日志（highlight.js + GBK）
  ├── ReadmePreview      → 保留：目录下 README.md（react-markdown）
  └── OfvPreview         → 新增：接管其余所有格式
        ├── imagePlugin      → 图片预览（替换 iframe）
        ├── pdfPlugin        → PDF 预览（替换 iframe，支持搜索/缩放/打印）
        ├── videoPlugin      → 视频预览（替换 iframe）
        ├── audioPlugin      → 音频预览（替换 iframe）
        ├── officePlugin     → Office 文档预览（新增）
        ├── archivePlugin    → 压缩包内容浏览（新增）
        ├── emailPlugin      → 邮件预览（新增）
        ├── epubPlugin       → EPUB 电子书预览（新增）
        ├── ofdPlugin        → OFD 文档预览（新增）
        ├── xpsPlugin        → XPS 文档预览（新增）
        ├── drawingPlugin    → DrawIO 图纸预览（新增）
        ├── xmindPlugin      → 思维导图预览（新增）
        ├── model3dPlugin    → 3D 模型预览（新增）
        ├── cadPlugin        → CAD 图纸预览（新增）
        ├── gisPlugin        → 地理数据预览（新增）
        ├── assetPlugin      → PSD/TTF/IPYNB 等资产预览（新增）
        └── textPlugin       → 兜底文本渲染
```

## 文件变更清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| **新增** | `src/components/file-preview/OfvPreview.tsx` | OFV imperative API 封装组件，管理 viewer 生命周期 |
| **修改** | `src/components/file-preview/FilePreview.tsx` | 添加 OfvPreview 分支，替换 MediaPreview + 空状态 |
| **修改** | `src/api/dufs.ts` | 调整格式判断逻辑（新增 ofvFormats 集合） |
| **修改** | `vite.config.ts` | 处理 pdf.js worker 路径 |
| **保留** | `src/components/file-preview/TextPreview.tsx` | 不变 |
| **保留** | `src/components/file-preview/ReadmePreview.tsx` | 不变 |
| **删除** | `src/components/file-preview/MediaPreview.tsx` | 被 OfvPreview 替代 |
| **新增依赖** | `package.json` | `@open-file-viewer/core` + `pdfjs-dist` |

## OfvPreview 组件设计

### 核心逻辑

```tsx
// OfvPreview.tsx 结构
interface Props {
  filePath: string  // dufs 文件 URL（如 /dir/file.docx）
}

function OfvPreview({ filePath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<FileViewer | null>(null)

  useEffect(() => {
    // 1. 创建 viewer 实例
    // 2. 传入 file: filePath（URL 字符串，需 dufs 允许 CORS）
    // 3. 注册全部 17 个插件
    // 4. 返回 destroy 清理函数
  }, [filePath])

  return <div ref={containerRef} className="h-full w-full" />
}
```

### Viewer 配置

- `container`: DOM ref
- `file`: dufs 文件 URL 字符串
- `fileName`: 从 URL 提取的文件名（用于扩展名检测）
- `height`: `"100%"`
- `width`: `"100%"`
- `plugins`: 17 个插件按优先级排列
- `theme`: `"auto"`（跟随系统）
- `toolbar`: `true`（使用 OFV 内置工具栏）

### 插件注册顺序

按 OFV 建议：特定格式插件在前，通用插件在后。

```
officePlugin → pdfPlugin → videoPlugin → audioPlugin → imagePlugin
→ model3dPlugin → cadPlugin → gisPlugin → archivePlugin
→ emailPlugin → epubPlugin → ofdPlugin → xpsPlugin
→ drawingPlugin → xmindPlugin → assetPlugin → textPlugin
```

## 构建策略

### pdf.js Worker 处理

`pdfPlugin` 需要 `workerSrc` 参数指向 pdf.js worker 文件。`vite-plugin-singlefile` 会将所有资源内联到单个 HTML，worker 需要通过特殊方式处理：

- 使用 `pdfjs-dist/build/pdf.worker.min.mjs?url` 获取 worker URL
- 如果 singlefile 不支持 `?url` 外部引用，则在构建完成后将 worker 代码内联为 Blob URL
- 备选方案：使用 `?worker&inline` 导入或直接内联 worker 代码字符串

### CSS 处理

- OFV 的 `style.css` (135KB) 通过 `import "@open-file-viewer/core/style.css"` 引入
- `vite-plugin-singlefile` 将 CSS 内联到 `<style>` 标签

### CAD 依赖排除

- **不安装** `@mlightcad/cad-simple-viewer`、`@mlightcad/data-model`、`@mlightcad/libredwg-web`（GPL 协议）
- `cadPlugin` 仅使用内置的 DXF 文本解析 + LibreDWG SVG 基础路径
- `model3dPlugin` 依赖 `three.js`（已包含在 OFV core 依赖中）

## 体积估算

| 依赖 | gzip 估计 | 说明 |
|------|-----------|------|
| three.js | ~600KB | 3D 模型渲染 |
| pdfjs-dist | ~300KB | PDF 渲染 |
| jszip | ~50KB | Office/压缩包解压 |
| mammoth + docx-preview | ~40KB | Office 渲染 |
| xlsx (SheetJS) | ~60KB | Excel 解析 |
| leaflet | ~40KB | 地图渲染 |
| prismjs + marked | ~30KB | 文本高亮 |
| mermaid | ~200KB | 图表渲染 |
| 其他依赖 | ~100KB | hls.js, pako, etc. |

当前产物 ~4.8MB，预估增量 ~1.5-1.8MB，最终约 6.3-6.6MB。

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| pdf.js worker 与 singlefile 不兼容 | 备选方案：动态创建 Blob Worker 或 CDN 加载 |
| OFV CSS 与现有 Tailwind 冲突 | OFV 使用 `.ofv-` 前缀，冲突可能性低 |
| dufs CORS 限制导致远程 URL 加载失败 | dufs 同源部署，无 CORS 问题 |
| 旧 Office 格式（.doc/.xls/.ppt）兼容性 | officePlugin 已声明支持，实际走 legacy 解析路径 |
| 构建体积过大 | 可接受，用户已确认 |
| GPL 协议污染 | 不引入 `@mlightcad/*` |

## 验收标准

- [ ] 点击 .docx 文件，OFV 渲染 Office 文档内容
- [ ] 点击 .xlsx 文件，OFV 渲染表格内容
- [ ] 点击 .pptx 文件，OFV 渲染幻灯片内容
- [ ] 点击 .pdf 文件，OFV 渲染 PDF（替换原 iframe）
- [ ] 点击 .zip 文件，OFV 展示压缩包内文件列表
- [ ] 点击 .eml 文件，OFV 渲染邮件内容
- [ ] 点击 .glb 文件，OFV 渲染 3D 模型
- [ ] 点击 .txt 文件，仍使用原有 TextPreview（不退化）
- [ ] 点击目录，README.md 仍使用原有 ReadmePreview
- [ ] 构建产物 `dist/index.html` 正常工作
- [ ] 暗色/亮色模式切换正常
- [ ] 编译无 TypeScript 错误