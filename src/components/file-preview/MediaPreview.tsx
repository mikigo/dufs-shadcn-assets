interface Props {
  filePath: string
}

export function MediaPreview({ filePath }: Props) {
  return (
    <div className="flex items-center justify-center h-full">
      <iframe
        src={filePath}
        className="w-full h-full border-0"
        sandbox="allow-scripts"
        title="Media Preview"
      />
    </div>
  )
}