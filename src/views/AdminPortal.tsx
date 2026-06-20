import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Product, EBook, DiscountCode, TikTokVideo, PhotoGalleryItem, ContactRequest, AdminRole } from '../types';
import { 
  ShieldCheck, Lock, LogOut, CheckCircle2, TrendingUp, ShoppingBag, 
  BookOpen, Mail, BadgePercent, Settings, Book, Package, Plus, 
  Trash2, Edit, Save, ToggleLeft, ToggleRight, ListFilter, RotateCcw, Sparkles,
  Video, Image, MessageSquare, Phone, MapPin, Camera, Eye, Archive, Inbox, Check,
  Globe, Radio
} from 'lucide-react';

// Resolve video types and parameters for YT, TikTok, or direct video
const resolveVideoSource = (url: string) => {
  const cleanUrl = url.trim();
  
  // 1. Raw TikTok video ID check (18-20 digits)
  if (/^\d{18,20}$/.test(cleanUrl)) {
    return {
      type: 'tiktok' as const,
      id: cleanUrl,
      url: `https://www.tiktok.com/embed/v2/${cleanUrl}`
    };
  }

  // 2. YouTube
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let videoId = '';
    if (cleanUrl.includes('/embed/')) {
      videoId = cleanUrl.split('/embed/')[1]?.split('?')[0] || '';
    } else if (cleanUrl.includes('/shorts/')) {
      videoId = cleanUrl.split('/shorts/')[1]?.split('?')[0] || '';
    } else if (cleanUrl.includes('watch?v=')) {
      videoId = cleanUrl.split('watch?v=')[1]?.split('&')[0] || '';
    } else if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    return {
      type: 'youtube' as const,
      id: videoId,
      url: videoId ? `https://www.youtube.com/embed/${videoId}` : cleanUrl
    };
  }

  // 3. TikTok
  if (cleanUrl.includes('tiktok.com')) {
    let videoId = '';
    const idMatch = cleanUrl.match(/\/video\/(\d+)/) || cleanUrl.match(/\/embed\/v2\/(\d+)/) || cleanUrl.match(/\/embed\/(\d+)/) || cleanUrl.match(/(\d{18,20})/);
    if (idMatch) {
      videoId = idMatch[1] || idMatch[0];
    }
    return {
      type: 'tiktok' as const,
      id: videoId,
      url: videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : cleanUrl
    };
  }

  // 4. Direct Video
  return {
    type: 'direct' as const,
    id: '',
    url: cleanUrl
  };
};

const compressImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
};

interface ImageDropzoneProps {
  imageValue: string;
  onImageChange: (image: string) => void;
  label: string;
  prefersReducedMotion?: boolean;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ imageValue, onImageChange, label, prefersReducedMotion = false }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      onImageChange(compressed);
    } catch (error) {
      console.error("Failed to compress image:", error);
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] ${
        isDragActive
          ? 'border-brand-rose bg-brand-pink-light/35 scale-[1.01]'
          : 'border-brand-warm-tan/30 bg-[#FAF6F0] hover:border-brand-rose/40 hover:bg-[#FAF6F0]/85'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {imageValue ? (
        <div className="flex items-center gap-3 w-full">
          <img
            src={imageValue}
            alt="Uploaded Preview"
            className="w-12 h-12 object-cover rounded-lg border border-brand-warm-tan/20 shadow-xs"
          />
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-brand-chocolate truncate">{label} Uploaded</p>
            <p className="text-[9px] text-[#A67E6B] font-medium">Click anywhere to replace file</p>
          </div>
          <span
            className="text-[9px] text-brand-rose font-bold bg-brand-pink-light/50 px-2 py-1 rounded hover:bg-brand-rose hover:text-white transition-colors whitespace-nowrap"
          >
            Replace
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <Camera className="w-5 h-5 text-brand-rose mb-1" />
          <span className="text-[10px] font-bold text-brand-chocolate">{label} Graphic</span>
          <span className="text-[9px] text-[#8C6D62] mt-0.5">Drag & drop here or click to browse</span>
        </div>
      )}
    </div>
  );
};

interface VideoDropzoneProps {
  videoValue: string;
  onVideoChange: (videoUrl: string, file?: File) => void;
  label: string;
  prefersReducedMotion?: boolean;
}

const VideoDropzone: React.FC<VideoDropzoneProps> = ({ videoValue, onVideoChange, label, prefersReducedMotion = false }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4/WebM).');
      return;
    }
    const localUrl = URL.createObjectURL(file);
    onVideoChange(localUrl, file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] ${
        isDragActive
          ? 'border-brand-rose bg-brand-pink-light/35 scale-[1.01]'
          : 'border-brand-warm-tan/30 bg-[#FAF6F0] hover:border-brand-rose/40 hover:bg-[#FAF6F0]/85'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleChange}
        className="hidden"
      />
      {videoValue && videoValue.startsWith('blob:') ? (
        <div className="flex items-center gap-3 w-full">
          <div className="w-12 h-12 rounded-lg border border-brand-warm-tan/20 bg-black flex items-center justify-center overflow-hidden shrink-0">
            <video src={videoValue} className="w-full h-full object-cover" muted playsInline />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-brand-chocolate truncate">{label} Loaded</p>
            <p className="text-[9px] text-[#A67E6B] font-medium">Click anywhere to replace file</p>
          </div>
          <span
            className="text-[9px] text-brand-rose font-bold bg-brand-pink-light/50 px-2 py-1 rounded hover:bg-brand-rose hover:text-white transition-colors whitespace-nowrap"
          >
            Replace
          </span>
        </div>
      ) : videoValue ? (
        <div className="flex items-center gap-3 w-full">
          <div className="w-12 h-12 rounded-lg border border-brand-warm-tan/20 bg-black flex items-center justify-center overflow-hidden shrink-0">
            {videoValue.includes('youtube.com') || videoValue.includes('youtu.be') || videoValue.includes('tiktok.com') ? (
              <Video className="w-5 h-5 text-brand-rose" />
            ) : (
              <video src={videoValue} className="w-full h-full object-cover" muted playsInline />
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-brand-chocolate truncate">Linked Video URL active</p>
            <p className="text-[9px] text-[#8C6D62] truncate">Click anywhere to upload file</p>
          </div>
          <span
            className="text-[9px] text-brand-rose font-bold bg-brand-pink-light/50 px-2 py-1 rounded hover:bg-brand-rose hover:text-white transition-colors whitespace-nowrap"
          >
            Upload file
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <Video className="w-5 h-5 text-brand-rose mb-1" />
          <span className="text-[10px] font-bold text-brand-chocolate">{label}</span>
          <span className="text-[9px] text-[#8C6D62] mt-0.5">Drag & drop MP4/WebM here or click to browse</span>
        </div>
      )}
    </div>
  );
};

const AnimatedAdminCounter: React.FC<{
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  prefersReducedMotion?: boolean;
}> = ({ value, decimals = 0, prefix = '', suffix = '', duration = 1.0, prefersReducedMotion = false }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    let startTime: number | null = null;
    const startValue = 0;

    const animateValue = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // easeOutQuad
      const easeProgress = progress * (2 - progress);
      const current = startValue + easeProgress * (value - startValue);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(animateValue);
    return () => cancelAnimationFrame(animId);
  }, [value, duration, prefersReducedMotion]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

export const AdminPortal: React.FC = () => {
  const {
    ebooks, products, blogs, discountCodes, homepageContent, newsletterSignups, orders, isAdminLoggedIn, currentAdminUser,
    videos, gallery, contactRequests,
    addEBook, updateEBook, deleteEBook,
    addProduct, updateProduct, deleteProduct,
    addVideo, updateVideo, deleteVideo,
    addGalleryItem, updateGalleryItem, deleteGalleryItem,
    addBlogPost, updateBlogPost, deleteBlogPost,
    addDiscountCode, deleteDiscountCode,
    updateHomepageContent, fulfillOrder, loginAdmin, logoutAdmin,
    respondToContactRequest, deleteContactRequest, updateContactRequestStatus,
    emailNotificationsEnabled, setEmailNotificationsEnabled, prefersReducedMotion,
    services, updateService,
    triggerToast
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
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidViews, setVidViews] = useState('12.5K views');
  const [vidCategory, setVidCategory] = useState<'Wash Day' | 'Styling' | 'Protective Styles' | 'Growth Tips' | 'Product Reviews' | 'Tutorials'>('Styling');
  const [vidUrl, setVidUrl] = useState('');
  const [vidThumb, setVidThumb] = useState('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800');
  const [vidDescription, setVidDescription] = useState('');
  const [vidRelatedIds, setVidRelatedIds] = useState<string[]>([]);
  const [vidIsFeatured, setVidIsFeatured] = useState(false);
  const [vidStatus, setVidStatus] = useState<'draft' | 'published' | 'scheduled'>('published');
  const [vidScheduledAt, setVidScheduledAt] = useState('');
  const [viewingAnalyticsVideo, setViewingAnalyticsVideo] = useState<TikTokVideo | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [uploadedThumbFile, setUploadedThumbFile] = useState<File | null>(null);

  // Automatic YouTube/TikTok URL detector and thumbnail resolver
  useEffect(() => {
    if (!vidUrl) return;
    const resolved = resolveVideoSource(vidUrl);
    if (resolved.type === 'youtube' && resolved.id) {
      const ytThumb = `https://img.youtube.com/vi/${resolved.id}/maxresdefault.jpg`;
      // Auto-populate thumbnail field if it is empty or the default placeholder
      if (!vidThumb || vidThumb === 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800') {
        setVidThumb(ytThumb);
      }
    } else if (resolved.type === 'tiktok' && resolved.id) {
      // For TikTok, direct client-side oEmbed thumbnail extraction is blocked by CORS.
      // So we fallback to a beautiful coily hair placeholder or keep the current one.
      const tiktokPlaceholder = '/about-portrait.jpg';
      if (!vidThumb || vidThumb === 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800') {
        setVidThumb(tiktokPlaceholder);
      }
    }
  }, [vidUrl]);

  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galCaption, setGalCaption] = useState('');
  const [galCategory, setGalCategory] = useState<'Progress' | 'Hairstyles' | 'Routines'>('Progress');
  const [galImage, setGalImage] = useState('');

  // CMS editor states
  const [cmsHeroHead, setCmsHeroHead] = useState(homepageContent.heroHeadline);
  const [cmsHeroSub, setCmsHeroSub] = useState(homepageContent.heroSubheadline);
  const [cmsHeroImage, setCmsHeroImage] = useState(homepageContent.heroImageUrl || '/hero-portrait.jpg');
  const [cmsAboutHead, setCmsAboutHead] = useState(homepageContent.aboutHeadline);
  const [cmsAboutStory, setCmsAboutStory] = useState(homepageContent.aboutStory);
  const [cmsAboutImage, setCmsAboutImage] = useState(homepageContent.aboutImageUrl || '/about-portrait.jpg');
  const [cmsPromoQuote, setCmsPromoQuote] = useState(homepageContent.promoQuote);
  const [cmsPromoAuthor, setCmsPromoAuthor] = useState(homepageContent.promoAuthor);
  const [cmsSuccess, setCmsSuccess] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Track whether CMS local state differs from saved context state (dirty detection)
  const hasCmsDirty = useMemo(() => {
    return (
      cmsHeroHead !== homepageContent.heroHeadline ||
      cmsHeroSub  !== homepageContent.heroSubheadline ||
      cmsHeroImage !== (homepageContent.heroImageUrl || '/hero-portrait.jpg') ||
      cmsAboutHead !== homepageContent.aboutHeadline ||
      cmsAboutStory !== homepageContent.aboutStory ||
      cmsAboutImage !== (homepageContent.aboutImageUrl || '/about-portrait.jpg') ||
      cmsPromoQuote !== homepageContent.promoQuote ||
      cmsPromoAuthor !== homepageContent.promoAuthor
    );
  }, [cmsHeroHead, cmsHeroSub, cmsHeroImage, cmsAboutHead, cmsAboutStory, cmsAboutImage, cmsPromoQuote, cmsPromoAuthor, homepageContent]);

  // Debounced auto-save CMS fields — fires 800ms after last keystroke
  const cmsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveCms = useCallback((patch: Partial<typeof homepageContent>) => {
    if (cmsDebounceRef.current) clearTimeout(cmsDebounceRef.current);
    cmsDebounceRef.current = setTimeout(() => {
      updateHomepageContent(patch);
    }, 800);
  }, [updateHomepageContent]);


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

  // Blog post editing / adding states
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogReadTime, setBlogReadTime] = useState('5 min read');
  const [blogImage, setBlogImage] = useState('');
  const [blogCategory, setBlogCategory] = useState('Growth Tips');
  const BLOG_CATEGORIES = ['Growth Tips', 'Wash Day', 'Styling', 'Product Reviews', 'Tutorials', 'Protective Styles', 'Hair Science'] as const;

  // Derived: are there any unsaved/pending changes?
  const hasOpenForm = isAddingVideo || isAddingProduct || isAddingEBook;
  const hasUnsavedChanges = hasCmsDirty || hasOpenForm;
  // Inline editing states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('Hair Oils');
  const [editProdStock, setEditProdStock] = useState('0');
  const [editProdPrice, setEditProdPrice] = useState('0.00');
  const [editProdImage, setEditProdImage] = useState('');

  const [editingEBookId, setEditingEBookId] = useState<string | null>(null);
  const [editEbName, setEditEbName] = useState('');
  const [editEbPages, setEditEbPages] = useState('120');
  const [editEbPrice, setEditEbPrice] = useState('0.00');
  const [editEbSize, setEditEbSize] = useState('10 MB');
  const [editEbImage, setEditEbImage] = useState('');

  // --- Calculations ---
  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

  const checkPermission = (allowedRoles: AdminRole[]): boolean => {
    if (!currentAdminUser) return false;
    // Frictionless administration: Allow any authenticated administrator to perform CMS operations
    return true;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid administrative staff email.');
      return;
    }
    const success = loginAdmin(email, password);
    if (!success) {
      setAuthError('Incorrect staff email or password. Access denied.');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleCmsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(['super_admin', 'content_manager'])) return;
    updateHomepageContent({
      heroHeadline: cmsHeroHead,
      heroSubheadline: cmsHeroSub,
      heroImageUrl: cmsHeroImage,
      aboutHeadline: cmsAboutHead,
      aboutStory: cmsAboutStory,
      aboutImageUrl: cmsAboutImage,
      promoQuote: cmsPromoQuote,
      promoAuthor: cmsPromoAuthor
    });
    if (cmsDebounceRef.current) clearTimeout(cmsDebounceRef.current);
    setCmsSuccess(true);
    triggerToast('✓ Homepage content saved — live on storefront now!', 'success');
    setTimeout(() => setCmsSuccess(false), 3000);
  };

  // Save ALL pending changes at once (CMS fields + any open forms)
  const handleSaveAll = () => {
    let saved = 0;

    // 1. Save CMS if dirty
    if (hasCmsDirty && checkPermission(['super_admin', 'content_manager'])) {
      if (cmsDebounceRef.current) clearTimeout(cmsDebounceRef.current);
      updateHomepageContent({
        heroHeadline: cmsHeroHead,
        heroSubheadline: cmsHeroSub,
        heroImageUrl: cmsHeroImage,
        aboutHeadline: cmsAboutHead,
        aboutStory: cmsAboutStory,
        aboutImageUrl: cmsAboutImage,
        promoQuote: cmsPromoQuote,
        promoAuthor: cmsPromoAuthor
      });
      setCmsSuccess(true);
      setTimeout(() => setCmsSuccess(false), 3000);
      saved++;
    }

    // 2. If video form is open with a title + URL, auto-submit it
    if (isAddingVideo && vidTitle.trim() && vidUrl.trim()) {
      const newVideo = {
        title: vidTitle.trim(),
        views: vidViews,
        category: vidCategory,
        videoUrl: vidUrl.trim(),
        thumbnailUrl: vidThumb || '/about-portrait.jpg',
        description: vidDescription,
        relatedIds: vidRelatedIds,
        isFeatured: vidIsFeatured,
        status: vidStatus as 'draft' | 'published' | 'scheduled',
        scheduledAt: vidScheduledAt || undefined,
      };
      if (editingVideoId) {
        updateVideo(editingVideoId, newVideo);
      } else {
        addVideo({ ...newVideo, id: `vid-${Date.now()}` } as any);
      }
      setIsAddingVideo(false);
      saved++;
    }

    // 3. If product form is open with a name, auto-submit it
    if (isAddingProduct && prodName.trim()) {
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
      setProdName(''); setProdPrice('19.99'); setProdDesc(''); setProdStock('50');
      setIsAddingProduct(false);
      saved++;
    }

    // 4. If eBook form is open with a name, auto-submit it
    if (isAddingEBook && ebName.trim()) {
      addEBook({
        id: `ebook-${Date.now()}`,
        name: ebName,
        price: parseFloat(ebPrice) || 0,
        description: ebDesc,
        image: ebImage,
        pages: parseInt(ebPages) || 120,
        fileSize: ebSize,
        benefits: ['Detailed step-by-step master hair guides', 'Porosity hydration logs and charts', 'Maximum hair follicle safety guidelines'],
        pdfUrl: `${ebName.toLowerCase().replace(/\s+/g, '_')}_guide.pdf`
      });
      setEbName(''); setEbPrice('14.99'); setEbDesc(''); setEbPages('100'); setEbSize('10 MB');
      setIsAddingEBook(false);
      saved++;
    }

    if (saved > 0) {
      triggerToast(`✓ ${saved} change${saved > 1 ? 's' : ''} saved — everything is live on storefront!`, 'success');
    } else {
      triggerToast('Everything is already up to date ✓', 'info');
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(['super_admin', 'store_manager'])) return;
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
    if (!checkPermission(['super_admin', 'store_manager'])) return;
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

  const handleSaveProduct = (id: string) => {
    if (!checkPermission(['super_admin', 'store_manager', 'content_manager'])) return;
    const orig = products.find(p => p.id === id);
    if (!orig) return;
    updateProduct(id, {
      name: editProdName,
      category: editProdCategory,
      price: parseFloat(editProdPrice) || 0,
      stockCount: parseInt(editProdStock) || 0,
      stockStatus: (parseInt(editProdStock) || 0) > 15 ? 'In Stock' : 'Low Stock',
      image: editProdImage || orig.image,
    });
    setEditingProductId(null);
  };

  const handleStartEditProduct = (p: Product) => {
    if (!checkPermission(['super_admin', 'store_manager', 'content_manager'])) return;
    setEditingProductId(p.id);
    setEditProdName(p.name);
    setEditProdCategory(p.category);
    setEditProdStock(p.stockCount.toString());
    setEditProdPrice(p.price.toString());
    setEditProdImage(p.image);
  };

  const handleSaveEBook = (id: string) => {
    if (!checkPermission(['super_admin', 'store_manager', 'content_manager'])) return;
    const orig = ebooks.find(e => e.id === id);
    if (!orig) return;
    updateEBook(id, {
      name: editEbName,
      pages: parseInt(editEbPages) || 120,
      price: parseFloat(editEbPrice) || 0,
      fileSize: editEbSize,
      image: editEbImage || orig.image,
    });
    setEditingEBookId(null);
  };

  const handleStartEditEBook = (e: EBook) => {
    if (!checkPermission(['super_admin', 'store_manager', 'content_manager'])) return;
    setEditingEBookId(e.id);
    setEditEbName(e.name);
    setEditEbPages(e.pages.toString());
    setEditEbPrice(e.price.toString());
    setEditEbSize(e.fileSize);
    setEditEbImage(e.image);
  };

  const handleAddDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(['super_admin'])) return;
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

  const resetVideoForm = () => {
    setVidTitle('');
    setVidUrl('');
    setVidCategory('Styling');
    setVidViews('0 views');
    setVidThumb('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800');
    setVidDescription('');
    setVidRelatedIds([]);
    setVidIsFeatured(false);
    setVidStatus('published');
    setVidScheduledAt('');
    setUploadedVideoFile(null);
    setUploadedThumbFile(null);
    setIsAddingVideo(false);
    setEditingVideoId(null);
  };

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle) {
      triggerToast('Please enter a video title.', 'error');
      return;
    }
    if (!vidUrl) {
      triggerToast('Please upload a video file or paste a video link.', 'error');
      return;
    }
    if (vidUrl.includes('vm.tiktok.com') || vidUrl.includes('vt.tiktok.com')) {
      triggerToast('Mobile TikTok links (vm.tiktok.com) are shortened and blocked from embedding by TikTok. Please paste a desktop video link or enter the 19-digit Video ID directly.', 'error');
      return;
    }
    if (!checkPermission(['super_admin', 'content_manager'])) return;

    // Simulate file uploads to cloud storage bucket
    if (uploadedVideoFile) {
      console.log(`[Cloud Storage Placeholder] File uploaded: ${uploadedVideoFile.name} (${uploadedVideoFile.size} bytes)`);
    }
    if (uploadedThumbFile) {
      console.log(`[Cloud Storage Placeholder] Thumbnail uploaded: ${uploadedThumbFile.name} (${uploadedThumbFile.size} bytes)`);
    }

    let fOrder: number | undefined = undefined;
    if (vidIsFeatured) {
      if (editingVideoId) {
        const existing = videos.find(v => v.id === editingVideoId);
        if (existing && existing.isFeatured && existing.featuredOrder !== undefined) {
          fOrder = existing.featuredOrder;
        }
      }
      if (fOrder === undefined) {
        const maxOrder = videos.reduce((max, v) => (v.isFeatured && v.featuredOrder ? Math.max(max, v.featuredOrder) : max), 0);
        fOrder = maxOrder + 1;
      }
    }

    const payload: Partial<TikTokVideo> = {
      title: vidTitle,
      views: vidStatus === 'draft' ? 'Draft' : (vidStatus === 'scheduled' ? 'Scheduled' : vidViews === '0 views' ? '0 views' : vidViews),
      category: vidCategory,
      videoUrl: vidUrl,
      thumbnailUrl: vidThumb,
      description: vidDescription,
      relatedIds: vidRelatedIds,
      isFeatured: vidIsFeatured,
      status: vidStatus,
      scheduledAt: vidStatus === 'scheduled' ? vidScheduledAt : undefined,
      featuredOrder: fOrder,
    };

    if (editingVideoId) {
      // Keep existing analytics on update
      const existing = videos.find(v => v.id === editingVideoId);
      if (existing) {
        payload.viewsCount = existing.viewsCount;
        payload.likesCount = existing.likesCount;
        payload.savesCount = existing.savesCount;
        payload.sharesCount = existing.sharesCount;
        payload.commentsCount = existing.commentsCount;
        payload.shopClicks = existing.shopClicks;
        payload.productAddClicks = existing.productAddClicks;
        payload.ebookAddClicks = existing.ebookAddClicks;
        payload.conversionCount = existing.conversionCount;
      }
      updateVideo(editingVideoId, payload);
      triggerToast('Video Masterclass updated! 🎬', 'success');
    } else {
      // Initialize analytics for a new video
      payload.viewsCount = 0;
      payload.likesCount = 0;
      payload.savesCount = 0;
      payload.sharesCount = 0;
      payload.commentsCount = 0;
      payload.shopClicks = 0;
      payload.productAddClicks = 0;
      payload.ebookAddClicks = 0;
      payload.conversionCount = 0;

      addVideo(payload as any);
      triggerToast('Video Masterclass published! 🎬', 'success');
    }

    resetVideoForm();
  };

  const moveFeaturedVideo = (id: string, direction: 'up' | 'down') => {
    if (!checkPermission(['super_admin', 'content_manager'])) return;

    // Get current featured videos, sorted by featuredOrder
    const featured = videos
      .filter(v => v.isFeatured)
      .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));

    const index = featured.findIndex(v => v.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const current = featured[index];
      const target = featured[index - 1];

      // Swap featuredOrder
      const currentOrder = current.featuredOrder ?? index;
      const targetOrder = target.featuredOrder ?? (index - 1);

      updateVideo(current.id, { featuredOrder: targetOrder });
      updateVideo(target.id, { featuredOrder: currentOrder });
      triggerToast('Reordered featured videos!', 'success');
    } else if (direction === 'down' && index < featured.length - 1) {
      const current = featured[index];
      const target = featured[index + 1];

      const currentOrder = current.featuredOrder ?? index;
      const targetOrder = target.featuredOrder ?? (index + 1);

      updateVideo(current.id, { featuredOrder: targetOrder });
      updateVideo(target.id, { featuredOrder: currentOrder });
      triggerToast('Reordered featured videos!', 'success');
    }
  };

  const handleAddGallerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galCaption || !galImage) return;
    if (!checkPermission(['super_admin', 'content_manager'])) return;
    
    if (editingGalleryId) {
      updateGalleryItem(editingGalleryId, {
        image: galImage,
        caption: galCaption,
        category: galCategory
      });
      setEditingGalleryId(null);
      triggerToast('Lookbook photo updated successfully.');
    } else {
      addGalleryItem({
        image: galImage,
        caption: galCaption,
        category: galCategory
      });
      triggerToast('Lookbook photo uploaded successfully.');
    }
    setGalCaption('');
    setGalImage('');
    setIsAddingGallery(false);
  };

  const handleEditGalleryClick = (item: PhotoGalleryItem) => {
    setEditingGalleryId(item.id);
    setGalCaption(item.caption);
    setGalCategory(item.category);
    setGalImage(item.image);
    setIsAddingGallery(true);
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
            🔒 Authorized Staff Access Only.<br />
            Use your assigned staff email and password to sign in.<br />
            Contact the site owner if you need access credentials.
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
              <div className="flex items-center flex-wrap gap-1.5 text-brand-rose text-xs font-extrabold uppercase tracking-widest pl-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Authorized Staff Portal Active</span>
                {currentAdminUser && (
                  <span className="ml-1 px-2.5 py-0.5 bg-brand-rose text-[#FAF6F0] rounded-full text-[9px] font-mono font-bold select-none uppercase tracking-wider">
                    {currentAdminUser.role.replace('_', ' ')}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-brand-dark mt-1 flex items-center gap-2">
                {currentAdminUser ? currentAdminUser.name : 'Cartiae Rae'} <span className="text-brand-rose font-light italic">CMS Dashboard</span>
              </h1>
            </div>

            {/* Header action buttons */}
            <div className="flex items-center gap-2 self-start flex-wrap">
              {/* View Storefront link */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-transparent rounded-xl transition-all duration-200 focus:outline-none shadow-xs"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>View Storefront</span>
              </a>

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

          {/* ── Floating "Save All & Publish" bar ── appears when unsaved changes exist */}
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-center justify-between gap-4 bg-[#1C1410] border border-brand-chocolate/60 px-5 py-3 rounded-2xl shadow-xl"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                  </span>
                  <p className="text-[11px] font-semibold text-white/90">
                    {hasOpenForm && hasCmsDirty
                      ? 'Unsaved changes — content edits & open form'
                      : hasCmsDirty
                      ? 'Homepage content has unsaved edits'
                      : 'Open form has unsaved data'}
                  </p>
                </div>
                <button
                  id="admin-save-all-btn"
                  onClick={handleSaveAll}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-rose hover:bg-[#C11A3F] text-white text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none whitespace-nowrap"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Save All &amp; Publish
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats Metric Cards banner */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <motion.div
              whileHover={prefersReducedMotion ? {} : { y: -3, boxShadow: '0 8px 30px rgba(74, 43, 32, 0.06)' }}
              transition={{ duration: 0.2 }}
              className="bg-white border-l-4 border-l-emerald-600 border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">Total Revenue</p>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">
                <AnimatedAdminCounter value={totalSales} decimals={2} prefix="$" prefersReducedMotion={prefersReducedMotion} />
              </p>
            </motion.div>
            
            <motion.div
              whileHover={prefersReducedMotion ? {} : { y: -3, boxShadow: '0 8px 30px rgba(74, 43, 32, 0.06)' }}
              transition={{ duration: 0.2 }}
              className="bg-white border-l-4 border-l-brand-rose border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">Total Orders</p>
                <ShoppingBag className="w-4 h-4 text-brand-rose" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">
                <AnimatedAdminCounter value={orders.length} decimals={0} prefersReducedMotion={prefersReducedMotion} />
              </p>
              <span className="text-[9px] text-[#C2395A] bg-brand-pink-light font-extrabold px-1.5 py-0.5 rounded-md mt-1.5 inline-block">
                {pendingOrdersCount} Awaiting Shipment
              </span>
            </motion.div>

            <motion.div
              whileHover={prefersReducedMotion ? {} : { y: -3, boxShadow: '0 8px 30px rgba(74, 43, 32, 0.06)' }}
              transition={{ duration: 0.2 }}
              className="bg-white border-l-4 border-l-[#4A2B20] border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">eBooks Catalog</p>
                <BookOpen className="w-4 h-4 text-[#4A2B20]" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">
                <AnimatedAdminCounter value={ebooks.length} decimals={0} prefersReducedMotion={prefersReducedMotion} />
              </p>
              <span className="text-[9px] text-[#8C6D62] bg-[#FAF6F0] font-bold px-1.5 py-0.5 rounded-md mt-1.5 inline-block">Guides Published</span>
            </motion.div>

            <motion.div
              whileHover={prefersReducedMotion ? {} : { y: -3, boxShadow: '0 8px 30px rgba(74, 43, 32, 0.06)' }}
              transition={{ duration: 0.2 }}
              className="bg-white border-l-4 border-l-brand-pink border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">Products Stock</p>
                <Package className="w-4 h-4 text-brand-pink" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">
                <AnimatedAdminCounter value={products.length} decimals={0} prefersReducedMotion={prefersReducedMotion} />
              </p>
              <span className="text-[9px] text-emerald-800 bg-emerald-50 font-bold px-1.5 py-0.5 rounded-md mt-1.5 inline-block">Botanical Retail</span>
            </motion.div>

            <motion.div
              whileHover={prefersReducedMotion ? {} : { y: -3, boxShadow: '0 8px 30px rgba(74, 43, 32, 0.06)' }}
              transition={{ duration: 0.2 }}
              className="bg-white border-l-4 border-l-brand-berry border border-y-[#E5D5C8]/50 border-r-[#E5D5C8]/50 p-4 rounded-xl shadow-[0_4px_15px_-4px_rgba(74,43,32,0.03)] transition-all duration-200 col-span-2 md:col-span-1"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-extrabold text-[#8C6D62] tracking-wider">Newsletter Subs</p>
                <Mail className="w-4 h-4 text-brand-berry animate-pulse" />
              </div>
              <p className="text-lg font-bold font-mono text-brand-dark mt-1">
                <AnimatedAdminCounter value={newsletterSignups.length} decimals={0} prefersReducedMotion={prefersReducedMotion} />
              </p>
              <span className="text-[9px] text-brand-berry bg-brand-pink-light font-bold px-1.5 py-0.5 rounded-md mt-1.5 inline-block">Growth List Hits</span>
            </motion.div>
          </div>

          {/* Simplified Main Navigation tabs */}
          <div className="flex border-b border-brand-warm-tan/20 pb-2.5 overflow-x-auto gap-6 sm:gap-8 scrollbar-none scroll-smooth">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('overview')}
              className={`relative flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'overview' ? 'text-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview Dashboard</span>
              {activeTab === 'overview' && !prefersReducedMotion && (
                <motion.div layoutId="adminActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
              )}
              {activeTab === 'overview' && prefersReducedMotion && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('catalog')}
              className={`relative flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'catalog' ? 'text-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catalog & Coupons</span>
              {activeTab === 'catalog' && !prefersReducedMotion && (
                <motion.div layoutId="adminActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
              )}
              {activeTab === 'catalog' && prefersReducedMotion && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('contacts')}
              className={`relative flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'contacts' ? 'text-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Consult Inquiries ({contactRequests.filter(c => c.status === 'Pending').length})</span>
              {activeTab === 'contacts' && !prefersReducedMotion && (
                <motion.div layoutId="adminActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
              )}
              {activeTab === 'contacts' && prefersReducedMotion && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('design')}
              className={`relative flex items-center gap-1.5 pb-2 text-xs uppercase tracking-wider font-extrabold transition-all duration-200 focus:outline-none whitespace-nowrap ${
                activeTab === 'design' ? 'text-brand-rose' : 'text-brand-chocolate/60 hover:text-brand-rose'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Store Editor</span>
              {activeTab === 'design' && !prefersReducedMotion && (
                <motion.div layoutId="adminActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
              )}
              {activeTab === 'design' && prefersReducedMotion && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-rose" />
              )}
            </motion.button>
          </div>

          {/* ======================================= */}
          {/* TAB 1: OVERVIEW COMPOSITE PAGE          */}
          {/* ======================================= */}
          {activeTab === 'overview' && (
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#E5D5C8]/25 border border-[#E5D5C8]/45 rounded-xl w-fit">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setOverviewSub('metrics')}
                className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none ${
                  overviewSub === 'metrics' ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                }`}
              >
                {overviewSub === 'metrics' && !prefersReducedMotion && (
                  <motion.div layoutId="overviewActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                )}
                {overviewSub === 'metrics' && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                )}
                <span className="relative z-10">Conversion Metrics</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setOverviewSub('orders')}
                className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  overviewSub === 'orders' ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                }`}
              >
                {overviewSub === 'orders' && !prefersReducedMotion && (
                  <motion.div layoutId="overviewActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                )}
                {overviewSub === 'orders' && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>Orders Tracker</span>
                  {pendingOrdersCount > 0 && (
                    <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full inline-block font-black ${
                      overviewSub === 'orders' ? 'bg-white text-brand-rose' : 'bg-brand-berry text-white'
                    }`}>
                      {pendingOrdersCount}
                    </span>
                  )}
                </span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setOverviewSub('subscribers')}
                className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none ${
                  overviewSub === 'subscribers' ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                }`}
              >
                {overviewSub === 'subscribers' && !prefersReducedMotion && (
                  <motion.div layoutId="overviewActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                )}
                {overviewSub === 'subscribers' && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                )}
                <span className="relative z-10">Subscriber Logs</span>
              </motion.button>
            </div>
          )}

          {activeTab === 'overview' && overviewSub === 'metrics' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
              <h2 className="font-serif text-lg font-bold text-brand-dark border-b border-[#E5D5C8]/30 pb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                Business Health Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* live store summary */}
                <div className="bg-[#FAF7F2] p-5.5 rounded-2xl border border-[#E5D5C8]/30 space-y-4">
                  <h3 className="font-serif text-sm font-bold text-brand-chocolate tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-brand-rose rounded-full"></span>
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
                      <span className="font-mono font-black text-brand-rose bg-brand-pink-light px-2 py-0.5 rounded">{discountCodes.filter(c => c.isActive).length}</span>
                    </div>
                  </div>
                </div>

                {/* live status */}
                <div className="bg-brand-dark text-white p-6 rounded-2xl border border-brand-chocolate/40 relative overflow-hidden flex flex-col justify-between shadow-md">
                  <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-brand-chocolate opacity-20 rounded-full blur-2xl"></div>
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
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      LIVE
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
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setCatalogSub('inventory')}
                className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  catalogSub === 'inventory' ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                }`}
              >
                {catalogSub === 'inventory' && !prefersReducedMotion && (
                  <motion.div layoutId="catalogActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                )}
                {catalogSub === 'inventory' && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>Shop Inventories</span>
                </span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setCatalogSub('discounts')}
                className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  catalogSub === 'discounts' ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                }`}
              >
                {catalogSub === 'discounts' && !prefersReducedMotion && (
                  <motion.div layoutId="catalogActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                )}
                {catalogSub === 'discounts' && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <BadgePercent className="w-3.5 h-3.5" />
                  <span>Voucher Coupons</span>
                </span>
              </motion.button>
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
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
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
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category collection</label>
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
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
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Initial Stock Count</label>
                        <input
                          type="number"
                          required
                          value={prodStock}
                          onChange={(e) => setProdStock(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Product Visual Graphic</label>
                      <ImageDropzone
                        imageValue={prodImage}
                        onImageChange={setProdImage}
                        label="Product Image"
                        prefersReducedMotion={prefersReducedMotion}
                      />
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
                      {products.map((p) => {
                        const isEditing = p.id === editingProductId;
                        return (
                          <tr key={p.id} className="hover:bg-brand-cream/30">
                            <td className="p-3">
                              {isEditing ? (
                                <div className="relative group cursor-pointer w-10 h-10">
                                  <img
                                    src={editProdImage || p.image}
                                    referrerPolicy="no-referrer"
                                    alt={p.name}
                                    className="w-10 h-10 object-cover rounded border border-brand-rose/40"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                    <Camera className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const compressed = await compressImage(file);
                                          setEditProdImage(compressed);
                                        } catch (err) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => setEditProdImage(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <img
                                  src={p.image}
                                  referrerPolicy="no-referrer"
                                  alt={p.name}
                                  className="w-10 h-10 object-cover rounded border border-brand-warm-tan/30"
                                />
                              )}
                            </td>
                            <td className="p-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editProdName}
                                  onChange={(e) => setEditProdName(e.target.value)}
                                  className="w-full px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs font-semibold"
                                />
                              ) : (
                                <span className="font-semibold">{p.name}</span>
                              )}
                            </td>
                            <td className="p-3">
                              {isEditing ? (
                                <select
                                  value={editProdCategory}
                                  onChange={(e) => setEditProdCategory(e.target.value)}
                                  className="w-full px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs"
                                >
                                  <option>Hair Oils</option>
                                  <option>Accessories</option>
                                  <option>Treatments</option>
                                </select>
                              ) : (
                                <span>{p.category}</span>
                              )}
                            </td>
                            <td className="p-3 font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editProdStock}
                                  onChange={(e) => setEditProdStock(e.target.value)}
                                  className="w-20 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs"
                                />
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                  p.stockCount === 0 ? 'bg-red-50 text-red-700' : p.stockCount <= 15 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-800'
                                }`}>
                                  {p.stockCount} ({p.stockStatus})
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold">
                              {isEditing ? (
                                <div className="flex items-center gap-0.5">
                                  <span>$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editProdPrice}
                                    onChange={(e) => setEditProdPrice(e.target.value)}
                                    className="w-20 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs font-bold"
                                  />
                                </div>
                              ) : (
                                <span>${p.price.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {isEditing ? (
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleSaveProduct(p.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingProductId(null)}
                                    className="px-2.5 py-1 bg-brand-cream border border-[#E5D5C8] text-brand-chocolate rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEditProduct(p)}
                                    className="p-1 px-2.5 bg-brand-cream hover:bg-brand-beige text-brand-chocolate rounded-md font-bold transition duration-250 border border-brand-warm-tan/30 cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    id={`delete-prod-list-${p.id}`}
                                    onClick={() => {
                                      if (confirm(`Delete physical "${p.name}" from catalog?`)) {
                                        if (checkPermission(['super_admin', 'store_manager', 'content_manager'])) {
                                          deleteProduct(p.id);
                                          triggerToast(`🗑 "${p.name}" removed from the product catalog.`, 'success');
                                        }
                                      }
                                    }}
                                    className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250 cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
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
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Total Pages count</label>
                        <input
                          type="number"
                          required
                          value={ebPages}
                          onChange={(e) => setEbPages(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
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
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">File Size Spec (e.g. 5.4 MB)</label>
                        <input
                          type="text"
                          required
                          value={ebSize}
                          onChange={(e) => setEbSize(e.target.value)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">eBook Cover Graphic</label>
                      <ImageDropzone
                        imageValue={ebImage}
                        onImageChange={setEbImage}
                        label="eBook Cover"
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </div>

                    <div className="flex justify-end gap-2 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => setIsAddingEBook(false)}
                        className="px-4 py-2 border border-[#E5D5C8] hover:bg-brand-cream rounded"
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
                      {ebooks.map((e) => {
                        const isEditing = e.id === editingEBookId;
                        return (
                          <tr key={e.id} className="hover:bg-brand-cream/30">
                            <td className="p-3">
                              {isEditing ? (
                                <div className="relative group cursor-pointer w-9 h-11">
                                  <img
                                    src={editEbImage || e.image}
                                    referrerPolicy="no-referrer"
                                    alt={e.name}
                                    className="w-9 h-11 object-cover rounded border border-brand-rose/40"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                    <Camera className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const compressed = await compressImage(file);
                                          setEditEbImage(compressed);
                                        } catch (err) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => setEditEbImage(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <img
                                  src={e.image}
                                  referrerPolicy="no-referrer"
                                  alt={e.name}
                                  className="w-9 h-11 object-cover rounded border border-brand-warm-tan/30"
                                />
                              )}
                            </td>
                            <td className="p-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editEbName}
                                  onChange={(e) => setEditEbName(e.target.value)}
                                  className="w-full px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs font-semibold"
                                />
                              ) : (
                                <span className="font-semibold">{e.name}</span>
                              )}
                            </td>
                            <td className="p-3 font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editEbPages}
                                  onChange={(e) => setEditEbPages(e.target.value)}
                                  className="w-20 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs"
                                />
                              ) : (
                                <span>{e.pages} pages</span>
                              )}
                            </td>
                            <td className="p-3 font-mono">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editEbSize}
                                  onChange={(e) => setEditEbSize(e.target.value)}
                                  className="w-24 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs"
                                />
                              ) : (
                                <span>{e.fileSize}</span>
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold">
                              {isEditing ? (
                                <div className="flex items-center gap-0.5">
                                  <span>$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editEbPrice}
                                    onChange={(e) => setEditEbPrice(e.target.value)}
                                    className="w-20 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs font-bold"
                                  />
                                </div>
                              ) : (
                                <span>${e.price.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {isEditing ? (
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleSaveEBook(e.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingEBookId(null)}
                                    className="px-2.5 py-1 bg-brand-cream border border-[#E5D5C8] text-brand-chocolate rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEditEBook(e)}
                                    className="p-1 px-2.5 bg-brand-cream hover:bg-brand-beige text-brand-chocolate rounded-md font-bold transition duration-250 border border-brand-warm-tan/30 cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    id={`delete-ebook-list-${e.id}`}
                                    onClick={() => {
                                      if (confirm(`Remove digital textbook "${e.name}" from catalog?`)) {
                                        if (checkPermission(['super_admin', 'store_manager', 'content_manager'])) {
                                          deleteEBook(e.id);
                                          triggerToast(`🗑 "${e.name}" removed from the eBook catalog.`, 'success');
                                        }
                                      }
                                    }}
                                    className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250 cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                                if (checkPermission(['super_admin', 'store_manager'])) {
                                  fulfillOrder(o.id);
                                }
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
                                if (checkPermission(['super_admin'])) {
                                  deleteDiscountCode(c.id);
                                  triggerToast(`🗑 Discount code "${c.code}" deleted.`, 'success');
                                }
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
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setDesignSub('cms')}
                className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  designSub === 'cms' ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                }`}
              >
                {designSub === 'cms' && !prefersReducedMotion && (
                  <motion.div layoutId="designActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                )}
                {designSub === 'cms' && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" />
                  <span>Homepage Copywriting</span>
                </span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setDesignSub('assets')}
                className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  designSub === 'assets' ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                }`}
              >
                {designSub === 'assets' && !prefersReducedMotion && (
                  <motion.div layoutId="designActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                )}
                {designSub === 'assets' && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" />
                  <span>Videos & Photo Galleries</span>
                </span>
              </motion.button>
              <motion.button
                id="portal-settings-subtab"
                whileTap={{ scale: 0.98 }}
                onClick={() => setDesignSub('settings')}
                className={`relative px-4 py-2 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-150 focus:outline-none flex items-center gap-1.5 ${
                  designSub === 'settings' ? 'text-white' : 'text-brand-chocolate hover:text-brand-rose'
                }`}
              >
                {designSub === 'settings' && !prefersReducedMotion && (
                  <motion.div layoutId="designActiveSub" className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" style={{ zIndex: 0 }} />
                )}
                {designSub === 'settings' && prefersReducedMotion && (
                  <div className="absolute inset-0 bg-brand-rose rounded-lg shadow-[0_2px_8px_rgba(194,57,90,0.2)]" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Portal Settings</span>
                </span>
              </motion.button>
            </div>
          )}

          {activeTab === 'design' && designSub === 'cms' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
              <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3 mb-4 flex-wrap gap-2">
                <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                  Front-Page Content Management Block
                </h3>
                
                <button
                  type="button"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-full transition-all duration-200 focus:outline-none ${
                    showLivePreview 
                      ? 'bg-brand-rose text-white shadow-[0_2px_8px_rgba(194,57,90,0.18)]' 
                      : 'bg-brand-cream text-[#4A2B20] border border-[#E5D5C8] hover:bg-brand-beige'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showLivePreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
                </button>
              </div>

              <div className={`grid grid-cols-1 ${showLivePreview ? 'lg:grid-cols-2' : ''} gap-8`}>
                <form onSubmit={handleCmsUpdate} className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Hero Main Bold Title</label>
                      <textarea
                        rows={2}
                        value={cmsHeroHead}
                        onChange={(e) => { setCmsHeroHead(e.target.value); autoSaveCms({ heroHeadline: e.target.value }); }}
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark font-semibold leading-normal transition-all duration-150"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Hero Sub-headline message</label>
                      <textarea
                        rows={2}
                        value={cmsHeroSub}
                        onChange={(e) => { setCmsHeroSub(e.target.value); autoSaveCms({ heroSubheadline: e.target.value }); }}
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* Hero Image URL */}
                  <div className="pt-1">
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1 flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5 text-brand-rose" />
                      Homepage Hero Photo URL
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={cmsHeroImage}
                        placeholder="/hero-portrait.jpg or https://..."
                        onChange={(e) => { setCmsHeroImage(e.target.value); autoSaveCms({ heroImageUrl: e.target.value }); }}
                        className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark transition-all duration-150"
                      />
                      {cmsHeroImage && (
                        <img src={cmsHeroImage} alt="Hero preview" className="w-14 h-14 object-cover object-top rounded-xl border border-brand-warm-tan/30 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#A67E6B] mt-1">Paste any image URL. Changes apply instantly to the homepage.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">About Headline Intro text</label>
                      <input
                        type="text"
                        value={cmsAboutHead}
                        onChange={(e) => { setCmsAboutHead(e.target.value); autoSaveCms({ aboutHeadline: e.target.value }); }}
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark font-medium transition-all duration-150"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Customer Showcase Quotation</label>
                      <input
                        type="text"
                        value={cmsPromoQuote}
                        onChange={(e) => { setCmsPromoQuote(e.target.value); autoSaveCms({ promoQuote: e.target.value }); }}
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark transition-all duration-150"
                      />
                    </div>
                  </div>

                  {/* About Image URL */}
                  <div className="pt-1">
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1 flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5 text-brand-rose" />
                      About Page Portrait URL
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={cmsAboutImage}
                        placeholder="/about-portrait.jpg or https://..."
                        onChange={(e) => { setCmsAboutImage(e.target.value); autoSaveCms({ aboutImageUrl: e.target.value }); }}
                        className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark transition-all duration-150"
                      />
                      {cmsAboutImage && (
                        <img src={cmsAboutImage} alt="About preview" className="w-14 h-14 object-cover object-top rounded-xl border border-brand-warm-tan/30 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#A67E6B] mt-1">Paste an image URL or use <code className="bg-brand-cream px-1 rounded">/about-portrait.jpg</code> for the uploaded file.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">Quotation Author</label>
                      <input
                        type="text"
                        value={cmsPromoAuthor}
                        onChange={(e) => { setCmsPromoAuthor(e.target.value); autoSaveCms({ promoAuthor: e.target.value }); }}
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate mb-1">About Long Narrative Bio Story *</label>
                    <textarea
                      rows={6}
                      value={cmsAboutStory}
                      onChange={(e) => { setCmsAboutStory(e.target.value); autoSaveCms({ aboutStory: e.target.value }); }}
                      className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark leading-relaxed transition-all duration-150"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-brand-warm-tan/20">
                    <span className="text-[10px] text-[#A67E6B] flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      Auto-saves 800ms after typing · Instant on storefront
                    </span>
                    
                    <button
                      id="save-cms-copy-btn"
                      type="submit"
                      className="bg-brand-rose hover:bg-brand-berry text-white py-2 px-6 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 focus:outline-none transition-all duration-150"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save &amp; Publish Now</span>
                    </button>
                  </div>
                </form>

                {/* Live Preview Column */}
                {showLivePreview && (
                  <div className="border border-[#E5D5C8]/80 bg-[#FAF7F2] rounded-3xl p-6 shadow-inner space-y-6 max-h-[550px] overflow-y-auto font-sans relative text-left">
                    <div className="absolute top-3 right-3 bg-brand-rose text-white text-[8px] uppercase font-bold px-2 py-0.5 rounded-full z-10 tracking-widest pointer-events-none">
                      Live Storefront Viewport Preview
                    </div>
                    
                    {/* Hero Preview */}
                    <div className="border border-[#E5D5C8]/40 rounded-2xl p-5 bg-white shadow-xs space-y-3">
                      <span className="text-[8.5px] uppercase font-extrabold tracking-widest text-brand-rose block">Hero Section Preview</span>
                      <h1 className="font-serif text-xl font-bold text-brand-dark leading-tight whitespace-pre-wrap">{cmsHeroHead || 'No Headline'}</h1>
                      <p className="text-[#8C6D62] text-xs leading-relaxed whitespace-pre-wrap">{cmsHeroSub || 'No Sub-headline'}</p>
                      <button className="bg-brand-rose text-white px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider pointer-events-none opacity-90 mt-1">
                        Browse Botanical Store
                      </button>
                    </div>

                    {/* About Bio Preview */}
                    <div className="border border-[#E5D5C8]/40 rounded-2xl p-5 bg-white shadow-xs space-y-3">
                      <span className="text-[8.5px] uppercase font-extrabold tracking-widest text-[#4A2B20] block">Biography Narrative Preview</span>
                      <h2 className="font-serif text-base font-bold text-brand-dark leading-tight">{cmsAboutHead || 'No About Headline'}</h2>
                      <p className="text-[#8C6D62] text-xs leading-relaxed whitespace-pre-wrap">{cmsAboutStory || 'No story bio text'}</p>
                    </div>

                    {/* Customer Showcase Quote Preview */}
                    <div className="border border-[#E5D5C8]/30 rounded-2xl p-5 bg-[#4A2B20] text-white shadow-xs space-y-2 text-center">
                      <span className="text-[8.5px] uppercase font-extrabold tracking-widest text-brand-pink block">Showcase Quote Preview</span>
                      <p className="font-serif italic text-xs text-brand-beige">“{cmsPromoQuote || 'No Quote text'}”</p>
                      <p className="text-[9px] font-bold text-brand-pink uppercase tracking-widest">— {cmsPromoAuthor || 'Anonymous'}</p>
                    </div>
                  </div>
                )}
              </div>

              {cmsSuccess && (
                <p className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg text-center font-medium animate-bounce">
                  ✓ Website Text Copy updated successfully on CMS live environment!
                </p>
              )}
            </div>
          )}

          {/* ============================================= */}
          {/* CMS COMPONENT: SERVICES COVER IMAGES         */}
          {/* ============================================= */}
          {activeTab === 'design' && designSub === 'cms' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)] animate-fade-in">
              <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                  Services Cover Images
                </h3>
                <span className="text-[10px] text-[#A67E6B] bg-brand-cream border border-[#E5D5C8]/60 px-3 py-1 rounded-full font-bold">
                  {services.length} Services
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {services.map((svc) => (
                  <div key={svc.id} className="bg-[#FAF6F0] border border-brand-warm-tan/20 rounded-2xl p-4 space-y-4">
                    {/* Current cover preview */}
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-brand-warm-tan/20 bg-brand-beige">
                      <img
                        src={svc.image}
                        alt={svc.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent flex items-end p-3">
                        <p className="text-white text-[10px] font-bold font-serif leading-tight line-clamp-2">{svc.name}</p>
                      </div>
                    </div>

                    {/* Image URL field */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5 flex items-center gap-1.5">
                        <Image className="w-3 h-3 text-brand-rose" /> Cover Image URL
                      </label>
                      <input
                        type="text"
                        defaultValue={svc.image}
                        id={`service-img-url-${svc.id}`}
                        placeholder="https://... or /filename.jpg"
                        className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark"
                      />
                    </div>

                    {/* File upload */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5 flex items-center gap-1.5">
                        <Camera className="w-3 h-3 text-brand-rose" /> Or Upload Photo
                      </label>
                      <ImageDropzone
                        imageValue={svc.image}
                        onImageChange={(img) => {
                          updateService(svc.id, { image: img });
                          const el = document.getElementById(`service-img-url-${svc.id}`) as HTMLInputElement;
                          if (el) el.value = img;
                          triggerToast(`✓ "${svc.name}" cover updated!`, 'success');
                        }}
                        label="Drop photo or click to upload"
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </div>

                    {/* Save URL button */}
                    <button
                      onClick={() => {
                        if (!checkPermission(['super_admin', 'content_manager'])) return;
                        const el = document.getElementById(`service-img-url-${svc.id}`) as HTMLInputElement;
                        const url = el?.value?.trim();
                        if (!url) { triggerToast('Please enter an image URL.', 'error'); return; }
                        updateService(svc.id, { image: url });
                        triggerToast(`✓ "${svc.name}" cover updated and live!`, 'success');
                      }}
                      className="w-full py-2 text-[10.5px] font-extrabold bg-brand-rose hover:bg-brand-berry text-white rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Cover Image
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================= */}
          {/* CMS COMPONENT: BLOG POSTS MANAGEMENT TABLE   */}
          {/* ============================================= */}
          {activeTab === 'design' && designSub === 'cms' && (
            <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)] animate-fade-in">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                  Blog Articles Management
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#A67E6B] bg-brand-cream border border-[#E5D5C8]/60 px-3 py-1 rounded-full font-bold">
                    {blogs.length} Post{blogs.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    id="admin-add-blog-btn"
                    onClick={() => {
                      if (!checkPermission(['super_admin', 'content_manager'])) return;
                      setBlogTitle(''); setBlogExcerpt(''); setBlogContent('');
                      setBlogReadTime('5 min read'); setBlogImage(''); setBlogCategory('Growth Tips');
                      setEditingBlogId(null);
                      setIsAddingBlog(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-rose hover:bg-brand-berry text-white text-[10.5px] font-bold uppercase tracking-wider rounded-xl transition-all duration-150 focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Post
                  </button>
                </div>
              </div>

              {/* Add New Blog Form */}
              <AnimatePresence>
                {isAddingBlog && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-2xl p-5 space-y-4">
                      <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-brand-rose flex items-center gap-1.5">
                        <Book className="w-3.5 h-3.5" /> New Blog Post
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Title *</label>
                          <input type="text" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} placeholder="Post title..." className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category</label>
                          <select value={blogCategory} onChange={e => setBlogCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark">
                            {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Read Time</label>
                          <input type="text" value={blogReadTime} onChange={e => setBlogReadTime(e.target.value)} placeholder="e.g. 5 min read" className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Cover Image URL</label>
                          <input type="text" value={blogImage} onChange={e => setBlogImage(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Excerpt / Subtitle</label>
                          <input type="text" value={blogExcerpt} onChange={e => setBlogExcerpt(e.target.value)} placeholder="Short description shown in previews..." className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Full Article Body *</label>
                          <textarea rows={6} value={blogContent} onChange={e => setBlogContent(e.target.value)} placeholder="Write the full blog post content here..." className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark leading-relaxed" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setIsAddingBlog(false)} className="px-4 py-2 text-[10.5px] font-bold text-brand-chocolate bg-brand-cream border border-[#E5D5C8] rounded-xl hover:bg-brand-beige transition-all">Cancel</button>
                        <button
                          onClick={() => {
                            if (!blogTitle.trim() || !blogContent.trim()) { triggerToast('Title and content are required.', 'error'); return; }
                            addBlogPost({ title: blogTitle.trim(), excerpt: blogExcerpt.trim(), content: blogContent.trim(), readTime: blogReadTime, image: blogImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800', category: blogCategory });
                            triggerToast(`✓ "${blogTitle}" published to blog!`, 'success');
                            setIsAddingBlog(false);
                          }}
                          className="px-5 py-2 text-[10.5px] font-extrabold bg-brand-rose hover:bg-brand-berry text-white rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 focus:outline-none"
                        >
                          <Save className="w-3.5 h-3.5" /> Publish Post
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Blog Table */}
              {blogs.length === 0 ? (
                <p className="text-[11px] text-[#A67E6B] text-center py-8">No blog posts yet. Click "New Post" to create one.</p>
              ) : (
                <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                        <th className="p-3">Cover</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
                      {blogs.map((post) => (
                        <React.Fragment key={post.id}>
                          {/* Normal row */}
                          <tr className={`hover:bg-brand-cream/30 transition-colors ${editingBlogId === post.id ? 'bg-brand-cream/40' : ''}`}>
                            <td className="p-3">
                              <img src={post.image} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-cover rounded border border-brand-warm-tan/20" />
                            </td>
                            <td className="p-3 font-semibold max-w-[200px]">
                              <p className="line-clamp-2 leading-snug">{post.title}</p>
                              <p className="text-[10px] text-[#A67E6B] font-normal mt-0.5">{post.readTime}</p>
                            </td>
                            <td className="p-3 font-mono">{post.category}</td>
                            <td className="p-3 text-[#A67E6B]">{post.date}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  id={`edit-blog-${post.id}`}
                                  onClick={() => {
                                    if (editingBlogId === post.id) { setEditingBlogId(null); return; }
                                    setBlogTitle(post.title);
                                    setBlogExcerpt(post.excerpt);
                                    setBlogContent(post.content);
                                    setBlogReadTime(post.readTime);
                                    setBlogImage(post.image);
                                    setBlogCategory(post.category);
                                    setIsAddingBlog(false);
                                    setEditingBlogId(post.id);
                                  }}
                                  className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition duration-150 focus:outline-none flex items-center gap-1 ${editingBlogId === post.id ? 'bg-brand-dark text-white' : 'bg-[#EEF7F1] text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}
                                >
                                  <Edit className="w-3 h-3" />
                                  {editingBlogId === post.id ? 'Close' : 'Edit'}
                                </button>
                                <button
                                  id={`delete-blog-${post.id}`}
                                  onClick={() => {
                                    if (confirm(`Remove blog post "${post.title}"?`)) {
                                      if (checkPermission(['super_admin', 'content_manager'])) {
                                        if (editingBlogId === post.id) setEditingBlogId(null);
                                        deleteBlogPost(post.id);
                                        triggerToast(`🗑 "${post.title}" removed from blog.`, 'success');
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white text-[10.5px] rounded-md font-bold transition duration-150 focus:outline-none flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline edit form */}
                          {editingBlogId === post.id && (
                            <tr>
                              <td colSpan={5} className="p-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="bg-[#FAF6F0] border-t border-brand-warm-tan/20 p-5 space-y-4"
                                >
                                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-rose flex items-center gap-1.5">
                                    <Edit className="w-3 h-3" /> Editing: {post.title}
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Title *</label>
                                      <input type="text" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category</label>
                                      <select value={blogCategory} onChange={e => setBlogCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark">
                                        {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Read Time</label>
                                      <input type="text" value={blogReadTime} onChange={e => setBlogReadTime(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Cover Image URL</label>
                                      <div className="flex gap-2 items-center">
                                        <input type="text" value={blogImage} onChange={e => setBlogImage(e.target.value)} className="flex-1 px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                                        {blogImage && <img src={blogImage} alt="" className="w-10 h-10 object-cover rounded border border-brand-warm-tan/20 shrink-0" />}
                                      </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Excerpt</label>
                                      <input type="text" value={blogExcerpt} onChange={e => setBlogExcerpt(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Full Article Body *</label>
                                      <textarea rows={8} value={blogContent} onChange={e => setBlogContent(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark leading-relaxed" />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2 pt-2">
                                    <button onClick={() => setEditingBlogId(null)} className="px-4 py-2 text-[10.5px] font-bold text-brand-chocolate bg-brand-cream border border-[#E5D5C8] rounded-xl hover:bg-brand-beige transition-all">Cancel</button>
                                    <button
                                      onClick={() => {
                                        if (!blogTitle.trim() || !blogContent.trim()) { triggerToast('Title and content are required.', 'error'); return; }
                                        updateBlogPost(post.id, { title: blogTitle.trim(), excerpt: blogExcerpt.trim(), content: blogContent.trim(), readTime: blogReadTime, image: blogImage || post.image, category: blogCategory });
                                        triggerToast(`✓ "${blogTitle}" updated and live!`, 'success');
                                        setEditingBlogId(null);
                                      }}
                                      className="px-5 py-2 text-[10.5px] font-extrabold bg-brand-rose hover:bg-brand-berry text-white rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 focus:outline-none"
                                    >
                                      <Save className="w-3.5 h-3.5" /> Save Changes
                                    </button>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                    onClick={() => {
                      if (isAddingVideo) {
                        resetVideoForm();
                      } else {
                        setIsAddingVideo(true);
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Video</span>
                  </button>
                </div>

                {isAddingVideo && (
                  <form onSubmit={handleAddVideoSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
                    <p className="font-serif font-bold text-brand-chocolate text-[13px] border-b border-brand-warm-tan/20 pb-1.5">
                      {editingVideoId ? `Edit Video Masterclass` : 'Add New Video Masterclass'}
                    </p>
                    <div className="space-y-4">
                      {/* ── 1. Video Link (most important — shown first) ── */}
                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate">Video Link *</label>
                        <input
                          id="vid-url-input"
                          type="url"
                          required
                          value={vidUrl}
                          onChange={(e) => {
                            setVidUrl(e.target.value);
                            setUploadedVideoFile(null);
                          }}
                          placeholder="https://www.tiktok.com/@username/video/... or YouTube or MP4 link"
                          className="w-full px-3 py-2.5 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none font-mono text-[11px] placeholder:text-brand-dark/30"
                        />
                        {/* Live type detection badge */}
                        {vidUrl.trim() && (() => {
                          const res = resolveVideoSource(vidUrl);
                          if (res.type === 'tiktok') return <span className="inline-flex items-center gap-1 bg-black text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"><svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.56V6.78a4.85 4.85 0 0 1-1.07-.09z"/></svg> TikTok detected</span>;
                          if (res.type === 'youtube') return <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">🔴 YouTube{vidUrl.includes('/shorts/') ? ' Shorts' : ''} detected</span>;
                          if (res.type === 'direct') return <span className="inline-flex items-center gap-1 bg-zinc-700 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">■ MP4 / Direct video detected</span>;
                          return null;
                        })()}
                        <p className="text-[9px] text-brand-dark/40 leading-relaxed">
                          Paste any TikTok, YouTube, YouTube Shorts, or direct MP4 link. No embed code needed.
                        </p>
                      </div>

                      {/* ── 2. Video Title ── */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Video Title *</label>
                        <input
                          type="text"
                          required
                          value={vidTitle}
                          onChange={(e) => setVidTitle(e.target.value)}
                          placeholder="e.g. 3 Steps to Seal Low Porosity 4C Hair"
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none"
                        />
                      </div>

                      {/* ── 3. Category ── */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category</label>
                        <select
                          value={vidCategory}
                          onChange={(e) => setVidCategory(e.target.value as any)}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none font-semibold text-brand-chocolate"
                        >
                          <option>Wash Day</option>
                          <option>Styling</option>
                          <option>Protective Styles</option>
                          <option>Growth Tips</option>
                          <option>Product Reviews</option>
                          <option>Tutorials</option>
                        </select>
                      </div>

                      {/* ── 4. Description (optional) ── */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Description <span className="text-brand-dark/40 font-normal normal-case">(optional)</span></label>
                        <textarea
                          value={vidDescription}
                          onChange={(e) => setVidDescription(e.target.value)}
                          placeholder="Short description shown in the modal lightbox..."
                          rows={2}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none resize-none"
                        />
                      </div>

                      {/* ── 5. Thumbnail URL (optional) ── */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Thumbnail URL <span className="text-brand-dark/40 font-normal normal-case">(optional — auto-generated for YouTube)</span></label>
                        <input
                          type="url"
                          value={uploadedThumbFile ? '' : vidThumb}
                          onChange={(e) => { setVidThumb(e.target.value); setUploadedThumbFile(null); }}
                          placeholder="https://images.unsplash.com/... or any image URL"
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none font-mono text-[11px]"
                        />
                        {vidThumb && !uploadedThumbFile && (
                          <img src={vidThumb} alt="thumb preview" referrerPolicy="no-referrer" className="mt-2 h-16 w-10 object-cover rounded border border-brand-warm-tan/20" />
                        )}
                      </div>

                      {/* ── 6. Publishing Status ── */}
                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-brand-chocolate">Status</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => setVidStatus('draft')}
                            className={`py-2 px-3 rounded-lg text-center border font-bold transition-all text-[10px] uppercase tracking-wider ${ vidStatus === 'draft' ? 'bg-brand-chocolate text-white border-brand-chocolate' : 'bg-brand-cream text-brand-chocolate border-brand-warm-tan/30 hover:bg-brand-beige/25' }`}
                          >Draft</button>
                          <button type="button" onClick={() => setVidStatus('published')}
                            className={`py-2 px-3 rounded-lg text-center border font-bold transition-all text-[10px] uppercase tracking-wider ${ vidStatus === 'published' ? 'bg-brand-chocolate text-white border-brand-chocolate' : 'bg-brand-cream text-brand-chocolate border-brand-warm-tan/30 hover:bg-brand-beige/25' }`}
                          >Published</button>
                          <button type="button" onClick={() => setVidStatus('scheduled')}
                            className={`py-2 px-3 rounded-lg text-center border font-bold transition-all text-[10px] uppercase tracking-wider ${ vidStatus === 'scheduled' ? 'bg-brand-chocolate text-white border-brand-chocolate' : 'bg-brand-cream text-brand-chocolate border-brand-warm-tan/30 hover:bg-brand-beige/25' }`}
                          >Schedule</button>
                        </div>
                        {vidStatus === 'scheduled' && (
                          <input
                            type="datetime-local"
                            required
                            value={vidScheduledAt}
                            onChange={(e) => setVidScheduledAt(e.target.value)}
                            className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none font-semibold text-brand-chocolate"
                          />
                        )}
                      </div>

                      {/* ── 7. Featured toggle ── */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="vid-featured-toggle"
                          checked={vidIsFeatured}
                          onChange={(e) => setVidIsFeatured(e.target.checked)}
                          className="rounded text-brand-rose focus:ring-brand-rose cursor-pointer animate-none"
                        />
                        <label htmlFor="vid-featured-toggle" className="text-[10px] uppercase font-bold text-brand-chocolate cursor-pointer select-none">
                          Pin as Featured video
                        </label>
                      </div>

                      {/* ── 8. Advanced (collapsible) ── */}
                      <details className="border border-brand-warm-tan/30 rounded-lg">
                        <summary className="px-3 py-2 text-[10px] uppercase font-bold text-brand-chocolate cursor-pointer select-none hover:bg-brand-beige/30 rounded-lg">
                          ▸ Advanced Options (related products, views, file upload)
                        </summary>
                        <div className="px-3 pb-4 pt-3 space-y-4">
                          {/* Simulated views */}
                          {vidStatus === 'published' && (
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Display Views (e.g. 12.5k)</label>
                              <input
                                type="text"
                                value={vidViews}
                                onChange={(e) => setVidViews(e.target.value)}
                                className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none font-mono"
                              />
                            </div>
                          )}
                          {/* Related Products & eBooks */}
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Link Products / eBooks</label>
                            <div className="bg-brand-cream border border-brand-warm-tan/30 p-2.5 rounded-lg max-h-36 overflow-y-auto space-y-1 text-[10px]">
                              {products.map(p => (
                                <label key={p.id} className="flex items-center gap-2 cursor-pointer text-brand-dark py-0.5 hover:bg-brand-beige/25 px-1 rounded select-none">
                                  <input type="checkbox" checked={vidRelatedIds.includes(p.id)}
                                    onChange={(evt) => { if (evt.target.checked) setVidRelatedIds(prev => [...prev, p.id]); else setVidRelatedIds(prev => prev.filter(id => id !== p.id)); }}
                                    className="rounded text-brand-rose focus:ring-brand-rose"
                                  />
                                  <span className="truncate flex-1 font-medium font-sans text-[#543F35]">[Product] {p.name} — ${p.price.toFixed(2)}</span>
                                </label>
                              ))}
                              {ebooks.map(eb => (
                                <label key={eb.id} className="flex items-center gap-2 cursor-pointer text-brand-dark py-0.5 hover:bg-brand-beige/25 px-1 rounded select-none">
                                  <input type="checkbox" checked={vidRelatedIds.includes(eb.id)}
                                    onChange={(evt) => { if (evt.target.checked) setVidRelatedIds(prev => [...prev, eb.id]); else setVidRelatedIds(prev => prev.filter(id => id !== eb.id)); }}
                                    className="rounded text-brand-rose focus:ring-brand-rose"
                                  />
                                  <span className="truncate flex-1 font-medium font-sans text-brand-rose">[eBook] {eb.name} — ${eb.price.toFixed(2)}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {/* File upload option */}
                          <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-[#8C6D62]">Upload Video File (alternative to link)</label>
                            <VideoDropzone
                              videoValue={vidUrl}
                              onVideoChange={(newUrl, file) => {
                                setVidUrl(newUrl);
                                if (file) {
                                  setUploadedVideoFile(file);
                                  if (!vidTitle) {
                                    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                                    setVidTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                                  }
                                } else {
                                  setUploadedVideoFile(null);
                                }
                              }}
                              label="Upload Video"
                              prefersReducedMotion={prefersReducedMotion}
                            />
                          </div>
                        </div>
                      </details>

                      {/* Video Player Live Preview */}
                      {vidUrl && (
                        <div className="border border-brand-warm-tan/25 p-4 rounded-3xl bg-[#FAF6F0] space-y-3.5 flex flex-col items-center select-none w-full max-w-[270px] mx-auto">
                          <span className="text-[10px] uppercase font-bold text-[#8C6D62] tracking-[0.15em] text-center block">Live Mobile Preview</span>
                          
                          {/* Premium Smartphone Frame Mockup */}
                          <div className="w-[200px] h-[356px] rounded-[36px] border-[6px] border-[#2C221E] bg-black relative shadow-xl overflow-hidden flex flex-col group transition-transform duration-300 hover:scale-[1.02]">
                            
                            {/* Bezel Notch / Dynamic Island */}
                            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-[#2C221E] rounded-full z-40 flex items-center justify-between px-2">
                              <span className="w-1 h-1 bg-[#1a1a1a] rounded-full" />
                              <span className="w-1.5 h-1.5 bg-[#0d0d0d] rounded-full" />
                            </div>

                            {/* Top Status Bar */}
                            <div className="absolute top-1 left-0 right-0 px-4 flex justify-between items-center text-[7px] text-white/90 font-sans font-bold z-30 select-none pointer-events-none">
                              <span>9:41</span>
                              <div className="flex items-center gap-1">
                                <svg className="w-1.5 h-1.5 fill-white" viewBox="0 0 24 24"><path d="M12 21l-12-18h24z"/></svg>
                                <div className="w-2.5 h-1.5 border border-white/80 rounded-[2px] p-[0.5px] flex items-center"><div className="w-1.5 h-full bg-white rounded-[1px]"></div></div>
                              </div>
                            </div>

                            {/* Video Display Stage */}
                            <div className="absolute inset-0 w-full h-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                              {(() => {
                                const res = resolveVideoSource(vidUrl);
                                if (res.type === 'youtube' && res.id) {
                                  return (
                                    <iframe
                                      title="Youtube Preview"
                                      src={`${res.url}?controls=0&modestbranding=1&autoplay=1&mute=1&playlist=${res.id}&loop=1`}
                                      className="absolute inset-0 w-full h-full scale-[1.3] pointer-events-none object-cover"
                                    />
                                  );
                                }
                                if (res.type === 'tiktok' && res.id) {
                                  return (
                                    <iframe
                                      title="TikTok Preview"
                                      src={`${res.url}?autoplay=1&mute=1`}
                                      className="absolute inset-0 w-full h-full scale-[1.1] pointer-events-none object-cover"
                                    />
                                  );
                                }
                                if (res.type === 'direct' && res.url) {
                                  return (
                                    <video
                                      src={res.url}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="absolute inset-0 w-full h-full object-cover"
                                    />
                                  );
                                }
                                return <span className="text-[9px] text-zinc-400 p-3 text-center">Invalid Link. Enter a valid YouTube, TikTok, or MP4 URL.</span>;
                              })()}
                            </div>

                            {/* Transparent click shield to prevent iframe hijacking */}
                            <div className="absolute inset-0 bg-transparent z-10" />

                            {/* Phone bottom swipe home indicator */}
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-white/70 rounded-full z-30" />

                            {/* TikTok / Reels Style User-facing Overlay Elements */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 z-20 pointer-events-none flex flex-col justify-end p-2.5 text-white">
                              {/* Preview Watermark Badge */}
                              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-brand-rose/90 text-white text-[5.5px] font-extrabold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full shadow-xs">
                                Live Preview
                              </div>

                              {/* Sidebar Actions */}
                              <div className="absolute right-2 bottom-10 flex flex-col gap-2.5 items-center">
                                {/* Profile circle */}
                                <div className="w-5 h-5 rounded-full border border-white/85 overflow-hidden bg-brand-beige shadow-sm">
                                  <img src="/about-portrait.jpg" className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex flex-col items-center">
                                  <svg className="w-3.5 h-3.5 text-white/95 fill-white/10" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                  <span className="text-[6px] font-semibold mt-0.5">1.2k</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <svg className="w-3.5 h-3.5 text-white/95 fill-white/10" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                  <span className="text-[6px] font-semibold mt-0.5">84</span>
                                </div>
                                <svg className="w-3.5 h-3.5 text-white/95" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8m-4-6-4-4-4 4m4-4v13"/></svg>
                              </div>

                              {/* Details text */}
                              <div className="space-y-1 max-w-[140px] text-left">
                                <p className="text-[8px] font-bold tracking-wide">@cartiae_rae</p>
                                <p className="text-[7.5px] leading-tight text-white/90 font-sans font-medium line-clamp-2 font-sans">
                                  {vidTitle || "Untitled Video Masterclass"}
                                </p>
                                <div className="pt-0.5">
                                  <span className="inline-block bg-[#FAF6F0]/25 text-white border border-white/10 text-[5.5px] uppercase tracking-widest font-extrabold px-1 rounded-sm">
                                    {vidCategory}
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                    <div className="flex justify-end gap-2 pt-2 text-[10.5px]">
                      <button
                        type="button"
                        onClick={resetVideoForm}
                        className="px-3 py-1.5 border border-brand-warm-tan hover:bg-brand-cream rounded cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase cursor-pointer transition"
                      >
                        {editingVideoId ? 'Save Changes' : 'Publish Video'}
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
                        <th className="p-3">Video Title / Category / Status</th>
                        <th className="p-3">Views</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
                      {[...videos].sort((a, b) => {
                        const numA = parseInt(a.id.replace('vid-', ''), 10) || 0;
                        const numB = parseInt(b.id.replace('vid-', ''), 10) || 0;
                        return numB - numA;
                      }).map((vid) => (
                        <tr key={vid.id} className="hover:bg-brand-cream/30">
                          <td className="p-3">
                            <img src={vid.thumbnailUrl || vidThumb} referrerPolicy="no-referrer" alt="" className="w-12 h-14 object-cover rounded border border-brand-warm-tan/20 shadow-xs" />
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-semibold text-brand-chocolate">{vid.title}</p>
                                {vid.isFeatured && (
                                  <span className="bg-brand-rose/10 text-brand-rose text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded font-mono">
                                    Featured #{videos.filter(v => v.isFeatured).sort((a,b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999)).findIndex(v => v.id === vid.id) + 1}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] uppercase tracking-wider text-brand-rose font-bold">{vid.category}</span>
                                <span className="text-zinc-300 font-normal">•</span>
                                {(() => {
                                  const status = vid.status || 'published';
                                  if (status === 'draft') {
                                    return (
                                      <span className="bg-zinc-100 text-zinc-600 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded font-mono">
                                        Draft
                                      </span>
                                    );
                                  }
                                  if (status === 'scheduled') {
                                    const dateStr = vid.scheduledAt ? new Date(vid.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'TBD';
                                    return (
                                      <span className="bg-blue-50 text-blue-800 border border-blue-100 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded font-mono">
                                        Scheduled: {dateStr}
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="bg-emerald-50 text-emerald-800 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded font-mono">
                                      Published
                                    </span>
                                  );
                                })()}
                              </div>
                              {vid.description && (
                                <p className="text-[10px] text-[#8C6D62]/80 line-clamp-1 mt-0.5">{vid.description}</p>
                              )}
                              {vid.relatedIds && vid.relatedIds.length > 0 && (
                                <span className="text-[8.5px] text-[#A67E6B] font-semibold mt-0.5 block">
                                  Linked Items: {vid.relatedIds.length}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-mono">
                            {vid.status === 'draft' ? (
                              <span className="text-zinc-400 italic">Draft</span>
                            ) : (
                              vid.viewsCount?.toLocaleString() || vid.views || '0'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setViewingAnalyticsVideo(vid)}
                                className="p-1 px-2.5 bg-[#FAF6F0] hover:bg-brand-pink-light text-[#8C6D62] font-bold rounded-md text-[10px] transition duration-200 border border-brand-warm-tan/30 whitespace-nowrap cursor-pointer"
                              >
                                Analytics
                              </button>
                              <button
                                onClick={() => {
                                  setVidTitle(vid.title);
                                  setVidViews(vid.views);
                                  setVidCategory(vid.category);
                                  setVidUrl(vid.videoUrl);
                                  setVidThumb(vid.thumbnailUrl);
                                  setVidDescription(vid.description || '');
                                  setVidRelatedIds(vid.relatedIds || []);
                                  setVidIsFeatured(!!vid.isFeatured);
                                  setVidStatus(vid.status || 'published');
                                  setVidScheduledAt(vid.scheduledAt || '');
                                  setUploadedVideoFile(null);
                                  setUploadedThumbFile(null);
                                  setEditingVideoId(vid.id);
                                  setIsAddingVideo(true);
                                }}
                                className="p-1 px-2.5 bg-brand-cream hover:bg-brand-beige text-[#543F35] font-bold rounded-md text-[10px] transition duration-200 border border-brand-warm-tan/25 whitespace-nowrap cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove video "${vid.title}"?`)) {
                                    if (checkPermission(['super_admin', 'store_manager', 'content_manager'])) {
                                      deleteVideo(vid.id);
                                      triggerToast(`🗑 "${vid.title}" removed from the video feed.`, 'success');
                                    }
                                  }
                                }}
                                className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md text-[10px] font-bold transition duration-200 whitespace-nowrap cursor-pointer"
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

                {/* Featured Video Reordering Panel */}
                {videos.filter(v => v.isFeatured).length > 0 && (
                  <div className="bg-[#FAF6F0] border border-brand-warm-tan/30 p-5 rounded-2xl space-y-3 mt-6">
                    <p className="font-serif font-bold text-brand-chocolate text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-rose animate-pulse" />
                      Featured Video Custom Ordering
                    </p>
                    <p className="text-[10px] text-[#8C6D62] leading-tight">
                      Adjust the layout order of featured video masterclasses on the public Watch Tutorials page.
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {videos
                        .filter(v => v.isFeatured)
                        .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
                        .map((vid, idx, arr) => (
                          <div
                            key={vid.id}
                            className="bg-white border border-[#E5D5C8]/60 p-2.5 rounded-xl flex items-center justify-between text-xs hover:border-brand-rose/30 transition-all shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-extrabold text-[10px] bg-brand-rose/10 text-brand-rose px-2 py-0.5 rounded-full shrink-0">
                                #{idx + 1}
                              </span>
                              <img
                                src={vid.thumbnailUrl}
                                alt=""
                                className="w-8 h-10 object-cover rounded border border-[#E5D5C8]/40 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-brand-chocolate truncate">{vid.title}</p>
                                <span className="text-[9px] text-[#A67E6B] font-bold">{vid.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveFeaturedVideo(vid.id, 'up')}
                                className="w-6 h-6 rounded bg-brand-cream hover:bg-brand-beige border border-brand-warm-tan/20 flex items-center justify-center font-bold disabled:opacity-30 disabled:pointer-events-none text-brand-chocolate cursor-pointer transition"
                                title="Move Up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                disabled={idx === arr.length - 1}
                                onClick={() => moveFeaturedVideo(vid.id, 'down')}
                                className="w-6 h-6 rounded bg-brand-cream hover:bg-brand-beige border border-brand-warm-tan/20 flex items-center justify-center font-bold disabled:opacity-30 disabled:pointer-events-none text-brand-chocolate cursor-pointer transition"
                                title="Move Down"
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Photo Gallery Showcase Creator */}
              <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
                <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
                    Image Gallery Showcase
                  </h3>
                  <button
                    onClick={() => {
                      if (isAddingGallery && editingGalleryId) {
                        setEditingGalleryId(null);
                        setGalCaption('');
                        setGalImage('');
                      } else {
                        setIsAddingGallery(!isAddingGallery);
                        setEditingGalleryId(null);
                        setGalCaption('');
                        setGalImage('');
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingGalleryId ? "Add New Photo" : "Upload Photo"}</span>
                  </button>
                </div>

                {isAddingGallery && (
                  <form onSubmit={handleAddGallerySubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
                    <p className="font-serif font-bold text-brand-chocolate">
                      {editingGalleryId ? "Edit Gallery Photo Details:" : "Upload Gallery Photo:"}
                    </p>
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
                        </select>
                      </div>
                      
                      {/* Dual upload or url fields */}
                      <div className="border border-brand-warm-tan/30 p-3 rounded-xl space-y-2 bg-white/70">
                        <p className="font-bold text-[10px] uppercase text-[#7C6354]">Photo Source File:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ImageDropzone
                            imageValue={galImage}
                            onImageChange={setGalImage}
                            label="Gallery Photo"
                            prefersReducedMotion={prefersReducedMotion}
                          />
                          <div className="flex flex-col justify-center">
                            <span className="text-[9.5px] font-bold text-[#7C6354] uppercase mb-1">Or Insert URL Link</span>
                            <input
                              type="url"
                              placeholder="https://example.com/photo.jpg"
                              value={galImage.startsWith('data:') ? '' : galImage}
                              onChange={(e) => setGalImage(e.target.value)}
                              className="px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingGallery(false);
                          setEditingGalleryId(null);
                          setGalCaption('');
                          setGalImage('');
                        }}
                        className="px-3 py-1.5 border border-brand-warm-tan hover:bg-brand-cream rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase cursor-pointer"
                      >
                        {editingGalleryId ? "Save Changes" : "Publish Photo"}
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
                        <th className="p-3 text-center">Actions</th>
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
                          <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleEditGalleryClick(gObj)}
                              className="p-1 px-2.5 bg-brand-cream hover:bg-brand-rose text-brand-dark hover:text-white rounded border border-brand-warm-tan/20 text-[11px] font-bold transition duration-200 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove photo "${gObj.caption}"?`)) {
                                  if (checkPermission(['super_admin', 'store_manager', 'content_manager'])) {
                                    deleteGalleryItem(gObj.id);
                                    triggerToast(`🗑 "${gObj.caption}" removed from the Lookbook.`, 'success');
                                  }
                                }
                              }}
                              className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded text-[11px] font-bold transition duration-200 cursor-pointer"
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
          )}

        </div>
      )}

      {/* Analytics Modal */}
      <AnimatePresence>
        {viewingAnalyticsVideo && (
          <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-brand-cream border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_12px_40px_rgba(74,43,32,0.1)] relative overflow-hidden"
            >
              {/* Accent line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-rose via-brand-pink to-brand-chocolate"></div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-brand-rose font-extrabold bg-brand-pink-light px-2 py-0.5 rounded-full">
                    Video Analytics
                  </span>
                  <h3 className="font-serif text-lg font-bold text-brand-dark mt-2">
                    {viewingAnalyticsVideo.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Category: {viewingAnalyticsVideo.category} | Status: {viewingAnalyticsVideo.status || 'published'}
                  </p>
                </div>
                <button
                  onClick={() => setViewingAnalyticsVideo(null)}
                  className="text-zinc-400 hover:text-zinc-600 focus:outline-none text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Core Metrics */}
                <div className="bg-white border border-[#E5D5C8]/40 p-3 rounded-2xl text-center shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Views</span>
                  <p className="font-serif text-base font-bold text-brand-chocolate mt-1">
                    {viewingAnalyticsVideo.viewsCount?.toLocaleString() || viewingAnalyticsVideo.views || '0'}
                  </p>
                </div>
                <div className="bg-white border border-[#E5D5C8]/40 p-3 rounded-2xl text-center shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Likes</span>
                  <p className="font-serif text-base font-bold text-brand-chocolate mt-1">
                    {viewingAnalyticsVideo.likesCount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-white border border-[#E5D5C8]/40 p-3 rounded-2xl text-center shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Comments</span>
                  <p className="font-serif text-base font-bold text-brand-chocolate mt-1">
                    {viewingAnalyticsVideo.commentsCount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-white border border-[#E5D5C8]/40 p-3 rounded-2xl text-center shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Saves</span>
                  <p className="font-serif text-base font-bold text-brand-chocolate mt-1">
                    {viewingAnalyticsVideo.savesCount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-white border border-[#E5D5C8]/40 p-3 rounded-2xl text-center shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Shares</span>
                  <p className="font-serif text-base font-bold text-brand-chocolate mt-1">
                    {viewingAnalyticsVideo.sharesCount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="bg-white border border-[#E5D5C8]/40 p-3 rounded-2xl text-center shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Conversions</span>
                  <p className="font-serif text-base font-bold text-brand-chocolate mt-1">
                    {viewingAnalyticsVideo.conversionCount?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E5D5C8]/40 p-4 rounded-2xl mb-6 space-y-3 shadow-2xs">
                <h4 className="font-serif text-xs font-bold text-brand-chocolate border-b border-zinc-100 pb-1.5">
                  eCommerce Click Funnel
                </h4>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">&ldquo;Shop this routine&rdquo; clicks:</span>
                  <span className="font-bold text-brand-chocolate">{viewingAnalyticsVideo.shopClicks?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Product CTA clicks:</span>
                  <span className="font-bold text-brand-chocolate">{viewingAnalyticsVideo.productAddClicks?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">eBook CTA clicks:</span>
                  <span className="font-bold text-brand-chocolate">{viewingAnalyticsVideo.ebookAddClicks?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-zinc-100 pt-2">
                  <span className="text-zinc-500 font-bold">Conversion Rate (vs Views):</span>
                  <span className="font-bold text-brand-rose">
                    {(() => {
                      const views = viewingAnalyticsVideo.viewsCount || 1;
                      const convs = viewingAnalyticsVideo.conversionCount || 0;
                      return ((convs / Math.max(views, 1)) * 100).toFixed(2) + '%';
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingAnalyticsVideo(null)}
                  className="px-5 py-2 bg-brand-chocolate hover:bg-brand-dark text-white rounded-xl font-bold uppercase text-[10.5px] cursor-pointer transition shadow-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
