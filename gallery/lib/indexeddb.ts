const DB_NAME = "gallery-app";
const STORE_NAME = "saved-files";
const FILTER_STORE_NAME = "filter-state";

export type FilterState = {
  search: string;
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
  sortBy: "name" | "size" | "date";
  sortDir: "asc" | "desc";
};

export async function saveFilesToDB(files: File[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => reject(request.error);

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

      // Save new files with index
      files.forEach((file, index) => {
        store.put(file, index);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

export async function loadFilesFromDB(): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => reject(request.error);

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
        resolve(getAllRequest.result);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

export async function clearFilesFromDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function saveFilterStateToDB(filterState: FilterState): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => reject(request.error);

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
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

export async function loadFilterStateFromDB(): Promise<FilterState | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => reject(request.error);

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

      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}
