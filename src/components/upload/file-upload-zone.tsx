"use client";

import { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  accept: string;
  onFile: (file: File) => void;
  label: string;
  description: string;
}

export function FileUploadZone({ accept, onFile, label, description }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      e.target.value = "";
    },
    [onFile]
  );

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-200",
        isDragging
          ? "scale-[1.02] border-accent-blue bg-accent-blue/5"
          : "border-muted-foreground/20 hover:border-accent-blue/50 hover:bg-muted/40"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className={cn(
        "mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-200",
        isDragging ? "bg-accent-blue/10 text-accent-blue" : "bg-muted text-muted-foreground"
      )}>
        <UploadCloud className="h-7 w-7" />
      </div>
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-1 text-xs text-muted-foreground">{description}</span>
      <input type="file" accept={accept} className="hidden" onChange={handleChange} />
    </label>
  );
}
