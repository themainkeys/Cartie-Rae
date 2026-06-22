import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Clock, BookOpen, X, Heart, Tag, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AboutAndBlog: React.FC = () => {
  const { homepageContent, blogs, likeBlogPost, prefersReducedMotion } = useApp();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Filter: only show published posts (no status = published by default)
  const publishedBlogs = blogs.filter(b => b.status !== 'draft');
  const selectedPost = publishedBlogs.find(b => b.id === selectedPostId) ?? null;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
      {/* Page Title */}
      <div className="text-center mb-16 space-y-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold block">
          About
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark font-normal">
          About Cartiae Rae
        </h1>
        <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Simple steps, healthy hair habits, and real results.
        </p>
      </div>

      <div className="space-y-16">
        {/* Main profile split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Image side */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] overflow-hidden border border-brand-warm-tan/20 bg-brand-beige">
              <img
                src={homepageContent.aboutImageUrl || '/about-portrait.jpg'}
                alt="Cartiae Portrait"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
            {/* Simple highlighted sticker */}
            <div className="absolute -bottom-4 -right-4 bg-brand-dark text-white p-4 shadow-md max-w-[180px] hidden sm:block">
              <Sparkles className="w-4 h-4 text-brand-rose mb-1" />
              <p className="font-serif text-xs font-normal text-white">Natural &amp; Simple</p>
              <p className="text-[10px] text-brand-beige/80 mt-0.5 leading-normal">
                Regimens made easy for real daily life.
              </p>
            </div>
          </div>

          {/* Content text side */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-serif text-2xl sm:text-3xl text-brand-dark leading-tight">
              {homepageContent.aboutHeadline || "Healthy hair is a journey, not a quick fix."}
            </h2>
            <div className="h-[1px] w-16 bg-brand-rose" />
            
            <p className="font-sans text-xs sm:text-sm text-brand-dark/80 leading-relaxed whitespace-pre-wrap">
              {homepageContent.aboutStory}
            </p>

            {/* Simple Quote panel */}
            {homepageContent.promoQuote && (
              <div className="p-6 bg-brand-beige/30 border-l-2 border-brand-rose">
                <p className="font-serif italic text-xs sm:text-sm text-zinc-500">
                  &ldquo;{homepageContent.promoQuote}&rdquo;
                </p>
                <p className="font-sans text-[10px] uppercase font-bold text-brand-rose mt-2">
                  — {homepageContent.promoAuthor}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Three pillars values panel */}
        <div className="pt-12 border-t border-brand-warm-tan/20">
          <h3 className="font-serif text-xl text-brand-dark text-center mb-10">Our Principles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <span className="text-brand-rose text-2xl font-serif">01.</span>
              <h4 className="font-serif text-sm text-brand-dark">No Shortcuts</h4>
              <p className="text-brand-dark/70 text-xs font-sans leading-relaxed">
                Consistency, water-moisture, and gentle handling are the only things that truly help natural hair grow.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-brand-rose text-2xl font-serif">02.</span>
              <h4 className="font-serif text-sm text-brand-dark">Deep Moisture</h4>
              <p className="text-brand-dark/70 text-xs font-sans leading-relaxed">
                We teach you how to hydrate your strands with water, and block that moisture in using natural lipid oils.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-brand-rose text-2xl font-serif">03.</span>
              <h4 className="font-serif text-sm text-brand-dark">Gentle Care</h4>
              <p className="text-brand-dark/70 text-xs font-sans leading-relaxed">
                We design our detangling routines and products to prevent shedding and keep your hair strands safe from breaking.
              </p>
            </div>
          </div>
        </div>

        {/* ── Blog Articles Section ── */}
        {publishedBlogs.length > 0 && (
          <div className="pt-12 border-t border-brand-warm-tan/20">
            {/* Blog section header */}
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-brand-rose font-bold">
                  Journal
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-normal">
                  Hair Care Reads
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{publishedBlogs.length} Article{publishedBlogs.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Blog grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedBlogs.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.35, delay: prefersReducedMotion ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSelectedPostId(post.id)}
                  className="group cursor-pointer bg-white border border-brand-warm-tan/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  {/* Cover image */}
                  <div className="aspect-[16/9] overflow-hidden bg-brand-beige relative">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-pink-light">
                        <BookOpen className="w-8 h-8 text-brand-rose/40" />
                      </div>
                    )}
                    {/* Category badge */}
                    {post.category && (
                      <span className="absolute top-3 left-3 font-sans text-[9px] uppercase tracking-widest font-bold bg-brand-dark/75 text-white px-2.5 py-1 rounded-full">
                        {post.category}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col flex-1 space-y-2.5">
                    <h4 className="font-serif text-sm sm:text-base text-brand-dark leading-snug group-hover:text-brand-rose transition-colors line-clamp-2">
                      {post.title}
                    </h4>

                    {post.excerpt && (
                      <p className="font-sans text-[11px] text-zinc-500 leading-relaxed line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Footer meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-brand-warm-tan/15">
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-sans">
                        {post.readTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{post.readTime}
                          </span>
                        )}
                        {post.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Heart className="w-3 h-3" />{post.likes ?? 0}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}

        {/* Empty blog state — shown only to logged-in admin in preview */}
        {publishedBlogs.length === 0 && (
          <div className="pt-12 border-t border-brand-warm-tan/20 text-center py-10 space-y-3">
            <BookOpen className="w-8 h-8 text-brand-rose/30 mx-auto" />
            <p className="font-serif text-sm text-zinc-400">No articles published yet.</p>
          </div>
        )}
      </div>

      {/* ── Blog Post Modal ── */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4"
            onClick={() => setSelectedPostId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 12, scale: 0.97 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Hero image */}
              {selectedPost.image && (
                <div className="aspect-[16/7] overflow-hidden bg-brand-beige">
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 sm:p-8 space-y-4">
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-400 font-sans">
                  {selectedPost.category && (
                    <span className="flex items-center gap-1 bg-brand-pink-light text-brand-rose font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <Tag className="w-2.5 h-2.5" />{selectedPost.category}
                    </span>
                  )}
                  {selectedPost.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{selectedPost.readTime}
                    </span>
                  )}
                  {selectedPost.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedPost.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-xl sm:text-2xl text-brand-dark leading-tight">
                  {selectedPost.title}
                </h2>

                {selectedPost.excerpt && (
                  <p className="font-sans text-sm text-zinc-500 leading-relaxed border-l-2 border-brand-rose pl-4 italic">
                    {selectedPost.excerpt}
                  </p>
                )}

                {selectedPost.content && (
                  <div className="font-sans text-sm text-brand-dark/80 leading-relaxed whitespace-pre-wrap pt-2 border-t border-brand-warm-tan/20">
                    {selectedPost.content}
                  </div>
                )}

                {/* Like + Close */}
                <div className="flex items-center justify-between pt-4 border-t border-brand-warm-tan/15">
                  <button
                    onClick={() => likeBlogPost(selectedPost.id)}
                    className="flex items-center gap-2 text-[11px] font-bold text-brand-rose hover:text-brand-berry transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{selectedPost.likes ?? 0} Likes</span>
                  </button>
                  <button
                    onClick={() => setSelectedPostId(null)}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-zinc-400 hover:text-brand-rose transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
