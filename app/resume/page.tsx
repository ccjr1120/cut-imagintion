import type { Metadata } from 'next';
import { ResumePage, type ResumeRole } from '@/components/ResumePage';
import { readContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: '简历 | 古梦雪', description: '古梦雪的信息流剪辑师与剪辑助理岗位简历' };

function parseRole(value: string | string[] | undefined): ResumeRole {
  if (value === 'editing-assistant' || value === 'video-editor') return value;
  return 'video-editor';
}

export default async function ResumeRoute({ searchParams }: { searchParams: Promise<{ role?: string | string[] }> }) {
  const params = await searchParams;
  return <ResumePage content={await readContent()} initialRole={parseRole(params.role)} />;
}
