import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TikTokVideo } from '../types';
import { 
  Play, Heart, Bookmark, Share2, MessageSquare, ShoppingBag, 
  X, Send, Sparkles, Eye, Clock, Download
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
      { id: 'ebook-2', type: 'ebook', name: 'Wash Day Mastery Guide', price: 19.99, image: 'https://images.unsplash.com/photo-1551601651-261bd647ef2e?auto=format&fit=crop&q=80&w=800' }
    ];
  }
  return [
    { id: 'prod-1', type: 'product', name: 'Botanical Growth Oil', price: 38.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400' }
  ];
};

const getVideoDescription = (videoId: string) => {
  switch (videoId) {
    case 'vid-1':
      return 'Learn the scientific method for sealing fine coily hair shafts to prevent split end breakage.';
    case 'vid-2':
      return 'Our signature wash day walkthrough optimized for high density 4C curls.';
    case 'vid-3':
      return 'How to section and detangle coily hair with minimal tension and zero pulling.';
    case 'vid-4':
      return 'A protective low-manipulation styling routine to retain length over multiple weeks.';
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

export const VideoGallery: React.FC = () => {
  const { videos, products, ebooks, addToCart, triggerToast, prefersReducedMotion } = useApp();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Wash Day' | 'Styling' | 'Growth Tips' | 'Protective Styles' | 'Cornrows'>('All');
  
  // Simulated stats tracking
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  
  // Drawer states
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [activeDrawerVideoId, setActiveDrawerVideoId] = useState<string | null>(null);
  
  // Simulated comments database
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ id: string; author: string; text: string }>>>({});
  const [newCommentText, setNewCommentText] = useState('');

  // Masterclass Academy state
  const [isCurriculumDownloaded, setIsCurriculumDownloaded] = useState(false);
  const [masterclassEmail, setMasterclassEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [teaserSuccess, setTeaserSuccess] = useState(false);

  const categories: ('All' | 'Wash Day' | 'Styling' | 'Growth Tips' | 'Protective Styles' | 'Cornrows')[] = [
    'All', 'Wash Day', 'Styling', 'Growth Tips', 'Protective Styles', 'Cornrows'
  ];

  const filteredVideos = useMemo(() => {
    const now = new Date();
    // 1. Filter out Drafts and Unscheduled videos
    const visibleVideos = videos.filter(v => {
      const status = v.status || 'published';
      if (status === 'draft') return false;
      if (status === 'scheduled') {
        if (!v.scheduledAt) return false;
        return new Date(v.scheduledAt) <= now;
      }
      return true;
    });

    // 2. Filter by Category
    const categorized = visibleVideos.filter(v => activeCategory === 'All' || v.category === activeCategory);

    // 3. Sort: Featured videos first (by featuredOrder index), then non-featured (newest by ID numeric suffix descending)
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

  // Resolve related items from video metadata (with static fallback)
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

  const openComments = (videoId: string) => {
    setActiveDrawerVideoId(videoId);
    setCommentsOpen(true);
    setProductsOpen(false);
  };

  const openProducts = (videoId: string) => {
    setActiveDrawerVideoId(videoId);
    setProductsOpen(true);
    setCommentsOpen(false);
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeDrawerVideoId) return;

    const newComment = {
      id: `new-c-${Date.now()}`,
      author: 'You (Student)',
      text: newCommentText.trim()
    };

    setCommentsMap(prev => ({
      ...prev,
      [activeDrawerVideoId]: [...(prev[activeDrawerVideoId] || []), newComment]
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

  const activeDrawerVideo = videos.find(v => v.id === activeDrawerVideoId);
  const activeRelatedItems = activeDrawerVideo ? resolveRelatedItems(activeDrawerVideo) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative">
      
      {/* Editorial Header */}
      <div className="text-center mb-8 space-y-2 select-none">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold block">
          Short-Form Masterclass
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark font-normal">
          The 4C Video Feed
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#6C5347]/80 max-w-xl mx-auto leading-relaxed">
          Explore our short-form tutorials detailing density retention, protective parting, and breakage-free moisture regimens.
        </p>
      </div>

      {/* Categories Tabs Slider */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-8 border-b border-brand-warm-tan/20 pb-4 select-none">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`video-cat-${cat.toLowerCase().replace(' ', '-')}`}
            onClick={() => {
              setActiveCategory(cat);
            }}
            className={`text-[11px] uppercase tracking-[0.18em] font-medium py-1 relative focus:outline-none transition-colors duration-300 cursor-pointer ${
              activeCategory === cat
                ? 'text-brand-rose font-bold border-b border-brand-rose'
                : 'text-brand-dark/65 hover:text-[#543F35]'
            }`}
          >
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Timeline Grid (Direct Video Players) */}
      <div className="w-full flex justify-center py-4">
        {filteredVideos.length > 0 ? (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 w-full max-w-7xl justify-items-center"
          >
            {filteredVideos.map((video) => {
              const resolved = resolveVideoSource(video.videoUrl);
              const isLiked = !!likedMap[video.id];
              const isSaved = !!savedMap[video.id];
              const likes = likesCount[video.id] || 0;
              const relatedItems = resolveRelatedItems(video);

              return (
                <div 
                  key={video.id}
                  data-video-id={video.id}
                  className="w-full max-w-[340px] bg-brand-cream border border-brand-warm-tan/20 rounded-[28px] shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  {/* Direct Video Frame */}
                  <div className="relative w-full aspect-[9/16] bg-black overflow-hidden border-b border-brand-warm-tan/10">
                    {resolved.type === 'youtube' && (
                      <iframe
                        title={video.title}
                        src={`${resolved.url}?autoplay=0&rel=0&modestbranding=1`}
                        className="absolute inset-0 w-full h-full object-cover"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                    {resolved.type === 'tiktok' && (
                      <iframe
                        title={video.title}
                        src={resolved.url}
                        className="absolute inset-0 w-full h-full object-cover animate-none"
                        allowFullScreen
                      />
                    )}
                    {resolved.type === 'direct' && (
                      <video
                        src={resolved.url}
                        controls
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover bg-black"
                      />
                    )}
                  </div>

                  {/* Card Content & Action Panel */}
                  <div className="p-5 flex flex-col justify-between flex-1 bg-brand-cream space-y-4">
                    <div className="space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <span className="bg-brand-rose/10 text-brand-rose text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded font-mono">
                          {video.category}
                        </span>
                        <span className="text-[9px] text-[#A67E6B] font-mono flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          {video.views} Views
                        </span>
                      </div>
                      <h3 className="font-serif text-sm sm:text-base font-bold text-brand-dark leading-snug">
                        {video.title}
                      </h3>
                      <p className="font-sans text-xs text-[#6C5347]/85 leading-relaxed line-clamp-2">
                        {video.description || getVideoDescription(video.id)}
                      </p>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between border-t border-brand-warm-tan/15 pt-3">
                      {/* Social Actions Group */}
                      <div className="flex items-center gap-3 text-brand-dark/75">
                        {/* Like */}
                        <button
                          onClick={() => handleLike(video.id)}
                          className={`flex items-center gap-1 text-[11px] font-medium font-mono hover:text-brand-rose transition-colors cursor-pointer ${
                            isLiked ? 'text-brand-rose font-bold' : ''
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand-rose' : ''}`} />
                          <span>{likes}</span>
                        </button>
                        
                        {/* Save */}
                        <button
                          onClick={() => handleSave(video.id)}
                          className={`flex items-center gap-1 text-[11px] font-medium font-mono hover:text-brand-rose transition-colors cursor-pointer ${
                            isSaved ? 'text-brand-rose font-bold' : ''
                          }`}
                          title="Save to Library"
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-brand-rose text-brand-rose' : ''}`} />
                        </button>

                        {/* Comments Toggle */}
                        <button
                          onClick={() => openComments(video.id)}
                          className="flex items-center gap-1 text-[11px] font-medium font-mono hover:text-brand-rose transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{(commentsMap[video.id] || []).length}</span>
                        </button>

                        {/* Share */}
                        <button
                          onClick={() => handleShare(video.title, video.id)}
                          className="hover:text-brand-rose transition-colors cursor-pointer"
                          title="Copy Share Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* "Shop Routine" Action */}
                      <button
                        onClick={() => openProducts(video.id)}
                        className="bg-brand-rose hover:bg-brand-dark text-white px-3.5 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all duration-300 flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <ShoppingBag className="w-3 h-3 shrink-0" />
                        <span>Shop ({relatedItems.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-brand-cream border border-brand-warm-tan/25 rounded-[32px] w-full max-w-[370px]">
            <Play className="w-8 h-8 text-[#B11B41] mx-auto mb-3 opacity-60 animate-pulse" />
            <p className="font-serif text-base text-brand-dark font-normal">No short-form video logs found.</p>
            <p className="font-sans text-xs text-brand-dark/50 mt-1">Try selecting another coily routine category.</p>
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* 🌟 PAGE-LEVEL DRAWER OVERLAYS (GLOBAL)  */}
      {/* ======================================= */}

      {/* GLOBAL COMMENTS SLIDE-UP DRAWER */}
      <AnimatePresence>
        {commentsOpen && activeDrawerVideoId && (
          <>
            <div 
              onClick={() => setCommentsOpen(false)}
              className="fixed inset-0 bg-brand-dark/20 z-40 backdrop-blur-xs" 
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 h-[70%] sm:h-[60%] sm:max-w-md sm:mx-auto bg-brand-cream border-t border-brand-warm-tan/40 rounded-t-3xl z-50 shadow-2xl p-6 flex flex-col justify-between text-left text-brand-dark"
            >
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-warm-tan/30 pb-2 mb-3 select-none">
                  <span className="font-serif text-sm font-bold uppercase tracking-wider text-brand-rose flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Q&A Discussion</span>
                  </span>
                  <button 
                    onClick={() => setCommentsOpen(false)} 
                    className="text-zinc-400 hover:text-brand-rose p-1 cursor-pointer focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
                  {(commentsMap[activeDrawerVideoId] || []).map((comm) => (
                    <div key={comm.id} className="text-xs leading-relaxed border-b border-brand-warm-tan/10 pb-3">
                      <div className="flex justify-between items-baseline select-none">
                        <span className="font-bold text-brand-chocolate font-mono">{comm.author}</span>
                        <span className="text-[9px] text-[#A67E6B] font-mono">Just now</span>
                      </div>
                      <p className="text-brand-dark/85 mt-1">{comm.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form 
                onSubmit={submitComment}
                className="border-t border-brand-warm-tan/20 pt-3 flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type your question or feedback..."
                  className="flex-1 px-3 py-2.5 bg-[#FAF6F0] border border-brand-warm-tan/30 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] rounded-full transition-colors flex items-center justify-center cursor-pointer shadow-sm focus:outline-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* GLOBAL PRODUCTS SLIDE-UP DRAWER ("SHOP ROUTINE") */}
      <AnimatePresence>
        {productsOpen && activeDrawerVideoId && (
          <>
            <div 
              onClick={() => setProductsOpen(false)}
              className="fixed inset-0 bg-brand-dark/20 z-40 backdrop-blur-xs" 
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 h-[70%] sm:h-[60%] sm:max-w-md sm:mx-auto bg-brand-cream border-t border-brand-warm-tan/40 rounded-t-3xl z-50 shadow-2xl p-6 flex flex-col justify-between text-left text-brand-dark"
            >
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-warm-tan/30 pb-2 mb-3 select-none">
                  <span className="font-serif text-sm font-bold uppercase tracking-wider text-[#B11B41] flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-brand-rose" />
                    <span>Routine Essentials</span>
                  </span>
                  <button 
                    onClick={() => setProductsOpen(false)} 
                    className="text-zinc-400 hover:text-brand-rose p-1 cursor-pointer focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                  {activeRelatedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between gap-3 bg-brand-beige/20 p-3 rounded-xl border border-brand-warm-tan/10"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-12 h-12 object-cover rounded-lg border border-brand-warm-tan/20 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xs font-bold text-brand-dark truncate">{item.name}</h4>
                        <span className="font-mono text-xs text-[#8C6D62] font-semibold">${item.price.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleAddProduct(item)}
                        className="px-4 py-2 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] text-[9px] uppercase font-bold tracking-widest transition-colors rounded-lg focus:outline-none cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-brand-warm-tan/20 pt-3 flex items-center justify-between text-[10px] text-[#A67E6B] font-semibold font-mono uppercase tracking-wider select-none">
                <span>Secure Checkout Active</span>
                <span className="text-brand-rose">Add to bag to order</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 🎓 ELITE COACHING MASTERCLASS MODULE     */}
      {/* ======================================= */}
      <div className="bg-[#FAF6F0] border border-brand-warm-tan/30 p-8 sm:p-12 lg:p-16 text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center rounded-3xl mt-12">
        
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
              <p className="text-xs uppercase tracking-wider font-bold text-brand-dark">40+ Modules</p>
              <p className="text-[10px] text-brand-dark/60 mt-0.5 font-sans">Full regimens mapped</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-brand-dark">5K+ Students</p>
              <p className="text-[10px] text-brand-dark/60 mt-0.5 font-sans">Coily collective peers</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-brand-dark">VIP Sessions</p>
              <p className="text-[10px] text-brand-dark/60 mt-0.5 font-sans">Routine calibrations</p>
            </div>
          </div>

        </div>

        {/* Right side lead forms box */}
        <div className="lg:col-span-5 bg-white border border-brand-warm-tan/25 p-8 space-y-4 rounded-2xl shadow-xs">
          <h3 className="font-serif text-lg text-brand-dark">Syllabus Request</h3>
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
