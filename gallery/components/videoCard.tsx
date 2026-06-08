"use client";

import { Copy, Play } from "lucide-react";
import { toast } from "react-toastify";

type Props = {
  src: string;
  name: string;
  size: number;
  lastModified: number;
  onOpen: () => void;
};

function formatSize(bytes: number) {
  const kb = bytes / 1024;
  const mb = kb / 1024;

  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${kb.toFixed(1)} KB`;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleString();
}

export default function VideoCard({
  src,
  name,
  size,
  lastModified,
  onOpen,
}: Props) {
  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(name);
      toast.success("Copied video name to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Failed to copy video name.");
    }
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-sm w-full p-2 border-2 border-gray-800"
      style={{
        backgroundColor: "#333333",
        borderColor: "#444444",
      }}
    >
      <div
        className="aspect-square cursor-pointer overflow-hidden rounded-lg relative"
        onClick={onOpen}
      >
        <video
          src={src}
          muted
          preload="metadata"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="rounded-full bg-black/60 p-3">
            <Play size={22} className="text-white" fill="currentColor" />
          </div>
        </div>
      </div>

      <div className="pt-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-white truncate">{name}</p>
            <p className="text-[10px] text-gray-400">
              {formatSize(size)} • {formatDate(lastModified)}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-gray-600 p-2 text-white shadow-sm hover:bg-gray-700"
            title="Copy video name"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
