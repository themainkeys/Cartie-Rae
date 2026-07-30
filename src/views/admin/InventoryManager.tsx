/**
 * admin/InventoryManager.tsx
 *
 * Manages the Catalog > Inventory sub-tab:
 *   1. Physical Products Catalog -- create, edit, delete products
 *   2. Digital eBooks Catalog   -- create, edit, delete eBooks
 *
 * Phase 3A Step 2B: PDF upload workflow added for eBooks.
 *
 * Upload sequence (invariants enforced):
 *   1. Validate MIME (application/pdf) and size (<= 52 MB)
 *   2. Compute SHA-256 via SubtleCrypto
 *   3. Determine next version (MAX(version)+1 from ebook_assets)
 *   4. Upload object to private ebooks bucket
 *   5. Only after upload succeeds: deactivate previous active asset
 *   6. Insert new ebook_assets row with is_active = true
 *   7. On insert failure: re-activate old asset, delete orphan object
 *   Never deactivate current asset until replacement upload succeeds.
 *   Never leave two active asset rows after completion.
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, EBook } from '../../types';
import { Plus, Camera, Upload, FileText, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { ImageDropzone } from './shared/AdminDropzones';
import { compressImage } from './shared/adminUtils';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';

// --------------- Constants --------------------------------------------------

const EBOOKS_BUCKET = 'ebooks';
const PDF_MAX_BYTES = 52 * 1024 * 1024; // 52 MB -- matches DB bucket constraint
const PDF_MIME      = 'application/pdf';

// --------------- Helpers ----------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function safeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60) || 'ebook';
}

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// --------------- PDF upload state type -------------------------------------

interface PdfUploadState {
  file: File | null;
  phase: 'idle' | 'validating' | 'hashing' | 'uploading' | 'saving' | 'done' | 'error';
  error: string | null;
  uploadedPath: string | null;
}

const INITIAL_PDF: PdfUploadState = {
  file: null, phase: 'idle', error: null, uploadedPath: null,
};

// --------------- Component --------------------------------------------------

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

  // Product add form
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [prodName, setProdName]               = useState('');
  const [prodPrice, setProdPrice]             = useState('19.99');
  const [prodCategory, setProdCategory]       = useState('Hair Oils');
  const [prodDesc, setProdDesc]               = useState('');
  const [prodStock, setProdStock]             = useState('50');
  const [prodImage, setProdImage]             = useState(
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800'
  );

  // Product inline edit
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProdName, setEditProdName]         = useState('');
  const [editProdCategory, setEditProdCategory] = useState('Hair Oils');
  const [editProdStock, setEditProdStock]       = useState('0');
  const [editProdPrice, setEditProdPrice]       = useState('0.00');
  const [editProdImage, setEditProdImage]       = useState('');

  // eBook add form
  const [isAddingEBook, setIsAddingEBook] = useState(false);
  const [ebName, setEbName]               = useState('');
  const [ebPrice, setEbPrice]             = useState('14.99');
  const [ebPages, setEbPages]             = useState('100');
  const [ebDesc, setEbDesc]               = useState('');
  const [ebImage, setEbImage]             = useState(
    'https://images.unsplash.com/photo-1618673747378-7e0af319150f?auto=format&fit=crop&q=80&w=800'
  );
  const [addPdf, setAddPdf]   = useState<PdfUploadState>(INITIAL_PDF);
  const addPdfRef             = useRef<HTMLInputElement>(null);

  // eBook inline edit
  const [editingEBookId, setEditingEBookId] = useState<string | null>(null);
  const [editEbName, setEditEbName]         = useState('');
  const [editEbPages, setEditEbPages]       = useState('120');
  const [editEbPrice, setEditEbPrice]       = useState('0.00');
  const [editEbSize, setEditEbSize]         = useState('10 MB');
  const [editEbImage, setEditEbImage]       = useState('');
  const [editPdf, setEditPdf] = useState<PdfUploadState>(INITIAL_PDF);
  const editPdfRef            = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isAddingProduct || isAddingEBook || !!editingProductId || !!editingEBookId);
    }
  }, [isAddingProduct, isAddingEBook, editingProductId, editingEBookId, onDirtyChange]);

  // --------------- PDF selection handler ------------------------------------

  const handlePdfSelect = (
    file: File,
    setter: React.Dispatch<React.SetStateAction<PdfUploadState>>
  ) => {
    setter(INITIAL_PDF);
    setter(s => ({ ...s, phase: 'validating' as const }));
    if (file.type !== PDF_MIME) {
      setter({ file: null, phase: 'error', error: 'File must be a PDF (application/pdf).', uploadedPath: null });
      return;
    }
    if (file.size > PDF_MAX_BYTES) {
      setter({ file: null, phase: 'error', error: 'PDF exceeds the 52 MB size limit (' + formatBytes(file.size) + ').', uploadedPath: null });
      return;
    }
    setter({ file, phase: 'idle', error: null, uploadedPath: null });
  };

  // --------------- Core upload sequence -------------------------------------
  //
  // Returns storage_path on success. Throws on any failure, including rollback.
  // Invariants:
  //   - Previous active asset is NOT deactivated until object upload succeeds.
  //   - On ebook_assets INSERT failure: old asset is re-activated, orphan deleted.
  //   - After success: exactly one is_active = true row per ebook_id.
  //
  const uploadPdf = async (
    ebookId: string,
    file: File,
    setter: React.Dispatch<React.SetStateAction<PdfUploadState>>
  ): Promise<string> => {

    // 1. SHA-256 checksum
    setter(s => ({ ...s, phase: 'hashing' as const }));
    const checksum = await sha256Hex(file);

    // 2. Determine next version
    const { data: existing, error: vErr } = await supabase
      .from('ebook_assets')
      .select('id, version, is_active')
      .eq('ebook_id', ebookId)
      .order('version', { ascending: false })
      .limit(1);
    if (vErr) throw new Error('Version query failed: ' + vErr.message);

    const prevActiveId = existing?.find((r: { is_active: boolean }) => r.is_active)?.id ?? null;
    const nextVersion  = (existing?.[0]?.version ?? 0) + 1;

    // 3. Upload object
    const safeFile    = safeName(file.name.replace(/\.pdf$/i, ''));
    const storagePath = ebookId + '/v' + nextVersion + '/' + safeFile + '.pdf';

    setter(s => ({ ...s, phase: 'uploading' as const }));

    const { error: upErr } = await supabase.storage
      .from(EBOOKS_BUCKET)
      .upload(storagePath, file, { contentType: PDF_MIME, cacheControl: '3600', upsert: false });
    if (upErr) throw new Error('Upload failed: ' + upErr.message);

    // 4. Deactivate previous asset (AFTER upload succeeds)
    setter(s => ({ ...s, phase: 'saving' as const }));

    if (prevActiveId) {
      const { error: deErr } = await supabase
        .from('ebook_assets')
        .update({ is_active: false })
        .eq('id', prevActiveId);
      if (deErr) {
        await supabase.storage.from(EBOOKS_BUCKET).remove([storagePath]);
        throw new Error('Failed to deactivate previous version: ' + deErr.message + '. Upload rolled back.');
      }
    }

    // 5. Insert new active asset row
    const { error: insErr } = await supabase
      .from('ebook_assets')
      .insert({
        ebook_id:        ebookId,
        storage_bucket:  EBOOKS_BUCKET,
        storage_path:    storagePath,
        version:         nextVersion,
        file_name:       file.name,
        mime_type:       PDF_MIME,
        size_bytes:      file.size,
        checksum_sha256: checksum,
        is_active:       true,
      });

    if (insErr) {
      if (prevActiveId) {
        await supabase.from('ebook_assets').update({ is_active: true }).eq('id', prevActiveId);
      }
      await supabase.storage.from(EBOOKS_BUCKET).remove([storagePath]);
      throw new Error('Asset record save failed: ' + insErr.message + '. Upload rolled back.');
    }

    return storagePath;
  };

  // --------------- Product handlers -----------------------------------------

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      id: 'prod-' + Date.now(),
      name: prodName,
      price: parseFloat(prodPrice) || 0,
      description: prodDesc,
      category: prodCategory,
      image: prodImage,
      stockStatus: (parseInt(prodStock) || 0) > 15 ? 'In Stock' : 'Low Stock',
      stockCount: parseInt(prodStock) || 0,
    });
    setProdName(''); setProdPrice('19.99'); setProdDesc(''); setProdStock('50');
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
    const orig = products.find(p => p.id === id);
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

  // --------------- eBook handlers -------------------------------------------

  const handleAddEBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ebookId = 'ebook-' + Date.now();
    let storagePath     = ebookId + '/pending.pdf';
    let fileSizeDisplay = '';

    if (addPdf.file && isSupabaseConfigured) {
      try {
        storagePath     = await uploadPdf(ebookId, addPdf.file, setAddPdf);
        fileSizeDisplay = formatBytes(addPdf.file.size);
        setAddPdf(s => ({ ...s, phase: 'done' as const, uploadedPath: storagePath }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'PDF upload failed.';
        setAddPdf(s => ({ ...s, phase: 'error' as const, error: msg }));
        triggerToast('PDF upload failed -- eBook not created.', 'error');
        return;
      }
    } else if (addPdf.file && !isSupabaseConfigured) {
      storagePath     = ebookId + '/v1/' + safeName(addPdf.file.name) + '.pdf';
      fileSizeDisplay = formatBytes(addPdf.file.size);
      triggerToast('PDF path stored locally -- Supabase not configured.', 'info');
    }

    addEBook({
      id: ebookId,
      name: ebName,
      price: parseFloat(ebPrice) || 0,
      description: ebDesc,
      image: ebImage,
      pages: parseInt(ebPages) || 120,
      fileSize: fileSizeDisplay || '--',
      benefits: [
        'Detailed step-by-step master hair guides',
        'Porosity hydration logs and charts',
        'Maximum hair follicle safety guidelines',
      ],
      pdfUrl: storagePath,
    });

    setEbName(''); setEbPrice('14.99'); setEbPages('100'); setEbDesc('');
    setAddPdf(INITIAL_PDF);
    setIsAddingEBook(false);
    triggerToast('eBook added to catalog.', 'success');
  };

  const handleStartEditEBook = (e: EBook) => {
    setEditingEBookId(e.id);
    setEditEbName(e.name);
    setEditEbPages(e.pages.toString());
    setEditEbPrice(e.price.toString());
    setEditEbSize(e.fileSize);
    setEditEbImage(e.image);
    setEditPdf(INITIAL_PDF);
  };

  const handleSaveEBook = async (id: string) => {
    const orig = ebooks.find(e => e.id === id);
    if (!orig) return;

    const patch: Partial<EBook> = {
      name:     editEbName,
      pages:    parseInt(editEbPages) || 120,
      price:    parseFloat(editEbPrice) || 0,
      fileSize: editEbSize,
      image:    editEbImage || orig.image,
    };

    if (editPdf.file) {
      if (!isSupabaseConfigured) {
        patch.pdfUrl   = id + '/v_replace/' + safeName(editPdf.file.name) + '.pdf';
        patch.fileSize = formatBytes(editPdf.file.size);
        triggerToast('PDF path stored locally -- Supabase not configured.', 'info');
      } else {
        try {
          const sp     = await uploadPdf(id, editPdf.file, setEditPdf);
          patch.pdfUrl   = sp;
          patch.fileSize = formatBytes(editPdf.file.size);
          setEditPdf(s => ({ ...s, phase: 'done' as const, uploadedPath: sp }));
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'PDF replacement failed.';
          setEditPdf(s => ({ ...s, phase: 'error' as const, error: msg }));
          triggerToast(msg, 'error');
          return;
        }
      }
    }

    updateEBook(id, patch);
    setEditingEBookId(null);
    setEditPdf(INITIAL_PDF);
    triggerToast('eBook updated.', 'success');
  };

  // --------------- PDF dropzone sub-component --------------------------------

  const PdfDropzone: React.FC<{
    state:    PdfUploadState;
    setter:   React.Dispatch<React.SetStateAction<PdfUploadState>>;
    inputRef: React.RefObject<HTMLInputElement | null>;
    currentPath?: string;
  }> = ({ state, setter, inputRef, currentPath }) => {

    const phaseLabel: Record<PdfUploadState['phase'], string> = {
      idle: '', validating: 'Validating...', hashing: 'Computing checksum...',
      uploading: 'Uploading to private storage...', saving: 'Saving asset record...',
      done: 'Upload complete.', error: '',
    };
    const isWorking = ['validating','hashing','uploading','saving'].includes(state.phase);

    return (
      <div className="space-y-2">
        {currentPath && !state.file && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10.5px] text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-mono truncate max-w-[200px]" title={currentPath}>{currentPath.split('/').pop()}</span>
            <span className="ml-auto text-[9.5px] text-emerald-600 font-bold uppercase tracking-wide">Active</span>
          </div>
        )}
        <div
          onClick={() => !isWorking && inputRef.current?.click()}
          className={[
            'relative flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150 select-none',
            isWorking ? 'border-brand-warm-tan/30 bg-brand-beige/30 cursor-wait'
                      : 'border-brand-warm-tan/50 hover:border-brand-rose/50 hover:bg-brand-pink-light/30 bg-brand-cream/50',
            state.phase === 'error' ? 'border-red-300 bg-red-50/40'   : '',
            state.phase === 'done'  ? 'border-emerald-300 bg-emerald-50/30' : '',
          ].join(' ')}
        >
          {isWorking ? (
            <>
              <Loader2 className="w-5 h-5 text-brand-rose animate-spin" />
              <span className="text-[10.5px] text-brand-chocolate font-semibold">{phaseLabel[state.phase]}</span>
            </>
          ) : state.phase === 'done' ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-[10.5px] text-emerald-700 font-semibold">Uploaded successfully</span>
            </>
          ) : state.file ? (
            <>
              <FileText className="w-5 h-5 text-brand-rose" />
              <div className="text-center">
                <p className="text-[10.5px] font-semibold text-brand-dark truncate max-w-[200px]">{state.file.name}</p>
                <p className="text-[9.5px] text-brand-chocolate/60">{formatBytes(state.file.size)}</p>
              </div>
              <button type="button"
                onClick={ev => { ev.stopPropagation(); setter(INITIAL_PDF); if (inputRef.current) inputRef.current.value = ''; }}
                className="absolute top-1.5 right-1.5 p-0.5 text-brand-chocolate/50 hover:text-brand-rose transition"
              ><X className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-brand-chocolate/40" />
              <div className="text-center">
                <p className="text-[10.5px] font-semibold text-brand-chocolate">{currentPath ? 'Upload replacement PDF' : 'Upload PDF'}</p>
                <p className="text-[9.5px] text-brand-chocolate/50">PDF only · max 52 MB</p>
              </div>
            </>
          )}
          <input ref={inputRef as React.RefObject<HTMLInputElement>} type="file" accept={PDF_MIME} className="sr-only"
            onChange={ev => { const f = ev.target.files?.[0]; if (f) handlePdfSelect(f, setter); }}
          />
        </div>
        {state.phase === 'error' && state.error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[10.5px] text-red-700">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}
        {!isSupabaseConfigured && (
          <p className="text-[9.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
            Supabase not configured -- PDF path stored locally only.
          </p>
        )}
      </div>
    );
  };

  // --------------- Render ---------------------------------------------------

  const inputCls  = 'w-full px-3 py-2 bg-brand-cream border border-brand-warm-tan/30 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose transition-all duration-150';
  const inlineCls = 'w-full px-2 py-1 bg-[#FAF6F0] border border-brand-warm-tan/35 rounded focus:outline-none focus:ring-2 focus:ring-brand-rose/20 focus:border-brand-rose text-xs';

  return (
    <div className="space-y-8">

      {/* PHYSICAL PRODUCTS */}
      <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
        <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
            Physical Products Catalog
          </h3>
          <button id="add-prod-catalog-btn" onClick={() => setIsAddingProduct(!isAddingProduct)}
            className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none">
            <Plus className="w-3.5 h-3.5" /><span>Create Product</span>
          </button>
        </div>

        {isAddingProduct && (
          <form onSubmit={handleAddProductSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
            <p className="font-serif font-bold text-brand-chocolate">New Product Parameters:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Product Title</label>
                <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. Aloe Moisture Spray" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Retail Price ($)</label>
                <input type="number" step="0.01" required value={prodPrice} onChange={e => setProdPrice(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Category Collection</label>
                <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} className={inputCls}>
                  <option>Hair Oils</option><option>Accessories</option><option>Treatments</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Brief Description</label>
                <input type="text" required value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Potent hydration mist..." className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Initial Stock Count</label>
                <input type="number" required value={prodStock} onChange={e => setProdStock(e.target.value)} className={inputCls} />
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

        <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                <th className="p-3">Reference Photo</th><th className="p-3">Product Name</th>
                <th className="p-3">Category</th><th className="p-3">Stock Count</th>
                <th className="p-3">Retail Price</th><th className="p-3 text-center">Catalog Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
              {products.map(p => {
                const isEditing = p.id === editingProductId;
                return (
                  <tr key={p.id} className="hover:bg-brand-cream/30">
                    <td className="p-3">
                      {isEditing ? (
                        <div className="relative group cursor-pointer w-10 h-10">
                          <img src={editProdImage || p.image} referrerPolicy="no-referrer" alt={p.name} className="w-10 h-10 object-cover rounded border border-brand-rose/40" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"><Camera className="w-3.5 h-3.5 text-white" /></div>
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async ev => { const f = ev.target.files?.[0]; if (f) { try { setEditProdImage(await compressImage(f)); } catch { const r = new FileReader(); r.onloadend = () => setEditProdImage(r.result as string); r.readAsDataURL(f); } } }} />
                        </div>
                      ) : <img src={p.image} referrerPolicy="no-referrer" alt={p.name} className="w-10 h-10 object-cover rounded border border-brand-warm-tan/30" />}
                    </td>
                    <td className="p-3">{isEditing ? <input type="text" value={editProdName} onChange={e => setEditProdName(e.target.value)} className={inlineCls + ' font-semibold'} /> : <span className="font-semibold">{p.name}</span>}</td>
                    <td className="p-3">{isEditing ? <select value={editProdCategory} onChange={e => setEditProdCategory(e.target.value)} className={inlineCls}><option>Hair Oils</option><option>Accessories</option><option>Treatments</option></select> : <span>{p.category}</span>}</td>
                    <td className="p-3 font-mono">{isEditing ? <input type="number" value={editProdStock} onChange={e => setEditProdStock(e.target.value)} className={inlineCls + ' w-20'} /> : <span className={'px-2 py-0.5 rounded-full text-[10.5px] font-bold ' + (p.stockCount === 0 ? 'bg-red-50 text-red-700' : p.stockCount <= 15 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-800')}>{p.stockCount} ({p.stockStatus})</span>}</td>
                    <td className="p-3 font-mono font-bold">{isEditing ? <div className="flex items-center gap-0.5"><span>$</span><input type="number" step="0.01" value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} className={inlineCls + ' w-20 font-bold'} /></div> : <span>{'$' + p.price.toFixed(2)}</span>}</td>
                    <td className="p-3 text-center">{isEditing ? (<div className="flex justify-center gap-1.5"><button onClick={() => handleSaveProduct(p.id)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer">Save</button><button onClick={() => setEditingProductId(null)} className="px-2.5 py-1 bg-brand-cream border border-[#E5D5C8] text-brand-chocolate rounded text-[11px] font-bold cursor-pointer">Cancel</button></div>) : (<div className="flex justify-center gap-1.5"><button onClick={() => handleStartEditProduct(p)} className="p-1 px-2.5 bg-brand-cream hover:bg-brand-beige text-brand-chocolate rounded-md font-bold transition duration-250 border border-brand-warm-tan/30 cursor-pointer">Edit</button><button id={'delete-prod-list-' + p.id} onClick={() => { if (confirm('Delete physical "' + p.name + '" from catalog?')) { deleteProduct(p.id); triggerToast('"' + p.name + '" removed from the product catalog.', 'success'); } }} className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250 cursor-pointer">Delete</button></div>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIGITAL EBOOKS */}
      <div className="bg-white border border-[#E5D5C8]/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_4px_25px_-4px_rgba(74,43,32,0.02)]">
        <div className="flex justify-between items-center border-b border-[#E5D5C8]/30 pb-3">
          <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-rose rounded-full" />
            Digital eBooks Catalog
          </h3>
          <button id="add-ebook-catalog-btn" onClick={() => setIsAddingEBook(!isAddingEBook)}
            className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-extrabold text-white bg-brand-rose hover:bg-brand-berry px-3.5 py-1.5 rounded-full transition-all focus:outline-none">
            <Plus className="w-3.5 h-3.5" /><span>Create eBook Guide</span>
          </button>
        </div>

        {isAddingEBook && (
          <form onSubmit={handleAddEBookSubmit} className="bg-brand-beige/50 border border-brand-warm-tan/40 p-5 rounded-2xl space-y-4 text-xs">
            <p className="font-serif font-bold text-brand-chocolate">New eBook Parameters:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">eBook Title</label>
                <input type="text" required value={ebName} onChange={e => setEbName(e.target.value)} placeholder="e.g. Scalp Massage Masterclass" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Purchase Price ($)</label>
                <input type="number" step="0.01" required value={ebPrice} onChange={e => setEbPrice(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Total Pages Count</label>
                <input type="number" required value={ebPages} onChange={e => setEbPages(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">Catalog Description</label>
              <input type="text" required value={ebDesc} onChange={e => setEbDesc(e.target.value)} placeholder="Learn precise hand-stimulation frequencies..." className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">eBook Cover Graphic</label>
              <ImageDropzone imageValue={ebImage} onImageChange={setEbImage} label="eBook Cover" prefersReducedMotion={prefersReducedMotion} />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-brand-chocolate mb-1">PDF File</label>
              <PdfDropzone state={addPdf} setter={setAddPdf} inputRef={addPdfRef} />
            </div>
            <div className="flex justify-end gap-2 text-[10.5px]">
              <button type="button" onClick={() => { setIsAddingEBook(false); setAddPdf(INITIAL_PDF); }} className="px-4 py-2 border border-[#E5D5C8] hover:bg-brand-cream rounded">Cancel</button>
              <button type="submit" disabled={['hashing','uploading','saving'].includes(addPdf.phase)}
                className="px-4 py-2 bg-brand-chocolate hover:bg-brand-dark text-white rounded font-bold uppercase transition disabled:opacity-60 disabled:cursor-wait">
                {['hashing','uploading','saving'].includes(addPdf.phase) ? 'Uploading...' : 'Commit eBook'}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border border-brand-warm-tan/20 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-beige/50 border-b border-brand-warm-tan/20 text-[#8C6D62] font-semibold">
                <th className="p-3">Cover Graphic</th><th className="p-3">eBook Title</th>
                <th className="p-3">Pages</th><th className="p-3">PDF Asset</th>
                <th className="p-3">Price</th><th className="p-3 text-center">Catalog Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-warm-tan/10 text-brand-dark/80">
              {ebooks.map(e => {
                const isEditing = e.id === editingEBookId;
                const hasAsset  = !!(e.pdfUrl && !e.pdfUrl.endsWith('_guide.pdf') && !e.pdfUrl.endsWith('pending.pdf'));
                return (
                  <tr key={e.id} className="hover:bg-brand-cream/30">
                    <td className="p-3">
                      {isEditing ? (
                        <div className="relative group cursor-pointer w-9 h-11">
                          <img src={editEbImage || e.image} referrerPolicy="no-referrer" alt={e.name} className="w-9 h-11 object-cover rounded border border-brand-rose/40" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"><Camera className="w-3.5 h-3.5 text-white" /></div>
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async ev => { const f = ev.target.files?.[0]; if (f) { try { setEditEbImage(await compressImage(f)); } catch { const r = new FileReader(); r.onloadend = () => setEditEbImage(r.result as string); r.readAsDataURL(f); } } }} />
                        </div>
                      ) : <img src={e.image} referrerPolicy="no-referrer" alt={e.name} className="w-9 h-11 object-cover rounded border border-brand-warm-tan/30" />}
                    </td>
                    <td className="p-3">{isEditing ? <input type="text" value={editEbName} onChange={ev => setEditEbName(ev.target.value)} className={inlineCls + ' font-semibold'} /> : <span className="font-semibold">{e.name}</span>}</td>
                    <td className="p-3 font-mono">{isEditing ? <input type="number" value={editEbPages} onChange={ev => setEditEbPages(ev.target.value)} className={inlineCls + ' w-20'} /> : <span>{e.pages} pages</span>}</td>
                    <td className="p-3 max-w-[180px]">
                      {isEditing ? (
                        <PdfDropzone state={editPdf} setter={setEditPdf} inputRef={editPdfRef} currentPath={hasAsset ? e.pdfUrl : undefined} />
                      ) : hasAsset ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono text-[9.5px] text-emerald-800 truncate" title={e.pdfUrl}>{e.pdfUrl.split('/').pop()}</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-[9.5px] text-amber-600 font-semibold">
                          <AlertTriangle className="w-3 h-3 shrink-0" />No PDF
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold">{isEditing ? <div className="flex items-center gap-0.5"><span>$</span><input type="number" step="0.01" value={editEbPrice} onChange={ev => setEditEbPrice(ev.target.value)} className={inlineCls + ' w-20 font-bold'} /></div> : <span>{'$' + e.price.toFixed(2)}</span>}</td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleSaveEBook(e.id)} disabled={['hashing','uploading','saving'].includes(editPdf.phase)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer disabled:opacity-60 disabled:cursor-wait">
                            {['hashing','uploading','saving'].includes(editPdf.phase) ? '...' : 'Save'}
                          </button>
                          <button onClick={() => { setEditingEBookId(null); setEditPdf(INITIAL_PDF); }} className="px-2.5 py-1 bg-brand-cream border border-[#E5D5C8] text-brand-chocolate rounded text-[11px] font-bold cursor-pointer">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleStartEditEBook(e)} className="p-1 px-2.5 bg-brand-cream hover:bg-brand-beige text-brand-chocolate rounded-md font-bold transition duration-250 border border-brand-warm-tan/30 cursor-pointer">Edit</button>
                          <button id={'delete-ebook-list-' + e.id} onClick={() => { if (confirm('Remove digital textbook "' + e.name + '" from catalog?')) { deleteEBook(e.id); triggerToast('"' + e.name + '" removed from the eBook catalog.', 'success'); } }} className="p-1 px-2.5 bg-brand-pink-light hover:bg-brand-rose text-brand-rose hover:text-white rounded-md font-bold transition duration-250 cursor-pointer">Delete</button>
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
