import { ChevronRight, Folder, FolderOpen, File, FileText, FileCode, FileImage, FileVideo, FileAudio, FileArchive, FileSpreadsheet, FileTerminal, FileJson, FileCog, FilePen, Presentation } from "lucide-react"
import { cn, getFileIconType } from "@/lib/utils"
import type { TreeNode as TreeNodeType } from "@/types/dufs"

interface Props {
  node: TreeNodeType
  depth: number
  loading: boolean
  onToggle: (path: string, loaded: boolean) => void
  onSelect: (path: string) => void
  onNavigate: (path: string) => void
}

function getIcon(isDir: boolean, expanded: boolean, filename?: string) {
  if (isDir) {
    return expanded
      ? <FolderOpen className="shrink-0 size-4 text-primary group-hover:text-accent-foreground" />
      : <Folder className="shrink-0 size-4 text-muted-foreground group-hover:text-accent-foreground" />
  }
  const type = filename ? getFileIconType(filename) : "default"
  const cls = "shrink-0 size-4 text-muted-foreground group-hover:text-accent-foreground"
  switch (type) {
    case "image": return <FileImage className={cls} />
    case "video": return <FileVideo className={cls} />
    case "audio": return <FileAudio className={cls} />
    case "code": return <FileCode className={cls} />
    case "terminal": return <FileTerminal className={cls} />
    case "json": return <FileJson className={cls} />
    case "cog": return <FileCog className={cls} />
    case "text": return <FileText className={cls} />
    case "pen": return <FilePen className={cls} />
    case "presentation": return <Presentation className={cls} />
    case "spreadsheet": return <FileSpreadsheet className={cls} />
    case "archive": return <FileArchive className={cls} />
    default: return <File className={cls} />
  }
}

export function TreeNodeComponent({ node, depth, loading, onToggle, onSelect, onNavigate }: Props) {
  const expanded = node.children !== null

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 w-full py-1 text-[13px] hover:bg-accent hover:text-accent-foreground rounded-md text-left",
          "transition-colors duration-100 leading-tight cursor-pointer group"
        )}
        style={{ paddingLeft: depth * 16 + 8, paddingRight: 8 }}
      >
        {/* Chevron: toggle expand/collapse (directories only) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (node.isDir) onToggle(node.path, node.loaded)
          }}
          className={cn(
            "shrink-0 p-0.5 rounded-sm hover:bg-accent transition-colors",
            !node.isDir && "invisible"
          )}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronRight
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        </button>

        {/* Icon + name */}
        <button
          onClick={() => {
            if (node.isDir) {
              onToggle(node.path, node.loaded)
              onNavigate(node.path)
            } else {
              onSelect(node.path)
            }
          }}
          className="flex items-center gap-1.5 min-w-0 flex-1"
        >
          {getIcon(node.isDir, expanded, node.name)}
          <span className="truncate">{node.name}</span>
          {loading && (
            <span className="ml-auto size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
          )}
        </button>
      </div>
      {expanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
              loading={false}
              onToggle={onToggle}
              onSelect={onSelect}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}