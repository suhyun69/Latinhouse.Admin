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
import type { LessonDetail } from "@/types/lesson";

const API_BASE = "";

// ---- 옵션 폼 단위 ----
// no: 기존 옵션이면 숫자, 신규 추가면 null
type OptionForm = {
  no: number | null;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  dateTimeSubTexts: string; // 줄바꿈 구분 입력
  region: "GN" | "HD" | "";
  place: string;
  placeUrl: string;
};

function emptyOption(): OptionForm {
  return {
    no: null,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    dateTimeSubTexts: "",
    region: "",
    place: "",
    placeUrl: "",
  };
}

// ---- 할인 항목 폼 단위 ----
// id: 기존 항목이면 숫자, 신규 추가면 null
type DiscountForm = {
  id: number | null;
  type: "E" | "S" | "";
  condition: string;
  amount: string;
};

function emptyDiscount(): DiscountForm {
  return { id: null, type: "", condition: "", amount: "" };
}

// ---- 연락처 항목 폼 단위 ----
// id: 기존 항목이면 숫자, 신규 추가면 null
type ContactForm = {
  id: number | null;
  type: "P" | "K" | "I" | "Y" | "W" | "";
  name: string;
  address: string;
};

function emptyContact(): ContactForm {
  return { id: null, type: "", name: "", address: "" };
}

// ---- 최상위 폼 ----
type EditForm = {
  title: string;
  genre: "S" | "B" | "";
  instructorLo: string;
  instructorLa: string;
  price: string;
  maxDiscountAmount: string;
  discountSubTexts: string;
  bank: string;
  accountNumber: string;
  accountOwner: string;
};

const INITIAL_FORM: EditForm = {
  title: "",
  genre: "",
  instructorLo: "",
  instructorLa: "",
  price: "",
  maxDiscountAmount: "",
  discountSubTexts: "",
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

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
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

// LessonDetail -> 폼 상태 변환
function detailToForm(detail: LessonDetail): {
  form: EditForm;
  options: OptionForm[];
  discounts: DiscountForm[];
  contacts: ContactForm[];
} {
  const form: EditForm = {
    title: detail.title,
    genre: genreToCode(detail.genre),
    instructorLo: detail.instructorLo ?? "",
    instructorLa: detail.instructorLa ?? "",
    price: String(detail.price),
    maxDiscountAmount:
      detail.maxDiscountAmount !== null ? String(detail.maxDiscountAmount) : "",
    discountSubTexts: detail.discountSubTexts.join("\n"),
    bank: detail.bank ?? "",
    accountNumber: detail.accountNumber ?? "",
    accountOwner: detail.accountOwner ?? "",
  };

  const options: OptionForm[] = detail.options.map((opt) => {
    const start = splitDateTime(opt.startDateTime);
    const end = splitDateTime(opt.endDateTime);
    return {
      no: opt.no,
      startDate: start.date,
      startTime: start.time,
      endDate: end.date,
      endTime: end.time,
      dateTimeSubTexts: opt.dateTimeSubTexts.join("\n"),
      region: regionToCode(opt.region),
      place: opt.place ?? "",
      placeUrl: opt.placeUrl ?? "",
    };
  });

  const discounts: DiscountForm[] = detail.discounts.map((d) => ({
    id: d.id,
    type: discountTypeToCode(d.type),
    condition: d.condition ?? "",
    amount: String(d.amount),
  }));

  const contacts: ContactForm[] = detail.contacts.map((c) => ({
    id: c.id,
    type: contactTypeToCode(c.type) as "P" | "K" | "I" | "Y" | "W",
    name: c.name ?? "",
    address: c.address,
  }));

  return { form, options, discounts, contacts };
}

// localStorage에서 access token 읽기 (키: "accessToken")
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
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
  const [options, setOptions] = useState<OptionForm[]>([emptyOption()]);
  const [discounts, setDiscounts] = useState<DiscountForm[]>([]);
  const [contacts, setContacts] = useState<ContactForm[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const open = lessonNo !== null;

  // 모달이 열릴 때 상세 데이터 조회
  useEffect(() => {
    if (lessonNo === null) {
      setDetail(null);
      setForm(INITIAL_FORM);
      setOptions([emptyOption()]);
      setDiscounts([]);
      setContacts([]);
      setFieldErrors({});
      setGlobalError(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setDetail(null);
    setForm(INITIAL_FORM);
    setOptions([emptyOption()]);
    setDiscounts([]);
    setContacts([]);
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
          const converted = detailToForm(data);
          setForm(converted.form);
          setOptions(converted.options);
          setDiscounts(converted.discounts);
          setContacts(converted.contacts);
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

  function setOptionField<K extends keyof OptionForm>(
    idx: number,
    key: K,
    value: OptionForm[K]
  ) {
    setOptions((prev) =>
      prev.map((opt, i) => (i === idx ? { ...opt, [key]: value } : opt))
    );
    const errKey = `options[${idx}].${key}`;
    if (fieldErrors[errKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  }

  function addOption() {
    setOptions((prev) => [...prev, emptyOption()]);
  }

  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function setDiscountField<K extends keyof DiscountForm>(
    idx: number,
    key: K,
    value: DiscountForm[K]
  ) {
    setDiscounts((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [key]: value } : d))
    );
    const errKey = `discounts[${idx}].${key}`;
    if (fieldErrors[errKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  }

  function addDiscount() {
    setDiscounts((prev) => [...prev, emptyDiscount()]);
  }

  function removeDiscount(idx: number) {
    setDiscounts((prev) => prev.filter((_, i) => i !== idx));
  }

  function setContactField<K extends keyof ContactForm>(
    idx: number,
    key: K,
    value: ContactForm[K]
  ) {
    setContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c))
    );
    const errKey = `contacts[${idx}].${key}`;
    if (fieldErrors[errKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  }

  function addContact() {
    setContacts((prev) => [...prev, emptyContact()]);
  }

  function removeContact(idx: number) {
    setContacts((prev) => prev.filter((_, i) => i !== idx));
  }

  function buildBody() {
    return {
      title: form.title,
      genre: form.genre || undefined,
      instructorLo: orNull(form.instructorLo),
      instructorLa: orNull(form.instructorLa),
      // options: no가 있으면 기존 PK 재사용, null이면 신규 채번
      options: options.map((opt) => ({
        no: opt.no ?? null,
        startDate: opt.startDate || undefined,
        startTime: opt.startTime || undefined,
        endDate: opt.endDate || undefined,
        endTime: opt.endTime || undefined,
        dateTimeSubTexts: splitLines(opt.dateTimeSubTexts),
        region: opt.region || undefined,
        place: orNull(opt.place),
        placeUrl: orNull(opt.placeUrl),
      })),
      price: form.price !== "" ? parseFloat(form.price) : undefined,
      maxDiscountAmount:
        form.maxDiscountAmount !== ""
          ? parseFloat(form.maxDiscountAmount)
          : null,
      discountSubTexts: splitLines(form.discountSubTexts),
      bank: orNull(form.bank),
      accountNumber: orNull(form.accountNumber),
      accountOwner: orNull(form.accountOwner),
      discounts: discounts.map((d) => ({
        id: d.id ?? null,
        type: d.type || undefined,
        condition: orNull(d.condition),
        amount: d.amount !== "" ? parseFloat(d.amount) : undefined,
      })),
      contacts: contacts.map((c) => ({
        id: c.id ?? null,
        type: c.type || undefined,
        name: orNull(c.name),
        address: c.address,
      })),
    };
  }

  async function handleSave() {
    if (lessonNo === null) return;

    setFieldErrors({});
    setGlobalError(null);
    setSubmitting(true);

    const token = getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/lessons/${lessonNo}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(buildBody()),
      });

      if (res.ok) {
        onOpenChange(false);
        onSuccess();
        return;
      }

      // 401: 토큰 없음/만료
      if (res.status === 401) {
        setGlobalError("인증이 필요합니다. 다시 로그인해 주세요.");
        setSubmitting(false);
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
                    <p className="text-xs text-destructive">
                      {fieldErrors["title"]}
                    </p>
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
                    <SelectTrigger
                      id="edit-genre"
                      aria-invalid={!!fieldErrors["genre"]}
                    >
                      <SelectValue placeholder="장르 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">Salsa</SelectItem>
                      <SelectItem value="B">Bachata</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors["genre"] && (
                    <p className="text-xs text-destructive">
                      {fieldErrors["genre"]}
                    </p>
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
                    <p className="text-xs text-destructive">
                      {fieldErrors["instructorLo"]}
                    </p>
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
                    <p className="text-xs text-destructive">
                      {fieldErrors["instructorLa"]}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 레슨 옵션 (다중) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  일정 및 장소 옵션 <span className="text-destructive">*</span>
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={!detail}
                >
                  + 옵션 추가
                </Button>
              </div>

              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="rounded-md border p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      옵션 {idx + 1}
                      {opt.no !== null && (
                        <span className="ml-2 text-muted-foreground font-mono">
                          (no: {opt.no})
                        </span>
                      )}
                    </span>
                    {options.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-6 px-2"
                        onClick={() => removeOption(idx)}
                        disabled={!detail}
                      >
                        삭제
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>
                        지역 <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={opt.region}
                        onValueChange={(v) =>
                          setOptionField(idx, "region", v as "GN" | "HD")
                        }
                        disabled={!detail}
                      >
                        <SelectTrigger
                          aria-invalid={
                            !!fieldErrors[`options[${idx}].region`]
                          }
                        >
                          <SelectValue placeholder="지역 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GN">Gangnam</SelectItem>
                          <SelectItem value="HD">Hongdae</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors[`options[${idx}].region`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`options[${idx}].region`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>장소명</Label>
                      <Input
                        placeholder="장소명 (선택)"
                        value={opt.place}
                        onChange={(e) =>
                          setOptionField(idx, "place", e.target.value)
                        }
                        disabled={!detail}
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label>장소 URL</Label>
                      <Input
                        placeholder="https://..."
                        value={opt.placeUrl}
                        onChange={(e) =>
                          setOptionField(idx, "placeUrl", e.target.value)
                        }
                        disabled={!detail}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>
                        시작 날짜 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={opt.startDate}
                        onChange={(e) =>
                          setOptionField(idx, "startDate", e.target.value)
                        }
                        aria-invalid={
                          !!fieldErrors[`options[${idx}].startDate`]
                        }
                        disabled={!detail}
                      />
                      {fieldErrors[`options[${idx}].startDate`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`options[${idx}].startDate`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>
                        시작 시간 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={opt.startTime}
                        onChange={(e) =>
                          setOptionField(idx, "startTime", e.target.value)
                        }
                        aria-invalid={
                          !!fieldErrors[`options[${idx}].startTime`]
                        }
                        disabled={!detail}
                      />
                      {fieldErrors[`options[${idx}].startTime`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`options[${idx}].startTime`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>
                        종료 날짜 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={opt.endDate}
                        onChange={(e) =>
                          setOptionField(idx, "endDate", e.target.value)
                        }
                        aria-invalid={
                          !!fieldErrors[`options[${idx}].endDate`]
                        }
                        disabled={!detail}
                      />
                      {fieldErrors[`options[${idx}].endDate`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`options[${idx}].endDate`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>
                        종료 시간 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={opt.endTime}
                        onChange={(e) =>
                          setOptionField(idx, "endTime", e.target.value)
                        }
                        aria-invalid={
                          !!fieldErrors[`options[${idx}].endTime`]
                        }
                        disabled={!detail}
                      />
                      {fieldErrors[`options[${idx}].endTime`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`options[${idx}].endTime`]}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label>일시 보조 텍스트</Label>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={"줄바꿈으로 구분 (예: 매주 화/목)"}
                        value={opt.dateTimeSubTexts}
                        onChange={(e) =>
                          setOptionField(
                            idx,
                            "dateTimeSubTexts",
                            e.target.value
                          )
                        }
                        disabled={!detail}
                      />
                      <p className="text-xs text-muted-foreground">
                        줄바꿈으로 여러 항목 입력 가능
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
                    <p className="text-xs text-destructive">
                      {fieldErrors["price"]}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-maxDiscountAmount">
                    최대 할인 금액 (원)
                  </Label>
                  <Input
                    id="edit-maxDiscountAmount"
                    type="number"
                    min="0"
                    placeholder="예: 20000"
                    value={form.maxDiscountAmount}
                    onChange={(e) =>
                      setField("maxDiscountAmount", e.target.value)
                    }
                    disabled={!detail}
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label htmlFor="edit-discountSubTexts">
                    할인 보조 텍스트
                  </Label>
                  <textarea
                    id="edit-discountSubTexts"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={"줄바꿈으로 구분 (예: 최대 20,000원 할인 가능)"}
                    value={form.discountSubTexts}
                    onChange={(e) =>
                      setField("discountSubTexts", e.target.value)
                    }
                    disabled={!detail}
                  />
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

            {/* 할인 항목 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  할인 항목 (선택)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDiscount}
                  disabled={!detail}
                >
                  + 할인 추가
                </Button>
              </div>

              {discounts.map((discount, idx) => (
                <div
                  key={idx}
                  className="rounded-md border p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      할인 {idx + 1}
                      {discount.id !== null && (
                        <span className="ml-2 text-muted-foreground font-mono">
                          (id: {discount.id})
                        </span>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-6 px-2"
                      onClick={() => removeDiscount(idx)}
                      disabled={!detail}
                    >
                      삭제
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>
                        할인 유형 <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={discount.type}
                        onValueChange={(v) =>
                          setDiscountField(idx, "type", v as "E" | "S")
                        }
                        disabled={!detail}
                      >
                        <SelectTrigger
                          aria-invalid={
                            !!fieldErrors[`discounts[${idx}].type`]
                          }
                        >
                          <SelectValue placeholder="유형 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="E">Earlybird (얼리버드)</SelectItem>
                          <SelectItem value="S">Sex (성별)</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors[`discounts[${idx}].type`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`discounts[${idx}].type`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>
                        할인 금액 (원) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="예: 10000"
                        value={discount.amount}
                        onChange={(e) =>
                          setDiscountField(idx, "amount", e.target.value)
                        }
                        aria-invalid={
                          !!fieldErrors[`discounts[${idx}].amount`]
                        }
                        disabled={!detail}
                      />
                      {fieldErrors[`discounts[${idx}].amount`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`discounts[${idx}].amount`]}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label>할인 조건</Label>
                      <Input
                        placeholder="예: 3일 전 등록 시"
                        value={discount.condition}
                        onChange={(e) =>
                          setDiscountField(idx, "condition", e.target.value)
                        }
                        disabled={!detail}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {discounts.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  등록된 할인 항목이 없습니다.
                </p>
              )}
            </section>

            {/* 문의 연락처 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  문의 연락처 (선택)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContact}
                  disabled={!detail}
                >
                  + 연락처 추가
                </Button>
              </div>

              {contacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="rounded-md border p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      연락처 {idx + 1}
                      {contact.id !== null && (
                        <span className="ml-2 text-muted-foreground font-mono">
                          (id: {contact.id})
                        </span>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-6 px-2"
                      onClick={() => removeContact(idx)}
                      disabled={!detail}
                    >
                      삭제
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>
                        연락처 유형 <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={contact.type}
                        onValueChange={(v) =>
                          setContactField(
                            idx,
                            "type",
                            v as "P" | "K" | "I" | "Y" | "W"
                          )
                        }
                        disabled={!detail}
                      >
                        <SelectTrigger
                          aria-invalid={
                            !!fieldErrors[`contacts[${idx}].type`]
                          }
                        >
                          <SelectValue placeholder="유형 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="P">Phone (전화)</SelectItem>
                          <SelectItem value="K">Kakaotalk (카카오톡)</SelectItem>
                          <SelectItem value="I">Instagram (인스타그램)</SelectItem>
                          <SelectItem value="Y">Youtube (유튜브)</SelectItem>
                          <SelectItem value="W">Web (웹사이트)</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors[`contacts[${idx}].type`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`contacts[${idx}].type`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>담당자명</Label>
                      <Input
                        placeholder="예: 김철수 (선택)"
                        value={contact.name}
                        onChange={(e) =>
                          setContactField(idx, "name", e.target.value)
                        }
                        disabled={!detail}
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label>
                        연락처 / 링크 / 계정명{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="예: https://open.kakao.com/o/xxx 또는 @account"
                        value={contact.address}
                        onChange={(e) =>
                          setContactField(idx, "address", e.target.value)
                        }
                        aria-invalid={
                          !!fieldErrors[`contacts[${idx}].address`]
                        }
                        disabled={!detail}
                      />
                      {fieldErrors[`contacts[${idx}].address`] && (
                        <p className="text-xs text-destructive">
                          {fieldErrors[`contacts[${idx}].address`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {contacts.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  등록된 연락처가 없습니다.
                </p>
              )}
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

// ---- 할인 타입 코드 변환 ----
function discountTypeToCode(type: "Earlybird" | "Sex"): "E" | "S" {
  return type === "Earlybird" ? "E" : "S";
}

// ---- 연락처 타입 코드 변환 ----
function contactTypeToCode(
  type: "Phone" | "Kakaotalk" | "Instagram" | "Youtube" | "Web"
): string {
  const map: Record<string, string> = {
    Phone: "P",
    Kakaotalk: "K",
    Instagram: "I",
    Youtube: "Y",
    Web: "W",
  };
  return map[type] ?? type;
}
