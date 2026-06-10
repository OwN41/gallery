const DB_NAME = "gallery-app";
const STORE_NAME = "saved-files";
const FILTER_STORE_NAME = "filter-state";

export type FileSystemFileHandleLike = {
  getFile: () => Promise<File>;
};

export type PersistedMediaEntry =
  | {
      storage: "file";
      file: File;
    }
  | {
      storage: "handle";
      handle: FileSystemFileHandleLike;
    };

export type FilterState = {
  search: string;
  mediaType: "all" | "images" | "videos";
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
  sortBy: "name" | "size" | "date";
  sortDir: "asc" | "desc";
};

const isBlobLike = (value: unknown): value is Blob =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Blob).arrayBuffer === "function" &&
  typeof (value as Blob).type === "string";

const coerceToFile = (value: unknown): File | null => {
  if (value instanceof File) return value;
  if (!isBlobLike(value)) return null;

  const blobLike = value as Blob & {
    name?: unknown;
    lastModified?: unknown;
  };

  const name =
    typeof blobLike.name === "string" && blobLike.name.length > 0
      ? blobLike.name
      : "restored-media";
  const lastModified =
    typeof blobLike.lastModified === "number"
      ? blobLike.lastModified
      : Date.now();

  return new File([blobLike], name, {
    type: blobLike.type,
    lastModified,
  });
};

const toError = (value: unknown, fallbackMessage: string): Error => {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  return new Error(fallbackMessage);
};

const normalizePersistedEntry = (
  entry: unknown,
): PersistedMediaEntry | null => {
  if (
    typeof entry === "object" &&
    entry !== null &&
    "storage" in entry &&
    (entry as { storage?: unknown }).storage === "file" &&
    "file" in entry
  ) {
    const file = coerceToFile((entry as { file?: unknown }).file);
    if (file) {
      return { storage: "file", file };
    }
  }

  if (
    typeof entry === "object" &&
    entry !== null &&
    "storage" in entry &&
    (entry as { storage?: unknown }).storage === "handle" &&
    "handle" in entry
  ) {
    const handle = (entry as { handle?: unknown }).handle;
    if (isHandleLike(handle)) {
      return { storage: "handle", handle };
    }

    // Some browsers/versions may restore handle-like objects with a shape that
    // doesn't satisfy our narrow type guard. Keep them so the caller can
    // request permission or gracefully recover instead of silently dropping.
    if (typeof handle === "object" && handle !== null) {
      return {
        storage: "handle",
        handle: handle as FileSystemFileHandleLike,
      };
    }
  }

  // Backward compatibility: older versions stored raw File objects.
  if (entry instanceof File) {
    return { storage: "file", file: entry };
  }

  return null;
};

const isPersistedMediaEntry = (
  entry: PersistedMediaEntry | null,
): entry is PersistedMediaEntry => entry !== null;

export async function saveMediaToDB(
  entries: PersistedMediaEntry[],
): Promise<void> {
  console.debug("[gallery:db] saveMediaToDB start", {
    entryCount: entries.length,
  });

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => {
      console.debug("[gallery:db] saveMediaToDB open failed", {
        error: request.error,
      });
      reject(toError(request.error, "Failed to open IndexedDB for media save"));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(FILTER_STORE_NAME)) {
        db.createObjectStore(FILTER_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      console.debug("[gallery:db] saveMediaToDB open success");
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Clear previous files
      store.clear();

      // Save entries with index
      entries.forEach((entry, index) => {
        store.put(entry, index);
      });

      transaction.oncomplete = () => {
        console.debug("[gallery:db] saveMediaToDB complete", {
          writtenCount: entries.length,
        });
        resolve();
      };
      transaction.onerror = () => {
        console.debug("[gallery:db] saveMediaToDB transaction failed", {
          error: transaction.error,
        });
        reject(
          toError(transaction.error, "Failed to write media into IndexedDB"),
        );
      };
    };
  });
}

const isHandleLike = (value: unknown): value is FileSystemFileHandleLike => {
  if (typeof value !== "object" || value === null) return false;
  const maybeHandle = value as { getFile?: unknown; kind?: unknown };

  if (typeof maybeHandle.getFile === "function") return true;

  // Fallback for handle-like values that keep identity but lose method typing
  // across serialization boundaries.
  return maybeHandle.kind === "file";
};

export async function loadMediaFromDB(): Promise<PersistedMediaEntry[]> {
  console.debug("[gallery:db] loadMediaFromDB start");

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => {
      console.debug("[gallery:db] loadMediaFromDB open failed", {
        error: request.error,
      });
      reject(toError(request.error, "Failed to open IndexedDB for media load"));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(FILTER_STORE_NAME)) {
        db.createObjectStore(FILTER_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      console.debug("[gallery:db] loadMediaFromDB open success");
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const normalized = (getAllRequest.result as unknown[])
          .map(normalizePersistedEntry)
          .filter(isPersistedMediaEntry);

        console.debug("[gallery:db] loadMediaFromDB complete", {
          rawCount: getAllRequest.result.length,
          normalizedCount: normalized.length,
        });

        resolve(normalized);
      };

      getAllRequest.onerror = () => {
        console.debug("[gallery:db] loadMediaFromDB read failed", {
          error: getAllRequest.error,
        });
        reject(
          toError(getAllRequest.error, "Failed to read media from IndexedDB"),
        );
      };
    };
  });
}

export async function clearMediaFromDB(): Promise<void> {
  console.debug("[gallery:db] clearMediaFromDB start");

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onsuccess = () => {
      console.debug("[gallery:db] clearMediaFromDB open success");
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      transaction.oncomplete = () => {
        console.debug("[gallery:db] clearMediaFromDB complete");
        resolve();
      };
      transaction.onerror = () => {
        console.debug("[gallery:db] clearMediaFromDB transaction failed", {
          error: transaction.error,
        });
        reject(
          toError(transaction.error, "Failed to clear media from IndexedDB"),
        );
      };
    };

    request.onerror = () => {
      console.debug("[gallery:db] clearMediaFromDB open failed", {
        error: request.error,
      });
      reject(
        toError(request.error, "Failed to open IndexedDB for media clear"),
      );
    };
  });
}

export async function saveFilterStateToDB(
  filterState: FilterState,
): Promise<void> {
  console.debug("[gallery:db] saveFilterStateToDB start", filterState);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => {
      console.debug("[gallery:db] saveFilterStateToDB open failed", {
        error: request.error,
      });
      reject(
        toError(request.error, "Failed to open IndexedDB for filter save"),
      );
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILTER_STORE_NAME)) {
        db.createObjectStore(FILTER_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      console.debug("[gallery:db] saveFilterStateToDB open success");
      const db = request.result;
      const transaction = db.transaction(FILTER_STORE_NAME, "readwrite");
      const store = transaction.objectStore(FILTER_STORE_NAME);

      store.put(filterState, "filters");

      transaction.oncomplete = () => {
        console.debug("[gallery:db] saveFilterStateToDB complete");
        resolve();
      };
      transaction.onerror = () => {
        console.debug("[gallery:db] saveFilterStateToDB transaction failed", {
          error: transaction.error,
        });
        reject(toError(transaction.error, "Failed to write filter state"));
      };
    };
  });
}

export async function loadFilterStateFromDB(): Promise<FilterState | null> {
  console.debug("[gallery:db] loadFilterStateFromDB start");

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => {
      console.debug("[gallery:db] loadFilterStateFromDB open failed", {
        error: request.error,
      });
      reject(
        toError(request.error, "Failed to open IndexedDB for filter load"),
      );
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILTER_STORE_NAME)) {
        db.createObjectStore(FILTER_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      console.debug("[gallery:db] loadFilterStateFromDB open success");
      const db = request.result;
      const transaction = db.transaction(FILTER_STORE_NAME, "readonly");
      const store = transaction.objectStore(FILTER_STORE_NAME);
      const getRequest = store.get("filters");

      getRequest.onsuccess = () => {
        console.debug("[gallery:db] loadFilterStateFromDB complete", {
          hasFilters: Boolean(getRequest.result),
        });
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () => {
        console.debug("[gallery:db] loadFilterStateFromDB read failed", {
          error: getRequest.error,
        });
        reject(toError(getRequest.error, "Failed to read filter state"));
      };
    };
  });
}
