import { checkFeatureAccess } from '@/lib/features/server';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import SupportDashboard from '@/features/support-chat/pages/admin/SupportDashboard';

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);
  
  // Check if user is admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }
  
  // Check if support chat feature is enabled
  const hasAccess = await checkFeatureAccess('support_chat');
  
  if (!hasAccess) {
    redirect('/feature-disabled?feature=support_chat');
  }

  return <SupportDashboard />;
}

export const metadata = {
  title: 'Support Dashboard - Admin',
  description: 'Manage customer support conversations and requests',
};