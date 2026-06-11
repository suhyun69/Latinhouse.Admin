"use client";

import { useState } from "react";
import LessonCreateModal from "./LessonCreateModal";

type Props = { onSuccess: () => void };

export default function LessonCreateButton({ onSuccess }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);

  async function handleRandom() {
    setRandomLoading(true);
    try {
      const res = await fetch("/api/lesson/random", { method: "POST" });
      if (!res.ok) throw new Error(`API 오류: ${res.status}`);
      onSuccess();
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setRandomLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRandom}
          disabled={randomLoading}
          className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {randomLoading ? "생성 중…" : "랜덤"}
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          생성
        </button>
      </div>
      {showModal && (
        <LessonCreateModal
          onClose={() => setShowModal(false)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
