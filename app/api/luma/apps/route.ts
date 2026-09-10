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
  user_id: string;
  name: string;
  description: string;
  link: string | null;
  category: string | null;
  status: string;
  submitted_at: string;
  icon_url: string | null;
  version: string | null;
  platform: string | null;
}

interface PublicDeveloperInfo {
  name: string;
  avatarUrl: string | null;
  provider: string | null;
}

function getDeveloperName(metadata: Record<string, unknown>): string {
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.user_name,
    metadata.preferred_username,
  ];

  return candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim()
    ?? "Luma Developer";
}

function getDeveloperAvatar(metadata: Record<string, unknown>): string | null {
  const candidates = [metadata.avatar_url, metadata.picture];
  return candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim()
    ?? null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("luma_submissions")
      .select("id,user_id,name,description,link,category,status,submitted_at,icon_url,version,platform")
      .eq("status", "Approved")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Failed to load approved Luma submissions:", error);
      return NextResponse.json(
        { error: "Failed to load approved apps." },
        { status: 500, headers: corsHeaders }
      );
    }

    const submissions = (data ?? []) as LumaSubmissionRow[];
    const uniqueUserIds = [...new Set(submissions.map((app) => app.user_id).filter(Boolean))];
    const developers = new Map<string, PublicDeveloperInfo>();

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

        if (userError || !userData.user) {
          console.warn(`Could not load public developer info for ${userId}:`, userError);
          developers.set(userId, {
            name: "Luma Developer",
            avatarUrl: null,
            provider: null,
          });
          return;
        }

        const metadata = (userData.user.user_metadata ?? {}) as Record<string, unknown>;
        developers.set(userId, {
          name: getDeveloperName(metadata),
          avatarUrl: getDeveloperAvatar(metadata),
          provider: typeof userData.user.app_metadata?.provider === "string"
            ? userData.user.app_metadata.provider
            : null,
        });
      })
    );

    const apps = submissions.map((app) => ({
      id: app.id,
      name: app.name,
      summary: app.description.length > 140 ? `${app.description.slice(0, 137)}...` : app.description,
      description: app.description,
      repositoryUrl: app.link,
      iconUrl: app.icon_url,
      version: app.version,
      platform: app.platform,
      categories: app.category ? [app.category] : [],
      category: app.category,
      status: "Approved",
      approved: true,
      installable: false,
      submittedAt: app.submitted_at,
      developer: developers.get(app.user_id) ?? {
        name: "Luma Developer",
        avatarUrl: null,
        provider: null,
      },
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
