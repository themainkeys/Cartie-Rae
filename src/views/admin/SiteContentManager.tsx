import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Service } from '../../types';
import { Eye, Image, Camera, Save, Plus, Trash2 } from 'lucide-react';
import { ImageDropzone } from './shared/AdminDropzones';

const prefersReducedMotion = typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type ServiceEditFields = {
  name: string; price: string; description: string;
  included: string; benefits: string; notice: string;
  disclaimer: string; imageUrl: string;
};

interface SiteContentManagerProps {
  onDirtyChange: (isDirty: boolean) => void;
}

export const SiteContentManager: React.FC<SiteContentManagerProps> = ({ onDirtyChange }) => {
  const { homepageContent, updateHomepageContent, services, updateService, deleteService, addService, triggerToast } = useApp();

  // CMS text state
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

  // Dirty detection
  const hasCmsDirty = useMemo(() => {
    return (
      cmsHeroHead !== homepageContent.heroHeadline ||
      cmsHeroSub !== homepageContent.heroSubheadline ||
      cmsHeroImage !== (homepageContent.heroImageUrl || '/hero-portrait.jpg') ||
      cmsAboutHead !== homepageContent.aboutHeadline ||
      cmsAboutStory !== homepageContent.aboutStory ||
      cmsAboutImage !== (homepageContent.aboutImageUrl || '/about-portrait.jpg') ||
      cmsPromoQuote !== homepageContent.promoQuote ||
      cmsPromoAuthor !== homepageContent.promoAuthor
    );
  }, [cmsHeroHead, cmsHeroSub, cmsHeroImage, cmsAboutHead, cmsAboutStory, cmsAboutImage, cmsPromoQuote, cmsPromoAuthor, homepageContent]);

  // Notify parent of dirty state
  useEffect(() => {
    onDirtyChange(hasCmsDirty);
  }, [hasCmsDirty, onDirtyChange]);

  // Auto-save debounce
  const cmsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveCms = useCallback((patch: Partial<typeof homepageContent>) => {
    if (cmsDebounceRef.current) clearTimeout(cmsDebounceRef.current);
    cmsDebounceRef.current = setTimeout(() => {
      updateHomepageContent(patch);
    }, 800);
  }, [updateHomepageContent]);

  useEffect(() => {
    return () => { if (cmsDebounceRef.current) clearTimeout(cmsDebounceRef.current); };
  }, []);

  // Service edits state
  const buildServiceEdit = (svc: Service): ServiceEditFields => ({
    name: svc.name,
    price: String(svc.price),
    description: svc.description,
    included: svc.included.join('\n'),
    benefits: svc.benefits.join('\n'),
    notice: svc.notice.join('\n'),
    disclaimer: svc.disclaimer,
    imageUrl: svc.image,
  });

  const [serviceEdits, setServiceEdits] = useState<Record<string, ServiceEditFields>>(() => {
    const map: Record<string, ServiceEditFields> = {};
    services.forEach(svc => { map[svc.id] = buildServiceEdit(svc); });
    return map;
  });

  useEffect(() => {
    setServiceEdits(prev => {
      const next = { ...prev };
      services.forEach(svc => {
        if (!next[svc.id]) next[svc.id] = buildServiceEdit(svc);
      });
      Object.keys(next).forEach(id => {
        if (!services.find(s => s.id === id)) delete next[id];
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  const patchServiceEdit = (id: string, patch: Partial<ServiceEditFields>) =>
    setServiceEdits(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleCmsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <>
      {/* BLOCK 1: Front-Page CMS */}
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

                  {/* Hero Image — URL OR direct upload */}
                  <div className="pt-1 space-y-3">
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5 text-brand-rose" />
                      Homepage Hero Photo
                    </label>

                    {/* Live preview */}
                    {cmsHeroImage && (
                      <div className="relative aspect-[16/7] overflow-hidden rounded-2xl border border-brand-warm-tan/20 bg-brand-beige">
                        <img
                          src={cmsHeroImage}
                          alt="Hero preview"
                          className="w-full h-full object-cover object-top"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                        />
                        <div className="absolute bottom-2 right-2 bg-brand-dark/70 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">
                          Live Preview
                        </div>
                      </div>
                    )}

                    {/* Upload */}
                    <ImageDropzone
                      imageValue={cmsHeroImage}
                      onImageChange={(img) => {
                        setCmsHeroImage(img);
                        updateHomepageContent({ heroImageUrl: img });
                        triggerToast('✓ Homepage hero photo updated!', 'success');
                      }}
                      label="Click or drag to upload hero photo"
                      prefersReducedMotion={prefersReducedMotion}
                    />

                    {/* Or paste URL */}
                    <div>
                      <label className="block text-[10px] text-[#A67E6B] mb-1">Or paste an image URL:</label>
                      <input
                        type="text"
                        value={cmsHeroImage}
                        placeholder="/hero-portrait.jpg or https://..."
                        onChange={(e) => { setCmsHeroImage(e.target.value); autoSaveCms({ heroImageUrl: e.target.value }); }}
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark transition-all duration-150 text-xs"
                      />
                    </div>
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

                  {/* About Portrait — URL OR direct upload */}
                  <div className="pt-1 space-y-3">
                    <label className="block text-[10.5px] uppercase font-bold text-brand-chocolate flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5 text-brand-rose" />
                      About Page Portrait
                    </label>

                    {/* Live preview */}
                    {cmsAboutImage && (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-brand-warm-tan/20 bg-brand-beige max-w-xs">
                        <img
                          src={cmsAboutImage}
                          alt="About preview"
                          className="w-full h-full object-cover object-top"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                        />
                        <div className="absolute bottom-2 right-2 bg-brand-dark/70 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">
                          Live Preview
                        </div>
                      </div>
                    )}

                    {/* Upload */}
                    <ImageDropzone
                      imageValue={cmsAboutImage}
                      onImageChange={(img) => {
                        setCmsAboutImage(img);
                        updateHomepageContent({ aboutImageUrl: img });
                        triggerToast('✓ About page portrait updated!', 'success');
                      }}
                      label="Click or drag to upload portrait"
                      prefersReducedMotion={prefersReducedMotion}
                    />

                    {/* Or paste URL */}
                    <div>
                      <label className="block text-[10px] text-[#A67E6B] mb-1">Or paste an image URL:</label>
                      <input
                        type="text"
                        value={cmsAboutImage}
                        placeholder="/about-portrait.jpg or https://..."
                        onChange={(e) => { setCmsAboutImage(e.target.value); autoSaveCms({ aboutImageUrl: e.target.value }); }}
                        className="w-full px-3 py-2 bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-brand-dark transition-all duration-150 text-xs"
                      />
                    </div>
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

      {/* BLOCK 2: Services CMS */}
            <div className="space-y-8">

              {/* ┌── Cover Images ── */}
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
                  {services.map((svc) => {
                    const edits = serviceEdits[svc.id];
                    if (!edits) return null;
                    const previewUrl = edits.imageUrl || svc.image;
                    return (
                      <div key={svc.id} className="bg-[#FAF6F0] border border-brand-warm-tan/20 rounded-2xl p-4 space-y-4">
                        {/* Live cover preview */}
                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-brand-warm-tan/20 bg-brand-beige">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={svc.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-beige to-brand-warm-tan/40">
                              <span className="font-serif text-[10px] text-[#8C6D62] uppercase tracking-wider">{svc.name}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent flex items-end p-3">
                            <p className="text-white text-[10px] font-bold font-serif leading-tight line-clamp-2">{edits.name || svc.name}</p>
                          </div>
                        </div>

                        {/* Controlled URL input (Fix 4) */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5 flex items-center gap-1.5">
                            <Image className="w-3 h-3 text-brand-rose" /> Cover Image URL
                          </label>
                          <input
                            type="text"
                            value={edits.imageUrl}
                            placeholder="https://... or /filename.jpg"
                            onChange={(e) => patchServiceEdit(svc.id, { imageUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark"
                          />
                        </div>

                        {/* File upload */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5 flex items-center gap-1.5">
                            <Camera className="w-3 h-3 text-brand-rose" /> Or Upload Photo
                          </label>
                          <ImageDropzone
                            imageValue={edits.imageUrl}
                            onImageChange={(img) => {
                              patchServiceEdit(svc.id, { imageUrl: img });
                              updateService(svc.id, { image: img });
                              triggerToast(`✓ "${svc.name}" cover updated!`, 'success');
                            }}
                            label="Drop photo or click to upload"
                            prefersReducedMotion={prefersReducedMotion}
                          />
                        </div>

                        {/* Save URL + Delete row */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // save service edit
                              const url = edits.imageUrl.trim();
                              if (!url) { triggerToast('Please enter an image URL.', 'error'); return; }
                              updateService(svc.id, { image: url });
                              triggerToast(`✓ "${svc.name}" cover updated and live!`, 'success');
                            }}
                            className="flex-1 py-2 text-[10.5px] font-extrabold bg-brand-rose hover:bg-brand-berry text-white rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                          >
                            <Save className="w-3.5 h-3.5" /> Save Cover
                          </button>
                          <button
                            onClick={() => {
                              // delete service
                              if (!window.confirm(`Delete "${svc.name}"? This cannot be undone.`)) return;
                              deleteService(svc.id);
                              triggerToast(`"${svc.name}" deleted.`, 'success');
                            }}
                            className="px-3 py-2 text-[10.5px] font-extrabold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 focus:outline-none"
                            title="Delete service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ┌── Text Editor ── */}
              <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-8 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)] animate-fade-in">
                <div className="flex items-center justify-between gap-3 border-b border-[#E5D5C8]/30 pb-3">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark">Services Text Editor</h3>
                    <p className="font-sans text-[10px] text-zinc-400 mt-0.5">Edit name, price, description, bullet points, and disclaimer. Changes go live on Save.</p>
                  </div>
                  <button
                    id="admin-add-service-btn"
                    onClick={() => {
                      // add service
                      addService({
                        name: 'New Service',
                        description: 'Describe your service here.',
                        price: 100,
                        image: '/hero-portrait.jpg',
                        included: ['60-minute video call', 'Follow-up notes'],
                        benefits: ['Personalised advice', 'Actionable plan'],
                        notice: ['Virtual only — no in-person sessions'],
                        disclaimer: 'This is a virtual consultation. Results may vary.',
                      });
                      triggerToast('✓ New service created — edit it below!', 'success');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-rose hover:bg-brand-berry text-white text-[10.5px] font-bold uppercase tracking-wider rounded-xl transition-all duration-150 focus:outline-none shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Service
                  </button>
                </div>

                {services.map((svc, svcIdx) => {
                  const edits = serviceEdits[svc.id];
                  if (!edits) return null;
                  return (
                    <div key={svc.id} className="border border-brand-warm-tan/20 rounded-2xl overflow-hidden">
                      {/* Header bar */}
                      <div className="bg-brand-dark px-5 py-3 flex items-center justify-between">
                        <span className="font-serif text-sm text-white font-normal">{edits.name || svc.name}</span>
                        <span className="text-[9px] font-bold text-brand-rose uppercase tracking-widest">Service {svcIdx + 1}</span>
                      </div>

                      <div className="p-5 space-y-5 bg-[#FAF6F0]">

                        {/* Name + Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5">Service Name</label>
                            <input
                              type="text"
                              value={edits.name}
                              onChange={(e) => patchServiceEdit(svc.id, { name: e.target.value })}
                              placeholder="e.g. Hair Assessment Guidance Call"
                              className="w-full px-3 py-2.5 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5">Price ($)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={edits.price}
                              onChange={(e) => patchServiceEdit(svc.id, { price: e.target.value })}
                              placeholder="100.00"
                              className="w-full px-3 py-2.5 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark font-medium"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5">Description</label>
                          <textarea
                            rows={3}
                            value={edits.description}
                            onChange={(e) => patchServiceEdit(svc.id, { description: e.target.value })}
                            placeholder="Describe what this service includes and who it's for..."
                            className="w-full px-3 py-2.5 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark leading-relaxed resize-none"
                          />
                        </div>

                        {/* What's Included */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                            What's Included <span className="font-normal normal-case">(one per line)</span>
                          </label>
                          <textarea
                            rows={4}
                            value={edits.included}
                            onChange={(e) => patchServiceEdit(svc.id, { included: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark leading-relaxed font-mono"
                          />
                          <p className="text-[9px] text-zinc-400 mt-1">Each line becomes a bullet point on the services page.</p>
                        </div>

                        {/* Benefits */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand-rose inline-block"></span>
                            Benefits / Bonuses <span className="font-normal normal-case">(one per line)</span>
                          </label>
                          <textarea
                            rows={3}
                            value={edits.benefits}
                            onChange={(e) => patchServiceEdit(svc.id, { benefits: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark leading-relaxed font-mono"
                          />
                        </div>

                        {/* Notice */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                            Notice / Important Info <span className="font-normal normal-case">(one per line)</span>
                          </label>
                          <textarea
                            rows={3}
                            value={edits.notice}
                            onChange={(e) => patchServiceEdit(svc.id, { notice: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark leading-relaxed font-mono"
                          />
                        </div>

                        {/* Disclaimer */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1.5">Disclaimer</label>
                          <input
                            type="text"
                            value={edits.disclaimer}
                            onChange={(e) => patchServiceEdit(svc.id, { disclaimer: e.target.value })}
                            placeholder="This is a virtual consultation. Not a physical product..."
                            className="w-full px-3 py-2.5 bg-white border border-brand-warm-tan/30 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark"
                          />
                        </div>

                        {/* Save */}
                        <button
                          onClick={() => {
                            // delete service
                            const parseLines = (raw: string) => raw.split('\n').map(l => l.trim()).filter(Boolean);
                            const name = edits.name.trim();
                            if (!name) { triggerToast('Service name cannot be empty.', 'error'); return; }
                            const included = parseLines(edits.included);
                            const benefits = parseLines(edits.benefits);
                            const notice   = parseLines(edits.notice);
                            updateService(svc.id, {
                              name,
                              price:       parseFloat(edits.price) || svc.price,
                              description: edits.description.trim() || svc.description,
                              included:    included.length ? included : svc.included,
                              benefits:    benefits.length ? benefits : svc.benefits,
                              notice:      notice.length   ? notice   : svc.notice,
                              disclaimer:  edits.disclaimer.trim() || svc.disclaimer,
                            });
                            triggerToast(`✓ "${name}" updated and live!`, 'success');
                          }}
                          className="w-full py-2.5 text-[10.5px] font-extrabold bg-brand-rose hover:bg-brand-berry text-white rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                        >
                          <Save className="w-3.5 h-3.5" /> Save All Text Changes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
    </>
  );
};
