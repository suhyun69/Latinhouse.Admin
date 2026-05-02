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

const API_BASE = "";

// ---- 상세 응답 타입 ----
type LessonDetail = {
  no: number;
  title: string;
  genre: "Salsa" | "Bachata";
  region: "Gangnam" | "Hongdae";
  instructorLo: string | null;
  instructorLa: string | null;
  startDateTime: string;
  endDateTime: string;
  place: string | null;
  placeUrl: string | null;
  price: number;
  bank: string | null;
  accountNumber: string | null;
  accountOwner: string | null;
  discounts: { id: number; type: string; condition: string | null; amount: number }[];
  contacts: { id: number; type: string; name: string | null; address: string }[];
};

// ---- 폼 타입 ----
type EditForm = {
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

const INITIAL_FORM: EditForm = {
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

// ---- 유틸 ----
function orNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

function genreToCode(genre: "Salsa" | "Bachata"): "S" | "B" {
  return genre === "Salsa" ? "S" : "B";
}

function regionToCode(region: "Gangnam" | "Hongdae"): "GN" | "HD" {
  return region === "Gangnam" ? "GN" : "HD";
}

function splitDateTime(iso: string): { date: string; time: string } {
  const [date, timePart] = iso.split("T");
  const time = timePart ? timePart.slice(0, 5) : "";
  return { date: date ?? "", time };
}

function detailToForm(detail: LessonDetail): EditForm {
  const start = splitDateTime(detail.startDateTime);
  const end = splitDateTime(detail.endDateTime);
  return {
    title: detail.title,
    genre: genreToCode(detail.genre),
    instructorLo: detail.instructorLo ?? "",
    instructorLa: detail.instructorLa ?? "",
    region: regionToCode(detail.region),
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    place: detail.place ?? "",
    placeUrl: detail.placeUrl ?? "",
    price: String(detail.price),
    bank: detail.bank ?? "",
    accountNumber: detail.accountNumber ?? "",
    accountOwner: detail.accountOwner ?? "",
  };
}

// ---- Props ----
export interface LessonEditModalProps {
  lessonNo: number | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LessonEditModal({
  lessonNo,
  onOpenChange,
  onSuccess,
}: LessonEditModalProps) {
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form, setForm] = useState<EditForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const open = lessonNo !== null;

  // 모달이 열릴 때 상세 데이터 조회
  useEffect(() => {
    if (lessonNo === null) {
      // 닫힐 때 초기화
      setDetail(null);
      setForm(INITIAL_FORM);
      setFieldErrors({});
      setGlobalError(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setDetail(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setGlobalError(null);

    fetch(`${API_BASE}/api/v1/lessons/${lessonNo}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`데이터 조회 실패 (${res.status})`);
        }
        return res.json() as Promise<LessonDetail>;
      })
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setForm(detailToForm(data));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setGlobalError(
            err instanceof Error ? err.message : "데이터 조회 중 오류가 발생했습니다."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lessonNo]);

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
    if (lessonNo === null) return;

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
      const res = await fetch(`${API_BASE}/api/v1/lessons/${lessonNo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onOpenChange(false);
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
          <DialogTitle>레슨 수정</DialogTitle>
        </DialogHeader>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            데이터를 불러오는 중...
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* 기본 정보 */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                기본 정보
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="edit-title">
                    제목 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="레슨 제목을 입력하세요"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    aria-invalid={!!fieldErrors["title"]}
                    disabled={!detail}
                  />
                  {fieldErrors["title"] && (
                    <p className="text-xs text-destructive">{fieldErrors["title"]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-genre">
                    장르 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.genre}
                    onValueChange={(v) => setField("genre", v as "S" | "B")}
                    disabled={!detail}
                  >
                    <SelectTrigger id="edit-genre" aria-invalid={!!fieldErrors["genre"]}>
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
                  <Label htmlFor="edit-instructorLo">리드 강사</Label>
                  <Input
                    id="edit-instructorLo"
                    placeholder="리드 강사 이름"
                    value={form.instructorLo}
                    onChange={(e) => setField("instructorLo", e.target.value)}
                    aria-invalid={!!fieldErrors["instructorLo"]}
                    disabled={!detail}
                  />
                  {fieldErrors["instructorLo"] && (
                    <p className="text-xs text-destructive">{fieldErrors["instructorLo"]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-instructorLa">팔로 강사</Label>
                  <Input
                    id="edit-instructorLa"
                    placeholder="팔로 강사 이름"
                    value={form.instructorLa}
                    onChange={(e) => setField("instructorLa", e.target.value)}
                    aria-invalid={!!fieldErrors["instructorLa"]}
                    disabled={!detail}
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
                  <Label htmlFor="edit-region">
                    지역 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.region}
                    onValueChange={(v) => setField("region", v as "GN" | "HD")}
                    disabled={!detail}
                  >
                    <SelectTrigger id="edit-region" aria-invalid={!!fieldErrors["region"]}>
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
                  <Label htmlFor="edit-place">장소명</Label>
                  <Input
                    id="edit-place"
                    placeholder="장소명 (선택)"
                    value={form.place}
                    onChange={(e) => setField("place", e.target.value)}
                    disabled={!detail}
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label htmlFor="edit-placeUrl">장소 URL</Label>
                  <Input
                    id="edit-placeUrl"
                    placeholder="https://..."
                    value={form.placeUrl}
                    onChange={(e) => setField("placeUrl", e.target.value)}
                    disabled={!detail}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-startDate">
                    시작 날짜 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                    aria-invalid={!!fieldErrors["startDate"]}
                    disabled={!detail}
                  />
                  {fieldErrors["startDate"] && (
                    <p className="text-xs text-destructive">{fieldErrors["startDate"]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-startTime">
                    시작 시간 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setField("startTime", e.target.value)}
                    aria-invalid={!!fieldErrors["startTime"]}
                    disabled={!detail}
                  />
                  {fieldErrors["startTime"] && (
                    <p className="text-xs text-destructive">{fieldErrors["startTime"]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-endDate">
                    종료 날짜 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
                    aria-invalid={!!fieldErrors["endDate"]}
                    disabled={!detail}
                  />
                  {fieldErrors["endDate"] && (
                    <p className="text-xs text-destructive">{fieldErrors["endDate"]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-endTime">
                    종료 시간 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setField("endTime", e.target.value)}
                    aria-invalid={!!fieldErrors["endTime"]}
                    disabled={!detail}
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
                  <Label htmlFor="edit-price">
                    수강료 (원) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="1"
                    placeholder="예: 120000"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    aria-invalid={!!fieldErrors["price"]}
                    disabled={!detail}
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
                  <Label htmlFor="edit-bank">입금 은행</Label>
                  <Input
                    id="edit-bank"
                    placeholder="예: 국민은행"
                    value={form.bank}
                    onChange={(e) => setField("bank", e.target.value)}
                    disabled={!detail}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-accountNumber">계좌번호</Label>
                  <Input
                    id="edit-accountNumber"
                    placeholder="예: 123-456-789012"
                    value={form.accountNumber}
                    onChange={(e) => setField("accountNumber", e.target.value)}
                    disabled={!detail}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-accountOwner">예금주</Label>
                  <Input
                    id="edit-accountOwner"
                    placeholder="예금주명"
                    value={form.accountOwner}
                    onChange={(e) => setField("accountOwner", e.target.value)}
                    disabled={!detail}
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
        )}

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
            disabled={submitting || loadingDetail || !detail}
          >
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
