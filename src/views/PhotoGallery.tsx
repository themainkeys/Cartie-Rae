import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PhotoGalleryItem } from '../types';
import { Camera, X, ChevronLeft, ChevronRight, Share2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PhotoGallery: React.FC = () => {
  const { gallery, prefersReducedMotion } = useApp();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Progress' | 'Hairstyles' | 'Routines' | 'Lifestyle'>('All');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoGalleryItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Direction tracking for image slider
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Simple liking simulations for individual gallery photos
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [hasLiked, setHasLiked] = useState<Record<string, boolean>>({});

  // View Mode: 'slider' (default Lookbook) vs 'grid' (traditional masonry)
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Pagination count for grid mode
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    setVisibleCount(3);
    setCurrentSlideIndex(0);
  }, [activeCategory]);

  const categories: ('All' | 'Progress' | 'Hairstyles' | 'Routines' | 'Lifestyle')[] = [
    'All', 'Progress', 'Hairstyles', 'Routines', 'Lifestyle'
  ];

  const filteredPhotos = useMemo(() => {
    return gallery.filter(p => activeCategory === 'All' || p.category === activeCategory);
  }, [gallery, activeCategory]);

  const paginatedPhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleCount);
  }, [filteredPhotos, visibleCount]);

  const currentPhoto = useMemo(() => {
    if (filteredPhotos.length === 0) return null;
    return filteredPhotos[currentSlideIndex % filteredPhotos.length];
  }, [filteredPhotos, currentSlideIndex]);

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
    const seed = Math.abs(id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 150 + 20;
    return seed;
  };

  const handleShare = async (item: PhotoGalleryItem) => {
    const url = `${window.location.origin}${window.location.pathname}?galleryItem=${encodeURIComponent(item.id)}`;
    
    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      try {
        await navigator.share({
          title: 'Cartiae Rae Lookbook Portfolios',
          text: `Check out this incredible 4C hair journey step: "${item.caption}"`,
          url: url
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (err) {
        // Fallback to Clipboard
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

  const handleNextSlide = () => {
    if (filteredPhotos.length <= 1) return;
    setSlideDirection('right');
    setCurrentSlideIndex(prev => (prev + 1) % filteredPhotos.length);
    setCopied(false);
  };

  const handlePrevSlide = () => {
    if (filteredPhotos.length <= 1) return;
    setSlideDirection('left');
    setCurrentSlideIndex(prev => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
    setCopied(false);
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

  // Implement Left/Right keyboard arrows navigation for zoom modal and slide carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhoto) {
        if (e.key === 'ArrowRight') {
          const idx = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
          if (idx !== -1 && filteredPhotos.length > 1) {
            setSlideDirection('right');
            setSelectedPhoto(filteredPhotos[(idx + 1) % filteredPhotos.length]);
            setCopied(false);
          }
        } else if (e.key === 'ArrowLeft') {
          const idx = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
          if (idx !== -1 && filteredPhotos.length > 1) {
            setSlideDirection('left');
            setSelectedPhoto(filteredPhotos[(idx - 1 + filteredPhotos.length) % filteredPhotos.length]);
            setCopied(false);
          }
        } else if (e.key === 'Escape') {
          setSelectedPhoto(null);
        }
      } else if (viewMode === 'slider') {
        if (e.key === 'ArrowRight') {
          handleNextSlide();
        } else if (e.key === 'ArrowLeft') {
          handlePrevSlide();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, filteredPhotos, viewMode, currentSlideIndex]);

  const slideVariants = {
    enter: (direction: 'left' | 'right' | null) => ({
      x: prefersReducedMotion || !direction ? 0 : direction === 'right' ? 150 : -150,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right' | null) => ({
      x: prefersReducedMotion || !direction ? 0 : direction === 'right' ? -150 : 150,
      opacity: 0
    })
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      
      {/* Banner Intro */}
      <div className="text-center mb-16 space-y-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold block">
          Client &amp; Student Lookbooks
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark font-normal">
          The 4C Gallery
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#6C5347]/80 max-w-xl mx-auto leading-relaxed">
          Real milestones after maintaining Cartiae&apos;s moisturizing systems. Browse hairstyles, lifestyle logs, and hydration routines.
        </p>
      </div>

      {/* Category Tabs banner with sliding active indicator */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-8 border-b border-brand-warm-tan/20 pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`gallery-cat-${cat.toLowerCase()}`}
            onClick={() => setActiveCategory(cat)}
            className={`text-[11px] uppercase tracking-[0.18em] font-medium py-1 relative focus:outline-none transition-colors duration-300 cursor-pointer ${
              activeCategory === cat
                ? 'text-brand-rose font-bold'
                : 'text-brand-dark/60 hover:text-brand-dark'
            }`}
          >
            <span>{cat === 'All' ? 'All Photos' : cat}</span>
            {activeCategory === cat && (
              <motion.span 
                layoutId="activePhotoTab"
                className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-brand-rose"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-10 select-none">
        <div className="bg-[#FAF6F0] p-1.5 rounded-full border border-brand-warm-tan/25 flex items-center gap-1 shadow-xs">
          <button
            onClick={() => setViewMode('slider')}
            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer relative ${
              viewMode === 'slider' ? 'text-white' : 'text-brand-dark/60 hover:text-brand-dark'
            }`}
          >
            {viewMode === 'slider' && (
              <motion.span
                layoutId="activeViewMode"
                className="absolute inset-0 bg-brand-rose rounded-full"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <span className="relative z-10">Lookbook Slide</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer relative ${
              viewMode === 'grid' ? 'text-white' : 'text-brand-dark/60 hover:text-brand-dark'
            }`}
          >
            {viewMode === 'grid' && (
              <motion.span
                layoutId="activeViewMode"
                className="absolute inset-0 bg-brand-rose rounded-full"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <span className="relative z-10">Grid Gallery</span>
          </button>
        </div>
      </div>

      {/* 🎬 1. Lookbook Slide View */}
      {viewMode === 'slider' && (
        <div className="w-full flex flex-col items-center py-4 select-none mb-16">
          {filteredPhotos.length > 0 && currentPhoto ? (
            <div className="w-full max-w-xl flex flex-col items-center px-4">
              
              {/* Slider Main Stage */}
              <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] md:h-[450px] bg-[#120E0C] rounded-[28px] overflow-hidden shadow-xl border border-brand-warm-tan/20 flex items-center justify-center">
                <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                  <motion.img
                    key={currentPhoto.id}
                    src={currentPhoto.image}
                    alt={currentPhoto.caption}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(e, info) => {
                      if (info.offset.x > 50) {
                        handlePrevSlide();
                      } else if (info.offset.x < -50) {
                        handleNextSlide();
                      }
                    }}
                    onClick={() => {
                      setSlideDirection(null);
                      setSelectedPhoto(currentPhoto);
                    }}
                    className="w-full h-full object-cover cursor-zoom-in"
                  />
                </AnimatePresence>

                {/* Tag Overlay */}
                <span className="absolute top-4 left-4 bg-brand-dark/95 text-[#FAF6F0] text-[8px] uppercase tracking-widest font-bold px-2.5 py-1 font-mono rounded z-10">
                  {currentPhoto.category}
                </span>

                {/* Left Slide Arrow */}
                {filteredPhotos.length > 1 && (
                  <button
                    onClick={handlePrevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#FAF6F0]/90 hover:bg-brand-rose hover:text-white text-brand-dark shadow transition-all duration-300 opacity-80 hover:opacity-100 flex items-center justify-center cursor-pointer z-10 border border-brand-warm-tan/10"
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}

                {/* Right Slide Arrow */}
                {filteredPhotos.length > 1 && (
                  <button
                    onClick={handleNextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#FAF6F0]/90 hover:bg-brand-rose hover:text-white text-brand-dark shadow transition-all duration-300 opacity-80 hover:opacity-100 flex items-center justify-center cursor-pointer z-10 border border-brand-warm-tan/10"
                    title="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>

              {/* Slider Info Deck Card */}
              <div className="w-full mt-6 p-6 bg-[#FAF6F0] border border-[#DCCAAB]/25 rounded-[24px] shadow-sm flex flex-col gap-4 text-left">
                <p className="font-serif text-sm sm:text-base italic text-brand-dark leading-relaxed">
                  &ldquo;{currentPhoto.caption}&rdquo;
                </p>

                <div className="pt-3 border-t border-brand-warm-tan/15 flex items-center justify-between text-[10px]">
                  <span className="text-[#A67E6B] font-medium flex items-center gap-1 font-mono uppercase tracking-wider">
                    Lookbook Entry
                  </span>
                  
                  <div className="flex items-center gap-4">
                    {/* Share action */}
                    <button
                      onClick={() => handleShare(currentPhoto)}
                      className="flex items-center gap-1.5 font-semibold text-brand-dark/50 hover:text-brand-rose transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied' : 'Share'}</span>
                    </button>

                    {/* Like button */}
                    <button
                      onClick={(e) => handleLike(currentPhoto.id, e)}
                      className={`flex items-center gap-1.5 font-semibold transition-colors focus:outline-none cursor-pointer ${
                        hasLiked[currentPhoto.id] ? 'text-brand-rose' : 'text-brand-dark/50 hover:text-brand-rose'
                      }`}
                    >
                      <span>{hasLiked[currentPhoto.id] ? 'Liked' : 'Like'}</span>
                      <span className="text-[9px] font-mono">({getLikes(currentPhoto.id)})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Indicator Dots */}
              {filteredPhotos.length > 1 && (
                <div className="flex gap-1.5 mt-5 flex-wrap justify-center max-w-full">
                  {filteredPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSlideDirection(idx > currentSlideIndex ? 'right' : 'left');
                        setCurrentSlideIndex(idx);
                        setCopied(false);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentSlideIndex === idx 
                          ? 'bg-brand-rose w-4' 
                          : 'bg-brand-warm-tan/30 hover:bg-brand-warm-tan/65'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

            </div>
          ) : (
            <div className="py-20 text-center bg-[#FAF6F0] border border-brand-warm-tan/25 rounded-2xl max-w-md w-full">
              <Camera className="w-8 h-8 text-[#B11B41] mx-auto mb-3 opacity-60" />
              <p className="font-serif text-base text-brand-dark">No lookbook portraits found.</p>
              <p className="font-sans text-xs text-brand-dark/50 mt-1">Try selecting a different gallery category.</p>
            </div>
          )}
        </div>
      )}

      {/* 🖼 2. Grid Portfolio View */}
      {viewMode === 'grid' && (
        <>
          <motion.div 
            layout={prefersReducedMotion ? false : "position"}
            className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8"
          >
            <AnimatePresence mode="popLayout">
              {paginatedPhotos.map((item) => {
                const itemLikes = getLikes(item.id);
                const userLiked = hasLiked[item.id];

                return (
                  <motion.div
                    layout={prefersReducedMotion ? false : "position"}
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => {
                      setSlideDirection(null);
                      setSelectedPhoto(item);
                    }}
                    whileHover={{ y: prefersReducedMotion ? 0 : -4 }}
                    className="break-inside-avoid mb-8 relative overflow-hidden border border-[#DCCAAB]/25 bg-[#FAF6F0] hover:border-brand-rose/60 hover:shadow-md transition-shadow duration-300 cursor-pointer group rounded-2xl"
                  >
                    {/* Photo Stage */}
                    <div className="relative overflow-hidden w-full">
                      <motion.img
                        src={item.image}
                        alt={item.caption}
                        referrerPolicy="no-referrer"
                        whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                        transition={{ duration: 0.5 }}
                        className="w-full object-cover"
                      />
                      {/* Premium overlay visible on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <p className="text-white text-xs font-serif italic truncate w-full">{item.caption}</p>
                      </div>
                    </div>

                    {/* Tag overlay */}
                    <span className="absolute top-4 left-4 bg-brand-dark/90 text-[#FAF6F0] text-[8px] uppercase tracking-widest font-bold px-2.5 py-1 font-mono rounded">
                      {item.category}
                    </span>

                    {/* Text caption details and likes count at bottom */}
                    <div className="p-5 border-t border-brand-warm-tan/10 bg-[#FAF6F0]">
                      <p className="font-sans text-xs text-brand-dark/80 leading-relaxed italic">
                        &ldquo;{item.caption}&rdquo;
                      </p>

                      <div className="mt-4 pt-3 border-t border-brand-warm-tan/15 flex items-center justify-between text-[10px]">
                        <span className="text-[#A67E6B] font-medium flex items-center gap-1 font-mono uppercase tracking-wider">
                          Lookbook Log
                        </span>
                        
                        {/* Likes count */}
                        <button
                          onClick={(e) => handleLike(item.id, e)}
                          className={`flex items-center gap-1.5 font-semibold transition-colors focus:outline-none cursor-pointer ${
                            userLiked ? 'text-brand-rose' : 'text-brand-dark/50 hover:text-brand-rose'
                          }`}
                        >
                          <span>{userLiked ? 'Liked' : 'Like'}</span>
                          <span className="text-[9px] font-mono">({itemLikes})</span>
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Load More Button for Scalability */}
          {filteredPhotos.length > visibleCount && (
            <div className="flex justify-center mt-12 mb-20">
              <motion.button
                onClick={() => setVisibleCount(prev => prev + 3)}
                whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
                whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                className="px-8 py-3 bg-brand-dark hover:bg-brand-rose text-[#FAF6F0] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer rounded-xl shadow-sm"
              >
                Load More Photos
              </motion.button>
            </div>
          )}

          {/* Empty elements warning */}
          {filteredPhotos.length === 0 && (
            <div className="py-20 text-center bg-brand-beige/10 border border-brand-warm-tan/25 rounded-2xl">
              <Camera className="w-8 h-8 text-[#B11B41] mx-auto mb-3 opacity-60" />
              <p className="font-serif text-base text-brand-dark">No progress portraits found.</p>
              <p className="font-sans text-xs text-brand-dark/50 mt-1">Try selecting a different lifestyle milestone.</p>
            </div>
          )}
        </>
      )}

      {/* ======================================= */}
      {/* 🌟 IMAGE DETAIL ZOOM MODAL DIALOG       */}
      {/* ======================================= */}
      <AnimatePresence>
        {selectedPhoto && (() => {
          const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
          const totalCount = filteredPhotos.length;

          const handleNext = () => {
            if (currentIndex !== -1 && totalCount > 1) {
              setSlideDirection('right');
              setSelectedPhoto(filteredPhotos[(currentIndex + 1) % totalCount]);
              setCopied(false);
            }
          };

          const handlePrev = () => {
            if (currentIndex !== -1 && totalCount > 1) {
              setSlideDirection('left');
              setSelectedPhoto(filteredPhotos[(currentIndex - 1 + totalCount) % totalCount]);
              setCopied(false);
            }
          };

          return (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
              
              {/* Lightbox Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-brand-dark/95 backdrop-blur-sm"
                onClick={() => setSelectedPhoto(null)}
              />

              {/* Navigational Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.35 }}
                className="relative bg-[#FAF6F0] w-full max-w-xl overflow-hidden shadow-2xl rounded-2xl z-10"
              >
                
                {/* Top Banner Bar with Close and Photo Index Status Indicator */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-brand-warm-tan/15 bg-brand-cream/40 select-none">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#B11B41] font-bold">
                    {currentIndex !== -1 ? `Portrait Log ${currentIndex + 1} of ${totalCount}` : 'Logged Milestone'}
                  </span>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-1.5 hover:text-brand-rose text-brand-dark transition-colors focus:outline-none cursor-pointer"
                    aria-label="Close zoom"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Exp Image Stage with overlays and sliding direction */}
                <div className="relative w-full bg-stone-900 flex items-center justify-center overflow-hidden min-h-[350px]">
                  
                  <AnimatePresence initial={false} mode="wait">
                    <motion.img
                      key={selectedPhoto.id}
                      src={selectedPhoto.image}
                      alt={selectedPhoto.caption}
                      referrerPolicy="no-referrer"
                      initial={{ 
                        opacity: 0, 
                        x: prefersReducedMotion || !slideDirection ? 0 : slideDirection === 'right' ? 40 : -40 
                      }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ 
                        opacity: 0, 
                        x: prefersReducedMotion || !slideDirection ? 0 : slideDirection === 'right' ? -40 : 40 
                      }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="w-full h-auto max-h-[55vh] object-contain mx-auto select-none"
                    />
                  </AnimatePresence>

                  {/* Left Drawer Arrow Button */}
                  {totalCount > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-brand-rose hover:text-white text-brand-dark shadow transition-all focus:outline-none opacity-80 hover:opacity-100 flex items-center justify-center cursor-pointer z-10"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-brand-rose hover:text-white text-brand-dark shadow transition-all focus:outline-none opacity-80 hover:opacity-100 flex items-center justify-center cursor-pointer z-10"
                      title="Next Photo (Right Arrow)"
                    >
                      <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  )}
                </div>

                {/* Captions and Share options */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <span className="bg-brand-rose text-white text-[9px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded">
                        {selectedPhoto.category}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-[10px] text-[#A67E6B] font-mono">ID: {selectedPhoto.id}</span>
                    </div>
                    
                    <span className="hidden sm:inline font-mono text-[8px] uppercase tracking-widest text-[#6C5347]/45">
                      🖮 Use Left / Right Keys
                    </span>
                  </div>

                  <p className="font-serif text-base italic text-brand-dark leading-relaxed text-left">
                    &ldquo;{selectedPhoto.caption}&rdquo;
                  </p>

                  {/* Action buttons */}
                  <div className="pt-4 border-t border-brand-warm-tan/20 flex justify-between items-center text-xs text-brand-dark/60 font-semibold gap-3 select-none">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-brand-dark/40 font-bold text-left">
                      Retained Coily Length Progress
                    </span>
                    
                    <motion.button
                      onClick={() => handleShare(selectedPhoto)}
                      whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
                      whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                      className="flex items-center gap-2 border border-brand-warm-tan/30 bg-white px-3.5 py-2 hover:bg-brand-rose hover:text-white hover:border-brand-rose transition-colors focus:outline-none text-[10px] uppercase tracking-widest font-bold cursor-pointer rounded-xl"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share Photo</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
