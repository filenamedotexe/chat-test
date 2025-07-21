"use client";

import { useChat } from "ai/react";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { 
  IconArrowNarrowUp, 
  IconPlayerStopFilled,
  IconSeo,
  IconTerminal2,
  IconBrandMessenger,
  IconAssembly 
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ChatPage() {
  const { data: session } = useSession();
  const [sessionId] = useState(() => {
    // Generate sessionId only on client to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return 'session-temp';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
    onFinish: (message) => {
      console.log('Chat finished:', message);
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

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-black">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 sm:p-4 m-3 sm:m-4 rounded-lg text-sm sm:text-base">
          Error: {error.message || 'Something went wrong'}
        </div>
      )}
      
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          {messages.length === 0 ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">AI Assistant</h1>
              <p className="text-gray-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">How can I help you today?</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                    className="p-3 sm:p-4 bg-gray-800/50 rounded-xl text-left hover:bg-gray-700/50 transition-colors group min-h-[60px]"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-gray-600 transition-colors flex-shrink-0">
                        {suggestion.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white mb-1 text-sm sm:text-base">{suggestion.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{suggestion.prompt}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
                >
                  <div className={`max-w-[90%] sm:max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-pink-500 to-violet-600 text-white rounded-2xl px-3 py-2 sm:px-5 sm:py-3' 
                      : 'bg-gray-800 text-white rounded-2xl px-3 py-2 sm:px-5 sm:py-3'
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
      <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full bg-gray-800 text-white rounded-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all min-h-[48px] text-base"
            />
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.button
                  key="stop"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={stop}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-red-500 rounded-full hover:bg-red-600 transition-colors min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
                >
                  <IconPlayerStopFilled className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
                >
                  <IconArrowNarrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  );
}