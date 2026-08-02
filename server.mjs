import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd(), process.env.SITE_ROOT || ".");
const port = Number(process.env.PORT || 3000);
const languageRoutes = new Set(["zh-TW", "en", "ja"]);
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
  const routeName = pathname.replace(/^\/+|\/+$/g, "");
  const relativePath = pathname === "/"
    ? "index.html"
    : languageRoutes.has(routeName)
      ? path.join(routeName, "index.html")
      : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  return filePath === root || filePath.startsWith(`${root}${path.sep}`) ? filePath : null;
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
      const routeName = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname).replace(/^\/+|\/+$/g, "");
      if (error?.code === "ENOENT" && languageRoutes.has(routeName)) {
        filePath = path.join(root, "index.html");
        fileStat = await stat(filePath);
      } else {
        throw error;
      }
    }
    if (fileStat.isDirectory()) filePath = path.join(filePath, "index.html");
    const body = await readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
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
