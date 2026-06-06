"use client";

import Image from "next/image";
import { Copy } from "lucide-react";

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

export default function ImageCard({
  src,
  name,
  size,
  lastModified,
  onOpen,
}: Props) {
  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    try {
      if (!navigator.clipboard?.write) {
        alert("Image copy is not supported in this browser.");
        return;
      }

      const response = await fetch(src);
      const blob = await response.blob();

      const bitmap = await createImageBitmap(blob);

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to create canvas context");
      }

      ctx.drawImage(bitmap, 0, 0);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to create PNG blob"));
            return;
          }
          resolve(blob);
        }, "image/png");
      });

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": pngBlob,
        }),
      ]);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Failed to copy image.");
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden shadow-sm bg-white w-full p-2">
      <div
        className="aspect-square cursor-pointer overflow-hidden rounded-lg"
        onClick={onOpen}
      >
        <Image
          src={src}
          alt={name}
          width={300}
          height={300}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="pt-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-black truncate">{name}</p>
            <p className="text-[10px] text-gray-500">
              {formatSize(size)} • {formatDate(lastModified)}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-gray-600 p-2 text-white shadow-sm hover:bg-gray-700"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
