interface ChatMessage {
  role: string;
  content: string;
  id?: string;
}

export interface HandoffContext {
  aiChatHistory: ChatMessage[];
  userIntent: string;
  urgency: 'low' | 'normal' | 'high';
  category: 'technical' | 'billing' | 'feature' | 'bug' | 'other';
  summary: string;
  handoffReason: string;
}

// Keywords that trigger support handoff
const HANDOFF_KEYWORDS = [
  // Direct requests
  'speak to human', 'talk to human', 'human support', 'customer service',
  'contact support', 'help desk', 'live agent', 'representative',
  
  // Frustration indicators
  'frustrated', 'angry', 'not working', 'broken', 'fix this',
  'this is ridiculous', 'terrible', 'awful', 'useless',
  
  // Billing/account issues
  'billing', 'payment', 'charge', 'refund', 'cancel subscription',
  'account issue', 'login problem', 'access denied',
  
  // Technical problems
  'bug', 'error', 'crash', 'not responding', 'won\'t load',
  'technical issue', 'system down', 'server error'
];

// Urgent keywords that require immediate attention
const URGENT_KEYWORDS = [
  'urgent', 'emergency', 'critical', 'important', 'asap',
  'immediately', 'right now', 'can\'t access', 'locked out',
  'payment failed', 'security issue', 'hacked', 'unauthorized'
];

export async function detectSupportHandoff(
  messages: ChatMessage[], 
  currentMessage: string
): Promise<{
  shouldHandoff: boolean;
  context?: HandoffContext;
}> {
  const allMessages = [...messages];
  const lowerMessage = currentMessage.toLowerCase();
  
  // Check for explicit handoff requests
  const hasDirectRequest = HANDOFF_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  // Check for frustration patterns
  const frustrationScore = calculateFrustrationScore(allMessages);
  
  // Check for repeated questions (user asking same thing multiple times)
  const hasRepeatedQuestions = detectRepeatedQuestions(allMessages);
  
  // Check for urgent keywords
  const isUrgent = URGENT_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  const shouldHandoff = hasDirectRequest || 
                       frustrationScore > 0.7 || 
                       hasRepeatedQuestions ||
                       isUrgent;
  
  if (!shouldHandoff) {
    return { shouldHandoff: false };
  }
  
  // Create handoff context
  const context: HandoffContext = {
    aiChatHistory: allMessages,
    userIntent: extractUserIntent(currentMessage),
    urgency: isUrgent ? 'high' : frustrationScore > 0.7 ? 'high' : 'normal',
    category: categorizeIssue(currentMessage),
    summary: generateConversationSummary(allMessages, currentMessage),
    handoffReason: getHandoffReason(hasDirectRequest, frustrationScore, hasRepeatedQuestions, isUrgent)
  };
  
  return { shouldHandoff: true, context };
}

function calculateFrustrationScore(messages: ChatMessage[]): number {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return 0;
  
  const frustrationIndicators = [
    'not working', 'doesn\'t work', 'still not', 'tried that',
    'same problem', 'nothing happens', 'frustrated', 'annoying',
    'waste of time', 'give up', 'terrible', 'awful', 'useless'
  ];
  
  let frustrationCount = 0;
  let totalWords = 0;
  
  userMessages.forEach(message => {
    const content = message.content.toLowerCase();
    totalWords += content.split(' ').length;
    
    frustrationIndicators.forEach(indicator => {
      if (content.includes(indicator)) {
        frustrationCount++;
      }
    });
  });
  
  return Math.min(frustrationCount / Math.max(totalWords / 50, 1), 1);
}

function detectRepeatedQuestions(messages: ChatMessage[]): boolean {
  const userMessages = messages.filter(m => m.role === 'user').slice(-4); // Last 4 user messages
  if (userMessages.length < 2) return false;
  
  // Simple similarity check - if user keeps asking about same topic
  const topics = userMessages.map(m => 
    m.content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter((word: string) => word.length > 3)
  );
  
  for (let i = 0; i < topics.length - 1; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const commonWords = topics[i].filter((word: string) => topics[j].includes(word));
      if (commonWords.length >= 2) { // At least 2 common significant words
        return true;
      }
    }
  }
  
  return false;
}

function extractUserIntent(message: string): string {
  // Simple intent extraction based on patterns
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('login') || lowerMessage.includes('sign in')) {
    return 'Login assistance needed';
  }
  if (lowerMessage.includes('payment') || lowerMessage.includes('billing')) {
    return 'Payment or billing support required';
  }
  if (lowerMessage.includes('bug') || lowerMessage.includes('error')) {
    return 'Technical issue reported';
  }
  if (lowerMessage.includes('feature') || lowerMessage.includes('how to')) {
    return 'Feature guidance requested';
  }
  
  return 'General support needed';
}

function categorizeIssue(message: string): HandoffContext['category'] {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('payment') || lowerMessage.includes('billing') || 
      lowerMessage.includes('subscription') || lowerMessage.includes('refund')) {
    return 'billing';
  }
  if (lowerMessage.includes('bug') || lowerMessage.includes('error') || 
      lowerMessage.includes('crash') || lowerMessage.includes('broken')) {
    return 'bug';
  }
  if (lowerMessage.includes('feature') || lowerMessage.includes('how') || 
      lowerMessage.includes('can i') || lowerMessage.includes('is it possible')) {
    return 'feature';
  }
  if (lowerMessage.includes('technical') || lowerMessage.includes('system') || 
      lowerMessage.includes('server') || lowerMessage.includes('connection')) {
    return 'technical';
  }
  
  return 'other';
}

function generateConversationSummary(messages: ChatMessage[], currentMessage: string): string {
  const recentMessages = messages.slice(-6); // Last 6 messages for context
  const userMessages = recentMessages.filter(m => m.role === 'user');
  
  if (userMessages.length === 0) {
    return `User needs help with: ${currentMessage.slice(0, 100)}...`;
  }
  
  const mainTopics = userMessages
    .map(m => m.content)
    .join(' ')
    .toLowerCase()
    .match(/\b(login|payment|billing|error|bug|feature|help|support|issue|problem)\b/g);
  
  const uniqueTopics = Array.from(new Set(mainTopics || []));
  
  return `User discussed: ${uniqueTopics.join(', ') || 'general questions'}. Latest: ${currentMessage.slice(0, 80)}...`;
}

function getHandoffReason(
  hasDirectRequest: boolean, 
  frustrationScore: number, 
  hasRepeatedQuestions: boolean, 
  isUrgent: boolean
): string {
  if (hasDirectRequest) {
    return 'User explicitly requested to speak with a human';
  }
  if (isUrgent) {
    return 'User indicated urgent assistance needed';
  }
  if (frustrationScore > 0.7) {
    return 'User appears frustrated with AI assistance';
  }
  if (hasRepeatedQuestions) {
    return 'User asking repeated questions, may need human clarification';
  }
  return 'AI determined human assistance would be beneficial';
}