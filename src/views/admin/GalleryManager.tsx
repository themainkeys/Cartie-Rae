import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PhotoGalleryItem } from '../../types';
import { ImageDropzone } from './shared/AdminDropzones';
import { Plus } from 'lucide-react';

interface GalleryManagerProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ onDirtyChange }) => {
  const { gallery, addGalleryItem, updateGalleryItem, deleteGalleryItem, triggerToast } = useApp();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galCaption, setGalCaption] = useState('');
  const [galCategory, setGalCategory] = useState<'Progress' | 'Hairstyles' | 'Routines'>('Progress');
  const [galImage, setGalImage] = useState('');

  const handleAddGallerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galCaption || !galImage) return;
    
    if (editingGalleryId) {
      updateGalleryItem(editingGalleryId, {
        image: galImage,
        caption: galCaption,
        category: galCategory
      });
      setEditingGalleryId(null);
      triggerToast('Lookbook photo updated successfully.');
    } else {
      addGalleryItem({
        image: galImage,
        caption: galCaption,
        category: galCategory
      });
      triggerToast('Lookbook photo uploaded successfully.');
    }
    setGalCaption('');
    setGalImage('');
    setIsAddingGallery(false);
  };

  const handleEditGalleryClick = (item: PhotoGalleryItem) => {
    setEditingGalleryId(item.id);
    setGalCaption(item.caption);
    setGalCategory(item.category);
    setGalImage(item.image);
    setIsAddingGallery(true);
  };

  useEffect(() => {
    onDirtyChange?.(isAddingGallery || !!editingGalleryId);
  }, [isAddingGallery, editingGalleryId, onDirtyChange]);

  return (
    <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
      <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
        <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-rose rounded-full"></span>
          Photo Gallery Lookbook
        </h3>
        <button
          onClick={() => {
            if (isAddingGallery) {
              setIsAddingGallery(false);
              setEditingGalleryId(null);
              setGalCaption('');
              setGalImage('');
            } else {
              setIsAddingGallery(true);
            }
          }}
          className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Photo</span>
        </button>
      </div>

      {isAddingGallery && (
        <form onSubmit={handleAddGallerySubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
          <p className="font-serif font-bold text-brand-chocolate text-[13px] border-b border-brand-warm-tan/20 pb-1.5">
            {editingGalleryId ? 'Edit Lookbook Photo' : 'Upload Lookbook Photo'}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Image Upload *</label>
              <ImageDropzone
                imageValue={galImage}
                onImageChange={setGalImage}
                label="Photo Gallery Image"
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Photo Caption *</label>
              <input
                type="text"
                required
                value={galCaption}
                onChange={(e) => setGalCaption(e.target.value)}
                placeholder="e.g. 6 Months Low Porosity Growth"
                className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category</label>
              <select
                value={galCategory}
                onChange={(e) => setGalCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded-lg focus:outline-none font-semibold text-brand-chocolate"
              >
                <option>Progress</option>
                <option>Hairstyles</option>
                <option>Routines</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 text-[10.5px]">
            <button
              type="button"
              onClick={() => {
                setIsAddingGallery(false);
                setEditingGalleryId(null);
                setGalCaption('');
                setGalImage('');
              }}
              className="px-3 py-1.5 border border-brand-warm-tan hover:bg-brand-cream rounded cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase cursor-pointer transition"
            >
              {editingGalleryId ? 'Save Changes' : 'Add Photo'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
              <th className="p-3">Photo</th>
              <th className="p-3">Caption</th>
              <th className="p-3">Section</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
            {gallery.map((gObj) => (
              <tr key={gObj.id} className="hover:bg-brand-cream/30">
                <td className="p-3">
                  <img src={gObj.image} referrerPolicy="no-referrer" alt="" className="w-10 h-10 object-cover rounded border border-brand-warm-tan/20" />
                </td>
                <td className="p-3 font-semibold line-clamp-1 max-w-[200px]">{gObj.caption}</td>
                <td className="p-3 font-mono">{gObj.category}</td>
                <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                  <button
                    onClick={() => handleEditGalleryClick(gObj)}
                    className="p-1 px-2.5 bg-brand-cream hover:bg-brand-rose text-brand-dark hover:text-white rounded border border-brand-warm-tan/20 text-[11px] font-bold transition duration-200 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove photo "${gObj.caption}"?`)) {
                        deleteGalleryItem(gObj.id);
                        triggerToast(`🗑 "${gObj.caption}" removed from the Lookbook.`, 'success');
                      }
                    }}
                    className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded text-[11px] font-bold transition duration-200 cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
