import { checkFeatureAccess } from '@/lib/features/server';
import { redirect } from 'next/navigation';
import ConversationPage from '@/features/support-chat/pages/user/ConversationPage';

interface ConversationRouteProps {
  params: {
    id: string;
  };
}

export default async function ConversationRoute({ params }: ConversationRouteProps) {
  // Check if support chat feature is enabled
  const hasAccess = await checkFeatureAccess('support_chat');
  
  if (!hasAccess) {
    redirect('/feature-disabled?feature=support_chat');
  }

  // Validate conversation ID is a number
  const conversationId = parseInt(params.id);
  if (isNaN(conversationId)) {
    redirect('/support');
  }

  return <ConversationPage params={{ id: params.id }} />;
}

export async function generateMetadata({ params }: ConversationRouteProps) {
  return {
    title: `Support Conversation #${params.id}`,
    description: 'Support conversation details and messages',
  };
}