"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Header from "@/components/header";
import Gallery from "@/components/gallery";
import {
  saveMediaToDB,
  loadMediaFromDB,
  clearMediaFromDB,
  saveFilterStateToDB,
  loadFilterStateFromDB,
  type FileSystemFileHandleLike,
  type PersistedMediaEntry,
  type FilterState,
} from "@/lib/indexeddb";
import { toast } from "react-toastify";

type MediaItem = {
  id: string;
  storage: "file" | "handle";
  file?: File;
  handle?: FileSystemFileHandleLike;
  type: string;
  name: string;
  size: number;
  lastModified: number;
};

type SortField = "name" | "size" | "date";

type FileSystemEntry = {
  isFile: boolean;
  isDirectory: boolean;
  file?: (callback: (file: File) => void) => void;
  createReader?: () => {
    readEntries: (callback: (entries: FileSystemEntry[]) => void) => void;
  };
};

type DataTransferItemWithHandle = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
};

const MEDIA_EXTENSION_REGEX =
  /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp|mp4|m4v|mov|mkv|webm|avi|wmv|flv|3gp)$/i;

const isSupportedMedia = (mimeType: string, fileName?: string) => {
  if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
    return true;
  }

  return typeof fileName === "string" && MEDIA_EXTENSION_REGEX.test(fileName);
};

const supportsDirectoryPicker = () => {
  const windowLike = globalThis as unknown as {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };
  const supported = typeof windowLike.showDirectoryPicker === "function";

  return supported;
};

const collectFileHandlesFromFSHandle = async (
  handle: FileSystemHandle,
): Promise<FileSystemFileHandle[]> => {
  if (handle.kind === "file") {
    return [handle as FileSystemFileHandle];
  }

  const directoryHandle = handle as FileSystemDirectoryHandle;
  const fileHandles: FileSystemFileHandle[] = [];

  for await (const [, entry] of directoryHandle.entries()) {
    fileHandles.push(...(await collectFileHandlesFromFSHandle(entry)));
  }

  return fileHandles;
};

const isNotNull = <T,>(value: T | null): value is T => value !== null;

const buildMediaId = (
  storage: "file" | "handle",
  name: string,
  lastModified: number,
  size: number,
  index: number,
) => `${storage}-${name}-${lastModified}-${size}-${index}`;

const mapFilesToMediaItems = (files: File[]) =>
  files
    .filter((file) => isSupportedMedia(file.type, file.name))
    .map((file, index) => ({
      id: buildMediaId("file", file.name, file.lastModified, file.size, index),
      storage: "file" as const,
      file,
      type: file.type,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    }));

const mapHandlesToMediaItems = async (
  handles: FileSystemFileHandle[],
): Promise<MediaItem[]> => {
  const items = await Promise.all(
    handles.map(async (handle, index) => {
      try {
        const file = await handle.getFile();
        if (!isSupportedMedia(file.type, file.name)) {
          return null;
        }

        const item: MediaItem = {
          id: buildMediaId(
            "handle",
            file.name,
            file.lastModified,
            file.size,
            index,
          ),
          storage: "handle" as const,
          handle,
          type: file.type,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
        };

        return item;
      } catch (error) {
        console.error("Failed to read file handle:", error);
        return null;
      }
    }),
  );

  const mapped = items.filter(isNotNull);
  return mapped;
};

type RestoreResult = {
  items: MediaItem[];
  needsPermission: FileSystemFileHandleLike[];
  notAccessible: number;
};

const mapPersistedMediaToItems = async (
  entries: PersistedMediaEntry[],
): Promise<RestoreResult> => {
  type EntryResult =
    | { tag: "ok"; item: MediaItem }
    | { tag: "needs-permission"; handle: FileSystemFileHandleLike }
    | { tag: "inaccessible" }
    | null;

  const results = await Promise.all(
    entries.map(async (entry, index): Promise<EntryResult> => {
      if (entry.storage === "file") {
        const { file } = entry;
        if (!isSupportedMedia(file.type, file.name)) return null;

        return {
          tag: "ok",
          item: {
            id: buildMediaId(
              "file",
              file.name,
              file.lastModified,
              file.size,
              index,
            ),
            storage: "file" as const,
            file,
            type: file.type,
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
          },
        };
      }

      try {
        // Proactively check permission before calling getFile().
        // On page reload Chrome resets permission state to "prompt", which
        // means getFile() can throw various DOMExceptions. queryPermission
        // is the reliable way to detect this before attempting the call.
        const handleWithPerm = entry.handle as FileSystemFileHandleLike & {
          queryPermission?: (d: { mode: string }) => Promise<PermissionState>;
        };
        if (typeof handleWithPerm.queryPermission === "function") {
          const state = await handleWithPerm.queryPermission({ mode: "read" });
          if (state !== "granted") {
            return { tag: "needs-permission", handle: entry.handle };
          }
        }

        const file = await entry.handle.getFile();
        if (!isSupportedMedia(file.type, file.name)) return null;

        return {
          tag: "ok",
          item: {
            id: buildMediaId(
              "handle",
              file.name,
              file.lastModified,
              file.size,
              index,
            ),
            storage: "handle" as const,
            handle: entry.handle,
            type: file.type,
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
          },
        };
      } catch (error) {
        // Treat any error as needing permission re-grant. After a reload,
        // getFile() can throw NotAllowedError, SecurityError, InvalidStateError,
        // or others — all mean the handle needs the user to re-authorise it.
        console.error("Failed to restore media handle:", error);
        return { tag: "needs-permission", handle: entry.handle };
      }
    }),
  );

  const items = results
    .filter((r): r is { tag: "ok"; item: MediaItem } => r?.tag === "ok")
    .map((r) => r.item);

  const needsPermission = results
    .filter(
      (r): r is { tag: "needs-permission"; handle: FileSystemFileHandleLike } =>
        r?.tag === "needs-permission",
    )
    .map((r) => r.handle);

  const notAccessible = results.filter((r) => r?.tag === "inaccessible").length;

  return { items, needsPermission, notAccessible };
};

const toPersistedEntries = (items: MediaItem[]): PersistedMediaEntry[] =>
  items.flatMap((item): PersistedMediaEntry[] => {
    if (item.storage === "handle" && item.handle) {
      return [{ storage: "handle", handle: item.handle }];
    }

    if (item.storage === "file" && item.file) {
      return [{ storage: "file", file: item.file }];
    }

    return [];
  });

const getSortIndicator = (
  sortBy: SortField,
  sortDir: "asc" | "desc",
  field: SortField,
) => {
  if (sortBy !== field) return "";
  return sortDir === "asc" ? "↑" : "↓";
};

const readFileFromEntry = (entry: FileSystemEntry): Promise<File[]> =>
  new Promise((resolve) => {
    entry.file?.((file: File) => {
      resolve([file]);
    });
  });

const readEntriesBatch = (reader: {
  readEntries: (callback: (entries: FileSystemEntry[]) => void) => void;
}): Promise<FileSystemEntry[]> =>
  new Promise((resolve) => reader.readEntries(resolve));

const traverseFileTree = async (entry: FileSystemEntry): Promise<File[]> => {
  if (entry.isFile) return readFileFromEntry(entry);
  if (!entry.isDirectory) return [];

  const reader = entry.createReader?.();
  if (!reader) return [];

  const allEntries: FileSystemEntry[] = [];
  while (true) {
    const entries = await readEntriesBatch(reader);
    if (!entries.length) break;
    allEntries.push(...entries);
  }

  const nested = await Promise.all(allEntries.map(traverseFileTree));
  const flattened = nested.flat();
  return flattened;
};

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pendingPermissionHandles, setPendingPermissionHandles] = useState<
    FileSystemFileHandleLike[]
  >([]);
  const emptyStateInputRef = useRef<HTMLInputElement | null>(null);

  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState<"all" | "images" | "videos">(
    "all",
  );

  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");

  // Load saved files and filter state on mount
  useEffect(() => {
    const loadSaved = async () => {
      setPendingPermissionHandles([]);
      try {
        const [savedMedia, savedFilters] = await Promise.all([
          loadMediaFromDB(),
          loadFilterStateFromDB(),
        ]);

        if (savedMedia.length > 0) {
          const { items, needsPermission, notAccessible } =
            await mapPersistedMediaToItems(savedMedia);
          console.debug("[gallery:init] Restore classification", {
            savedMediaCount: savedMedia.length,
            itemsCount: items.length,
            needsPermissionCount: needsPermission.length,
            notAccessibleCount: notAccessible,
          });
          setMediaItems(items);
          setPendingPermissionHandles(needsPermission);

          if (notAccessible > 0) {
            toast.info(
              `${notAccessible} saved file(s) are no longer accessible and were removed.`,
              { autoClose: 5000 },
            );
          }
        }

        if (savedFilters) {
          setSearch(savedFilters.search);
          setMediaType(savedFilters.mediaType ?? "all");
          setSelectedYear(savedFilters.selectedYear);
          setSelectedMonth(savedFilters.selectedMonth);
          setSelectedDay(savedFilters.selectedDay);
          setSortBy(savedFilters.sortBy);
          setSortDir(savedFilters.sortDir);
        }
      } catch (error) {
        console.error("Failed to load saved data:", error);
      } finally {
        console.debug("[gallery:init] Initial load complete");
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

    globalThis.addEventListener("dragover", preventDefault);
    globalThis.addEventListener("drop", preventDefault);

    return () => {
      globalThis.removeEventListener("dragover", preventDefault);
      globalThis.removeEventListener("drop", preventDefault);
    };
  }, []);

  // Save filter state whenever filters change
  useEffect(() => {
    const filterState: FilterState = {
      search,
      mediaType,
      selectedYear,
      selectedMonth,
      selectedDay,
      sortBy,
      sortDir,
    };
    console.debug("[gallery:filters] Persisting filter state", filterState);
    saveFilterStateToDB(filterState).catch((error) =>
      console.error("Failed to save filter state:", error),
    );
  }, [
    search,
    mediaType,
    selectedYear,
    selectedMonth,
    selectedDay,
    sortBy,
    sortDir,
  ]);

  // -----------------------------
  // DATE INFO
  // -----------------------------
  const dateInfo = useMemo(() => {
    return mediaItems.map((img) => {
      const d = new Date(img.lastModified);
      return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      };
    });
  }, [mediaItems]);

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
  const filteredMedia = mediaItems.filter((img) => {
    const date = new Date(img.lastModified);

    const matchesSearch = img.name.toLowerCase().includes(search.toLowerCase());

    const matchesMediaType =
      mediaType === "all" ||
      (mediaType === "images" && img.type.startsWith("image/")) ||
      (mediaType === "videos" && img.type.startsWith("video/"));

    const matchesYear =
      selectedYear === "all" || date.getFullYear() === Number(selectedYear);

    const matchesMonth =
      selectedMonth === "all" || date.getMonth() + 1 === Number(selectedMonth);

    const matchesDay =
      selectedDay === "all" || date.getDate() === Number(selectedDay);

    return (
      matchesSearch &&
      matchesMediaType &&
      matchesYear &&
      matchesMonth &&
      matchesDay
    );
  });

  // -----------------------------
  // SORTING
  // -----------------------------
  const sortedMedia = [...filteredMedia].sort((a, b) => {
    let compare = 0;

    if (sortBy === "size") compare = a.size - b.size;
    if (sortBy === "name") compare = a.name.localeCompare(b.name);
    if (sortBy === "date") compare = a.lastModified - b.lastModified;

    const dir = sortDir === "asc" ? -1 : 1;
    return compare * dir;
  });

  const handleSort = (field: SortField) => {
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
  const handleFiles = (
    fileList: FileList | File[],
    mode: "replace" | "append" = "replace",
  ) => {
    const files = Array.from(fileList);
    const newMediaItems = mapFilesToMediaItems(files);

    setMediaItems((prev) => {
      const updated =
        mode === "append" ? [...prev, ...newMediaItems] : newMediaItems;
      // Save only metadata handles or legacy files.
      saveMediaToDB(toPersistedEntries(updated)).catch((error) =>
        console.error("Failed to save files:", error),
      );
      return updated;
    });
  };

  const handleFolderHandles = async (
    handles: FileSystemFileHandle[],
    mode: "replace" | "append" = "replace",
  ) => {
    const newMediaItems = await mapHandlesToMediaItems(handles);

    setMediaItems((prev) => {
      const updated =
        mode === "append" ? [...prev, ...newMediaItems] : newMediaItems;

      saveMediaToDB(toPersistedEntries(updated)).catch((error) =>
        console.error("Failed to save handles:", error),
      );

      return updated;
    });
  };

  const handleReGrantAccess = async () => {
    type FullHandle = FileSystemFileHandleLike & {
      requestPermission?: (descriptor: { mode: string }) => Promise<string>;
    };

    const granted: FileSystemFileHandleLike[] = [];
    const stillPending: FileSystemFileHandleLike[] = [];

    for (const handle of pendingPermissionHandles) {
      try {
        const fullHandle = handle as FullHandle;
        if (typeof fullHandle.requestPermission === "function") {
          const result = await fullHandle.requestPermission({ mode: "read" });
          if (result !== "granted") {
            stillPending.push(handle);
            continue;
          }
        }
        granted.push(handle);
      } catch (error) {
        console.error("Failed to request permission for handle:", error);
        stillPending.push(handle);
      }
    }

    if (granted.length > 0) {
      const newItems = await mapHandlesToMediaItems(
        granted as FileSystemFileHandle[],
      );
      setMediaItems((prev) => {
        const updated = [...prev, ...newItems];
        saveMediaToDB(toPersistedEntries(updated)).catch((error) =>
          console.error("Failed to save after permission grant:", error),
        );
        return updated;
      });
    }

    setPendingPermissionHandles(stillPending);

    if (stillPending.length === 0) {
      toast.success("Access restored successfully.");
    }
  };

  const handleEmptyStateFolderSelect = async () => {
    if (!supportsDirectoryPicker()) {
      emptyStateInputRef.current?.click();
      return;
    }

    try {
      const windowLike = globalThis as unknown as {
        showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
      };

      const picker = windowLike.showDirectoryPicker;
      if (!picker) {
        emptyStateInputRef.current?.click();
        return;
      }

      const directoryHandle = await picker();
      const handles = await collectFileHandlesFromFSHandle(directoryHandle);
      await handleFolderHandles(handles, "replace");
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === "AbortError";
      if (!isAbortError) {
        console.error("Failed to pick directory from empty state:", error);
      }
    }
  };

  // -----------------------------
  // DROP HANDLER (FIXED)
  // -----------------------------
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    const items = e.dataTransfer.items;
    if (!items) return;

    const droppedItems = Array.from(items) as DataTransferItemWithHandle[];
    const supportsFSHandleDrop = droppedItems.some(
      (item) => typeof item.getAsFileSystemHandle === "function",
    );
    console.debug("[gallery:drop] Handle API support on drop items", {
      supportsFSHandleDrop,
      itemCount: droppedItems.length,
    });

    if (supportsFSHandleDrop) {
      const droppedHandles = await Promise.all(
        droppedItems.map(async (item) => {
          if (item.kind !== "file") return [] as FileSystemFileHandle[];

          const fsHandle = await item.getAsFileSystemHandle?.();
          if (!fsHandle) return [] as FileSystemFileHandle[];

          return collectFileHandlesFromFSHandle(fsHandle);
        }),
      );

      const flattenedHandles = droppedHandles.flat();
      console.debug("[gallery:drop] Collected handles from drop", {
        handleCount: flattenedHandles.length,
      });
      if (flattenedHandles.length > 0) {
        await handleFolderHandles(flattenedHandles, "replace");
        return;
      }
    }

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

  const mainContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
          <p className="text-sm">Loading saved media...</p>
        </div>
      );
    }

    if (pendingPermissionHandles.length > 0 && mediaItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-yellow-700/50 rounded-lg text-gray-300 gap-4">
          <p className="text-sm text-yellow-300">
            Your saved folder needs permission to be accessed again.
          </p>
          <button
            type="button"
            onClick={handleReGrantAccess}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 font-medium"
          >
            Re-grant Access
          </button>
          <p className="text-xs text-gray-500">Or select a new folder below</p>
          <button
            type="button"
            onClick={handleEmptyStateFolderSelect}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Select Folder
          </button>
          <input
            ref={emptyStateInputRef}
            type="file"
            webkitdirectory="true"
            multiple
            hidden
            onChange={(e) =>
              e.target.files && handleFiles(e.target.files, "replace")
            }
          />
        </div>
      );
    }

    if (mediaItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-gray-600 rounded-lg text-gray-300">
          <p className="mb-4 text-sm">Drop a folder here or select one</p>

          <button
            type="button"
            onClick={handleEmptyStateFolderSelect}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Select Folder
          </button>

          <input
            ref={emptyStateInputRef}
            type="file"
            webkitdirectory="true"
            multiple
            hidden
            onChange={(e) =>
              e.target.files && handleFiles(e.target.files, "replace")
            }
          />
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-400">
            Drag & drop images/videos or folders here
          </div>
          <button
            onClick={async () => {
              await clearMediaFromDB();
              setMediaItems([]);
              toast.info("Saved media cleared");
            }}
            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Saved
          </button>
        </div>

        <Gallery images={sortedMedia} />
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col px-4">
      {/* HEADER */}
      <Header
        onFolderSelectFiles={handleFiles}
        onFolderSelectHandles={handleFolderHandles}
      />
      {/* PERMISSION BANNER */}
      {pendingPermissionHandles.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-yellow-900/60 border-b border-yellow-700 text-yellow-200 text-sm">
          <span>
            {pendingPermissionHandles.length} folder(s) need permission to be
            read again.
          </span>
          <button
            type="button"
            onClick={handleReGrantAccess}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs font-medium"
          >
            Re-grant Access
          </button>
        </div>
      )}
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

        <select
          value={mediaType}
          onChange={(e) =>
            setMediaType(e.target.value as "all" | "images" | "videos")
          }
          className="px-3 py-2 border rounded"
        >
          <option value="all">All Media</option>
          <option value="images">Images Only</option>
          <option value="videos">Videos Only</option>
        </select>

        <input
          type="text"
          placeholder="Search media..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-50"
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
          Name {getSortIndicator(sortBy, sortDir, "name")}
        </button>

        <button
          className={`px-3 py-2 rounded hover:bg-gray-800 ${
            sortBy === "size"
              ? "bg-gray-700 text-white"
              : "bg-gray-600 text-white"
          }`}
          onClick={() => handleSort("size")}
        >
          Size {getSortIndicator(sortBy, sortDir, "size")}
        </button>

        <button
          className={`px-3 py-2 rounded hover:bg-gray-800 ${
            sortBy === "date"
              ? "bg-gray-700 text-white"
              : "bg-gray-600 text-white"
          }`}
          onClick={() => handleSort("date")}
        >
          Date {getSortIndicator(sortBy, sortDir, "date")}
        </button>
      </div>
      {/* COUNT */}
      <div className="px-2 py-2 text-sm text-white border-b">
        <span className="font-semibold">{sortedMedia.length}</span> items loaded
      </div>
      {/* GALLERY + DROP AREA */}
      <main
        className="flex-1 p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {mainContent()}
      </main>
    </div>
  );
}
