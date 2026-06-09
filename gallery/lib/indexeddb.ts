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
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
  sortBy: "name" | "size" | "date";
  sortDir: "asc" | "desc";
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
    "file" in entry &&
    (entry as { file?: unknown }).file instanceof File
  ) {
    return entry as PersistedMediaEntry;
  }

  if (
    typeof entry === "object" &&
    entry !== null &&
    "storage" in entry &&
    (entry as { storage?: unknown }).storage === "handle" &&
    "handle" in entry &&
    isHandleLike((entry as { handle?: unknown }).handle)
  ) {
    return entry as PersistedMediaEntry;
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
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () =>
      reject(toError(request.error, "Failed to open IndexedDB for media save"));

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
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Clear previous files
      store.clear();

      // Save entries with index
      entries.forEach((entry, index) => {
        store.put(entry, index);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          toError(transaction.error, "Failed to write media into IndexedDB"),
        );
    };
  });
}

const isHandleLike = (value: unknown): value is FileSystemFileHandleLike =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { getFile?: unknown }).getFile === "function";

export async function loadMediaFromDB(): Promise<PersistedMediaEntry[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () =>
      reject(toError(request.error, "Failed to open IndexedDB for media load"));

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
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const normalized = (getAllRequest.result as unknown[])
          .map(normalizePersistedEntry)
          .filter(isPersistedMediaEntry);

        resolve(normalized);
      };

      getAllRequest.onerror = () =>
        reject(
          toError(getAllRequest.error, "Failed to read media from IndexedDB"),
        );
    };
  });
}

export async function clearMediaFromDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          toError(transaction.error, "Failed to clear media from IndexedDB"),
        );
    };

    request.onerror = () =>
      reject(
        toError(request.error, "Failed to open IndexedDB for media clear"),
      );
  });
}

export async function saveFilterStateToDB(
  filterState: FilterState,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () =>
      reject(
        toError(request.error, "Failed to open IndexedDB for filter save"),
      );

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILTER_STORE_NAME)) {
        db.createObjectStore(FILTER_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(FILTER_STORE_NAME, "readwrite");
      const store = transaction.objectStore(FILTER_STORE_NAME);

      store.put(filterState, "filters");

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(toError(transaction.error, "Failed to write filter state"));
    };
  });
}

export async function loadFilterStateFromDB(): Promise<FilterState | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () =>
      reject(
        toError(request.error, "Failed to open IndexedDB for filter load"),
      );

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILTER_STORE_NAME)) {
        db.createObjectStore(FILTER_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(FILTER_STORE_NAME, "readonly");
      const store = transaction.objectStore(FILTER_STORE_NAME);
      const getRequest = store.get("filters");

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () =>
        reject(toError(getRequest.error, "Failed to read filter state"));
    };
  });
}
