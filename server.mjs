import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { normalizeHtmlAssetPaths } from "./html-assets.mjs";

const root = path.resolve(process.cwd(), process.env.SITE_ROOT || ".");
const port = Number(process.env.PORT || 3000);
const languageRoutes = new Set(["zh-TW", "en", "ja"]);
const pageRouteFiles = new Map([
  ["early-bird", "early-bird.html"],
  ["tgs2026", "tgs2026.html"]
]);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".zip": "application/zip"
};

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const relativePath = pathname === "/"
    ? "index.html"
    : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  return filePath === root || filePath.startsWith(`${root}${path.sep}`) ? filePath : null;
}

function getSourcePageFile(url) {
  const routeName = decodeURIComponent(new URL(url, "http://localhost").pathname).replace(/^\/+|\/+$/g, "");
  const routeParts = routeName.split("/").filter(Boolean);
  if (languageRoutes.has(routeName)) return "index.html";
  if (pageRouteFiles.has(routeName)) return pageRouteFiles.get(routeName);
  if (routeParts.length === 2 && languageRoutes.has(routeParts[0])) return pageRouteFiles.get(routeParts[1]);
  return null;
}

createServer(async (request, response) => {
  try {
    let filePath = resolveRequestPath(request.url || "/");
    if (!filePath) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch (error) {
      const sourcePageFile = getSourcePageFile(request.url || "/");
      if (error?.code === "ENOENT" && sourcePageFile) {
        filePath = path.join(root, sourcePageFile);
        fileStat = await stat(filePath);
      } else {
        throw error;
      }
    }
    if (fileStat.isDirectory()) filePath = path.join(filePath, "index.html");
    const extension = path.extname(filePath).toLowerCase();
    let body = await readFile(filePath);
    if (extension === ".html") body = Buffer.from(normalizeHtmlAssetPaths(body.toString("utf8")));
    const contentType = mimeTypes[extension] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(body);
  } catch (error) {
    const statusCode = error?.code === "ENOENT" ? 404 : 500;
    response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(statusCode === 404 ? "Not found" : "Server error");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Mugio website running at http://127.0.0.1:${port}`);
});
