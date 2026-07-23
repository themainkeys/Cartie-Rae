import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { ContactManager } from './admin/ContactManager';
import { DiscountManager } from './admin/DiscountManager';
import { OverviewDashboard } from './admin/OverviewDashboard';
import { AdminSettings } from './admin/AdminSettings';
import { BlogManager } from './admin/BlogManager';
import { InventoryManager } from './admin/InventoryManager';
import { SiteContentManager } from './admin/SiteContentManager';
import { VideoManager } from './admin/VideoManager';
import { GalleryManager } from './admin/GalleryManager';
import { AnimatedAdminCounter } from './admin/shared/AnimatedCounter';
import {
  ShieldCheck, Lock, LogOut, TrendingUp, ShoppingBag,
  Mail, BadgePercent, Settings, Package, Save,
  Video, Image, MessageSquare,
  Globe, Smartphone, RefreshCw
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    newsletterSignups, orders, isAdminLoggedIn, currentAdminUser,
    contactRequests,
    loginAdmin, demoLogin, logoutAdmin,
    prefersReducedMotion,
    syncSiteToCloud,
    triggerToast,
    products, ebooks, discountCodes, blogs, videos, gallery,
  } = useApp();

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'contacts' | 'design'>('overview');
  const [overviewSub, setOverviewSub] = useState<'metrics' | 'orders' | 'subscribers'>('metrics');
  const [catalogSub, setCatalogSub] = useState<'inventory' | 'discounts'>('inventory');
  const [designSub, setDesignSub] = useState<'cms' | 'assets' | 'settings'>('cms');

  // Global dirty-state aggregation — each manager reports up via onDirtyChange
  const [inventoryDirty, setInventoryDirty] = useState(false);
  const [cmsDirty, setCmsDirty] = useState(false);
  const [videoDirty, setVideoDirty] = useState(false);
  const [galleryDirty, setGalleryDirty] = useState(false);
  const hasUnsavedChanges = inventoryDirty || cmsDirty || videoDirty || galleryDirty;

  // Derived dashboard stats
  const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

  // ── Auth handlers ────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const success = await loginAdmin(email, password);
      if (!success) {
        setAuthError('Incorrect email or password. Access denied.');
      } else {
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setAuthError('An error occurred during authentication. Please try again.');
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    await syncSiteToCloud();
    setIsSyncingCloud(false);
  };

  const handleSaveAll = () => {
    syncSiteToCloud();
    triggerToast('✓ Changes saved — live on storefront!', 'success');
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ═══════════════════════════════════════ */}
      {/* 🔒 ADMIN LOGIN PANEL                    */}
      {/* ═══════════════════════════════════════ */}
      {!isAdminLoggedIn ? (
        <div className="max-w-md mx-auto bg-gradient-to-b from-white to-[#FDFBF9] border border-[#E5D5C8]/75 rounded-3xl p-6 sm:p-10 shadow-[0_12px_40px_rgba(74,43,32,0.06)] text-center mt-12 relative overflow-hidden">
          {/* Accent line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-rose via-brand-pink to-brand-chocolate" />

          <div className="w-14 h-14 bg-brand-pink-light border border-brand-pink/20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Lock className="w-6 h-6 text-brand-rose" />
          </div>

          {isSupabaseConfigured ? (
            /* ── PRODUCTION: Supabase Auth ── */
            <>
              <h1 className="font-serif text-2xl font-extrabold text-brand-dark tracking-tight mb-2">Cartiae Rae Admin Login</h1>
              <p className="font-sans text-xs text-[#8C6D62] leading-relaxed max-w-xs mx-auto mb-8">
                Sign in with your administrator credentials to manage the storefront.
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="text-left space-y-4">
                  <div>
                    <label className="block text-[10px] tracking-wider uppercase font-extrabold text-[#8C6D62] mb-1.5 pl-1">Email Address</label>
                    <input
                      id="admin-email-input"
                      type="email"
                      required
                      disabled={isLoggingIn}
                      placeholder="admin@cartiaerae.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E5D5C8] text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-center font-sans transition-all duration-150 shadow-xs disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-wider uppercase font-extrabold text-[#8C6D62] mb-1.5 pl-1">Password</label>
                    <input
                      id="admin-password-input"
                      type="password"
                      required
                      disabled={isLoggingIn}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E5D5C8] text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-center font-mono transition-all duration-150 shadow-xs disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  id="admin-login-submit"
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-brand-rose to-brand-berry hover:from-brand-berry hover:to-brand-rose text-white py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none shadow-[0_4px_12px_rgba(194,57,90,0.18)] hover:shadow-[0_6px_16px_rgba(194,57,90,0.25)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white/95" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {authError && <p className="text-brand-rose text-xs mt-4 font-bold bg-[#FDF1F2] border border-brand-rose/10 p-2.5 rounded-xl">{authError}</p>}

              <div className="mt-8 pt-6 border-t border-[#E5D5C8]/50 text-[10.5px] text-[#A67E6B] font-medium leading-relaxed">
                🔒 Single-admin authentication via Supabase Auth.<br />
                Access is granted by verifying your <span className="font-mono">admin_users</span> record.
              </div>
            </>
          ) : (
            /* ── DEMO MODE: no password, clearly labeled ── */
            <>
              <h1 className="font-serif text-2xl font-extrabold text-brand-dark tracking-tight mb-2">Admin Console — Demo Mode</h1>

              <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 flex gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-amber-800 leading-relaxed">
                  <span className="font-bold uppercase tracking-wide">Not secure — demo only.</span> Supabase Auth is not
                  configured. Click below to preview the admin console without a password.
                  Real security requires server-side authentication.
                </p>
              </div>

              <button
                id="demo-login-btn"
                onClick={() => demoLogin()}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-brand-rose hover:bg-brand-berry text-white rounded-xl transition-all duration-150 shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-rose/20 font-bold text-sm"
              >
                <ShieldCheck className="w-5 h-5" />
                Enter Demo Mode
              </button>

              <div className="mt-8 pt-6 border-t border-[#E5D5C8]/50 text-[10.5px] text-[#A67E6B] font-medium leading-relaxed">
                To enable real authentication, set <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
                <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> and add your account to Supabase Auth.
              </div>
            </>
          )}
        </div>

      ) : (

        /* ═══════════════════════════════════════════ */
        /* 🛠️  AUTHENTICATED ADMIN CMS CONSOLE         */
        /* ═══════════════════════════════════════════ */
        <div className="space-y-8 animate-fade-in">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5D5C8]/40 pb-5 gap-4">
            <div>
              <div className="flex items-center flex-wrap gap-1.5 text-brand-rose text-xs font-extrabold uppercase tracking-widest pl-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Admin Portal Active</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-brand-dark mt-1 flex items-center gap-2">
                {currentAdminUser ? currentAdminUser.name : 'Cartiae Rae'}{' '}
                <span className="text-brand-rose font-light italic">CMS Dashboard</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start flex-wrap">
              {/* View Storefront */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-transparent rounded-xl transition-all duration-200 focus:outline-none shadow-xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>View Storefront</span>
              </a>

              {/* Sync to Mobile */}
              <button
                id="admin-sync-mobile-btn"
                onClick={handleManualCloudSync}
                disabled={isSyncingCloud}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-brand-dark bg-brand-pink-light hover:bg-brand-pink border border-brand-rose/30 rounded-xl transition-all duration-200 focus:outline-none shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Sync computer website state to cellphones and visitors"
              >
                {isSyncingCloud ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-rose" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-brand-rose" />
                )}
                <span>{isSyncingCloud ? 'Syncing...' : 'Sync to Mobile'}</span>
              </button>

              {/* Save All */}
              <button
                id="admin-save-all-btn"
                onClick={handleSaveAll}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-brand-rose hover:bg-[#C11A3F] border border-transparent rounded-xl transition-all duration-200 focus:outline-none shadow-xs hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </button>

              {/* Logout */}
              <button
                id="admin-logout-btn"
                onClick={logoutAdmin}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#4A2B20] hover:text-white bg-brand-cream hover:bg-brand-rose border border-[#E5D5C8] rounded-xl transition-all duration-200 focus:outline-none shadow-xs hover:border-transparent"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Console</span>
              </button>
            </div>
          </div>

          {/* ── Floating unsaved-changes bar ── */}
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-center justify-between gap-4 bg-[#1C1410] border border-brand-chocolate/60 px-5 py-3 rounded-2xl shadow-xl"
              >
                <span className="text-[11px] text-white font-semibold">
                  You have unsaved changes.
                </span>
                <button
                  onClick={handleSaveAll}
                  className="text-[11px] px-4 py-1.5 bg-brand-rose hover:bg-brand-berry text-white rounded-lg font-bold uppercase tracking-wider transition"
                >
                  Save All &amp; Publish
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Quick-stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: totalSales, prefix: '$', decimals: 2, note: 'All-time orders' },
              { label: 'Active Products', value: products.length + ebooks.length, decimals: 0, note: 'Physical + digital' },
              { label: 'Discount Codes', value: discountCodes.filter(d => d.isActive).length, decimals: 0, note: 'Active vouchers' },
              { label: 'Newsletter Subs', value: newsletterSignups.length, decimals: 0, note: 'Growth list hits' },
            ].map(({ label, value, prefix, decimals, note }) => (
              <div key={label} className="bg-white border border-[#E5D5C8]/60 rounded-2xl p-4 shadow-xs">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider mb-1">{label}</p>
                <p className="text-lg font-bold font-mono text-brand-dark">
                  {prefix}{<AnimatedAdminCounter value={value} decimals={decimals} prefersReducedMotion={prefersReducedMotion} />}
                </p>
                <span className="text-[9px] text-[#A67E6B] font-medium">{note}</span>
              </div>
            ))}
          </div>

          {/* ── Main Navigation ── */}
          <div className="flex border-b border-brand-warm-tan/20 pb-2.5 overflow-x-auto gap-6 sm:gap-8 scrollbar-none scroll-smooth">
            {([
              { id: 'overview', label: 'Overview Dashboard', Icon: TrendingUp },
              { id: 'catalog',  label: 'Catalog & Coupons',  Icon: ShoppingBag },
              { id: 'contacts', label: `Consult Inquiries (${contactRequests.filter(c => c.status === 'Pending').length})`, Icon: MessageSquare },
              { id: 'design',   label: 'Store Editor',        Icon: Settings },
            ] as const).map(({ id, label, Icon }) => (
              <motion.button
                key={id}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                  activeTab === id ? 'text-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {activeTab === id && !prefersReducedMotion && (
                  <motion.div layoutId="adminActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
                )}
                {activeTab === id && prefersReducedMotion && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
                )}
              </motion.button>
            ))}
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW — sub-tab pill bar         */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#E5D5C8]/25 border border-[#E5D5C8]/45 rounded-xl w-fit">
              {([
                { id: 'metrics',     label: 'Conversion Metrics' },
                { id: 'orders',      label: `Orders Tracker${pendingOrdersCount > 0 ? ` (${pendingOrdersCount})` : ''}` },
                { id: 'subscribers', label: 'Subscriber Logs' },
              ] as const).map(({ id, label }) => (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setOverviewSub(id)}
                  className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none ${
                    overviewSub === id ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                  }`}
                >
                  {overviewSub === id && !prefersReducedMotion && (
                    <motion.div layoutId="overviewActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                  )}
                  {overviewSub === id && prefersReducedMotion && (
                    <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                  )}
                  <span className="relative z-10">{label}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Overview Dashboard — renders all 3 sub-tabs internally */}
          {activeTab === 'overview' && (
            <OverviewDashboard overviewSub={overviewSub} />
          )}

          {/* ══════════════════════════════════════════ */}
          {/* TAB 2: CATALOG — sub-tab pill bar          */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === 'catalog' && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#E5D5C8]/25 border border-[#E5D5C8]/45 rounded-xl w-fit">
              {([
                { id: 'inventory', label: 'Shop Inventories', Icon: Package },
                { id: 'discounts', label: 'Voucher Coupons',  Icon: BadgePercent },
              ] as const).map(({ id, label, Icon }) => (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCatalogSub(id)}
                  className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                    catalogSub === id ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                  }`}
                >
                  {catalogSub === id && !prefersReducedMotion && (
                    <motion.div layoutId="catalogActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                  )}
                  {catalogSub === id && prefersReducedMotion && (
                    <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Inventory (products + eBooks) */}
          {activeTab === 'catalog' && catalogSub === 'inventory' && (
            <InventoryManager onDirtyChange={setInventoryDirty} />
          )}

          {/* Discount Codes */}
          {activeTab === 'catalog' && catalogSub === 'discounts' && (
            <DiscountManager />
          )}

          {/* ══════════════════════════════════════════ */}
          {/* TAB 3: CUSTOMER INQUIRIES                  */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === 'contacts' && (
            <ContactManager />
          )}

          {/* ══════════════════════════════════════════ */}
          {/* TAB 4: STORE EDITOR — sub-tab pill bar     */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === 'design' && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#E5D5C8]/25 border border-[#E5D5C8]/45 rounded-xl w-fit">
              {([
                { id: 'cms',      label: 'Homepage Copywriting',    Icon: Mail },
                { id: 'assets',   label: 'Videos & Photo Galleries', Icon: Image },
                { id: 'settings', label: 'Portal Settings',          Icon: Settings },
              ] as const).map(({ id, label, Icon }) => (
                <motion.button
                  key={id}
                  id={id === 'settings' ? 'portal-settings-subtab' : undefined}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDesignSub(id)}
                  className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                    designSub === id ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                  }`}
                >
                  {designSub === id && !prefersReducedMotion && (
                    <motion.div layoutId="designActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                  )}
                  {designSub === id && prefersReducedMotion && (
                    <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          )}

          {/* CMS: Homepage content + Blog */}
          {activeTab === 'design' && designSub === 'cms' && (
            <>
              <SiteContentManager onDirtyChange={setCmsDirty} />
              <BlogManager />
            </>
          )}

          {/* Media Assets: Videos + Gallery */}
          {activeTab === 'design' && designSub === 'assets' && (
            <div className="space-y-8">
              <VideoManager onDirtyChange={setVideoDirty} />
              <GalleryManager onDirtyChange={setGalleryDirty} />
            </div>
          )}

          {/* Settings */}
          {activeTab === 'design' && designSub === 'settings' && (
            <AdminSettings />
          )}

        </div>
      )}
    </div>
  );
};
