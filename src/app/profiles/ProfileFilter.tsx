"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { label: "전체", value: "" },
  { label: "강사", value: "true" },
  { label: "수강생", value: "false" },
];

export default function ProfileFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState(searchParams.get("isInstructor") ?? "");

  function handleSubmit() {
    const params = new URLSearchParams();
    if (selected !== "") params.set("isInstructor", selected);
    router.push(`/profiles${params.size ? "?" + params.toString() : ""}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 font-medium">강사 여부</label>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {OPTIONS.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        onClick={handleSubmit}
        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        조회
      </button>
    </div>
  );
}
