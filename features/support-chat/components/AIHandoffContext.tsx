'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconChevronDown, 
  IconChevronUp,
  IconBolt,
  IconMessageCircle,
  IconAlertTriangle,
  IconInfoCircle
} from '@tabler/icons-react';

interface AIHandoffContextProps {
  contextData: any;
}

export function AIHandoffContext({ contextData }: AIHandoffContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!contextData) {
    return null;
  }

  const { 
    handoffReason, 
    userIntent, 
    urgency, 
    category, 
    summary, 
    aiChatHistory 
  } = contextData;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'normal': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <IconBolt className="h-4 w-4" />;
      case 'billing': return <IconInfoCircle className="h-4 w-4" />;
      case 'bug': return <IconAlertTriangle className="h-4 w-4" />;
      default: return <IconMessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
            <IconBolt className="h-4 w-4 text-purple-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-purple-300">
              Transferred from AI Chat
            </h3>
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(urgency || 'normal')}`}>
              {(urgency || 'Normal').charAt(0).toUpperCase() + (urgency || 'normal').slice(1)} Priority
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 font-medium min-w-0 flex-shrink-0">Reason:</span>
              <span className="text-gray-300">{handoffReason}</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-gray-400 font-medium min-w-0 flex-shrink-0">Intent:</span>
              <span className="text-gray-300">{userIntent}</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-gray-400 font-medium min-w-0 flex-shrink-0">Category:</span>
              <div className="flex items-center gap-1 text-gray-300">
                {getCategoryIcon(category)}
                <span className="capitalize">{category}</span>
              </div>
            </div>
            
            {summary && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 font-medium min-w-0 flex-shrink-0">Summary:</span>
                <span className="text-gray-300">{summary}</span>
              </div>
            )}
          </div>
          
          {aiChatHistory && aiChatHistory.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>View AI Chat History ({aiChatHistory.length} messages)</span>
                {isExpanded ? (
                  <IconChevronUp className="h-4 w-4" />
                ) : (
                  <IconChevronDown className="h-4 w-4" />
                )}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 space-y-2 max-h-64 overflow-y-auto"
                  >
                    {aiChatHistory.map((message: any, index: number) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg text-sm ${
                          message.role === 'user' 
                            ? 'bg-blue-500/10 border-l-2 border-blue-500' 
                            : 'bg-gray-700/30 border-l-2 border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${
                            message.role === 'user' ? 'text-blue-400' : 'text-gray-400'
                          }`}>
                            {message.role === 'user' ? 'User' : 'AI Assistant'}
                          </span>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}