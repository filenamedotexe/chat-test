import { checkFeatureAccess } from '@/lib/features/server';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import ConversationManagement from '@/features/support-chat/pages/admin/ConversationManagement';

interface AdminConversationRouteProps {
  params: {
    id: string;
  };
}

export default async function AdminConversationRoute({ params }: AdminConversationRouteProps) {
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

  // Validate conversation ID is a number
  const conversationId = parseInt(params.id);
  if (isNaN(conversationId)) {
    redirect('/admin/support');
  }

  return <ConversationManagement params={{ id: params.id }} />;
}

export async function generateMetadata({ params }: AdminConversationRouteProps) {
  return {
    title: `Admin - Support Conversation #${params.id}`,
    description: 'Admin conversation management and controls',
  };
}