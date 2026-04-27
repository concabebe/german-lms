"use client";

import { useState } from "react";
import { UsersTab } from "./tabs/users-tab";
import { SessionsTab } from "./tabs/sessions-tab";
import { SettingsTab } from "./tabs/settings-tab";

const TABS = [
  { key: "users", label: "Users" },
  { key: "sessions", label: "Sessions" },
  { key: "settings", label: "Settings" },
];

export function AdminContent() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h2 className="font-serif text-[28px] text-[var(--text)] mb-1">
          Admin Panel
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          Quản lý users, sessions, và cài đặt hệ thống
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-[var(--gray-m)] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-[var(--purple)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--purple)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "users" && <UsersTab />}
      {activeTab === "sessions" && <SessionsTab />}
      {activeTab === "settings" && <SettingsTab />}
    </main>
  );
}
