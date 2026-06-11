"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LessonUpdateModal from "./LessonUpdateModal";

type Lesson = {
  optionId: number;
  lessonNo: number;
  instructorLo: string | null;
  instructorLa: string | null;
  title: string;
  genre: "S" | "B";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  region: "GN" | "HD";
  price: number | null;
  discountCondition: string | null;
  discountAmount: number | null;
  status: "INACTIVE" | "PENDING" | "IN_PROGRESS" | "DONE";
};

type Props = { region?: string; genre?: string; refreshKey?: number };

const STATUS_LABEL: Record<Lesson["status"], string> = {
  INACTIVE: "비활성", PENDING: "예정", IN_PROGRESS: "진행 중", DONE: "종료",
};
const STATUS_CLASS: Record<Lesson["status"], string> = {
  INACTIVE: "bg-gray-100 text-gray-500", PENDING: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-green-100 text-green-700", DONE: "bg-gray-100 text-gray-400",
};
const GENRE_LABEL: Record<string, string> = { S: "살사", B: "바차타" };
const REGION_LABEL: Record<string, string> = { GN: "강남", HD: "홍대" };

function RowMenu({ lessonNo, onRefresh }: { lessonNo: number; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-base leading-none"
      >
        •••
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-10 w-28 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          <button
            onClick={() => { setOpen(false); setShowUpdate(true); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            수정
          </button>
        </div>
      )}

      {showUpdate && (
        <LessonUpdateModal
          lessonNo={lessonNo}
          onClose={() => setShowUpdate(false)}
          onSuccess={() => { setShowUpdate(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

export default function LessonList({ region, genre, refreshKey }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/lessons", window.location.origin);
      if (region) url.searchParams.set("region", region);
      if (genre) url.searchParams.set("genre", genre);
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(`API 오류: ${res.status}`);
      setLessons(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [region, genre]);

  useEffect(() => { fetchLessons(); }, [fetchLessons, refreshKey]);

  if (loading) return <p className="text-sm text-gray-400">불러오는 중…</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (lessons.length === 0) return <p className="text-sm text-gray-500">레슨이 없습니다.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-max w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
          <tr>
            <th className="px-4 py-3 font-medium whitespace-nowrap">옵션 ID</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">레슨 No</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">제목</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">장르</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">지역</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">남성 강사</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">여성 강사</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">시작일시</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">종료일시</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">수강료</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">상태</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lessons.map((l) => (
            <tr key={l.optionId} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-gray-500">{l.optionId}</td>
              <td className="px-4 py-3 font-mono text-gray-500">{l.lessonNo}</td>
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{l.title}</td>
              <td className="px-4 py-3 text-gray-700">{GENRE_LABEL[l.genre] ?? l.genre}</td>
              <td className="px-4 py-3 text-gray-700">{REGION_LABEL[l.region] ?? l.region}</td>
              <td className="px-4 py-3 font-mono text-gray-500">{l.instructorLo ?? "-"}</td>
              <td className="px-4 py-3 font-mono text-gray-500">{l.instructorLa ?? "-"}</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{l.startDate} {l.startTime}:00</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{l.endDate} {l.endTime}:00</td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                {l.price != null ? l.price.toLocaleString() + "원" : "-"}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_CLASS[l.status]}`}>
                  {STATUS_LABEL[l.status]}
                </span>
              </td>
              <td className="px-2 py-3">
                <RowMenu lessonNo={l.lessonNo} onRefresh={fetchLessons} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
