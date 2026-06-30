import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, paths, tags } = body;

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const hasPaths = Array.isArray(paths) && paths.length > 0;
  const hasTags = Array.isArray(tags) && tags.length > 0;

  if (!hasPaths && !hasTags) {
    return NextResponse.json({ error: "paths or tags must be a non-empty array" }, { status: 400 });
  }

  if (hasPaths) {
    for (const path of paths) {
      revalidatePath(path);
    }
  }

  if (hasTags) {
    for (const tag of tags) {
      revalidateTag(tag, { expire: 0 });
    }
  }

  return NextResponse.json({ revalidated: true, paths: paths || [], tags: tags || [] });
}
