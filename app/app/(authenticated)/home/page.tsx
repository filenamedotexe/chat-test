import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the new unified dashboard
  redirect('/dashboard');
}