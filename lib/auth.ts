import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const sessionCookie = 'portfolio_admin_session';
const sessionDuration = 60 * 60 * 12;

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV !== 'production') return 'local-development-session-secret';
  throw new Error('生产环境缺少 SESSION_SECRET');
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function adminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV !== 'production' ? 'admin' : null;
}

export function passwordMatches(value: string) {
  const expected = adminPassword();
  if (!expected) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSession() {
  const expires = Math.floor(Date.now() / 1000) + sessionDuration;
  const payload = String(expires);
  return `${payload}.${signature(payload)}`;
}

export function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(sessionCookie)?.value;
  if (!token) return false;
  const [expires, supplied] = token.split('.');
  if (!expires || !supplied || Number(expires) < Date.now() / 1000) return false;
  const expected = signature(expires);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const sessionMaxAge = sessionDuration;
