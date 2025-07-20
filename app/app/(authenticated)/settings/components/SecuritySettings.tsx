"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@chat/ui";

interface ApiKey {
  id: number;
  name: string;
  key_preview: string;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface LoginHistoryEntry {
  id: number;
  ip_address: string;
  user_agent: string;
  location: string | null;
  success: boolean;
  created_at: string;
}

export default function SecuritySettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [keysResponse, historyResponse] = await Promise.all([
        fetch("/api/user/settings/api-keys"),
        fetch("/api/user/settings/login-history"),
      ]);

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData.apiKeys || []);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setLoginHistory(historyData.login_history || []);
      }
    } catch (error) {
      console.error("Error fetching security data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/user/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });

      if (!response.ok) throw new Error("Failed to create key");

      const data = await response.json();
      setNewKey(data.key);
      setApiKeys([...apiKeys, data.keyInfo]);
      setKeyName("");
    } catch (error) {
      console.error("Error creating API key:", error);
      alert("Failed to create API key. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    try {
      const response = await fetch(`/api/user/settings/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to revoke key");

      setApiKeys(apiKeys.filter((key) => key.id !== keyId));
    } catch (error) {
      console.error("Error revoking key:", error);
      alert("Failed to revoke API key. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseUserAgent = (ua: string) => {
    // Simple browser detection
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Unknown Browser";
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading security settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* API Keys */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">API Keys</h2>
          <button
            onClick={() => setShowCreateKey(true)}
            className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            Create New Key
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No API keys created yet.</p>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
              >
                <div>
                  <h4 className="font-medium">{key.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Key: {key.key_preview}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Created: {formatDate(key.created_at)}
                    {key.last_used && ` • Last used: ${formatDate(key.last_used)}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeKey(key.id)}
                  className="px-3 py-3 text-red-600 border border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[44px]"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Login History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-xl font-semibold mb-6">Login History</h2>
        {loginHistory.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No login history available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-4">Date & Time</th>
                  <th className="text-left py-2 px-4">IP Address</th>
                  <th className="text-left py-2 px-4">Browser</th>
                  <th className="text-left py-2 px-4">Location</th>
                  <th className="text-left py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.slice(0, 10).map((entry) => (
                  <tr key={entry.id} className="border-b dark:border-gray-700">
                    <td className="py-2 px-4 text-sm">{formatDate(entry.created_at)}</td>
                    <td className="py-2 px-4 text-sm">{entry.ip_address}</td>
                    <td className="py-2 px-4 text-sm">{parseUserAgent(entry.user_agent)}</td>
                    <td className="py-2 px-4 text-sm">{entry.location || "Unknown"}</td>
                    <td className="py-2 px-4">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded",
                          entry.success
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        )}
                      >
                        {entry.success ? "Success" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Password Change Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Password</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Change your password to keep your account secure.
        </p>
        <a
          href="/profile"
          className="inline-block px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
        >
          Change Password in Profile
        </a>
      </motion.div>

      {/* Create API Key Modal */}
      {showCreateKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold mb-4">Create API Key</h3>
            {newKey ? (
              <div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Your API key has been created. Copy it now as you won&apos;t be able to see it again.
                </p>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4 font-mono text-sm break-all">
                  {newKey}
                </div>
                <button
                  onClick={() => {
                    setShowCreateKey(false);
                    setNewKey("");
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 min-h-[44px]"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Key name (e.g., My App)"
                  className="w-full px-3 py-3 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600 min-h-[44px] text-base"
                />
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowCreateKey(false);
                      setKeyName("");
                    }}
                    className="flex-1 px-4 py-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={isCreating || !keyName.trim()}
                    className={cn(
                      "flex-1 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 min-h-[44px]",
                      (isCreating || !keyName.trim()) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}