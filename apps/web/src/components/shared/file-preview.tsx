"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { FileIcon, XIcon, DownloadIcon, ExternalLinkIcon } from "lucide-react"

export interface FilePreviewProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  fileName?: string
  fileUrl?: string
  mimeType?: string
  /**
   * For controlled mode: pass the blob URL or base64 data directly
   */
  src?: string
  className?: string
}

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
]

const SUPPORTED_PREVIEW_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  "application/pdf",
  "text/plain",
  "text/html",
  "text/markdown",
  "application/json",
]

function isImageType(mimeType?: string): boolean {
  if (!mimeType) return false
  return mimeType.startsWith("image/")
}

function isPdfType(mimeType?: string): boolean {
  return mimeType === "application/pdf"
}

function isTextType(mimeType?: string): boolean {
  if (!mimeType) return false
  return mimeType.startsWith("text/")
}

function canPreview(mimeType?: string): boolean {
  if (!mimeType) return false
  return SUPPORTED_PREVIEW_TYPES.some((type) =>
    mimeType.startsWith(type.split("/")[0] + "/") || mimeType === type
  )
}

export function FilePreview({
  open,
  onOpenChange,
  fileName,
  fileUrl,
  mimeType,
  src,
  className,
}: FilePreviewProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  // Use src if provided, otherwise use fileUrl
  const previewSrc = src || fileUrl

  const handleDownload = () => {
    if (!previewSrc) return

    const link = document.createElement("a")
    link.href = previewSrc
    link.download = fileName || "download"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    if (!previewSrc) return
    window.open(previewSrc, "_blank", "noopener,noreferrer")
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const renderContent = () => {
    if (!previewSrc) {
      return (
        <div className="flex size-full min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <FileIcon className="size-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No file to preview</p>
          </div>
        </div>
      )
    }

    // Image preview
    if (isImageType(mimeType) && !imageError) {
      return (
        <div className="flex size-full min-h-[400px] items-center justify-center bg-muted/30">
          <img
            src={previewSrc}
            alt={fileName || "Preview"}
            className="max-h-[70vh] max-w-full rounded-md object-contain shadow-sm"
            onError={handleImageError}
          />
        </div>
      )
    }

    // PDF preview - use iframe for browsers that support it
    if (isPdfType(mimeType)) {
      return (
        <div className="flex min-h-[500px] flex-col items-center justify-center gap-4">
          <iframe
            src={previewSrc}
            title={fileName || "PDF Preview"}
            className="size-full min-h-[500px] rounded-md border"
          />
        </div>
      )
    }

    // Text preview
    if (isTextType(mimeType)) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex max-w-full flex-col items-center gap-3 text-center">
            <FileIcon className="size-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Text file preview not available in modal
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="gap-1.5"
            >
              <ExternalLinkIcon className="size-3.5" />
              Open in new tab
            </Button>
          </div>
        </div>
      )
    }

    // Unsupported format - show download prompt
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <FileIcon className="size-16 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Preview not available</p>
            <p className="text-xs text-muted-foreground">
              {fileName && (
                <span className="block">
                  {fileName}
                  {mimeType && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({mimeType})
                    </span>
                  )}
                </span>
              )}
              This file type cannot be previewed in the browser.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
            >
              <DownloadIcon className="size-3.5" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="gap-1.5"
            >
              <ExternalLinkIcon className="size-3.5" />
              Open
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn(
          "max-w-4xl gap-0 p-0",
          !isImageType(mimeType) && "max-w-2xl",
          className
        )}
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center gap-2 border-b p-4">
          <DialogTitle className="truncate font-medium">
            {fileName || "File Preview"}
          </DialogTitle>
          <div className="ml-auto flex items-center gap-1">
            {previewSrc && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDownload}
                  title="Download"
                >
                  <DownloadIcon className="size-4" />
                  <span className="sr-only">Download</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleOpenInNewTab}
                  title="Open in new tab"
                >
                  <ExternalLinkIcon className="size-4" />
                  <span className="sr-only">Open in new tab</span>
                </Button>
              </>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" title="Close">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-4">{renderContent()}</div>

        {/* Footer for mobile/file info */}
        {(fileName || mimeType) && (
          <div className="flex flex-row items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs">
            <div className="flex flex-col">
              <span className="font-medium">{fileName || "Unknown file"}</span>
              {mimeType && (
                <span className="text-muted-foreground">{mimeType}</span>
              )}
            </div>
            {canPreview(mimeType) ? (
              <span className="text-green-600 dark:text-green-400">
                Preview available
              </span>
            ) : (
              <span className="text-muted-foreground">Preview unavailable</span>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

FilePreview.displayName = "FilePreview"

/**
 * Hook for programmatically controlling file preview
 */
export function useFilePreview() {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<{
    fileName?: string
    fileUrl?: string
    mimeType?: string
    src?: string
  } | null>(null)

  const openPreview = (
    props: Pick<FilePreviewProps, "fileName" | "fileUrl" | "mimeType" | "src">
  ) => {
    setFile(props)
    setOpen(true)
  }

  const closePreview = () => {
    setOpen(false)
    // Delay clearing file to allow close animation
    setTimeout(() => setFile(null), 200)
  }

  return {
    open,
    setOpen: closePreview,
    file,
    openPreview,
    closePreview,
  }
}
