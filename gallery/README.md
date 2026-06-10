# Gallery App

A fast, offline-first media gallery application using the File System Access API. Browse, filter, and organize your images and videos directly from your local folders without uploading to the cloud.

## Features

- **📁 Local Folder Selection** — Use the File System Access API to select folders from your device
- **🖼️ Media Support** — Display images (AVIF, BMP, GIF, HEIC, HEIF, JPEG, PNG, SVG, WebP) and videos (MP4, WebM, MOV, MKV, etc.)
- **💾 Persistent Storage** — Automatically saves loaded media and filter settings using IndexedDB
- **🔍 Advanced Filtering** — Search by filename, filter by media type (images/videos), and browse by date
- **🎯 Smart Sorting** — Sort by name, size, or date in ascending/descending order
- **📄 Pagination** — Efficient browsing with configurable items per page
- **🔌 Permission Re-grant** — Seamlessly handle permission recovery after page reloads
- **⌨️ Keyboard Shortcuts** — Spacebar to toggle preview fullscreen, arrow keys for navigation
- **🎨 Responsive Design** — Works on desktop and tablet screens

## Getting Started

### Prerequisites

- **Modern Browser** with File System Access API support (Chrome 86+, Edge 86+)
- **Node.js 18+** (for development)

### Quick Start (Non-Technical Users)

If you're new to development, follow these super simple steps:

#### Step 1: Install Node.js

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version
3. Run the installer and follow the default options
4. Restart your computer after installation

#### Step 2: Start the Server

Simply **double-click** one of these script files in the `gallery` folder:

- **`start.bat`** — Works on all Windows versions ✅ (Recommended)
- **`start.ps1`** — Works on Windows 10+ with PowerShell

A command window will open and the server will start automatically. The script handles everything (including downloading libraries on first run). You should see:

```
  ▲ Next.js 16.2.7
  - Local:        http://localhost:3000
```

**That's it!** Windows may ask for permission — just click "Allow".

#### Step 3: Open in Your Browser

1. Open Chrome or Edge
2. Go to: **http://localhost:3000**
3. The gallery app should load!

#### Step 4: Stop the Server

When done, simply close the command window, or press **Ctrl + C** in the window.

### Troubleshooting Quick Start

**Problem: Double-clicking the script does nothing**

- Solution: Try right-clicking the script file and select **"Run as administrator"**

**Problem: Windows Defender or antivirus blocks the script**

- Solution: This is normal. Click "Allow anyway" or "Run anyway" when prompted

**Problem: "npm: command not found"**

- Solution: Node.js wasn't installed correctly. Restart your computer and try again.

**Problem: Port 3000 is already in use**

- Solution: Close other applications that might be using port 3000

### Installation & Development (Advanced Users)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

## Usage

1. **Load Media** — Click "Select Folder" in the header to browse and load a folder of images/videos
2. **Drag & Drop** — Drag a folder directly onto the page to load media
3. **Search** — Use the search box to filter by filename
4. **Filter by Type** — Use the "All Media" / "Images Only" / "Videos Only" dropdown
5. **Browse by Date** — Select year, month, and day to filter by file modification date
6. **Sort** — Change sort order by name, size, or date
7. **Preview** — Click any media item to open fullscreen preview
8. **Clear Data** — Click "Clear Saved" to remove all stored media and filters

## Architecture

### Components

- **app/page.tsx** — Main gallery page with filtering, sorting, and state management
- **components/header.tsx** — Folder selection and file input
- **components/gallery.tsx** — Media grid and pagination
- **components/imageCard.tsx** — Individual image tile
- **components/imagePreview.tsx** — Fullscreen image viewer
- **components/videoCard.tsx** — Individual video tile
- **components/videoPreview.tsx** — Fullscreen video player

### Storage

- **lib/indexeddb.ts** — IndexedDB abstraction layer for persisting file handles and filter state

### Key Technologies

- **Next.js 16** — React framework with App Router
- **React 19** — UI library
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling
- **IndexedDB** — Client-side persistence
- **File System Access API** — Direct folder/file access

## Browser Compatibility

| Feature                | Chrome | Edge   | Firefox    | Safari |
| ---------------------- | ------ | ------ | ---------- | ------ |
| File System Access API | ✅ 86+ | ✅ 86+ | ⚠️ Limited | ❌     |
| IndexedDB              | ✅     | ✅     | ✅         | ✅     |

## Performance Notes

- Media items are loaded lazily — only visible items have object URLs generated
- Object URLs are automatically revoked when scrolling out of view
- File handles are cached in IndexedDB for fast reload
- Drag & drop handles 500+ files efficiently with chunked processing

## Known Limitations

- File System Access API requires modern browser support (Chrome/Edge)
- Permission state resets on page reload (user is prompted to re-grant)
- Single folder load at a time (select a new folder to replace current media)
- Limited to files accessible through the File System Access API

## Development

### TypeScript Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## License

See [LICENSE](../LICENSE) file.
