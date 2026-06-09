"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onFolderSelectFiles: (files: FileList | File[]) => void;
  onFolderSelectHandles: (handles: FileSystemFileHandle[]) => Promise<void>;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
};

const isSupportedMediaType = (mimeType: string) =>
  mimeType.startsWith("image/") || mimeType.startsWith("video/");

const supportsDirectoryPicker = () => {
  const windowLike = globalThis as unknown as DirectoryPickerWindow;
  const supported = typeof windowLike.showDirectoryPicker === "function";
  console.debug("[gallery:header] Directory picker support check", {
    supported,
  });
  return supported;
};

const collectMediaHandles = async (
  directoryHandle: FileSystemDirectoryHandle,
): Promise<FileSystemFileHandle[]> => {
  const handles: FileSystemFileHandle[] = [];

  for await (const [, entry] of directoryHandle.entries()) {
    if (entry.kind === "directory") {
      handles.push(...(await collectMediaHandles(entry)));
      continue;
    }

    const file = await entry.getFile();
    if (isSupportedMediaType(file.type)) {
      handles.push(entry);
    }
  }

  console.debug("[gallery:header] Collected handles from directory", {
    handleCount: handles.length,
  });

  return handles;
};

export default function Header({
  onFolderSelectFiles,
  onFolderSelectHandles,
}: Readonly<Props>) {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [supportsDirectoryHandles, setSupportsDirectoryHandles] =
    useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      setSupportsDirectoryHandles(supportsDirectoryPicker());
    }, 0);

    return () => globalThis.clearTimeout(timer);
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setLoading(true);
    setCount(0);

    const files = Array.from(e.target.files);
    console.debug("[gallery:header] File input selected", {
      totalCount: files.length,
    });

    const mediaFiles: File[] = [];

    // Process in chunks so UI doesn't freeze
    const CHUNK_SIZE = 500;
    let index = 0;

    const processChunk = () => {
      const chunk = files.slice(index, index + CHUNK_SIZE);

      for (const file of chunk) {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          mediaFiles.push(file);
        }
      }

      index += CHUNK_SIZE;
      setCount(mediaFiles.length);

      if (index < files.length) {
        setTimeout(processChunk, 0); // yield to browser
      } else {
        console.debug("[gallery:header] File input processing complete", {
          mediaCount: mediaFiles.length,
        });
        onFolderSelectFiles(mediaFiles);
        setLoading(false);
      }
    };

    processChunk();
  };

  const handleSelectFolder = async () => {
    console.debug("[gallery:header] Select folder clicked", {
      supportsDirectoryHandles,
    });
    if (!supportsDirectoryHandles) {
      console.debug("[gallery:header] Falling back to file input");
      fileInputRef.current?.click();
      return;
    }

    setLoading(true);
    setCount(0);

    try {
      const windowLike = globalThis as unknown as DirectoryPickerWindow;
      const picker = windowLike.showDirectoryPicker;
      if (!picker) {
        console.debug("[gallery:header] Picker missing at runtime");
        return;
      }

      const directoryHandle = await picker();
      const handles = await collectMediaHandles(directoryHandle);
      setCount(handles.length);
      console.debug("[gallery:header] Picker returned handles", {
        handleCount: handles.length,
      });
      await onFolderSelectHandles(handles);
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === "AbortError";
      if (isAbortError) {
        console.debug("[gallery:header] Picker cancelled by user");
      } else {
        console.error("Failed to pick directory:", error);
      }
    } finally {
      console.debug("[gallery:header] Folder select flow complete");
      setLoading(false);
    }
  };

  return (
    <header className="flex justify-between p-4 border-b items-center">
      <h1 className="text-white font-bold text-3xl">Gallery</h1>

      {/* loading indicator */}
      {loading && (
        <div className="text-sm text-gray-300">
          Loading... {count} files found
        </div>
      )}

      <button
        type="button"
        onClick={handleSelectFolder}
        disabled={loading}
        className={`px-4 py-2 rounded cursor-pointer text-white transition ${
          loading
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-gray-600 hover:bg-gray-800"
        }`}
      >
        <span>
          {supportsDirectoryHandles
            ? "Select Folder (Fast Local)"
            : "Select Folder"}
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        webkitdirectory="true"
        multiple
        hidden
        disabled={loading}
        onChange={handleChange}
      />
    </header>
  );
}
