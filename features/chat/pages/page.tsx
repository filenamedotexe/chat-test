"use client";

import { useChat } from "ai/react";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import { 
  IconArrowNarrowUp, 
  IconPlayerStopFilled,
  IconSeo,
  IconTerminal2,
  IconBrandMessenger,
  IconAssembly,
  IconHeadset
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessionId] = useState(() => {
    // Generate sessionId only on client to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      // Try to get existing sessionId from localStorage first
      let existingSessionId = localStorage.getItem('chat-session-id');
      
      if (!existingSessionId) {
        // Generate new sessionId and store it
        existingSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chat-session-id', existingSessionId);
        console.log('🆕 Created new persistent session ID:', existingSessionId);
      } else {
        console.log('♻️ Reusing existing session ID:', existingSessionId);
      }
      
      return existingSessionId;
    }
    return 'session-temp';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [handoffSuggested, setHandoffSuggested] = useState<any>(null);
  const [isHandingOff, setIsHandingOff] = useState(false);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
  } = useChat({
    api: "/api/chat-langchain",
    body: {
      memoryType: "buffer",
      sessionId,
      userId: session?.user?.id,
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onResponse: (response) => {
      console.log('Chat response:', response);
    },
    onFinish: (message: any, options?: any) => {
      console.log('🎯 Chat finished:', message);
      console.log('🎯 Options:', options);
      console.log('🎯 Finish reason:', options?.finishReason);
      console.log('🎯 Usage data:', options?.usage);
      
      // Check if handoff was suggested - check multiple possible locations
      const finishReason = options?.finishReason;
      console.log('🎯 Full options object:', JSON.stringify(options, null, 2));
      
      const handoffData = options?.usage?.handoff || 
                         options?.experimental_providerMetadata?.handoff ||
                         options?.handoff ||
                         options?.data?.handoff;
      
      console.log('🎯 Handoff data found:', handoffData);
      
      if (finishReason === 'handoff_suggested') {
        console.log('🎯 Setting handoff suggestion - creating context from current conversation');
        // Since metadata isn't passing through, create handoff context from current conversation
        const simpleHandoffContext = {
          context: {
            aiChatHistory: messages,
            userIntent: 'User requested human support',
            urgency: 'high',
            category: 'other', 
            summary: 'User conversation with AI chat before requesting human support',
            handoffReason: 'User triggered handoff during AI conversation'
          }
        };
        setHandoffSuggested(simpleHandoffContext);
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = [
    {
      icon: <IconSeo className="h-5 w-5 text-purple-500" />,
      title: "SEO Tips",
      prompt: "How can I improve my blog on tech",
    },
    {
      icon: <IconTerminal2 className="h-5 w-5 text-indigo-500" />,
      title: "Code Help",
      prompt: "How to center a div with Tailwind CSS",
    },
    {
      icon: <IconBrandMessenger className="h-5 w-5 text-pink-500" />,
      title: "Communication",
      prompt: "How to improve communication with my team",
    },
    {
      icon: <IconAssembly className="h-5 w-5 text-orange-500" />,
      title: "Productivity",
      prompt: "How to increase productivity while working",
    },
  ];

  const handleSuggestionClick = (prompt: string) => {
    handleInputChange({ target: { value: prompt } } as any);
    handleSubmit();
  };

  const handleTalkToHuman = async () => {
    if (!handoffSuggested?.context) {
      console.error('No handoff context available');
      return;
    }

    setIsHandingOff(true);
    try {
      const response = await fetch('/api/support-chat/handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: handoffSuggested.context,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transfer to human support');
      }

      const result = await response.json();
      
      // Redirect to the support conversation
      router.push(`/support/${result.conversationId}`);
    } catch (error) {
      console.error('Handoff error:', error);
      alert('Failed to transfer to human support. Please try again.');
    } finally {
      setIsHandingOff(false);
    }
  };

  const handleDeclineHandoff = () => {
    setHandoffSuggested(null);
  };

  const handleNewConversation = () => {
    // Clear localStorage session and reload page to start fresh
    localStorage.removeItem('chat-session-id');
    console.log('🗑️ Cleared session ID, starting new conversation');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 m-4 rounded-xl text-sm">
            Error: {error.message || 'Something went wrong'}
          </div>
        )}

        {/* Handoff Suggestion */}
        {handoffSuggested && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-900/50 border border-purple-400 text-purple-100 p-4 m-4 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <IconHeadset className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">
                  Would you like to speak with a human support agent?
                </p>
                <p className="text-xs text-purple-200 mb-3">
                  {handoffSuggested.context?.handoffReason || 'I think a human agent might be able to help you better with your specific needs.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleTalkToHuman}
                    disabled={isHandingOff}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors"
                  >
                    {isHandingOff ? 'Connecting...' : 'Talk to Human'}
                  </button>
                  <button
                    onClick={handleDeclineHandoff}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Continue with AI
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
            {messages.length === 0 ? (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">AI Assistant</h1>
                <p className="text-gray-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">How can I help you today?</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestionClick(suggestion.prompt)}
                      className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 text-left hover:bg-gray-700/50 transition-all group"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-gray-600 transition-colors flex-shrink-0">
                          {suggestion.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-white mb-1 text-sm sm:text-base">{suggestion.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-300">{suggestion.prompt}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header with New Conversation Button */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-xl font-semibold text-white">AI Assistant</h1>
                    <p className="text-sm text-gray-400">Session: {sessionId.split('-').pop()}</p>
                  </div>
                  <button
                    onClick={handleNewConversation}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors text-white"
                  >
                    New Conversation
                  </button>
                </div>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`mb-4 sm:mb-6 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl px-4 py-3 border border-purple-400/20' 
                        : 'bg-gray-800/50 text-white rounded-2xl px-4 py-3 border border-gray-700'
                    }`}>
                      {message.role === 'assistant' ? (
                        <Markdown className="prose prose-invert prose-sm max-w-none">
                          {message.content}
                        </Markdown>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4 max-w-4xl">
            {/* Manual Talk to Human Button */}
            <div className="flex justify-center mb-3">
              <button
                onClick={() => {
                  if (messages.length === 0) {
                    // If no conversation yet, create a simple handoff context
                    const simpleContext = {
                      aiChatHistory: [],
                      userIntent: 'User requested human support',
                      urgency: 'normal' as const,
                      category: 'other' as const,
                      summary: 'User directly requested to speak with human support',
                      handoffReason: 'User explicitly requested to speak with a human'
                    };
                    setHandoffSuggested({ context: simpleContext });
                  } else {
                    // Trigger handoff with current conversation
                    handleInputChange({ target: { value: 'I would like to speak to a human support agent' } } as any);
                    handleSubmit();
                  }
                }}
                className="text-xs text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <IconHeadset className="h-3 w-3" />
                Need human support?
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 sm:px-6 sm:py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm sm:text-base"
                  style={{ minHeight: '52px' }}
                />
              </div>
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.button
                    key="stop"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={stop}
                    className="p-3 bg-red-500 hover:bg-red-600 rounded-xl border border-red-400/20 transition-all w-[52px] h-[52px] flex items-center justify-center"
                  >
                    <IconPlayerStopFilled className="w-5 h-5 text-white" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="send"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!input.trim()}
                    className="p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-purple-400/20 transition-all w-[52px] h-[52px] flex items-center justify-center"
                  >
                    <IconArrowNarrowUp className="w-5 h-5 text-white" />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}