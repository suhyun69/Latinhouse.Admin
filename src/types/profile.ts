// ---- 응답 enum 값 (백엔드 enum name 그대로 반환) ----
export type Sex = "M" | "F";

// ---- 단건/목록 공통 응답 (ProfileWebResponse) ----
export interface ProfileResponse {
  profileId: string;
  nickname: string;
  sex: Sex;
  isInstructor: boolean;
}

// ---- 목록 페이지 응답 (PagedProfileWebResponse) ----
export interface PagedProfileResponse {
  content: ProfileResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ---- 생성 요청 ----
export interface ProfileCreateRequest {
  nickname: string;
  sex: Sex;
  isInstructor?: boolean;
}

// ---- 수정 요청 (nickname, sex 만 수정 가능) ----
export interface ProfileUpdateRequest {
  nickname: string;
  sex: Sex;
}

// ---- 목록 필터 ----
export interface ProfileListFilter {
  nickname: string;
  sex: Sex | "";
  isInstructor: "true" | "false" | "";
}
