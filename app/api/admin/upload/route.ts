import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { mediaDirectory } from '@/lib/store';

export const runtime = 'nodejs';

const allowed = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
  ['video/quicktime', '.mov'],
]);

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    const extension = allowed.get(file.type);
    if (!extension) return NextResponse.json({ error: '仅支持 JPG、PNG、WebP、GIF、MP4、WebM 和 MOV' }, { status: 415 });
    if (file.size > 250 * 1024 * 1024) return NextResponse.json({ error: '单个文件不能超过 250MB' }, { status: 413 });
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    await mkdir(mediaDirectory, { recursive: true });
    await writeFile(path.join(mediaDirectory, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/api/media/${filename}`, name: file.name });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '上传失败' }, { status: 500 });
  }
}
