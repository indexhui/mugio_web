export function normalizeHtmlAssetPaths(html) {
  return html
    .replaceAll('="assets/', '="/assets/')
    .replace('href="styles.css"', 'href="/styles.css"')
    .replace('href="manifest.webmanifest"', 'href="/manifest.webmanifest"')
    .replace('src="script.js"', 'src="/script.js"');
}
