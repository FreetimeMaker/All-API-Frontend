import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@base-org/account";

const USE_TESTNET = process.env.NEXT_PUBLIC_BASE_TESTNET !== "false";

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const { status, sender, amount, recipient } = await getPaymentStatus({
      id: paymentId,
      testnet: USE_TESTNET,
    });

    return NextResponse.json({
      status,
      sender,
      amount,
      recipient,
      verified: status === "completed",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
