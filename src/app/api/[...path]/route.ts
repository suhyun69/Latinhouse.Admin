import { type NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(`/api/${path.join("/")}`, BASE);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const bodyText = hasBody ? await req.text() : undefined;

  const res = await fetch(url.toString(), {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body: bodyText,
  });

  const text = await res.text();
  return new NextResponse(text || null, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET    = proxy;
export const POST   = proxy;
export const PUT    = proxy;
export const PATCH  = proxy;
export const DELETE = proxy;
