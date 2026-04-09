import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!process.env.EDITOR_CODE) {
    return NextResponse.json({ error: 'EDITOR_CODE not configured' }, { status: 500 });
  }

  if (code !== process.env.EDITOR_CODE) {
    return NextResponse.json({ error: 'קוד שגוי' }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
