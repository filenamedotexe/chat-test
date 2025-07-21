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
    <div className="min-h-screen bg-black text-white">
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 m-4 rounded-xl text-sm">
            Error: {error.message || 'Something went wrong'}
          </div>
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