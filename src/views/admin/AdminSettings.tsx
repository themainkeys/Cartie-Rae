/**
 * admin/AdminSettings.tsx
 *
 * Renders the "Portal Settings" sub-tab of the Store Editor tab.
 * Extracted from AdminPortal.tsx (lines 4267–4324).
 *
 * Uses useApp() directly for email notification toggle.
 * No local state required.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, ToggleRight, ToggleLeft } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { emailNotificationsEnabled, setEmailNotificationsEnabled } = useApp();

  return (
    <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)] max-w-2xl animate-fade-in">
      <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
          Administrative Portal Settings
        </h3>
      </div>

      <p className="text-xs text-[#8C6D62] leading-relaxed">
        Configure back-office notification preference rules and simulation triggers for the{' '}
        <strong>Cartiae Rae</strong> brand registry.
      </p>

      <div className="bg-[#FAF7F2] rounded-2xl border border-[#E5D5C8]/40 p-5 mt-4 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-serif text-sm font-bold text-brand-dark flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-brand-rose" />
              Contact Submissions Email Notifications
            </h4>
            <p className="text-[11px] text-[#8C6D62] leading-relaxed max-w-md">
              When enabled, the platform triggers a visual e-mail dispatcher simulation and delivers responsive toast log
              updates to the creator whenever customers submit natural advice porosity forms.
            </p>
          </div>

          <button
            onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
            className="p-1 focus:outline-none transition duration-150 relative self-center"
            aria-label="Toggle email notifications"
            id="toggle-email-notifications-btn"
          >
            {emailNotificationsEnabled ? (
              <ToggleRight className="w-12 h-12 text-brand-rose" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-[#8C6D62]/40" />
            )}
          </button>
        </div>

        <div className="pt-4 border-t border-[#E5D5C8]/30 flex items-center justify-between text-[11px]">
          <span className="text-brand-chocolate/70 font-mono">Simulated Target:</span>
          <span className="bg-white px-2.5 py-1 rounded-md border border-[#E5D5C8]/50 font-mono text-brand-dark font-semibold">
            Themainkeys@gmail.com
          </span>
        </div>
      </div>

      {/* How-to test guide */}
      <div className="border border-[#E5D5C8]/50 rounded-2xl p-5 space-y-3 bg-[#FAF7F2]/40 text-xs">
        <h4 className="font-serif font-bold text-brand-dark">How to test this trigger:</h4>
        <ol className="list-decimal pl-4 space-y-1.5 text-[#8C6D62] leading-relaxed text-[11px]">
          <li>
            Navigate to the <span className="font-semibold text-brand-rose">Contact Studio</span> tab in the main shop
            storefront menu.
          </li>
          <li>
            Inquire through the <strong>Porosity advice desk</strong> form by filling your name, porosity type, and
            natural hair questions.
          </li>
          <li>
            Click submit to trigger either an immediate <strong>✉ Dispatch email log</strong> toast or a silent request
            submission based on this setting!
          </li>
        </ol>
      </div>
    </div>
  );
};
