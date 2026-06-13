import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, EBook, DiscountCode, TikTokVideo, PhotoGalleryItem, ContactRequest } from '../types';
import { 
  ShieldCheck, Lock, LogOut, CheckCircle2, TrendingUp, ShoppingBag, 
  BookOpen, Mail, BadgePercent, Settings, Book, Package, Plus, 
  Trash2, Edit, Save, ToggleLeft, ToggleRight, ListFilter, RotateCcw, Sparkles,
  Video, Image, MessageSquare, Phone, MapPin, Camera, Eye, Archive, Inbox, Check
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    ebooks, products, discountCodes, homepageContent, newsletterSignups, orders, isAdminLoggedIn,
    videos, gallery, contactRequests,
    addEBook, updateEBook, deleteEBook,
    addProduct, updateProduct, deleteProduct,
    addVideo, deleteVideo,
    addGalleryItem, deleteGalleryItem,
    addDiscountCode, deleteDiscountCode,
    updateHomepageContent, fulfillOrder, loginAdmin, logoutAdmin,
    respondToContactRequest, deleteContactRequest, updateContactRequestStatus,
    emailNotificationsEnabled, setEmailNotificationsEnabled
  } = useApp();

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard Sub-tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'contacts' | 'design'>('overview');

  // Sub-tab selectors for nested views to keep the main layout clean and minimalist
  const [overviewSub, setOverviewSub] = useState<'metrics' | 'orders' | 'subscribers'>('metrics');
  const [catalogSub, setCatalogSub] = useState<'inventory' | 'discounts'>('inventory');
  const [designSub, setDesignSub] = useState<'cms' | 'assets' | 'settings'>('cms');

  // Contact requests filter state
  const [contactFilter, setContactFilter] = useState<'All' | 'Pending' | 'Responded' | 'Read' | 'Archived'>('All');

  // New Content Asset form states
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [vidTitle, setVidTitle] = useState('');
  const [vidViews, setVidViews] = useState('12.5K views');
  const [vidCategory, setVidCategory] = useState<'Wash Day' | 'Styling' | 'Protective Styles' | 'Growth Tips' | 'Cornrows' | 'Product Reviews' | 'Tutorials'>('Styling');
  const [vidUrl, setVidUrl] = useState('');
  const [vidThumb, setVidThumb] = useState('https://images.unsplash.com/photo-1522337360788-8b13edd793be?auto=format&fit=crop&q=80&w=800');

  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [galCaption, setGalCaption] = useState('');
  const [galCategory, setGalCategory] = useState<'Progress' | 'Hairstyles' | 'Routines' | 'Lifestyle'>('Progress');
  const [galImage, setGalImage] = useState('');

  // CMS editor states
  const [cmsHeroHead, setCmsHeroHead] = useState(homepageContent.heroHeadline);
  const [cmsHeroSub, setCmsHeroSub] = useState(homepageContent.heroSubheadline);
  const [cmsAboutHead, setCmsAboutHead] = useState(homepageContent.aboutHeadline);
  const [cmsAboutStory, setCmsAboutStory] = useState(homepageContent.aboutStory);
  const [cmsPromoQuote, setCmsPromoQuote] = useState(homepageContent.promoQuote);
  const [cmsPromoAuthor, setCmsPromoAuthor] = useState(homepageContent.promoAuthor);
  const [cmsSuccess, setCmsSuccess] = useState(false);

  // New catalog item drawers
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('19.99');
  const [prodCategory, setProdCategory] = useState('Hair Oils');
  const [prodDesc, setProdDesc] = useState('');
  const [prodStock, setProdStock] = useState('50');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800');

  const [isAddingEBook, setIsAddingEBook] = useState(false);
  const [ebName, setEbName] = useState('');
  const [ebPrice, setEbPrice] = useState('14.99');
  const [ebPages, setEbPages] = useState('100');
  const [ebDesc, setEbDesc] = useState('');
  const [ebSize, setEbSize] = useState('10 MB');
  const [ebImage, setEbImage] = useState('https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800');

  // New voucher discount state
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [discName, setDiscName] = useState('');
  const [discPercent, setDiscPercent] = useState('20');
  const [discDesc, setDiscDesc] = useState('');

  // --- Calculations ---
  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid administrative staff email.');
      return;
    }
    const success = loginAdmin(password);
    if (!success) {
      setAuthError('Incorrect system staff administrative credentials or password.');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleCmsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateHomepageContent({
      heroHeadline: cmsHeroHead,
      heroSubheadline: cmsHeroSub,
      aboutHeadline: cmsAboutHead,
      aboutStory: cmsAboutStory,
      promoQuote: cmsPromoQuote,
      promoAuthor: cmsPromoAuthor
    });
    setCmsSuccess(true);
    setTimeout(() => setCmsSuccess(false), 3000);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      id: `prod-${Date.now()}`,
      name: prodName,
      price: parseFloat(prodPrice) || 0,
      description: prodDesc,
      category: prodCategory,
      image: prodImage,
      stockStatus: (parseInt(prodStock) || 0) > 15 ? 'In Stock' : 'Low Stock',
      stockCount: parseInt(prodStock) || 0
    });
    // Reset values
    setProdName('');
    setProdPrice('19.99');
    setProdDesc('');
    setProdStock('50');
    setIsAddingProduct(false);
  };

  const handleAddEBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEBook({
      id: `ebook-${Date.now()}`,
      name: ebName,
      price: parseFloat(ebPrice) || 0,
      description: ebDesc,
      image: ebImage,
      pages: parseInt(ebPages) || 120,
      fileSize: ebSize,
      benefits: [
        'Detailed step-by-step master hair guides',
        'Porosity hydration logs and charts',
        'Maximum hair follicle safety guidelines'
      ],
      pdfUrl: `${ebName.toLowerCase().replace(/\s+/g, '_')}_guide.pdf`
    });
    // Reset values
    setEbName('');
    setEbPrice('14.99');
    setEbPages('100');
    setEbDesc('');
    setIsAddingEBook(false);
  };

  const handleAddDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDiscountCode({
      code: discName.toUpperCase().trim(),
      discountPercent: parseInt(discPercent) || 15,
      isActive: true,
      description: discDesc
    });
    setDiscName('');
    setDiscPercent('20');
    setDiscDesc('');
    setIsAddingDiscount(false);
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle || !vidUrl) return;
    addVideo({
      title: vidTitle,
      views: vidViews,
      category: vidCategory,
      videoUrl: vidUrl,
      thumbnailUrl: vidThumb
    });
    setVidTitle('');
    setVidUrl('');
    setIsAddingVideo(false);
  };

  const handleAddGallerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galCaption || !galImage) return;
    addGalleryItem({
      image: galImage,
      caption: galCaption,
      category: galCategory
    });
    setGalCaption('');
    setGalImage('');
    setIsAddingGallery(false);
  };

  const handleAdminAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* ======================================= */}
      {/* 🔒 1. ADMIN LOGIN PANEL FORM STRUCTURE  */}
      {/* ======================================= */}
      {!isAdminLoggedIn ? (
        <div className="max-w-md mx-auto bg-gradient-to-b from-white to-[#FDFBF9] border border-[#E5D5C8]/75 rounded-3xl p-6 sm:p-10 shadow-[0_12px_40px_rgba(74,43,32,0.06)] text-center mt-12 relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-rose via-brand-pink to-brand-chocolate"></div>
          
          <div className="w-14 h-14 bg-brand-pink-light border border-brand-pink/20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Lock className="w-6 h-6 text-brand-rose" />
          </div>

          <h1 className="font-serif text-2xl font-extrabold text-brand-dark tracking-tight mb-2">Cartiae Rae Staff Authorization</h1>
          <p className="font-sans text-xs text-[#8C6D62] leading-relaxed max-w-xs mx-auto mb-8">
            Authorized administrative entrance. Insert verified credentials to update catalog inventories, edit storefront copy fields, and review consultations.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="text-left space-y-4">
              <div>
                <label className="block text-[10px] tracking-wider uppercase font-extrabold text-[#8C6D62] mb-1.5 pl-1">Staff Email Address</label>
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  placeholder="e.g. admin@cartiae.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E5D5C8] text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-center font-sans transition-all duration-150 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-wider uppercase font-extrabold text-[#8C6D62] mb-1.5 pl-1">Administrative Password</label>
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  placeholder="Insert secret staff key to entry"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E5D5C8] text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-center font-mono transition-all duration-150 shadow-xs"
                />
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full bg-gradient-to-r from-brand-rose to-brand-berry hover:from-brand-berry hover:to-brand-rose text-white py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none shadow-[0_4px_12px_rgba(194,57,90,0.18)] hover:shadow-[0_6px_16px_rgba(194,57,90,0.25)] hover:-translate-y-0.5"
            >
              <ShieldCheck className="w-4 h-4 text-white/95" />
              <span>Verify Authorization</span>
            </button>
          </form>

          {authError && <p className="text-brand-rose text-xs mt-4 font-bold bg-[#FDF1F2] border border-brand-rose/10 p-2.5 rounded-xl">{authError}</p>}
          
          <div className="mt-8 pt-6 border-t border-[#E5D5C8]/50 text-[10.5px] text-[#A67E6B] font-medium leading-relaxed">
            🔒 Standalone Sandbox Simulation Mode Active.<br />
            Use <strong className="font-bold underline text-brand-rose">any email</strong> and password <strong className="font-bold underline text-brand-rose">admin</strong> to login.
          </div>
        </div>
      ) : (
        
        // =======================================
        // 🛠️ 2. AUTHENTICATED STAFF CMS CONSOLE
        // =======================================
        <div className="space-y-8 animate-fade-in">
          
          {/* Header row with logouts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5D5C8]/40 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-brand-rose text-xs font-extrabold uppercase tracking-widest pl-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Authorized Staff Portal Active</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-brand-dark mt-1 flex items-center gap-2">
                Cartiae Rae <span className="text-brand-rose font-light italic">CMS Dashboard</span>
              </h1>
            </div>

            <button
              id="admin-logout-btn"
              onClick={logoutAdmin}
              className="flex items-center justify-center gap-1.5 self-start px-4.5 py-2.5 text-xs font-bold text-[#4A2B20] hover:text-white bg-brand-cream hover:bg-brand-rose border border-[#E5D5C8] rounded-xl transition-all duration-200 focus:outline-none shadow-xs hover:border-transparent"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Console</span>
            </button>
          </div>

          {/* Quick Stats Metric Cards banner */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border-l-4 border-l-emerald-600 border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">Total Revenue</p>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">${totalSales.toFixed(2)}</p>
            </div>
            
            <div className="bg-white border-l-4 border-l-brand-rose border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">Total Orders</p>
                <ShoppingBag className="w-4 h-4 text-brand-rose" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">{orders.length}</p>
              <span className="text-[9px] text-[#C2395A] bg-brand-pink-light font-extrabold px-1.5 py-0.5 rounded-md mt-1.5 inline-block">
                {pendingOrdersCount} Awaiting Shipment
              </span>
            </div>

            <div className="bg-white border-l-4 border-l-[#4A2B20] border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">eBooks Catalog</p>
                <BookOpen className="w-4 h-4 text-[#4A2B20]" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">{ebooks.length}</p>
              <span className="text-[9px] text-[#8C6D62] bg-[#FAF6F0] font-bold px-1.5 py-0.5 rounded-md mt-1.5 inline-block">Guides Published</span>
            </div>

            <div className="bg-white border-l-4 border-l-brand-pink border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">Products Stock</p>
                <Package className="w-4 h-4 text-brand-pink" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">{products.length}</p>
              <span className="text-[9px] text-emerald-800 bg-emerald-50 font-bold px-1.5 py-0.5 rounded-md mt-1.5 inline-block">Botanical Retail</span>
            </div>

            <div className="bg-white border-l-4 border-l-brand-berry border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] hover:shadow-md transition duration-200 col-span-2 md:col-span-1">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">Newsletter Subs</p>
                <Mail className="w-4 h-4 text-brand-berry animate-pulse" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">{newsletterSignups.length + 42}</p>
              <span className="text-[9px] text-brand-berry bg-brand-pink-light font-bold px-1.5 py-0.5 rounded-md mt-1.5 inline-block">Growth List Hits</span>
            </div>
          </div>

          {/* Simplified Main Navigation tabs */}
          <div className="flex border-b border-brand-warm-tan/20 pb-2.5 overflow-x-auto gap-6 sm:gap-8 scrollbar-none scroll-smooth">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'overview' ? 'text-brand-rose border-b-2 border-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Overview Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'catalog' ? 'text-brand-rose border-b-2 border-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Catalog & Coupons</span>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'contacts' ? 'text-brand-rose border-b-2 border-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Consult Inquiries ({contactRequests.filter(c => c.status === 'Pending').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'design' ? 'text-brand-rose border-b-2 border-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Store Editor</span>
            </button>
          </div>

          {/* ======================================= */}
          {/* TAB 1: OVERVIEW COMPOSITE PAGE          */}
          {/* ======================================= */}
          {activeTab === 'overview' && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#E5D5C8]/25 border border-[#E5D5C8]/45 rounded-xl w-fit">
              <button
                onClick={() => setOverviewSub('metrics')}
                className={`px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none ${
                  overviewSub === 'metrics'
                    ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.2)]'
                    : 'text-brand-chocolate hover:text-brand-rose hover:bg-white/40'
                }`}
              >
                Conversion Metrics
              </button>
              <button
                onClick={() => setOverviewSub('orders')}
                className={`px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  overviewSub === 'orders'
                    ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.2)]'
                    : 'text-brand-chocolate hover:text-brand-rose hover:bg-white/40'
                }`}
              >
                <span>Orders Tracker</span>
                {pendingOrdersCount > 0 && (
                  <span className="bg-brand-berry text-white text-[9.5px] font-mono px-2 py-0.5 rounded-full inline-block font-black">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setOverviewSub('subscribers')}
                className={`px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none ${
                  overviewSub === 'subscribers'
                    ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.2)]'
                    : 'text-brand-chocolate hover:text-brand-rose hover:bg-white/40'
                }`}
              >
                Subscriber Logs
              </button>
            </div>
          )}

          {activeTab === 'overview' && overviewSub === 'metrics' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
              <h2 className="font-serif text-lg font-bold text-brand-dark border-b border-[#E5D5C8]/30 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                Business Health Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* sales summary info */}
                <div className="bg-[#FAF7F2] p-5.5 rounded-2xl border border-[#E5D5C8]/30 space-y-4">
                  <h3 className="font-serif text-sm font-bold text-brand-chocolate tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-brand-rose rounded-full"></span>
                    Conversion Funnels
                  </h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-[#E5D5C8]/35 pb-2 text-[#8C6D62]">
                      <span className="font-medium">Live Site Traffic Hits (Weekly)</span>
                      <span className="font-mono font-bold text-brand-dark">4,281 hits</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E5D5C8]/35 pb-2 text-[#8C6D62]">
                      <span className="font-medium">Newsletter Conversion Rate</span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">4.82%</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E5D5C8]/35 pb-2 text-[#8C6D62]">
                      <span className="font-medium">Digital eBook Downloads (All Time)</span>
                      <span className="font-mono font-bold text-brand-dark">1,029 units</span>
                    </div>
                    <div className="flex justify-between text-[#8C6D62] pt-0.5">
                      <span className="font-medium">Botanical Oil Retail Stock Rate</span>
                      <span className="font-mono font-black text-brand-rose bg-brand-pink-light px-2 py-0.5 rounded">84% packed</span>
                    </div>
                  </div>
                </div>

                {/* sandbox explanation */}
                <div className="bg-brand-dark text-white p-6 rounded-2xl border border-brand-chocolate/40 relative overflow-hidden flex flex-col justify-between shadow-md">
                  <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-brand-chocolate opacity-20 rounded-full blur-2xl"></div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-brand-pink flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 fill-brand-pink text-brand-pink animate-pulse" /> 
                      100% Client-Side Persistence
                    </h3>
                    <p className="text-[11.5px] text-brand-beige/85 mt-3 leading-relaxed font-sans">
                      Changes made in these tabs commit instantly to local storage structures. Add objects, fulfill physical order lists, modify discount cards, or rewrite copy — and check the live storefront tabs to witness your updates!
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-[#C5A880] font-mono uppercase tracking-wider">System Sandbox Mode</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-white/5 px-2.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 2: CATALOG & PROMOTIONS COMPOSITE   */}
          {/* ======================================= */}
          {activeTab === 'catalog' && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#E5D5C8]/25 border border-[#E5D5C8]/45 rounded-xl w-fit">
              <button
                onClick={() => setCatalogSub('inventory')}
                className={`px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  catalogSub === 'inventory'
                    ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.2)]'
                    : 'text-brand-chocolate hover:text-brand-rose hover:bg-white/40'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Shop Inventories</span>
              </button>
              <button
                onClick={() => setCatalogSub('discounts')}
                className={`px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  catalogSub === 'discounts'
                    ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.2)]'
                    : 'text-brand-chocolate hover:text-brand-rose hover:bg-white/40'
                }`}
              >
                <BadgePercent className="w-3.5 h-3.5" />
                <span>Voucher Coupons</span>
              </button>
            </div>
          )}

          {activeTab === 'catalog' && catalogSub === 'inventory' && (
            <div className="space-y-8">
              
              {/* Product list */}
              <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
                <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                    Physical Products Catalog
                  </h3>
                  <button
                    id="add-prod-catalog-btn"
                    onClick={() => setIsAddingProduct(!isAddingProduct)}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Product</span>
                  </button>
                </div>

                {/* Add new product sliding form panel */}
                {isAddingProduct && (
                  <form onSubmit={handleAddProductSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
                    <p className="font-serif font-bold text-brand-chocolate">New Product Parameters:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Product Title</label>
                        <input
                          type="text"
                          required
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="e.g. Aloe Moisture Spray"
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Retail Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category collection</label>
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        >
                          <option>Hair Oils</option>
                          <option>Accessories</option>
                          <option>Treatments</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Brief Description</label>
                        <input
                          type="text"
                          required
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          placeholder="Potent hydration mist to prevent day-time split ends..."
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Initial Stock Count</label>
                        <input
                          type="number"
                          required
                          value={prodStock}
                          onChange={(e) => setProdStock(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="px-4 py-2 border border-brand-warm-tan hover:bg-brand-cream rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase transition"
                      >
                        Commit Item
                      </button>
                    </div>
                  </form>
                )}

                {/* Products list table */}
                <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                        <th className="p-3">Reference Photo</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Stock Count</th>
                        <th className="p-3">Retail Price</th>
                        <th className="p-3 text-center">Catalog actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-brand-cream/30">
                          <td className="p-3">
                            <img src={p.image} referrerPolicy="no-referrer" alt={p.name} className="w-10 h-10 object-cover rounded border border-brand-warm-tan/30" />
                          </td>
                          <td className="p-3 font-semibold">{p.name}</td>
                          <td className="p-3">{p.category}</td>
                          <td className="p-3 font-mono">
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              p.stockCount === 0 ? 'bg-red-50 text-red-700' : p.stockCount <= 15 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {p.stockCount} ({p.stockStatus})
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold">${p.price.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button
                              id={`delete-prod-list-${p.id}`}
                              onClick={() => {
                                if (confirm(`Delete physical "${p.name}" from catalog?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* eBook list */}
              <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
                <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                    Digital eBooks Catalog
                  </h3>
                  <button
                    id="add-ebook-catalog-btn"
                    onClick={() => setIsAddingEBook(!isAddingEBook)}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create eBook Guide</span>
                  </button>
                </div>

                {/* Add new ebook sliding form panel */}
                {isAddingEBook && (
                  <form onSubmit={handleAddEBookSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
                    <p className="font-serif font-bold text-brand-chocolate">New eBook Parameters:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">eBook Title</label>
                        <input
                          type="text"
                          required
                          value={ebName}
                          onChange={(e) => setEbName(e.target.value)}
                          placeholder="e.g. Scalp Massage Masterclass"
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Purchase Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={ebPrice}
                          onChange={(e) => setEbPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Total Pages count</label>
                        <input
                          type="number"
                          required
                          value={ebPages}
                          onChange={(e) => setEbPages(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Catalog Description</label>
                        <input
                          type="text"
                          required
                          value={ebDesc}
                          onChange={(e) => setEbDesc(e.target.value)}
                          placeholder="Learn precise hand-stimulation frequencies that promote..."
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">File Size Spec (e.g. 5.4 MB)</label>
                        <input
                          type="text"
                          required
                          value={ebSize}
                          onChange={(e) => setEbSize(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => setIsAddingEBook(false)}
                        className="px-4 py-2 border border-brand-warm-tan hover:bg-brand-cream rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase transition"
                      >
                        Commit eBook
                      </button>
                    </div>
                  </form>
                )}

                {/* eBooks list table */}
                <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                        <th className="p-3">Cover Graphic</th>
                        <th className="p-3">EBook Title</th>
                        <th className="p-3">Pages Count</th>
                        <th className="p-3">File Size</th>
                        <th className="p-3">Retail Price</th>
                        <th className="p-3 text-center">Catalog actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
                      {ebooks.map((e) => (
                        <tr key={e.id} className="hover:bg-brand-cream/30">
                          <td className="p-3">
                            <img src={e.image} referrerPolicy="no-referrer" alt={e.name} className="w-9 h-11 object-cover rounded border border-brand-warm-tan/30" />
                          </td>
                          <td className="p-3 font-semibold">{e.name}</td>
                          <td className="p-3 font-mono">{e.pages} pages</td>
                          <td className="p-3 font-mono">{e.fileSize}</td>
                          <td className="p-3 font-mono font-bold">${e.price.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button
                              id={`delete-ebook-list-${e.id}`}
                              onClick={() => {
                                if (confirm(`Remove digital textbook "${e.name}" from catalog?`)) {
                                  deleteEBook(e.id);
                                }
                              }}
                              className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================================== */}
          {/* OVERVIEW SYSTEM COMPONENT: CUSTOMER ORDERS LIST */}
          {/* ============================================== */}
          {activeTab === 'overview' && overviewSub === 'orders' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
              <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-[#E5D5C8]/30 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-600 rounded-full animate-pulse"></span>
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
                              onClick={() => {
                                fulfillOrder(o.id);
                              }}
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
          )}

          {/* ==================================================== */}
          {/* CATALOG COMPONENT: MANUAL VOUCHER PROMO DISCOUNTS    */}
          {/* ==================================================== */}
          {activeTab === 'catalog' && catalogSub === 'discounts' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
              <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
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
                            {c.isActive ? 'Enabled / Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            id={`delete-discount-${c.id}`}
                            onClick={() => {
                              if (confirm(`Remove promo Coupon "${c.code}" completely?`)) {
                                deleteDiscountCode(c.id);
                              }
                            }}
                            className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 4: STORE EDITOR & CMS COMPOSITE     */}
          {/* ======================================= */}
          {activeTab === 'design' && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#E5D5C8]/25 border border-[#E5D5C8]/45 rounded-xl w-fit">
              <button
                onClick={() => setDesignSub('cms')}
                className={`px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  designSub === 'cms'
                    ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.2)]'
                    : 'text-brand-chocolate hover:text-brand-rose hover:bg-white/40'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Homepage Copywriting</span>
              </button>
              <button
                onClick={() => setDesignSub('assets')}
                className={`px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  designSub === 'assets'
                    ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.2)]'
                    : 'text-brand-chocolate hover:text-brand-rose hover:bg-white/40'
                }`}
              >
                <Image className="w-3.5 h-3.5" />
                <span>Videos & Photo Galleries</span>
              </button>
              <button
                id="portal-settings-subtab"
                onClick={() => setDesignSub('settings')}
                className={`px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  designSub === 'settings'
                    ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.2)]'
                    : 'text-brand-chocolate hover:text-brand-rose hover:bg-white/40'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Portal Settings</span>
              </button>
            </div>
          )}

          {activeTab === 'design' && designSub === 'cms' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
              <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-[#E5D5C8]/30 pb-3 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                Front-Page Content Management Block
              </h3>

              <form onSubmit={handleCmsUpdate} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Hero Main Bold Title</label>
                    <textarea
                      rows={2}
                      value={cmsHeroHead}
                      onChange={(e) => setCmsHeroHead(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none text-brand-dark font-semibold leading-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Hero Sub-headline message</label>
                    <textarea
                      rows={2}
                      value={cmsHeroSub}
                      onChange={(e) => setCmsHeroSub(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none text-brand-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">About Headline Intro text</label>
                    <input
                      type="text"
                      value={cmsAboutHead}
                      onChange={(e) => setCmsAboutHead(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none text-brand-dark font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Customer Showcase Quotation</label>
                    <input
                      type="text"
                      value={cmsPromoQuote}
                      onChange={(e) => setCmsPromoQuote(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none text-brand-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">About Long Narrative Bio Story *</label>
                  <textarea
                    rows={6}
                    value={cmsAboutStory}
                    onChange={(e) => setCmsAboutStory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none text-brand-dark leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-brand-warm-tan/20">
                  <span className="text-[10px] text-[#A67E6B]">🔒 Changes take effect instantly globally on homepage view.</span>
                  
                  <button
                    id="save-cms-copy-btn"
                    type="submit"
                    className="bg-brand-rose hover:bg-brand-berry text-white py-2 px-6 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 focus:outline-none"
                  >
                    <Save className="w-4 h-4" />
                    <span>Apply Site Text Commit</span>
                  </button>
                </div>
              </form>

              {cmsSuccess && (
                <p className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg text-center font-medium animate-bounce">
                  ✓ Website Text Copy updated successfully on CMS live environment!
                </p>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* OVERVIEW SYSTEM COMPONENT: SUBSCRIBERS EMAIL DIRECTORY */}
          {/* =================================================== */}
          {activeTab === 'overview' && overviewSub === 'subscribers' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
              <h3 className="font-serif text-lg font-bold text-brand-dark border-b border-[#E5D5C8]/30 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-brand-rose rounded-full animate-pulse"></span>
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
                    {/* Simulated lists */}
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
          )}

          {/* ======================================= */}
          {/* STORE EDITOR COMPONENT: A/V MEDIA ASSETS */}
          {/* ======================================= */}
          {activeTab === 'design' && designSub === 'assets' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Panel: TikTok / Reels Creator */}
              <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
                <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                    TikTok & Video Feeds
                  </h3>
                  <button
                    onClick={() => setIsAddingVideo(!isAddingVideo)}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Video</span>
                  </button>
                </div>

                {isAddingVideo && (
                  <form onSubmit={handleAddVideoSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
                    <p className="font-serif font-bold text-brand-chocolate">Publish Video Card:</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Video Title Headline</label>
                        <input
                          type="text"
                          required
                          value={vidTitle}
                          onChange={(e) => setVidTitle(e.target.value)}
                          placeholder="e.g. 3 Steps to Seal Low Porosity 4C Hair"
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Simulated Views (e.g. 24.8K)</label>
                          <input
                            type="text"
                            required
                            value={vidViews}
                            onChange={(e) => setVidViews(e.target.value)}
                            className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Collection Topic</label>
                          <select
                            value={vidCategory}
                            onChange={(e) => setVidCategory(e.target.value as any)}
                            className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none font-semibold text-brand-chocolate"
                          >
                            <option>Wash Day</option>
                            <option>Styling</option>
                            <option>Protective Styles</option>
                            <option>Growth Tips</option>
                            <option>Cornrows</option>
                            <option>Product Reviews</option>
                            <option>Tutorials</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Video Link URL (e.g. TikTok / Instagram copy link)</label>
                        <input
                          type="url"
                          required
                          value={vidUrl}
                          onChange={(e) => setVidUrl(e.target.value)}
                          placeholder="https://www.tiktok.com/@cartiae/video/..."
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Reference Poster Thumbnail URL</label>
                        <input
                          type="url"
                          required
                          value={vidThumb}
                          onChange={(e) => setVidThumb(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => setIsAddingVideo(false)}
                        className="px-3 py-1.5 border border-brand-warm-tan hover:bg-brand-cream rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase"
                      >
                        Publish Video
                      </button>
                    </div>
                  </form>
                )}

                {/* Video assets table list */}
                <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                        <th className="p-3">Poster</th>
                        <th className="p-3">Video Title / Category</th>
                        <th className="p-3">Views</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
                      {videos.map((vid) => (
                        <tr key={vid.id} className="hover:bg-brand-cream/30">
                          <td className="p-3">
                            <img src={vid.thumbnailUrl || vidThumb} referrerPolicy="no-referrer" alt="" className="w-12 h-14 object-cover rounded border border-brand-warm-tan/20" />
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-brand-chocolate">{vid.title}</p>
                            <span className="text-[9px] uppercase tracking-wider text-brand-rose font-bold block mt-0.5">{vid.category}</span>
                          </td>
                          <td className="p-3 font-mono">{vid.views}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`Remove video "${vid.title}"?`)) {
                                  deleteVideo(vid.id);
                                }
                              }}
                              className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md text-[11px] font-bold transition duration-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Panel: Photo Gallery Showcase Creator */}
              <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
                <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                    Image Gallery Showcase
                  </h3>
                  <button
                    onClick={() => setIsAddingGallery(!isAddingGallery)}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                {isAddingGallery && (
                  <form onSubmit={handleAddGallerySubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
                    <p className="font-serif font-bold text-brand-chocolate">Upload Gallery Photo:</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C6D62] mb-1">Caption Description</label>
                        <input
                          type="text"
                          required
                          value={galCaption}
                          onChange={(e) => setGalCaption(e.target.value)}
                          placeholder="e.g. 5-Month low porosity length retention results"
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8C6D62] mb-1">Gallery Section Category</label>
                        <select
                          value={galCategory}
                          onChange={(e) => setGalCategory(e.target.value as any)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none font-semibold text-brand-chocolate"
                        >
                          <option>Progress</option>
                          <option>Hairstyles</option>
                          <option>Routines</option>
                          <option>Lifestyle</option>
                        </select>
                      </div>
                      
                      {/* Dual upload or url fields */}
                      <div className="border border-brand-warm-tan/30 p-3 rounded-xl space-y-2 bg-white/70">
                        <p className="font-bold text-[10px] uppercase text-[#7C6354]">Photo Source File:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="flex flex-col items-center justify-center border border-dashed border-brand-warm-tan/50 bg-[#FAF6F0] rounded-lg p-3 cursor-pointer hover:border-brand-rose/40">
                            <Camera className="w-4 h-4 text-brand-rose mb-0.5" />
                            <span className="text-[10px] font-bold text-brand-chocolate">Upload Local File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAdminAssetUpload}
                              className="hidden"
                            />
                          </label>
                          <div className="flex flex-col justify-center">
                            <span className="text-[9.5px] font-bold text-[#7C6354] uppercase mb-1">Or Insert URL Link</span>
                            <input
                              type="url"
                              placeholder="https://example.com/photo.jpg"
                              value={galImage.startsWith('data:') ? '' : galImage}
                              onChange={(e) => setGalImage(e.target.value)}
                              className="px-2 py-1.5 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        {galImage && (
                          <div className="flex items-center gap-2 pt-2">
                            <img src={galImage} alt="" className="w-8 h-8 object-cover rounded border border-brand-warm-tan/20" />
                            <span className="text-[9px] text-emerald-800 font-bold">✓ image linked successful</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => setIsAddingGallery(false)}
                        className="px-3 py-1.5 border border-brand-warm-tan hover:bg-brand-cream rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase"
                      >
                        Publish Photo
                      </button>
                    </div>
                  </form>
                )}

                {/* Photo showcase lists */}
                <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                        <th className="p-3">Photo</th>
                        <th className="p-3">Caption description</th>
                        <th className="p-3">Section</th>
                        <th className="p-3 text-center">Fulfill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
                      {gallery.map((gObj) => (
                        <tr key={gObj.id} className="hover:bg-brand-cream/30">
                          <td className="p-3">
                            <img src={gObj.image} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-cover rounded border border-brand-warm-tan/20" />
                          </td>
                          <td className="p-3 font-semibold line-clamp-1 max-w-[200px]">{gObj.caption}</td>
                          <td className="p-3 font-mono">{gObj.category}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`Remove photo "${gObj.caption}"?`)) {
                                  deleteGalleryItem(gObj.id);
                                }
                              }}
                              className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md text-[11px] font-bold transition duration-200"
                            >
                              Dismiss
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* STORE EDITOR COMPONENT: PORTAL SETTINGS             */}
          {/* ==================================================== */}
          {activeTab === 'design' && designSub === 'settings' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)] max-w-2xl animate-fade-in">
              <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                  Administrative Portal Settings
                </h3>
              </div>
              
              <p className="text-xs text-[#8C6D62] leading-relaxed">
                Configure back-office notification preference rules and simulation triggers for the <strong>Cartiae Rae</strong> brand registry.
              </p>

              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E5D5C8]/40 p-5 mt-4 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-serif text-sm font-bold text-brand-dark flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-brand-rose" />
                      Contact Submissions Email Notifications
                    </h4>
                    <p className="text-[11px] text-[#8C6D62] leading-relaxed max-w-md">
                      When enabled, the platform triggers a visual e-mail dispatcher simulation and delivers responsive toast log updates to the creator whenever customers submit natural advice porosity forms.
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

              {/* Quick simulation card */}
              <div className="border border-[#E5D5C8]/50 rounded-2xl p-5 space-y-3 bg-[#FAF7F2]/40 text-xs">
                <h4 className="font-serif font-bold text-brand-dark">How to test this trigger:</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-[#8C6D62] leading-relaxed text-[11px]">
                  <li>Navigate to the <span className="font-semibold text-brand-rose">Contact Studio</span> tab in the main shop storefront menu.</li>
                  <li>Inquire through the <strong>Porosity advice desk</strong> form by filling your name, porosity type, and natural hair questions.</li>
                  <li>Click submit to trigger either an immediate <strong>✉ Dispatch email log</strong> toast or a silent request submission based on this setting!</li>
                </ol>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* TAB 8: CUSTOMER INQUIRIES & ADVICE DESK */}
          {/* ======================================= */}
          {activeTab === 'contacts' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center border-b border-[#E5D5C8]/30 pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-dark flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                    Received Porosity Advice Consultations
                  </h3>
                  <p className="text-xs text-[#8C6D62] mt-0.5">Organize customer hair porosity and advice inquiries.</p>
                </div>
                
                {/* Status Selector Filters */}
                <div className="flex flex-wrap gap-1 bg-brand-beige/45 p-1 rounded-xl border border-brand-warm-tan/20">
                  {(['All', 'Pending', 'Responded', 'Read', 'Archived'] as const).map((filterOpt) => {
                    const count = filterOpt === 'All' 
                      ? contactRequests.length 
                      : contactRequests.filter(c => c.status === filterOpt).length;
                    return (
                      <button
                        key={filterOpt}
                        onClick={() => setContactFilter(filterOpt)}
                        className={`px-3 py-1.5 text-[10.5px] font-extrabold uppercase rounded-lg transition-all focus:outline-none ${
                          contactFilter === filterOpt
                            ? 'bg-brand-rose text-white shadow-sm'
                            : 'text-[#8C6D62] hover:bg-brand-cream/60'
                        }`}
                      >
                        {filterOpt} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {contactRequests.length === 0 ? (
                <div className="p-10 text-center text-[#A67E6B] font-medium italic">
                  No porosity requests received so far.
                </div>
              ) : contactRequests.filter(c => contactFilter === 'All' || c.status === contactFilter).length === 0 ? (
                <div className="p-10 text-center text-[#A67E6B] font-medium italic bg-white/40 border border-dashed border-brand-warm-tan/20 rounded-2xl">
                  No inquiries with status &quot;{contactFilter}&quot; currently list.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contactRequests
                    .filter(c => contactFilter === 'All' || c.status === contactFilter)
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
                          {/* Badge Status indicator */}
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

                          {/* Quick Action Operations */}
                          <div className="flex flex-wrap gap-1.5 justify-end w-full sm:w-auto">
                            {/* Mark read button */}
                            {req.status === 'Pending' && (
                              <button
                                onClick={() => {
                                  updateContactRequestStatus(req.id, 'Read');
                                }}
                                className="p-1 px-2.5 bg-[#FAF6F0] hover:bg-white text-brand-chocolate hover:text-brand-rose border border-brand-warm-tan/30 rounded-lg text-[10px] font-extrabold uppercase transition duration-150 flex items-center gap-1 focus:outline-none"
                                title="Mark read"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Read</span>
                              </button>
                            )}

                            {/* Mark responded replied button */}
                            {req.status !== 'Responded' && req.status !== 'Archived' && (
                              <button
                                onClick={() => {
                                  updateContactRequestStatus(req.id, 'Responded');
                                }}
                                className="p-1 px-2.5 bg-brand-chocolate hover:bg-brand-berry text-white rounded-lg text-[10px] font-extrabold uppercase transition duration-150 flex items-center gap-1 focus:outline-none"
                                title="Mark Replied"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Reply</span>
                              </button>
                            )}

                            {/* Archive toggle button */}
                            {req.status !== 'Archived' ? (
                              <button
                                onClick={() => {
                                  updateContactRequestStatus(req.id, 'Archived');
                                }}
                                className="p-1 px-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-brand-chocolate border border-zinc-200 rounded-lg text-[10px] font-extrabold uppercase transition duration-150 flex items-center gap-1 focus:outline-none"
                                title="Archive interaction"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archive</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  updateContactRequestStatus(req.id, 'Pending');
                                }}
                                className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white border border-brand-rose/20 rounded-lg text-[10px] font-extrabold uppercase transition duration-150 flex items-center gap-1 focus:outline-none"
                                title="Restore to pending folder"
                              >
                                <Inbox className="w-3.5 h-3.5" />
                                <span>Reopen</span>
                              </button>
                            )}

                            {/* Delete inquiry */}
                            <button
                              onClick={() => {
                                if (confirm('Permanently delete this customer query?')) {
                                  deleteContactRequest(req.id);
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
          )}

        </div>
      )}

    </div>
  );
};
