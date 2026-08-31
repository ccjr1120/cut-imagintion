import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/AdminDashboard';
import './admin.css';

export const metadata: Metadata = { title: '内容管理 | 古梦雪' };

export default function AdminPage() {
  return <AdminDashboard />;
}
