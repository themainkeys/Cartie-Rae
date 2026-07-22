/**
 * admin/DiscountManager.tsx
 *
 * Manages the "Voucher Coupons" sub-tab of the Catalog & Coupons tab.
 * Extracted from AdminPortal.tsx (lines 2513–2655).
 *
 * All form state, handlers, and CRUD operations are self-contained.
 * Uses useApp() directly for context data and actions.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminRole } from '../../types';
import { Plus } from 'lucide-react';

export const DiscountManager: React.FC = () => {
  const {
    discountCodes,
    addDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    currentAdminUser,
    triggerToast,
  } = useApp();

  // Local form state
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [discName, setDiscName] = useState('');
  const [discPercent, setDiscPercent] = useState('20');
  const [discDesc, setDiscDesc] = useState('');

  // Client-side permission guard
  const requirePermission = (allowedRoles: AdminRole[]): boolean => {
    if (!currentAdminUser) return false;
    const allowed = allowedRoles.includes(currentAdminUser.role);
    if (!allowed) {
      triggerToast(
        `Your role (${currentAdminUser.role.replace('_', ' ')}) does not have permission for this action.`,
        'error'
      );
    }
    return allowed;
  };

  const handleAddDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirePermission(['super_admin', 'store_manager'])) return;
    addDiscountCode({
      code: discName.toUpperCase().trim(),
      discountPercent: parseInt(discPercent) || 15,
      isActive: true,
      description: discDesc,
    });
    setDiscName('');
    setDiscPercent('20');
    setDiscDesc('');
    setIsAddingDiscount(false);
  };

  return (
    <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
      <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
          Voucher Promo Discounts List
        </h3>
        <button
          id="add-discount-btn"
          onClick={() => setIsAddingDiscount(!isAddingDiscount)}
          className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Discount</span>
        </button>
      </div>

      {/* Add form */}
      {isAddingDiscount && (
        <form onSubmit={handleAddDiscountSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
          <p className="font-serif font-bold text-brand-chocolate">New Coupon Specifications:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Coupon Text Code (e.g. SAVE20)</label>
              <input
                type="text"
                required
                value={discName}
                onChange={(e) => setDiscName(e.target.value)}
                placeholder="e.g. COILS25"
                className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none font-mono text-center uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Discount Percent (%)</label>
              <input
                type="number"
                required
                value={discPercent}
                onChange={(e) => setDiscPercent(e.target.value)}
                className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Campaign Description</label>
              <input
                type="text"
                required
                value={discDesc}
                onChange={(e) => setDiscDesc(e.target.value)}
                placeholder="25% welcome newsletter discount..."
                className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 text-[10.5px]">
            <button
              type="button"
              onClick={() => setIsAddingDiscount(false)}
              className="px-4 py-2 border border-brand-warm-tan hover:bg-brand-cream rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase transition"
            >
              Initialize Coupon
            </button>
          </div>
        </form>
      )}

      {/* Discounts table */}
      <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
              <th className="p-3">Coupon Code</th>
              <th className="p-3">Reduction Percent</th>
              <th className="p-3">Trigger Description</th>
              <th className="p-3">Active State</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
            {discountCodes.map((c) => (
              <tr key={c.id} className="hover:bg-brand-cream/30">
                <td className="p-3 font-mono font-bold text-brand-rose uppercase">{c.code}</td>
                <td className="p-3 font-mono font-bold text-emerald-800">{c.discountPercent}% Off</td>
                <td className="p-3 text-zinc-600 font-medium">{c.description}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                    c.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      id={`toggle-discount-${c.id}`}
                      onClick={() => {
                        if (requirePermission(['super_admin', 'store_manager'])) {
                          updateDiscountCode(c.id, { isActive: !c.isActive });
                          triggerToast(`"${c.code}" ${c.isActive ? 'deactivated' : 'activated'}.`, 'info');
                        }
                      }}
                      className={`p-1 px-2.5 rounded-md font-bold transition duration-150 text-[10.5px] ${
                        c.isActive
                          ? 'bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200'
                      }`}
                    >
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      id={`delete-discount-${c.id}`}
                      onClick={() => {
                        if (confirm(`Remove promo Coupon "${c.code}" completely?`)) {
                          if (requirePermission(['super_admin', 'store_manager'])) {
                            deleteDiscountCode(c.id);
                            triggerToast(`🗑 Discount code "${c.code}" deleted.`, 'success');
                          }
                        }
                      }}
                      className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250 text-[10.5px]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
