import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.role === 'ADMIN') {
      redirect('/admin');
    } else {
      redirect('/payment');
    }
  } catch (err) {
    redirect('/login');
  }
}
