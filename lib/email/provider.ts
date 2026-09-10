export interface SupportNotification {
  email: string;
  subject: string;
  category: string;
  message: string;
  userId: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendSupportNotification(notification: SupportNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_NOTIFICATION_TO || "FreetimeMaker@proton.me";

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and EMAIL_FROM must be configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: notification.email,
      subject: `[Luma Support] ${notification.category}: ${notification.subject}`,
      text: [
        `New support message from ${notification.email}`,
        `User ID: ${notification.userId}`,
        `Category: ${notification.category}`,
        `Subject: ${notification.subject}`,
        "",
        notification.message,
      ].join("\n"),
      html: `
        <h2>New Luma support message</h2>
        <p><strong>From:</strong> ${escapeHtml(notification.email)}</p>
        <p><strong>User ID:</strong> ${escapeHtml(notification.userId)}</p>
        <p><strong>Category:</strong> ${escapeHtml(notification.category)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(notification.subject)}</p>
        <hr />
        <p style="white-space: pre-wrap">${escapeHtml(notification.message)}</p>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend failed with HTTP ${response.status}: ${details}`);
  }

  return response.json();
}
