"use client";

import { useState } from "react";

type Option = {
  startDate: string; startTime: string;
  endDate: string; endTime: string;
  region: string; place: string; placeUrl: string;
};
type Discount = { type: "E" | "S" | ""; condition: string; amount: string };
type Contact  = { type: string; account: string; name: string };
type Notice   = { type: string; text: string };
type FieldError = { field: string; message: string };
type Props = { onClose: () => void; onSuccess: () => void };

const EMPTY_OPTION:   Option   = { startDate: "", startTime: "", endDate: "", endTime: "", region: "", place: "", placeUrl: "" };
const EMPTY_DISCOUNT: Discount = { type: "", condition: "", amount: "" };
const EMPTY_CONTACT:  Contact  = { type: "", account: "", name: "" };
const EMPTY_NOTICE:   Notice   = { type: "", text: "" };

const CONTACT_TYPES = [
  { value: "Y", label: "유튜브" },
  { value: "K", label: "카카오" },
  { value: "W", label: "웹사이트" },
  { value: "I", label: "인스타그램" },
  { value: "L", label: "링크" },
  { value: "M", label: "기타" },
];
const NOTICE_TYPES = [
  { value: "L", label: "링크" },
  { value: "T", label: "텍스트" },
  { value: "R", label: "환불" },
  { value: "N", label: "공지" },
  { value: "U", label: "URL" },
];

export default function LessonCreateModal({ onClose, onSuccess }: Props) {
  const [title, setTitle]             = useState("");
  const [genre, setGenre]             = useState<"S" | "B" | "">("");
  const [instructorLo, setInstructorLo] = useState("");
  const [instructorLa, setInstructorLa] = useState("");
  const [amount, setAmount]           = useState("");
  const [isActive, setIsActive]       = useState(true);
  const [options,   setOptions]       = useState<Option[]>([{ ...EMPTY_OPTION }]);
  const [discounts, setDiscounts]     = useState<Discount[]>([]);
  const [accountBank, setAccountBank] = useState("");
  const [accountNo,   setAccountNo]   = useState("");
  const [accountName, setAccountName] = useState("");
  const [contacts, setContacts]       = useState<Contact[]>([]);
  const [notices,  setNotices]        = useState<Notice[]>([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState<FieldError[]>([]);
  const [globalError,  setGlobalError]  = useState<string | null>(null);

  const getError = (field: string) => fieldErrors.find((e) => e.field === field)?.message;

  function updateOption  (i: number, k: keyof Option,   v: string) { setOptions  (p => p.map((o, j) => j === i ? { ...o, [k]: v } : o)); }
  function updateDiscount(i: number, k: keyof Discount, v: string) { setDiscounts(p => p.map((o, j) => j === i ? { ...o, [k]: v } : o)); }
  function updateContact (i: number, k: keyof Contact,  v: string) { setContacts (p => p.map((o, j) => j === i ? { ...o, [k]: v } : o)); }
  function updateNotice  (i: number, k: keyof Notice,   v: string) { setNotices  (p => p.map((o, j) => j === i ? { ...o, [k]: v } : o)); }

  async function handleSubmit() {
    setFieldErrors([]); setGlobalError(null); setSubmitting(true);
    try {
      const hasAccount = accountBank || accountNo || accountName;
      const body = {
        title, genre,
        instructorLo: instructorLo.trim() || null,
        instructorLa: instructorLa.trim() || null,
        options: options.map((o) => ({
          startDate: o.startDate, startTime: o.startTime,
          endDate: o.endDate,     endTime: o.endTime,
          region: o.region,
          place: o.place.trim() || null,
          placeUrl: o.placeUrl.trim() || null,
        })),
        amount: amount ? Number(amount) : null,
        discounts: discounts.length > 0
          ? discounts.map((d) => ({ type: d.type, condition: d.condition, amount: d.amount ? Number(d.amount) : null }))
          : null,
        account: hasAccount
          ? { bank: accountBank || null, account: accountNo || null, name: accountName || null }
          : null,
        contacts: contacts.length > 0
          ? contacts.map((c) => ({ type: c.type, account: c.account || null, name: c.name || null }))
          : null,
        isActive,
        notices: notices.length > 0
          ? notices.map((n) => ({ type: n.type, text: n.text || null }))
          : null,
      };

      const res = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 400) {
        const data = await res.json();
        if (Array.isArray(data.errors)) setFieldErrors(data.errors);
        else setGlobalError(data.message ?? "입력값을 확인해 주세요.");
        return;
      }
      if (!res.ok) throw new Error(`API 오류: ${res.status}`);
      onSuccess(); onClose();
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">레슨 생성</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto">
          {globalError && <p className="text-sm text-red-500">{globalError}</p>}

          {/* 기본 정보 */}
          <Section title="기본 정보">
            <Field label="제목" required error={getError("title")}>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="레슨 제목" className={cx} />
            </Field>
            <Field label="장르" required error={getError("genre")}>
              <select value={genre} onChange={(e) => setGenre(e.target.value as "S" | "B" | "")} className={cx}>
                <option value="">선택</option>
                <option value="S">살사</option>
                <option value="B">바차타</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="남성 강사 ID" error={getError("instructorLo")}>
                <input type="text" value={instructorLo} onChange={(e) => setInstructorLo(e.target.value)} placeholder="Profile ID" className={cx} />
              </Field>
              <Field label="여성 강사 ID" error={getError("instructorLa")}>
                <input type="text" value={instructorLa} onChange={(e) => setInstructorLa(e.target.value)} placeholder="Profile ID" className={cx} />
              </Field>
            </div>
          </Section>

          {/* 수업 옵션 */}
          <Section title="수업 옵션" required onAdd={() => setOptions((p) => [...p, { ...EMPTY_OPTION }])}>
            {getError("options") && <p className="text-xs text-red-500">{getError("options")}</p>}
            {options.map((opt, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <RowHeader label={`옵션 ${i + 1}`} onRemove={options.length > 1 ? () => setOptions((p) => p.filter((_, j) => j !== i)) : undefined} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="시작일" required error={getError(`options[${i}].startDate`)}>
                    <input type="date" value={opt.startDate} onChange={(e) => updateOption(i, "startDate", e.target.value)} className={cx} />
                  </Field>
                  <Field label="시작 시간" required error={getError(`options[${i}].startTime`)}>
                    <input type="time" value={opt.startTime} onChange={(e) => updateOption(i, "startTime", e.target.value)} className={cx} />
                  </Field>
                  <Field label="종료일" required error={getError(`options[${i}].endDate`)}>
                    <input type="date" value={opt.endDate} onChange={(e) => updateOption(i, "endDate", e.target.value)} className={cx} />
                  </Field>
                  <Field label="종료 시간" required error={getError(`options[${i}].endTime`)}>
                    <input type="time" value={opt.endTime} onChange={(e) => updateOption(i, "endTime", e.target.value)} className={cx} />
                  </Field>
                </div>
                <Field label="지역" required error={getError(`options[${i}].region`)}>
                  <select value={opt.region} onChange={(e) => updateOption(i, "region", e.target.value)} className={cx}>
                    <option value="">선택</option>
                    <option value="GN">강남</option>
                    <option value="HD">홍대</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="장소명">
                    <input type="text" value={opt.place} onChange={(e) => updateOption(i, "place", e.target.value)} placeholder="선택" className={cx} />
                  </Field>
                  <Field label="장소 URL">
                    <input type="text" value={opt.placeUrl} onChange={(e) => updateOption(i, "placeUrl", e.target.value)} placeholder="선택" className={cx} />
                  </Field>
                </div>
              </div>
            ))}
          </Section>

          {/* 수강료 */}
          <Section title="수강료">
            <Field label="수강료">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={cx} />
            </Field>
          </Section>

          {/* 할인 */}
          <Section title="할인" onAdd={() => setDiscounts((p) => [...p, { ...EMPTY_DISCOUNT }])}>
            {discounts.map((d, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <RowHeader label={`할인 ${i + 1}`} onRemove={() => setDiscounts((p) => p.filter((_, j) => j !== i))} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="타입" required error={getError(`discounts[${i}].type`)}>
                    <select value={d.type} onChange={(e) => updateDiscount(i, "type", e.target.value)} className={cx}>
                      <option value="">선택</option>
                      <option value="E">얼리버드</option>
                      <option value="S">성별</option>
                    </select>
                  </Field>
                  <Field label={d.type === "S" ? "조건 (M/F)" : "조건 (날짜)"} required error={getError(`discounts[${i}].condition`)}>
                    {d.type === "S" ? (
                      <select value={d.condition} onChange={(e) => updateDiscount(i, "condition", e.target.value)} className={cx}>
                        <option value="">선택</option>
                        <option value="M">남성</option>
                        <option value="F">여성</option>
                      </select>
                    ) : (
                      <input type="date" value={d.condition} onChange={(e) => updateDiscount(i, "condition", e.target.value)} className={cx} />
                    )}
                  </Field>
                  <Field label="할인 금액">
                    <input type="number" value={d.amount} onChange={(e) => updateDiscount(i, "amount", e.target.value)} placeholder="0" className={cx} />
                  </Field>
                </div>
              </div>
            ))}
          </Section>

          {/* 계좌 */}
          <Section title="입금 계좌">
            <div className="grid grid-cols-3 gap-3">
              <Field label="은행명">
                <input type="text" value={accountBank} onChange={(e) => setAccountBank(e.target.value)} placeholder="카카오뱅크" className={cx} />
              </Field>
              <Field label="계좌번호">
                <input type="text" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder="0000-00-0000000" className={cx} />
              </Field>
              <Field label="예금주">
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="홍길동" className={cx} />
              </Field>
            </div>
          </Section>

          {/* 연락처 */}
          <Section title="연락처" onAdd={() => setContacts((p) => [...p, { ...EMPTY_CONTACT }])}>
            {contacts.map((c, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <RowHeader label={`연락처 ${i + 1}`} onRemove={() => setContacts((p) => p.filter((_, j) => j !== i))} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="타입" required error={getError(`contacts[${i}].type`)}>
                    <select value={c.type} onChange={(e) => updateContact(i, "type", e.target.value)} className={cx}>
                      <option value="">선택</option>
                      {CONTACT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="계정">
                    <input type="text" value={c.account} onChange={(e) => updateContact(i, "account", e.target.value)} placeholder="ID 또는 URL" className={cx} />
                  </Field>
                  <Field label="표시명">
                    <input type="text" value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)} placeholder="채널명" className={cx} />
                  </Field>
                </div>
              </div>
            ))}
          </Section>

          {/* 공지 */}
          <Section title="공지" onAdd={() => setNotices((p) => [...p, { ...EMPTY_NOTICE }])}>
            {notices.map((n, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <RowHeader label={`공지 ${i + 1}`} onRemove={() => setNotices((p) => p.filter((_, j) => j !== i))} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="타입" required error={getError(`notices[${i}].type`)}>
                    <select value={n.type} onChange={(e) => updateNotice(i, "type", e.target.value)} className={cx}>
                      <option value="">선택</option>
                      {NOTICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <div className="col-span-2">
                    <Field label="내용">
                      <input type="text" value={n.text} onChange={(e) => updateNotice(i, "text", e.target.value)} placeholder="공지 내용" className={cx} />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* 활성 여부 */}
          <Section title="활성 여부">
            <Field label="">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                <span className="text-sm text-gray-700">활성</span>
              </label>
            </Field>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {submitting ? "생성 중…" : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

const cx = "w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Section({ title, required, onAdd, children }: { title: string; required?: boolean; onAdd?: () => void; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {title}{required && <span className="text-red-400 ml-1">*</span>}
        </h3>
        {onAdd && (
          <button type="button" onClick={onAdd} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ 추가</button>
        )}
      </div>
      {children}
    </section>
  );
}

function RowHeader({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-xs text-red-400 hover:text-red-600">삭제</button>
      )}
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
