<p align="center">
  <img src="./logo.png" style="width: 200px;">
  <h1 align="center">RepoPress</h1>
  <p align="center">为 Git 文档仓库提供在线编辑能力的轻量级 CMS。</p>
</p>


<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8+-3776AB?logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js" alt="Vue">
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue" alt="License">
</p>

---

## 项目简介

**RepoPress** 是搭建在静态文档站点和 Git 仓库之间的一层 CMS。它让非开发人员可以在浏览器中编辑 Markdown/MDX 文档、实时预览效果、一键保存提交——不需要接触 Git CLI，不需要了解分支和 PR 流程。

### 面向用户

使用 VitePress、Rspress、Docusaurus、MkDocs Material 等静态站点生成器的文档团队。当文档贡献者不熟悉 Git 工作流时，RepoPress 提供了零门槛的在线编辑体验。

### 核心价值

- **Git 是唯一数据源。** RepoPress 不存储文档内容——所有文档始终在用户的 Git 仓库中。服务端数据库仅管理用户账户、角色权限和仓库连接配置。
- **零侵入。** 不需要改动文档项目的目录结构、构建流程或 SSG 配置。接入 RepoPress 后，原有的 CI/CD 和部署流程完全不受影响。
- **一键保存。** 在浏览器中编辑文档，`Ctrl+S` 保存，自动完成 pull → rebase → commit → push。有冲突自动中止并提示。

---

## 技术栈

| 层 | 选型 |
|--- |--- |
| 前端框架 | Vue 3 + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 编辑器 | CodeMirror 6 |
| Markdown 渲染 | markdown-it |
| UI 组件库 | Naive UI |
| CSS 引擎 | UnoCSS |
| 后端框架 | FastAPI |
| ORM | Tortoise-ORM |
| 数据校验 | Pydantic v2 |
| 数据库 | SQLite |
| Git 操作 | asyncio subprocess |
| 认证 | JWT + bcrypt |

---

## 项目结构

```
repopress/
├── server/                    FastAPI 后端
│   ├── cli.py                 CLI 入口（start / stop / restart / createsuperuser）
│   ├── main.py                应用工厂与生命周期管理
│   ├── config.py              配置管理（REPOPRESS_ 环境变量）
│   ├── middleware.py           中间件（CORS / JWT 鉴权 / 频率限制 / 请求日志）
│   ├── models.py              Tortoise-ORM 数据模型
│   ├── schemas.py             Pydantic v2 请求与响应模型
│   ├── services.py            业务逻辑（认证 / 管理 / 文档 / 目录树）
│   ├── repo.py                Git 操作层（LocalGitProvider + 抽象基类）
│   └── routers/               路由模块（auth / admin / docs）
├── web/                       Vue 3 前端
│   └── src/
│       ├── views/             页面（Login / Editor / User / Setting）
│       ├── components/        组件（AppHeader / AppSidebar / FileTree /
│       │                        MarkdownEditor / PreviewPanel / BackToEditor）
│       ├── stores.ts          Pinia 状态管理
│       ├── router.ts          路由与守卫
│       ├── composables.ts     组合式函数
│       └── api.ts             HTTP 客户端
└── integrations/
    └── rspress/               Rspress EditLink 组件
```

---

## 功能特性

- **在线编辑** — CodeMirror 6 驱动的 Markdown/MDX 编辑器，支持语法高亮、自动补全和格式化工具栏（加粗、斜体、标题、链接、图片、代码块、列表、引用）。
- **实时预览** — 右侧分屏 Markdown 渲染，输入即时刷新。支持标题、列表、代码块、表格、引用等元素。
- **一键保存** — `Ctrl+S` 触发 `pull --rebase` → 写入文件 → `commit` → `push`。冲突自动检测并提示，未提交的本地修改自动 stash。
- **文件管理** — 侧边栏文件树，支持展开收起、新建和删除文件/目录。目录展开状态跨会话持久化。
- **文件过滤** — 管理员可为每个仓库配置隐藏的文件后缀（如 `.pdf`、`.png`、`.zip`），全局生效。
- **权限控制** — 三级角色（Admin / Editor / Viewer），支持目录级权限粒度和用户组。
- **灵活鉴权** — `authenticated` 模式需 JWT 登录，`open` 模式免登录。
- **面板拖拽** — 文件树、编辑区和预览区之间可通过分隔条自由调整宽度，编辑器与预览滚动同步。
- **多仓库支持** — 单个 RepoPress 实例可管理多个文档仓库，各自独立配置。
- **状态恢复** — 刷新页面后自动恢复上次打开的文件和编辑内容。
- **单窗口编辑** — 内置 EditLink 组件确保文档页面与编辑器之间始终在同一窗口切换。

---

## 本地开发

### 环境要求

- Python 3.8+
- Node.js 18+
- Git

### 安装

```bash
git clone https://github.com/your-org/repopress.git
cd repopress
```

### 启动后端

```bash
cd server
pip install -e .
python -m cli start
```

API 服务启动在 `http://0.0.0.0:8000`。首次运行时自动创建 SQLite 数据库、初始化默认角色，若无用户则提示创建管理员。

### 启动前端

```bash
cd web
npm install
npm run dev
```

开发服务器启动在 `http://localhost:5173`，支持热更新，API 请求自动代理至后端。

### 环境变量

所有配置通过环境变量设置，前缀 `REPOPRESS_`。可在 `server/` 目录下创建 `.env` 文件或直接导出：

```bash
# 服务
REPOPRESS_HOST=0.0.0.0
REPOPRESS_PORT=8000

# 数据库
REPOPRESS_DATABASE_URL=sqlite://data/repopress.db

# 认证（JWT_SECRET 未设置时自动生成并持久化到 data/.jwt_secret）
REPOPRESS_AUTH_MODE=authenticated      # "authenticated" | "open"
REPOPRESS_JWT_SECRET=
REPOPRESS_JWT_EXPIRE_MINUTES=1440      # Token 有效期（分钟），默认 24h
```

---

## 线上部署

### 生产构建

```bash
# 构建前端（直接输出到 server/static/）
cd web
npm install
npm run build

# 安装后端
cd ../server
pip install -e .

# 启动
python -m cli start
```

FastAPI 同时托管 API 和前端 SPA（从 `server/static/` 提供服务），无需额外的静态文件服务器。

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name repopress.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 接入文档站点

1. 管理员登录 RepoPress，进入 **Setting → Repositories → Add Repository**，添加文档仓库。记录仓库列表中显示的 **Repo ID**。

2. 将 EditLink 组件复制到文档项目中：

   ```bash
   mkdir -p theme/components/EditLink
   cp integrations/rspress/EditLink.tsx theme/components/EditLink/index.tsx
   ```

3. 在 `theme/index.tsx` 中注册：

   ```tsx
   import { EditLink } from './components/EditLink';
   export { EditLink };
   export * from '@rspress/core/theme-original';
   ```

4. 在 SSG 配置中添加 editLink：

   ```typescript
   // rspress.config.ts
   themeConfig: {
     editLink: {
       docRepoBaseUrl: 'https://repopress.example.com/editor/<repo-id>/docs',
     },
   }
   ```

5. 重新构建文档站点。每个页面底部将出现编辑链接，点击后在同一窗口打开 RepoPress 编辑器。

其他 SSG 的 editLink 配置方式：

| SSG | 配置位置 |
|--- |--- |
| VitePress | `themeConfig.editLink.pattern` |
| Docusaurus | `presets.docs.editUrl` |
| MkDocs Material | `edit_uri` |

---

## API

### 文档

| 方法 | 路径 | 说明 |
|--- |--- |--- |
| `GET` | `/api/docs/tree` | 文件目录树 |
| `GET` | `/api/docs/{path}` | 获取文件内容 |
| `POST` | `/api/docs/save` | 创建 / 更新文件 |
| `DELETE` | `/api/docs/{path}` | 删除文件 |
| `POST` | `/api/docs/rename` | 重命名 / 移动文件 |
| `GET` | `/api/docs/{path}/history` | 文件提交历史 |

### 认证

| 方法 | 路径 | 说明 |
|--- |--- |--- |
| `POST` | `/api/auth/login` | 登录 |
| `POST` | `/api/auth/logout` | 登出 |
| `GET` | `/api/auth/user` | 当前用户信息 |

### 管理

| 方法 | 路径 | 说明 |
|--- |--- |--- |
| `GET` | `/api/admin/repos` | 仓库列表 |
| `POST` | `/api/admin/repos` | 添加仓库 |
| `PUT` | `/api/admin/repos/{id}` | 更新仓库 |
| `DELETE` | `/api/admin/repos/{id}` | 删除仓库 |
| `GET` | `/api/admin/users` | 用户列表 |
| `POST` | `/api/admin/users` | 创建用户 |
| `PUT` | `/api/admin/users/{id}` | 更新用户 |
| `GET` | `/api/admin/permissions` | 权限列表 |
| `PUT` | `/api/admin/permissions` | 更新权限 |

---

## License

[Apache 2.0](LICENSE)
