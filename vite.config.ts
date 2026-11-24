import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") await mod.ensureDbReady();
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

function healthPlugin(): Plugin {
  return {
    name: "app-builder:health",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/api/health" && pathOnly !== "/api/ready") return next();
        try {
          const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
            getSql: () => Promise<{ query: <T>(text: string, params?: unknown[]) => Promise<T[]> }>;
            dbSource: string;
          };
          const sql = await mod.getSql();
          const rows = await sql.query<{ count: number }>("select count(*)::int as count from immersive_destinations");
          res.statusCode = 200;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ ok: true, dbSource: mod.dbSource, destinations: Number(rows[0]?.count ?? 0) }));
        } catch (error) {
          res.statusCode = 503;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "unavailable" }));
        }
      });
    },
  };
}

function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          if (rawUrl.split("?", 1)[0] !== "/auth/popup") return next();
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }
          const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080");
          const proto = String(req.headers["x-forwarded-proto"] ?? ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"));
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) for (const v of value) requestHeaders.append(key, v);
            else requestHeaders.set(key, value);
          }
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);
          const request = new Request(`${proto}://${host}${rawUrl}`, { method: "GET", headers: requestHeaders });
          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);
          res.statusCode = response.status;
          const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
          response.headers.forEach((value, key) => { if (key.toLowerCase() !== "set-cookie") res.setHeader(key, value); });
          for (const cookie of setCookies) res.appendHeader("set-cookie", cookie);
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  server: { host: "0.0.0.0", port: 8080, strictPort: true },
  preview: { host: "127.0.0.1", port: 8081, strictPort: true },
  resolve: { tsconfigPaths: true },
  plugins: [
    pgliteBootstrapPlugin(),
    healthPlugin(),
    authPopupPlugin(),
    appEnvPlugin(),
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview ? [nitro({ preset: "vercel", serverDir: "./server" })] : []),
    viteReact(),
  ],
}));
