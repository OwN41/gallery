"use client";

import { useState } from "react";
import Header from "@/components/header";
import Gallery from "@/components/gallery";

type ImageItem = {
  src: string;
  name: string;
  size: number;
  lastModified: number;
};

export default function Page() {
  const [images, setImages] = useState<ImageItem[]>([]);

  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [search, setSearch] = useState("");

  // FILTER FIRST (instant search)
  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(search.toLowerCase()),
  );

  // THEN SORT FILTERED RESULTS
  const sortedImages = [...filteredImages].sort((a, b) => {
    let compare = 0;

    if (sortBy === "size") compare = a.size - b.size;
    if (sortBy === "name") compare = a.name.localeCompare(b.name);

    return sortDir === "asc" ? -compare : compare;
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ paddingLeft: "1vw", paddingRight: "1vw" }}
    >
      {/* HEADER */}
      <Header
        onFolderSelect={(files) => {
          const mapped: ImageItem[] = files.map((file) => ({
            src: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
          }));

          setImages(mapped);
        }}
      />

      {/* SEARCH BAR */}
      <div className="p-2 border-b">
        <input
          type="text"
          placeholder="Search images..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      {/* SORT CONTROLS */}
      <div className="flex gap-2 p-2 text-sm cu">
        <button
          className="px-4 py-2 bg-gray-600 rounded"
          onClick={() => setSortBy("name")}
        >
          Name
        </button>

        <button
          className="px-4 py-2 bg-gray-600 rounded"
          onClick={() => setSortBy("size")}
        >
          Size
        </button>

        <button
          className="px-4 py-2 bg-gray-600 rounded"
          style={{ marginLeft: "1vw" }}
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          Toggle Order
        </button>
      </div>

      {/* GALLERY */}
      <main className="flex-1 p-4">
        <Gallery images={sortedImages} />
      </main>
    </div>
  );
}
