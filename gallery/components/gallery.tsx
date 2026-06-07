"use client";

import { useState, useEffect, useRef } from "react";
import ImageCard from "./imageCard";
import ImagePreview from "./imagePreview";

type ImageItem = {
  file: File;
  name: string;
  size: number;
  lastModified: number;
};

const ITEMS_PER_PAGE = 24;

interface GalleryProps {
  images: ImageItem[];
}

export default function Gallery({ images }: GalleryProps) {
  const [preview, setPreview] = useState<ImageItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const urlCacheRef = useRef<Map<string, string>>(new Map());

  // Get or create URL for an image
  const getUrl = (img: ImageItem): string => {
    const key = `${img.file.name}-${img.file.lastModified}`;

    // If already cached, return it
    if (urlCacheRef.current.has(key)) {
      return urlCacheRef.current.get(key)!;
    }

    // Create URL synchronously and cache it
    const url = URL.createObjectURL(img.file);
    urlCacheRef.current.set(key, url);
    return url;
  };

  // Cleanup URLs only on unmount
  useEffect(() => {
    return () => {
      urlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlCacheRef.current.clear();
    };
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Calculate pagination
  const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedImages = images.slice(startIdx, endIdx);

  return (
    <>
      {images.length > 0 ? (
        <>
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {paginatedImages.map((img) => (
                <ImageCard
                  key={`${img.file.name}-${img.file.lastModified}`}
                  src={getUrl(img)}
                  name={img.name}
                  size={img.size}
                  lastModified={img.lastModified}
                  onOpen={() => setPreview(img)}
                />
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                ← Previous
              </button>

              <span className="text-sm text-gray-300">
                Page {currentPage} of {totalPages} ({images.length} images)
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">
          No images selected
        </div>
      )}

      {preview && (
        <ImagePreview
          src={getUrl(preview)}
          name={preview.name}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
