import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TikTokVideo } from '../types';
import { Play, Eye, Flame, Award, BookOpen, Clock, Heart, Download, HelpCircle, ChevronRight, Check } from 'lucide-react';

export const VideoGallery: React.FC = () => {
  const { videos } = useApp();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Wash Day' | 'Styling' | 'Growth Tips' | 'Protective Styles' | 'Cornrows'>('All');
  const [activePlaybackUrl, setActivePlaybackUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');
  
  const [isCurriculumDownloaded, setIsCurriculumDownloaded] = useState(false);
  const [masterclassEmail, setMasterclassEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [teaserSuccess, setTeaserSuccess] = useState(false);

  const categories: ('All' | 'Wash Day' | 'Styling' | 'Growth Tips' | 'Protective Styles' | 'Cornrows')[] = [
    'All', 'Wash Day', 'Styling', 'Growth Tips', 'Protective Styles', 'Cornrows'
  ];

  const filteredVideos = useMemo(() => {
    return videos.filter(v => activeCategory === 'All' || v.category === activeCategory);
  }, [videos, activeCategory]);

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

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      
      {/* Banner Intro */}
      <div className="text-center mb-16 space-y-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold block">
          Education &amp; Tutorials
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark font-normal">
          The Video Masterclasses
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#6C5347]/80 max-w-xl mx-auto leading-relaxed">
          Step-by-step practical walk-throughs detailing density retention, protective parting, and breakage-free moisture regimens.
        </p>
      </div>

      {/* Tabs list for category management */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-12 border-b border-brand-warm-tan/20 pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`video-cat-${cat.toLowerCase().replace(' ', '-')}`}
            onClick={() => setActiveCategory(cat)}
            className={`text-[11px] uppercase tracking-[0.18em] font-medium py-1 transition-colors focus:outline-none ${
              activeCategory === cat
                ? 'text-brand-rose border-b border-brand-rose'
                : 'text-brand-dark/60 hover:text-[#543F35]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Responsive Video Card Layout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            onClick={() => {
              setActivePlaybackUrl(video.videoUrl);
              setActiveVideoTitle(video.title);
            }}
            className="group bg-[#FAF6F0] overflow-hidden border border-brand-warm-tan/25 transition-all duration-300 cursor-pointer flex flex-col"
          >
            {/* Thumbnail Stage with Hover Zoom */}
            <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80 transition-transform duration-700"
              />
              
              {/* Floating play state circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="p-3 bg-brand-rose text-white group-hover:bg-brand-berry rounded-none shadow-sm transition-colors duration-300">
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </span>
              </div>

              {/* Video category tag */}
              <span className="absolute top-4 left-4 bg-brand-dark/90 text-[#EDE3DE] text-[8px] uppercase tracking-widest px-2 py-0.5 font-bold font-mono">
                {video.category}
              </span>

              {/* Views metric */}
              <span className="absolute bottom-4 right-4 bg-brand-dark/70 text-white text-[9px] font-mono px-2 py-0.5">
                {video.views} Views
              </span>
            </div>

            {/* Content info box */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3 select-none">
              <h3 className="font-serif text-base text-brand-dark leading-snug group-hover:text-brand-rose transition-colors line-clamp-2">
                {video.title}
              </h3>
              
              <div className="pt-3 border-t border-brand-warm-tan/20 flex items-center justify-between text-[9px] text-[#A67E6B] font-semibold uppercase tracking-widest font-mono">
                <span>Core Regulation Series</span>
                <span className="text-brand-rose">
                  Interactive Guidance
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================= */}
      {/* 🌟 VIDEO PLAYBACK MODAL DIALOG SHEET   */}
      {/* ======================================= */}
      {activePlaybackUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-dark text-[#FAF6F0] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Playback header */}
            <div className="p-4 bg-brand-dark border-b border-white/10 flex items-center justify-between">
              <h3 className="text-[#FAF6F0] font-serif text-sm truncate pr-4">{activeVideoTitle}</h3>
              <button
                onClick={() => {
                  setActivePlaybackUrl(null);
                  setActiveVideoTitle('');
                }}
                className="px-3 py-1.5 text-xs text-brand-rose hover:text-white transition-colors uppercase tracking-wider font-semibold font-sans"
              >
                Close Video
              </button>
            </div>

            {/* Embed layout frame */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                title={activeVideoTitle}
                src={`${activePlaybackUrl}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Footer educational notification */}
            <div className="p-6 bg-[#FAF6F0] text-brand-dark text-xs flex gap-4 items-center">
              <div className="w-10 h-10 overflow-hidden bg-brand-beige shrink-0 border border-brand-warm-tan/30">
                <img
                  src="https://images.unsplash.com/photo-1608139556157-196be06511fc?auto=format&fit=crop&q=80&w=200"
                  alt="Cartiae head"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <p className="font-sans text-[10px] uppercase tracking-widest text-[#B11B41] font-bold">Coaching Note from Cartiae Rae:</p>
                <p className="text-[11px] text-[#6D5448] leading-relaxed max-w-xl">
                  Always detangle wet hair starting from the ends and moving upward. Do not skip pre-pooing; it is critical for holding cellular structure intact.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 🎓 ELITE COACHING MASTERCLASS MODULE     */}
      {/* ======================================= */}
      <div className="bg-[#FAF6F0] border border-brand-warm-tan/30 p-8 sm:p-12 lg:p-16 text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
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
        <div className="lg:col-span-5 bg-white border border-brand-warm-tan/25 p-8 space-y-4">
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
              className="w-full py-2.5 text-[10px] uppercase tracking-widest font-semibold bg-brand-dark hover:bg-brand-rose text-white transition-colors duration-300"
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
