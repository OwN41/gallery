"use client";

import { useState } from "react";

type Props = {
  onFolderSelect: (files: FileList | File[]) => void;
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
    const CHUNK_SIZE = 500;
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

      {/* folder picker */}
      <label
        className={`px-4 py-2 rounded cursor-pointer text-white transition ${
          loading
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-gray-600 hover:bg-gray-700"
        }`}
      >
        Select Folder
        <input
          type="file"
          webkitdirectory="true"
          multiple
          hidden
          disabled={loading}
          onChange={handleChange}
        />
      </label>
    </header>
  );
}
