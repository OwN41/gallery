"use client";

import { useState } from "react";
import ImageCard from "./imageCard";
import ImagePreview from "./imagePreview";

type ImageItem = {
  src: string;
  name: string;
  size: number;
  lastModified: number;
};

export default function Gallery({ images }: { images: ImageItem[] }) {
  const [preview, setPreview] = useState<ImageItem | null>(null);

  return (
    <>
      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <ImageCard
              key={img.src}
              src={img.src}
              name={img.name}
              size={img.size}
              lastModified={img.lastModified}
              onOpen={() => setPreview(img)}
            />
          ))}
        </div>
      </div>

      <ImagePreview
        src={preview?.src || null}
        name={preview?.name || ""}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
