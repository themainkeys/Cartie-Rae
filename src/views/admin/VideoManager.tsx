import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { TikTokVideo } from '../../types';
import { resolveVideoSource, uploadToStorage } from './shared/adminUtils';
import { VideoDropzone, ImageDropzone } from './shared/AdminDropzones';
import { Sparkles, Plus, X } from 'lucide-react';

interface VideoManagerProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

export const VideoManager: React.FC<VideoManagerProps> = ({ onDirtyChange }) => {
  const { videos, addVideo, updateVideo, deleteVideo, products, ebooks, triggerToast } = useApp();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const [vidTiktokUrl, setVidTiktokUrl] = useState('');
  const [vidYoutubeUrl, setVidYoutubeUrl] = useState('');
  const [vidInputMode, setVidInputMode] = useState<'upload' | 'url'>('upload');

  // Bulk import state
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkCategory, setBulkCategory] = useState<'Wash Day' | 'Styling' | 'Protective Styles' | 'Growth Tips' | 'Product Reviews' | 'Tutorials'>('Styling');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  useEffect(() => {
    if (!vidUrl) return;
    const resolved = resolveVideoSource(vidUrl);
    if (resolved.type === 'youtube' && resolved.id) {
      const ytThumb = `https://img.youtube.com/vi/${resolved.id}/maxresdefault.jpg`;
      if (!vidThumb || vidThumb === 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800') {
        setVidThumb(ytThumb);
      }
    } else if (resolved.type === 'tiktok' && resolved.id) {
      const tiktokPlaceholder = '/about-portrait.jpg';
      if (!vidThumb || vidThumb === 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800') {
        setVidThumb(tiktokPlaceholder);
      }
    }
  }, [vidUrl]);

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
    setVidTiktokUrl('');
    setVidYoutubeUrl('');
    setUploadedVideoFile(null);
    setUploadedThumbFile(null);
    setVidInputMode('upload');
    setIsAddingVideo(false);
    setEditingVideoId(null);
  };

  const handleBulkImport = async () => {
    if (!bulkUrls.trim()) return;
    setIsBulkProcessing(true);
    setBulkResult(null);

    const lines = bulkUrls.split('\n').map(l => l.trim()).filter(Boolean);
    let added = 0;
    let skipped = 0;

    for (const rawUrl of lines) {
      const resolved = resolveVideoSource(rawUrl);
      let videoUrl = '';
      let youtubeUrl = '';
      let tiktokUrl = '';
      let thumbUrl = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800';
      let title = 'New Video';

      if (resolved.type === 'youtube' && resolved.id) {
        youtubeUrl = rawUrl;
        thumbUrl = `https://img.youtube.com/vi/${resolved.id}/maxresdefault.jpg`;
        title = `YouTube Video ${resolved.id.slice(0, 6)}`;
      } else if (resolved.type === 'tiktok') {
        tiktokUrl = rawUrl;
        thumbUrl = '/about-portrait.jpg';
        title = `TikTok Video`;
      } else if (resolved.type === 'direct') {
        videoUrl = rawUrl;
        title = rawUrl.split('/').pop()?.split('?')[0]?.replace(/[-_]/g, ' ') || 'Video';
      } else {
        skipped++;
        continue;
      }

      addVideo({
        title,
        views: '0 views',
        category: bulkCategory,
        videoUrl,
        youtubeUrl: youtubeUrl || undefined,
        tiktokUrl: tiktokUrl || undefined,
        thumbnailUrl: thumbUrl,
        description: '',
        relatedIds: [],
        isFeatured: false,
        status: 'published',
        viewsCount: 0,
        likesCount: 0,
        savesCount: 0,
        sharesCount: 0,
        commentsCount: 0,
        shopClicks: 0,
        productAddClicks: 0,
        ebookAddClicks: 0,
        conversionCount: 0,
      });
      added++;
    }

    setBulkResult(
      skipped > 0
        ? `✅ ${added} video${added !== 1 ? 's' : ''} added. ${skipped} URL${skipped !== 1 ? 's' : ''} skipped (unrecognised format).`
        : `✅ ${added} video${added !== 1 ? 's' : ''} added successfully!`
    );
    setBulkUrls('');
    setIsBulkProcessing(false);
    if (added > 0) triggerToast(`✓ ${added} videos imported!`, 'success');
  };

  const handleAddVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle) {
      triggerToast('Please enter a video title.', 'error');
      return;
    }
    if (!vidUrl && !vidYoutubeUrl.trim() && !vidTiktokUrl.trim()) {
      triggerToast('Please upload a video file, paste a YouTube link, or add a TikTok URL.', 'error');
      return;
    }
    if (vidUrl && (vidUrl.includes('vm.tiktok.com') || vidUrl.includes('vt.tiktok.com'))) {
      triggerToast('Mobile TikTok links (vm.tiktok.com) are shortened and blocked from embedding by TikTok. Please paste a desktop video link or enter the 19-digit Video ID directly.', 'error');
      return;
    }

    let finalVideoUrl = vidUrl;
    let finalThumbUrl = vidThumb;

    if (uploadedVideoFile) {
      const uploaded = await uploadToStorage(uploadedVideoFile, 'videos');
      if (uploaded) {
        finalVideoUrl = uploaded;
      } else {
        if (finalVideoUrl.startsWith('blob:')) {
          finalVideoUrl = '';
          triggerToast('⚠️ File upload failed — video saved without a playable file. Use a YouTube or TikTok URL instead.', 'error');
        }
      }
    } else if (finalVideoUrl.startsWith('blob:')) {
      finalVideoUrl = '';
    }

    if (uploadedThumbFile) {
      const uploaded = await uploadToStorage(uploadedThumbFile, 'thumbnails');
      if (uploaded) {
        finalThumbUrl = uploaded;
      } else if (finalThumbUrl.startsWith('blob:')) {
        finalThumbUrl = '';
      }
    } else if (finalThumbUrl.startsWith('blob:') || finalThumbUrl.startsWith('data:')) {
      finalThumbUrl = finalThumbUrl.startsWith('blob:') ? '' : finalThumbUrl;
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
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbUrl,
      description: vidDescription,
      relatedIds: vidRelatedIds,
      isFeatured: vidIsFeatured,
      status: vidStatus,
      tiktokUrl: vidTiktokUrl.trim() || undefined,
      youtubeUrl: vidYoutubeUrl.trim() || undefined,
      scheduledAt: vidStatus === 'scheduled' ? vidScheduledAt : undefined,
      featuredOrder: fOrder,
    };

    if (editingVideoId) {
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
      payload.viewsCount = 0;
      payload.likesCount = 0;
      payload.savesCount = 0;
      payload.sharesCount = 0;
      payload.commentsCount = 0;
      payload.shopClicks = 0;
      payload.productAddClicks = 0;
      payload.ebookAddClicks = 0;
      payload.conversionCount = 0;

      addVideo(payload as Omit<TikTokVideo, 'id'>);
      triggerToast('Video Masterclass published! 🎬', 'success');
    }

    resetVideoForm();
  };

  const moveFeaturedVideo = (id: string, direction: 'up' | 'down') => {

    const featured = videos
      .filter(v => v.isFeatured)
      .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));

    const index = featured.findIndex(v => v.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const current = featured[index];
      const target = featured[index - 1];

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

  useEffect(() => {
    onDirtyChange?.(isAddingVideo || !!editingVideoId);
  }, [isAddingVideo, editingVideoId, onDirtyChange]);

  return (
    <>
      <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
        <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
            TikTok & Video Feeds
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isAddingVideo) {
                  resetVideoForm();
                } else {
                  setIsAddingVideo(true);
                  setIsBulkImporting(false);
                }
              }}
              className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Video</span>
            </button>
            <button
              onClick={() => {
                setIsBulkImporting(!isBulkImporting);
                if (isAddingVideo) resetVideoForm();
              }}
              className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-brand-rose bg-brand-pink-light hover:bg-brand-rose hover:text-white px-3.5 py-1.5 rounded-full transition-all focus:outline-none border border-brand-rose/30"
              title="Add multiple videos at once by pasting URLs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bulk Import</span>
            </button>
          </div>
        </div>

        {isBulkImporting && (
          <div className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-serif font-bold text-brand-chocolate text-[13px]">
                Bulk Import Videos
              </p>
              <button type="button" onClick={() => setIsBulkImporting(false)} className="text-brand-dark/40 hover:text-brand-rose focus:outline-none">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-brand-dark/50 leading-relaxed">
              Paste one YouTube or TikTok URL per line. Each will become a separate video entry with auto-detected thumbnail.
            </p>
            <textarea
              value={bulkUrls}
              onChange={e => setBulkUrls(e.target.value)}
              placeholder={"https://youtube.com/watch?v=abc123\nhttps://youtu.be/def456\nhttps://tiktok.com/@user/video/789"}
              rows={6}
              className="w-full px-3 py-2.5 bg-white border border-brand-warm-tan/30 rounded-lg focus:outline-none font-mono text-[11px] placeholder:text-brand-dark/25 resize-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value as typeof bulkCategory)}
                className="flex-1 px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-lg focus:outline-none text-[11px]"
              >
                <option value="Styling">Styling</option>
                <option value="Wash Day">Wash Day</option>
                <option value="Growth Tips">Growth Tips</option>
                <option value="Protective Styles">Protective Styles</option>
                <option value="Product Reviews">Product Reviews</option>
                <option value="Tutorials">Tutorials</option>
              </select>
              <button
                type="button"
                disabled={isBulkProcessing || !bulkUrls.trim()}
                onClick={handleBulkImport}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-rose hover:bg-brand-berry disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all focus:outline-none"
              >
                {isBulkProcessing ? (
                  <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing…</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" /> Import All</>
                )}
              </button>
            </div>
            {bulkResult && (
              <p className={`text-[10px] font-semibold ${bulkResult.startsWith('✅') ? 'text-emerald-700' : 'text-red-600'}`}>
                {bulkResult}
              </p>
            )}
          </div>
        )}

        {isAddingVideo && (
          <form onSubmit={handleAddVideoSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
            <p className="font-serif font-bold text-brand-chocolate text-[13px] border-b border-brand-warm-tan/20 pb-1.5">
              {editingVideoId ? `Edit Video Masterclass` : 'Add New Video Masterclass'}
            </p>
            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="block text-[10px] uppercase font-bold text-brand-chocolate">Primary Video *</label>

                 <div className="flex rounded-lg border border-brand-warm-tan/35 overflow-hidden text-[10px] font-bold uppercase tracking-wider">
                   <button
                     type="button"
                     onClick={() => setVidInputMode('upload')}
                     className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 transition-all ${
                       vidInputMode === 'upload'
                         ? 'bg-brand-chocolate text-white'
                         : 'bg-brand-cream text-brand-chocolate/70 hover:bg-brand-beige/50'
                     }`}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                     Upload File
                   </button>
                   <button
                     type="button"
                     onClick={() => setVidInputMode('url')}
                     className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 transition-all ${
                       vidInputMode === 'url'
                         ? 'bg-brand-chocolate text-white'
                         : 'bg-brand-cream text-brand-chocolate/70 hover:bg-brand-beige/50'
                     }`}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                     Paste URL
                   </button>
                 </div>

                 {vidInputMode === 'upload' && (
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
                     label="Upload Video File"
                     prefersReducedMotion={prefersReducedMotion}
                   />
                 )}

                 {vidInputMode === 'url' && (
                   <>
                     <input
                       id="vid-url-input"
                       type="url"
                       value={vidUrl}
                       onChange={(e) => {
                         setVidUrl(e.target.value);
                         setUploadedVideoFile(null);
                       }}
                       placeholder="Paste MP4/WebM URL or YouTube URL (TikTok → use Social Links below)"
                       className="w-full px-3 py-2.5 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none font-mono text-[11px] placeholder:text-brand-dark/30"
                     />
                     {vidUrl.trim() && (() => {
                       const res = resolveVideoSource(vidUrl);
                       if (res.type === 'youtube') return <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">🔴 YouTube{vidUrl.includes('/shorts/') ? ' Shorts' : ''} detected</span>;
                       if (res.type === 'direct') return <span className="inline-flex items-center gap-1 bg-zinc-700 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">■ MP4 / Direct video detected ✓ will autoplay</span>;
                       return null;
                     })()}
                     <p className="text-[9px] text-brand-dark/40 leading-relaxed">
                       For best autoplay: paste a YouTube URL or a direct MP4 link. Add TikTok link in Social Links below.
                     </p>
                   </>
                 )}
               </div>

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

               <div className="border border-brand-warm-tan/30 rounded-xl p-3 space-y-3 bg-brand-cream/40">
                 <p className="text-[9px] uppercase font-extrabold text-brand-chocolate tracking-wider">Social Links <span className="font-normal text-brand-dark/40 normal-case">(optional)</span></p>
                 <div className="space-y-2">
                   <label className="block text-[10px] uppercase font-bold text-brand-chocolate">
                     TikTok Link
                   </label>
                   <input
                     id="vid-tiktok-url"
                     type="url"
                     value={vidTiktokUrl}
                     onChange={(e) => setVidTiktokUrl(e.target.value)}
                     placeholder="https://www.tiktok.com/@cartiaerae/video/..."
                     className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-lg focus:outline-none font-mono text-[11px] placeholder:text-brand-dark/25"
                   />
                   <p className="text-[9px] text-brand-dark/35">
                     Shown as a &ldquo;Watch on TikTok&rdquo; button in the feed. Does not affect autoplay.
                   </p>
                 </div>
                 <div className="space-y-2">
                   <label className="block text-[10px] uppercase font-bold text-brand-chocolate">
                     YouTube Link <span className="text-brand-dark/40 font-normal normal-case">(fallback if no video file)</span>
                   </label>
                   <input
                     id="vid-youtube-url"
                     type="url"
                     value={vidYoutubeUrl}
                     onChange={(e) => setVidYoutubeUrl(e.target.value)}
                     placeholder="https://www.youtube.com/watch?v=... or /embed/..."
                     className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-lg focus:outline-none font-mono text-[11px] placeholder:text-brand-dark/25"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Thumbnail <span className="text-brand-dark/40 font-normal normal-case">(auto-generated for YouTube · upload or paste URL)</span></label>
                 <ImageDropzone
                   imageValue={vidThumb}
                   onImageChange={(dataUrl) => { setVidThumb(dataUrl); setUploadedThumbFile(null); }}
                   label="Upload Thumbnail Image"
                   prefersReducedMotion={prefersReducedMotion}
                 />
                 <p className="text-[9px] text-brand-dark/35 uppercase tracking-wider my-1.5 text-center">— or paste URL —</p>
                 <input
                   type="url"
                   value={vidThumb.startsWith('data:') ? '' : vidThumb}
                   onChange={(e) => { setVidThumb(e.target.value); setUploadedThumbFile(null); }}
                   placeholder="https://images.unsplash.com/..."
                   className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none font-mono text-[11px]"
                 />
                 {vidThumb && !uploadedThumbFile && (
                   <img src={vidThumb} alt="thumb preview" referrerPolicy="no-referrer" className="mt-2 h-16 w-10 object-cover rounded border border-brand-warm-tan/20" />
                 )}
               </div>

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

              <details className="border border-brand-warm-tan/30 rounded-lg">
                <summary className="px-3 py-2 text-[10px] uppercase font-bold text-brand-chocolate cursor-pointer select-none hover:bg-brand-beige/30 rounded-lg">
                  ▸ Advanced Options (related products, views)
                </summary>
                <div className="px-3 pb-4 pt-3 space-y-4">
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
                  <div className="text-[9px] text-brand-dark/40 leading-relaxed bg-brand-cream/60 border border-brand-warm-tan/20 rounded-lg px-3 py-2">
                    💡 To upload a video file, use the <strong className="text-brand-chocolate">Upload File</strong> tab in the Primary Video section above.
                  </div>
                </div>
              </details>

              {vidUrl && (
                <div className="border border-brand-warm-tan/25 p-4 rounded-3xl bg-[#FAF6F0] space-y-3.5 flex flex-col items-center select-none w-full max-w-[270px] mx-auto">
                  <span className="text-[10px] uppercase font-bold text-[#8C6D62] tracking-[0.15em] text-center block">Live Mobile Preview</span>
                  
                  <div className="w-[200px] h-[356px] rounded-[36px] border-[6px] border-[#2C221E] bg-black relative shadow-xl overflow-hidden flex flex-col group transition-transform duration-300 hover:scale-[1.02]">
                    
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-[#2C221E] rounded-full z-40 flex items-center justify-between px-2">
                      <span className="w-1 h-1 bg-[#1a1a1a] rounded-full" />
                      <span className="w-1.5 h-1.5 bg-[#0d0d0d] rounded-full" />
                    </div>

                    <div className="absolute top-1 left-0 right-0 px-4 flex justify-between items-center text-[7px] text-white/90 font-sans font-bold z-30 select-none pointer-events-none">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-1.5 h-1.5 fill-white" viewBox="0 0 24 24"><path d="M12 21l-12-18h24z"/></svg>
                        <div className="w-2.5 h-1.5 border border-white/80 rounded-[2px] p-[0.5px] flex items-center"><div className="w-1.5 h-full bg-white rounded-[1px]"></div></div>
                      </div>
                    </div>

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

                    <div className="absolute inset-0 bg-transparent z-10" />

                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-white/70 rounded-full z-30" />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 z-20 pointer-events-none flex flex-col justify-end p-2.5 text-white">
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-brand-rose/90 text-white text-[5.5px] font-extrabold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full shadow-xs">
                        Live Preview
                      </div>

                      <div className="absolute right-2 bottom-10 flex flex-col gap-2.5 items-center">
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
                          setVidTiktokUrl(vid.tiktokUrl || '');
                          setVidYoutubeUrl(vid.youtubeUrl || '');
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
                            deleteVideo(vid.id);
                            triggerToast(`🗑 "${vid.title}" removed from the video feed.`, 'success');
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
                        {idx + 1}
                      </span>
                      <img src={vid.thumbnailUrl} alt="" className="w-8 h-10 object-cover rounded border border-brand-warm-tan/30" />
                      <span className="font-bold text-brand-dark truncate pr-2 text-[10px]">{vid.title}</span>
                    </div>
                    <div className="flex flex-col gap-1 pr-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveFeaturedVideo(vid.id, 'up')}
                        disabled={idx === 0}
                        className="text-[#8C6D62] hover:text-brand-rose disabled:opacity-30 p-0.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFeaturedVideo(vid.id, 'down')}
                        disabled={idx === arr.length - 1}
                        className="text-[#8C6D62] hover:text-brand-rose disabled:opacity-30 p-0.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

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
    </>
  );
};
