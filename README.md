# Gallery

A modern local image gallery built with Next.js, React, and Tailwind CSS.

This project lets users select a folder of images directly from the browser, preview them in a responsive grid, search and filter by date, and copy image content to the clipboard.

## Features

- Local folder import using browser file selection
- Responsive image grid with preview modal
- Search by image name
- Filter by year, month, and day
- Sort images by name, size, or date
- Copy image content to clipboard (browser support required)

## Getting Started

The app is contained in the `gallery/` folder.

### Install dependencies

```bash
cd gallery
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click **Select Folder**.
2. Choose a folder containing image files.
3. Use the search box to filter by filename.
4. Use the dropdown filters to narrow images by date.
5. Click an image card to open a full-screen preview.
6. Use the copy button on a card to copy the image to the clipboard (if supported by your browser).

## Project Structure

- `gallery/app/` - Next.js app entry points
- `gallery/components/` - UI components for gallery, header, cards, and preview
- `gallery/public/` - Static assets
- `gallery/styles/` - Global styling and Tailwind setup

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React icons

## Notes

- Image loading happens entirely client-side.
- Folder selection relies on browser support for `webkitdirectory`.
- Clipboard image copy works only in browsers that support the Clipboard API with image blobs.

## License

See the `LICENSE` file in the repository root.
