export type Genre = "Salsa" | "Bachata";
export type Region = "Gangnam" | "Hongdae";

export interface Lesson {
  no: number;
  title: string;
  genre: Genre;
  region: Region;
  instructorLo: string | null;
  instructorLa: string | null;
  startDateTime: string;
  endDateTime: string;
  price: number;
}

export interface LessonPageResponse {
  content: Lesson[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
