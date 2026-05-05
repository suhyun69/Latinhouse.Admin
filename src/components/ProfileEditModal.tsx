"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProfileResponse, Sex } from "@/types/profile";

const API_BASE = "";

// ---- 폼 타입 ----
type EditForm = {
  nickname: string;
  sex: Sex | "";
};

// ---- 에러 타입 ----
type FieldError = {
  field: string;
  message: string;
};

type ApiErrorResponse = {
  status: number;
  error: string;
  message: string;
  fieldErrors: FieldError[] | null;
};

// localStorage에서 access token 읽기 (키: "accessToken")
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

// ---- Props ----
export interface ProfileEditModalProps {
  profile: ProfileResponse | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: ProfileResponse) => void;
}

export function ProfileEditModal({
  profile,
  onOpenChange,
  onSuccess,
}: ProfileEditModalProps) {
  const [form, setForm] = useState<EditForm>({ nickname: "", sex: "" });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const open = profile !== null;

  // 모달이 열릴 때 기존 데이터 주입
  useEffect(() => {
    if (profile === null) {
      setForm({ nickname: "", sex: "" });
      setFieldErrors({});
      setGlobalError(null);
      return;
    }
    setForm({ nickname: profile.nickname, sex: profile.sex });
    setFieldErrors({});
    setGlobalError(null);
  }, [profile]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      onOpenChange(false);
    }
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSave() {
    if (!profile) return;

    setFieldErrors({});
    setGlobalError(null);

    // 클라이언트 사이드 기본 검증
    const errors: Record<string, string> = {};
    if (!form.nickname.trim()) {
      errors["nickname"] = "닉네임을 입력해 주세요.";
    }
    if (!form.sex) {
      errors["sex"] = "성별을 선택해 주세요.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    const token = getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/v1/profiles/${profile.profileId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            nickname: form.nickname.trim(),
            sex: form.sex,
          }),
        }
      );

      if (res.ok) {
        const updated: ProfileResponse = await res.json();
        onOpenChange(false);
        onSuccess(updated);
        return;
      }

      if (res.status === 401) {
        setGlobalError("인증이 필요합니다. 다시 로그인해 주세요.");
        return;
      }

      if (res.status === 404) {
        setGlobalError("프로필을 찾을 수 없습니다.");
        return;
      }

      let errData: ApiErrorResponse | null = null;
      try {
        errData = await res.json();
      } catch {
        setGlobalError(`요청 실패 (${res.status} ${res.statusText})`);
        return;
      }

      if (errData?.fieldErrors && errData.fieldErrors.length > 0) {
        const map: Record<string, string> = {};
        for (const fe of errData.fieldErrors) {
          map[fe.field] = fe.message;
        }
        setFieldErrors(map);
      } else {
        setGlobalError(errData?.message ?? `요청 실패 (${res.status})`);
      }
    } catch {
      setGlobalError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>프로필 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* profileId (읽기 전용) */}
          <div className="space-y-1">
            <Label className="text-muted-foreground">profileId</Label>
            <p className="font-mono text-sm px-3 py-2 rounded-md bg-muted text-muted-foreground">
              {profile?.profileId ?? "-"}
            </p>
          </div>

          {/* 닉네임 */}
          <div className="space-y-1">
            <Label htmlFor="edit-nickname">
              닉네임 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-nickname"
              placeholder="닉네임을 입력하세요"
              value={form.nickname}
              onChange={(e) => setField("nickname", e.target.value)}
              aria-invalid={!!fieldErrors["nickname"]}
              disabled={!profile}
            />
            {fieldErrors["nickname"] && (
              <p className="text-xs text-destructive">{fieldErrors["nickname"]}</p>
            )}
          </div>

          {/* 성별 */}
          <div className="space-y-1">
            <Label htmlFor="edit-sex">
              성별 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.sex}
              onValueChange={(v) => setField("sex", v as Sex)}
              disabled={!profile}
            >
              <SelectTrigger id="edit-sex" aria-invalid={!!fieldErrors["sex"]}>
                <SelectValue placeholder="성별 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">남성 (M)</SelectItem>
                <SelectItem value="F">여성 (F)</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors["sex"] && (
              <p className="text-xs text-destructive">{fieldErrors["sex"]}</p>
            )}
          </div>

          {/* 강사 여부 (읽기 전용 표시) */}
          <div className="space-y-1">
            <Label className="text-muted-foreground">강사 여부</Label>
            <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted">
              {profile?.isInstructor ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                  강사
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
                  일반
                </Badge>
              )}
            </div>
          </div>

          {/* 전역 에러 */}
          {globalError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {globalError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting || !profile}
          >
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
