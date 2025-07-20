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
    <div className="container mx-auto p-6 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="flex space-x-8" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
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
          className="min-h-[600px]"
        >
          {activeTab === "account" && <AccountSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "preferences" && <PreferenceSettings />}
          {activeTab === "chat" && <ChatSettings />}
        </motion.div>
      </motion.div>
    </div>
  );
}