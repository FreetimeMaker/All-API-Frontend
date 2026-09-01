import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE || "https://free-time.me/api";
const HEALTH_PATH = "/v1/health";
const HEALTH_TIMEOUT = 3000;

export async function GET() {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);
  try {
    const res = await fetch(`${API_BASE}${HEALTH_PATH}`, { signal: controller.signal });
    const json = await res.json().catch(() => null);
    clearTimeout(id);
    return NextResponse.json({ ok: res.ok, status: res.status, body: json });
  } catch (e) {
    clearTimeout(id);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 503 });
  }
}
