# dufs-shadcn-assets

A modern React + shadcn/ui theme for [dufs](https://github.com/sigoden/dufs) file server.

## Features

- Dual-pane file manager layout (tree + detail)
- File tree with lazy-loading directories
- File preview (text files, images, video/audio, PDF)
- Drag-and-drop upload with progress
- Delete, move/rename, new folder/file
- Search, sorting, breadcrumb navigation
- Dark/light mode
- Auth support (login/logout)

## Usage

```bash
# Build
pnpm install
pnpm build

# Use with dufs
dufs ./serve-path --assets ./dist
```

## Development

```bash
pnpm install
pnpm dev
```

## License

MIT