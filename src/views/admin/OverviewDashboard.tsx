/**
 * admin/OverviewDashboard.tsx
 *
 * Renders all three sub-tabs of the "Overview Dashboard" main tab:
 *   - Conversion Metrics (metrics)
 *   - Orders Tracker (orders)
 *   - Subscriber Logs (subscribers)
 *
 * Extracted from AdminPortal.tsx (metrics: ~1758-1815, orders: ~2410-2496,
 * subscribers: ~3368-3420).
 *
 * The sub-tab navigation pill bar remains in the shell (AdminPortal) because
 * it uses the shared `overviewSub` / `setOverviewSub` state that lives there.
 * This component receives the active sub-tab and renders the correct panel.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Phone, MapPin, CheckCircle2, Sparkles } from 'lucide-react';

interface OverviewDashboardProps {
  overviewSub: 'metrics' | 'orders' | 'subscribers';
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  overviewSub,
}) => {
  const {
    orders,
    newsletterSignups,
    discountCodes,
    products,
    ebooks,
    fulfillOrder,
  } = useApp();

  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;

  // ── Conversion Metrics ────────────────────────────────────────────────────
  if (overviewSub === 'metrics') {
    return (
      <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
        <h2 className="font-serif text-lg font-bold text-brand-dark border-b border-[#E5D5C8]/30 pb-3 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
          Business Health Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store Activity */}
          <div className="bg-[#FAF7F2] p-5.5 rounded-2xl border border-[#E5D5C8]/30 space-y-4">
            <h3 className="font-serif text-sm font-bold text-brand-chocolate tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand-rose rounded-full" />
              Store Activity
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-[#E5D5C8]/35 pb-2 text-[#8C6D62]">
                <span className="font-medium">Total Orders</span>
                <span className="font-mono font-bold text-brand-dark">{orders.length}</span>
              </div>
              <div className="flex justify-between border-b border-[#E5D5C8]/35 pb-2 text-[#8C6D62]">
                <span className="font-medium">Awaiting Shipment</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">{pendingOrdersCount}</span>
              </div>
              <div className="flex justify-between border-b border-[#E5D5C8]/35 pb-2 text-[#8C6D62]">
                <span className="font-medium">Newsletter Subscribers</span>
                <span className="font-mono font-bold text-brand-dark">{newsletterSignups.length}</span>
              </div>
              <div className="flex justify-between text-[#8C6D62] pt-0.5">
                <span className="font-medium">Active Discount Codes</span>
                <span className="font-mono font-black text-brand-rose bg-brand-pink-light px-2 py-0.5 rounded">{discountCodes.filter((c) => c.isActive).length}</span>
              </div>
            </div>
          </div>

          {/* Live Storefront Card */}
          <div className="bg-brand-dark text-white p-6 rounded-2xl border border-brand-chocolate/40 relative overflow-hidden flex flex-col justify-between shadow-md">
            <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-brand-chocolate opacity-20 rounded-full blur-2xl" />
            <div>
              <h3 className="font-serif text-sm font-bold text-brand-pink flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 fill-brand-pink text-brand-pink animate-pulse" />
                Live Storefront
              </h3>
              <p className="text-[11.5px] text-brand-beige/85 mt-3 leading-relaxed font-sans">
                Edits to your catalog, orders, discount codes and homepage copy save instantly and appear on the live storefront. Manage products, fulfill orders and respond to consultations all from here.
              </p>
            </div>
            <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5">
              <span className="text-[10px] text-[#C5A880] font-mono uppercase tracking-wider">Store Status</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Quick summary numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {[
            { label: 'Total Revenue', value: `$${totalSales.toFixed(2)}`, color: 'text-emerald-700' },
            { label: 'Products Listed', value: String(products.length), color: 'text-brand-chocolate' },
            { label: 'eBooks Published', value: String(ebooks.length), color: 'text-brand-chocolate' },
            { label: 'Signups', value: String(newsletterSignups.length), color: 'text-brand-rose' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#FAF7F2] border border-[#E5D5C8]/30 rounded-xl p-4 text-center">
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
              <p className="text-[10px] text-[#8C6D62] font-semibold uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Orders Tracker ────────────────────────────────────────────────────────
  if (overviewSub === 'orders') {
    return (
      <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
        <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-[#E5D5C8]/30 pb-3 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-600 rounded-full animate-pulse" />
          Authorized Customer Orders Ledger
        </h3>

        <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer Profile</th>
                <th className="p-3">Items Purchased</th>
                <th className="p-3 text-right">Invoice Paid</th>
                <th className="p-3">Date Received</th>
                <th className="p-3 text-center">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-brand-cream/30">
                  <td className="p-3 font-mono font-bold text-brand-rose">{o.id}</td>
                  <td className="p-3">
                    <p className="font-semibold text-brand-chocolate">{o.customerName}</p>
                    <p className="text-[10px] text-brand-dark/50 font-mono mt-0.5">{o.customerEmail}</p>
                    {o.customerPhone && (
                      <p className="text-[10px] text-[#8C6D62] font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-brand-rose" />
                        <span>{o.customerPhone}</span>
                      </p>
                    )}
                    {o.shippingAddress && (
                      <p className="text-[10px] text-zinc-600 mt-1.5 max-w-[240px] bg-brand-beige/50 p-1.5 rounded-lg border border-brand-warm-tan/20 flex items-start gap-1 leading-normal">
                        <MapPin className="w-3.5 h-3.5 text-brand-rose mt-0.5 flex-shrink-0" />
                        <span>{o.shippingAddress}</span>
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {o.items.map((item, idx) => (
                        <p key={idx} className="line-clamp-1 max-w-[200px]">
                          • {item.name} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-900">
                    ${o.total.toFixed(2)}
                    {o.discountCodeApplied && (
                      <span className="text-[9px] uppercase tracking-wider text-brand-rose block font-semibold mt-0.5">
                        ({o.discountCodeApplied})
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono">{o.date}</td>
                  <td className="p-3 text-center">
                    {o.status === 'Fulfilled' ? (
                      <span className="bg-emerald-50 text-emerald-800 text-[10.5px] font-bold px-2.5 py-1 rounded-full border border-emerald-200/50 flex items-center justify-center gap-1 w-fit mx-auto">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dispatched / Done</span>
                      </span>
                    ) : (
                      <button
                        id={`fulfill-btn-${o.id}`}
                        onClick={() => fulfillOrder(o.id)}
                        className="p-1 px-3 bg-brand-rose hover:bg-brand-berry text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Mark Dispatched
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Subscriber Logs ───────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
      <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-[#E5D5C8]/30 pb-3 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-brand-rose rounded-full animate-pulse" />
        &apos;The Growth List&apos; Subscribers logs
      </h3>

      <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
              <th className="p-3">Reference Index</th>
              <th className="p-3">Subscriber Email Address</th>
              <th className="p-3">Join Date Status</th>
              <th className="p-3 text-center">Source Stream</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80 font-mono">
            {/* Demo seeded rows */}
            <tr className="hover:bg-brand-cream/30">
              <td className="p-3 text-[#A67E6B]">1</td>
              <td className="p-3 text-brand-chocolate font-bold">charnelle.davis@gmail.com</td>
              <td className="p-3">2026-06-03</td>
              <td className="p-3 text-center font-sans">
                <span className="bg-brand-pink-light text-brand-rose px-2 py-0.5 rounded text-[10px]">Footer Form</span>
              </td>
            </tr>
            <tr className="hover:bg-brand-cream/30">
              <td className="p-3 text-[#A67E6B]">2</td>
              <td className="p-3 text-brand-chocolate font-bold">sasha.styles@yahoo.com</td>
              <td className="p-3">2026-06-04</td>
              <td className="p-3 text-center font-sans">
                <span className="bg-brand-pink-light text-brand-rose px-2 py-0.5 rounded text-[10px]">Footer Form</span>
              </td>
            </tr>
            {newsletterSignups.map((sub, sIdx) => (
              <tr key={sub.id} className="hover:bg-brand-cream/30">
                <td className="p-3 text-[#A67E6B]">{sIdx + 3}</td>
                <td className="p-3 text-brand-chocolate font-bold">{sub.email}</td>
                <td className="p-3">{sub.date}</td>
                <td className="p-3 text-center font-sans">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/50 px-2 py-0.5 rounded text-[10px]">Live Signup Form</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
