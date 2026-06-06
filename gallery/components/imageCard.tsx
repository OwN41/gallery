"use client";

import Image from "next/image";

type Props = {
  src: string;
  name: string;
  size: number;
  lastModified: number;
  onOpen: () => void;
};

function formatSize(bytes: number) {
  const kb = bytes / 1024;
  const mb = kb / 1024;

  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${kb.toFixed(1)} KB`;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleString();
}

export default function ImageCard({
  src,
  name,
  size,
  lastModified,
  onOpen,
}: Props) {
  return (
    <div className="rounded-xl overflow-hidden shadow-sm bg-white w-full p-2">
      <div
        className="aspect-square cursor-pointer overflow-hidden rounded-lg"
        onClick={onOpen}
      >
        <Image
          src={src}
          alt={name}
          width={300}
          height={300}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      <div className="pt-2 px-1">
        <p className="text-xs text-black truncate">{name}</p>
        <p className="text-[10px] text-gray-500">
          {formatSize(size)} • {formatDate(lastModified)}
        </p>
      </div>
    </div>
  );
}
