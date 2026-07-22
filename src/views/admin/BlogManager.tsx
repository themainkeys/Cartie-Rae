/**
 * admin/BlogManager.tsx
 *
 * Manages the "Blog Articles Management" section under Store Editor > CMS.
 * Extracted from AdminPortal.tsx (lines 2961–3230).
 *
 * All local form state and handlers live here.
 * Uses useApp() for blog CRUD context actions.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { AdminRole } from '../../types';
import { Plus, Book, Save, Edit, Trash2 } from 'lucide-react';

const BLOG_CATEGORIES = [
  'Growth Tips',
  'Wash Day',
  'Styling',
  'Product Reviews',
  'Tutorials',
  'Protective Styles',
  'Hair Science',
] as const;

interface BlogManagerProps {
  requirePermission: (allowedRoles: AdminRole[]) => boolean;
}

export const BlogManager: React.FC<BlogManagerProps> = ({ requirePermission }) => {
  const {
    blogs,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    triggerToast,
  } = useApp();

  // Form state
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogReadTime, setBlogReadTime] = useState('5 min read');
  const [blogImage, setBlogImage] = useState('');
  const [blogCategory, setBlogCategory] = useState<string>('Growth Tips');
  const [blogStatus, setBlogStatus] = useState<'published' | 'draft'>('published');

  return (
    <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)] animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
        <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
          Blog Articles Management
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#A67E6B] bg-brand-cream border border-[#E5D5C8]/60 px-3 py-1 rounded-full font-bold">
            {blogs.length} Post{blogs.length !== 1 ? 's' : ''}
          </span>
          <button
            id="admin-add-blog-btn"
            onClick={() => {
              if (!requirePermission(['super_admin', 'content_manager'])) return;
              setBlogTitle('');
              setBlogExcerpt('');
              setBlogContent('');
              setBlogReadTime('5 min read');
              setBlogImage('');
              setBlogCategory('Growth Tips');
              setEditingBlogId(null);
              setIsAddingBlog(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-rose hover:bg-brand-berry text-white text-[10.5px] font-bold uppercase tracking-wider rounded-xl transition-all duration-150 focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            New Post
          </button>
        </div>
      </div>

      {/* Add New Blog Form */}
      <AnimatePresence>
        {isAddingBlog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-[#FAF6F0] border border-brand-warm-tan/30 rounded-2xl p-5 space-y-4">
              <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-brand-rose flex items-center gap-1.5">
                <Book className="w-3.5 h-3.5" /> New Blog Post
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Title *</label>
                  <input type="text" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} placeholder="Post title..." className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category</label>
                  <select value={blogCategory} onChange={(e) => setBlogCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark">
                    {BLOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Read Time</label>
                  <input type="text" value={blogReadTime} onChange={(e) => setBlogReadTime(e.target.value)} placeholder="e.g. 5 min read" className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Cover Image URL</label>
                  <input type="text" value={blogImage} onChange={(e) => setBlogImage(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Excerpt / Subtitle</label>
                  <input type="text" value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} placeholder="Short description shown in previews..." className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Full Article Body *</label>
                  <textarea rows={6} value={blogContent} onChange={(e) => setBlogContent(e.target.value)} placeholder="Write the full blog post content here..." className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark leading-relaxed" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="block text-[10px] uppercase font-bold text-brand-chocolate">Status</label>
                  <button
                    type="button"
                    onClick={() => setBlogStatus((s) => (s === 'published' ? 'draft' : 'published'))}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                      blogStatus === 'published'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${blogStatus === 'published' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                    {blogStatus === 'published' ? 'Published' : 'Draft'}
                  </button>
                  <span className="text-[9px] text-zinc-400">Drafts are hidden from visitors</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsAddingBlog(false)} className="px-4 py-2 text-[10.5px] font-bold text-brand-chocolate bg-brand-cream border border-[#E5D5C8] rounded-xl hover:bg-brand-beige transition-all">Cancel</button>
                <button
                  onClick={() => {
                    if (!blogTitle.trim() || !blogContent.trim()) { triggerToast('Title and content are required.', 'error'); return; }
                    addBlogPost({
                      title: blogTitle.trim(),
                      excerpt: blogExcerpt.trim(),
                      content: blogContent.trim(),
                      readTime: blogReadTime,
                      image: blogImage || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
                      category: blogCategory,
                      status: blogStatus,
                    });
                    triggerToast(`✓ "${blogTitle}" ${blogStatus === 'draft' ? 'saved as draft' : 'published to blog'}!`, 'success');
                    setIsAddingBlog(false);
                    setBlogStatus('published');
                  }}
                  className="px-5 py-2 text-[10.5px] font-extrabold bg-brand-rose hover:bg-brand-berry text-white rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 focus:outline-none"
                >
                  <Save className="w-3.5 h-3.5" /> Publish Post
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blog Table */}
      {blogs.length === 0 ? (
        <p className="text-[11px] text-[#A67E6B] text-center py-8">No blog posts yet. Click &quot;New Post&quot; to create one.</p>
      ) : (
        <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                <th className="p-3">Cover</th>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
              {blogs.map((post) => (
                <React.Fragment key={post.id}>
                  {/* Normal row */}
                  <tr className={`hover:bg-brand-cream/30 transition-colors ${editingBlogId === post.id ? 'bg-brand-cream/40' : ''}`}>
                    <td className="p-3">
                      <img src={post.image} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-cover rounded border border-brand-warm-tan/20" />
                    </td>
                    <td className="p-3 font-semibold max-w-[200px]">
                      <p className="line-clamp-2 leading-snug">{post.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-[#A67E6B] font-normal">{post.readTime}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${post.status === 'draft' ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-50 text-emerald-700'}`}>{post.status || 'published'}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono">{post.category}</td>
                    <td className="p-3 text-[#A67E6B]">{post.date}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`edit-blog-${post.id}`}
                          onClick={() => {
                            if (editingBlogId === post.id) { setEditingBlogId(null); return; }
                            setBlogTitle(post.title);
                            setBlogExcerpt(post.excerpt);
                            setBlogContent(post.content);
                            setBlogReadTime(post.readTime);
                            setBlogImage(post.image);
                            setBlogCategory(post.category);
                            setBlogStatus(post.status || 'published');
                            setIsAddingBlog(false);
                            setEditingBlogId(post.id);
                          }}
                          className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition duration-150 focus:outline-none flex items-center gap-1 ${editingBlogId === post.id ? 'bg-brand-dark text-white' : 'bg-[#EEF7F1] text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}
                        >
                          <Edit className="w-3 h-3" />
                          {editingBlogId === post.id ? 'Close' : 'Edit'}
                        </button>
                        <button
                          id={`delete-blog-${post.id}`}
                          onClick={() => {
                            if (confirm(`Remove blog post "${post.title}"?`)) {
                              if (requirePermission(['super_admin', 'content_manager'])) {
                                if (editingBlogId === post.id) setEditingBlogId(null);
                                deleteBlogPost(post.id);
                                triggerToast(`🗑 "${post.title}" removed from blog.`, 'success');
                              }
                            }
                          }}
                          className="px-2.5 py-1 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white text-[10.5px] rounded-md font-bold transition duration-150 focus:outline-none flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline edit form */}
                  {editingBlogId === post.id && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-[#FAF6F0] border-t border-brand-warm-tan/20 p-5 space-y-4"
                        >
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-rose flex items-center gap-1.5">
                            <Edit className="w-3 h-3" /> Editing: {post.title}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Title *</label>
                              <input type="text" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category</label>
                              <select value={blogCategory} onChange={(e) => setBlogCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark">
                                {BLOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Read Time</label>
                              <input type="text" value={blogReadTime} onChange={(e) => setBlogReadTime(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Cover Image URL</label>
                              <div className="flex gap-2 items-center">
                                <input type="text" value={blogImage} onChange={(e) => setBlogImage(e.target.value)} className="flex-1 px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                                {blogImage && <img src={blogImage} alt="" className="w-10 h-10 object-cover rounded border border-brand-warm-tan/20 shrink-0" />}
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Excerpt</label>
                              <input type="text" value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Full Article Body *</label>
                              <textarea rows={8} value={blogContent} onChange={(e) => setBlogContent(e.target.value)} className="w-full px-3 py-2 bg-white border border-brand-warm-tan/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-rose/20 text-brand-dark leading-relaxed" />
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-3">
                              <label className="block text-[10px] uppercase font-bold text-brand-chocolate">Status</label>
                              <button
                                type="button"
                                onClick={() => setBlogStatus((s) => (s === 'published' ? 'draft' : 'published'))}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                  blogStatus === 'published'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${blogStatus === 'published' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                {blogStatus === 'published' ? 'Published' : 'Draft'}
                              </button>
                              <span className="text-[9px] text-zinc-400">Drafts are hidden from visitors</span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditingBlogId(null)} className="px-4 py-2 text-[10.5px] font-bold text-brand-chocolate bg-brand-cream border border-[#E5D5C8] rounded-xl hover:bg-brand-beige transition-all">Cancel</button>
                            <button
                              onClick={() => {
                                if (!blogTitle.trim() || !blogContent.trim()) { triggerToast('Title and content are required.', 'error'); return; }
                                updateBlogPost(post.id, {
                                  title: blogTitle.trim(),
                                  excerpt: blogExcerpt.trim(),
                                  content: blogContent.trim(),
                                  readTime: blogReadTime,
                                  image: blogImage || post.image,
                                  category: blogCategory,
                                  status: blogStatus,
                                });
                                triggerToast(`✓ "${blogTitle}" ${blogStatus === 'draft' ? 'saved as draft' : 'updated and live'}!`, 'success');
                                setEditingBlogId(null);
                              }}
                              className="px-5 py-2 text-[10.5px] font-extrabold bg-brand-rose hover:bg-brand-berry text-white rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 focus:outline-none"
                            >
                              <Save className="w-3.5 h-3.5" /> Save Changes
                            </button>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
