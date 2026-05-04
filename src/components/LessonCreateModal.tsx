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

const API_BASE = "";

// ---- 옵션 폼 단위 ----
type OptionForm = {
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
type DiscountForm = {
  type: "E" | "S" | "";
  condition: string;
  amount: string;
};

function emptyDiscount(): DiscountForm {
  return { type: "", condition: "", amount: "" };
}

// ---- 연락처 항목 폼 단위 ----
type ContactForm = {
  type: "P" | "K" | "I" | "Y" | "W" | "";
  name: string;
  address: string;
};

function emptyContact(): ContactForm {
  return { type: "", name: "", address: "" };
}

// ---- 최상위 폼 ----
type CreateForm = {
  title: string;
  genre: "S" | "B" | "";
  instructorLo: string;
  instructorLa: string;
  price: string;
  maxDiscountAmount: string;
  discountSubTexts: string; // 줄바꿈 구분 입력
  bank: string;
  accountNumber: string;
  accountOwner: string;
};

const INITIAL_FORM: CreateForm = {
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

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- Props ----
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
  const [options, setOptions] = useState<OptionForm[]>([emptyOption()]);
  const [discounts, setDiscounts] = useState<DiscountForm[]>([]);
  const [contacts, setContacts] = useState<ContactForm[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(INITIAL_FORM);
      setOptions([emptyOption()]);
      setDiscounts([]);
      setContacts([]);
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
      options: options.map((opt) => ({
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
        type: d.type || undefined,
        condition: orNull(d.condition),
        amount: d.amount !== "" ? parseFloat(d.amount) : undefined,
      })),
      contacts: contacts.map((c) => ({
        type: c.type || undefined,
        name: orNull(c.name),
        address: c.address,
      })),
    };
  }

  async function handleRandom() {
    setFieldErrors({});
    setGlobalError(null);
    setSubmitting(true);

    const loPool = ["김철수", "박민준", "이재원", "최동현", "정우진"];
    const laPool = ["이수진", "박지영", "김하은", "최유리", "정민지"];
    const today = new Date();
    const genre = pick(["S", "B"] as const);
    const genreLabel = genre === "S" ? "Salsa" : "Bachata";
    const level = pick(["초급", "중급", "심화"]);
    const idx = randomInt(1, 99);
    const instructorLo = pick(loPool);
    const instructorLa = pick(laPool);
    const startDate = addDays(today, randomInt(1, 30));
    const startTime = pick(["19:00", "20:00", "14:00"]);
    const endDate = addDays(new Date(startDate), randomInt(7, 42));
    const [sh, sm] = startTime.split(":").map(Number);
    const endTotalMin = sh * 60 + sm + 90;
    const endTime = `${String(Math.floor(endTotalMin / 60)).padStart(2, "0")}:${String(
      endTotalMin % 60
    ).padStart(2, "0")}`;
    const place = pick(["라틴하우스 강남점", "홍대 댄스센터", "GS댄스스튜디오"]);
    const price = pick([50000, 80000, 100000, 120000, 150000]);
    const bank = pick(["신한", "국민", "우리", "카카오"]);
    const accountNumber = `110-${String(randomInt(100, 999))}-${String(
      randomInt(100000, 999999)
    )}`;

    const body = {
      title: `${genreLabel} ${level} ${idx}반`,
      genre,
      instructorLo,
      instructorLa,
      options: [
        {
          region: pick(["GN", "HD"] as const),
          place,
          placeUrl: null,
          startDate,
          startTime,
          endDate,
          endTime,
          dateTimeSubTexts: [],
        },
      ],
      price,
      maxDiscountAmount: null,
      discountSubTexts: [],
      bank,
      accountNumber,
      accountOwner: instructorLo,
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
        /* noop */
      }
      if (errData?.fieldErrors && errData.fieldErrors.length > 0) {
        const map: Record<string, string> = {};
        for (const fe of errData.fieldErrors) map[fe.field] = fe.message;
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

  async function handleSubmit() {
    setFieldErrors({});
    setGlobalError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
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
                  <p className="text-xs text-destructive">
                    {fieldErrors["instructorLo"]}
                  </p>
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
                  </span>
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-6 px-2"
                      onClick={() => removeOption(idx)}
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
                    >
                      <SelectTrigger
                        aria-invalid={!!fieldErrors[`options[${idx}].region`]}
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
                      aria-invalid={!!fieldErrors[`options[${idx}].endDate`]}
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
                      aria-invalid={!!fieldErrors[`options[${idx}].endTime`]}
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
                        setOptionField(idx, "dateTimeSubTexts", e.target.value)
                      }
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

              <div className="space-y-1">
                <Label htmlFor="maxDiscountAmount">최대 할인 금액 (원)</Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  min="0"
                  placeholder="예: 20000"
                  value={form.maxDiscountAmount}
                  onChange={(e) =>
                    setField("maxDiscountAmount", e.target.value)
                  }
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="discountSubTexts">할인 보조 텍스트</Label>
                <textarea
                  id="discountSubTexts"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={"줄바꿈으로 구분 (예: 최대 20,000원 할인 가능)"}
                  value={form.discountSubTexts}
                  onChange={(e) => setField("discountSubTexts", e.target.value)}
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
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-6 px-2"
                    onClick={() => removeDiscount(idx)}
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
                    >
                      <SelectTrigger
                        aria-invalid={!!fieldErrors[`discounts[${idx}].type`]}
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
                      aria-invalid={!!fieldErrors[`discounts[${idx}].amount`]}
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
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-6 px-2"
                    onClick={() => removeContact(idx)}
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
                    >
                      <SelectTrigger
                        aria-invalid={!!fieldErrors[`contacts[${idx}].type`]}
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

        <DialogFooter className="flex justify-between">
          <Button variant="secondary" onClick={handleRandom} disabled={submitting}>
            Random
          </Button>
          <div className="flex gap-2">
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
