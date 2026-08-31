import { NextResponse } from 'next/server';
import { adminPassword, createSession, passwordMatches, sessionCookie, sessionMaxAge } from '@/lib/auth';

export async function POST(request: Request) {
  if (!adminPassword()) {
    return NextResponse.json({ error: '管理员密码尚未配置' }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  if (!body || typeof body.password !== 'string' || !passwordMatches(body.password)) {
    return NextResponse.json({ error: '密码不正确' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie, createSession(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAge,
  });
  return response;
}
