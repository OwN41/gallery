"use client";

type Props = {
  onFolderSelect: (files: File[]) => void;
};

export default function Header({ onFolderSelect }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const images = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    onFolderSelect(images);
  };

  return (
    <header className="flex justify-between p-4 border-b">
      {/* empty button */}
      <button className="px-4 py-2 bg-gray-600 rounded">Create Gallery</button>

      <label className="text-white font-bold text-3xl">Gallery</label>

      {/* folder picker */}
      <label className="px-4 py-2 bg-gray-600 text-white rounded cursor-pointer">
        Select Folder
        <input
          type="file"
          webkitdirectory="true"
          multiple
          hidden
          onChange={handleChange}
        />
      </label>
    </header>
  );
}
