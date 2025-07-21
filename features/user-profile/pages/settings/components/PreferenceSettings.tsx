"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui";

interface Preferences {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  date_format: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  show_activity: boolean;
  keyboard_shortcuts: boolean;
}

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const dateFormats = [
  { value: "MM/DD/YYYY", example: "12/31/2024" },
  { value: "DD/MM/YYYY", example: "31/12/2024" },
  { value: "YYYY-MM-DD", example: "2024-12-31" },
  { value: "DD.MM.YYYY", example: "31.12.2024" },
];

export default function PreferenceSettings() {
  const [preferences, setPreferences] = useState<Preferences>({
    theme: "system",
    language: "en",
    timezone: "UTC",
    date_format: "MM/DD/YYYY",
    notifications_enabled: true,
    email_notifications: true,
    show_activity: true,
    keyboard_shortcuts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      // Apply theme immediately
      if (preferences.theme !== "system") {
        document.documentElement.classList.toggle("dark", preferences.theme === "dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      }

      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof Preferences, value: any) => {
    // @ts-ignore - Dynamic property assignment needed for form handling
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Removed updateNotification function - no longer needed

  if (isLoading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="theme-card"
      >
        <div className="theme-card-content">
          <h2 className="theme-heading-2 mb-6">Appearance</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-4">
              {(["light", "dark", "system"] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updatePreference("theme", theme)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-colors capitalize min-h-[60px]",
                    preferences.theme === theme
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-gray-600 hover:border-gray-400"
                  )}
                >
                  <div className="text-2xl mb-2">
                    {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"}
                  </div>
                  <span className="text-white">{theme}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        </div>
      </motion.div>

      {/* Language & Region */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="theme-card"
      >
        <div className="theme-card-content">
          <h2 className="theme-heading-2 mb-6">Language & Region</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => updatePreference("language", e.target.value)}
              className="w-full px-3 py-3 border rounded-lg bg-gray-700 border-gray-600 min-h-[44px] text-base text-white"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => updatePreference("timezone", e.target.value)}
              className="w-full px-3 py-3 border rounded-lg bg-gray-700 border-gray-600 min-h-[44px] text-base text-white"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Format</label>
            <select
              value={preferences.date_format}
              onChange={(e) => updatePreference("date_format", e.target.value)}
              className="w-full px-3 py-3 border rounded-lg bg-gray-700 border-gray-600 min-h-[44px] text-base text-white"
            >
              {dateFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.value} ({format.example})
                </option>
              ))}
            </select>
          </div>
        </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="theme-card"
      >
        <div className="theme-card-content">
          <h2 className="theme-heading-2 mb-6">Notifications</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Email Notifications</span>
              <p className="text-sm theme-text-muted">
                Receive important updates via email
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.email_notifications}
              onChange={(e) => updatePreference("email_notifications", e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">In-App Notifications</span>
              <p className="text-sm theme-text-muted">
                Show notifications within the application
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifications_enabled}
              onChange={(e) => updatePreference("notifications_enabled", e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]",
            isSaving && "opacity-50 cursor-not-allowed"
          )}
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}