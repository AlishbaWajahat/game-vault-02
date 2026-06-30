"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import {
  startUpload,
  pauseUpload,
  resumeUpload,
  cancelUpload,
  dismissTask,
  useUploadTasks,
  formatFileSize,
  formatETA,
  getProgress,
  getSpeed,
} from "@/lib/upload-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  Trash2,
  FileIcon,
  HardDrive,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Pause,
  Play,
  Ban,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ContentFile {
  id: string;
  fileName: string;
  fileSize: string;
  uploadStatus: string;
  storageKey: string;
  createdAt: string;
}

interface DuplicateInfo {
  fileId: string;
  fileName: string;
  fileSize: string;
  storageKey: string;
  contentTitle: string;
  contentSlug: string;
}

interface FileUploadSectionProps {
  contentId: string;
}

export function FileUploadSection({ contentId }: FileUploadSectionProps) {
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);
  const [reusing, setReusing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to global upload manager
  const allTasks = useUploadTasks();
  const uploadTasks = allTasks.filter((t) => t.contentId === contentId);
  const hasActiveUpload = uploadTasks.some(
    (t) => t.status !== "done" && t.status !== "error",
  );

  // Only 1 file per content — check if one already exists
  const hasExistingFile = files.some((f) => f.uploadStatus === "COMPLETE");
  const uploadDisabled = hasActiveUpload || hasExistingFile;

  const loadFiles = useCallback(async () => {
    try {
      const res = await api<{ success: boolean; data: ContentFile[] }>(
        `/admin/content/${contentId}/files`,
      );
      setFiles(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      await startUpload(contentId, file, () => {
        // onComplete: refresh file list
        loadFiles();
        toast.success(`"${file.name}" uploaded successfully`);
      });
    } catch (err) {
      // Handle duplicate file error
      if (err instanceof ApiError && err.status === 409 && err.data?.duplicate) {
        setDuplicate(err.data.duplicate as unknown as DuplicateInfo);
        return;
      }
      toast.error(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed",
      );
    }
  }

  async function handleReuse() {
    if (!duplicate) return;
    setReusing(true);
    try {
      await api(`/admin/content/${contentId}/files/reuse`, {
        method: "POST",
        body: JSON.stringify({ sourceFileId: duplicate.fileId }),
      });
      toast.success(`"${duplicate.fileName}" linked successfully`);
      setDuplicate(null);
      await loadFiles();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to reuse file",
      );
    } finally {
      setReusing(false);
    }
  }

  async function handleDelete(file: ContentFile) {
    setDeleting(file.id);
    try {
      await api(`/admin/content/${contentId}/files/${file.id}`, {
        method: "DELETE",
      });
      toast.success(`"${file.fileName}" deleted`);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete file",
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Download Files
            </CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadDisabled}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadDisabled}
                title={hasExistingFile ? "Delete the existing file first to upload a new one" : undefined}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {hasExistingFile ? "File Uploaded" : "Upload File"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Upload progress — real-time from upload manager */}
          {uploadTasks.map((task) => {
            const pct = getProgress(task);
            const eta = formatETA(task);
            const speed = getSpeed(task);
            const isActive = task.status === "uploading" || task.status === "initiating";
            const isPaused = task.status === "paused";

            return (
              <div key={task.id} className="rounded-md border px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {task.status === "error" ? (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    ) : task.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#16a34a" }} />
                    ) : task.status === "paused" ? (
                      <Pause className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {task.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground mr-1">
                      {task.status === "initiating" && "Initiating..."}
                      {task.status === "uploading" && `${pct.toFixed(0)}%`}
                      {task.status === "paused" && `${pct.toFixed(0)}% — Paused`}
                      {task.status === "completing" && "Finalizing..."}
                      {task.status === "done" && "Complete"}
                      {task.status === "error" && "Failed"}
                    </span>
                    {/* Pause / Resume */}
                    {task.status === "uploading" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => pauseUpload(task.id)}
                        title="Pause upload"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {task.status === "paused" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => resumeUpload(task.id)}
                        title="Resume upload"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {/* Cancel */}
                    {(isActive || isPaused) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          cancelUpload(task.id);
                          toast.info(`Upload of "${task.fileName}" cancelled`);
                        }}
                        title="Cancel upload"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {/* Dismiss error */}
                    {task.status === "error" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => dismissTask(task.id)}
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                {(task.status === "uploading" || task.status === "paused") && (
                  <>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-150"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isPaused ? "#f59e0b" : "var(--primary)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {formatFileSize(task.uploadedBytes)} / {formatFileSize(task.totalBytes)}
                      </span>
                      {task.status === "uploading" && (
                        <span>
                          {speed && `${speed}`}
                          {speed && eta && " \u00b7 "}
                          {eta}
                        </span>
                      )}
                    </div>
                  </>
                )}
                {task.status === "error" && task.error && task.error !== "DUPLICATE_FILE" && (
                  <p className="text-xs text-destructive">{task.error}</p>
                )}
              </div>
            );
          })}

          {/* File list */}
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading files...
            </div>
          ) : files.length === 0 && uploadTasks.length === 0 ? (
            <div className="py-8 text-center">
              <FileIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                No files uploaded yet. Click &quot;Upload File&quot; to add a
                downloadable file.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-md border px-4 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.fileName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(Number(file.fileSize))}
                        </span>
                        {file.uploadStatus === "COMPLETE" ? (
                          <Badge
                            className="border-transparent"
                            style={{ backgroundColor: "#16a34a", color: "#fff" }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-0.5" />
                            Complete
                          </Badge>
                        ) : file.uploadStatus === "UPLOADING" ? (
                          <Badge
                            className="border-transparent"
                            style={{ backgroundColor: "#ea580c", color: "#fff" }}
                          >
                            <AlertCircle className="h-3 w-3 mr-0.5" />
                            Uploading
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-0.5" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleDelete(file)}
                    disabled={deleting === file.id}
                  >
                    {deleting === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate file dialog */}
      <Dialog open={!!duplicate} onOpenChange={(open) => !open && setDuplicate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              File Already Exists
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  A file with the same name and size is already stored in{" "}
                  <span className="font-medium text-foreground">
                    &quot;{duplicate?.contentTitle}&quot;
                  </span>.
                </p>
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 shrink-0" />
                    <span className="font-medium truncate">{duplicate?.fileName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">
                    {duplicate ? formatFileSize(Number(duplicate.fileSize)) : ""}
                  </span>
                </div>
                <p>Would you like to reuse this file or skip?</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicate(null)} disabled={reusing}>
              Skip
            </Button>
            <Button onClick={handleReuse} disabled={reusing}>
              {reusing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-1.5" />
              )}
              Reuse File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
