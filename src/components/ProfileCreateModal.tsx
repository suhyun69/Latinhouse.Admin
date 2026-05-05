"use client";

import { useState } from "react";
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
import type { Sex } from "@/types/profile";

const API_BASE = "";

// ---- 폼 타입 ----
type CreateForm = {
  nickname: string;
  sex: Sex | "";
};

const INITIAL_FORM: CreateForm = {
  nickname: "",
  sex: "",
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
interface ProfileCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProfileCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: ProfileCreateModalProps) {
  const [form, setForm] = useState<CreateForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(INITIAL_FORM);
      setFieldErrors({});
      setGlobalError(null);
    }
    onOpenChange(nextOpen);
  }

  function setField<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit() {
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
      const res = await fetch(`${API_BASE}/api/v1/profiles`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          nickname: form.nickname.trim(),
          sex: form.sex,
        }),
      });

      if (res.status === 201) {
        handleOpenChange(false);
        onSuccess();
        return;
      }

      if (res.status === 401) {
        setGlobalError("인증이 필요합니다. 다시 로그인해 주세요.");
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
          <DialogTitle>프로필 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 닉네임 */}
          <div className="space-y-1">
            <Label htmlFor="create-nickname">
              닉네임 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="create-nickname"
              placeholder="닉네임을 입력하세요"
              value={form.nickname}
              onChange={(e) => setField("nickname", e.target.value)}
              aria-invalid={!!fieldErrors["nickname"]}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {fieldErrors["nickname"] && (
              <p className="text-xs text-destructive">{fieldErrors["nickname"]}</p>
            )}
          </div>

          {/* 성별 */}
          <div className="space-y-1">
            <Label htmlFor="create-sex">
              성별 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.sex}
              onValueChange={(v) => setField("sex", v as Sex)}
            >
              <SelectTrigger id="create-sex" aria-invalid={!!fieldErrors["sex"]}>
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

          {/* 안내: isInstructor는 기본값 false, 강사 등록은 수정 화면에서 처리 */}
          <p className="text-xs text-muted-foreground">
            강사 등록은 생성 후 프로필 상세 화면에서 별도로 진행할 수 있습니다.
          </p>

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
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
