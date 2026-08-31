import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { readContent, writeContent } from '@/lib/store';

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  return NextResponse.json(await readContent(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  try {
    const content = await writeContent(await request.json());
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存失败' },
      { status: 400 },
    );
  }
}
