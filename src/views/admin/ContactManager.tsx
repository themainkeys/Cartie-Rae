/**
 * admin/ContactManager.tsx
 *
 * Manages the "Consult Inquiries" tab of the Admin Portal.
 * Extracted verbatim from AdminPortal.tsx (lines 4477–4663).
 *
 * All handlers call context actions directly; the only local state is the
 * status filter pill selection.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Eye, Check, Archive, Inbox, Camera } from 'lucide-react';

export const ContactManager: React.FC = () => {
  const {
    contactRequests,
    updateContactRequestStatus,
    deleteContactRequest,
    prefersReducedMotion,
    triggerToast,
  } = useApp();

  const [contactFilter, setContactFilter] = useState<'All' | 'Pending' | 'Responded' | 'Read' | 'Archived'>('All');

  return (
    <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center border-b border-[#E5D5C8]/30 pb-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
            Received Porosity Advice Consultations
          </h3>
          <p className="text-xs text-[#8C6D62] mt-0.5">Organize customer hair porosity and advice inquiries.</p>
        </div>

        {/* Status Selector Filters */}
        <div className="flex flex-wrap gap-1 bg-brand-beige/45 p-1 rounded-xl border border-brand-warm-tan/20">
          {(['All', 'Pending', 'Responded', 'Read', 'Archived'] as const).map((filterOpt) => {
            const count =
              filterOpt === 'All'
                ? contactRequests.length
                : contactRequests.filter((c) => c.status === filterOpt).length;
            return (
              <motion.button
                key={filterOpt}
                whileTap={{ scale: 0.98 }}
                onClick={() => setContactFilter(filterOpt)}
                className={`relative px-3 py-1.5 text-[10.5px] font-extrabold uppercase rounded-lg transition-all focus:outline-none ${
                  contactFilter === filterOpt ? 'text-white' : 'text-[#8C6D62] hover:bg-brand-cream/60'
                }`}
              >
                {contactFilter === filterOpt && !prefersReducedMotion && (
                  <motion.div layoutId="contactActiveFilter" className="absolute inset-0 bg-brand-rose rounded-lg shadow-sm" style={{ zIndex: 0 }} />
                )}
                {contactFilter === filterOpt && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-sm" />
                )}
                <span className="relative z-10">{filterOpt} ({count})</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {contactRequests.length === 0 ? (
        <div className="p-10 text-center text-[#A67E6B] font-medium italic">
          No porosity requests received so far.
        </div>
      ) : contactRequests.filter((c) => contactFilter === 'All' || c.status === contactFilter).length === 0 ? (
        <div className="p-10 text-center text-[#A67E6B] font-medium italic bg-white/40 border border-dashed border-brand-warm-tan/20 rounded-2xl">
          No inquiries with status &quot;{contactFilter}&quot; currently list.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contactRequests
            .filter((c) => contactFilter === 'All' || c.status === contactFilter)
            .map((req) => (
              <div key={req.id} className="bg-white border border-brand-warm-tan/25 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-4 shadow-sm hover:shadow transition duration-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono text-[9px] font-bold bg-[#FAF6F0] p-1 rounded text-brand-rose border border-brand-warm-tan/10">{req.id}</span>
                      <h4 className="font-serif text-sm font-bold text-brand-dark mt-1.5">{req.name}</h4>
                      <p className="font-mono text-[10px] text-brand-dark/50">{req.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-sans text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        {req.porosity}
                      </span>
                      <p className="text-[9.5px] font-mono text-[#A67E6B] mt-1.5">{req.date}</p>
                    </div>
                  </div>

                  <div className="bg-[#FAF6F0] p-3 rounded-xl border border-brand-warm-tan/15 text-xs text-brand-dark/80 italic leading-relaxed">
                    &quot;{req.message}&quot;
                  </div>

                  {req.photoAttachment && (
                    <div className="border border-brand-warm-tan/15 p-2 rounded-xl bg-orange-50/15 w-fit">
                      <p className="text-[10px] font-bold uppercase text-brand-rose flex items-center gap-1 mb-1.5">
                        <Camera className="w-3.5 h-3.5" /> Attached Reference Photo:
                      </p>
                      <a href={req.photoAttachment} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg cursor-zoom-in border border-brand-warm-tan/30">
                        <img
                          src={req.photoAttachment}
                          referrerPolicy="no-referrer"
                          alt="Reference"
                          className="w-56 h-36 object-cover hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-brand-dark/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10.5px] font-bold uppercase tracking-wider">
                          Expand Photo
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-brand-warm-tan/15 justify-between items-start sm:items-center">
                  {/* Status badge */}
                  <div>
                    <span className={`text-[9.5px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${
                      req.status === 'Responded'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
                        : req.status === 'Read'
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/50'
                        : req.status === 'Archived'
                        ? 'bg-zinc-100 text-zinc-700 border border-zinc-200/50'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                    }`}>
                      {req.status === 'Responded' && '✓ Replied / Open'}
                      {req.status === 'Read' && '👁 Read / Logged'}
                      {req.status === 'Archived' && '📁 Archived'}
                      {req.status === 'Pending' && '● Awaiting Advice'}
                    </span>
                  </div>

                  {/* Quick action buttons */}
                  <div className="flex flex-wrap gap-1.5 justify-end w-full sm:w-auto">
                    {req.status === 'Pending' && (
                      <button
                        onClick={() => updateContactRequestStatus(req.id, 'Read')}
                        className="p-1 px-2.5 bg-[#FAF6F0] hover:bg-white text-brand-chocolate hover:text-brand-rose border border-brand-warm-tan/30 rounded-lg text-[10px] font-extrabold uppercase transition duration-150 flex items-center gap-1 focus:outline-none"
                        title="Mark read"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>
                    )}

                    {req.status !== 'Responded' && req.status !== 'Archived' && (
                      <button
                        onClick={() => updateContactRequestStatus(req.id, 'Responded')}
                        className="p-1 px-2.5 bg-brand-chocolate hover:bg-brand-berry text-white rounded-lg text-[10px] font-extrabold uppercase transition duration-150 flex items-center gap-1 focus:outline-none"
                        title="Mark Replied"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    )}

                    {req.status !== 'Archived' ? (
                      <button
                        onClick={() => updateContactRequestStatus(req.id, 'Archived')}
                        className="p-1 px-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-brand-chocolate border border-zinc-200 rounded-lg text-[10px] font-extrabold uppercase transition duration-150 flex items-center gap-1 focus:outline-none"
                        title="Archive interaction"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateContactRequestStatus(req.id, 'Pending')}
                        className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white border border-brand-rose/20 rounded-lg text-[10px] font-extrabold uppercase transition duration-150 flex items-center gap-1 focus:outline-none"
                        title="Restore to pending folder"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm('Permanently delete this customer query?')) {
                          deleteContactRequest(req.id);
                          triggerToast('🗑 Contact inquiry deleted.', 'success');
                        }
                      }}
                      className="p-1 px-2.5 bg-white hover:bg-red-50 text-brand-rose hover:text-red-700 border border-[#E9D9D3] rounded-lg text-[10px] font-extrabold uppercase transition duration-150 focus:outline-none"
                      title="Trash"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
