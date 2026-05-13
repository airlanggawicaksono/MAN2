import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ts = new Date().toISOString();
    console.log(`[DIAG ${ts}] ${JSON.stringify(body)}`);
  } catch (err) {
    console.log(`[DIAG] parse error: ${String(err)}`);
  }
  return NextResponse.json({ ok: true });
}
