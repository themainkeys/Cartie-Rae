import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TikTokVideo } from '../types';
import {
  Heart, Bookmark, Share2, ShoppingBag,
  X, Send, Volume2, VolumeX,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Utility: Resolve video type from URL ───────────────────────────────────

const resolveVideoSource = (url: string) => {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl) return { type: 'none' as const, id: '', url: '' };

  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let videoId = '';
    if (cleanUrl.includes('/embed/')) videoId = cleanUrl.split('/embed/')[1]?.split('?')[0] || '';
    else if (cleanUrl.includes('/shorts/')) videoId = cleanUrl.split('/shorts/')[1]?.split('?')[0] || '';
    else if (cleanUrl.includes('watch?v=')) videoId = cleanUrl.split('watch?v=')[1]?.split('&')[0] || '';
    else if (cleanUrl.includes('youtu.be/')) videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    return { type: 'youtube' as const, id: videoId, url: videoId ? `https://www.youtube.com/embed/${videoId}` : cleanUrl };
  }
  // Anything else (MP4, WebM, blob:, data:, CDN URL) is treated as a direct video
  return { type: 'direct' as const, id: '', url: cleanUrl };
};


// ─── Static fallback related items ──────────────────────────────────────────

interface RelatedItem {
  id: string;
  type: 'product' | 'ebook';
  name: string;
  price: number;
  image: string;
}

const FALLBACK_RELATED: Record<string, RelatedItem[]> = {
  'vid-1': [
    { id: 'prod-1', type: 'product', name: 'Botanical Growth Oil', price: 38.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400' },
    { id: 'ebook-1', type: 'ebook', name: 'The 4C Growth Blueprint', price: 24.99, image: 'https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800' },
  ],
  'vid-2': [
    { id: 'prod-3', type: 'product', name: 'Detangling Collection', price: 45.00, image: 'https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=400' },
    { id: 'prod-2', type: 'product', name: 'Silk Sleep Cap', price: 25.00, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400' },
  ],
  'vid-3': [{ id: 'prod-1', type: 'product', name: 'Botanical Growth Oil', price: 38.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400' }],
  'vid-4': [{ id: 'prod-3', type: 'product', name: 'Detangling Collection', price: 45.00, image: 'https://images.unsplash.com/photo-1590156546746-c2330dd3327c?auto=format&fit=crop&q=80&w=400' }],
  'vid-5': [{ id: 'prod-2', type: 'product', name: 'Silk Sleep Cap', price: 25.00, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400' }],
};

const getFallbackRelated = (videoId: string): RelatedItem[] =>
  FALLBACK_RELATED[videoId] ?? [
    { id: 'prod-1', type: 'product', name: 'Botanical Growth Oil', price: 38.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400' },
  ];

const DESCRIPTIONS: Record<string, string> = {
  'vid-1': 'Learn the L.C.O moisture application method to retain hydration for up to 5 days without buildup.',
  'vid-2': 'Step-by-step styling tutorial on coily Bantu Knots. Perfect protective styling details.',
  'vid-3': 'Increase blood circulation to coily roots using light organic botanical dropper oils.',
  'vid-4': 'Tension-free goddess braids base layout. Protects sensitive edges from mechanical stress.',
  'vid-5': 'Flat cornrow base mapping designed specifically under silk and fiber wig caps.',
};
const getDescription = (videoId: string) =>
  DESCRIPTIONS[videoId] ?? 'Exclusive Cartiae Rae natural hair styling guidelines and masterclass routines.';

// ─── TikTok SVG icon ─────────────────────────────────────────────────────────

const TikTokSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className ?? 'w-3.5 h-3.5 fill-current'} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.56V6.78a4.85 4.85 0 0 1-1.07-.09z" />
  </svg>
);

// ─── VideoFeedCard ────────────────────────────────────────────────────────────

interface VideoFeedCardProps {
  video: TikTokVideo;
  cardHeight: string;
  isActive: boolean;
  isMuted: boolean;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  relatedItems: RelatedItem[];
  tiktokUrl?: string;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onShopClick: () => void;
  onToggleMute: () => void;
  prefersReducedMotion: boolean;
}

const VideoFeedCard = React.forwardRef<HTMLDivElement, VideoFeedCardProps>(
  (
    {
      video, cardHeight, isActive, isMuted, isLiked, isSaved,
      likesCount, relatedItems, tiktokUrl, onLike, onSave, onShare,
      onShopClick, onToggleMute, prefersReducedMotion,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resolved = useMemo(() => resolveVideoSource(video.videoUrl || ''), [video.videoUrl]);

    // isTikTokOnly: video has no playable source but has a TikTok social link
    const isTikTokOnly = !resolved.url && !!video.tiktokUrl;

    const thumbnailSrc =
      video.thumbnailUrl ||
      (resolved.type === 'youtube' && resolved.id
        ? `https://img.youtube.com/vi/${resolved.id}/maxresdefault.jpg`
        : '');

    // ── Overlay fade logic ───────────────────────────────────────────────────
    const showOverlayBriefly = useCallback(() => {
      setOverlayVisible(true);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = setTimeout(() => setOverlayVisible(false), 3800);
    }, []);

    useEffect(() => {
      if (isActive) {
        showOverlayBriefly();
      } else {
        setOverlayVisible(false);
        if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      }
    }, [isActive, showOverlayBriefly]);

    useEffect(() => () => { if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current); }, []);

    // ── Auto-play / pause direct video ───────────────────────────────────────
    // Only attempt autoplay for direct (MP4/WebM) videos; TikTok-only cards skip this entirely
    useEffect(() => {
      if (resolved.type !== 'direct' || isTikTokOnly || !videoRef.current) return;
      if (isActive) {
        videoRef.current.muted = isMuted;
        videoRef.current.play().catch(() => { /* autoplay blocked — user hasn't interacted yet */ });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setProgress(0);
      }
    }, [isActive, resolved.type]);

    useEffect(() => {
      if (resolved.type === 'direct' && videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    }, [isMuted, resolved.type]);

    // ── Progress bar for direct video ────────────────────────────────────────
    useEffect(() => {
      const vid = videoRef.current;
      if (!vid || resolved.type !== 'direct') return;
      const onTimeUpdate = () => { if (vid.duration) setProgress(vid.currentTime / vid.duration); };
      vid.addEventListener('timeupdate', onTimeUpdate);
      return () => vid.removeEventListener('timeupdate', onTimeUpdate);
    }, [resolved.type]);

    const fmtCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

    return (
      <div
        ref={ref}
        className="relative w-full flex-shrink-0 overflow-hidden bg-black snap-start"
        style={{ height: cardHeight }}
        onClick={showOverlayBriefly}
        onTouchStart={showOverlayBriefly}
      >
        {/* ── Global animation keyframe ── */}
        <style>{`
          @keyframes vidProgressLoop { from { transform: scaleX(0); } to { transform: scaleX(1); } }
          .feed-no-bar::-webkit-scrollbar { display: none; }
          .feed-no-bar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* ── Video layer ── */}
        <div className="absolute inset-0 bg-zinc-950">
          {/* Direct MP4 / WebM */}
          {resolved.type === 'direct' && (
            <video
              ref={videoRef}
              src={resolved.url}
              playsInline
              loop
              muted={isMuted}
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* YouTube — embed when active, thumbnail when idle */}
          {resolved.type === 'youtube' && (
            isActive ? (
              <iframe
                key={`yt-${video.id}-${isMuted}`}
                title={video.title}
                src={`${resolved.url}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${resolved.id}&modestbranding=1&iv_load_policy=3&rel=0&showinfo=0`}
                className="absolute inset-0 w-full h-full scale-[1.08] pointer-events-none"
                allow="autoplay; encrypted-media"
              />
            ) : (
              thumbnailSrc && (
                <img
                  src={thumbnailSrc}
                  alt={video.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              )
            )
          )}

          {/* TikTok-only card: show thumbnail as static background, no video/autoplay */}
          {isTikTokOnly && thumbnailSrc && (
            <img
              src={thumbnailSrc}
              alt={video.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* TikTok-only: no thumbnail fallback */}
          {isTikTokOnly && !thumbnailSrc && (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-2">
              <TikTokSvg className="w-8 h-8 fill-white/20" />
              <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold">TikTok Video</span>
            </div>
          )}

          {/* No-source fallback (not TikTok-only) */}
          {!resolved.url && !isTikTokOnly && (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
              <Play className="w-10 h-10 text-white/15" />
            </div>
          )}
        </div>

        {/* ── Gradient vignettes ── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/12 via-transparent to-black/25 pointer-events-none" />


        {/* ── Overlay (fades in/out) ── */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-600 pointer-events-none ${overlayVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Left: metadata + Shop button */}
          <div className="absolute left-4 bottom-16 right-16 flex flex-col gap-2.5 pointer-events-auto">
            {/* Creator + Category pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                <img
                  src="/about-portrait.jpg"
                  alt="Cartiae Rae"
                  className="w-4 h-4 rounded-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
                <span className="text-white text-[9px] font-bold tracking-wide font-sans">Cartiae Rae</span>
              </div>
              <span className="bg-[#B11B41]/90 backdrop-blur-sm text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-white/10 font-mono">
                {video.category}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-white font-serif text-[17px] font-bold leading-tight tracking-tight">
              {video.title}
            </h2>

            {/* Description */}
            {(video.description || getDescription(video.id)) && (
              <p className="text-white/62 text-[11px] leading-relaxed line-clamp-2 font-sans">
                {video.description || getDescription(video.id)}
              </p>
            )}

            {/* Shop the Look */}
            {relatedItems.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onShopClick(); }}
                className="flex items-center gap-1.5 bg-white/95 hover:bg-[#B11B41] text-black hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest w-fit transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.97]"
              >
                <ShoppingBag className="w-3 h-3 shrink-0" />
                Shop the Look ({relatedItems.length})
              </button>
            )}

            {/* Watch on TikTok (secondary, only if tiktokUrl provided) */}
            {tiktokUrl && (
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-black/60 hover:bg-black text-white px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest w-fit transition-all duration-200 border border-white/15 backdrop-blur-sm"
              >
                <TikTokSvg className="w-3 h-3 fill-white" />
                Watch on TikTok
              </a>
            )}
          </div>

          {/* Bottom bar: mute + progress */}
          <div className="absolute bottom-4 left-4 right-16 flex items-center gap-3 pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all flex-shrink-0 border border-white/10"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Progress bar */}
            <div className="flex-1 h-0.5 bg-white/25 rounded-full overflow-hidden">
              {resolved.type === 'direct' ? (
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress * 100}%`, transition: 'width 0.3s linear' }}
                />
              ) : (
                <div
                  className="h-full bg-white/80 rounded-full origin-left"
                  style={{
                    animation:
                      isActive && !prefersReducedMotion
                        ? 'vidProgressLoop 30s linear infinite'
                        : 'none',
                    transform: isActive ? undefined : 'scaleX(0)',
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Right actions panel (always visible) ── */}
        <div className="absolute right-3.5 bottom-16 z-20 flex flex-col items-center gap-5">
          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-all border ${
                isLiked
                  ? 'bg-[#B11B41] text-white border-[#B11B41]/50'
                  : 'bg-white/20 text-white border-white/10 hover:bg-white/30'
              }`}
            >
              <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-white scale-110' : ''}`} />
            </button>
            <span className="text-white text-[10px] font-bold font-mono">{fmtCount(likesCount)}</span>
          </div>

          {/* Save */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-all border ${
                isSaved
                  ? 'bg-[#B11B41] text-white border-[#B11B41]/50'
                  : 'bg-white/20 text-white border-white/10 hover:bg-white/30'
              }`}
            >
              <Bookmark className={`w-5 h-5 transition-transform ${isSaved ? 'fill-white scale-110' : ''}`} />
            </button>
            <span className="text-white text-[10px] font-bold font-mono">{isSaved ? 'Saved' : 'Save'}</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="w-11 h-11 rounded-full bg-white/20 text-white border border-white/10 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <span className="text-white text-[10px] font-bold font-mono">Share</span>
          </div>
        </div>
      </div>
    );
  }
);
VideoFeedCard.displayName = 'VideoFeedCard';

// ─── Category type ────────────────────────────────────────────────────────────

type CategoryType =
  | 'All'
  | 'Wash Day'
  | 'Styling'
  | 'Growth Tips'
  | 'Protective Styles'
  | 'Product Reviews'
  | 'Tutorials';

const CATEGORIES: CategoryType[] = [
  'All', 'Wash Day', 'Styling', 'Growth Tips', 'Protective Styles', 'Product Reviews', 'Tutorials',
];

// ─── VideoGallery ─────────────────────────────────────────────────────────────

export const VideoGallery: React.FC = () => {
  const { videos, products, ebooks, addToCart, triggerToast, prefersReducedMotion } = useApp();

  // Category filter
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');

  // Feed
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Modal
  const [modalVideoId, setModalVideoId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'shop' | 'qa'>('shop');

  // Social
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ id: string; author: string; text: string }>>>({});
  const [newComment, setNewComment] = useState('');

  // Refs
  const feedRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const wheelDebounceRef = useRef(false);

  // Always-current wheel + keyboard handlers (ref pattern avoids re-attaching listener)
  const handleWheelRef = useRef<(e: WheelEvent) => void>(() => {});
  const handleKeyRef = useRef<(e: KeyboardEvent) => void>(() => {});

  // ── Filtered + sorted feed ────────────────────────────────────────────────
  const filteredVideos = useMemo(() => {
    const now = new Date();
    return videos
      .filter((v) => {
        const st = v.status ?? 'published';
        if (st === 'draft') return false;
        if (st === 'scheduled') return v.scheduledAt ? new Date(v.scheduledAt) <= now : false;
        if ((v.category as string) === 'Cornrows') return false;
        return activeCategory === 'All' || v.category === activeCategory;
      })
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (a.isFeatured && b.isFeatured) {
          return (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999);
        }
        const nA = parseInt(a.id.replace('vid-', ''), 10) || 0;
        const nB = parseInt(b.id.replace('vid-', ''), 10) || 0;
        return nB - nA;
      });
  }, [videos, activeCategory]);

  // Card height = viewport minus header (≈56px) and category strip (≈48px)
  const CARD_H = 'calc(100svh - 104px)';

  // ── Seed social data ──────────────────────────────────────────────────────
  useEffect(() => {
    const seedL: Record<string, number> = {};
    const seedC: Record<string, Array<{ id: string; author: string; text: string }>> = {};
    videos.forEach((v) => {
      const seed = Math.abs(v.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
      seedL[v.id] = (seed % 450) + 120;
      seedC[v.id] = [
        { id: `${v.id}-c1`, author: 'Aria Carter', text: 'This changed my wash day completely! 😭' },
        { id: `${v.id}-c2`, author: 'Nia J.', text: 'Should I do this on damp or fully dry hair?' },
        { id: `${v.id}-c3`, author: 'Tamera W.', text: 'Love the detailed parting explanation!' },
      ];
    });
    setLikesCountMap((prev) => ({ ...seedL, ...prev }));
    setCommentsMap((prev) => ({ ...seedC, ...prev }));
  }, [videos]);

  // ── Reset to first card when category changes ─────────────────────────────
  useEffect(() => {
    setActiveIndex(0);
    setTimeout(() => {
      cardRefs.current[0]?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 50);
  }, [activeCategory]);

  // ── IntersectionObserver: detect active card ──────────────────────────────
  useEffect(() => {
    const refs = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (refs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const idx = cardRefs.current.findIndex((r) => r === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.55 }
    );

    refs.forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, [filteredVideos]);

  // ── Scroll to index helper ────────────────────────────────────────────────
  const goToIndex = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, filteredVideos.length - 1));
      setActiveIndex(clamped);
      cardRefs.current[clamped]?.scrollIntoView({
        behavior: prefersReducedMotion ? 'instant' : 'smooth',
        block: 'start',
      });
    },
    [filteredVideos.length, prefersReducedMotion]
  );

  // ── Wheel handler (ref, updated each render, listener attached once) ──────
  handleWheelRef.current = (e: WheelEvent) => {
    if (modalVideoId) return;
    e.preventDefault();
    if (wheelDebounceRef.current) return;
    wheelDebounceRef.current = true;
    setTimeout(() => { wheelDebounceRef.current = false; }, 700);
    if (e.deltaY > 0) goToIndex(activeIndex + 1);
    else goToIndex(activeIndex - 1);
  };

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const handler = (e: WheelEvent) => handleWheelRef.current(e);
    feed.addEventListener('wheel', handler, { passive: false });
    return () => feed.removeEventListener('wheel', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard handler ──────────────────────────────────────────────────────
  handleKeyRef.current = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'j') {
      if (!modalVideoId) { e.preventDefault(); goToIndex(activeIndex + 1); }
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      if (!modalVideoId) { e.preventDefault(); goToIndex(activeIndex - 1); }
    } else if (e.key === 'Escape') {
      setModalVideoId(null);
    } else if (e.key === 'm') {
      if (!modalVideoId) setIsMuted((m) => !m);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyRef.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Modal focus trap ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!modalVideoId) return;
    setTimeout(() => {
      const btn = modalRef.current?.querySelector<HTMLButtonElement>('button');
      btn?.focus();
    }, 120);
  }, [modalVideoId]);

  // ── Related items resolver ────────────────────────────────────────────────
  const resolveRelatedItems = useCallback(
    (video: TikTokVideo): RelatedItem[] => {
      if (video.relatedIds && video.relatedIds.length > 0) {
        const items: RelatedItem[] = [];
        video.relatedIds.forEach((rid) => {
          const p = products.find((x) => x.id === rid);
          if (p) { items.push({ id: p.id, type: 'product', name: p.name, price: p.price, image: p.image }); return; }
          const e = ebooks.find((x) => x.id === rid);
          if (e) { items.push({ id: e.id, type: 'ebook', name: e.name, price: e.price, image: e.image }); }
        });
        if (items.length > 0) return items;
      }
      return getFallbackRelated(video.id);
    },
    [products, ebooks]
  );

  // ── Social handlers ───────────────────────────────────────────────────────
  const handleLike = (id: string) => {
    const liked = likedMap[id];
    setLikedMap((prev) => ({ ...prev, [id]: !liked }));
    setLikesCountMap((prev) => ({ ...prev, [id]: liked ? prev[id] - 1 : prev[id] + 1 }));
  };

  const handleSave = (id: string) => {
    const saved = savedMap[id];
    setSavedMap((prev) => ({ ...prev, [id]: !saved }));
    triggerToast(saved ? 'Removed from saved' : 'Saved to your library ✔', 'info');
  };

  const handleShare = async (title: string, id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?video=${encodeURIComponent(id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        triggerToast('Share link copied! 🔗', 'success');
      }
    } catch { /* user cancelled or not supported */ }
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !modalVideoId) return;
    setCommentsMap((prev) => ({
      ...prev,
      [modalVideoId]: [
        ...(prev[modalVideoId] ?? []),
        { id: `c-${Date.now()}`, author: 'You', text: newComment.trim() },
      ],
    }));
    setNewComment('');
  };

  // ── Modal derived data ────────────────────────────────────────────────────
  const modalVideo = useMemo(() => videos.find((v) => v.id === modalVideoId), [videos, modalVideoId]);
  const modalResolved = useMemo(() => (modalVideo ? resolveVideoSource(modalVideo.videoUrl) : null), [modalVideo]);
  const modalRelatedItems = useMemo(() => (modalVideo ? resolveRelatedItems(modalVideo) : []), [modalVideo, resolveRelatedItems]);
  const modalIndex = useMemo(
    () => filteredVideos.findIndex((v) => v.id === modalVideoId),
    [filteredVideos, modalVideoId]
  );

  const openModal = (videoId: string) => { setModalVideoId(videoId); setModalTab('shop'); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    // Break out of shared page padding on all screen sizes
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 relative bg-[#FAF6F0] min-h-screen">

      {/* ── Page Header ── */}
      <div className="text-center pt-7 pb-5 px-4 select-none">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-[#B11B41] font-bold block">
          Short-Form Masterclass
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2C1810] font-normal mt-1">
          Visuals
        </h1>
        <p className="font-sans text-[11px] text-[#543F35]/60 max-w-xs mx-auto leading-relaxed mt-1.5">
          Coily care, styling &amp; growth routines — scroll to explore.
        </p>
      </div>

      {/* ── Category Filter (sticky) ── */}
      <div className="sticky top-14 z-30 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#C4A882]/30">
        <div className="max-w-[420px] mx-auto flex overflow-x-auto feed-no-bar px-4 gap-5 py-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`vid-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] uppercase tracking-wider font-bold whitespace-nowrap pb-0.5 relative transition-colors flex-shrink-0 focus:outline-none ${
                activeCategory === cat ? 'text-[#2C1810]' : 'text-[#543F35]/40 hover:text-[#543F35]/70'
              }`}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div
                  layoutId="activeFeedCat"
                  className="absolute bottom-[-10px] left-0 right-0 h-[2px] bg-[#B11B41] rounded-full"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Feed + Desktop navigation ── */}
      <div className="relative flex items-center justify-center">

        {/* Desktop ↑ button */}
        <button
          onClick={() => goToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Previous video"
          className="hidden lg:flex absolute z-20 w-10 h-10 rounded-full bg-[#2C1810]/10 hover:bg-[#2C1810]/20 text-[#2C1810] items-center justify-center border border-[#C4A882]/40 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ left: 'calc(50% + 218px)', top: '28%' }}
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        {/* Scroll feed */}
        <div
          ref={feedRef}
          className="w-full sm:max-w-[390px] overflow-y-scroll snap-y snap-mandatory feed-no-bar"
          style={{ height: CARD_H }}
        >
          {filteredVideos.length > 0 ? (
            filteredVideos.map((video, idx) => (
              <VideoFeedCard
                key={video.id}
                ref={(el) => { cardRefs.current[idx] = el; }}
                video={video}
                cardHeight={CARD_H}
                isActive={idx === activeIndex}
                isMuted={isMuted}
                isLiked={!!likedMap[video.id]}
                isSaved={!!savedMap[video.id]}
                likesCount={likesCountMap[video.id] ?? 0}
                relatedItems={resolveRelatedItems(video)}
                tiktokUrl={video.tiktokUrl}
                onLike={() => handleLike(video.id)}
                onSave={() => handleSave(video.id)}
                onShare={() => handleShare(video.title, video.id)}
                onShopClick={() => openModal(video.id)}
                onToggleMute={() => setIsMuted((m) => !m)}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))
          ) : (
            <div className="flex items-center justify-center" style={{ height: CARD_H }}>
              <div className="text-center">
                <Play className="w-8 h-8 text-[#543F35]/20 mx-auto mb-3 animate-pulse" />
                <p className="font-serif text-sm text-[#543F35]/50">No videos in this category.</p>
                <p className="text-[10px] text-[#543F35]/30 mt-1 font-sans">Try a different filter.</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop ↓ button */}
        <button
          onClick={() => goToIndex(activeIndex + 1)}
          disabled={activeIndex >= filteredVideos.length - 1}
          aria-label="Next video"
          className="hidden lg:flex absolute z-20 w-10 h-10 rounded-full bg-[#2C1810]/10 hover:bg-[#2C1810]/20 text-[#2C1810] items-center justify-center border border-[#C4A882]/40 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ left: 'calc(50% + 218px)', top: '68%' }}
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* Desktop dot tracker (left of feed) */}
        {filteredVideos.length > 1 && (
          <div
            className="hidden lg:flex flex-col items-center gap-1.5 absolute z-20"
            style={{ right: 'calc(50% + 218px)' }}
          >
            {filteredVideos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToIndex(idx)}
                aria-label={`Go to video ${idx + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  idx === activeIndex ? 'w-1.5 h-6 bg-[#B11B41]' : 'w-1.5 h-1.5 bg-[#543F35]/25 hover:bg-[#543F35]/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Keyboard hint (desktop, first load) ── */}
      <div className="hidden lg:block text-center py-3 text-[9px] text-[#543F35]/30 uppercase tracking-widest select-none">
        ↑ ↓ arrows · J K keys · scroll to navigate · M to mute
      </div>

      {/* ── Modal / Immersive Player ── */}
      <AnimatePresence>
        {modalVideoId && modalVideo && modalResolved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
            onClick={() => setModalVideoId(null)}
          >
            {/* Close */}
            <button
              onClick={() => setModalVideoId(null)}
              aria-label="Close"
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-[#B11B41] text-white border border-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev arrow */}
            {modalIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalVideoId(filteredVideos[modalIndex - 1].id);
                  setModalTab('shop');
                }}
                aria-label="Previous video"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next arrow */}
            {modalIndex < filteredVideos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalVideoId(filteredVideos[modalIndex + 1].id);
                  setModalTab('shop');
                }}
                aria-label="Next video"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Modal card */}
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.95, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 18 }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="w-full max-w-4xl h-[88vh] md:h-[620px] bg-[#FAF6F0] rounded-[28px] overflow-hidden flex flex-col md:flex-row shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Video player */}
              <div className="w-full md:w-[290px] h-[42%] md:h-full bg-black relative flex-shrink-0 flex items-center justify-center overflow-hidden">
                {/* YouTube */}
                {modalResolved.type === 'youtube' && (
                  <iframe
                    key={`modal-yt-${modalVideo.id}-${isMuted}`}
                    title={modalVideo.title}
                    src={`${modalResolved.url}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&loop=1&playlist=${modalResolved.id}&modestbranding=1&rel=0`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                )}


                {/* Direct MP4 */}
                {modalResolved.type === 'direct' && (
                  <video
                    key={`modal-dir-${modalVideo.id}`}
                    src={modalResolved.url}
                    autoPlay
                    controls
                    playsInline
                    loop
                    muted={isMuted}
                    className="absolute inset-0 w-full h-full object-cover bg-black"
                  />
                )}

                {/* TikTok-only modal: thumbnail + prominent Watch on TikTok CTA */}
                {!modalResolved.url && modalVideo.tiktokUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
                    {modalVideo.thumbnailUrl && (
                      <img
                        src={modalVideo.thumbnailUrl}
                        alt={modalVideo.title}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-4 px-5 text-center">
                      <TikTokSvg className="w-9 h-9 fill-white/60" />
                      <p className="text-white font-serif text-sm leading-snug">{modalVideo.title}</p>
                      <a
                        href={modalVideo.tiktokUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 bg-white hover:bg-[#B11B41] text-black hover:text-white px-5 py-2.5 rounded-xl text-[11px] uppercase font-extrabold tracking-widest transition-all shadow-lg"
                      >
                        <TikTokSvg className="w-3.5 h-3.5 fill-current" />
                        Watch on TikTok
                      </a>
                    </div>
                  </div>
                )}

                {/* Mute toggle — hidden for TikTok-only cards */}
                {(modalResolved.url || !modalVideo.tiktokUrl) && (
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className="absolute bottom-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                )}

              </div>


              {/* Right: content pane */}
              <div className="flex-1 flex flex-col h-[58%] md:h-full bg-[#FAF6F0] overflow-hidden text-black">

                {/* Creator header */}
                <div className="px-5 py-4 border-b border-black/[0.07] flex items-center justify-between flex-shrink-0 bg-white/50">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/about-portrait.jpg"
                      alt="Cartiae Rae"
                      className="w-8 h-8 rounded-full border border-[#B11B41]/20 object-cover object-top"
                    />
                    <div>
                      <span className="font-mono text-xs font-bold text-black block leading-none">@cartiae_rae</span>
                      <span className="text-[9px] text-zinc-500 block mt-0.5 leading-none">Coily Hair Specialist</span>
                    </div>
                  </div>
                  <span className="bg-[#B11B41] text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded font-mono">
                    {modalVideo.category}
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-black/[0.07] flex-shrink-0 text-[10px] uppercase font-extrabold tracking-wider select-none">
                  {(['shop', 'qa'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setModalTab(tab)}
                      className={`flex-1 py-3 text-center border-b-2 transition-all ${
                        modalTab === tab
                          ? 'border-[#B11B41] text-[#B11B41] bg-white/30'
                          : 'border-transparent text-black/40 hover:text-black/70'
                      }`}
                    >
                      {tab === 'shop'
                        ? `Shop Routine (${modalRelatedItems.length})`
                        : `Q&A (${(commentsMap[modalVideo.id] ?? []).length})`}
                    </button>
                  ))}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-5 feed-no-bar">
                  {modalTab === 'shop' ? (
                    <div className="space-y-4">
                      {/* Video info */}
                      <div>
                        <h2 className="font-serif text-lg font-bold text-black leading-snug">
                          {modalVideo.title}
                        </h2>
                        <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed bg-white rounded-xl p-3 border border-black/[0.05]">
                          {modalVideo.description || getDescription(modalVideo.id)}
                        </p>
                      </div>

                      {/* Related items */}
                      {modalRelatedItems.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#B11B41] font-bold block">
                            Featured in this Routine
                          </span>
                          {modalRelatedItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-black/[0.05] shadow-sm"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-11 h-11 object-cover rounded-xl border border-black/[0.05] flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[7.5px] uppercase tracking-widest font-extrabold text-zinc-400 block">
                                  {item.type}
                                </span>
                                <h4 className="font-serif text-[11px] font-bold text-black truncate mt-0.5">
                                  {item.name}
                                </h4>
                                <span className="font-mono text-[10px] text-zinc-500 font-semibold">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  addToCart({
                                    id: item.id,
                                    type: item.type,
                                    name: item.name,
                                    price: item.price,
                                    image: item.image,
                                  });
                                  triggerToast(`"${item.name}" added to bag! 👜`, 'success');
                                }}
                                className="px-3 py-1.5 bg-black hover:bg-[#B11B41] text-white text-[9px] uppercase font-bold tracking-widest transition-all rounded-xl flex-shrink-0 focus:outline-none"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full min-h-[200px]">
                      {/* Comments */}
                      <div className="space-y-3.5 flex-1 mb-4">
                        {(commentsMap[modalVideo.id] ?? []).length > 0 ? (
                          (commentsMap[modalVideo.id] ?? []).map((c) => (
                            <div key={c.id} className="text-xs border-b border-black/[0.06] pb-3 last:border-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <span className="font-bold text-black font-mono">{c.author}</span>
                                <span className="text-[8px] text-zinc-400">Just now</span>
                              </div>
                              <p className="text-zinc-600 leading-relaxed">{c.text}</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center text-zinc-400 font-serif text-xs">
                            No questions yet. Be first!
                          </div>
                        )}
                      </div>

                      {/* Comment form */}
                      <form
                        onSubmit={submitComment}
                        className="flex gap-2 items-center border-t border-black/[0.07] pt-3 flex-shrink-0"
                      >
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Ask a question about this routine..."
                          className="flex-1 px-3 py-2 bg-white border border-black/10 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#B11B41]"
                        />
                        <button
                          type="submit"
                          className="p-2 bg-black hover:bg-[#B11B41] text-white rounded-full transition-all flex items-center justify-center focus:outline-none"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Footer social row */}
                <div className="px-5 py-3 border-t border-black/[0.07] bg-white/50 flex items-center justify-around flex-shrink-0 select-none">
                  <button
                    onClick={() => handleLike(modalVideo.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      likedMap[modalVideo.id] ? 'text-[#B11B41]' : 'text-black/55 hover:text-black'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedMap[modalVideo.id] ? 'fill-[#B11B41]' : ''}`} />
                    {(likesCountMap[modalVideo.id] ?? 0).toLocaleString()}
                  </button>
                  <button
                    onClick={() => handleSave(modalVideo.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      savedMap[modalVideo.id] ? 'text-[#B11B41]' : 'text-black/55 hover:text-black'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedMap[modalVideo.id] ? 'fill-[#B11B41]' : ''}`} />
                    {savedMap[modalVideo.id] ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleShare(modalVideo.title, modalVideo.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-black/55 hover:text-black transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  {modalVideo.tiktokUrl && (
                    <a
                      href={modalVideo.tiktokUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-semibold text-black/55 hover:text-[#B11B41] transition-colors"
                      title="Open on TikTok"
                    >
                      <TikTokSvg className="w-3.5 h-3.5 fill-current" />
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
