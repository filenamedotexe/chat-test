import { getServerSession } from 'next-auth';
import { authOptions } from '@chat/auth';
import { redirect } from 'next/navigation';
import { SettingsClient } from './components/SettingsClient';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return <SettingsClient />;
}