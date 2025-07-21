"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/ui";

export default function AccountSettings() {
  const { data: session } = useSession();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/user/settings/export-data", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== session?.user?.email) {
      alert("Email doesn't match. Please enter your email correctly.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      if (!response.ok) throw new Error("Delete failed");

      // Redirect to logout
      window.location.href = "/api/auth/signout";
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="theme-card"
      >
        <div className="theme-card-content">
          <h2 className="theme-heading-2 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm theme-text-muted">Email Address</label>
              <p className="text-lg font-medium theme-text-primary">{session?.user?.email}</p>
            </div>
            <div>
              <label className="text-sm theme-text-muted">Account Type</label>
              <p className="text-lg font-medium theme-text-primary capitalize">{session?.user?.role || "User"}</p>
            </div>
            <div>
              <label className="text-sm theme-text-muted">Member Since</label>
              <p className="text-lg font-medium theme-text-primary">Unknown</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="theme-card"
      >
        <div className="theme-card-content">
          <h2 className="theme-heading-2 mb-4">Data Management</h2>
          <div className="space-y-4">
            <div>
              <h3 className="theme-heading-3 mb-2">Export Your Data</h3>
              <p className="text-sm theme-text-muted mb-4">
                Download all your data including profile information, chat history, and settings.
              </p>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className={cn(
                  "theme-btn-primary min-h-[44px] px-4 py-3",
                  isExporting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isExporting ? "Exporting..." : "Export Data"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="theme-status-error rounded-lg p-6"
      >
        <h2 className="theme-heading-2 text-red-400 mb-4">
          Danger Zone
        </h2>
        <div>
          <h3 className="theme-heading-3 mb-2">Delete Account</h3>
          <p className="text-sm theme-text-muted mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
          >
            Delete Account
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold mb-4">Delete Account</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              This action cannot be undone. This will permanently delete your account and remove
              your data from our servers.
            </p>
            <p className="mb-4 font-medium">
              Please type <span className="text-red-600">{session?.user?.email}</span> to confirm:
            </p>
            <input
              type="email"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3 py-3 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600 min-h-[44px] text-base"
              placeholder="Enter your email"
            />
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="flex-1 px-4 py-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation !== session?.user?.email}
                className={cn(
                  "flex-1 px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 min-h-[44px]",
                  (isDeleting || deleteConfirmation !== session?.user?.email) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}