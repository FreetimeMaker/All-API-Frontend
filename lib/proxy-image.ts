const API_ORIGIN = "https://api.free-time.me";

export function proxyImageUrl(url: string): string {
  if (!url) return "";

  // We use the proxy to bypass restrictive 'Cross-Origin-Resource-Policy: same-origin' headers
  // sent by the upstream API, which would otherwise prevent images from displaying.
  if (url.startsWith(`${API_ORIGIN}/`)) {
    return url.replace(`${API_ORIGIN}/`, "/api/proxy/");
  }

  return url;
}
