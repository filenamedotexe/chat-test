"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@chat/ui";

interface ChatSettings {
  default_model: string;
  temperature: number;
  max_tokens: number;
  save_history: boolean;
  auto_title: boolean;
  web_search: boolean;
  image_generation: boolean;
}

const models = [
  { value: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", maxContext: 4096 },
  { value: "gpt-4", name: "GPT-4", maxContext: 8192 },
  { value: "gpt-4-turbo", name: "GPT-4 Turbo", maxContext: 128000 },
  { value: "claude-3-opus", name: "Claude 3 Opus", maxContext: 200000 },
  { value: "claude-3-sonnet", name: "Claude 3 Sonnet", maxContext: 200000 },
];

export default function ChatSettings() {
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    default_model: "gpt-3.5-turbo",
    temperature: 0.7,
    max_tokens: 2048,
    save_history: true,
    auto_title: true,
    web_search: false,
    image_generation: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    fetchChatSettings();
  }, []);

  const fetchChatSettings = async () => {
    try {
      const response = await fetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.chatSettings) {
          setChatSettings(data.chatSettings);
        }
      }
    } catch (error) {
      console.error("Error fetching chat settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/settings/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatSettings),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      alert("Chat settings saved successfully!");
    } catch (error) {
      console.error("Error saving chat settings:", error);
      alert("Failed to save chat settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      const response = await fetch("/api/user/settings/clear-chat-history", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to clear history");

      alert("Chat history cleared successfully!");
      setShowClearModal(false);
    } catch (error) {
      console.error("Error clearing history:", error);
      alert("Failed to clear chat history. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const updateSetting = (key: keyof ChatSettings, value: any) => {
    // @ts-ignore - Dynamic property assignment needed for form handling
    setChatSettings(prev => ({ ...prev, [key]: value }));
  };

  const selectedModel = models.find((m) => m.value === chatSettings.default_model);
  const maxContext = selectedModel?.maxContext || 4096;

  if (isLoading) {
    return <div className="text-center py-8">Loading chat settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Model Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-xl font-semibold mb-6">AI Model</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              value={chatSettings.default_model}
              onChange={(e) => updateSetting("default_model", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              {models.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Maximum context: {maxContext.toLocaleString()} tokens
            </p>
          </div>

          {/* Removed context size - not in API */}
        </div>
      </motion.div>

      {/* Generation Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-xl font-semibold mb-6">Generation Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Temperature ({chatSettings.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={chatSettings.temperature}
              onChange={(e) => updateSetting("temperature", parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>More Focused</span>
              <span>More Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Response Length ({chatSettings.max_tokens} tokens)
            </label>
            <input
              type="range"
              min="256"
              max="4096"
              step="256"
              value={chatSettings.max_tokens || 2048}
              onChange={(e) => updateSetting("max_tokens", parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>256</span>
              <span>4096</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Display Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-xl font-semibold mb-6">Display Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Save Chat History</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically save chat history
              </p>
            </div>
            <input
              type="checkbox"
              checked={chatSettings.save_history}
              onChange={(e) => updateSetting("save_history", e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Auto-generate Titles</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically create titles for conversations
              </p>
            </div>
            <input
              type="checkbox"
              checked={chatSettings.auto_title}
              onChange={(e) => updateSetting("auto_title", e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Enable Web Search</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow AI to search the web for information
              </p>
            </div>
            <input
              type="checkbox"
              checked={chatSettings.web_search}
              onChange={(e) => updateSetting("web_search", e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </motion.div>

      {/* Chat History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
      >
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Chat History
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Clear all your chat history. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowClearModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Clear Chat History
        </button>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
            isSaving && "opacity-50 cursor-not-allowed"
          )}
        >
          {isSaving ? "Saving..." : "Save Chat Settings"}
        </button>
      </div>

      {/* Clear History Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold mb-4">Clear Chat History</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to clear all your chat history? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                disabled={isClearing}
                className={cn(
                  "flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
                  isClearing && "opacity-50 cursor-not-allowed"
                )}
              >
                {isClearing ? "Clearing..." : "Clear History"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}