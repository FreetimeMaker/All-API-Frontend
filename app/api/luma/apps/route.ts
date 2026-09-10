import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

interface LumaSubmissionRow {
  id: string;
  name: string;
  description: string;
  link: string | null;
  category: string | null;
  status: string;
  submitted_at: string;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("luma_submissions")
      .select("id,name,description,link,category,status,submitted_at")
      .eq("status", "Approved")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Failed to load approved Luma submissions:", error);
      return NextResponse.json(
        { error: "Failed to load approved apps." },
        { status: 500, headers: corsHeaders }
      );
    }

    const apps = ((data ?? []) as LumaSubmissionRow[]).map((app) => ({
      id: app.id,
      name: app.name,
      summary: app.description.length > 140 ? `${app.description.slice(0, 137)}...` : app.description,
      description: app.description,
      repositoryUrl: app.link,
      categories: app.category ? [app.category] : [],
      category: app.category,
      status: "Approved",
      approved: true,
      installable: false,
      submittedAt: app.submitted_at,
    }));

    return NextResponse.json(
      {
        schemaVersion: 1,
        publishingMode: "manual-review",
        count: apps.length,
        generatedAt: new Date().toISOString(),
        apps,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Luma Store API error:", error);
    return NextResponse.json(
      { error: "Luma Store API is not configured." },
      { status: 500, headers: corsHeaders }
    );
  }
}
