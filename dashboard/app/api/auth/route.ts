import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body?.token?.trim();

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: 'Token must be at least 16 characters (production requires >= 32 bytes).' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
