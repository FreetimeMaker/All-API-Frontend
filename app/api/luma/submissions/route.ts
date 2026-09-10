import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendLumaSubmissionStatusNotification } from "@/lib/email/provider";

interface SubmissionRequestBody {
  name?: unknown;
  description?: unknown;
  link?: unknown;
  category?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmissionRequestBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const link = typeof body.link === "string" ? body.link.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "Productivity";

    if (!name || !description || !link) {
      return NextResponse.json({ error: "Name, description and repository URL are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("luma_submissions")
      .insert({
        user_id: user.id,
        name,
        description,
        link,
        category,
        status: "Pending",
        submitted_at: new Date().toISOString(),
      })
      .select("id,name,description,link,category,status,submitted_at,review_message,status_updated_at,approved_at,rejected_at")
      .single();

    if (error) {
      console.error("Luma submission insert failed:", error);
      return NextResponse.json({ error: "Failed to save submission." }, { status: 500 });
    }

    try {
      await sendLumaSubmissionStatusNotification({
        email: user.email,
        developerName: user.user_metadata?.full_name || user.user_metadata?.name || null,
        appName: name,
        status: "Pending",
      });
    } catch (emailError) {
      console.error("Submission confirmation email failed:", emailError);
    }

    return NextResponse.json({ ok: true, submission: data });
  } catch (error) {
    console.error("Luma submission API error:", error);
    return NextResponse.json({ error: "Invalid submission request." }, { status: 400 });
  }
}
