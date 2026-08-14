import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { normalizeHtmlAssetPaths } from "./html-assets.mjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.join(projectRoot, "dist");
const sourceScript = await readFile(path.join(projectRoot, "script.js"), "utf8");
const sourcePages = {
  home: {
    html: await readFile(path.join(projectRoot, "index.html"), "utf8"),
    routeSuffix: "",
    metaPrefix: "meta",
    xDefaultLocale: "zh-TW"
  },
  earlyBird: {
    html: await readFile(path.join(projectRoot, "early-bird.html"), "utf8"),
    routeSuffix: "/early-bird",
    metaPrefix: "early.meta",
    xDefaultLocale: "zh-TW"
  },
  tgs2026: {
    html: await readFile(path.join(projectRoot, "tgs2026.html"), "utf8"),
    routeSuffix: "/tgs2026",
    metaPrefix: "tgs.meta",
    xDefaultLocale: "ja"
  },
  privacy: {
    html: await readFile(path.join(projectRoot, "privacy.html"), "utf8"),
    routeSuffix: "/privacy",
    metaPrefix: "privacy.meta",
    xDefaultLocale: "zh-TW"
  }
};

const translationMatch = sourceScript.match(/const translations = (\{[\s\S]*?\n\});\n\nconst languageConfig/);
if (!translationMatch) throw new Error("Could not read translations from script.js");
const translations = vm.runInNewContext(`(${translationMatch[1]})`);

const referenceTranslationKeys = Object.keys(translations["zh-TW"]);
for (const [locale, dictionary] of Object.entries(translations)) {
  const missingKeys = referenceTranslationKeys.filter((key) => !Object.hasOwn(dictionary, key));
  const extraKeys = Object.keys(dictionary).filter((key) => !Object.hasOwn(translations["zh-TW"], key));
  if (missingKeys.length || extraKeys.length) {
    throw new Error(`Translation key mismatch for ${locale}. Missing: ${missingKeys.join(", ") || "none"}. Extra: ${extraKeys.join(", ") || "none"}.`);
  }
}

const locales = {
  "zh-TW": { htmlLang: "zh-Hant", route: "/zh-TW", ogLocale: "zh_TW" },
  en: { htmlLang: "en", route: "/en", ogLocale: "en_US" },
  ja: { htmlLang: "ja", route: "/ja", ogLocale: "ja_JP" }
};

const configuredHost = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://www.mugio.studio";
const siteOrigin = (configuredHost.startsWith("http") ? configuredHost : `https://${configuredHost}`).replace(/\/$/, "");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function replaceElementText(html, key, value) {
  const marker = `data-i18n="${key}"`;
  let cursor = 0;
  while (true) {
    const markerIndex = html.indexOf(marker, cursor);
    if (markerIndex === -1) return html;
    const openStart = html.lastIndexOf("<", markerIndex);
    const openEnd = html.indexOf(">", markerIndex);
    const tagMatch = html.slice(openStart, openEnd + 1).match(/^<([a-zA-Z0-9-]+)/);
    if (!tagMatch) throw new Error(`Could not identify element for ${key}`);
    const closeTag = `</${tagMatch[1]}>`;
    const closeStart = html.indexOf(closeTag, openEnd + 1);
    if (closeStart === -1) throw new Error(`Could not close element for ${key}`);
    const replacement = escapeHtml(value);
    html = `${html.slice(0, openEnd + 1)}${replacement}${html.slice(closeStart)}`;
    cursor = openEnd + replacement.length + closeTag.length;
  }
}

function replaceTranslatedAttribute(html, attribute, key, value) {
  const marker = `data-i18n-${attribute}="${key}"`;
  let cursor = 0;
  while (true) {
    const markerIndex = html.indexOf(marker, cursor);
    if (markerIndex === -1) return html;
    const openStart = html.lastIndexOf("<", markerIndex);
    const openEnd = html.indexOf(">", markerIndex);
    const openingTag = html.slice(openStart, openEnd + 1);
    const translated = openingTag.replace(
      new RegExp(`${attribute}="[^"]*"`),
      `${attribute}="${escapeHtml(value)}"`
    );
    html = `${html.slice(0, openStart)}${translated}${html.slice(openEnd + 1)}`;
    cursor = openStart + translated.length;
  }
}

function renderLocale(locale, page) {
  const config = locales[locale];
  const dictionary = translations[locale];
  const pageConfig = sourcePages[page];
  const routePath = `${config.route}${pageConfig.routeSuffix}`;
  const canonicalUrl = `${siteOrigin}${routePath}`;
  const pageTitle = dictionary[`${pageConfig.metaPrefix}.title`];
  const pageDescription = dictionary[`${pageConfig.metaPrefix}.description`];
  let html = pageConfig.html;

  for (const [key, value] of Object.entries(dictionary)) {
    html = replaceElementText(html, key, value);
    html = replaceTranslatedAttribute(html, "aria-label", key, value);
    html = replaceTranslatedAttribute(html, "alt", key, value);
    html = replaceTranslatedAttribute(html, "placeholder", key, value);
  }

  html = html
    .replace(/<html lang="[^"]*">/, `<html lang="${config.htmlLang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(" \/>)/, `$1${escapeHtml(pageDescription)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(" \/>)/, `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(" \/>)/, `$1${escapeHtml(pageDescription)}$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(" data-og-locale \/>)/, `$1${config.ogLocale}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(" data-og-url \/>)/, `$1${canonicalUrl}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(" data-canonical \/>)/, `$1${canonicalUrl}$2`)
    .replace(/rel="alternate" hreflang="zh-Hant" href="[^"]*"/, `rel="alternate" hreflang="zh-Hant" href="${siteOrigin}/zh-TW${pageConfig.routeSuffix}"`)
    .replace(/rel="alternate" hreflang="en" href="[^"]*"/, `rel="alternate" hreflang="en" href="${siteOrigin}/en${pageConfig.routeSuffix}"`)
    .replace(/rel="alternate" hreflang="ja" href="[^"]*"/, `rel="alternate" hreflang="ja" href="${siteOrigin}/ja${pageConfig.routeSuffix}"`)
    .replace(/rel="alternate" hreflang="x-default" href="[^"]*"/, `rel="alternate" hreflang="x-default" href="${siteOrigin}${locales[pageConfig.xDefaultLocale].route}${pageConfig.routeSuffix}"`)
    .replace(/href="\/zh-TW(?:\/(?:early-bird|tgs2026|privacy))?" lang="zh-Hant" hreflang="zh-Hant" data-lang="zh-TW"(?: aria-current="page")?/, `href="/zh-TW${pageConfig.routeSuffix}" lang="zh-Hant" hreflang="zh-Hant" data-lang="zh-TW"${locale === "zh-TW" ? ' aria-current="page"' : ""}`)
    .replace(/href="\/en(?:\/(?:early-bird|tgs2026|privacy))?" lang="en" hreflang="en" data-lang="en"(?: aria-current="page")?/, `href="/en${pageConfig.routeSuffix}" lang="en" hreflang="en" data-lang="en"${locale === "en" ? ' aria-current="page"' : ""}`)
    .replace(/href="\/ja(?:\/(?:early-bird|tgs2026|privacy))?" lang="ja" hreflang="ja" data-lang="ja"(?: aria-current="page")?/, `href="/ja${pageConfig.routeSuffix}" lang="ja" hreflang="ja" data-lang="ja"${locale === "ja" ? ' aria-current="page"' : ""}`)
    .replaceAll('href="/zh-TW" data-home-link', `href="${config.route}" data-home-link`)
    .replaceAll('href="/zh-TW/early-bird" data-page-link="early-bird"', `href="${config.route}/early-bird" data-page-link="early-bird"`)
    .replaceAll('href="/zh-TW/privacy" data-page-link="privacy"', `href="${config.route}/privacy" data-page-link="privacy"`);

  return normalizeHtmlAssetPaths(html);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const locale of Object.keys(locales)) {
  const localeDir = path.join(outputRoot, locale);
  for (const [page, pageConfig] of Object.entries(sourcePages)) {
    const pageDir = pageConfig.routeSuffix
      ? path.join(localeDir, ...pageConfig.routeSuffix.split("/").filter(Boolean))
      : localeDir;
    await mkdir(pageDir, { recursive: true });
    await writeFile(path.join(pageDir, "index.html"), renderLocale(locale, page), "utf8");
  }
}

for (const [page, pageConfig] of Object.entries(sourcePages)) {
  const aliasDir = pageConfig.routeSuffix
    ? path.join(outputRoot, ...pageConfig.routeSuffix.split("/").filter(Boolean))
    : outputRoot;
  await mkdir(aliasDir, { recursive: true });
  await writeFile(path.join(aliasDir, "index.html"), renderLocale(pageConfig.xDefaultLocale, page), "utf8");
}

const sitemapUrls = Object.values(locales).flatMap((locale) =>
  Object.values(sourcePages).map((page) => `${siteOrigin}${locale.route}${page.routeSuffix}`)
);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapUrls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`),
  '</urlset>',
  ''
].join("\n");
await writeFile(path.join(outputRoot, "sitemap.xml"), sitemap, "utf8");

await cp(path.join(projectRoot, "assets"), path.join(outputRoot, "assets"), { recursive: true });
for (const file of ["styles.css", "script.js", "manifest.webmanifest", "robots.txt"]) {
  await cp(path.join(projectRoot, file), path.join(outputRoot, file));
}

console.log("Built static language routes and sitemap for /zh-TW, /en, /ja with /early-bird, /tgs2026, and /privacy pages");
