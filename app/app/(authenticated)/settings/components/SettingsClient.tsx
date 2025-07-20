"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@chat/ui";
import AccountSettings from "./AccountSettings";
import SecuritySettings from "./SecuritySettings";
import PreferenceSettings from "./PreferenceSettings";
import ChatSettings from "./ChatSettings";

const tabs = [
  { id: "account", label: "Account", icon: "👤" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "preferences", label: "Preferences", icon: "⚙️" },
  { id: "chat", label: "Chat", icon: "💬" },
];

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className="theme-page">
      <div className="theme-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="theme-heading-1 mb-6 sm:mb-8 text-2xl sm:text-3xl">Settings</h1>

          {/* Tab Navigation */}
          <div className="border-b border-gray-800 mb-6 sm:mb-8">
            {/* Mobile: Scrollable tabs */}
            <div className="block sm:hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <nav className="flex space-x-1 min-w-max px-1" aria-label="Settings tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap min-h-[44px] flex-shrink-0",
                        activeTab === tab.id
                          ? "border-purple-500 text-purple-400"
                          : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                      )}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-lg">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Desktop: Standard flex layout */}
            <nav className="hidden sm:flex space-x-4 lg:space-x-8" aria-label="Settings tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]",
                    activeTab === tab.id
                      ? "border-purple-500 text-purple-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                  )}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px] sm:min-h-[600px]"
        >
          {activeTab === "account" && <AccountSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "preferences" && <PreferenceSettings />}
          {activeTab === "chat" && <ChatSettings />}
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
}