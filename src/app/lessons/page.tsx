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
  LessonSummary,
  LessonPageResponse,
  Genre,
  Region,
  GenreCode,
  RegionCode,
  LessonStatus,
  LessonOptionResponse,
} from "@/types/lesson";
import { LessonCreateModal } from "@/components/LessonCreateModal";
import { LessonEditModal } from "@/components/LessonEditModal";
import { LessonDetailModal } from "@/components/LessonDetailModal";

const API_BASE = "";
const PAGE_SIZE = 20;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}`;
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

function GenreBadge({ genre }: { genre: Genre }) {
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

function RegionBadge({ region }: { region: Region }) {
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

export default function LessonsPage() {
  const [data, setData] = useState<LessonPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // 필터 상태 — 서버 쿼리 파라미터로 전달
  const [genreFilter, setGenreFilter] = useState<GenreCode | "">("");
  const [regionFilter, setRegionFilter] = useState<RegionCode | "">("");
  const [instructorFilter, setInstructorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<LessonStatus | "">("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<number | null>(null);
  const [detailLesson, setDetailLesson] = useState<number | null>(null);

  const fetchLessons = useCallback(
    async (
      pageNum: number,
      genre: GenreCode | "",
      region: RegionCode | "",
      instructor: string,
      status: LessonStatus | ""
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          size: String(PAGE_SIZE),
        });
        if (genre) params.set("genre", genre);
        if (region) params.set("region", region);
        if (instructor.trim()) params.set("instructor", instructor.trim());
        if (status) params.set("status", status);

        const res = await fetch(`${API_BASE}/api/v1/lessons?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`API 오류: ${res.status} ${res.statusText}`);
        }
        const json: LessonPageResponse = await res.json();
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
    fetchLessons(page, genreFilter, regionFilter, instructorFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSearch() {
    setPage(0);
    fetchLessons(0, genreFilter, regionFilter, instructorFilter, statusFilter);
  }

  function handleReset() {
    setGenreFilter("");
    setRegionFilter("");
    setInstructorFilter("");
    setStatusFilter("");
    setPage(0);
    fetchLessons(0, "", "", "", "");
  }

  function handleCreateSuccess() {
    setPage(0);
    fetchLessons(0, genreFilter, regionFilter, instructorFilter, statusFilter);
  }

  function handleEditSuccess() {
    fetchLessons(page, genreFilter, regionFilter, instructorFilter, statusFilter);
  }

  const totalPages = data?.totalPages ?? 1;
  const lessons = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">레슨 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">
            등록된 레슨 목록을 조회하고 관리합니다.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create</Button>
      </div>

      <LessonCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      <LessonEditModal
        lessonNo={editLesson}
        onOpenChange={(open) => {
          if (!open) setEditLesson(null);
        }}
        onSuccess={handleEditSuccess}
      />

      <LessonDetailModal
        lessonNo={detailLesson}
        onOpenChange={(open) => {
          if (!open) setDetailLesson(null);
        }}
        onDelete={() => {
          setDetailLesson(null);
          setPage(0);
          fetchLessons(0, genreFilter, regionFilter, instructorFilter, statusFilter);
        }}
      />

      {/* 검색 필터 */}
      <div className="flex flex-wrap items-end gap-3">
        {/* 장르 */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">장르</p>
          <Select
            value={genreFilter}
            onValueChange={(v) => setGenreFilter(v as GenreCode | "")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="전체 장르" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체 장르</SelectItem>
              <SelectItem value="S">Salsa</SelectItem>
              <SelectItem value="B">Bachata</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 지역 */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">지역</p>
          <Select
            value={regionFilter}
            onValueChange={(v) => setRegionFilter(v as RegionCode | "")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="전체 지역" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체 지역</SelectItem>
              <SelectItem value="GN">Gangnam</SelectItem>
              <SelectItem value="HD">Hongdae</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 상태 */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">상태</p>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as LessonStatus | "")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체 상태</SelectItem>
              <SelectItem value="stand_by">대기</SelectItem>
              <SelectItem value="in_progress">진행중</SelectItem>
              <SelectItem value="done">종료</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 강사 검색 */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">강사</p>
          <Input
            className="w-44"
            placeholder="강사 이름 (부분 검색)"
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
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
                  <TableHead className="w-16 text-center">lessonNo</TableHead>
                  <TableHead className="w-16 text-center">optionNo</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-24 text-center">장르</TableHead>
                  <TableHead className="w-24 text-center">강사(Lo)</TableHead>
                  <TableHead className="w-24 text-center">강사(La)</TableHead>
                  <TableHead className="w-24 text-center">지역</TableHead>
                  <TableHead className="w-36">장소</TableHead>
                  <TableHead className="w-36 text-center">시작일</TableHead>
                  <TableHead className="w-36 text-center">종료일</TableHead>
                  <TableHead className="w-24 text-center">상태</TableHead>
                  <TableHead className="w-28 text-right">수강료</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      표시할 레슨이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  lessons.flatMap((lesson: LessonSummary) => {
                    const rows =
                      lesson.options.length > 0 ? lesson.options : [null];
                    return rows.map((option, idx) => (
                      <TableRow
                        key={
                          option ? `${lesson.no}-${option.no}` : `${lesson.no}-empty`
                        }
                        className={idx > 0 ? "border-t-0" : ""}
                      >
                        <TableCell className="font-mono text-sm text-muted-foreground text-center">
                          {lesson.no}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground text-center">
                          {option ? option.no : "-"}
                        </TableCell>
                        <TableCell>
                          <button
                            className="font-medium text-left hover:underline underline-offset-2 cursor-pointer"
                            onClick={() => setDetailLesson(lesson.no)}
                          >
                            {lesson.title}
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <GenreBadge genre={lesson.genre} />
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {lesson.instructorLo ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-center">
                          {lesson.instructorLa ?? "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {option ? <RegionBadge region={option.region} /> : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[144px]">
                          {option?.place ?? "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-center">
                          {option ? formatDateTime(option.startDateTime) : "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-center">
                          {option ? formatDateTime(option.endDateTime) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {option ? (
                            <OptionStatusBadge status={option.status} />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatPrice(lesson.price)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">행 메뉴 열기</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setDetailLesson(lesson.no)}
                              >
                                상세 보기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setEditLesson(lesson.no)}
                              >
                                수정
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ));
                  })
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
