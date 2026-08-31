import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '古梦雪 | 视频剪辑师',
  description: '古梦雪的视频剪辑作品集',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
