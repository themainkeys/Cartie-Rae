/**
 * admin/InventoryManager.tsx
 *
 * Manages the Catalog > Inventory sub-tab, which contains:
 * 1. Physical Products Catalog — create, edit, delete products
 * 2. Digital eBooks Catalog — create, edit, delete eBooks
 *
 * Extracted from AdminPortal.tsx (lines 1814–2361).
 *
 * All local form and inline-edit state lives here.
 * Uses useApp() for catalog CRUD context actions.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, EBook } from '../../types';
import { Plus, Camera } from 'lucide-react';
import { ImageDropzone } from './shared/AdminDropzones';
import { compressImage } from './shared/adminUtils';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface InventoryManagerProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onDirtyChange }) => {
  const {
    products, ebooks,
    addProduct, updateProduct, deleteProduct,
    addEBook, updateEBook, deleteEBook,
    triggerToast,
  } = useApp();

  // ── Product add form state ────────────────────────────────────────────────
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('19.99');
  const [prodCategory, setProdCategory] = useState('Hair Oils');
  const [prodDesc, setProdDesc] = useState('');
  const [prodStock, setProdStock] = useState('50');
  const [prodImage, setProdImage] = useState(
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800'
  );

  // ── Product inline edit state ─────────────────────────────────────────────
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('Hair Oils');
  const [editProdStock, setEditProdStock] = useState('0');
  const [editProdPrice, setEditProdPrice] = useState('0.00');
  const [editProdImage, setEditProdImage] = useState('');

  // ── eBook add form state ──────────────────────────────────────────────────
  const [isAddingEBook, setIsAddingEBook] = useState(false);
  const [ebName, setEbName] = useState('');
  const [ebPrice, setEbPrice] = useState('14.99');
  const [ebPages, setEbPages] = useState('100');
  const [ebDesc, setEbDesc] = useState('');
  const [ebSize, setEbSize] = useState('10 MB');
  const [ebImage, setEbImage] = useState(
    'https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800'
  );

  // ── eBook inline edit state ───────────────────────────────────────────────
  const [editingEBookId, setEditingEBookId] = useState<string | null>(null);
  const [editEbName, setEditEbName] = useState('');
  const [editEbPages, setEditEbPages] = useState('120');
  const [editEbPrice, setEditEbPrice] = useState('0.00');
  const [editEbSize, setEditEbSize] = useState('10 MB');
  const [editEbImage, setEditEbImage] = useState('');

  React.useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isAddingProduct || isAddingEBook || !!editingProductId || !!editingEBookId);
    }
  }, [isAddingProduct, isAddingEBook, editingProductId, editingEBookId, onDirtyChange]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      id: `prod-${Date.now()}`,
      name: prodName,
      price: parseFloat(prodPrice) || 0,
      description: prodDesc,
      category: prodCategory,
      image: prodImage,
      stockStatus: (parseInt(prodStock) || 0) > 15 ? 'In Stock' : 'Low Stock',
      stockCount: parseInt(prodStock) || 0,
    });
    setProdName('');
    setProdPrice('19.99');
    setProdDesc('');
    setProdStock('50');
    setIsAddingProduct(false);
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setEditProdName(p.name);
    setEditProdCategory(p.category);
    setEditProdStock(p.stockCount.toString());
    setEditProdPrice(p.price.toString());
    setEditProdImage(p.image);
  };

  const handleSaveProduct = (id: string) => {
    const orig = products.find((p) => p.id === id);
    if (!orig) return;
    updateProduct(id, {
      name: editProdName,
      category: editProdCategory,
      price: parseFloat(editProdPrice) || 0,
      stockCount: parseInt(editProdStock) || 0,
      stockStatus: (parseInt(editProdStock) || 0) > 15 ? 'In Stock' : 'Low Stock',
      image: editProdImage || orig.image,
    });
    setEditingProductId(null);
  };

  const handleAddEBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEBook({
      id: `ebook-${Date.now()}`,
      name: ebName,
      price: parseFloat(ebPrice) || 0,
      description: ebDesc,
      image: ebImage,
      pages: parseInt(ebPages) || 120,
      fileSize: ebSize,
      benefits: [
        'Detailed step-by-step master hair guides',
        'Porosity hydration logs and charts',
        'Maximum hair follicle safety guidelines',
      ],
      pdfUrl: `${ebName.toLowerCase().replace(/\s+/g, '_')}_guide.pdf`,
    });
    setEbName('');
    setEbPrice('14.99');
    setEbPages('100');
    setEbDesc('');
    setIsAddingEBook(false);
  };

  const handleStartEditEBook = (e: EBook) => {
    setEditingEBookId(e.id);
    setEditEbName(e.name);
    setEditEbPages(e.pages.toString());
    setEditEbPrice(e.price.toString());
    setEditEbSize(e.fileSize);
    setEditEbImage(e.image);
  };

  const handleSaveEBook = (id: string) => {
    const orig = ebooks.find((e) => e.id === id);
    if (!orig) return;
    updateEBook(id, {
      name: editEbName,
      pages: parseInt(editEbPages) || 120,
      price: parseFloat(editEbPrice) || 0,
      fileSize: editEbSize,
      image: editEbImage || orig.image,
    });
    setEditingEBookId(null);
  };

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PHYSICAL PRODUCTS CATALOG                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
        <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
            Physical Products Catalog
          </h3>
          <button
            id="add-prod-catalog-btn"
            onClick={() => setIsAddingProduct(!isAddingProduct)}
            className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Product</span>
          </button>
        </div>

        {/* Add new product form */}
        {isAddingProduct && (
          <form onSubmit={handleAddProductSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
            <p className="font-serif font-bold text-brand-chocolate">New Product Parameters:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Product Title</label>
                <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="e.g. Aloe Moisture Spray" className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Retail Price ($)</label>
                <input type="number" step="0.01" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category collection</label>
                <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150">
                  <option>Hair Oils</option>
                  <option>Accessories</option>
                  <option>Treatments</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Brief Description</label>
                <input type="text" required value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Potent hydration mist to prevent day-time split ends..." className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Initial Stock Count</label>
                <input type="number" required value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Product Visual Graphic</label>
              <ImageDropzone imageValue={prodImage} onImageChange={setProdImage} label="Product Image" prefersReducedMotion={prefersReducedMotion} />
            </div>
            <div className="flex justify-end gap-2 text-[10.5px]">
              <button type="button" onClick={() => setIsAddingProduct(false)} className="px-4 py-2 border border-brand-warm-tan hover:bg-brand-cream rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase transition">Commit Item</button>
            </div>
          </form>
        )}

        {/* Products list table */}
        <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                <th className="p-3">Reference Photo</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Stock Count</th>
                <th className="p-3">Retail Price</th>
                <th className="p-3 text-center">Catalog actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
              {products.map((p) => {
                const isEditing = p.id === editingProductId;
                return (
                  <tr key={p.id} className="hover:bg-brand-cream/30">
                    <td className="p-3">
                      {isEditing ? (
                        <div className="relative group cursor-pointer w-10 h-10">
                          <img src={editProdImage || p.image} referrerPolicy="no-referrer" alt={p.name} className="w-10 h-10 object-cover rounded border border-brand-rose/40" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                            <Camera className="w-3.5 h-3.5 text-white" />
                          </div>
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try { const compressed = await compressImage(file); setEditProdImage(compressed); }
                                catch { const reader = new FileReader(); reader.onloadend = () => setEditProdImage(reader.result as string); reader.readAsDataURL(file); }
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <img src={p.image} referrerPolicy="no-referrer" alt={p.name} className="w-10 h-10 object-cover rounded border border-brand-warm-tan/30" />
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing
                        ? <input type="text" value={editProdName} onChange={(e) => setEditProdName(e.target.value)} className="w-full px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs font-semibold" />
                        : <span className="font-semibold">{p.name}</span>}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <select value={editProdCategory} onChange={(e) => setEditProdCategory(e.target.value)} className="w-full px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs">
                          <option>Hair Oils</option><option>Accessories</option><option>Treatments</option>
                        </select>
                      ) : <span>{p.category}</span>}
                    </td>
                    <td className="p-3 font-mono">
                      {isEditing
                        ? <input type="number" value={editProdStock} onChange={(e) => setEditProdStock(e.target.value)} className="w-20 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs" />
                        : (
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${p.stockCount === 0 ? 'bg-red-50 text-red-700' : p.stockCount <= 15 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-800'}`}>
                            {p.stockCount} ({p.stockStatus})
                          </span>
                        )}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {isEditing ? (
                        <div className="flex items-center gap-0.5">
                          <span>$</span>
                          <input type="number" step="0.01" value={editProdPrice} onChange={(e) => setEditProdPrice(e.target.value)} className="w-20 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs font-bold" />
                        </div>
                      ) : <span>${p.price.toFixed(2)}</span>}
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleSaveProduct(p.id)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer">Save</button>
                          <button onClick={() => setEditingProductId(null)} className="px-2.5 py-1 bg-brand-cream border border-[#E5D5C8] text-brand-chocolate rounded text-[11px] font-bold cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleStartEditProduct(p)} className="p-1 px-2.5 bg-brand-cream hover:bg-brand-beige text-brand-chocolate rounded-md font-bold transition duration-250 border border-brand-warm-tan/30 cursor-pointer">Edit</button>
                          <button
                            id={`delete-prod-list-${p.id}`}
                            onClick={() => {
                              if (confirm(`Delete physical "${p.name}" from catalog?`)) {
                                deleteProduct(p.id);
                                triggerToast(`🗑 "${p.name}" removed from the product catalog.`, 'success');
                              }
                            }}
                            className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250 cursor-pointer"
                          >Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* DIGITAL EBOOKS CATALOG                                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
        <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
            Digital eBooks Catalog
          </h3>
          <button
            id="add-ebook-catalog-btn"
            onClick={() => setIsAddingEBook(!isAddingEBook)}
            className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create eBook Guide</span>
          </button>
        </div>

        {/* Add new ebook form */}
        {isAddingEBook && (
          <form onSubmit={handleAddEBookSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
            <p className="font-serif font-bold text-brand-chocolate">New eBook Parameters:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">eBook Title</label>
                <input type="text" required value={ebName} onChange={(e) => setEbName(e.target.value)} placeholder="e.g. Scalp Massage Masterclass" className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Purchase Price ($)</label>
                <input type="number" step="0.01" required value={ebPrice} onChange={(e) => setEbPrice(e.target.value)} className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Total Pages count</label>
                <input type="number" required value={ebPages} onChange={(e) => setEbPages(e.target.value)} className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Catalog Description</label>
                <input type="text" required value={ebDesc} onChange={(e) => setEbDesc(e.target.value)} placeholder="Learn precise hand-stimulation frequencies that promote..." className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">File Size Spec (e.g. 5.4 MB)</label>
                <input type="text" required value={ebSize} onChange={(e) => setEbSize(e.target.value)} className="w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">eBook Cover Graphic</label>
              <ImageDropzone imageValue={ebImage} onImageChange={setEbImage} label="eBook Cover" prefersReducedMotion={prefersReducedMotion} />
            </div>
            <div className="flex justify-end gap-2 text-[10.5px]">
              <button type="button" onClick={() => setIsAddingEBook(false)} className="px-4 py-2 border border-[#E5D5C8] hover:bg-brand-cream rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase transition">Commit eBook</button>
            </div>
          </form>
        )}

        {/* eBooks list table */}
        <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                <th className="p-3">Cover Graphic</th>
                <th className="p-3">EBook Title</th>
                <th className="p-3">Pages Count</th>
                <th className="p-3">File Size</th>
                <th className="p-3">Retail Price</th>
                <th className="p-3 text-center">Catalog actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
              {ebooks.map((e) => {
                const isEditing = e.id === editingEBookId;
                return (
                  <tr key={e.id} className="hover:bg-brand-cream/30">
                    <td className="p-3">
                      {isEditing ? (
                        <div className="relative group cursor-pointer w-9 h-11">
                          <img src={editEbImage || e.image} referrerPolicy="no-referrer" alt={e.name} className="w-9 h-11 object-cover rounded border border-brand-rose/40" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                            <Camera className="w-3.5 h-3.5 text-white" />
                          </div>
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async (ev) => {
                              const file = ev.target.files?.[0];
                              if (file) {
                                try { const compressed = await compressImage(file); setEditEbImage(compressed); }
                                catch { const reader = new FileReader(); reader.onloadend = () => setEditEbImage(reader.result as string); reader.readAsDataURL(file); }
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <img src={e.image} referrerPolicy="no-referrer" alt={e.name} className="w-9 h-11 object-cover rounded border border-brand-warm-tan/30" />
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing
                        ? <input type="text" value={editEbName} onChange={(ev) => setEditEbName(ev.target.value)} className="w-full px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs font-semibold" />
                        : <span className="font-semibold">{e.name}</span>}
                    </td>
                    <td className="p-3 font-mono">
                      {isEditing
                        ? <input type="number" value={editEbPages} onChange={(ev) => setEditEbPages(ev.target.value)} className="w-20 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs" />
                        : <span>{e.pages} pages</span>}
                    </td>
                    <td className="p-3 font-mono">
                      {isEditing
                        ? <input type="text" value={editEbSize} onChange={(ev) => setEditEbSize(ev.target.value)} className="w-24 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs" />
                        : <span>{e.fileSize}</span>}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {isEditing ? (
                        <div className="flex items-center gap-0.5">
                          <span>$</span>
                          <input type="number" step="0.01" value={editEbPrice} onChange={(ev) => setEditEbPrice(ev.target.value)} className="w-20 px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs font-bold" />
                        </div>
                      ) : <span>${e.price.toFixed(2)}</span>}
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleSaveEBook(e.id)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer">Save</button>
                          <button onClick={() => setEditingEBookId(null)} className="px-2.5 py-1 bg-brand-cream border border-[#E5D5C8] text-brand-chocolate rounded text-[11px] font-bold cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleStartEditEBook(e)} className="p-1 px-2.5 bg-brand-cream hover:bg-brand-beige text-brand-chocolate rounded-md font-bold transition duration-250 border border-brand-warm-tan/30 cursor-pointer">Edit</button>
                          <button
                            id={`delete-ebook-list-${e.id}`}
                            onClick={() => {
                              if (confirm(`Remove digital textbook "${e.name}" from catalog?`)) {
                                deleteEBook(e.id);
                                triggerToast(`🗑 "${e.name}" removed from the eBook catalog.`, 'success');
                              }
                            }}
                            className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250 cursor-pointer"
                          >Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
