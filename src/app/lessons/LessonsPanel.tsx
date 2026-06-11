"use client";

import { Suspense, useState } from "react";
import LessonFilter from "./LessonFilter";
import LessonCreateButton from "./LessonCreateButton";
import LessonList from "./LessonList";

type Props = { region?: string; genre?: string };

export default function LessonsPanel({ region, genre }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Suspense>
          <LessonFilter />
        </Suspense>
        <LessonCreateButton onSuccess={() => setRefreshKey((k) => k + 1)} />
      </div>
      <LessonList region={region} genre={genre} refreshKey={refreshKey} />
    </div>
  );
}
