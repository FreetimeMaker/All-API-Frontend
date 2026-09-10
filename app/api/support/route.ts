import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSupportNotification } from "@/lib/email/provider";

interface SupportRequestBody {
  subject?: unknown;
  category?: unknown;
  message?: unknown;
}

const MAX_SUBJECT_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 10_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SupportRequestBody;
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "General";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
    }

    if (subject.length > MAX_SUBJECT_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "The support request is too long." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const normalizedSubject = subject || "Support request";
    const normalizedCategory = category || "General";

    const { error: insertError } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      email: user.email,
      subject: normalizedSubject,
      category: normalizedCategory,
      message,
    });

    if (insertError) {
      console.error("Support ticket insert failed:", insertError);
      return NextResponse.json(
        { error: "There was a problem submitting your request." },
        { status: 500 }
      );
    }

    try {
      await sendSupportNotification({
        email: user.email,
        subject: normalizedSubject,
        category: normalizedCategory,
        message,
        userId: user.id,
      });
    } catch (emailError) {
      console.error("Support notification email failed:", emailError);
      return NextResponse.json(
        {
          error: "Your request was saved, but the email notification could not be sent.",
          saved: true,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, saved: true, notificationSent: true });
  } catch (error) {
    console.error("Support API error:", error);
    return NextResponse.json({ error: "Invalid support request." }, { status: 400 });
  }
}
