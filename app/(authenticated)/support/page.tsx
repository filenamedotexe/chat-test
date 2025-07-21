import { checkFeatureAccess } from '@/lib/features/server';
import { redirect } from 'next/navigation';
import ConversationsPage from '@/features/support-chat/pages/user/ConversationsPage';

export default async function SupportPage() {
  // Check if support chat feature is enabled
  const hasAccess = await checkFeatureAccess('support_chat');
  
  if (!hasAccess) {
    redirect('/feature-disabled?feature=support_chat');
  }

  return <ConversationsPage />;
}

export const metadata = {
  title: 'Support - Chat with our team',
  description: 'Get help from our support team through direct messaging',
};