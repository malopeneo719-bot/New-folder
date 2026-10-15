import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image, Mic, FileText, Play } from "lucide-react";
import { toast } from "sonner";

export interface UploadedMedia {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document";
  mimeType: string;
  size: number;
  storageId?: string;     // Convex storage ID (for saved files)
  previewUrl?: string;    // Object URL or Convex URL for display
  duration?: string;
  saving?: boolean;
}

interface FileUploadProps {
  accept: string;
  fileType: "image" | "video" | "audio" | "document";
  label: string;
  description?: string;
  icon?: typeof Image;
  color?: string;
  bg?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  mediaType: "headshot" | "screenReel" | "voiceSample" | "monologue";
  files: UploadedMedia[];
  onFilesChange: (files: UploadedMedia[]) => void;
}

export function FileUpload({
  accept, fileType, label, description, icon: Icon = Image,
  color = "text-primary", bg = "bg-primary/10",
  maxFiles = 12, maxSizeMB = 50, mediaType, onFilesChange, files,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const saveMediaRef = useMutation(api.media.saveMediaRef);
  const removeMediaRefMutation = useMutation(api.media.removeMediaRef);

  const uploadFile = useCallback(async (file: File): Promise<UploadedMedia> => {
    // Create a local preview URL
    const previewUrl = URL.createObjectURL(file);

    // Create placeholder entry
    const entry: UploadedMedia = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      type: fileType,
      mimeType: file.type,
      size: file.size,
      previewUrl,
      saving: true,
    };

    // Get duration for media files
    if (fileType === "video" || fileType === "audio") {
      try {
        const media = document.createElement(fileType === "video" ? "video" : "audio");
        media.src = previewUrl;
        await new Promise<void>((resolve) => {
          media.onloadedmetadata = () => {
            const mins = Math.floor(media.duration / 60);
            const secs = Math.floor(media.duration % 60);
            entry.duration = `${mins}:${secs.toString().padStart(2, "0")}`;
            resolve();
          };
          media.onerror = () => resolve();
          setTimeout(resolve, 2000); // fallback timeout
        });
      } catch { /* ignore */ }
    }

    // Upload to Convex storage
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const result = await response.json();
      entry.storageId = result.storageId;
      entry.saving = false;

      // Save the storage reference to the actor profile
      await saveMediaRef({ storageId: result.storageId, mediaType });
    } catch (err) {
      entry.saving = false;
      toast.error(`Failed to upload ${file.name}`);
    }

    return entry;
  }, [fileType, mediaType, generateUploadUrl, saveMediaRef]);

  const handleFiles = async (fileList: FileList) => {
    const newFiles = Array.from(fileList);

    const oversized = newFiles.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (oversized) {
      toast.error(`${oversized.name} exceeds ${maxSizeMB}MB limit`);
      return;
    }

    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    toast.info(`Uploading ${newFiles.length} file${newFiles.length > 1 ? "s" : ""}…`);

    const processed = await Promise.all(newFiles.map(uploadFile));
    const updated = [...files, ...processed];
    onFilesChange(updated);
    toast.success(`${processed.length} file${processed.length > 1 ? "s" : ""} saved to profile`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    // Remove from Convex storage
    if (file.storageId) {
      try {
        await removeMediaRefMutation({ storageId: file.storageId, mediaType });
      } catch { /* continue even if delete fails */ }
    }

    if (file.previewUrl && file.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(file.previewUrl);
    }

    onFilesChange(files.filter((f) => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`flex size-8 items-center justify-center rounded-lg ${bg} ${color}`}>
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-bold">{label}</p>
            {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="text-[10px]">{files.length}/{maxFiles}</Badge>
          </div>
        </div>

        {/* Uploaded files */}
        {files.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {files.map((file) => (
              <div key={file.id} className="relative group rounded-xl border border-border/40 bg-muted/20 overflow-hidden">
                {/* Preview */}
                <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center">
                  {file.type === "image" && file.previewUrl ? (
                    <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                  ) : file.type === "video" && file.previewUrl ? (
                    <div className="relative w-full h-full">
                      <video src={file.previewUrl} className="w-full h-full object-cover" preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex size-10 items-center justify-center rounded-full bg-white/90">
                          <Play className="size-4 text-black ml-0.5" />
                        </div>
                      </div>
                      {file.duration && (
                        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                          {file.duration}
                        </div>
                      )}
                    </div>
                  ) : file.type === "audio" && file.previewUrl ? (
                    <div className="flex flex-col items-center gap-2 p-4 w-full">
                      <Mic className={`size-8 ${color}`} />
                      <audio src={file.previewUrl} controls className="w-full h-8" preload="metadata" />
                    </div>
                  ) : (
                    <FileText className="size-8 text-muted-foreground/50" />
                  )}

                  {/* Saving indicator */}
                  {file.saving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] text-muted-foreground">Uploading…</p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Info bar */}
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground truncate flex-1">{file.name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                  {file.storageId && (
                    <span className="text-[10px] text-emerald-500 shrink-0">✓ Saved</span>
                  )}
                  <Button
                    variant="ghost" size="icon" className="size-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="size-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragActive ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <Upload className={`mx-auto size-8 mb-2 ${color} opacity-50`} />
          <p className="text-xs text-muted-foreground">
            Drag & drop or <span className="font-medium text-primary">click to browse</span>
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Max {maxSizeMB}MB per file</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
