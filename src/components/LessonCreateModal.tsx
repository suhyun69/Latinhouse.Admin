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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type CreateForm = {
  title: string;
  genre: "S" | "B" | "";
  instructorLo: string;
  instructorLa: string;
  region: "GN" | "HD" | "";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  place: string;
  placeUrl: string;
  price: string;
  bank: string;
  accountNumber: string;
  accountOwner: string;
};

const INITIAL_FORM: CreateForm = {
  title: "",
  genre: "",
  instructorLo: "",
  instructorLa: "",
  region: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  place: "",
  placeUrl: "",
  price: "",
  bank: "",
  accountNumber: "",
  accountOwner: "",
};

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

function orNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

interface LessonCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LessonCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: LessonCreateModalProps) {
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
    setSubmitting(true);

    const body = {
      title: form.title,
      genre: form.genre || undefined,
      instructorLo: orNull(form.instructorLo),
      instructorLa: orNull(form.instructorLa),
      option: {
        region: form.region || undefined,
        place: orNull(form.place),
        placeUrl: orNull(form.placeUrl),
        startDate: form.startDate || undefined,
        startTime: form.startTime || undefined,
        endDate: form.endDate || undefined,
        endTime: form.endTime || undefined,
      },
      price: form.price !== "" ? parseFloat(form.price) : undefined,
      bank: orNull(form.bank),
      accountNumber: orNull(form.accountNumber),
      accountOwner: orNull(form.accountOwner),
      discounts: [],
      contacts: [],
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        handleOpenChange(false);
        onSuccess();
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
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>레슨 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* 기본 정보 */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              기본 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="title">
                  제목 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="레슨 제목을 입력하세요"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  aria-invalid={!!fieldErrors["title"]}
                />
                {fieldErrors["title"] && (
                  <p className="text-xs text-destructive">{fieldErrors["title"]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="genre">
                  장르 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.genre}
                  onValueChange={(v) => setField("genre", v as "S" | "B")}
                >
                  <SelectTrigger id="genre" aria-invalid={!!fieldErrors["genre"]}>
                    <SelectValue placeholder="장르 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">Salsa</SelectItem>
                    <SelectItem value="B">Bachata</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors["genre"] && (
                  <p className="text-xs text-destructive">{fieldErrors["genre"]}</p>
                )}
              </div>
            </div>
          </section>

          {/* 강사 */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              강사 (리드 또는 팔로 중 하나 필수)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="instructorLo">리드 강사</Label>
                <Input
                  id="instructorLo"
                  placeholder="리드 강사 이름"
                  value={form.instructorLo}
                  onChange={(e) => setField("instructorLo", e.target.value)}
                  aria-invalid={!!fieldErrors["instructorLo"]}
                />
                {fieldErrors["instructorLo"] && (
                  <p className="text-xs text-destructive">{fieldErrors["instructorLo"]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="instructorLa">팔로 강사</Label>
                <Input
                  id="instructorLa"
                  placeholder="팔로 강사 이름"
                  value={form.instructorLa}
                  onChange={(e) => setField("instructorLa", e.target.value)}
                  aria-invalid={!!fieldErrors["instructorLa"]}
                />
                {fieldErrors["instructorLa"] && (
                  <p className="text-xs text-destructive">{fieldErrors["instructorLa"]}</p>
                )}
              </div>
            </div>
          </section>

          {/* 일정 및 장소 */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              일정 및 장소
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="region">
                  지역 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.region}
                  onValueChange={(v) => setField("region", v as "GN" | "HD")}
                >
                  <SelectTrigger id="region" aria-invalid={!!fieldErrors["region"]}>
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GN">Gangnam</SelectItem>
                    <SelectItem value="HD">Hongdae</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors["region"] && (
                  <p className="text-xs text-destructive">{fieldErrors["region"]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="place">장소명</Label>
                <Input
                  id="place"
                  placeholder="장소명 (선택)"
                  value={form.place}
                  onChange={(e) => setField("place", e.target.value)}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="placeUrl">장소 URL</Label>
                <Input
                  id="placeUrl"
                  placeholder="https://..."
                  value={form.placeUrl}
                  onChange={(e) => setField("placeUrl", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="startDate">
                  시작 날짜 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  aria-invalid={!!fieldErrors["startDate"]}
                />
                {fieldErrors["startDate"] && (
                  <p className="text-xs text-destructive">{fieldErrors["startDate"]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="startTime">
                  시작 시간 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setField("startTime", e.target.value)}
                  aria-invalid={!!fieldErrors["startTime"]}
                />
                {fieldErrors["startTime"] && (
                  <p className="text-xs text-destructive">{fieldErrors["startTime"]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="endDate">
                  종료 날짜 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  aria-invalid={!!fieldErrors["endDate"]}
                />
                {fieldErrors["endDate"] && (
                  <p className="text-xs text-destructive">{fieldErrors["endDate"]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="endTime">
                  종료 시간 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setField("endTime", e.target.value)}
                  aria-invalid={!!fieldErrors["endTime"]}
                />
                {fieldErrors["endTime"] && (
                  <p className="text-xs text-destructive">{fieldErrors["endTime"]}</p>
                )}
              </div>
            </div>
          </section>

          {/* 수강료 */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              수강료
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="price">
                  수강료 (원) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  placeholder="예: 120000"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  aria-invalid={!!fieldErrors["price"]}
                />
                {fieldErrors["price"] && (
                  <p className="text-xs text-destructive">{fieldErrors["price"]}</p>
                )}
              </div>
            </div>
          </section>

          {/* 결제 정보 */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              결제 정보 (선택)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="bank">입금 은행</Label>
                <Input
                  id="bank"
                  placeholder="예: 국민은행"
                  value={form.bank}
                  onChange={(e) => setField("bank", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="accountNumber">계좌번호</Label>
                <Input
                  id="accountNumber"
                  placeholder="예: 123-456-789012"
                  value={form.accountNumber}
                  onChange={(e) => setField("accountNumber", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="accountOwner">예금주</Label>
                <Input
                  id="accountOwner"
                  placeholder="예금주명"
                  value={form.accountOwner}
                  onChange={(e) => setField("accountOwner", e.target.value)}
                />
              </div>
            </div>
          </section>

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
