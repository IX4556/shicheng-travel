/** 生产构建（Nitro）健康检查：/api/health 与 /api/ready。 */
interface HealthEvent {
  url: URL;
  req: { method: string };
}

export default async function healthMiddleware(
  event: HealthEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const path = event.url.pathname;
  if (path !== "/api/health" && path !== "/api/ready") return next();
  if ((event.req.method ?? "GET").toUpperCase() !== "GET") return next();

  try {
    const { getSql, dbSource } = await import("../../src/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{ count: number }>(
      "select count(*)::int as count from immersive_destinations",
    );
    return new Response(
      JSON.stringify({
        ok: true,
        dbSource,
        destinations: Number(rows[0]?.count ?? 0),
      }),
      {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "unavailable",
      }),
      {
        status: 503,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }
}
