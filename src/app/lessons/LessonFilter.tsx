"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const REGION_OPTIONS = [
  { label: "전체", value: "" },
  { label: "강남", value: "GN" },
  { label: "홍대", value: "HD" },
];

const GENRE_OPTIONS = [
  { label: "전체", value: "" },
  { label: "살사", value: "S" },
  { label: "바차타", value: "B" },
];

export default function LessonFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [region, setRegion] = useState(searchParams.get("region") ?? "");
  const [genre, setGenre] = useState(searchParams.get("genre") ?? "");

  function handleSubmit() {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (genre) params.set("genre", genre);
    router.push(`/lessons${params.size ? "?" + params.toString() : ""}`);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 font-medium">지역</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {REGION_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 font-medium">장르</label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {GENRE_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        조회
      </button>
    </div>
  );
}
