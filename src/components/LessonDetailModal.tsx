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
import type { LessonDetail, LessonOptionResponse } from "@/types/lesson";

const API_BASE = "";

// localStorage에서 access token 읽기 (키: "accessToken")
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export interface LessonDetailModalProps {
  lessonNo: number | null;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
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

function OptionStatusBadge({ status }: { status: LessonOptionResponse["status"] }) {
  if (status === "stand_by") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
        대기
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        진행중
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
      종료
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
  onDelete,
}: LessonDetailModalProps) {
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const open = lessonNo !== null;

  useEffect(() => {
    if (lessonNo === null) {
      setDetail(null);
      setError(null);
      setDeleteConfirm(false);
      setDeleteError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setDetail(null);
    setError(null);
    setDeleteConfirm(false);
    setDeleteError(null);

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

  async function handleDelete() {
    if (lessonNo === null) return;
    setDeleting(true);
    setDeleteError(null);

    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/lessons/${lessonNo}`, {
        method: "DELETE",
        headers,
      });

      if (res.status === 204) {
        onOpenChange(false);
        if (onDelete) onDelete();
        return;
      }

      if (res.status === 401) {
        setDeleteError("인증이 필요합니다. 다시 로그인해 주세요.");
        setDeleteConfirm(false);
        return;
      }

      if (res.status === 404) {
        setDeleteError("이미 삭제된 레슨입니다.");
        setDeleteConfirm(false);
        return;
      }

      setDeleteError(`삭제 실패 (${res.status})`);
      setDeleteConfirm(false);
    } catch {
      setDeleteError("네트워크 오류가 발생했습니다.");
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
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
                <div className="text-muted-foreground">No</div>
                <div className="font-mono">{detail.no}</div>
                <div className="text-muted-foreground">제목</div>
                <div>{detail.title}</div>
                <div className="text-muted-foreground">장르</div>
                <div>
                  <GenreBadge genre={detail.genre} />
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

            {/* 레슨 옵션 목록 */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                일정 및 장소 옵션 ({detail.options.length}개)
              </h3>
              {detail.options.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  등록된 옵션이 없습니다.
                </p>
              ) : (
                detail.options.map((opt, idx) => (
                  <div
                    key={opt.no}
                    className="rounded-md border px-4 py-3 space-y-2"
                  >
                    <p className="text-xs font-semibold text-muted-foreground">
                      옵션 {idx + 1}
                      <span className="ml-2 font-mono">
                        (no: {opt.no})
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <div className="text-muted-foreground">상태</div>
                      <div>
                        <OptionStatusBadge status={opt.status} />
                      </div>
                      <div className="text-muted-foreground">지역</div>
                      <div>
                        <RegionBadge region={opt.region} />
                      </div>
                      <div className="text-muted-foreground">장소</div>
                      <div>{opt.place ?? "-"}</div>
                      <div className="text-muted-foreground">장소 URL</div>
                      <div>
                        {opt.placeUrl ? (
                          <a
                            href={opt.placeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline underline-offset-2 hover:text-blue-800 break-all"
                          >
                            {opt.placeUrl}
                          </a>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="text-muted-foreground">시작일시</div>
                      <div className="font-mono">
                        {formatDateTime(opt.startDateTime)}
                      </div>
                      <div className="text-muted-foreground">종료일시</div>
                      <div className="font-mono">
                        {formatDateTime(opt.endDateTime)}
                      </div>
                      {opt.dateTimeSubTexts.length > 0 && (
                        <>
                          <div className="text-muted-foreground">
                            일시 보조 텍스트
                          </div>
                          <ul className="space-y-0.5">
                            {opt.dateTimeSubTexts.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
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
                    <div>
                      {detail.maxDiscountAmount.toLocaleString("ko-KR")}원
                    </div>
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

            {/* 삭제 에러 */}
            {deleteError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {deleteError}
              </div>
            )}

            {/* 삭제 확인 영역 */}
            {deleteConfirm && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  정말 이 레슨을 삭제하시겠습니까?
                </p>
                <p className="text-xs text-muted-foreground">
                  삭제하면 연관된 옵션, 할인, 연락처도 함께 삭제됩니다. 이
                  작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "삭제 중..." : "삭제 확인"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {/* 삭제 버튼 — 상세가 로드된 경우에만 표시 */}
          {detail && !deleteConfirm && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setDeleteConfirm(true);
                setDeleteError(null);
              }}
              disabled={deleting}
            >
              삭제
            </Button>
          )}
          {(!detail || deleteConfirm) && <span />}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
