"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Profile = {
  id: string;
  nickname: string;
  sex: "M" | "F";
  isInstructor: boolean;
};

type Props = { isInstructor?: string; refreshKey: number };

function RowMenu({ profile, onRefresh }: { profile: Profile; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleRegisterInstructor() {
    setOpen(false);
    if (!confirm(`"${profile.nickname}"을(를) 강사로 등록하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/profile/${profile.id}/instructor`, { method: "PATCH" });
      if (!res.ok) throw new Error(`API 오류: ${res.status}`);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류가 발생했습니다.");
    }
  }

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-base leading-none"
      >
        •••
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-10 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          <button
            onClick={handleRegisterInstructor}
            disabled={profile.isInstructor}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            강사 등록
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProfileList({ isInstructor, refreshKey }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/profiles", window.location.origin);
      if (isInstructor === "true" || isInstructor === "false") {
        url.searchParams.set("isInstructor", isInstructor);
      }
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error(`API 오류: ${res.status}`);
      setProfiles(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isInstructor]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles, refreshKey]);

  if (loading) return <p className="text-sm text-gray-400">불러오는 중…</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (profiles.length === 0) return <p className="text-sm text-gray-500">프로필이 없습니다.</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
          <tr>
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">닉네임</th>
            <th className="px-4 py-3 font-medium">성별</th>
            <th className="px-4 py-3 font-medium">구분</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {profiles.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-gray-500">{p.id}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{p.nickname}</td>
              <td className="px-4 py-3 text-gray-700">{p.sex === "M" ? "남" : "여"}</td>
              <td className="px-4 py-3">
                {p.isInstructor ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                    강사
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    수강생
                  </span>
                )}
              </td>
              <td className="px-2 py-3">
                <RowMenu profile={p} onRefresh={fetchProfiles} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
