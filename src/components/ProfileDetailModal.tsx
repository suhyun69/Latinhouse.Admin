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
import type { ProfileResponse } from "@/types/profile";
import { ProfileEditModal } from "@/components/ProfileEditModal";

const API_BASE = "";

// localStorage에서 access token 읽기 (키: "accessToken")
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function SexBadge({ sex }: { sex: ProfileResponse["sex"] }) {
  if (sex === "M") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
        남성 (M)
      </Badge>
    );
  }
  return (
    <Badge className="bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-100">
      여성 (F)
    </Badge>
  );
}

function InstructorBadge({ isInstructor }: { isInstructor: boolean }) {
  if (isInstructor) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        강사
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
      일반
    </Badge>
  );
}

export interface ProfileDetailModalProps {
  profileId: string | null;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
}

export function ProfileDetailModal({
  profileId,
  onOpenChange,
  onDelete,
}: ProfileDetailModalProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState<ProfileResponse | null>(null);

  const open = profileId !== null;

  useEffect(() => {
    if (profileId === null) {
      setProfile(null);
      setError(null);
      setDeleteConfirm(false);
      setDeleteError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setProfile(null);
    setError(null);
    setDeleteConfirm(false);
    setDeleteError(null);

    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`${API_BASE}/api/v1/profiles/${profileId}`, { headers })
      .then(async (res) => {
        if (res.status === 401) {
          throw new Error("인증이 필요합니다. 다시 로그인해 주세요.");
        }
        if (res.status === 404) {
          throw new Error("프로필을 찾을 수 없습니다.");
        }
        if (!res.ok) {
          throw new Error(`데이터 조회 실패 (${res.status})`);
        }
        return res.json() as Promise<ProfileResponse>;
      })
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "데이터 조회 중 오류가 발생했습니다."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      onOpenChange(false);
    }
  }

  async function handleDelete() {
    if (!profileId) return;
    setDeleting(true);
    setDeleteError(null);

    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/profiles/${profileId}`, {
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
        setDeleteError("이미 삭제된 프로필입니다.");
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

  // 수정 모달 성공 콜백: 프로필 상태를 최신 응답으로 갱신
  function handleEditSuccess(updated: ProfileResponse) {
    setProfile(updated);
    setEditProfile(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto"
          showCloseButton={true}
        >
          <DialogHeader>
            <DialogTitle>
              {profile ? profile.nickname : "프로필 상세"}
            </DialogTitle>
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

          {!loading && !error && profile && (
            <div className="space-y-5 py-2">
              {/* 기본 정보 */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">profileId</div>
                  <div className="font-mono">{profile.profileId}</div>

                  <div className="text-muted-foreground">닉네임</div>
                  <div>{profile.nickname}</div>

                  <div className="text-muted-foreground">성별</div>
                  <div>
                    <SexBadge sex={profile.sex} />
                  </div>

                  <div className="text-muted-foreground">강사 여부</div>
                  <div>
                    <InstructorBadge isInstructor={profile.isInstructor} />
                  </div>
                </div>
              </section>

              <Separator />

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
                    정말 이 프로필을 삭제하시겠습니까?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    삭제하면 해당 프로필 데이터가 영구적으로 제거됩니다. 이
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
            {/* 왼쪽: 삭제 버튼 */}
            {profile && !deleteConfirm ? (
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
            ) : (
              <span />
            )}

            {/* 오른쪽: 수정 + 닫기 */}
            <div className="flex gap-2">
              {profile && !deleteConfirm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditProfile(profile)}
                  disabled={deleting}
                >
                  수정
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                닫기
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 모달 (상세 모달 위에 중첩) */}
      <ProfileEditModal
        profile={editProfile}
        onOpenChange={(open) => {
          if (!open) setEditProfile(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
