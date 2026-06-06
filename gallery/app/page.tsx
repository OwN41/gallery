"use client";

import { useMemo, useState } from "react";
import Header from "@/components/header";
import Gallery from "@/components/gallery";

type ImageItem = {
  src: string;
  name: string;
  size: number;
  lastModified: number;
};

export default function Page() {
  const [images, setImages] = useState<ImageItem[]>([]);

  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [search, setSearch] = useState("");

  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");

  // -----------------------------
  // DATE INFO
  // -----------------------------
  const dateInfo = useMemo(() => {
    return images.map((img) => {
      const d = new Date(img.lastModified);
      return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      };
    });
  }, [images]);

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
  // SAFE VALUES
  // -----------------------------
  const safeYear =
    selectedYear !== "all" && !years.includes(Number(selectedYear))
      ? "all"
      : selectedYear;

  const safeMonth =
    selectedMonth !== "all" && !months.includes(Number(selectedMonth))
      ? "all"
      : selectedMonth;

  const safeDay =
    selectedDay !== "all" && !days.includes(Number(selectedDay))
      ? "all"
      : selectedDay;

  // -----------------------------
  // FILTER
  // -----------------------------
  const filteredImages = images.filter((img) => {
    const date = new Date(img.lastModified);

    const matchesSearch = img.name.toLowerCase().includes(search.toLowerCase());

    const matchesYear =
      safeYear === "all" || date.getFullYear() === Number(safeYear);

    const matchesMonth =
      safeMonth === "all" || date.getMonth() + 1 === Number(safeMonth);

    const matchesDay = safeDay === "all" || date.getDate() === Number(safeDay);

    return matchesSearch && matchesYear && matchesMonth && matchesDay;
  });

  // -----------------------------
  // SORT
  // -----------------------------
  const sortedImages = [...filteredImages].sort((a, b) => {
    let compare = 0;

    if (sortBy === "size") compare = a.size - b.size;
    if (sortBy === "name") compare = a.name.localeCompare(b.name);
    if (sortBy === "date") compare = a.lastModified - b.lastModified;

    const dir = sortDir === "asc" ? -1 : 1;
    return compare * dir;
  });

  const handleSort = (field: "name" | "size" | "date") => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4">
      {/* HEADER */}
      <Header
        onFolderSelect={(files) => {
          const mapped: ImageItem[] = files.map((file) => ({
            src: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
          }));

          setImages(mapped);
        }}
      />

      {/* SEARCH */}
      <div className="p-2 border-b">
        <input
          type="text"
          placeholder="Search images..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 p-2 border-b text-sm flex-wrap">
        {/* YEAR */}
        <select
          value={safeYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option
            value="all"
            className="text-white"
            style={{ background: "#222222" }}
          >
            All Years
          </option>
          {years.map((y) => (
            <option
              key={y}
              value={y}
              className="text-white"
              style={{ background: "#222222" }}
            >
              {y}
            </option>
          ))}
        </select>

        {/* MONTH */}
        <select
          value={safeMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option
            value="all"
            className="text-white"
            style={{ background: "#222222" }}
          >
            All Months
          </option>
          {months.map((m) => (
            <option
              key={m}
              value={m}
              className="text-white"
              style={{ background: "#222222" }}
            >
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        {/* DAY */}
        <select
          value={safeDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option
            value="all"
            className="text-white"
            style={{ background: "#222222" }}
          >
            All Days
          </option>
          {days.map((d) => (
            <option
              key={d}
              value={d}
              className="text-white"
              style={{ background: "#222222" }}
            >
              {d.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      {/* SORT */}
      <div className="flex gap-2 p-2 text-sm">
        <button
          className={`px-3 py-2 rounded hover:bg-gray-700 ${
            sortBy === "name"
              ? "bg-gray-800 text-white"
              : "bg-gray-600 text-white"
          }`}
          onClick={() => handleSort("name")}
        >
          Name {sortBy === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>

        <button
          className={`px-3 py-2 rounded hover:bg-gray-700 ${
            sortBy === "size"
              ? "bg-gray-800 text-white"
              : "bg-gray-600 text-white"
          }`}
          onClick={() => handleSort("size")}
        >
          Size {sortBy === "size" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>

        <button
          className={`px-3 py-2 rounded hover:bg-gray-700 ${
            sortBy === "date"
              ? "bg-gray-800 text-white"
              : "bg-gray-600 text-white"
          }`}
          onClick={() => handleSort("date")}
        >
          Date {sortBy === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </button>
      </div>

      {/* COUNT */}
      <div className="px-2 py-2 text-sm text-white border-b">
        Showing <span className="font-semibold">{sortedImages.length}</span>{" "}
        images
      </div>

      {/* GALLERY */}
      <main className="flex-1 p-4">
        <Gallery images={sortedImages} />
      </main>
    </div>
  );
}
