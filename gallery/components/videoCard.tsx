"use client";

import { Download, Play } from "lucide-react";
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
}: Readonly<Props>) {
  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    try {
      const link = document.createElement("a");
      link.href = src;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Downloading video...");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download video.");
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
      <button
        type="button"
        className="block aspect-square cursor-pointer overflow-hidden rounded-lg relative w-full border-0 bg-transparent p-0 text-left"
        onClick={onOpen}
        aria-label={`Open preview for ${name}`}
      >
        <video
          src={src}
          muted
          preload="metadata"
          className="block w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />

        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="rounded-full bg-black/60 p-3">
            <Play size={22} className="text-white" fill="currentColor" />
          </div>
        </div>
      </button>

      <div className="pt-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-white truncate">{name}</p>
            <p className="text-[10px] text-gray-400">
              {formatSize(size)} • {formatDate(lastModified)}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="shrink-0 rounded-md bg-gray-600 p-2 text-white shadow-sm hover:bg-gray-700"
            title="Download video"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
