import { NextRequest, NextResponse } from "next/server";
import { createSolanaRpc, address } from "@solana/kit";
import { findReference, validateTransfer } from "@solana/pay";

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export async function POST(req: NextRequest) {
  try {
    const { reference, recipient, amount } = await req.json();

    if (!reference || !recipient || amount === undefined) {
      return NextResponse.json({ error: "reference, recipient, and amount are required" }, { status: 400 });
    }

    const rpc = createSolanaRpc(SOLANA_RPC);
    const ref = address(reference);

    const found = await findReference(rpc, ref);

    await validateTransfer(rpc, found.signature, {
      recipient: address(recipient),
      amount,
    });

    return NextResponse.json({
      verified: true,
      signature: found.signature,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ verified: false, error: msg }, { status: 200 });
  }
}
