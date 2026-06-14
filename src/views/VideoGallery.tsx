import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TikTokVideo } from '../types';
import { 
  Play, Pause, Heart, Bookmark, Share2, MessageSquare, ShoppingBag, 
  X, Send, Sparkles, Volume2, VolumeX, Eye, Clock
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

interface VideoCardProps {
  video: TikTokVideo;
  isActive: boolean;
  isManuallyPaused: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onMuteToggle: (e: React.MouseEvent) => void;
  likes: number;
  isLiked: boolean;
  onLike: () => void;
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  onOpenProducts: () => void;
  commentsCount: number;
  relatedItemsCount: number;
  prefersReducedMotion: boolean;
  commentsOpen: boolean;
  productsOpen: boolean;
  activeDrawerVideoId: string | null;
  setCommentsOpen: (open: boolean) => void;
  setProductsOpen: (open: boolean) => void;
  commentsMap: Record<string, Array<{ id: string; author: string; text: string }>>;
  submitComment: (e: React.FormEvent) => void;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  relatedItems: any[];
  handleAddProduct: (item: any) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isActive,
  isManuallyPaused,
  isMuted,
  onTogglePlay,
  onMuteToggle,
  likes,
  isLiked,
  onLike,
  isSaved,
  onSave,
  onShare,
  onOpenComments,
  onOpenProducts,
  commentsCount,
  relatedItemsCount,
  prefersReducedMotion,
  commentsOpen,
  productsOpen,
  activeDrawerVideoId,
  setCommentsOpen,
  setProductsOpen,
  commentsMap,
  submitComment,
  newCommentText,
  setNewCommentText,
  relatedItems,
  handleAddProduct
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolved = useMemo(() => resolveVideoSource(video.videoUrl), [video.videoUrl]);
  const isPlaying = isActive && !isManuallyPaused;

  const [showFlash, setShowFlash] = useState(false);
  const [flashType, setFlashType] = useState<'play' | 'pause'>('play');

  useEffect(() => {
    if (!videoRef.current || resolved.type !== 'direct') return;
    if (isPlaying) {
      videoRef.current.play().catch(err => {
        console.log("Direct video autoplay blocked or failed:", err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, resolved.type]);

  const handleCardClick = () => {
    setFlashType(isPlaying ? 'pause' : 'play');
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);
    onTogglePlay();
  };

  return (
    <div 
      data-video-id={video.id}
      className="snap-start snap-always w-full h-full shrink-0 relative flex flex-col justify-end overflow-hidden bg-brand-beige"
    >
      {/* Video Stage Frame */}
      <div 
        onClick={handleCardClick}
        className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden flex items-center justify-center bg-black"
      >
        {isActive ? (
          <div className="w-full h-full relative">
            {resolved.type === 'youtube' && (
              <iframe
                title={video.title}
                src={`${resolved.url}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${resolved.id}&modestbranding=1&iv_load_policy=3&showinfo=0&rel=0`}
                className="absolute inset-0 w-full h-full scale-[1.3] pointer-events-none object-cover"
                allow="autoplay; encrypted-media"
              />
            )}
            {resolved.type === 'tiktok' && (
              <iframe
                title={video.title}
                src={`${resolved.url}?autoplay=1&mute=${isMuted ? 1 : 0}`}
                className="absolute inset-0 w-full h-full scale-[1.1] pointer-events-none object-cover"
                allow="autoplay; encrypted-media"
              />
            )}
            {resolved.type === 'direct' && (
              <video
                ref={videoRef}
                src={resolved.url}
                autoPlay={isPlaying}
                loop
                muted={isMuted}
                playsInline
                controls={false}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Overlay to intercept clicks */}
            <div className="absolute inset-0 bg-transparent z-10" />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <img 
              src={video.thumbnailUrl} 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-102" 
              alt={video.title}
              referrerPolicy="no-referrer"
            />
            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/15 hover:bg-brand-dark/25 transition-all duration-300">
              <motion.div 
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.06 }}
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.95 }}
                className="p-4 bg-[#FAF6F0]/90 backdrop-blur-sm text-brand-rose rounded-full shadow-lg transition-colors"
              >
                <Play className="w-6 h-6 fill-brand-rose ml-0.5" />
              </motion.div>
            </div>
          </div>
        )}

        {/* Play/Pause Large Center Flash Animation */}
        <AnimatePresence>
          {showFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.85, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.4 }}
              className="absolute pointer-events-none z-30 p-5 rounded-full bg-brand-dark/60 text-[#FAF6F0] flex items-center justify-center"
            >
              {flashType === 'play' ? (
                <Play className="w-10 h-10 fill-[#FAF6F0]" />
              ) : (
                <Pause className="w-10 h-10 fill-[#FAF6F0]" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mute/Volume State Floating Indicator */}
        {isActive && (
          <button
            onClick={onMuteToggle}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#FAF6F0]/80 hover:bg-[#FAF6F0] text-brand-dark shadow-md backdrop-blur-xs transition-colors cursor-pointer border border-brand-warm-tan/10"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Dynamic Play/Pause Screen status badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-[#FAF6F0]/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[9px] font-mono text-[#8C6D62] font-semibold border border-brand-warm-tan/10">
          {isPlaying ? (
            <>
              <Clock className="w-3 h-3 text-brand-rose animate-spin" />
              <span>Playing Live</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>Paused</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Shade Gradient Layer */}
      <div className="absolute inset-x-0 bottom-0 h-[280px] bg-gradient-to-t from-brand-dark/85 via-brand-dark/40 to-transparent pointer-events-none z-10" />

      {/* Left Side Info Panel */}
      <div className="absolute left-4 bottom-5 right-14 z-20 text-white text-left flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className="bg-brand-rose/90 backdrop-blur-xs text-[#FAF6F0] text-[8.5px] uppercase tracking-widest font-bold px-2 py-0.5 rounded font-mono">
            {video.category}
          </span>
          <span className="text-[10px] text-[#EDE3DE]/80 font-semibold font-mono flex items-center gap-0.5">
            <Eye className="w-3.5 h-3.5" />
            {video.views} Views
          </span>
        </div>

        <h2 className="font-serif text-xs sm:text-sm font-bold text-[#FAF6F0] line-clamp-1 leading-snug tracking-wide mt-1">
          {video.title}
        </h2>
        
        <p className="font-sans text-[10px] sm:text-[10.5px] text-[#EDE3DE]/95 line-clamp-2 mt-0.5 leading-relaxed pr-2">
          {video.description || getVideoDescription(video.id)}
        </p>

        {/* "Shop this routine" main CTA button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenProducts();
          }}
          className="mt-2 bg-[#FAF6F0] hover:bg-brand-rose text-brand-dark hover:text-white px-3.5 py-1.5 sm:py-2 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all duration-300 flex items-center gap-1 cursor-pointer w-fit pointer-events-auto shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
          <span>Shop Routine ({relatedItemsCount})</span>
        </button>
      </div>

      {/* Side floating actions panel */}
      <div className="absolute right-3 bottom-6 z-25 flex flex-col items-center gap-3.5 text-white">
        {/* Like Action */}
        <div className="flex flex-col items-center">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
            className={`w-9.5 h-9.5 rounded-full bg-[#FAF6F0]/15 hover:bg-[#FAF6F0]/25 backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer ${
              isLiked ? 'text-brand-rose' : 'text-white'
            }`}
          >
            <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-brand-rose text-brand-rose' : ''}`} />
          </motion.button>
          <span className="text-[9px] font-mono mt-0.5 font-bold tracking-wider">{likes}</span>
        </div>

        {/* Bookmark Action */}
        <div className="flex flex-col items-center">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.8 }}
            className={`w-9.5 h-9.5 rounded-full bg-[#FAF6F0]/15 hover:bg-[#FAF6F0]/25 backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer ${
              isSaved ? 'text-brand-rose' : 'text-white'
            }`}
          >
            <Bookmark className={`w-4.5 h-4.5 ${isSaved ? 'fill-brand-rose text-brand-rose' : ''}`} />
          </motion.button>
          <span className="text-[9px] font-mono mt-0.5 font-bold tracking-wider">{isSaved ? 'Saved' : 'Save'}</span>
        </div>

        {/* Comments Action */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenComments(); }}
            className="w-9.5 h-9.5 rounded-full bg-[#FAF6F0]/15 hover:bg-[#FAF6F0]/25 backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer text-white"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </button>
          <span className="text-[9px] font-mono mt-0.5 font-bold tracking-wider">{commentsCount}</span>
        </div>

        {/* Share Action */}
        <div className="flex flex-col items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="w-9.5 h-9.5 rounded-full bg-[#FAF6F0]/15 hover:bg-[#FAF6F0]/25 backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer text-white"
            title="Copy Share Link"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
          <span className="text-[9px] font-mono mt-0.5 font-bold tracking-wider">Share</span>
        </div>
      </div>

      {/* COMMENTS SLIDE-UP DRAWER */}
      <AnimatePresence>
        {commentsOpen && activeDrawerVideoId === video.id && (
          <>
            <div 
              onClick={(e) => { e.stopPropagation(); setCommentsOpen(false); }}
              className="absolute inset-0 bg-brand-dark/15 z-30" 
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-x-0 bottom-0 h-[62%] bg-brand-cream border-t border-brand-warm-tan/40 rounded-t-3xl z-40 shadow-2xl p-4 flex flex-col justify-between text-left text-brand-dark"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-warm-tan/30 pb-2 mb-3">
                  <span className="font-serif text-xs font-bold uppercase tracking-wider text-brand-rose flex items-center gap-1 select-none">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Q&A Discussion ({commentsCount})</span>
                  </span>
                  <button 
                    onClick={() => setCommentsOpen(false)} 
                    className="text-zinc-400 hover:text-brand-rose p-1 cursor-pointer focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                  {(commentsMap[video.id] || []).map((comm) => (
                    <div key={comm.id} className="text-[11px] leading-relaxed border-b border-brand-warm-tan/10 pb-2.5">
                      <div className="flex justify-between items-baseline select-none">
                        <span className="font-bold text-brand-chocolate font-mono">{comm.author}</span>
                        <span className="text-[8px] text-[#A67E6B] font-mono">Just now</span>
                      </div>
                      <p className="text-brand-dark/85 mt-0.5">{comm.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form 
                onSubmit={submitComment}
                className="border-t border-brand-warm-tan/20 pt-2 flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type your question or feedback..."
                  className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-rose focus:border-brand-rose"
                />
                <button
                  type="submit"
                  className="p-2 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] rounded-full transition-colors flex items-center justify-center cursor-pointer shadow-sm focus:outline-none"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PRODUCTS SLIDE-UP DRAWER ("SHOP ROUTINE") */}
      <AnimatePresence>
        {productsOpen && activeDrawerVideoId === video.id && (
          <>
            <div 
              onClick={(e) => { e.stopPropagation(); setProductsOpen(false); }}
              className="absolute inset-0 bg-brand-dark/15 z-30" 
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-x-0 bottom-0 h-[62%] bg-brand-cream border-t border-brand-warm-tan/40 rounded-t-3xl z-40 shadow-2xl p-4 flex flex-col justify-between text-left text-brand-dark"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between border-b border-brand-warm-tan/30 pb-2 mb-3">
                  <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#B11B41] flex items-center gap-1 select-none">
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-rose" />
                    <span>Products Used in this Routine</span>
                  </span>
                  <button 
                    onClick={() => setProductsOpen(false)} 
                    className="text-zinc-400 hover:text-brand-rose p-1 cursor-pointer focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
                  {relatedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between gap-3 bg-brand-beige/25 p-2 rounded-xl border border-brand-warm-tan/10"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-10 h-10 object-cover rounded-lg border border-brand-warm-tan/20 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-[11px] font-bold text-brand-dark truncate">{item.name}</h4>
                        <span className="font-mono text-[10px] text-[#8C6D62] font-semibold">${item.price.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleAddProduct(item)}
                        className="px-3 py-1.5 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] text-[9px] uppercase font-bold tracking-widest transition-colors rounded-lg focus:outline-none cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-brand-warm-tan/20 pt-2.5 flex items-center justify-between text-[9px] text-[#A67E6B] font-semibold font-mono uppercase tracking-wider select-none">
                <span>Direct checkout active</span>
                <span className="text-brand-rose">Secure order persist</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface VideoGridCardProps {
  video: TikTokVideo;
  onClick: () => void;
  prefersReducedMotion: boolean;
}

const VideoGridCard: React.FC<VideoGridCardProps> = ({ video, onClick, prefersReducedMotion }) => {
  const [isHovered, setIsHovered] = useState(false);
  const resolved = useMemo(() => resolveVideoSource(video.videoUrl), [video.videoUrl]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (vid.currentTime >= 2) {
      vid.currentTime = 0;
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
      className="w-full aspect-[9/16] max-w-[280px] rounded-[24px] border border-brand-warm-tan/15 relative flex flex-col justify-end overflow-hidden bg-brand-beige shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer select-none"
    >
      {/* Video / Thumbnail stage */}
      <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
        {isHovered ? (
          <div className="w-full h-full relative">
            {resolved.type === 'youtube' && (
              <iframe
                title={video.title}
                src={`${resolved.url}?autoplay=1&mute=1&controls=0&loop=1&playlist=${resolved.id}&start=0&end=2&modestbranding=1&iv_load_policy=3&showinfo=0&rel=0`}
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
                controls={false}
                onTimeUpdate={handleTimeUpdate}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Click shield */}
            <div className="absolute inset-0 bg-transparent z-10" />
          </div>
        ) : (
          <div className="w-full h-full relative">
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
          </div>
        )}
      </div>

      {/* Info overlay (category and title) */}
      <div className="absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-brand-dark/85 via-brand-dark/30 to-transparent pointer-events-none z-10" />
      <div className="absolute left-3.5 bottom-4 right-3.5 z-20 text-white text-left flex flex-col gap-0.5 pointer-events-none">
        <span className="bg-brand-rose/90 backdrop-blur-xs text-[#FAF6F0] text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded w-fit">
          {video.category}
        </span>
        <h3 className="font-serif text-[11px] sm:text-xs font-bold text-[#FAF6F0] line-clamp-2 leading-snug tracking-wide mt-1">
          {video.title}
        </h3>
        <span className="text-[9px] text-[#EDE3DE]/80 font-semibold font-mono mt-0.5">
          {video.views} Views
        </span>
      </div>
    </div>
  );
};

export const VideoGallery: React.FC = () => {
  const { videos, products, ebooks, addToCart, triggerToast, prefersReducedMotion } = useApp();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Wash Day' | 'Styling' | 'Growth Tips' | 'Protective Styles' | 'Cornrows'>('All');
  
  // Interactive Feed states
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activePlaybackVideoId, setActivePlaybackVideoId] = useState<string | null>(null);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
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

  // Active indices reference
  const feedContainerRef = useRef<HTMLDivElement>(null);

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

    // 3. Sort: Featured videos first (by featuredOrder index), then non-featured (newest by ID)
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

      // Default sorting: newest ID first (numeric sorting)
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

  // Autoplay/Pause observer for snap-scrolling
  useEffect(() => {
    const container = feedContainerRef.current;
    if (!container || filteredVideos.length === 0 || !activePlaybackVideoId) return;

    const observerOptions = {
      root: container,
      rootMargin: '0px',
      threshold: 0.6,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const videoId = entry.target.getAttribute('data-video-id');
          if (videoId) {
            setPlayingId(videoId);
            setIsManuallyPaused(false); // Play immediately on scroll focus
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    const targets = container.querySelectorAll('[data-video-id]');
    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, [filteredVideos, activePlaybackVideoId]);

  // Scroll to active video on modal mount
  useEffect(() => {
    if (activePlaybackVideoId) {
      const timer = setTimeout(() => {
        const container = feedContainerRef.current;
        if (container) {
          const element = container.querySelector(`[data-video-id="${activePlaybackVideoId}"]`);
          if (element) {
            element.scrollIntoView({ block: 'nearest', behavior: 'instant' });
            setPlayingId(activePlaybackVideoId);
            setIsManuallyPaused(false);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activePlaybackVideoId]);

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

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-3 sm:py-6 relative">
      
      {/* Editorial Header */}
      <div className="text-center mb-5 space-y-2 select-none px-4 sm:px-0">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold block">
          Short-Form Masterclass
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
          The 4C Video Feed
        </h1>
        <p className="font-sans text-xs text-[#6C5347]/80 max-w-xl mx-auto leading-relaxed">
          Swipe or scroll vertically through step-by-step coily care tips, styling tutorials, and products routines.
        </p>
      </div>

      {/* Categories Tabs Slider with layoutId underlines */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-5 border-b border-brand-warm-tan/20 pb-3 select-none px-4 sm:px-0">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`video-cat-${cat.toLowerCase().replace(' ', '-')}`}
            onClick={() => {
              setActiveCategory(cat);
              setPlayingId(null);
              setIsManuallyPaused(false);
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
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full max-w-7xl justify-items-center px-4 pb-16"
          >
            {filteredVideos.map((video) => (
              <VideoGridCard
                key={video.id}
                video={video}
                onClick={() => {
                  setActivePlaybackVideoId(video.id);
                }}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-brand-cream border border-brand-warm-tan/25 rounded-[32px] w-full max-w-[370px]">
            <Play className="w-8 h-8 text-[#B11B41] mx-auto mb-3 opacity-60 animate-pulse" />
            <p className="font-serif text-base text-brand-dark font-normal">No short-form video logs found.</p>
            <p className="font-sans text-xs text-brand-dark/50 mt-1">Try selecting another coily routine category.</p>
          </div>
        )}
      </div>

      {/* Immersive Full-Screen TikTok Player Modal */}
      <AnimatePresence>
        {activePlaybackVideoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#FAF7F2]/95 sm:bg-brand-dark/95 backdrop-blur-xs flex items-center justify-center animate-none"
          >
            {/* Top Bar / Close Header */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
              <button
                onClick={() => {
                  setActivePlaybackVideoId(null);
                  setPlayingId(null);
                }}
                className="p-3 rounded-full bg-brand-dark/20 sm:bg-white/10 hover:bg-brand-rose text-brand-dark sm:text-white hover:text-white transition-all cursor-pointer shadow-md border border-brand-warm-tan/10 sm:border-white/10 flex items-center justify-center"
                title="Close Feed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Close Back Button (floating top-left for native feel) */}
            <div className="absolute top-4 left-4 z-50 sm:hidden">
              <button
                onClick={() => {
                  setActivePlaybackVideoId(null);
                  setPlayingId(null);
                }}
                className="flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-brand-dark py-2 px-3 bg-brand-beige/80 rounded-full border border-brand-warm-tan/20"
              >
                ← Back
              </button>
            </div>

            {/* Immersive Phone Frame Viewport */}
            <div className="w-full h-full sm:h-[680px] sm:aspect-[9/16] relative flex items-center justify-center">
              <div 
                ref={feedContainerRef}
                className="w-full sm:w-auto h-full sm:h-[680px] sm:aspect-[9/16] overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-none rounded-none sm:rounded-[36px] border-y sm:border border-brand-warm-tan/30 bg-brand-beige relative shadow-2xl flex flex-col items-center"
              >
                {filteredVideos.map((video) => {
                  const isActive = playingId === video.id;
                  const isLiked = !!likedMap[video.id];
                  const isSaved = !!savedMap[video.id];
                  const likes = likesCount[video.id] || 0;
                  const relatedItems = resolveRelatedItems(video);

                  return (
                    <VideoCard
                      key={video.id}
                      video={video}
                      isActive={isActive}
                      isManuallyPaused={isManuallyPaused}
                      isMuted={isMuted}
                      onTogglePlay={() => {
                        if (isActive) {
                          setIsManuallyPaused(!isManuallyPaused);
                        } else {
                          setPlayingId(video.id);
                          setIsManuallyPaused(false);
                        }
                      }}
                      onMuteToggle={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      likes={likes}
                      isLiked={isLiked}
                      onLike={() => handleLike(video.id)}
                      isSaved={isSaved}
                      onSave={() => handleSave(video.id)}
                      onShare={() => handleShare(video.title, video.id)}
                      onOpenComments={() => openComments(video.id)}
                      onOpenProducts={() => openProducts(video.id)}
                      commentsCount={(commentsMap[video.id] || []).length}
                      relatedItemsCount={relatedItems.length}
                      prefersReducedMotion={prefersReducedMotion}
                      commentsOpen={commentsOpen}
                      productsOpen={productsOpen}
                      activeDrawerVideoId={activeDrawerVideoId}
                      setCommentsOpen={setCommentsOpen}
                      setProductsOpen={setProductsOpen}
                      commentsMap={commentsMap}
                      submitComment={submitComment}
                      newCommentText={newCommentText}
                      setNewCommentText={setNewCommentText}
                      relatedItems={relatedItems}
                      handleAddProduct={handleAddProduct}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
