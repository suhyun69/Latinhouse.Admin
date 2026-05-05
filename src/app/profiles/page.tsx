"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type {
  ProfileResponse,
  PagedProfileResponse,
  ProfileListFilter,
} from "@/types/profile";
import { ProfileCreateModal } from "@/components/ProfileCreateModal";
import { ProfileDetailModal } from "@/components/ProfileDetailModal";
import { ProfileEditModal } from "@/components/ProfileEditModal";

const API_BASE = "";
const PAGE_SIZE = 20;

// localStorage에서 access token 읽기 (키: "accessToken")
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function SexBadge({ sex }: { sex: ProfileResponse["sex"] }) {
  if (sex === "M") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
        남성
      </Badge>
    );
  }
  return (
    <Badge className="bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-100">
      여성
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

export default function ProfilesPage() {
  const [data, setData] = useState<PagedProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // 필터 상태
  const [nicknameFilter, setNicknameFilter] = useState("");
  const [sexFilter, setSexFilter] = useState<ProfileListFilter["sex"]>("");
  const [instructorFilter, setInstructorFilter] = useState<ProfileListFilter["isInstructor"]>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailProfileId, setDetailProfileId] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState<ProfileResponse | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const fetchProfiles = useCallback(
    async (
      pageNum: number,
      nickname: string,
      sex: ProfileListFilter["sex"],
      isInstructor: ProfileListFilter["isInstructor"]
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          size: String(PAGE_SIZE),
        });
        if (nickname.trim()) params.set("nickname", nickname.trim());
        if (sex) params.set("sex", sex);
        if (isInstructor) params.set("isInstructor", isInstructor);

        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(
          `${API_BASE}/api/v1/profiles?${params.toString()}`,
          { headers }
        );

        if (res.status === 401) {
          throw new Error("인증이 필요합니다. 다시 로그인해 주세요.");
        }
        if (!res.ok) {
          throw new Error(`API 오류: ${res.status} ${res.statusText}`);
        }

        const json: PagedProfileResponse = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProfiles(page, nicknameFilter, sexFilter, instructorFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSearch() {
    setPage(0);
    fetchProfiles(0, nicknameFilter, sexFilter, instructorFilter);
  }

  function handleReset() {
    setNicknameFilter("");
    setSexFilter("");
    setInstructorFilter("");
    setPage(0);
    fetchProfiles(0, "", "", "");
  }

  function handleCreateSuccess() {
    setPage(0);
    fetchProfiles(0, nicknameFilter, sexFilter, instructorFilter);
  }

  function handleDetailClose() {
    setDetailProfileId(null);
    fetchProfiles(page, nicknameFilter, sexFilter, instructorFilter);
  }

  function handleEditSuccess() {
    setEditProfile(null);
    fetchProfiles(page, nicknameFilter, sexFilter, instructorFilter);
  }

  async function handlePromoteInstructor(profile: ProfileResponse) {
    if (promotingId) return;
    setPromotingId(profile.profileId);
    try {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/v1/profiles/instructor`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ profileId: profile.profileId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `강사 등록 실패 (${res.status})`);
      }
      fetchProfiles(page, nicknameFilter, sexFilter, instructorFilter);
    } catch (err) {
      alert(err instanceof Error ? err.message : "강사 등록 중 오류가 발생했습니다.");
    } finally {
      setPromotingId(null);
    }
  }

  const totalPages = data?.totalPages ?? 1;
  const profiles = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">프로필 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">
            등록된 프로필 목록을 조회하고 관리합니다.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>프로필 생성</Button>
      </div>

      <ProfileCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      <ProfileDetailModal
        profileId={detailProfileId}
        onOpenChange={(open) => {
          if (!open) handleDetailClose();
        }}
        onDelete={() => {
          setDetailProfileId(null);
          setPage(0);
          fetchProfiles(0, nicknameFilter, sexFilter, instructorFilter);
        }}
      />

      <ProfileEditModal
        profile={editProfile}
        onOpenChange={(open) => {
          if (!open) setEditProfile(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* 검색 필터 */}
      <div className="flex flex-wrap items-end gap-3">
        {/* 닉네임 검색 */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">닉네임</p>
          <Input
            className="w-44"
            placeholder="닉네임 (부분 검색)"
            value={nicknameFilter}
            onChange={(e) => setNicknameFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>

        {/* 성별 */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">성별</p>
          <Select
            value={sexFilter}
            onValueChange={(v) =>
              setSexFilter(v as ProfileListFilter["sex"])
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="전체 성별" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체 성별</SelectItem>
              <SelectItem value="M">남성</SelectItem>
              <SelectItem value="F">여성</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 강사 여부 */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">강사 여부</p>
          <Select
            value={instructorFilter}
            onValueChange={(v) =>
              setInstructorFilter(v as ProfileListFilter["isInstructor"])
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              <SelectItem value="true">강사</SelectItem>
              <SelectItem value="false">일반</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pb-0.5">
          <Button variant="outline" onClick={handleReset}>
            초기화
          </Button>
          <Button onClick={handleSearch}>검색</Button>
        </div>
      </div>

      {/* 에러 상태 */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && !error && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          데이터를 불러오는 중...
        </div>
      )}

      {/* 테이블 */}
      {!loading && !error && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">profileId</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead className="w-24 text-center">성별</TableHead>
                  <TableHead className="w-24 text-center">강사 여부</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      표시할 프로필이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile: ProfileResponse) => (
                    <TableRow key={profile.profileId}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {profile.profileId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {profile.nickname}
                      </TableCell>
                      <TableCell className="text-center">
                        <SexBadge sex={profile.sex} />
                      </TableCell>
                      <TableCell className="text-center">
                        <InstructorBadge isInstructor={profile.isInstructor} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">행 메뉴 열기</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDetailProfileId(profile.profileId)}
                            >
                              상세보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditProfile(profile)}
                            >
                              수정
                            </DropdownMenuItem>
                            {!profile.isInstructor && (
                              <DropdownMenuItem
                                onClick={() => handlePromoteInstructor(profile)}
                                disabled={promotingId === profile.profileId}
                              >
                                {promotingId === profile.profileId
                                  ? "처리 중..."
                                  : "강사 등록"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 {data?.totalElements ?? 0}건
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
