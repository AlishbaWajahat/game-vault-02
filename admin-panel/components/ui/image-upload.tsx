"use client";

import { useRef, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  id?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  id,
  placeholder = "https://...",
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset load/error state whenever the URL changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [value]);

  async function handleFile(file: File) {
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await api<{ success: boolean; data: { url: string } }>(
        "/admin/upload-image",
        {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            data: base64,
          }),
        },
      );
      onChange(res.data.url);
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          type="url"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Upload image"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            title="Clear"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value && (
        <div className="relative h-20 w-28 rounded-md overflow-hidden border bg-muted/30 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={value}
            src={value}
            alt="Preview"
            className={`h-full w-full object-cover ${imgLoaded ? "block" : "hidden"}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
          {!imgLoaded && (
            <div className="flex items-center justify-center h-full w-full text-muted-foreground">
              {imgError ? (
                <ImageIcon className="h-5 w-5 opacity-40" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin opacity-40" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
