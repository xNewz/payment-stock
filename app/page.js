import { redirect } from 'next/navigation';
import { verifyAuth } from '@/lib/auth';

export default async function Home() {
  const payload = await verifyAuth();

  if (!payload) {
    redirect('/login');
  }

  if (payload.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/payment');
  }
}
