# Gallery

A fully client-side image gallery application built with Next.js 16 and React 19. Load images from local folders via drag-and-drop or a folder picker, browse them in a paginated grid, filter and sort by name/size/date, preview images full-screen, and copy them to the clipboard — all without any server or backend. Your images and filter preferences are automatically saved in the browser's IndexedDB so they persist across page refreshes.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
  - [Quick Start (recommended)](#quick-start-recommended)
  - [Manual Start — Development mode](#manual-start--development-mode)
  - [Manual Start — Production mode](#manual-start--production-mode)
- [Usage](#usage)
- [Technical Documentation](#technical-documentation)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Architecture Overview](#architecture-overview)
  - [Component Reference](#component-reference)
  - [Data Persistence (IndexedDB)](#data-persistence-indexeddb)
  - [State & Data Flow](#state--data-flow)
  - [Styling](#styling)

---

## Features

- **Folder loading** — select a local folder via a file picker or drag-and-drop a folder directly onto the page; sub-folders are traversed recursively
- **Persistent storage** — loaded images and active filter/sort settings are saved to the browser's IndexedDB and restored on the next visit
- **Search** — live filter by filename (case-insensitive)
- **Date filtering** — cascading Year / Month / Day dropdowns derived from each file's `lastModified` timestamp
- **Sorting** — sort by name, file size, or date; toggle ascending/descending
- **Pagination** — 24 images per page with First / Previous / Next / Last navigation
- **Full-screen preview** — click any thumbnail to open a lightbox; double-click the preview image to copy it to the clipboard
- **Clipboard copy** — copy any image as PNG directly from the thumbnail card or the preview lightbox
- **Dark mode** — respects the OS `prefers-color-scheme` preference
- **No backend, no accounts, no network requests** — everything runs entirely in the browser

---

## Prerequisites

Before you can run Gallery you need to install **Node.js**, a free runtime that lets JavaScript programs run outside a browser. You do **not** need to know how to code — just follow the steps below.

### Step 1 — Install Node.js

1. Open your web browser and go to **https://nodejs.org/**
2. Click the button labelled **"LTS"** (Long Term Support) — this is the stable, recommended version.
3. The download will start automatically. Once it finishes, open the downloaded file (e.g. `node-v20.x.x-x64.msi` on Windows).
4. Follow the installer wizard — click **Next** on every screen and leave all settings at their defaults. Click **Install** when prompted.
5. When the installer finishes, click **Finish**.

> **How to verify Node.js installed correctly:**
> Press **Win + R**, type `cmd`, press Enter. In the black window that opens, type:
>
> ```
> node --version
> ```
>
> You should see something like `v20.19.0`. If you do, Node.js is installed and ready.

---

## Installation

### Step 2 — Download the project files

You do **not** need Git. You can download the project as a ZIP file directly from the browser:

1. Go to the project page on GitHub.
2. Click the green **Code** button near the top-right of the page.
3. In the dropdown, click **Download ZIP**.
4. Once downloaded, find the ZIP file (usually in your **Downloads** folder), right-click it, and choose **Extract All…**
5. Choose a location you can easily find — for example `C:\Projects\gallery` — and click **Extract**.

You should now have a folder called `gallery-main` (or similar) containing a `gallery/` sub-folder, a `start.bat` file, and a `start.ps1` file.

---

## Running the Application

You have two options: the easy double-click method, or a manual method using the Command Prompt.

### Option A — Double-click to start (easiest)

1. Open the folder you extracted in Step 2.
2. Double-click the file called **`start.bat`**.
3. A black Command Prompt window will open. It will automatically:
   - Download all required packages (first run only — this may take a minute or two).
   - Build the application.
   - Start the local web server.
4. When you see the line `Gallery Application starting on http://localhost:3000`, open your browser and go to:

   **http://localhost:3000**

5. The gallery will load in your browser. **Leave the black window open** while you use the app — closing it will stop the server.
6. To stop the application, click the black window and press **Ctrl + C**, then close it.

> **Tip:** Every time you want to use Gallery, just double-click `start.bat` again.

---

### Option B — Manual start using Command Prompt

Use this method if `start.bat` does not work or if you prefer more control.

#### Open the Command Prompt in the project folder

1. Press **Win + R**, type `cmd`, press **Enter** — a black window opens.
2. You need to navigate into the `gallery` sub-folder. Type the following (replace the path with wherever you extracted the files):

   ```
   cd C:\Projects\gallery-main\gallery
   ```

   Press **Enter**.

#### Install the required packages (first time only)

Type the following and press **Enter**:

```
npm install
```

This downloads all the libraries the app needs. It may take a minute. You will see a lot of text scroll by — that is normal. Wait until you see the command prompt (`>`) again.

#### Start the application

**Development mode** (easier, starts faster, shows detailed errors):

```
npm run dev
```

**Production mode** (faster app, recommended for regular use):

```
npm run build
```

Wait for the build to finish (may take 30–60 seconds), then run:

```
npm run start
```

In both cases, once you see `ready` or `started server on http://localhost:3000`, open your browser and go to:

**http://localhost:3000**

To stop the application, press **Ctrl + C** in the Command Prompt window.

---

## Usage

1. Open **http://localhost:3000** in a Chromium-based browser (Chrome, Edge) for full clipboard support.
2. **Load images** using one of these methods:
   - Click **Select Folder** in the header or in the drop-zone and choose a folder from your file system.
   - Drag and drop a folder (or individual image files) anywhere onto the page. Sub-folders are included automatically.
3. Use the **Year / Month / Day** dropdowns to filter images by their last-modified date.
4. Use the **Search** box to filter images by filename.
5. Click **Name**, **Size**, or **Date** to sort; click the same button again to reverse direction.
6. Navigate between pages using the **First / Previous / Next / Last** buttons at the bottom of the grid.
7. Click a thumbnail to open the **full-screen preview**. Double-click the preview image to copy it to the clipboard.
8. Click the **copy icon** on any thumbnail card to copy that image to the clipboard as PNG.
9. Click **Clear Saved** to remove all images from IndexedDB and reset the gallery.

> **Note:** Image data is stored locally in the browser's IndexedDB. No image data is ever sent to a server.

---

## Technical Documentation

### Tech Stack

| Layer         | Technology                                                  | Version |
| ------------- | ----------------------------------------------------------- | ------- |
| Framework     | [Next.js](https://nextjs.org/)                              | 16.2.7  |
| UI library    | [React](https://react.dev/)                                 | 19.2.4  |
| Language      | TypeScript                                                  | ^5      |
| Styling       | [Tailwind CSS v4](https://tailwindcss.com/)                 | ^4      |
| Icons         | [Lucide React](https://lucide.dev/)                         | ^1.17.0 |
| Notifications | [React Toastify](https://fkhadra.github.io/react-toastify/) | ^11.1.0 |
| Persistence   | Browser IndexedDB (native)                                  | —       |
| Build tooling | PostCSS, ESLint                                             | —       |

### Project Structure

```
gallery/                      # Next.js application root
├── app/
│   ├── globals.css           # Global styles + Tailwind v4 import + CSS animations
│   ├── layout.tsx            # Root layout — mounts ToastContainer
│   └── page.tsx              # Main page — all top-level state and logic
├── components/
│   ├── header.tsx            # App header with "Select Folder" file input
│   ├── gallery.tsx           # Paginated image grid + URL object cache
│   ├── imageCard.tsx         # Single thumbnail card with copy button
│   ├── imagePreview.tsx      # Full-screen lightbox overlay
│   └── footer.tsx            # Empty placeholder
├── lib/
│   └── indexeddb.ts          # All IndexedDB read/write helpers
├── public/                   # Static assets (default Next.js SVGs)
├── next.config.ts            # Next.js config (currently empty)
├── tsconfig.json             # TypeScript config
├── postcss.config.mjs        # PostCSS + Tailwind plugin config
└── eslint.config.mjs         # ESLint config (Next.js preset)

start.bat                     # Windows batch quick-start script
start.ps1                     # PowerShell quick-start script
```

### Architecture Overview

The application is entirely client-side rendered (`"use client"` components). There is no API layer, no server-side rendering of dynamic content, and no external data sources.

```
Browser
  │
  ├─ IndexedDB  ←──────────────────────────────────────────┐
  │    ├─ "saved-files"  (File objects, persisted)         │
  │    └─ "filter-state" (sort/filter settings, persisted) │
  │                                                         │
  └─ React App (Next.js)                                   │
       │                                                    │
       ├─ page.tsx  (root state)                           │
       │    ├─ images[]        ← File objects from picker  │
       │    ├─ sort / filter   ← saved & restored ─────────┘
       │    └─ filtered/sorted view
       │
       ├─ header.tsx           ← folder picker input
       ├─ gallery.tsx          ← paginated grid + URL object cache
       │    ├─ imageCard.tsx   ← thumbnail + copy-to-clipboard
       │    └─ imagePreview.tsx ← lightbox overlay
       └─ lib/indexeddb.ts     ← persistence helpers
```

### Component Reference

#### `app/page.tsx`

The root page component. Owns all application state:

| State                    | Type                         | Purpose                                              |
| ------------------------ | ---------------------------- | ---------------------------------------------------- |
| `images`                 | `ImageItem[]`                | All loaded image files                               |
| `sortBy`                 | `"name" \| "size" \| "date"` | Active sort field                                    |
| `sortDir`                | `"asc" \| "desc"`            | Sort direction                                       |
| `search`                 | `string`                     | Filename search query                                |
| `selectedYear/Month/Day` | `string`                     | Date filter values (`"all"` or a numeric string)     |
| `isLoading`              | `boolean`                    | `true` while restoring state from IndexedDB on mount |

Key behaviours:

- On mount, restores saved `File` objects and filter state from IndexedDB in parallel.
- Prevents the browser from navigating away when files are dropped onto the window by attaching global `dragover` / `drop` listeners that call `preventDefault`.
- Saves the current filter state to IndexedDB whenever any filter or sort value changes.
- Supports drag-and-drop of folders via the `FileSystemEntry` / `webkitGetAsEntry` browser API, recursively traversing sub-directories using `DirectoryReader.readEntries`.
- Derives the available years, months, and days for the filter dropdowns as `useMemo` values computed from the `lastModified` timestamps of the loaded images.

#### `components/header.tsx`

Renders the app title ("Gallery") and a **Select Folder** button backed by `<input type="file" webkitdirectory multiple>`. Processes files in chunks of 500 to avoid blocking the main thread on large directories, showing a live count while loading.

#### `components/gallery.tsx`

Receives the sorted/filtered `ImageItem[]` array and renders a responsive CSS Grid (2 / 3 / 4 columns at sm / lg breakpoints). Responsibilities:

- **Pagination**: 24 images per page, controlled by local `currentPage` state. Scrolls to the top of the page on every page change.
- **Object URL cache**: creates `URL.createObjectURL()` for each visible image and the active preview item, storing them in a `Map` keyed by `"filename-lastModified"`. URLs are created once per unique file and are all revoked on unmount via a cleanup `useEffect`.
- **Preview**: tracks which `ImageItem` is being previewed and passes its resolved URL to `ImagePreview`.

#### `components/imageCard.tsx`

Renders a single thumbnail using `next/image` inside a fixed `aspect-square` container. The copy button pipeline:

1. `fetch()` the object URL to obtain a `Blob`.
2. Decode it into an `ImageBitmap` with `createImageBitmap`.
3. Draw onto an off-screen `<canvas>` at the image's native resolution.
4. Export the canvas as a PNG `Blob` via `canvas.toBlob`.
5. Write to the system clipboard with `navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })])`.

#### `components/imagePreview.tsx`

A `position: fixed` full-screen overlay with a dark semi-transparent backdrop. Locks `document.body` scroll while open and restores it on close. Double-clicking the image triggers the same canvas-based clipboard copy as `ImageCard`. Closes when clicking the backdrop or the `✕` button.

#### `components/footer.tsx`

Currently an empty file — reserved for future use.

### Data Persistence (IndexedDB)

All persistence logic lives in `lib/indexeddb.ts`. The database is named **`gallery-app`**, schema version **2**, and contains two object stores:

| Store name     | Key                            | Value                | Purpose                                    |
| -------------- | ------------------------------ | -------------------- | ------------------------------------------ |
| `saved-files`  | Auto-incremented integer index | `File` object        | Persists loaded images across page reloads |
| `filter-state` | `"filters"` (fixed string key) | `FilterState` object | Persists sort and filter settings          |

**`FilterState` type:**

```ts
type FilterState = {
  search: string;
  selectedYear: string; // "all" or "YYYY"
  selectedMonth: string; // "all" or "M"
  selectedDay: string; // "all" or "D"
  sortBy: "name" | "size" | "date";
  sortDir: "asc" | "desc";
};
```

**Exported functions:**

| Function                       | Description                                                           |
| ------------------------------ | --------------------------------------------------------------------- |
| `saveFilesToDB(files: File[])` | Clears the `saved-files` store then saves all provided `File` objects |
| `loadFilesFromDB()`            | Returns all `File` objects stored in `saved-files`                    |
| `clearFilesFromDB()`           | Empties the `saved-files` store                                       |
| `saveFilterStateToDB(state)`   | Persists the filter/sort state under the fixed key `"filters"`        |
| `loadFilterStateFromDB()`      | Returns the stored `FilterState`, or `null` if none exists            |

### State & Data Flow

```
User action (drop / folder picker)
        │
        ▼
  handleFiles()          ← filters for image/* MIME types only
        │
        ├── setImages()        ← updates React state
        └── saveFilesToDB()    ← persists File objects to IndexedDB

images[]  (raw list)
  │
  ├─ dateInfo (useMemo)   → years / months / days for filter dropdowns
  ├─ filteredImages       → applies search + year/month/day predicates
  └─ sortedImages         → applies sort field + direction
              │
              ▼
        <Gallery images={sortedImages} />
              │
              ├─ paginatedImages (slice of sortedImages)
              ├─ urlMap (object URL cache)
              └─ <ImageCard> × 24  +  <ImagePreview> (if open)
```

### Styling

The project uses **Tailwind CSS v4** with the new `@import "tailwindcss"` syntax in `globals.css` (replacing the legacy `@tailwind base/components/utilities` directives). PostCSS is configured in `postcss.config.mjs` using the `@tailwindcss/postcss` plugin.

Custom animations defined in `globals.css`:

| Class             | Animation                | Duration        |
| ----------------- | ------------------------ | --------------- |
| `.animate-fadeIn` | opacity 0 → 1            | 150 ms ease-out |
| `.animate-zoomIn` | scale 0.85 → 1 + fade-in | 180 ms ease-out |

The UI uses a dark colour scheme (`#222222` page background, `#333333` card backgrounds, `#444444` card borders) applied through CSS custom properties and Tailwind utility classes. The app automatically switches between light and dark backgrounds based on the `prefers-color-scheme` media query.

---

## License

See the [LICENSE](LICENSE) file in the repository root.
