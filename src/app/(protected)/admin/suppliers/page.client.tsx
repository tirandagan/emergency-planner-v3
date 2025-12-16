"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Factory, Globe, Mail, Phone, Pencil, User, Upload, Image as ImageIcon, X } from "lucide-react";
import { createSupplier, deleteSupplier, updateSupplier } from "./actions";
import { supabase } from "@/lib/supabaseClient";

// Helper to parse combined address string back into components
function parseAddress(addressString: string | null | undefined): {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
} {
  if (!addressString) {
    return { line1: '', line2: '', city: '', state: '', zipCode: '', country: '' };
  }

  // Address is stored as: "line1, line2, city, state, zipCode, country"
  const parts = addressString.split(',').map(p => p.trim()).filter(Boolean);

  // This is a best-effort parsing - assumes the standard format from the form
  return {
    line1: parts[0] || '',
    line2: parts[1] || '',
    city: parts[2] || '',
    state: parts[3] || '',
    zipCode: parts[4] || '',
    country: parts[5] || '',
  };
}

export default function SuppliersClient({ initialSuppliers }: { initialSuppliers: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse address when editing
  const parsedAddress = editingSupplier?.contact_info?.address
    ? parseAddress(editingSupplier.contact_info.address)
    : { line1: '', line2: '', city: '', state: '', zipCode: '', country: '' };

  const openNewModal = () => {
    setEditingSupplier(null);
    setLogoUrl(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    setLogoUrl(supplier.logoUrl);
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Create a promise that rejects after 60 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload request timed out')), 60000);
      });

      const uploadPromise = supabase.storage
        .from('supplier_logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/octet-stream'
        });

      console.log('Starting upload...', { filePath, fileType: file.type, fileSize: file.size });

      const result = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (result.error) {
        throw result.error;
      }

      console.log('Upload successful', result);

      const { data } = supabase.storage.from('supplier_logos').getPublicUrl(filePath);
      setLogoUrl(data.publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Error uploading logo!');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const inputClass = "w-full bg-background border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all";
  const labelClass = "block text-xs font-bold text-muted-foreground uppercase mb-1";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Factory className="w-8 h-8 text-primary" />
                Suppliers
            </h1>
            <p className="text-muted-foreground mt-1">Manage drop-ship vendors and affiliate partners</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Supplier
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-colors flex flex-col h-full relative overflow-hidden shadow-sm">
             {/* Logo Background / Header */}
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                 {supplier.logoUrl ? (
                     <img src={supplier.logoUrl} alt="" className="w-32 h-32 object-contain" />
                 ) : (
                     <Factory className="w-32 h-32 text-muted-foreground" />
                 )}
             </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                  {supplier.logoUrl ? (
                      <img src={supplier.logoUrl} alt={supplier.name} className="w-12 h-12 rounded-lg object-cover bg-background p-1 border border-border" />
                  ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <Factory className="w-6 h-6 text-muted-foreground" />
                      </div>
                  )}
                  <div>
                      <h3 className="text-xl font-semibold text-foreground truncate pr-2">{supplier.name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                        (supplier.fulfillmentType === 'dropship' || supplier.fulfillmentType === 'DROP_SHIP')
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-success/10 text-success border border-success/20'
                      }`}>
                        {supplier.fulfillmentType === 'dropship' ? 'DROP-SHIP' : supplier.fulfillmentType === 'affiliate' ? 'AFFILIATE' : supplier.fulfillmentType}
                      </span>
                  </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground flex-grow relative z-10 pl-1">
              {supplier.websiteUrl && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <a href={supplier.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate underline decoration-dotted decoration-border underline-offset-2">
                    {supplier.websiteUrl}
                  </a>
                </div>
              )}
              {supplier.contact_info?.email && (
                 <div className="flex items-center gap-2">
                 <Mail className="w-4 h-4 shrink-0 text-muted-foreground" />
                 <span className="truncate">{supplier.contact_info.email}</span>
               </div>
              )}
               {supplier.contact_info?.phone && (
                 <div className="flex items-center gap-2">
                 <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
                 <span>{supplier.contact_info.phone}</span>
               </div>
              )}
              {supplier.contact_info?.contact_name && (
                 <div className="flex items-center gap-2">
                 <User className="w-4 h-4 shrink-0 text-muted-foreground" />
                 <span>{supplier.contact_info.contact_name}</span>
               </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-end gap-2 relative z-10">
                <button
                    onClick={() => openEditModal(supplier)}
                    className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded transition-colors"
                    title="Edit"
                >
                    <Pencil className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <form action={async () => {
                    if(confirm('Are you sure? This might break linked products.')) {
                        await deleteSupplier(supplier.id);
                    }
                }}>
                    <button type="submit" className="text-destructive hover:text-destructive/90 p-2 hover:bg-destructive/10 rounded transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </form>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-foreground">
                {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form action={async (formData) => {
                if (editingSupplier) {
                    formData.append('id', editingSupplier.id);
                    await updateSupplier(formData);
                } else {
                    await createSupplier(formData);
                }
                setIsModalOpen(false);
                setEditingSupplier(null);
                setLogoUrl(null);
            }} className="space-y-6">

                {/* Logo Upload & Basic Info */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Logo Upload Area */}
                    <div className="w-full md:w-1/3 flex flex-col items-center">
                         <label className={labelClass}>Supplier Logo</label>
                         <div className="w-full aspect-square bg-background border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center relative overflow-hidden hover:border-primary transition-colors group">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                    <span className="text-muted-foreground text-sm">No logo uploaded</span>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <label className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
                                    <Upload className="w-4 h-4" strokeWidth={2.5} />
                                    {uploading ? 'Uploading...' : 'Upload Image'}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                         </div>
                         <input type="hidden" name="logo_url" value={logoUrl || ''} />
                    </div>

                    {/* Basic Fields */}
                    <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                         <div className="col-span-2">
                            <label className={labelClass}>Name *</label>
                            <input
                                required
                                name="name"
                                defaultValue={editingSupplier?.name}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Fulfillment Type</label>
                            <select
                                name="fulfillment_type"
                                defaultValue={editingSupplier?.fulfillment_type || "affiliate"}
                                className={inputClass}
                            >
                                <option value="affiliate">Affiliate Partner</option>
                                <option value="dropship">Drop-Ship Vendor</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Join Date</label>
                            <input
                                name="join_date"
                                type="date"
                                defaultValue={editingSupplier?.contact_info?.join_date || new Date().toISOString().split('T')[0]}
                                className={inputClass}
                            />
                        </div>
                         <div className="col-span-2">
                            <label className={labelClass}>Website URL</label>
                            <input
                                name="website_url"
                                type="url"
                                defaultValue={editingSupplier?.website_url}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Contact Name</label>
                            <input
                                name="contact_name"
                                defaultValue={editingSupplier?.contact_info?.contact_name}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Email</label>
                            <input
                                name="email"
                                type="email"
                                defaultValue={editingSupplier?.contact_info?.email}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Phone</label>
                            <input
                                name="phone"
                                type="tel"
                                defaultValue={editingSupplier?.contact_info?.phone}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Address</h3>
                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                            <label className={labelClass}>Address Line 1</label>
                            <input
                                name="address_line1"
                                defaultValue={parsedAddress.line1}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Address Line 2</label>
                            <input
                                name="address_line2"
                                defaultValue={parsedAddress.line2}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <label className={labelClass}>City</label>
                            <input
                                name="city"
                                defaultValue={parsedAddress.city}
                                className={inputClass}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>State</label>
                            <input
                                name="state"
                                defaultValue={parsedAddress.state}
                                className={inputClass}
                            />
                        </div>
                         <div className="col-span-1">
                            <label className={labelClass}>Zip Code</label>
                            <input
                                name="zip_code"
                                defaultValue={parsedAddress.zipCode}
                                className={inputClass}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Country</label>
                            <input
                                name="country"
                                defaultValue={parsedAddress.country}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* Financial & Notes */}
                <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Payment Terms</label>
                            <input
                                name="payment_terms"
                                placeholder="e.g. Net 30"
                                defaultValue={editingSupplier?.contact_info?.payment_terms}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Tax ID</label>
                            <input
                                name="tax_id"
                                defaultValue={editingSupplier?.contact_info?.tax_id}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className={labelClass}>Notes</label>
                        <textarea
                            name="notes"
                            defaultValue={editingSupplier?.contact_info?.notes}
                            className={`${inputClass} h-24 resize-none`}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
                    <button
                        type="button"
                        onClick={() => { setIsModalOpen(false); setEditingSupplier(null); setLogoUrl(null); }}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
                        {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
