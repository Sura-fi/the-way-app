"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { fileToAvatarDataUrl } from "@/lib/image";
import { Avatar } from "@/components/ui/Avatar";



export function AvatarUploader({
  src,
  name,
  onChange,
  sizeClasses = "w-20 h-20",
  textClasses = "text-3xl",
}: {
  src?: string | null;
  name?: string;
  onChange: (dataUrl: string) => Promise<void> | void;
  sizeClasses?: string;
  textClasses?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await onChange(dataUrl);
    } catch {
      setError("Could not update photo. Try again.");
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar src={src} name={name} sizeClasses={sizeClasses} textClasses={textClasses} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold-muted text-umber-deep flex items-center justify-center shadow-md hover:bg-gold-bright disabled:opacity-50 transition-colors"
          aria-label="Change photo"
        >
          <Camera className="w-4 h-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {busy && <span className="text-xs text-gold-muted animate-pulse">Updating…</span>}
      {error && <span className="text-xs text-warm-red">{error}</span>}
    </div>
  );
}