export async function revalidatePaths(paths: string[], tags?: string[]): Promise<void> {
  const secret = process.env.REVALIDATION_SECRET || "";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (!secret) return;

  try {
    const res = await fetch(`${frontendUrl}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, paths, tags }),
    });

    if (!res.ok) {
      console.warn(`[revalidate] Failed (${res.status}) for paths:`, paths, "tags:", tags);
    } else {
      console.log(`[revalidate] Purged paths:`, paths, "tags:", tags);
    }
  } catch (err) {
    console.warn(`[revalidate] Error:`, (err as Error).message);
  }
}
