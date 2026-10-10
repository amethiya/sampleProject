/** Content-Security-Policy headers for redesign previews (the Worker serves them; the QA server reproduces them). */
export const TEMPLATE_CSP =
  "default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: http: data: blob:; frame-src https://www.openstreetmap.org; frame-ancestors 'self'; base-uri 'none'; form-action 'none'";
// Claude-written pages run in a sandbox with an opaque origin: they can't read cookies or call the API as the user.
export const AI_CSP =
  "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox; default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: http: data: blob:; frame-src https://www.openstreetmap.org; connect-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'";
