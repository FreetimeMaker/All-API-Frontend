const API_ORIGIN = "https://https://api.free-time.me";

export function proxyImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith(`${API_ORIGIN}/`)) {
    return url.replace(`${API_ORIGIN}/`, "/api/proxy/");
  }
  return url;
}