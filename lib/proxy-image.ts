const API_ORIGIN = "https://api-data-xi.vercel.app";

export function proxyImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith(`${API_ORIGIN}/`)) {
    return url.replace(`${API_ORIGIN}/`, "/api/proxy/");
  }
  return url;
}