import { Portfolio } from '@/components/Portfolio';
import { readContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return <Portfolio content={await readContent()} />;
}
