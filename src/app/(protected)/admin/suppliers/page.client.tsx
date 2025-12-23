"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Factory, Globe, Mail, Phone, Pencil, User, Upload, Image as ImageIcon, X, ChevronDown, ChevronUp, MapPin, CreditCard, Calendar, FileText, Hash, AlertCircle, Building2, DollarSign } from "lucide-react";
import { createSupplier, updateSupplier } from "./actions";
import { supabase } from "@/lib/supabaseClient";
import DeleteSupplierModal from "./DeleteSupplierModal";
import { useRouter } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  // Debug: Log initial suppliers data
  console.log('📦 Initial suppliers data:', initialSuppliers.map(s => ({
    id: s.id,
    name: s.name,
    affiliateId: s.affiliateId,
    affiliateUrlTemplate: s.affiliateUrlTemplate,
  })));

  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<{ id: string; name: string } | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [affiliateUrlTemplate, setAffiliateUrlTemplate] = useState<string>('');
  const [templateValidationError, setTemplateValidationError] = useState<string | null>(null);
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Collapsible section states
  const [contactOpen, setContactOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [affiliateOpen, setAffiliateOpen] = useState(false);

  const toggleCardExpansion = (supplierId: string): void => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  // Parse address when editing
  const parsedAddress = editingSupplier?.contactInfo?.address
    ? parseAddress(editingSupplier.contactInfo.address)
    : { line1: '', line2: '', city: '', state: '', zipCode: '', country: '' };

  // Available field placeholders
  const AVAILABLE_FIELDS = [
    { name: 'sku', description: 'Product SKU' },
    { name: 'asin', description: 'Amazon ASIN' },
    { name: 'name', description: 'Product name' },
    { name: 'price', description: 'Product price' },
    { name: 'product_url', description: 'Product URL' },
    { name: 'affiliate_id', description: 'Affiliate ID' },
  ];

  // Insert field placeholder at cursor position
  const insertFieldPlaceholder = (fieldName: string) => {
    const textarea = templateTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = affiliateUrlTemplate;
    const placeholder = `{${fieldName}}`;

    const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
    setAffiliateUrlTemplate(newValue);

    // Set cursor position after inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + placeholder.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Validate template using validation function
  const validateTemplate = async (template: string): Promise<void> => {
    if (!template) {
      setTemplateValidationError(null);
      return;
    }

    try {
      const { validateAffiliateTemplate } = await import('@/app/(protected)/admin/products/actions/affiliate-link-actions');
      const result = await validateAffiliateTemplate(template);

      if (result.valid) {
        setTemplateValidationError(null);
      } else {
        setTemplateValidationError(result.errors?.[0] || 'Invalid template');
      }
    } catch (error) {
      setTemplateValidationError('Failed to validate template');
    }
  };

  const openNewModal = () => {
    setEditingSupplier(null);
    setLogoUrl(null);
    setAffiliateUrlTemplate('');
    setTemplateValidationError(null);
    // Reset collapsible states
    setContactOpen(false);
    setAddressOpen(false);
    setFinancialOpen(false);
    setAffiliateOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    console.log('🔍 Opening edit modal for supplier:', {
      id: supplier.id,
      name: supplier.name,
      affiliateId: supplier.affiliateId,
      affiliateUrlTemplate: supplier.affiliateUrlTemplate,
      keys: Object.keys(supplier),
    });
    setEditingSupplier(supplier);
    setLogoUrl(supplier.logoUrl);
    setAffiliateUrlTemplate(supplier.affiliateUrlTemplate || '');
    setTemplateValidationError(null);
    // Reset collapsible states
    setContactOpen(false);
    setAddressOpen(false);
    setFinancialOpen(false);
    setAffiliateOpen(false);
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
        .from('supplier-logos')
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

      const { data } = supabase.storage.from('supplier-logos').getPublicUrl(filePath);
      console.log('Generated public URL:', data.publicUrl);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {initialSuppliers.map((supplier) => {
          const isExpanded = expandedCards.has(supplier.id);
          const parsedAddr = parseAddress(supplier.contactInfo?.address);
          const hasAddress = parsedAddr.line1 || parsedAddr.city || parsedAddr.state;
          const hasFinancialInfo = supplier.contactInfo?.payment_terms || supplier.contactInfo?.tax_id || supplier.contactInfo?.join_date;
          const hasNotes = supplier.contactInfo?.notes;
          const hasExpandableContent = hasAddress || hasFinancialInfo || hasNotes;

          return (
            <div key={supplier.id} className="bg-card border border-border rounded-xl hover:border-primary/20 transition-all flex flex-col relative overflow-hidden shadow-sm">
              {/* Card Header - Logo, Name, Badge */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Logo */}
                  <div className="shrink-0">
                    {supplier.logoUrl ? (
                      <img src={supplier.logoUrl} alt={supplier.name} className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-lg" />
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 bg-muted rounded-lg flex items-center justify-center">
                        <Factory className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" strokeWidth={2} />
                      </div>
                    )}
                  </div>

                  {/* Name & Badge */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1.5 break-words">{supplier.name}</h3>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                      (supplier.fulfillmentType === 'dropship' || supplier.fulfillmentType === 'DROP_SHIP')
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-success/10 text-success border border-success/20'
                    }`}>
                      {supplier.fulfillmentType === 'dropship' ? 'Drop-Ship' : supplier.fulfillmentType === 'affiliate' ? 'Affiliate' : supplier.fulfillmentType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Contact Info */}
              <div className="px-4 sm:px-6 pb-3 space-y-2 text-sm">
                {supplier.websiteUrl && (
                  <div className="flex items-start gap-2.5">
                    <Globe className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" strokeWidth={2} />
                    <a href={supplier.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary break-all underline decoration-dotted decoration-border underline-offset-2 text-muted-foreground">
                      {supplier.websiteUrl}
                    </a>
                  </div>
                )}
                {supplier.contactInfo?.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" strokeWidth={2} />
                    <span className="text-muted-foreground break-all">{supplier.contactInfo.email}</span>
                  </div>
                )}
                {supplier.contactInfo?.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                    <span className="text-muted-foreground">{supplier.contactInfo.phone}</span>
                  </div>
                )}
                {supplier.contactInfo?.contact_name && (
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                    <span className="text-muted-foreground">{supplier.contactInfo.contact_name}</span>
                  </div>
                )}
              </div>

              {/* Expandable Details Section */}
              {hasExpandableContent && (
                <>
                  <div className="px-4 sm:px-6 pb-3">
                    <button
                      onClick={() => toggleCardExpansion(supplier.id)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium text-foreground group"
                    >
                      <span className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-primary" strokeWidth={2.5} />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary" strokeWidth={2.5} />
                        )}
                        <span className="text-muted-foreground group-hover:text-foreground">
                          {isExpanded ? 'Hide Details' : 'Show Details'}
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* Expandable Content */}
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 sm:px-6 pb-4 space-y-4 border-t border-border pt-4">
                      {/* Address */}
                      {hasAddress && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-primary" strokeWidth={2.5} />
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Address</span>
                          </div>
                          <div className="pl-6 text-sm text-muted-foreground space-y-0.5">
                            {parsedAddr.line1 && <div>{parsedAddr.line1}</div>}
                            {parsedAddr.line2 && <div>{parsedAddr.line2}</div>}
                            {(parsedAddr.city || parsedAddr.state || parsedAddr.zipCode) && (
                              <div>
                                {[parsedAddr.city, parsedAddr.state, parsedAddr.zipCode].filter(Boolean).join(', ')}
                              </div>
                            )}
                            {parsedAddr.country && <div>{parsedAddr.country}</div>}
                          </div>
                        </div>
                      )}

                      {/* Financial Info */}
                      {hasFinancialInfo && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-primary" strokeWidth={2.5} />
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Financial Details</span>
                          </div>
                          <div className="pl-6 text-sm text-muted-foreground space-y-1.5">
                            {supplier.contactInfo?.payment_terms && (
                              <div className="flex items-start gap-2">
                                <span className="text-foreground/70 font-medium min-w-[100px]">Payment Terms:</span>
                                <span>{supplier.contactInfo.payment_terms}</span>
                              </div>
                            )}
                            {supplier.contactInfo?.tax_id && (
                              <div className="flex items-start gap-2">
                                <Hash className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                                <span className="text-foreground/70 font-medium">Tax ID:</span>
                                <span>{supplier.contactInfo.tax_id}</span>
                              </div>
                            )}
                            {supplier.contactInfo?.join_date && (
                              <div className="flex items-start gap-2">
                                <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                                <span className="text-foreground/70 font-medium">Joined:</span>
                                <span>{new Date(supplier.contactInfo.join_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {hasNotes && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-primary" strokeWidth={2.5} />
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Notes</span>
                          </div>
                          <div className="pl-6 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                            {supplier.contactInfo.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Action Footer */}
              <div className="mt-auto px-4 sm:px-6 py-3 border-t border-border flex justify-end gap-2 bg-muted/30">
                <button
                  onClick={() => openEditModal(supplier)}
                  className="text-muted-foreground hover:text-foreground p-2 hover:bg-background rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setSupplierToDelete({ id: supplier.id, name: supplier.name })}
                  disabled={supplier.name.toLowerCase() === 'amazon'}
                  className="text-destructive hover:text-destructive/90 p-2 hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={supplier.name.toLowerCase() === 'amazon' ? 'Amazon cannot be deleted' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
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
            <form onSubmit={async (e) => {
                e.preventDefault();

                // Capture the form element IMMEDIATELY before any async operations
                const form = e.currentTarget as HTMLFormElement;

                // Validate affiliate template before submission
                if (affiliateUrlTemplate) {
                  await validateTemplate(affiliateUrlTemplate);
                  if (templateValidationError) {
                    alert('Please fix the affiliate URL template errors before saving.');
                    return;
                  }
                }

                // Create FormData from captured form element
                const formData = new FormData(form);

                // Add affiliate URL template from state
                formData.set('affiliate_url_template', affiliateUrlTemplate);

                if (editingSupplier) {
                    formData.append('id', editingSupplier.id);
                    await updateSupplier(formData);
                } else {
                    await createSupplier(formData);
                }
                setIsModalOpen(false);
                setEditingSupplier(null);
                setLogoUrl(null);
                setAffiliateUrlTemplate('');
                setTemplateValidationError(null);
                router.refresh();
            }} className="space-y-6">

                {/* Logo Upload & Basic Info - Always Visible */}
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
                                defaultValue={editingSupplier?.fulfillmentType || "affiliate"}
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
                                defaultValue={editingSupplier?.contactInfo?.join_date || new Date().toISOString().split('T')[0]}
                                className={inputClass}
                            />
                        </div>
                         <div className="col-span-2">
                            <label className={labelClass}>Website URL</label>
                            <input
                                name="website_url"
                                type="url"
                                defaultValue={editingSupplier?.websiteUrl}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* Collapsible Section: Contact Info */}
                <Collapsible open={contactOpen} onOpenChange={setContactOpen} className="border-t border-border pt-4">
                    <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-primary" strokeWidth={2.5} />
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact Information</h3>
                        </div>
                        {contactOpen ? (
                            <ChevronUp className="w-5 h-5 text-primary transition-transform" strokeWidth={2.5} />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2.5} />
                        )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Contact Name</label>
                                <input
                                    name="contact_name"
                                    defaultValue={editingSupplier?.contactInfo?.contact_name}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={editingSupplier?.contactInfo?.email}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    defaultValue={editingSupplier?.contactInfo?.phone}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Collapsible Section: Address */}
                <Collapsible open={addressOpen} onOpenChange={setAddressOpen} className="border-t border-border pt-4">
                    <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-primary" strokeWidth={2.5} />
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Address</h3>
                        </div>
                        {addressOpen ? (
                            <ChevronUp className="w-5 h-5 text-primary transition-transform" strokeWidth={2.5} />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2.5} />
                        )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
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
                            <div>
                                <label className={labelClass}>City</label>
                                <input
                                    name="city"
                                    defaultValue={parsedAddress.city}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>State</label>
                                <input
                                    name="state"
                                    defaultValue={parsedAddress.state}
                                    className={inputClass}
                                />
                            </div>
                             <div>
                                <label className={labelClass}>Zip Code</label>
                                <input
                                    name="zip_code"
                                    defaultValue={parsedAddress.zipCode}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Country</label>
                                <input
                                    name="country"
                                    defaultValue={parsedAddress.country}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Collapsible Section: Financial & Notes */}
                <Collapsible open={financialOpen} onOpenChange={setFinancialOpen} className="border-t border-border pt-4">
                    <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-primary" strokeWidth={2.5} />
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Financial & Business Details</h3>
                        </div>
                        {financialOpen ? (
                            <ChevronUp className="w-5 h-5 text-primary transition-transform" strokeWidth={2.5} />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2.5} />
                        )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Payment Terms</label>
                                <input
                                    name="payment_terms"
                                    placeholder="e.g. Net 30"
                                    defaultValue={editingSupplier?.contactInfo?.payment_terms}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Tax ID</label>
                                <input
                                    name="tax_id"
                                    defaultValue={editingSupplier?.contactInfo?.tax_id}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className={labelClass}>Notes</label>
                            <textarea
                                name="notes"
                                defaultValue={editingSupplier?.contactInfo?.notes}
                                className={`${inputClass} h-24 resize-none`}
                            />
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Collapsible Section: Affiliate Program */}
                <Collapsible open={affiliateOpen} onOpenChange={setAffiliateOpen} className="border-t border-border pt-4">
                    <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-primary" strokeWidth={2.5} />
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Affiliate Program Configuration</h3>
                        </div>
                        {affiliateOpen ? (
                            <ChevronUp className="w-5 h-5 text-primary transition-transform" strokeWidth={2.5} />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2.5} />
                        )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-4">
                            Configure affiliate program settings for this supplier. Leave blank if the supplier doesn't participate in affiliate programs.
                        </p>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className={labelClass}>Affiliate ID</label>
                                <input
                                    name="affiliate_id"
                                    placeholder="your-affiliate-tag-20"
                                    defaultValue={editingSupplier?.affiliateId || ''}
                                    className={inputClass}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Your affiliate partner ID or tag provided by the affiliate program.
                                </p>
                            </div>
                            <div>
                                <label className={labelClass}>Affiliate URL Template</label>
                                <textarea
                                    ref={templateTextareaRef}
                                    name="affiliate_url_template"
                                    placeholder="https://www.example.com/product/{sku}?ref={affiliate_id}"
                                    value={affiliateUrlTemplate}
                                    onChange={(e) => {
                                      setAffiliateUrlTemplate(e.target.value);
                                      // Debounce validation
                                      const timeoutId = setTimeout(() => {
                                        void validateTemplate(e.target.value);
                                      }, 500);
                                      return () => clearTimeout(timeoutId);
                                    }}
                                    className={`${inputClass} h-24 resize-none font-mono text-sm ${
                                      templateValidationError ? 'border-destructive focus:ring-destructive' : ''
                                    }`}
                                />

                                {/* Validation Error */}
                                {templateValidationError && (
                                  <div className="flex items-start gap-2 mt-2 text-xs text-destructive">
                                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                    <span>{templateValidationError}</span>
                                  </div>
                                )}

                                {/* Field Pills */}
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-foreground/70 mb-2">Click to insert field:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_FIELDS.map((field) => (
                                      <button
                                        key={field.name}
                                        type="button"
                                        onClick={() => insertFieldPlaceholder(field.name)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-colors group"
                                        title={field.description}
                                      >
                                        <code className="text-xs font-mono text-primary group-hover:text-primary/90">
                                          {`{${field.name}}`}
                                        </code>
                                        <span className="text-[10px] text-muted-foreground group-hover:text-foreground/70">
                                          {field.description}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <p className="text-xs text-muted-foreground mt-3">
                                  Build your affiliate URL template using the field buttons above. The template will be validated automatically.
                                </p>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

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

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <DeleteSupplierModal
          supplier={supplierToDelete}
          onClose={() => setSupplierToDelete(null)}
          onDeleted={() => {
            setSupplierToDelete(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
