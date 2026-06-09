"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string | null;
  name: string;
  onClose: () => void;
};

export default function VideoPreview({ src, name, onClose }: Readonly<Props>) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!src) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [src]);

  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.play().catch((error) => {
      console.error("Autoplay failed:", error);
    });
  }, [src]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center animate-fadeIn"
      style={{
        backgroundColor: "rgba(0,0,0,0.8)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video preview"
        className="absolute inset-0"
        style={{ background: "transparent", border: "none", padding: 0 }}
      />

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
      >
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

        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "90vh",
            maxWidth: "90vw",
            objectFit: "contain",
            display: "block",
            background: "black",
          }}
        >
          <track kind="captions" label="captions" />
        </video>
      </div>
    </div>
  );
}
