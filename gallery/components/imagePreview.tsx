"use client";

import Image from "next/image";
import { useEffect } from "react";
import { toast } from "react-toastify";

type Props = {
  src: string | null;
  name: string;
  onClose: () => void;
};

export default function ImagePreview({ src, name, onClose }: Props) {
  useEffect(() => {
    if (!src) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [src]);

  if (!src) return null;

  const handleCopy = async (e: React.MouseEvent<HTMLImageElement>) => {
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

      await navigator.clipboard
        .write([
          new ClipboardItem({
            "image/png": pngBlob,
          }),
        ])
        .then(() => {
          toast.success("Image copied to clipboard!");
        });
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Failed to copy image.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center animate-fadeIn"
      style={{
        backgroundColor: "rgba(0,0,0,0.8)",
      }}
      onClick={onClose}
    >
      <div
        className="relative animate-zoomIn"
        style={{
          width: "fit-content",
          height: "fit-content",
          maxHeight: "90vh",
          maxWidth: "90vw",
          backgroundColor: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            color: "white",
            background: "rgba(0,0,0,0.6)",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* IMAGE */}
        <Image
          src={src}
          alt={name}
          width={800}
          height={600}
          onDoubleClick={handleCopy}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "90vh",
            maxWidth: "90vw",
            objectFit: "contain",
            display: "block",
          }}
        />

        {/* NAME */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            textAlign: "center",
            padding: "6px",
            fontSize: "12px",
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}
