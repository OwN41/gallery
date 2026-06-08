"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ImageCard from "./imageCard";
import ImagePreview from "./imagePreview";
import VideoCard from "./videoCard";
import VideoPreview from "./videoPreview";

type MediaItem = {
  file: File;
  name: string;
  size: number;
  lastModified: number;
};

const ITEMS_PER_PAGE = 24;

interface GalleryProps {
  images: MediaItem[];
}

export default function Gallery({ images }: Readonly<GalleryProps>) {
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());
  const urlCacheRef = useRef<Map<string, string>>(new Map());

  // Calculate pagination - memoize to prevent infinite loop
  const paginatedImages = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    return images.slice(startIdx, endIdx);
  }, [images, currentPage]);

  const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE);

  // Generate URLs for current page images
  useEffect(() => {
    const newUrls = new Map(urlCacheRef.current);

    paginatedImages.forEach((img) => {
      const key = `${img.file.name}-${img.file.lastModified}`;
      if (!newUrls.has(key)) {
        const url = URL.createObjectURL(img.file);
        newUrls.set(key, url);
      }
    });

    // Also generate URL for preview if it exists
    if (preview) {
      const key = `${preview.file.name}-${preview.file.lastModified}`;
      if (!newUrls.has(key)) {
        const url = URL.createObjectURL(preview.file);
        newUrls.set(key, url);
      }
    }

    urlCacheRef.current = newUrls;
    setUrlMap(new Map(newUrls));
  }, [paginatedImages, preview]);

  // Cleanup URLs only on unmount
  useEffect(() => {
    return () => {
      urlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlCacheRef.current.clear();
    };
  }, []);

  // Scroll to top smoothly when page changes
  useEffect(() => {
    requestAnimationFrame(() => {
      globalThis.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [currentPage]);

  return (
    <>
      {images.length > 0 ? (
        <>
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {paginatedImages.map((img) => {
                const key = `${img.file.name}-${img.file.lastModified}`;
                const url = urlMap.get(key);

                // Only render if URL is available
                if (!url) return null;

                if (img.file.type.startsWith("video/")) {
                  return (
                    <VideoCard
                      key={key}
                      src={url}
                      name={img.name}
                      size={img.size}
                      lastModified={img.lastModified}
                      onOpen={() => setPreview(img)}
                    />
                  );
                }

                return (
                  <ImageCard
                    key={key}
                    src={url}
                    name={img.name}
                    size={img.size}
                    lastModified={img.lastModified}
                    onOpen={() => setPreview(img)}
                  />
                );
              })}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 p-4 border-t">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                title="Go to first page"
              >
                ⏮ First
              </button>

              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                ← Previous
              </button>

              <span className="text-sm text-gray-300 px-2">
                Page {currentPage} of {totalPages} ({images.length} items)
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Next →
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                title="Go to last page"
              >
                Last ⏭
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">No media selected</div>
      )}

      {preview &&
        (() => {
          const url = urlMap.get(
            `${preview.file.name}-${preview.file.lastModified}`,
          );
          if (!url) return null;

          if (preview.file.type.startsWith("video/")) {
            return (
              <VideoPreview
                src={url}
                name={preview.name}
                onClose={() => setPreview(null)}
              />
            );
          }

          return (
            <ImagePreview
              src={url}
              name={preview.name}
              onClose={() => setPreview(null)}
            />
          );
        })()}
    </>
  );
}
