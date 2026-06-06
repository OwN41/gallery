"use client";

import { useState } from "react";

type Props = {
  onFolderSelect: (files: File[]) => void;
};

export default function Header({ onFolderSelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setLoading(true);
    setCount(0);

    const files = Array.from(e.target.files);

    const images: File[] = [];

    // Process in chunks so UI doesn't freeze
    const CHUNK_SIZE = 100;
    let index = 0;

    const processChunk = () => {
      const chunk = files.slice(index, index + CHUNK_SIZE);

      for (const file of chunk) {
        if (file.type.startsWith("image/")) {
          images.push(file);
        }
      }

      index += CHUNK_SIZE;
      setCount(images.length);

      if (index < files.length) {
        setTimeout(processChunk, 0); // yield to browser
      } else {
        onFolderSelect(images);
        setLoading(false);
      }
    };

    processChunk();
  };

  return (
    <header className="flex justify-between p-4 border-b items-center">
      <label className="text-white font-bold text-3xl">Gallery</label>

      {/* loading indicator */}
      {loading && (
        <div className="text-sm text-gray-300">
          Loading... {count} images found
        </div>
      )}
    </header>
  );
}
