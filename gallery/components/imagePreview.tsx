"use client";

import Image from "next/image";
import { useEffect } from "react";

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
