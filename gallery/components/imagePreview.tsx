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
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!src) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        backgroundColor: "rgba(0,0,0,0.8)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "fit-content",
          height: "fit-content",
          maxHeight: "90vh",
          maxWidth: "90vw",
          backgroundColor: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          transition: "transform 150ms ease, opacity 150ms ease",
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
            background: "black",
            color: "white",
            border: "none",
          }}
        >
          ✕
        </button>

        {/* IMAGE */}
        <Image
          src={src}
          alt={name}
          width={500}
          height={400}
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "90vh",
            maxWidth: "90vw",
            objectFit: "contain",
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
