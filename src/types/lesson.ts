// ---- 응답 enum 값 (백엔드 enum name 그대로 반환) ----
export type Genre = "Salsa" | "Bachata";
export type Region = "Gangnam" | "Hongdae";
export type DiscountType = "Earlybird" | "Sex";
export type ContactType = "Phone" | "Kakaotalk" | "Instagram" | "Youtube" | "Web";

// ---- 요청 코드 값 ----
export type GenreCode = "S" | "B";
export type RegionCode = "GN" | "HD";
export type DiscountTypeCode = "E" | "S";
export type ContactTypeCode = "P" | "K" | "I" | "Y" | "W";
export type LessonStatus = "stand_by" | "in_progress" | "done";

// ---- LessonOptionWebResponse (목록/단건 응답 공통) ----
export interface LessonOptionResponse {
  no: number;
  startDateTime: string;
  endDateTime: string;
  dateTimeSubTexts: string[];
  region: Region;
  place: string | null;
  placeUrl: string | null;
  status: LessonStatus;
}

// ---- 목록 응답 항목 (LessonWebResponse) ----
// maxDiscountAmount, discountSubTexts, bank, accountNumber, accountOwner, discounts, contacts 미포함
export interface LessonSummary {
  no: number;
  title: string;
  genre: Genre;
  instructorLo: string | null;
  instructorLa: string | null;
  options: LessonOptionResponse[];
  price: number;
}

// ---- 단건/등록/수정 상세 응답 (LessonDetailWebResponse) ----
export interface LessonDetail {
  no: number;
  title: string;
  genre: Genre;
  instructorLo: string | null;
  instructorLa: string | null;
  options: LessonOptionResponse[];
  price: number;
  maxDiscountAmount: number | null;
  discountSubTexts: string[];
  bank: string | null;
  accountNumber: string | null;
  accountOwner: string | null;
  discounts: {
    id: number;
    type: DiscountType;
    condition: string | null;
    amount: number;
  }[];
  contacts: {
    id: number;
    type: ContactType;
    name: string | null;
    address: string;
  }[];
}

// ---- 목록 페이지 응답 ----
export interface LessonPageResponse {
  content: LessonSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ---- 목록 필터 ----
export interface LessonListFilter {
  genre: GenreCode | "";
  region: RegionCode | "";
  instructor: string;
  status: LessonStatus | "";
}

// ---- 등록 요청 옵션 항목 ----
export interface LessonOptionCreateRequest {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  dateTimeSubTexts: string[];
  region: RegionCode | "";
  place: string;
  placeUrl: string;
}

// ---- 수정 요청 옵션 항목 (no 포함 가능) ----
export interface LessonOptionUpdateRequest extends LessonOptionCreateRequest {
  no: number | null;
}

// ---- 등록 요청 할인 항목 ----
export interface DiscountCreateRequest {
  type: DiscountTypeCode;
  condition: string | null;
  amount: number;
}

// ---- 등록 요청 연락처 항목 ----
export interface ContactCreateRequest {
  type: ContactTypeCode;
  name: string | null;
  address: string;
}
