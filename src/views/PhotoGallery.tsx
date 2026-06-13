import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PhotoGalleryItem } from '../types';
import { Camera, Calendar, ThumbsUp, X, Sparkles, Filter, ChevronLeft, ChevronRight, Share2, Check } from 'lucide-react';

export const PhotoGallery: React.FC = () => {
  const { gallery } = useApp();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Progress' | 'Hairstyles' | 'Routines' | 'Lifestyle'>('All');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoGalleryItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Simple liking simulations for individual gallery photos
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});

  const categories: ('All' | 'Progress' | 'Hairstyles' | 'Routines' | 'Lifestyle')[] = [
    'All', 'Progress', 'Hairstyles', 'Routines', 'Lifestyle'
  ];

  const filteredPhotos = useMemo(() => {
    return gallery.filter(p => activeCategory === 'All' || p.category === activeCategory);
  }, [gallery, activeCategory]);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const liked = hasLiked[id];
    const baseCount = likesCount[id] || Math.floor(45 + Math.random() * 120);
    
    if (liked) {
      setLikesCount(prev => ({ ...prev, [id]: baseCount - 1 }));
      setHasLiked(prev => ({ ...prev, [id]: false }));
    } else {
      setLikesCount(prev => ({ ...prev, [id]: baseCount + 1 }));
      setHasLiked(prev => ({ ...prev, [id]: true }));
    }
  };

  const getLikes = (id: string) => {
    if (likesCount[id] !== undefined) return likesCount[id];
    // Create random stable seed
    const seed = Math.abs(id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 150 + 20;
    return seed;
  };

  const handleShare = async (item: PhotoGalleryItem) => {
    const url = `${window.location.origin}${window.location.pathname}?galleryItem=${encodeURIComponent(item.id)}`;
    
    // Attempt native browser sharing
    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      try {
        await navigator.share({
          title: 'Cartiae Rae Hair Milestone Portfolios',
          text: `Check out this incredible 4C hair journey step: "${item.caption}"`,
          url: url
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (err) {
        // Fallback to Clipboard if user dismissed or error occurs
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const galId = params.get('galleryItem');
    if (galId) {
      const match = gallery.find(item => item.id === galId);
      if (match) {
        setSelectedPhoto(match);
      }
    }
  }, [gallery]);

  // Implement Left/Right keyboard arrows navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'ArrowRight') {
        const idx = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
        if (idx !== -1 && filteredPhotos.length > 1) {
          setSelectedPhoto(filteredPhotos[(idx + 1) % filteredPhotos.length]);
          setCopied(false);
        }
      } else if (e.key === 'ArrowLeft') {
        const idx = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
        if (idx !== -1 && filteredPhotos.length > 1) {
          setSelectedPhoto(filteredPhotos[(idx - 1 + filteredPhotos.length) % filteredPhotos.length]);
          setCopied(false);
        }
      } else if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, filteredPhotos]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      
      {/* Banner Intro */}
      <div className="text-center mb-16 space-y-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold block">
          Client &amp; Student Portfolios
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark font-normal">
          The 4C Progress Log
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#6C5347]/80 max-w-xl mx-auto leading-relaxed">
          Real milestones after maintaining Cartiae&apos;s moisturizing systems. Length retention, coily curl definition, and hydration habits.
        </p>
      </div>

      {/* Category Tabs banner */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-12 border-b border-brand-warm-tan/20 pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`gallery-cat-${cat.toLowerCase()}`}
            onClick={() => setActiveCategory(cat)}
            className={`text-[11px] uppercase tracking-[0.18em] font-medium py-1 transition-colors focus:outline-none ${
              activeCategory === cat
                ? 'text-brand-rose border-b border-brand-rose'
                : 'text-brand-dark/60 hover:text-brand-dark'
            }`}
          >
            {cat === 'All' ? 'All Milestones' : cat}
          </button>
        ))}
      </div>

      {/* Masonry-like grid container */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
        {filteredPhotos.map((item) => {
          const itemLikes = getLikes(item.id);
          const userLiked = hasLiked[item.id];

          return (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="break-inside-avoid mb-8 relative overflow-hidden border border-[#DCCAAB]/25 bg-[#FAF6F0] hover:border-brand-rose/60 hover:shadow-md transition-all duration-300 cursor-pointer group rounded-sm"
            >
              <img
                src={item.image}
                alt={item.caption}
                referrerPolicy="no-referrer"
                className="w-full object-cover transition-transform duration-700"
              />

              {/* Tag overlay */}
              <span className="absolute top-4 left-4 bg-brand-dark/90 text-[#FAF6F0] text-[8px] uppercase tracking-widest font-bold px-2.5 py-1 font-mono">
                {item.category}
              </span>

              {/* Text caption details and likes count at bottom */}
              <div className="p-5 border-t border-brand-warm-tan/10 bg-[#FAF6F0]">
                <p className="font-sans text-xs text-brand-dark/80 leading-relaxed italic">
                  &ldquo;{item.caption}&rdquo;
                </p>

                <div className="mt-4 pt-3 border-t border-brand-warm-tan/15 flex items-center justify-between text-[10px]">
                  <span className="text-[#A67E6B] font-medium flex items-center gap-1 font-mono uppercase tracking-wider">
                    Routine Log
                  </span>
                  
                  {/* Likes count */}
                  <button
                    onClick={(e) => handleLike(item.id, e)}
                    className={`flex items-center gap-1.5 font-semibold transition-colors focus:outline-none ${
                      userLiked ? 'text-brand-rose' : 'text-brand-dark/50 hover:text-brand-rose'
                    }`}
                  >
                    <span>{userLiked ? 'Liked' : 'Like'}</span>
                    <span className="text-[9px] font-mono">({itemLikes})</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Empty elements warning */}
      {filteredPhotos.length === 0 && (
        <div className="py-20 text-center bg-brand-beige/10 border border-brand-warm-tan/25">
          <Camera className="w-8 h-8 text-[#B11B41] mx-auto mb-3 opacity-60" />
          <p className="font-serif text-base text-brand-dark">No progress portraits found.</p>
          <p className="font-sans text-xs text-brand-dark/50 mt-1">Try selecting a different lifestyle milestone.</p>
        </div>
      )}

      {/* ======================================= */}
      {/* 🌟 IMAGE DETAIL ZOOM MODAL DIALOG       */}
      {/* ======================================= */}
      {selectedPhoto && (() => {
        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
        const totalCount = filteredPhotos.length;

        const handleNext = () => {
          if (currentIndex !== -1 && totalCount > 1) {
            setSelectedPhoto(filteredPhotos[(currentIndex + 1) % totalCount]);
            setCopied(false);
          }
        };

        const handlePrev = () => {
          if (currentIndex !== -1 && totalCount > 1) {
            setSelectedPhoto(filteredPhotos[(currentIndex - 1 + totalCount) % totalCount]);
            setCopied(false);
          }
        };

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/95 backdrop-blur-sm flex items-center justify-center p-4">
            
            {/* Navigational Container (Max widths) */}
            <div className="relative bg-[#FAF6F0] w-full max-w-xl overflow-hidden shadow-2xl rounded-sm">
              
              {/* Top Banner Bar with Close and Photo Index Status Indicator */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-warm-tan/15 bg-brand-cream/40">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#B11B41] font-bold">
                  {currentIndex !== -1 ? `Portrait Log ${currentIndex + 1} of ${totalCount}` : 'Logged Milestone'}
                </span>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 hover:text-brand-rose text-brand-dark transition-colors focus:outline-none"
                  aria-label="Close zoom"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Exp Image Stage with overlays */}
              <div className="relative w-full bg-stone-900 flex items-center justify-center group/stage">
                <img
                  src={selectedPhoto.image}
                  alt={selectedPhoto.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[55vh] object-contain mx-auto select-none"
                />

                {/* Left Drawer Arrow Button */}
                {totalCount > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-brand-rose hover:text-white text-brand-dark shadow transition-all focus:outline-none opacity-80 hover:opacity-100 flex items-center justify-center cursor-pointer"
                    title="Previous Photo (Left Arrow)"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}

                {/* Right Drawer Arrow Button */}
                {totalCount > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-brand-rose hover:text-white text-brand-dark shadow transition-all focus:outline-none opacity-80 hover:opacity-100 flex items-center justify-center cursor-pointer"
                    title="Next Photo (Right Arrow)"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              </div>

              {/* Captions and Share options */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-rose text-white text-[9px] uppercase tracking-widest font-mono font-bold px-2.5 py-1">
                      {selectedPhoto.category}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-[10px] text-[#A67E6B] font-mono">ID: {selectedPhoto.id}</span>
                  </div>
                  
                  {/* Subtle navigation cue for desktops */}
                  <span className="hidden sm:inline font-mono text-[8px] uppercase tracking-widest text-[#6C5347]/45">
                    🖮 Use Left / Right Keys
                  </span>
                </div>

                <p className="font-serif text-base italic text-brand-dark leading-relaxed">
                  &ldquo;{selectedPhoto.caption}&rdquo;
                </p>

                {/* Action buttons */}
                <div className="pt-4 border-t border-brand-warm-tan/20 flex justify-between items-center text-xs text-brand-dark/60 font-semibold gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-brand-dark/40 font-bold">
                    Retained Coily Length Progress
                  </span>
                  
                  <button
                    onClick={() => handleShare(selectedPhoto)}
                    className="flex items-center gap-2 border border-brand-warm-tan/30 bg-white px-3.5 py-2 hover:bg-brand-rose hover:text-white hover:border-brand-rose transition-colors focus:outline-none text-[10px] uppercase tracking-widest font-bold cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Photo</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
