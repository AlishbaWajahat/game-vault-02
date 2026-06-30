import { useSyncExternalStore } from "react";
import { api, ApiError } from "./api";

export interface UploadTask {
  id: string;
  contentId: string;
  fileName: string;
  totalBytes: number;
  uploadedBytes: number;
  status: "initiating" | "uploading" | "paused" | "completing" | "done" | "error";
  error?: string;
  startedAt: number;
  /** Time spent paused (ms) — subtracted from elapsed for accurate speed/ETA */
  pausedDuration: number;
  /** Callback to refresh file list after completion */
  onComplete?: () => void;
}

// ── Module-level state (persists across navigations) ──

let tasks: UploadTask[] = [];
const listeners = new Set<() => void>();
let snapshotRef = tasks;

function notify() {
  snapshotRef = [...tasks];
  listeners.forEach((l) => l());
}

function updateTask(id: string, patch: Partial<UploadTask>) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
  notify();
}

// ── Upload control signals ──

interface UploadSignal {
  cancelled: boolean;
  paused: boolean;
  pausedAt: number;
  resumeResolve: (() => void) | null;
}

const signals = new Map<string, UploadSignal>();

// ── Pause error sentinel ──

class PausedError extends Error {
  constructor() {
    super("Upload paused");
    this.name = "PausedError";
  }
}

// ── XHR chunk upload with progress ──
// Aborts immediately on pause or cancel (checks every 300ms)

function uploadChunkXHR(
  url: string,
  chunk: Blob,
  onProgress: (loaded: number) => void,
  signal: UploadSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.getResponseHeader("ETag") || "");
      } else {
        reject(new Error(`Chunk upload failed: ${xhr.status}`));
      }
    };

    xhr.onabort = () => {
      if (signal.cancelled) {
        reject(new Error("Upload cancelled"));
      } else if (signal.paused) {
        reject(new PausedError());
      } else {
        reject(new Error("Upload aborted"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.timeout = 600000; // 10 minutes per chunk

    xhr.send(chunk);

    // Poll for cancel/pause signals — aborts XHR immediately
    const poll = setInterval(() => {
      if (signal.cancelled || signal.paused) {
        xhr.abort(); // triggers onabort
        clearInterval(poll);
      }
    }, 300);
    xhr.onloadend = () => clearInterval(poll);
  });
}

/** Wait until resumed. Resolves when signal.paused becomes false. */
function waitForResume(signal: UploadSignal): Promise<void> {
  if (!signal.paused) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    signal.resumeResolve = () => {
      if (signal.cancelled) {
        reject(new Error("Upload cancelled"));
      } else {
        resolve();
      }
    };
  });
}

/**
 * Upload a single chunk with pause/resume support.
 * If paused mid-transfer, aborts the XHR, waits for resume, then retries
 * the chunk from scratch (S3 multipart requires each part in full).
 */
async function uploadChunkWithPauseSupport(
  url: string,
  chunk: Blob,
  taskId: string,
  completedBytes: number,
  signal: UploadSignal,
): Promise<string> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // If already paused before we start, wait
    if (signal.paused) {
      updateTask(taskId, { status: "paused" });
      await waitForResume(signal);
      if (signal.cancelled) throw new Error("Upload cancelled");
      updateTask(taskId, { status: "uploading" });
    }

    try {
      return await uploadChunkXHR(
        url,
        chunk,
        (loaded) => {
          updateTask(taskId, { uploadedBytes: completedBytes + loaded });
        },
        signal,
      );
    } catch (err) {
      if (err instanceof PausedError) {
        // XHR was aborted because user hit pause mid-chunk.
        // Reset progress for this chunk (it was incomplete)
        updateTask(taskId, { status: "paused", uploadedBytes: completedBytes });
        await waitForResume(signal);
        if (signal.cancelled) throw new Error("Upload cancelled");
        updateTask(taskId, { status: "uploading" });
        // Retry this chunk from the beginning
        continue;
      }
      throw err; // real error or cancel
    }
  }
}

// ── Public API ──

export async function startUpload(
  contentId: string,
  file: File,
  onComplete?: () => void,
): Promise<string> {
  const taskId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const signal: UploadSignal = {
    cancelled: false,
    paused: false,
    pausedAt: 0,
    resumeResolve: null,
  };
  signals.set(taskId, signal);

  const task: UploadTask = {
    id: taskId,
    contentId,
    fileName: file.name,
    totalBytes: file.size,
    uploadedBytes: 0,
    status: "initiating",
    startedAt: Date.now(),
    pausedDuration: 0,
    onComplete,
  };

  tasks = [...tasks, task];
  notify();

  try {
    // Step 1: Initiate upload
    const initRes = await api<{
      success: boolean;
      data: {
        fileId: string;
        uploadId: string;
        presignedUrls: { partNumber: number; url: string }[];
        chunkSize: number;
      };
    }>(`/admin/content/${contentId}/files/initiate`, {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
    });

    if (signal.cancelled) throw new Error("Upload cancelled");

    const { fileId, uploadId, presignedUrls, chunkSize } = initRes.data;

    updateTask(taskId, { status: "uploading" });

    // Step 2: Upload chunks with pause/resume support
    const parts: { partNumber: number; etag: string }[] = [];
    let completedBytes = 0;

    for (const { partNumber, url } of presignedUrls) {
      if (signal.cancelled) throw new Error("Upload cancelled");

      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const etag = await uploadChunkWithPauseSupport(
        url,
        chunk,
        taskId,
        completedBytes,
        signal,
      );

      parts.push({ partNumber, etag });
      completedBytes += chunk.size;
      updateTask(taskId, { uploadedBytes: completedBytes });
    }

    // Step 3: Complete upload
    updateTask(taskId, { status: "completing" });

    await api(`/admin/content/${contentId}/files/complete`, {
      method: "POST",
      body: JSON.stringify({ fileId, uploadId, parts }),
    });

    updateTask(taskId, { status: "done", uploadedBytes: file.size });

    // Notify completion
    const doneTask = tasks.find((t) => t.id === taskId);
    doneTask?.onComplete?.();

    // Remove from list after a delay
    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== taskId);
      signals.delete(taskId);
      notify();
    }, 3000);

    return taskId;
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      updateTask(taskId, { status: "error", error: "DUPLICATE_FILE" });
      setTimeout(() => {
        tasks = tasks.filter((t) => t.id !== taskId);
        signals.delete(taskId);
        notify();
      }, 500);
      throw err;
    }

    const message =
      err instanceof Error ? err.message : "Upload failed";
    updateTask(taskId, { status: "error", error: message });
    return taskId;
  }
}

export function pauseUpload(taskId: string) {
  const signal = signals.get(taskId);
  if (!signal || signal.paused || signal.cancelled) return;
  signal.paused = true;
  signal.pausedAt = Date.now();
  // Status update happens in uploadChunkWithPauseSupport when XHR aborts
  // But also set it here for immediate UI feedback
  updateTask(taskId, { status: "paused" });
}

export function resumeUpload(taskId: string) {
  const signal = signals.get(taskId);
  if (!signal || !signal.paused) return;
  // Track how long we were paused for accurate speed/ETA
  const pauseTime = Date.now() - signal.pausedAt;
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    updateTask(taskId, {
      pausedDuration: task.pausedDuration + pauseTime,
    });
  }
  signal.paused = false;
  // Resolve the wait promise — this resumes the upload loop
  signal.resumeResolve?.();
  signal.resumeResolve = null;
}

export function cancelUpload(taskId: string) {
  const signal = signals.get(taskId);
  if (signal) {
    signal.cancelled = true;
    // If paused, resolve the wait so the loop can exit
    if (signal.paused) {
      signal.paused = false;
      signal.resumeResolve?.();
      signal.resumeResolve = null;
    }
  }
  tasks = tasks.filter((t) => t.id !== taskId);
  signals.delete(taskId);
  notify();
}

export function dismissTask(taskId: string) {
  tasks = tasks.filter((t) => t.id !== taskId);
  signals.delete(taskId);
  notify();
}

export function getActiveTasks(): UploadTask[] {
  return tasks.filter(
    (t) => t.status !== "done" && t.status !== "error",
  );
}

// ── React hook ──

function getSnapshot() {
  return snapshotRef;
}

function getServerSnapshot(): UploadTask[] {
  return [];
}

export function useUploadTasks(): UploadTask[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot,
    getServerSnapshot,
  );
}

// ── Helpers ──

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatETA(task: UploadTask): string {
  if (task.uploadedBytes === 0 || task.status !== "uploading") return "";
  const elapsed = (Date.now() - task.startedAt - task.pausedDuration) / 1000;
  if (elapsed <= 0) return "";
  const speed = task.uploadedBytes / elapsed;
  const remaining = (task.totalBytes - task.uploadedBytes) / speed;
  if (remaining < 60) return `${Math.ceil(remaining)}s left`;
  if (remaining < 3600) return `${Math.ceil(remaining / 60)}m left`;
  return `${(remaining / 3600).toFixed(1)}h left`;
}

export function getProgress(task: UploadTask): number {
  if (task.totalBytes === 0) return 0;
  return Math.min(100, (task.uploadedBytes / task.totalBytes) * 100);
}

export function getSpeed(task: UploadTask): string {
  if (task.uploadedBytes === 0 || task.status !== "uploading") return "";
  const elapsed = (Date.now() - task.startedAt - task.pausedDuration) / 1000;
  if (elapsed <= 0) return "";
  const speed = task.uploadedBytes / elapsed;
  return `${formatFileSize(speed)}/s`;
}
