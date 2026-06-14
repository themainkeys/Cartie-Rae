import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TikTokVideo } from '../types';
import { 
  Play, Pause, Heart, Bookmark, Share2, MessageSquare, ShoppingBag, 
  X, Send, Sparkles, Volume2, VolumeX, Eye, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Static fallback related items map for "Shop this routine" feature
const getRelatedItems = (videoId: string) => {
  if (videoId === 'vid-1') {
    return [
      { id: 'prod-1', type: 'product', name: 'Botanical Growth Oil', price: 38.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400' },
      { id: 'ebook-1', type: 'ebook', name: 'The 4C Growth Blueprint', price: 24.99, image: 'https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800' }
    ];
  }
  if (videoId === 'vid-2') {
    return [
      { id: 'prod-3', type: 'product', name: 'Detangling Collection', price: 45.00, image: 'https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=400' },
      { id: 'prod-2', type: 'product', name: 'Silk Sleep Cap', price: 25.00, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400' }
    ];
  }
  if (videoId === 'vid-3') {
    return [
      { id: 'prod-1', type: 'product', name: 'Botanical Growth Oil', price: 38.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400' }
    ];
  }
  if (videoId === 'vid-4') {
    return [
      { id: 'prod-3', type: 'product', name: 'Detangling Collection', price: 45.00, image: 'https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=400' }
    ];
  }
  if (videoId === 'vid-5') {
    return [
      { id: 'prod-2', type: 'product', name: 'Silk Sleep Cap', price: 25.00, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400' }
    ];
  }
  return [
    { id: 'prod-1', type: 'product', name: 'Botanical Growth Oil', price: 38.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400' }
  ];
};

// Static fallback captions for short-form feed
const getVideoDescription = (videoId: string) => {
  switch (videoId) {
    case 'vid-1':
      return 'Learn the L.C.O moisture application method to retain hydration for up to 5 days without buildup.';
    case 'vid-2':
      return 'Step-by-step styling tutorial on coily Bantu Knots. Perfect protective styling details.';
    case 'vid-3':
      return 'Increase blood circulation to coily roots using light organic botanical dropper oils.';
    case 'vid-4':
      return 'Tension-free goddess braids base layout. Protects sensitive edges from mechanical stress.';
    case 'vid-5':
      return 'Flat flat cornrow base mapping designed specifically under silk and fiber wig caps.';
    default:
      return 'Exclusive Cartiae Rae natural hair styling guidelines and masterclass routines.';
  }
};

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

interface VideoGridCardProps {
  video: TikTokVideo;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  commentsCount: number;
  relatedItemsCount: number;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onClick: () => void;
  prefersReducedMotion: boolean;
}

const VideoGridCard: React.FC<VideoGridCardProps> = ({
  video,
  isLiked,
  isSaved,
  likesCount,
  commentsCount,
  relatedItemsCount,
  onLike,
  onSave,
  onShare,
  onClick,
  prefersReducedMotion
}) => {
  const [playPreview, setPlayPreview] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const resolved = useMemo(() => resolveVideoSource(video.videoUrl), [video.videoUrl]);

  const duration = useMemo(() => {
    const sum = video.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const sec = (sum % 28) + 30;
    return `0:${sec}`;
  }, [video.id]);

  const handleMouseEnter = () => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setPlayPreview(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setPlayPreview(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="w-full aspect-[9/16] max-w-[310px] sm:max-w-[320px] rounded-[32px] border border-brand-warm-tan/25 relative flex flex-col justify-end overflow-hidden bg-brand-cream shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 cursor-pointer select-none"
    >
      <style>{`
        @keyframes progressLoop {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>

      {/* Video preview / Cover stage */}
      <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
        <AnimatePresence mode="wait">
          {playPreview ? (
            <motion.div
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full z-10"
            >
              {resolved.type === 'youtube' && (
                <iframe
                  title={video.title}
                  src={`${resolved.url}?autoplay=1&mute=1&controls=0&loop=1&playlist=${resolved.id}&start=0&modestbranding=1&iv_load_policy=3&showinfo=0&rel=0`}
                  className="absolute inset-0 w-full h-full scale-[1.35] pointer-events-none object-cover"
                  allow="autoplay; encrypted-media"
                />
              )}
              {resolved.type === 'tiktok' && (
                <iframe
                  title={video.title}
                  src={`${resolved.url}?autoplay=1&mute=1`}
                  className="absolute inset-0 w-full h-full scale-[1.15] pointer-events-none object-cover"
                  allow="autoplay; encrypted-media"
                />
              )}
              {resolved.type === 'direct' && (
                <video
                  ref={videoRef}
                  src={resolved.url}
                  autoPlay
                  muted
                  playsInline
                  loop
                  controls={false}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {/* Click shield */}
              <div className="absolute inset-0 bg-transparent z-15" />
            </motion.div>
          ) : (
            <motion.div
              key="thumbnail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full relative"
            >
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {/* Play overlay hover indicator */}
              <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/10 hover:bg-brand-dark/20 transition-all duration-300">
                <span className="p-3 bg-[#FAF6F0]/90 backdrop-blur-sm text-brand-rose rounded-full shadow-md">
                  <Play className="w-4.5 h-4.5 fill-brand-rose ml-0.5" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress loop indicator */}
      {playPreview && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 overflow-hidden">
          <div 
            className="h-full bg-brand-rose origin-left"
            style={{
              animation: 'progressLoop 10s linear infinite'
            }}
          />
        </div>
      )}

      {/* Info Overlay and Vignette Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-brand-dark/95 via-brand-dark/45 to-transparent pointer-events-none z-10" />
      
      {/* Left-Aligned Metadata Details */}
      <div className="absolute left-4 bottom-5 right-14 z-20 text-white text-left flex flex-col gap-1 pointer-events-none">
        
        {/* Creator Badge and Category Row */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/10">
            <img 
              src="/about-portrait.jpg" 
              alt="Cartiae profile" 
              className="w-3.5 h-3.5 rounded-full object-cover"
            />
            <span className="text-[8.5px] font-bold text-white tracking-wide font-sans">
              Cartiae Rae
            </span>
          </div>

          <span className="bg-brand-rose/90 backdrop-blur-xs text-[#FAF6F0] text-[8px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded font-mono">
            {video.category}
          </span>
        </div>
        
        <h3 className="font-serif text-xs sm:text-[13px] font-bold text-[#FAF6F0] line-clamp-1 leading-snug tracking-wide mt-1.5">
          {video.title}
        </h3>
        
        <p className="font-sans text-[9.5px] text-[#EDE3DE]/85 line-clamp-2 leading-relaxed mt-0.5">
          {video.description || 'Exclusive Cartiae Rae natural hair styling guidelines and masterclass routines.'}
        </p>

        <div className="text-[9px] text-[#EDE3DE]/70 font-semibold font-mono flex items-center gap-2 mt-1 select-none">
          <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> {video.views}</span>
          <span>•</span>
          <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {duration}</span>
        </div>

        {/* Shop Routine Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(); // Opens detail lightbox modal
          }}
          className="mt-2.5 bg-[#FAF6F0] hover:bg-brand-rose text-brand-dark hover:text-white px-3 py-1.5 rounded-xl text-[9px] uppercase font-extrabold tracking-widest transition-all duration-300 flex items-center gap-1 cursor-pointer w-fit pointer-events-auto shadow-sm"
        >
          <ShoppingBag className="w-3 h-3 shrink-0" />
          <span>Shop Routine ({relatedItemsCount})</span>
        </button>
      </div>

      {/* Right-Aligned Floating Social Actions Panel */}
      <div className="absolute right-3.5 bottom-6 z-25 flex flex-col items-center gap-3.5 text-white pointer-events-auto">
        {/* Like Action */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className={`w-8.5 h-8.5 rounded-full bg-black/30 hover:bg-brand-rose/90 backdrop-blur-md transition-all flex items-center justify-center border border-white/10 shadow-md cursor-pointer ${
              isLiked ? 'text-brand-rose bg-[#FAF6F0]' : 'text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-brand-rose text-brand-rose' : ''}`} />
          </button>
          <span className="text-[8px] font-mono mt-0.5 font-bold tracking-wider">{likesCount}</span>
        </div>

        {/* Bookmark Action */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={`w-8.5 h-8.5 rounded-full bg-black/30 hover:bg-brand-rose/90 backdrop-blur-md transition-all flex items-center justify-center border border-white/10 shadow-md cursor-pointer ${
              isSaved ? 'text-brand-rose bg-[#FAF6F0]' : 'text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-brand-rose text-brand-rose' : ''}`} />
          </button>
          <span className="text-[8px] font-mono mt-0.5 font-bold tracking-wider">{isSaved ? 'Saved' : 'Save'}</span>
        </div>

        {/* Share Action */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="w-8.5 h-8.5 rounded-full bg-black/30 hover:bg-brand-rose/90 backdrop-blur-md transition-all flex items-center justify-center border border-white/10 shadow-md cursor-pointer text-white"
            title="Copy Share Link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[8px] font-mono mt-0.5 font-bold tracking-wider">Share</span>
        </div>
      </div>
    </div>
  );
};

export const VideoGallery: React.FC = () => {
  const { videos, products, ebooks, addToCart, triggerToast, prefersReducedMotion } = useApp();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Wash Day' | 'Styling' | 'Growth Tips' | 'Protective Styles' | 'Cornrows'>('All');
  
  // Immersive Modal State
  const [activePlaybackVideoId, setActivePlaybackVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [modalTab, setModalTab] = useState<'shop' | 'comments'>('shop');
  
  // Simulated stats tracking
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  
  // Simulated comments database
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ id: string; author: string; text: string }>>>({});
  const [newCommentText, setNewCommentText] = useState('');

  // Masterclass Academy Syllabus Request state
  const [isCurriculumDownloaded, setIsCurriculumDownloaded] = useState(false);
  const [masterclassEmail, setMasterclassEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [teaserSuccess, setTeaserSuccess] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const categories: ('All' | 'Wash Day' | 'Styling' | 'Growth Tips' | 'Protective Styles' | 'Cornrows')[] = [
    'All', 'Wash Day', 'Styling', 'Growth Tips', 'Protective Styles', 'Cornrows'
  ];

  const filteredVideos = useMemo(() => {
    const now = new Date();
    const visibleVideos = videos.filter(v => {
      const status = v.status || 'published';
      if (status === 'draft') return false;
      if (status === 'scheduled') {
        if (!v.scheduledAt) return false;
        return new Date(v.scheduledAt) <= now;
      }
      return true;
    });

    const categorized = visibleVideos.filter(v => activeCategory === 'All' || v.category === activeCategory);

    return [...categorized].sort((a, b) => {
      const isAFeatured = !!a.isFeatured;
      const isBFeatured = !!b.isFeatured;

      if (isAFeatured && !isBFeatured) return -1;
      if (!isAFeatured && isBFeatured) return 1;
      if (isAFeatured && isBFeatured) {
        const orderA = a.featuredOrder ?? 999;
        const orderB = b.featuredOrder ?? 999;
        return orderA - orderB;
      }

      const numA = parseInt(a.id.replace('vid-', ''), 10) || 0;
      const numB = parseInt(b.id.replace('vid-', ''), 10) || 0;
      return numB - numA;
    });
  }, [videos, activeCategory]);

  // Seed initial values for likes and comments
  useEffect(() => {
    const seedLikes: Record<string, number> = {};
    const seedComments: Record<string, Array<{ id: string; author: string; text: string }>> = {};
    
    videos.forEach(v => {
      const seedVal = Math.abs(v.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
      seedLikes[v.id] = (seedVal % 450) + 120;
      
      seedComments[v.id] = [
        { id: `${v.id}-c1`, author: 'Aria Carter', text: 'This changed my wash day completely! 😭' },
        { id: `${v.id}-c2`, author: 'Nia J.', text: 'Should I do this on damp or fully dry hair?' },
        { id: `${v.id}-c3`, author: 'Tamera W.', text: 'Love the detailed parting explanation! Very clear.' }
      ];
    });

    setLikesCount(seedLikes);
    setCommentsMap(seedComments);
  }, [videos]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePlaybackVideoId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeVideo = useMemo(() => {
    return videos.find(v => v.id === activePlaybackVideoId);
  }, [videos, activePlaybackVideoId]);

  const activeVideoResolved = useMemo(() => {
    return activeVideo ? resolveVideoSource(activeVideo.videoUrl) : null;
  }, [activeVideo]);

  const activeSimulatedDuration = useMemo(() => {
    if (!activeVideo) return '0:45';
    const sum = activeVideo.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const sec = (sum % 28) + 30;
    return `0:${sec}`;
  }, [activeVideo]);

  const currentIndex = useMemo(() => {
    if (!activePlaybackVideoId) return -1;
    return filteredVideos.findIndex(v => v.id === activePlaybackVideoId);
  }, [filteredVideos, activePlaybackVideoId]);

  const handlePrevVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setActivePlaybackVideoId(filteredVideos[currentIndex - 1].id);
      setModalTab('shop');
    }
  };

  const handleNextVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < filteredVideos.length - 1) {
      setActivePlaybackVideoId(filteredVideos[currentIndex + 1].id);
      setModalTab('shop');
    }
  };

  const prevDisabled = currentIndex <= 0;
  const nextDisabled = currentIndex >= filteredVideos.length - 1 || currentIndex === -1;

  const resolveRelatedItems = (video: TikTokVideo) => {
    if (video.relatedIds && video.relatedIds.length > 0) {
      const items: any[] = [];
      video.relatedIds.forEach(id => {
        const product = products.find(p => p.id === id);
        if (product) {
          items.push({
            id: product.id,
            type: 'product',
            name: product.name,
            price: product.price,
            image: product.image
          });
        } else {
          const ebook = ebooks.find(e => e.id === id);
          if (ebook) {
            items.push({
              id: ebook.id,
              type: 'ebook',
              name: ebook.name,
              price: ebook.price,
              image: ebook.image
            });
          }
        }
      });
      return items;
    }
    return getRelatedItems(video.id);
  };

  const handleLike = (id: string) => {
    const liked = likedMap[id];
    setLikedMap(prev => ({ ...prev, [id]: !liked }));
    setLikesCount(prev => ({
      ...prev,
      [id]: liked ? prev[id] - 1 : prev[id] + 1
    }));
  };

  const handleSave = (id: string) => {
    const saved = savedMap[id];
    setSavedMap(prev => ({ ...prev, [id]: !saved }));
    triggerToast(saved ? 'Removed from saved tutorials' : 'Saved to your library ✔', 'info');
  };

  const handleShare = async (title: string, id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?video=${encodeURIComponent(id)}`;
    try {
      await navigator.clipboard.writeText(url);
      triggerToast('Share link copied to clipboard! 🔗', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activePlaybackVideoId) return;

    const newComment = {
      id: `new-c-${Date.now()}`,
      author: 'You (Student)',
      text: newCommentText.trim()
    };

    setCommentsMap(prev => ({
      ...prev,
      [activePlaybackVideoId]: [...(prev[activePlaybackVideoId] || []), newComment]
    }));
    setNewCommentText('');
  };

  const handleAddProduct = (item: any) => {
    addToCart({
      id: item.id,
      type: item.type,
      name: item.name,
      price: item.price,
      image: item.image
    });
    triggerToast(`"${item.name}" added to Bag! 👜`, 'success');
  };

  const handleDownloadCurriculum = () => {
    setIsCurriculumDownloaded(true);
    setTeaserSuccess(true);
    setTimeout(() => {
      setIsCurriculumDownloaded(false);
      setTeaserSuccess(false);
    }, 3000);
  };

  const handleApplyCoaching = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterclassEmail) return;
    setSuccessMsg(true);
    setMasterclassEmail('');
    setTimeout(() => setSuccessMsg(false), 5000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      setActivePlaybackVideoId(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 150) {
      setActivePlaybackVideoId(null);
    }
  };

  const activeRelatedItems = activeVideo ? resolveRelatedItems(activeVideo) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative">
      
      {/* Editorial Header */}
      <div className="text-center mb-8 space-y-2 select-none px-4 sm:px-0">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold block">
          Short-Form Masterclass
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal">
          The 4C Video Feed
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#6C5347]/80 max-w-xl mx-auto leading-relaxed">
          Explore step-by-step natural coily care, density retention, and protective styling routines.
        </p>
      </div>

      {/* Categories Tabs Slider */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-10 border-b border-brand-warm-tan/20 pb-4 select-none px-4 sm:px-0 max-w-xl mx-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`video-cat-${cat.toLowerCase().replace(' ', '-')}`}
            onClick={() => {
              setActiveCategory(cat);
            }}
            className={`text-[11px] uppercase tracking-[0.18em] font-medium py-1 relative focus:outline-none transition-colors duration-300 cursor-pointer ${
              activeCategory === cat
                ? 'text-brand-rose font-bold'
                : 'text-brand-dark/65 hover:text-[#543F35]'
            }`}
          >
            <span>{cat}</span>
            {activeCategory === cat && (
              <motion.span 
                layoutId="activeVideoTab"
                className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-brand-rose"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Video Grid Timeline */}
      <div className="w-full flex justify-center py-4">
        {filteredVideos.length > 0 ? (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14 w-full max-w-6xl justify-items-center px-4 pb-16"
          >
            {filteredVideos.map((video) => {
              const isLiked = !!likedMap[video.id];
              const isSaved = !!savedMap[video.id];
              const likes = likesCount[video.id] || 0;
              const relatedItems = resolveRelatedItems(video);
              const comments = (commentsMap[video.id] || []).length;

              return (
                <VideoGridCard
                  key={video.id}
                  video={video}
                  isLiked={isLiked}
                  isSaved={isSaved}
                  likesCount={likes}
                  commentsCount={comments}
                  relatedItemsCount={relatedItems.length}
                  onLike={() => handleLike(video.id)}
                  onSave={() => handleSave(video.id)}
                  onShare={() => handleShare(video.title, video.id)}
                  onClick={() => {
                    setActivePlaybackVideoId(video.id);
                    setModalTab('shop');
                  }}
                  prefersReducedMotion={prefersReducedMotion}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-brand-cream border border-brand-warm-tan/25 rounded-[32px] w-full max-w-[370px] mx-auto">
            <Play className="w-8 h-8 text-[#B11B41] mx-auto mb-3 opacity-60 animate-pulse" />
            <p className="font-serif text-base text-brand-dark font-normal">No short-form video logs found.</p>
            <p className="font-sans text-xs text-brand-dark/50 mt-1">Try selecting another coily routine category.</p>
          </div>
        )}
      </div>

      {/* Immersive Lightbox Modal */}
      <AnimatePresence>
        {activePlaybackVideoId && activeVideo && activeVideoResolved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={backdropRef}
            onClick={handleBackdropClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-0 z-55 bg-[#120E0C]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6"
          >
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-55">
              <button
                onClick={() => {
                  setActivePlaybackVideoId(null);
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-brand-rose text-white transition-all cursor-pointer shadow-md border border-white/10 flex items-center justify-center focus:outline-none"
                title="Close Lightbox (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Left Carousel Navigation Button */}
            {!prevDisabled && (
              <div className="absolute left-2 sm:left-4 z-55 pointer-events-none">
                <button
                  onClick={handlePrevVideo}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-[#FAF6F0] text-white hover:text-brand-dark transition-all flex items-center justify-center border border-white/10 shadow-lg pointer-events-auto cursor-pointer focus:outline-none"
                  title="Previous Tutorial"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}

            {/* Right Carousel Navigation Button */}
            {!nextDisabled && (
              <div className="absolute right-2 sm:right-4 z-55 pointer-events-none">
                <button
                  onClick={handleNextVideo}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-[#FAF6F0] text-white hover:text-brand-dark transition-all flex items-center justify-center border border-white/10 shadow-lg pointer-events-auto cursor-pointer focus:outline-none"
                  title="Next Tutorial"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}

            {/* Immersive Detail Card Dialog Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-4xl h-[88vh] md:h-[620px] bg-brand-cream rounded-[28px] overflow-hidden border border-brand-warm-tan/30 shadow-2xl flex flex-col md:flex-row relative text-left mx-6 sm:mx-12"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Side: 9:16 Video Player Stage */}
              <div className="w-full md:w-[350px] h-[45%] md:h-full bg-black relative flex items-center justify-center shrink-0">
                {activeVideoResolved.type === 'youtube' && (
                  <iframe
                    key={`yt-${activeVideo.id}`}
                    title={activeVideo.title}
                    src={`${activeVideoResolved.url}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&loop=1&playlist=${activeVideoResolved.id}&modestbranding=1&rel=0`}
                    className="absolute inset-0 w-full h-full object-cover"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                )}
                {activeVideoResolved.type === 'tiktok' && (
                  <iframe
                    key={`tt-${activeVideo.id}`}
                    title={activeVideo.title}
                    src={`${activeVideoResolved.url}?autoplay=1&mute=${isMuted ? 1 : 0}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                )}
                {activeVideoResolved.type === 'direct' && (
                  <video
                    key={`dir-${activeVideo.id}`}
                    src={activeVideoResolved.url}
                    autoPlay
                    controls
                    playsInline
                    loop
                    muted={isMuted}
                    className="absolute inset-0 w-full h-full object-cover bg-black"
                  />
                )}

                {/* Floating Mute Toggle */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-white/85 hover:bg-white text-brand-dark shadow-md backdrop-blur-xs transition-colors cursor-pointer border border-brand-warm-tan/10"
                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Right Side: Details Pane */}
              <div className="flex-1 h-[55%] md:h-full flex flex-col justify-between bg-[#FAF7F2] overflow-hidden text-brand-dark">
                
                {/* 1. Header Creator Bio Profile */}
                <div className="p-4 sm:p-5 border-b border-brand-warm-tan/20 flex items-center justify-between shrink-0 bg-brand-cream/40">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="/about-portrait.jpg" 
                      alt="Cartiae founder profile" 
                      className="w-8 h-8 rounded-full border border-brand-rose/25 object-cover shrink-0"
                    />
                    <div className="text-left">
                      <span className="font-mono text-xs font-bold text-brand-dark tracking-wide block leading-none">
                        @cartiae_rae
                      </span>
                      <span className="text-[9px] font-sans font-semibold text-[#8C6D62] mt-0.5 block leading-none">
                        Coily Hair Specialist
                      </span>
                    </div>
                  </div>

                  <span className="bg-brand-rose/90 backdrop-blur-xs text-[#FAF6F0] text-[8px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded font-mono">
                    {activeVideo.category}
                  </span>
                </div>

                {/* 2. Content Tabs Switcher */}
                <div className="flex border-b border-brand-warm-tan/20 bg-brand-cream/20 text-xs uppercase font-extrabold tracking-wider select-none shrink-0 font-sans">
                  <button
                    onClick={() => setModalTab('shop')}
                    className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                      modalTab === 'shop' 
                        ? 'border-brand-rose text-brand-rose bg-[#FAF7F2]' 
                        : 'border-transparent text-brand-dark/50 hover:text-brand-dark'
                    }`}
                  >
                    Shop Routine ({activeRelatedItems.length})
                  </button>
                  <button
                    onClick={() => setModalTab('comments')}
                    className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                      modalTab === 'comments' 
                        ? 'border-brand-rose text-brand-rose bg-[#FAF7F2]' 
                        : 'border-transparent text-brand-dark/50 hover:text-brand-dark'
                    }`}
                  >
                    Q&A Discussion ({(commentsMap[activeVideo.id] || []).length})
                  </button>
                </div>

                {/* 3. Scrollable Tab Contents */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {modalTab === 'shop' ? (
                    <div className="space-y-4">
                      {/* Video descriptions */}
                      <div>
                        <h2 className="font-serif text-lg font-bold text-brand-dark leading-snug">
                          {activeVideo.title}
                        </h2>
                        
                        <div className="flex items-center gap-3 text-[10px] text-[#8C6D62] font-semibold font-mono mt-1.5 select-none">
                          <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> {activeVideo.views} Views</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> {activeSimulatedDuration} Duration</span>
                        </div>

                        <p className="font-sans text-xs text-brand-dark/80 mt-2.5 leading-relaxed bg-[#FAF6F0] p-3 rounded-2xl border border-brand-warm-tan/15">
                          {activeVideo.description || getVideoDescription(activeVideo.id)}
                        </p>
                      </div>

                      {/* Related shop items grid */}
                      <div className="space-y-3 pt-1">
                        <span className="font-sans text-[9px] uppercase tracking-wider text-brand-rose font-bold block select-none">
                          Featured in this Routine
                        </span>

                        {activeRelatedItems.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-brand-warm-tan/10 shadow-xs"
                          >
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-11 h-11 object-cover rounded-xl border border-brand-warm-tan/15 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <span className="text-[7.5px] uppercase tracking-wider font-extrabold text-[#A67E6B] font-mono block leading-none font-bold">
                                {item.type}
                              </span>
                              <h4 className="font-serif text-[11px] font-bold text-brand-dark truncate mt-1 font-bold">
                                {item.name}
                              </h4>
                              <span className="font-mono text-xs text-[#8C6D62] font-semibold mt-0.5 block leading-none font-bold">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>

                            <button
                              onClick={() => handleAddProduct(item)}
                              className="px-3 py-1.5 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] text-[9px] uppercase font-bold tracking-widest transition-colors rounded-xl focus:outline-none cursor-pointer shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between">
                      {/* Comments feed list */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 min-h-[160px]">
                        {(commentsMap[activeVideo.id] || []).length > 0 ? (
                          (commentsMap[activeVideo.id] || []).map((comm) => (
                            <div key={comm.id} className="text-xs leading-relaxed border-b border-brand-warm-tan/10 pb-2.5">
                              <div className="flex justify-between items-baseline select-none">
                                <span className="font-bold text-brand-chocolate font-mono">{comm.author}</span>
                                <span className="text-[8px] text-[#A67E6B] font-mono">Just now</span>
                              </div>
                              <p className="text-brand-dark/85 mt-0.5">{comm.text}</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-brand-dark/40 font-serif text-xs">
                            No questions asked yet. Be the first to start the discussion!
                          </div>
                        )}
                      </div>

                      {/* Comment input form */}
                      <form 
                        onSubmit={submitComment}
                        className="border-t border-brand-warm-tan/20 pt-3 flex gap-2 items-center shrink-0 mt-3"
                      >
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Ask a question about this routine..."
                          className="flex-1 px-3 py-2 bg-white border border-brand-warm-tan/30 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
                        />
                        <button
                          type="submit"
                          className="p-2 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] rounded-full transition-colors flex items-center justify-center cursor-pointer shadow-sm focus:outline-none"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* 4. Footer Actions Row */}
                <div className="p-4 border-t border-brand-warm-tan/20 bg-brand-cream/35 flex items-center justify-around shrink-0 select-none">
                  {/* Like Toggle */}
                  <button
                    onClick={() => handleLike(activeVideo.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold hover:text-brand-rose transition-colors cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${likedMap[activeVideo.id] ? 'fill-brand-rose text-brand-rose' : ''}`} />
                    <span>{likesCount[activeVideo.id] || 0} Likes</span>
                  </button>

                  <div className="w-[1px] h-4 bg-brand-warm-tan/30" />

                  {/* Bookmark/Save Toggle */}
                  <button
                    onClick={() => handleSave(activeVideo.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold hover:text-brand-rose transition-colors cursor-pointer"
                  >
                    <Bookmark className={`w-4 h-4 ${savedMap[activeVideo.id] ? 'fill-brand-rose text-brand-rose' : ''}`} />
                    <span>{savedMap[activeVideo.id] ? 'Saved' : 'Save'}</span>
                  </button>

                  <div className="w-[1px] h-4 bg-brand-warm-tan/30" />

                  {/* Share clipboard */}
                  <button
                    onClick={() => handleShare(activeVideo.title, activeVideo.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold hover:text-brand-rose transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🎓 ELITE COACHING MASTERCLASS MODULE     */}
      {/* ======================================= */}
      <div className="bg-[#FAF6F0] border border-brand-warm-tan/30 p-8 sm:p-12 lg:p-16 text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center rounded-3xl mt-12 w-full max-w-4xl mx-auto">
        
        {/* Left side text details */}
        <div className="lg:col-span-7 space-y-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#B11B41] font-bold block">
            The Masterclass Academy
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark leading-tight">
            Elite Coaching: Go Beyond the Basics
          </h2>

          <p className="font-sans text-xs sm:text-sm text-brand-dark/70 leading-relaxed max-w-xl">
            Ready to completely understand your coily coils? The Cartiae Masterclass features 40+ structured training modules, downloadable porosity tables, dynamic hydration trackers, and personal feedback routines.
          </p>

          {/* Technical highlights bullets brief */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-brand-warm-tan/20">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-brand-dark font-bold">40+ Modules</p>
              <p className="text-[10px] text-brand-dark/60 mt-0.5 font-sans">Full regimens mapped</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-brand-dark font-bold">5K+ Students</p>
              <p className="text-[10px] text-brand-dark/60 mt-0.5 font-sans">Coily collective peers</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-brand-dark font-bold">VIP Sessions</p>
              <p className="text-[10px] text-[#A67E6B] mt-0.5 font-sans font-bold">Routine calibrations</p>
            </div>
          </div>

        </div>

        {/* Right side lead forms box */}
        <div className="lg:col-span-5 bg-white border border-brand-warm-tan/25 p-8 space-y-4 rounded-2xl shadow-xs">
          <h3 className="font-serif text-lg text-brand-dark font-semibold">Syllabus Request</h3>
          <p className="font-sans text-[11px] text-[#6D5448] leading-relaxed">
            Enter your email to request the complete academic syllabus containing video listings, group consultation formats, and pre-registration schedules.
          </p>

          <form onSubmit={handleApplyCoaching} className="space-y-3">
            <input
              id="coaching-email-field"
              type="email"
              required
              placeholder="Your email address"
              value={masterclassEmail}
              onChange={(e) => setMasterclassEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-transparent border-b border-brand-warm-tan/50 text-brand-dark placeholder-brand-dark/40 text-xs focus:outline-none focus:border-brand-dark"
            />
            
            <button
              id="coaching-info-submit"
              type="submit"
              className="w-full py-2.5 text-[10px] uppercase tracking-widest font-semibold bg-brand-dark hover:bg-brand-rose text-white transition-colors duration-300 rounded-xl"
            >
              {successMsg ? 'Syllabus Requested ✓' : 'Request Syllabus Details'}
            </button>
          </form>

          {/* Immediate roadmap click */}
          <div className="border-t border-brand-warm-tan/15 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-brand-dark/50">
            <span>Want a quick syllabus teaser?</span>
            <button
              id="download-curriculum-teaser"
              onClick={handleDownloadCurriculum}
              className="text-[#B11B41] hover:text-brand-dark underline font-semibold focus:outline-none cursor-pointer"
            >
              {teaserSuccess ? 'Downloaded Teaser (PDF) ✓' : 'Get Teaser (PDF)'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
