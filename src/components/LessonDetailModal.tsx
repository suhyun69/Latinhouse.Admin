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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const API_BASE = "";

type LessonDetail = {
  no: number;
  title: string;
  genre: string;
  region: string;
  instructorLo: string | null;
  instructorLa: string | null;
  startDateTime: string;
  endDateTime: string;
  dateTimeSubTexts: string[];
  place: string | null;
  placeUrl: string | null;
  price: number;
  maxDiscountAmount: number | null;
  discountSubTexts: string[];
  bank: string | null;
  accountNumber: string | null;
  accountOwner: string | null;
  discounts: {
    id: number;
    type: string;
    condition: string | null;
    amount: number;
  }[];
  contacts: {
    id: number;
    type: string;
    name: string | null;
    address: string;
  }[];
};

export interface LessonDetailModalProps {
  lessonNo: number | null;
  onOpenChange: (open: boolean) => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}`;
}

function GenreBadge({ genre }: { genre: string }) {
  if (genre === "Salsa") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
        Salsa
      </Badge>
    );
  }
  return (
    <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">
      Bachata
    </Badge>
  );
}

function RegionBadge({ region }: { region: string }) {
  if (region === "Gangnam") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        Gangnam
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">
      Hongdae
    </Badge>
  );
}

function discountTypeLabel(type: string): string {
  if (type === "Earlybird") return "얼리버드";
  if (type === "Sex") return "성별";
  return type;
}

function contactTypeLabel(type: string): string {
  if (type === "Phone") return "전화";
  if (type === "Kakaotalk") return "카카오톡";
  if (type === "Instagram") return "인스타그램";
  if (type === "Youtube") return "유튜브";
  if (type === "Web") return "웹";
  return type;
}

export function LessonDetailModal({
  lessonNo,
  onOpenChange,
}: LessonDetailModalProps) {
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = lessonNo !== null;

  useEffect(() => {
    if (lessonNo === null) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setDetail(null);
    setError(null);

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
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "데이터 조회 중 오류가 발생했습니다."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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

  const hasPaymentInfo =
    detail &&
    (detail.bank !== null ||
      detail.accountNumber !== null ||
      detail.accountOwner !== null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>{detail ? detail.title : "레슨 상세"}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            데이터를 불러오는 중...
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && detail && (
          <div className="space-y-5 py-2">
            {/* 기본 정보 */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                기본 정보
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">제목</div>
                <div>{detail.title}</div>
                <div className="text-muted-foreground">장르</div>
                <div>
                  <GenreBadge genre={detail.genre} />
                </div>
                <div className="text-muted-foreground">지역</div>
                <div>
                  <RegionBadge region={detail.region} />
                </div>
              </div>
            </section>

            <Separator />

            {/* 강사 */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                강사
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">리드 (Lo)</div>
                <div>{detail.instructorLo ?? "-"}</div>
                <div className="text-muted-foreground">팔로 (La)</div>
                <div>{detail.instructorLa ?? "-"}</div>
              </div>
            </section>

            <Separator />

            {/* 일정 */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                일정
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">시작일시</div>
                <div className="font-mono">{formatDateTime(detail.startDateTime)}</div>
                <div className="text-muted-foreground">종료일시</div>
                <div className="font-mono">{formatDateTime(detail.endDateTime)}</div>
                {detail.dateTimeSubTexts.length > 0 && (
                  <>
                    <div className="text-muted-foreground">보조 텍스트</div>
                    <ul className="space-y-0.5">
                      {detail.dateTimeSubTexts.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>

            <Separator />

            {/* 장소 */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                장소
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">장소명</div>
                <div>{detail.place ?? "-"}</div>
                <div className="text-muted-foreground">장소 URL</div>
                <div>
                  {detail.placeUrl ? (
                    <a
                      href={detail.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline underline-offset-2 hover:text-blue-800 break-all"
                    >
                      {detail.placeUrl}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* 수강료 */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                수강료
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">수강료</div>
                <div className="font-medium">
                  {detail.price.toLocaleString("ko-KR")}원
                </div>
                {detail.maxDiscountAmount !== null && (
                  <>
                    <div className="text-muted-foreground">최대 할인</div>
                    <div>{detail.maxDiscountAmount.toLocaleString("ko-KR")}원</div>
                  </>
                )}
                {detail.discountSubTexts.length > 0 && (
                  <>
                    <div className="text-muted-foreground">할인 보조 텍스트</div>
                    <ul className="space-y-0.5">
                      {detail.discountSubTexts.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>

            {/* 할인 항목 */}
            {detail.discounts.length > 0 && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    할인 항목
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {detail.discounts.map((d) => (
                      <li key={d.id} className="flex gap-3">
                        <span className="font-medium w-20 shrink-0">
                          {discountTypeLabel(d.type)}
                        </span>
                        <span className="text-muted-foreground">
                          {d.condition ? `${d.condition} · ` : ""}
                          {d.amount.toLocaleString("ko-KR")}원
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {/* 결제 정보 */}
            {hasPaymentInfo && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    결제 정보
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-muted-foreground">은행</div>
                    <div>{detail.bank ?? "-"}</div>
                    <div className="text-muted-foreground">계좌번호</div>
                    <div className="font-mono">{detail.accountNumber ?? "-"}</div>
                    <div className="text-muted-foreground">예금주</div>
                    <div>{detail.accountOwner ?? "-"}</div>
                  </div>
                </section>
              </>
            )}

            {/* 연락처 */}
            {detail.contacts.length > 0 && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    연락처
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {detail.contacts.map((c) => (
                      <li key={c.id} className="flex gap-3">
                        <span className="font-medium w-20 shrink-0">
                          {contactTypeLabel(c.type)}
                        </span>
                        <span>
                          {c.name ? `${c.name} · ` : ""}
                          {c.address}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
