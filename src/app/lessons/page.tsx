import LessonsPanel from "./LessonsPanel";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const region = typeof params.region === "string" ? params.region : undefined;
  const genre = typeof params.genre === "string" ? params.genre : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">레슨</h1>
      <LessonsPanel region={region} genre={genre} />
    </div>
  );
}
