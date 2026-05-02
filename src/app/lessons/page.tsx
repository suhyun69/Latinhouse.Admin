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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lesson, LessonPageResponse, Genre, Region } from "@/types/lesson";
import { LessonCreateModal } from "@/components/LessonCreateModal";

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

export default function LessonsPage() {
  const [data, setData] = useState<LessonPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const [genreFilter, setGenreFilter] = useState<Genre | "ALL">("ALL");
  const [regionFilter, setRegionFilter] = useState<Region | "ALL">("ALL");

  const [createOpen, setCreateOpen] = useState(false);

  const fetchLessons = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        size: String(PAGE_SIZE),
      });
      const res = await fetch(`${API_BASE}/api/v1/lessons?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`API 오류: ${res.status} ${res.statusText}`);
      }
      const json: LessonPageResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons(page);
  }, [page, fetchLessons]);

  const filteredContent = (data?.content ?? []).filter((lesson) => {
    if (genreFilter !== "ALL" && lesson.genre !== genreFilter) return false;
    if (regionFilter !== "ALL" && lesson.region !== regionFilter) return false;
    return true;
  });

  const handleSearch = () => {
    setPage(0);
    fetchLessons(0);
  };

  const handleCreateSuccess = () => {
    setPage(0);
    fetchLessons(0);
  };

  const totalPages = data?.totalPages ?? 1;

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

      {/* 검색 필터 */}
      <div className="flex items-center gap-3">
        <Select
          value={genreFilter}
          onValueChange={(v) => setGenreFilter(v as Genre | "ALL")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="장르" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 장르</SelectItem>
            <SelectItem value="Salsa">Salsa</SelectItem>
            <SelectItem value="Bachata">Bachata</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={regionFilter}
          onValueChange={(v) => setRegionFilter(v as Region | "ALL")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="지역" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 지역</SelectItem>
            <SelectItem value="Gangnam">Gangnam</SelectItem>
            <SelectItem value="Hongdae">Hongdae</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleSearch}>
          검색
        </Button>
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
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-28">장르</TableHead>
                  <TableHead className="w-28">지역</TableHead>
                  <TableHead className="w-28">강사(Lo)</TableHead>
                  <TableHead className="w-28">강사(La)</TableHead>
                  <TableHead className="w-40">시작일시</TableHead>
                  <TableHead className="w-40">종료일시</TableHead>
                  <TableHead className="w-32 text-right">수강료</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground text-sm"
                    >
                      표시할 레슨이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContent.map((lesson: Lesson) => (
                    <TableRow key={lesson.no}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {lesson.no}
                      </TableCell>
                      <TableCell className="font-medium">{lesson.title}</TableCell>
                      <TableCell>
                        <GenreBadge genre={lesson.genre} />
                      </TableCell>
                      <TableCell>
                        <RegionBadge region={lesson.region} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {lesson.instructorLo ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lesson.instructorLa ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {formatDateTime(lesson.startDateTime)}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {formatDateTime(lesson.endDateTime)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatPrice(lesson.price)}
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
