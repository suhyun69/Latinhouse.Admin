import ProfilesPanel from "./ProfilesPanel";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isInstructor = typeof params.isInstructor === "string" ? params.isInstructor : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
      <ProfilesPanel isInstructor={isInstructor} />
    </div>
  );
}
