"use client";

import { Suspense, useState } from "react";
import ProfileFilter from "./ProfileFilter";
import ProfileCreateButton from "./ProfileCreateButton";
import ProfileList from "./ProfileList";

type Props = { isInstructor?: string };

export default function ProfilesPanel({ isInstructor }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Suspense>
          <ProfileFilter />
        </Suspense>
        <ProfileCreateButton onSuccess={() => setRefreshKey((k) => k + 1)} />
      </div>
      <ProfileList isInstructor={isInstructor} refreshKey={refreshKey} />
    </div>
  );
}
