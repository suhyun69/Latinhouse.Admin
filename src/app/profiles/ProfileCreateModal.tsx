"use client";

import { useState } from "react";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

type FieldError = { field: string; message: string };

export default function ProfileCreateModal({ onClose, onSuccess }: Props) {
  const [nickname, setNickname] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "">("");
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function getFieldError(field: string) {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  async function handleSubmit() {
    setFieldErrors([]);
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, sex }),
      });

      if (res.status === 400) {
        const body = await res.json();
        setFieldErrors(body.errors ?? []);
        return;
      }
      if (!res.ok) throw new Error(`API 오류: ${res.status}`);

      onSuccess();
      onClose();
    } catch (e) {
      setFieldErrors([{ field: "_", message: e instanceof Error ? e.message : "오류가 발생했습니다." }]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">프로필 생성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {getFieldError("_") && (
            <p className="text-sm text-red-500">{getFieldError("_")}</p>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {getFieldError("nickname") && (
              <p className="text-xs text-red-500">{getFieldError("nickname")}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">성별</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as "M" | "F" | "")}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">선택</option>
              <option value="M">남</option>
              <option value="F">여</option>
            </select>
            {getFieldError("sex") && (
              <p className="text-xs text-red-500">{getFieldError("sex")}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "생성 중…" : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
