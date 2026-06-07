"use client";

import { useMemo, useState, useEffect } from "react";
import Header from "@/components/header";
import Gallery from "@/components/gallery";
import {
  saveFilesToDB,
  loadFilesFromDB,
  clearFilesFromDB,
  saveFilterStateToDB,
  loadFilterStateFromDB,
  type FilterState,
} from "@/lib/indexeddb";

type ImageItem = {
  file: File;
  name: string;
  size: number;
  lastModified: number;
};

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<ImageItem[]>([]);

  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [search, setSearch] = useState("");

  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");

  // Load saved files and filter state on mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const [savedFiles, savedFilters] = await Promise.all([
          loadFilesFromDB(),
          loadFilterStateFromDB(),
        ]);

        if (savedFiles.length > 0) {
          const newImages: ImageItem[] = savedFiles
            .filter((file) => file.type.startsWith("image/"))
            .map((file) => ({
              file,
              name: file.name,
              size: file.size,
              lastModified: file.lastModified,
            }));
          setImages(newImages);
        }

        if (savedFilters) {
          setSearch(savedFilters.search);
          setSelectedYear(savedFilters.selectedYear);
          setSelectedMonth(savedFilters.selectedMonth);
          setSelectedDay(savedFilters.selectedDay);
          setSortBy(savedFilters.sortBy);
          setSortDir(savedFilters.sortDir);
        }
      } catch (error) {
        console.error("Failed to load saved data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSaved();
  }, []);

  // PREVENT BROWSER DROP NAVIGATION
  // -----------------------------
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);

    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  // Save filter state whenever filters change
  useEffect(() => {
    const filterState: FilterState = {
      search,
      selectedYear,
      selectedMonth,
      selectedDay,
      sortBy,
      sortDir,
    };
    saveFilterStateToDB(filterState).catch((error) =>
      console.error("Failed to save filter state:", error),
    );
  }, [search, selectedYear, selectedMonth, selectedDay, sortBy, sortDir]);

  // -----------------------------
  // DATE INFO
  // -----------------------------
  const dateInfo = useMemo(() => {
    return images.map((img) => {
      const d = new Date(img.lastModified);
      return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      };
    });
  }, [images]);

  const years = useMemo(() => {
    return Array.from(new Set(dateInfo.map((d) => d.year))).sort(
      (a, b) => b - a,
    );
  }, [dateInfo]);

  const months = useMemo(() => {
    return Array.from(
      new Set(
        dateInfo
          .filter((d) =>
            selectedYear === "all" ? true : d.year === Number(selectedYear),
          )
          .map((d) => d.month),
      ),
    ).sort((a, b) => a - b);
  }, [dateInfo, selectedYear]);

  const days = useMemo(() => {
    return Array.from(
      new Set(
        dateInfo
          .filter((d) =>
            selectedYear === "all" ? true : d.year === Number(selectedYear),
          )
          .filter((d) =>
            selectedMonth === "all" ? true : d.month === Number(selectedMonth),
          )
          .map((d) => d.day),
      ),
    ).sort((a, b) => a - b);
  }, [dateInfo, selectedYear, selectedMonth]);

  // -----------------------------
  // FILTERING
  // -----------------------------
  const filteredImages = images.filter((img) => {
    const date = new Date(img.lastModified);

    const matchesSearch = img.name.toLowerCase().includes(search.toLowerCase());

    const matchesYear =
      selectedYear === "all" || date.getFullYear() === Number(selectedYear);

    const matchesMonth =
      selectedMonth === "all" || date.getMonth() + 1 === Number(selectedMonth);

    const matchesDay =
      selectedDay === "all" || date.getDate() === Number(selectedDay);

    return matchesSearch && matchesYear && matchesMonth && matchesDay;
  });

  // -----------------------------
  // SORTING
  // -----------------------------
  const sortedImages = [...filteredImages].sort((a, b) => {
    let compare = 0;

    if (sortBy === "size") compare = a.size - b.size;
    if (sortBy === "name") compare = a.name.localeCompare(b.name);
    if (sortBy === "date") compare = a.lastModified - b.lastModified;

    const dir = sortDir === "asc" ? -1 : 1;
    return compare * dir;
  });

  const handleSort = (field: "name" | "size" | "date") => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // -----------------------------
  // FILE HANDLER (USED BY BOTH DROP + INPUT)
  // -----------------------------
  const handleFiles = async (
    fileList: FileList | File[],
    mode: "replace" | "append" = "replace",
  ) => {
    const files = Array.from(fileList);

    const newImages: ImageItem[] = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        file,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      }));

    setImages((prev) => {
      const updated = mode === "append" ? [...prev, ...newImages] : newImages;
      // Save to IndexedDB
      saveFilesToDB(updated.map((img) => img.file)).catch((error) =>
        console.error("Failed to save files:", error),
      );
      return updated;
    });
  };

  // -----------------------------
  // DROP HANDLER (FIXED)
  // -----------------------------
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const items = e.dataTransfer.items;
    if (!items) return;

    type FileSystemEntry = {
      isFile: boolean;
      isDirectory: boolean;
      file?: (callback: (file: File) => void) => void;
      createReader?: () => {
        readEntries: (callback: (entries: FileSystemEntry[]) => void) => void;
      };
    };

    const traverseFileTree = async (
      entry: FileSystemEntry,
    ): Promise<File[]> => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          entry.file?.((file: File) => resolve([file]));
        });
      }

      if (entry.isDirectory) {
        const reader = entry.createReader?.();
        if (!reader) return [];

        let allEntries: FileSystemEntry[] = [];

        while (true) {
          const entries: FileSystemEntry[] = await new Promise((resolve) =>
            reader.readEntries(resolve),
          );

          if (!entries.length) break;
          allEntries = allEntries.concat(entries);
        }

        const nested = await Promise.all(allEntries.map(traverseFileTree));
        return nested.flat();
      }

      return [];
    };

    const allFiles: File[] = [];

    for (const item of items) {
      const entry = item.webkitGetAsEntry?.() as FileSystemEntry | null;
      if (entry) {
        const files = await traverseFileTree(entry);
        allFiles.push(...files);
      }
    }

    handleFiles(allFiles, "replace");
  };

  return (
    <div className="min-h-screen flex flex-col px-4">
      {/* HEADER */}
      <Header onFolderSelect={handleFiles} />

      {/* SEARCH + FILTERS */}
      <div className="flex gap-2 p-2 border-b text-sm flex-wrap items-center">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">All Months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">All Days</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search images..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[200px]"
        />
      </div>

      {/* SORT */}
      <div className="flex gap-2 p-2 text-sm">
        <button
          className={`px-3 py-2 rounded hover:bg-gray-800 ${
            sortBy === "name"
              ? "bg-gray-700 text-white"
              : "bg-gray-600 text-white"
          }`}
          onClick={() => handleSort("name")}
        >
          Name {sortBy === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>

        <button
          className={`px-3 py-2 rounded hover:bg-gray-800 ${
            sortBy === "size"
              ? "bg-gray-700 text-white"
              : "bg-gray-600 text-white"
          }`}
          onClick={() => handleSort("size")}
        >
          Size {sortBy === "size" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>

        <button
          className={`px-3 py-2 rounded hover:bg-gray-800 ${
            sortBy === "date"
              ? "bg-gray-700 text-white"
              : "bg-gray-600 text-white"
          }`}
          onClick={() => handleSort("date")}
        >
          Date {sortBy === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>
      </div>

      {/* COUNT */}
      <div className="px-2 py-2 text-sm text-white border-b">
        <span className="font-semibold">{sortedImages.length}</span> images
        loaded
      </div>

      {/* GALLERY + DROP AREA */}
      <main
        className="flex-1 p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <p className="text-sm">Loading saved images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-gray-600 rounded-lg text-gray-300">
            <p className="mb-4 text-sm">Drop a folder here or select one</p>

            <label className="px-4 py-2 bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-700">
              Select Folder
              <input
                type="file"
                webkitdirectory="true"
                multiple
                hidden
                onChange={(e) =>
                  e.target.files && handleFiles(e.target.files, "replace")
                }
              />
            </label>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-400">
                Drag & drop images or folders here
              </div>
              <button
                onClick={async () => {
                  await clearFilesFromDB();
                  setImages([]);
                }}
                className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Saved
              </button>
            </div>

            <Gallery images={sortedImages} />
          </>
        )}
      </main>
    </div>
  );
}
