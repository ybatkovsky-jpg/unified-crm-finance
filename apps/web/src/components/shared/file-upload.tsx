"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  FileIcon,
  UploadIcon,
  XIcon,
  ImageIcon,
  FileTextIcon,
  Trash2Icon,
  AlertCircleIcon,
} from "lucide-react"

export interface FileUploadFile {
  id: string
  file: File
  preview?: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  maxFiles?: number
  files?: FileUploadFile[]
  onFilesChange?: (files: FileUploadFile[]) => void
  onUpload?: (file: FileUploadFile) => Promise<void>
  onDelete?: (fileId: string) => void
  disabled?: boolean
  className?: string
}

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "image/*": ImageIcon,
  "application/pdf": FileTextIcon,
  "text/*": FileTextIcon,
  default: FileIcon,
}

function getFileIcon(mimeType: string): React.ComponentType<{ className?: string }> {
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType === "application/pdf") return FileTextIcon
  if (mimeType.startsWith("text/")) return FileTextIcon
  return FileIcon
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function FileUpload({
  accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx",
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  files: controlledFiles,
  onFilesChange,
  onUpload,
  onDelete,
  disabled = false,
  className,
}: FileUploadProps) {
  const [internalFiles, setInternalFiles] = React.useState<FileUploadFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const files = controlledFiles ?? internalFiles
  const setFiles = onFilesChange ?? setInternalFiles

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`
    }
    return null
  }

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const addFiles = async (newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles)

    if (files.length + filesArray.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validFiles: FileUploadFile[] = []

    for (const file of filesArray) {
      const error = validateFile(file)
      if (error) {
        continue
      }

      const preview = await createFilePreview(file)

      validFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        preview,
        progress: 0,
        status: "pending",
      })
    }

    setFiles([...files, ...validFiles])

    // Auto-upload if handler provided
    if (onUpload) {
      for (const fileItem of validFiles) {
        uploadFile(fileItem.id)
      }
    }
  }

  const uploadFile = async (fileId: string) => {
    setFiles(
      files.map((f) =>
        f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f
      )
    )

    try {
      const fileItem = files.find((f) => f.id === fileId)
      if (!fileItem || !onUpload) return

      await onUpload(fileItem)

      setFiles(
        files.map((f) =>
          f.id === fileId ? { ...f, status: "success", progress: 100 } : f
        )
      )
    } catch (error) {
      setFiles(
        files.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      )
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId))
    onDelete?.(fileId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
    // Reset input so same file can be selected again
    e.target.value = ""
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50 hover:bg-muted/30",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            <UploadIcon
              className={cn(
                "size-6",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {isDragging ? "Drop files here" : "Click or drag files to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              {accept && `Accepted: ${accept}`}
              {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
              {maxFiles && ` • Max ${maxFiles} file${maxFiles > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem) => {
            const FileIconComponent = getFileIcon(fileItem.file.type)

            return (
              <div
                key={fileItem.id}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                {/* Preview or Icon */}
                <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="size-full rounded-md object-cover"
                    />
                  ) : (
                    <FileIconComponent className="size-6 text-muted-foreground" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>

                    {/* Delete Button */}
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeFile(fileItem.id)}
                        className="shrink-0"
                      >
                        <Trash2Icon className="size-3.5" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    )}
                  </div>

                  {/* Progress or Status */}
                  {fileItem.status === "uploading" && (
                    <div className="flex items-center gap-2">
                      <Progress value={fileItem.progress} className="h-1" />
                      <span className="text-xs text-muted-foreground">
                    {Math.round(fileItem.progress)}%
                  </span>
                    </div>
                  )}

                  {fileItem.status === "success" && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <AlertCircleIcon className="size-3" />
                      <span>Uploaded</span>
                    </div>
                  )}

                  {fileItem.status === "error" && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircleIcon className="size-3" />
                      <span>{fileItem.error || "Upload failed"}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

FileUpload.displayName = "FileUpload"
