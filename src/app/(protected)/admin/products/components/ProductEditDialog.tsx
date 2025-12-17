import { useState, useEffect, useMemo, useRef } from "react";
import { 
    Pencil, Plus, X, Save, Package, Layers, ImageIcon, DollarSign, 
    Tags, ExternalLink, Loader2, Sparkles, Check, AlertCircle, Target,
    Settings2, TableProperties
} from "lucide-react";
import VariationsModal, { VariationConfig } from "./VariationsModal";
import VariationsTableModal from "./VariationsTableModal";
import { createProduct, updateProduct, deleteProduct, summarizeProductDescription } from "../actions";
import { getProductDetailsFromAmazon, searchProductsFromAmazon } from "../actions";
import ProductSearchModal from "../modals/ProductSearchModal";
import DuplicateProductWarningModal from "../modals/DuplicateProductWarningModal";
import CleanUrlModal from "../modals/CleanUrlModal";
import FetchFromAmazonModal from "../modals/FetchFromAmazonModal";
import SupplierModal from "./SupplierModal";
import MasterItemModal from "./MasterItemModal";
import DecodoErrorModal from "../modals/DecodoErrorModal";
import { SectionTitle, InputGroup, TextInput, SelectInput, TextArea } from "./ProductFormElements";
import TagSelector from "./TagSelector";
import { TIMEFRAMES, DEMOGRAPHICS, LOCATIONS, SCENARIOS } from "../constants";

// Types
interface Category {
    id: string;
    name: string;
    parentId: string | null;
}

interface MasterItem {
    id: string;
    name: string;
    categoryId: string;
    timeframes?: string[] | null;
    demographics?: string[] | null;
    locations?: string[] | null;
    scenarios?: string[] | null;
}

interface Supplier {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    asin?: string;
    price?: number;
    type?: string;
    productUrl?: string;
    imageUrl?: string;
    masterItemId: string;
    supplierId: string;
    metadata?: any;
    timeframes?: string[] | null;
    demographics?: string[] | null;
    locations?: string[] | null;
    scenarios?: string[] | null;
    variations?: {
        config: VariationConfig;
        values: Record<string, any>;
    } | null;
}

interface ProductEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    masterItems: MasterItem[];
    suppliers: Supplier[];
    categories: Category[];
    onSave?: () => void; // Callback to trigger refresh
    preSelectedCategory?: string;
    preSelectedSubCategory?: string;
    preSelectedMasterItem?: string;
}

import InheritanceWarningModal from "./InheritanceWarningModal";

export default function ProductEditDialog({
    isOpen,
    onClose,
    product,
    masterItems: initialMasterItems,
    suppliers: initialSuppliers,
    categories,
    onSave,
    preSelectedCategory,
    preSelectedSubCategory,
    preSelectedMasterItem
}: ProductEditDialogProps) {
    // Form State
    const [formState, setFormState] = useState<Partial<Product>>({});
    
    // Local Lists (to support adding new items)
    const [localMasterItems, setLocalMasterItems] = useState(initialMasterItems);
    const [localSuppliers, setLocalSuppliers] = useState(initialSuppliers);

    // Sub-Modals State
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isMasterItemModalOpen, setIsMasterItemModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
    const [isVariationsTableModalOpen, setIsVariationsTableModalOpen] = useState(false);
    const [isCleanUrlModalOpen, setIsCleanUrlModalOpen] = useState(false);
    const [isFetchFromAmazonModalOpen, setIsFetchFromAmazonModalOpen] = useState(false);
    const [urlToClean, setUrlToClean] = useState({ original: '', clean: '' });
    const [fetchContext, setFetchContext] = useState<{ method: 'url' | 'asin'; value: string }>({ method: 'url', value: '' });
    const [decodoError, setDecodoError] = useState<string | null>(null);
    
    // Inheritance Warning State
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
    const [changedFields, setChangedFields] = useState<{label: string, masterValue: string[] | null, newValue: string[] | null}[]>([]);
    const [conflictData, setConflictData] = useState<any>(null);

    // Async State
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    // Data State
    const [productSuggestions, setProductSuggestions] = useState<Record<string, any> | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Refs for debouncing
    const asinDebounceTimer = useRef<NodeJS.Timeout | null>(null);
    
    // Dropdown State
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

    // Initialization
    useEffect(() => {
        if (isOpen) {
            // Initialize state from product
            // Do NOT populate tag fields if they are null/inherited.
            // TagSelector handles the inheritance visualization via the inheritedValue prop.
            // This ensures 'formState.timeframes' stays null if it's supposed to be inherited.
            const initialState: Partial<Product> = product ? { ...product } : {};
            
            // If pre-selected master item is provided (from UI selection), use it
            if (!product && preSelectedMasterItem) {
                initialState.masterItemId = preSelectedMasterItem;
            }

            setFormState(initialState);
            setProductSuggestions(null);

            // Initialize categories based on product or pre-selected master item
            const masterItemId = product?.masterItemId || preSelectedMasterItem;
            if (masterItemId) {
                const master = initialMasterItems.find(m => m.id === masterItemId);
                if (master) {
                    const cat = categories.find(c => c.id === master.categoryId);
                    if (cat) {
                        if (cat.parentId) {
                            setSelectedCategory(cat.parentId);
                            setSelectedSubCategory(cat.id);
                        } else {
                            setSelectedCategory(cat.id);
                            setSelectedSubCategory("");
                        }
                    }
                }
            } else {
                // Fallback to pre-selected categories if provided (e.g. from filter or Amazon search flow)
                if (preSelectedCategory) {
                    setSelectedCategory(preSelectedCategory);
                    if (preSelectedSubCategory) {
                        setSelectedSubCategory(preSelectedSubCategory);
                    } else {
                        setSelectedSubCategory("");
                    }
                } else {
                    setSelectedCategory("");
                    setSelectedSubCategory("");
                }
            }
        }
    }, [isOpen, product]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-fill tags from Master Item on creation
    useEffect(() => {
        // Only if we are creating a new product (no ID) and a master item is selected
        if (!product?.id && formState.masterItemId) {
            // Set tags to null to inherit from master item (not custom values)
            // null = inherit from master item, actual values = custom override
            setFormState(prev => ({
                ...prev,
                timeframes: null,
                demographics: null,
                locations: null,
                scenarios: null
            }));
        }
    }, [formState.masterItemId, product?.id]);

    // Derived Lists
    const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);
    
    const subCategories = useMemo(() => {
        if (!selectedCategory) return [];
        return categories.filter(c => c.parentId === selectedCategory);
    }, [categories, selectedCategory]);

    const filteredMasterItems = useMemo(() => {
        if (selectedSubCategory) {
            return localMasterItems.filter(m => m.categoryId === selectedSubCategory);
        }
        if (selectedCategory) {
            const childCategoryIds = categories
                .filter(c => c.parentId === selectedCategory)
                .map(c => c.id);
            const relevantIds = new Set([selectedCategory, ...childCategoryIds]);
            return localMasterItems.filter(m => relevantIds.has(m.categoryId));
        }
        return [];
    }, [localMasterItems, selectedCategory, selectedSubCategory, categories]);

    // Handlers
    const applyAutoFillData = (newData: any) => {
        if (!newData) return;
        
        const suggestions: Record<string, any> = {};
        const currentMeta = formState.metadata || {};

        // Helper to add suggestion if value exists and differs
        const addSuggestion = (stateKey: string, newValue: any, currentVal: any) => {
            if (newValue !== undefined && newValue !== null && newValue !== '') {
                // Normalize for comparison
                const strNew = String(newValue).trim();
                const strCurrent = String(currentVal || '').trim();
                
                if (strNew !== strCurrent) {
                     suggestions[stateKey] = { current: currentVal, new: newValue };
                }
            }
        };

        addSuggestion('name', newData.name, formState.name);
        addSuggestion('imageUrl', newData.image_url, formState.imageUrl);
        addSuggestion('asin', newData.asin, formState.asin);
        addSuggestion('price', newData.price, formState.price);
        addSuggestion('productUrl', newData.url, formState.productUrl);
        addSuggestion('description', newData.description, formState.description);

        // Metadata Suggestions
        addSuggestion('metadata_brand', newData.manufacturer, currentMeta.brand);
        addSuggestion('metadata_quantity', newData.capacity_value, currentMeta.quantity);
        addSuggestion('metadata_dimensions', newData.dimensions, currentMeta.dimensions);
        addSuggestion('metadata_color', newData.color, currentMeta.color);
        addSuggestion('metadata_size', newData.size, currentMeta.size);
        addSuggestion('metadata_upc', newData.upc, currentMeta.upc);
        
        const newModelNum = newData.part_number || newData.model_name;
        addSuggestion('metadata_model_number', newModelNum, currentMeta.model_number);
        
        addSuggestion('metadata_weight', newData.weight, currentMeta.weight);
        addSuggestion('metadata_weight_unit', newData.weight_unit, currentMeta.weight_unit);

        if (Object.keys(suggestions).length > 0) {
            setProductSuggestions(suggestions);
        } else {
            setDecodoError("No new data found from Amazon to update.");
        }
    };

    const handleSummarizeDescription = async () => {
        if (!formState.description) return;
        setIsSummarizing(true);
        try {
            const summary = await summarizeProductDescription(formState.description);
            setFormState(prev => ({ ...prev, description: summary }));
        } catch (error) {
            console.error(error);
            alert("Failed to summarize description");
        } finally {
            setIsSummarizing(false);
        }
    };

    const acceptSuggestion = (field: string, value: any) => {
        if (field.startsWith('metadata_')) {
            const metaKey = field.replace('metadata_', '');
            setFormState(prev => ({
                ...prev,
                metadata: { ...(prev.metadata || {}), [metaKey]: value }
            }));
        } else {
            setFormState(prev => ({ ...prev, [field]: value }));
        }
        
        setProductSuggestions(prev => {
            if (!prev) return null;
            const next = { ...prev };
            delete next[field];
            return Object.keys(next).length > 0 ? next : null;
        });
    };

    const dismissSuggestion = (field: string) => {
        setProductSuggestions(prev => {
            if (!prev) return null;
            const next = { ...prev };
            delete next[field];
            return Object.keys(next).length > 0 ? next : null;
        });
    };

    const acceptAllSuggestions = () => {
        if (!productSuggestions) return;
        
        const updates: Partial<Product> = {};
        const metaUpdates: Record<string, any> = { ...(formState.metadata || {}) };
        
        Object.entries(productSuggestions).forEach(([field, suggestion]) => {
            if (field.startsWith('metadata_')) {
                const metaKey = field.replace('metadata_', '');
                metaUpdates[metaKey] = suggestion.new;
            } else {
                (updates as any)[field] = suggestion.new;
            }
        });
        
        setFormState(prev => ({
            ...prev,
            ...updates,
            metadata: metaUpdates
        }));
        setProductSuggestions(null);
    };

    const rejectAllSuggestions = () => {
        setProductSuggestions(null);
    };

    const renderSuggestion = (field: string) => {
        if (!productSuggestions || !productSuggestions[field]) return null;
        const suggestion = productSuggestions[field];
        return (
            <div className="mt-2 p-3 bg-primary/10 border border-primary/50 rounded text-xs animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-warning shrink-0 mt-0.5" strokeWidth={2.5} />
                    <div className="flex-1 min-w-0">
                        <span className="text-muted-foreground">Found: </span>
                        <span className="text-foreground font-medium break-words">{suggestion.new}</span>
                    </div>
                </div>
                <div className="flex gap-2 justify-end flex-wrap">
                    <button
                        type="button"
                        onClick={() => acceptSuggestion(field, suggestion.new)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-success hover:bg-success/90 rounded text-white text-xs font-bold shadow-success/20 transition-colors whitespace-nowrap"
                    >
                        <Check className="w-3 h-3" strokeWidth={2.5} /> Accept
                    </button>
                    <button
                        type="button"
                        onClick={() => dismissSuggestion(field)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded text-muted-foreground text-xs font-medium transition-colors whitespace-nowrap"
                    >
                        <X className="w-3 h-3" strokeWidth={2.5} /> Ignore
                    </button>
                </div>
            </div>
        );
    };

    const handleVariationsSave = (config: VariationConfig) => {
        setFormState(prev => ({
            ...prev,
            variations: {
                config,
                values: prev.variations?.values || {}
            }
        }));
    };

    const handleVariationValuesChange = (values: Record<string, any>) => {
        setFormState(prev => {
            if (!prev.variations?.config) return prev;
            return {
                ...prev,
                variations: {
                    config: prev.variations.config,
                    values
                }
            };
        });
    };

    const handleSaveClick = async (formData: FormData) => {
        // Only check inheritance on updates, not creation (unless advanced logic needed later)
        // Actually, creation also breaks inheritance if we set custom tags immediately? 
        // User requirement: "If a product's tags are modified so they differ from the master item... ask to confirm"
        // Usually this implies editing an existing item that WAS inheriting.
        // But if I create a new item and override, do I need to confirm? Probably not, as I am just creating it.
        // Let's focus on updates where `product` exists.

        if (product?.id && product.masterItemId) {
            const master = initialMasterItems.find(m => m.id === product.masterItemId);
            if (master) {
                const changes: {label: string, masterValue: string[] | null, newValue: string[] | null}[] = [];
                
                // Helper to check if we are breaking inheritance
                // Breaking = Was inheriting (null in product) AND Now explicit (not null in form)
                // We also check if the new value is effectively different?
                // Actually, setting it to explicit IS breaking the link, even if values match.
                
                const checkField = (field: 'timeframes' | 'demographics' | 'locations' | 'scenarios', label: string) => {
                    const originalWasInheriting = product[field] === null || product[field] === undefined;
                    const newIsExplicit = formState[field] !== null && formState[field] !== undefined;
                    
                    if (originalWasInheriting && newIsExplicit) {
                        changes.push({
                            label,
                            masterValue: master[field] || null,
                            newValue: formState[field] || []
                        });
                    }
                };

                checkField('timeframes', 'Timeframe');
                checkField('demographics', 'Demographics');
                checkField('locations', 'Location');
                checkField('scenarios', 'Scenario');

                if (changes.length > 0) {
                    setChangedFields(changes);
                    setPendingFormData(formData);
                    setIsWarningModalOpen(true);
                    return;
                }
            }
        }

        // If no warning needed, proceed
        await submitForm(formData);
    };

    const submitForm = async (formData: FormData) => {
        try {
            if (formState.variations) {
                formData.append('variations', JSON.stringify(formState.variations));
            }

            let res;
            if (product?.id) {
                formData.append('id', product.id);
                res = await updateProduct(formData);
            } else {
                res = await createProduct(formData);
            }
            
            if (res && !res.success && res.conflict) {
                setPendingFormData(formData);
                setConflictData(res.conflict);
                return;
            }
            
            if (onSave) onSave();
            onClose();
        } catch (error: any) {
            console.error("Error saving product:", error);
            setDecodoError(error.message || "An error occurred while saving the product.");
        }
    };

    const handleMergeConflict = async () => {
        if (!pendingFormData || !conflictData) return;
        
        // Update the conflicting product with our new data
        pendingFormData.set('id', conflictData.id);
        
        try {
            const res = await updateProduct(pendingFormData);
             if (res && !res.success) {
                 setDecodoError(res.message || "Merge failed");
                 return;
             }

            // If we were editing a DIFFERENT product, delete the old one
            if (product?.id && product.id !== conflictData.id) {
                await deleteProduct(product.id);
            }
            
            if (onSave) onSave();
            onClose();
            setConflictData(null);
            setPendingFormData(null);
            
        } catch (e: any) {
             setDecodoError(e.message);
        }
    };

    const handleDeleteConflict = async () => {
         if (product?.id) {
             try {
                 await deleteProduct(product.id);
                 if (onSave) onSave();
                 onClose();
             } catch (e: any) {
                 setDecodoError(e.message);
             }
         } else {
             // Discard draft
             onClose();
         }
         setConflictData(null);
         setPendingFormData(null);
    };

    const handleReconnectLink = () => {
        // Reset all 4 fields to null
        setFormState(prev => ({
            ...prev,
            timeframes: null,
            demographics: null,
            locations: null,
            scenarios: null
        }));
    };

    // URL Cleaning Functions
    const isAmazonUrl = (url: string): boolean => {
        return url.includes('amazon.com') || url.includes('a.co') || url.includes('amzn.to');
    };

    const hasQueryParams = (url: string): boolean => {
        return url.includes('?');
    };

    const getCleanUrl = (url: string): string => {
        // Remove everything after the first '?'
        const questionMarkIndex = url.indexOf('?');
        return questionMarkIndex !== -1 ? url.substring(0, questionMarkIndex) : url;
    };

    const handleProductUrlChange = (newUrl: string) => {
        // Check if this is an Amazon URL with query parameters
        if (isAmazonUrl(newUrl) && hasQueryParams(newUrl)) {
            const cleanUrl = getCleanUrl(newUrl);

            // Show the modal to offer cleaning
            setUrlToClean({ original: newUrl, clean: cleanUrl });
            setIsCleanUrlModalOpen(true);

            // Don't update the form state yet - wait for user decision
            return;
        }

        // Update the form state
        setFormState({ ...formState, productUrl: newUrl });

        // If it's an Amazon URL (no query params or non-Amazon), check if we should offer to fetch
        if (newUrl && isAmazonUrl(newUrl)) {
            setFetchContext({ method: 'url', value: newUrl });
            setIsFetchFromAmazonModalOpen(true);
        }
    };

    const handleAcceptCleanUrl = (cleanUrl: string) => {
        setFormState({ ...formState, productUrl: cleanUrl });

        // After accepting clean URL, offer to fetch from Amazon
        setFetchContext({ method: 'url', value: cleanUrl });
        setIsFetchFromAmazonModalOpen(true);
    };

    const handleAsinChange = (newAsin: string) => {
        setFormState({ ...formState, asin: newAsin });

        // Clear any existing timer
        if (asinDebounceTimer.current) {
            clearTimeout(asinDebounceTimer.current);
        }

        // Only trigger modal if ASIN is exactly 10 characters (valid Amazon ASIN length)
        const currentSupplier = localSuppliers.find(s => s.id === formState.supplierId);
        if (newAsin.length === 10 && currentSupplier?.name === 'Amazon') {
            // Debounce: wait 2.5 seconds before showing modal (in case user is still typing)
            asinDebounceTimer.current = setTimeout(() => {
                setFetchContext({ method: 'asin', value: newAsin });
                setIsFetchFromAmazonModalOpen(true);
            }, 2500);
        }
    };

    const handleAsinBlur = () => {
        // Clear the debounce timer
        if (asinDebounceTimer.current) {
            clearTimeout(asinDebounceTimer.current);
        }

        // If user exits the field with a valid 10-char ASIN, trigger immediately
        const currentAsin = formState.asin || '';
        const currentSupplier = localSuppliers.find(s => s.id === formState.supplierId);
        if (currentAsin.length === 10 && currentSupplier?.name === 'Amazon') {
            setFetchContext({ method: 'asin', value: currentAsin });
            setIsFetchFromAmazonModalOpen(true);
        }
    };

    const handleSupplierChange = (newSupplierId: string) => {
        setFormState({ ...formState, supplierId: newSupplierId });

        // Check if we should offer to fetch: supplier is Amazon AND ASIN is valid (10 chars)
        const newSupplier = localSuppliers.find(s => s.id === newSupplierId);
        const currentAsin = formState.asin || '';
        if (newSupplier?.name === 'Amazon' && currentAsin.length === 10) {
            setFetchContext({ method: 'asin', value: currentAsin });
            setIsFetchFromAmazonModalOpen(true);
        }
    };

    const handleConfirmFetchFromAmazon = async () => {
        setIsFetchingDetails(true);
        setProductSuggestions(null);

        try {
            const queryValue = fetchContext.method === 'url' ? fetchContext.value : fetchContext.value;
            const res = await getProductDetailsFromAmazon(queryValue);

            if (res.success && res.data) {
                applyAutoFillData(res.data);
            } else {
                setDecodoError(res.message || 'Unknown error');
            }
        } catch (error: any) {
            console.error(error);
            setDecodoError("Error fetching details: " + error.message);
        } finally {
            setIsFetchingDetails(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">

            {/* Loading Overlay - Shows when fetching from Amazon */}
            {isFetchingDetails && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center rounded-2xl">
                    <div className="bg-card border border-primary/50 rounded-xl p-8 shadow-2xl flex flex-col items-center gap-6 animate-in fade-in zoom-in-95">
                        <div className="relative">
                            {/* Spinning border effect */}
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                            {/* Icon */}
                            <div className="relative p-6 bg-primary/10 rounded-full">
                                <Package className="w-12 h-12 text-primary animate-pulse" strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-bold text-foreground">Fetching from Amazon</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Retrieving product details... This may take a few seconds.
                            </p>
                        </div>
                        {/* Animated dots */}
                        <div className="flex gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        {product?.id ? <Pencil className="w-5 h-5 text-primary" strokeWidth={2.5} /> : <Plus className="w-5 h-5 text-primary" strokeWidth={2.5} />}
                        {product?.id ? 'Edit Product' : 'New Product'}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">Configure product details, pricing, and inventory settings.</p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors">
                    <X className="w-6 h-6" strokeWidth={2.5} />
                </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">
                <form id="product-form" action={handleSaveClick}>
                    <div className="grid grid-cols-12 gap-0 min-h-full">
                        
                        {/* LEFT COLUMN */}
                        <div className="col-span-12 lg:col-span-8 p-8 border-r border-border space-y-8">
                            
                            {/* Suggestions Bar - Only shows when there are auto-fill suggestions */}
                            {productSuggestions && Object.keys(productSuggestions).length > 0 && (
                                <div className="flex justify-between items-center p-4 rounded-xl border bg-primary/10 border-primary/50">
                                    <div className="text-xs text-muted-foreground">
                                        {Object.keys(productSuggestions).length} field(s) ready to update from Amazon
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={acceptAllSuggestions}
                                            className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg text-xs font-bold transition-colors shadow-success/20"
                                        >
                                            <Check className="w-3 h-3" strokeWidth={2.5} />
                                            Accept All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={rejectAllSuggestions}
                                            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold transition-colors"
                                        >
                                            <X className="w-3 h-3" strokeWidth={2.5} />
                                            Reject All
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Identity Section */}
                            <section>
                                <SectionTitle icon={Package}>Product Identity</SectionTitle>
                                <InputGroup label="Product Name" required>
                                    <TextInput
                                        name="name"
                                        value={formState.name || ''}
                                        onChange={e => setFormState({ ...formState, name: e.target.value })}
                                        placeholder="e.g. Sawyer Squeeze Water Filter"
                                        required
                                    />
                                    {renderSuggestion('name')}
                                </InputGroup>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup label="Product Page URL" required>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <TextInput
                                                    name="productUrl"
                                                    type="url"
                                                    value={formState.productUrl || ''}
                                                    onChange={e => handleProductUrlChange(e.target.value)}
                                                    placeholder="https://amazon.com/..."
                                                    required
                                                />
                                                {formState.productUrl && (
                                                    <a href={formState.productUrl} target="_blank" className="p-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                                                        <ExternalLink className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                                                    </a>
                                                )}
                                            </div>
                                            {renderSuggestion('productUrl')}
                                        </div>
                                    </InputGroup>
                                    <InputGroup label="Image URL">
                                        <TextInput
                                            name="imageUrl"
                                            type="url"
                                            value={formState.imageUrl || ''}
                                            onChange={e => setFormState({ ...formState, imageUrl: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        {renderSuggestion('imageUrl')}
                                    </InputGroup>
                                </div>

                                {(formState.imageUrl) && (
                                    <div className="w-32 h-32 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden relative group">
                                        <img src={formState.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                    </div>
                                )}

                                <InputGroup
                                    label="Description"
                                    action={
                                        <button
                                            type="button"
                                            onClick={handleSummarizeDescription}
                                            disabled={isSummarizing || !formState.description}
                                            className="text-xs flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
                                        >
                                            {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} /> : <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />}
                                            AI Summary
                                        </button>
                                    }
                                >
                                    <TextArea
                                        name="description"
                                        value={formState.description || ''}
                                        onChange={e => setFormState({ ...formState, description: e.target.value })}
                                        placeholder="Detailed product description, features, and specs..."
                                    />
                                    {renderSuggestion('description')}
                                </InputGroup>
                            </section>

                            {/* Categorization Section */}
                            <section>
                                <SectionTitle icon={Layers}>Categorization</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                                    <InputGroup label="1. Category">
                                        <SelectInput 
                                            value={selectedCategory} 
                                            onChange={e => {
                                                setSelectedCategory(e.target.value);
                                                setSelectedSubCategory(""); 
                                            }}
                                        >
                                            <option value="">Select Category...</option>
                                            {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </SelectInput>
                                    </InputGroup>
                                    
                                    <InputGroup label="2. Subcategory">
                                        <SelectInput 
                                            value={selectedSubCategory}
                                            onChange={e => setSelectedSubCategory(e.target.value)}
                                            disabled={!selectedCategory || subCategories.length === 0}
                                        >
                                            <option value="">{subCategories.length === 0 ? 'No Subcategories' : 'Select Subcategory...'}</option>
                                            {subCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </SelectInput>
                                    </InputGroup>

                                    <InputGroup label="3. Master Item (Type)" required>
                                        <div className="flex gap-2">
                                            <SelectInput
                                                name="master_item_id"
                                                value={formState.masterItemId || ""}
                                                onChange={e => setFormState({ ...formState, masterItemId: e.target.value })}
                                                required
                                                disabled={!selectedCategory}
                                            >
                                                <option value="">
                                                    {(!selectedCategory) ? 'Select Category First' : 
                                                     (filteredMasterItems.length === 0 ? 'No Master Items Found' : 'Select Master Item...')}
                                                </option>
                                                {filteredMasterItems.map(m => {
                                                    let label = m.name;
                                                    if (!selectedSubCategory && selectedCategory && m.categoryId !== selectedCategory) {
                                                        const sub = categories.find(c => c.id === m.categoryId);
                                                        if (sub) label = `${m.name} (${sub.name})`;
                                                    }
                                                    return <option key={m.id} value={m.id}>{label}</option>;
                                                })}
                                            </SelectInput>
                                            <button
                                                type="button"
                                                disabled={!selectedCategory}
                                                onClick={() => setIsMasterItemModalOpen(true)}
                                                className="bg-muted hover:bg-muted/80 text-foreground px-3 rounded-lg border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Add New Master Item"
                                            >
                                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </InputGroup>
                                </div>
                                {filteredMasterItems.length === 0 && selectedCategory && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-warning bg-warning/10 p-3 rounded-lg border border-warning/30">
                                        <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
                                        No master items found in this category. Please add a Master Item first or check the category selection.
                                    </div>
                                )}
                            </section>

                            {/* Classification Section */}
                            <section>
                                <div className="flex justify-between items-center mb-3">
                                    <SectionTitle icon={Target} className="mb-0">Classification</SectionTitle>
                                    {/* Reconnect Button */}
                                    {product?.id && (
                                        (formState.timeframes || formState.demographics || formState.locations || formState.scenarios) && (
                                            <button
                                                type="button"
                                                onClick={handleReconnectLink}
                                                className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full border border-primary/50 hover:bg-primary/20"
                                                title="Revert all tags to inherit from Master Item"
                                            >
                                                <Layers className="w-3 h-3" strokeWidth={2.5} />
                                                Reconnect to Master
                                            </button>
                                        )
                                    )}
                                </div>

                                <div className={`bg-muted/30 rounded-xl border transition-colors ${
                                    (formState.timeframes || formState.demographics || formState.locations || formState.scenarios)
                                    ? 'border-warning/30 bg-warning/5'
                                    : 'border-border/50'
                                }`}>
                                    {/* Warning Banner - At top of frame when active */}
                                    {(formState.timeframes || formState.demographics || formState.locations || formState.scenarios) && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/30 text-warning text-xs">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                                            <span>Custom classification — overriding Master Item defaults</span>
                                        </div>
                                    )}

                                    <div className="p-6 space-y-6">
                                    {/* Hidden Inputs for Tags */}
                                    {(formState.timeframes === null || formState.timeframes === undefined) 
                                        ? <input type="hidden" name="inherit_timeframes" value="true" /> 
                                        : formState.timeframes.map((t: string) => <input key={t} type="hidden" name="timeframes" value={t} />)
                                    }
                                    {(formState.demographics === null || formState.demographics === undefined)
                                        ? <input type="hidden" name="inherit_demographics" value="true" />
                                        : formState.demographics.map((t: string) => <input key={t} type="hidden" name="demographics" value={t} />)
                                    }
                                    {(formState.locations === null || formState.locations === undefined)
                                        ? <input type="hidden" name="inherit_locations" value="true" />
                                        : formState.locations.map((t: string) => <input key={t} type="hidden" name="locations" value={t} />)
                                    }
                                    {(formState.scenarios === null || formState.scenarios === undefined)
                                        ? <input type="hidden" name="inherit_scenarios" value="true" />
                                        : formState.scenarios.map((t: string) => <input key={t} type="hidden" name="scenarios" value={t} />)
                                    }

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <TagSelector
                                            label="Timeframe"
                                            options={TIMEFRAMES}
                                            selected={formState.timeframes}
                                            onChange={(vals: string[] | null) => setFormState((prev: any) => ({ ...prev, timeframes: vals }))}
                                            notSetLabel="Not Set (Inherits from Master Item)"
                                            inheritedValue={initialMasterItems.find(m => m.id === formState.masterItemId)?.timeframes}
                                        />
                                        <TagSelector
                                            label="Location"
                                            options={LOCATIONS}
                                            selected={formState.locations}
                                            onChange={(vals: string[] | null) => setFormState((prev: any) => ({ ...prev, locations: vals }))}
                                            notSetLabel="Not Set (Inherits from Master Item)"
                                            inheritedValue={initialMasterItems.find(m => m.id === formState.masterItemId)?.locations}
                                        />
                                        <TagSelector
                                            label="Demographics"
                                            options={DEMOGRAPHICS}
                                            selected={formState.demographics}
                                            onChange={(vals: string[] | null) => setFormState((prev: any) => ({ ...prev, demographics: vals }))}
                                            notSetLabel="Not Set (Inherits from Master Item)"
                                            inheritedValue={initialMasterItems.find(m => m.id === formState.masterItemId)?.demographics}
                                        />
                                         <TagSelector
                                            label="Scenario"
                                            options={SCENARIOS}
                                            selected={formState.scenarios}
                                            onChange={(vals: string[] | null) => setFormState((prev: any) => ({ ...prev, scenarios: vals }))}
                                            notSetLabel="Not Set (Inherits from Master Item)"
                                            inheritedValue={initialMasterItems.find(m => m.id === formState.masterItemId)?.scenarios}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="col-span-12 lg:col-span-4 bg-muted p-8 space-y-8 h-full">

                            {/* Pricing Card */}
                            <div className="bg-background/50 p-6 rounded-xl border border-border">
                                <SectionTitle icon={DollarSign}>Pricing & Type</SectionTitle>
                                <div className="space-y-4">
                                    <InputGroup label="Price ($)" required>
                                        <TextInput 
                                            name="price" 
                                            type="number" 
                                            step="0.01" 
                                            value={formState.price || 0}
                                            onChange={e => setFormState({ ...formState, price: parseFloat(e.target.value) })} 
                                            className="text-lg font-mono" 
                                            required 
                                        />
                                        {renderSuggestion('price')}
                                    </InputGroup>
                                    <InputGroup label="Fulfillment Type">
                                        <SelectInput name="type" value={formState.type || "AFFILIATE"} onChange={e => setFormState({ ...formState, type: e.target.value })}>
                                            <option value="AFFILIATE">Affiliate Link (Referral)</option>
                                            <option value="DROP_SHIP">Drop-Ship (Direct Sale)</option>
                                        </SelectInput>
                                    </InputGroup>
                                </div>
                            </div>

                            {/* Inventory Card */}
                            <div className="bg-background/50 p-6 rounded-xl border border-border">
                                <SectionTitle icon={Package}>Inventory & Supplier</SectionTitle>
                                <div className="space-y-4">
                                    <InputGroup label="SKU / ASIN">
                                        <TextInput
                                            name="asin"
                                            value={formState.asin || formState.sku || ''}
                                            onChange={e => handleAsinChange(e.target.value)}
                                            onBlur={handleAsinBlur}
                                            placeholder="e.g. B005EHPVQW"
                                            maxLength={10}
                                        />
                                        {renderSuggestion('asin')}
                                    </InputGroup>
                                    
                                    <InputGroup label="Supplier">
                                        <div className="flex gap-2">
                                            <SelectInput
                                                name="supplier_id"
                                                value={formState.supplierId || ""}
                                                onChange={e => handleSupplierChange(e.target.value)}
                                            >
                                                <option value="">Select Supplier...</option>
                                                {localSuppliers.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </SelectInput>
                                            <button
                                                type="button"
                                                onClick={() => setIsSupplierModalOpen(true)}
                                                className="bg-muted hover:bg-muted/80 text-foreground px-3 rounded-lg border border-border transition-colors"
                                                title="Add New Supplier"
                                            >
                                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </InputGroup>
                                </div>
                            </div>

                            {/* Variations Card */}
                            <div className="bg-background/50 p-6 rounded-xl border border-border">
                                <div className="flex justify-between items-center mb-4">
                                    <SectionTitle icon={Settings2} className="mb-0">Variations</SectionTitle>
                                    <button
                                        type="button"
                                        onClick={() => setIsVariationsModalOpen(true)}
                                        className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg font-medium transition-colors shadow-primary/20"
                                    >
                                        {formState.variations?.config.attributes.length ? 'Edit Variations' : 'Add Variations'}
                                    </button>
                                </div>

                                {formState.variations?.config.attributes.length ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {formState.variations.config.attributes.map(attr => (
                                                <div key={attr.id} className="bg-muted px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border">
                                                    <span className="font-bold text-foreground mr-1">{attr.name}:</span>
                                                    {attr.options.join(', ')}
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => setIsVariationsTableModalOpen(true)}
                                                className="bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg text-xs text-primary border border-border hover:border-primary/50 hover:text-primary/80 transition-all flex items-center gap-2 font-medium"
                                            >
                                                <TableProperties className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                Variation Table
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No variations defined for this product.</p>
                                )}
                            </div>

                            {/* Metadata Card */}
                            <div className="bg-background/50 p-6 rounded-xl border border-border">
                                <SectionTitle icon={Tags}>Attributes</SectionTitle>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputGroup label="Brand">
                                            <TextInput
                                                name="meta_brand"
                                                value={formState.metadata?.brand || ''}
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, brand: e.target.value } })}
                                                placeholder="Brand Name"
                                            />
                                            {renderSuggestion('metadata_brand')}
                                        </InputGroup>
                                        <InputGroup label="Qty (Count)">
                                            <TextInput 
                                                name="meta_quantity" 
                                                type="number" 
                                                value={formState.metadata?.quantity || ''}
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, quantity: e.target.value } })}
                                                placeholder="e.g. 1" 
                                            />
                                            {renderSuggestion('metadata_quantity')}
                                        </InputGroup>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputGroup label="UPC / GTIN">
                                            <TextInput 
                                                name="meta_upc" 
                                                value={formState.metadata?.upc || ''} 
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, upc: e.target.value } })}
                                                placeholder="e.g. 07640144284091" 
                                            />
                                            {renderSuggestion('metadata_upc')}
                                        </InputGroup>
                                        <InputGroup label="Model #">
                                            <TextInput
                                                name="meta_model_number"
                                                value={formState.metadata?.model_number || ''}
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, model_number: e.target.value } })}
                                                placeholder="e.g. LSC024"
                                            />
                                            {renderSuggestion('metadata_model_number')}
                                        </InputGroup>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <InputGroup label="Dimensions">
                                            <TextInput 
                                                name="meta_dimensions" 
                                                value={formState.metadata?.dimensions || ''} 
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, dimensions: e.target.value } })}
                                                placeholder="e.g. 23 x 24.5 x 23 inches" 
                                            />
                                            {renderSuggestion('metadata_dimensions')}
                                        </InputGroup>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputGroup label="Weight">
                                            <TextInput 
                                                name="meta_weight" 
                                                type="number" 
                                                step="0.01" 
                                                value={formState.metadata?.weight || ''}
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, weight: e.target.value } })}
                                                placeholder="e.g. 500" 
                                            />
                                            {renderSuggestion('metadata_weight')}
                                        </InputGroup>
                                        <InputGroup label="Weight Unit">
                                            <SelectInput 
                                                name="meta_weight_unit" 
                                                value={formState.metadata?.weight_unit || ''}
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, weight_unit: e.target.value } })}
                                            >
                                                <option value="">Select...</option>
                                                <option value="g">Grams (g)</option>
                                                <option value="kg">Kilograms (kg)</option>
                                                <option value="oz">Ounces (oz)</option>
                                                <option value="lb">Pounds (lb)</option>
                                                <option value="mg">Milligrams (mg)</option>
                                            </SelectInput>
                                            {renderSuggestion('metadata_weight_unit')}
                                        </InputGroup>
                                    </div>
                                    {/* Other metadata fields... simplified for brevity but kept main ones */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <InputGroup label="Color">
                                            <TextInput 
                                                name="meta_color" 
                                                value={formState.metadata?.color || ''}
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, color: e.target.value } })}
                                                placeholder="e.g. Black" 
                                            />
                                            {renderSuggestion('metadata_color')}
                                        </InputGroup>
                                        <InputGroup label="Size">
                                            <TextInput 
                                                name="meta_size" 
                                                value={formState.metadata?.size || ''}
                                                onChange={e => setFormState({ ...formState, metadata: { ...formState.metadata, size: e.target.value } })}
                                                placeholder="e.g. Large" 
                                            />
                                            {renderSuggestion('metadata_size')}
                                        </InputGroup>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-4 border-t border-border bg-muted flex justify-between items-center">
                {productSuggestions && Object.keys(productSuggestions).length > 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            if (!productSuggestions) return;
                            const keys = Object.keys(productSuggestions);
                            const fieldLabels: Record<string, string> = {
                                'name': 'Product Name',
                                'imageUrl': 'Image URL',
                                'asin': 'ASIN',
                                'price': 'Price',
                                'productUrl': 'Product URL',
                                'description': 'Description',
                                'metadata_brand': 'Brand',
                                'metadata_quantity': 'Quantity',
                                'metadata_dimensions': 'Dimensions',
                                'metadata_color': 'Color',
                                'metadata_size': 'Size',
                                'metadata_upc': 'UPC',
                                'metadata_model_number': 'Model Number',
                                'metadata_weight': 'Weight',
                                'metadata_weight_unit': 'Weight Unit'
                            };

                            const pendingFields = keys.map(k => fieldLabels[k] || k).join(', ');
                            alert(`Please resolve suggestions for: ${pendingFields}`);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 text-warning rounded-lg text-xs font-medium mr-auto animate-pulse hover:bg-warning/20 transition-all"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        <span>Please accept or ignore all Amazon suggestions above.</span>
                    </button>
                )}
                <button type="button" onClick={onClose} className="px-6 py-2.5 text-muted-foreground hover:text-foreground font-medium transition-colors ml-auto">
                    Cancel
                </button>
                <button
                    type="submit"
                    form="product-form"
                    disabled={Boolean(productSuggestions && Object.keys(productSuggestions).length > 0)}
                    title={productSuggestions && Object.keys(productSuggestions).length > 0 ? "Please resolve all Amazon auto-fill suggestions before saving" : ""}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:transform-none"
                >
                    <Save className="w-4 h-4" strokeWidth={2.5} />
                    {product?.id ? 'Save Changes' : 'Create Product'}
                </button>
            </div>

          </div>

            <SupplierModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                onCreated={(supplier) => {
                    setLocalSuppliers(prev => [...prev, supplier].sort((a, b) => a.name.localeCompare(b.name)));
                    setFormState(prev => ({ ...prev, supplierId: supplier.id }));
                }}
            />

            <MasterItemModal
                isOpen={isMasterItemModalOpen}
                onClose={() => setIsMasterItemModalOpen(false)}
                onCreated={(item) => {
                    setLocalMasterItems(prev => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
                    setFormState(prev => ({ ...prev, masterItemId: item.id }));
                }}
                selectedCategoryId={selectedSubCategory || selectedCategory}
                selectedCategoryName={
                    categories.find(c => c.id === (selectedSubCategory || selectedCategory))?.name || 'Unknown Category'
                }
            />

            <ProductSearchModal 
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                searchResults={searchResults}
                onSelect={(product) => {
                    applyAutoFillData(product);
                    setIsSearchModalOpen(false);
                    setSearchResults([]);
                }}
                searchTerm={formState.name || ""}
            />

            <InheritanceWarningModal 
                isOpen={isWarningModalOpen}
                onClose={() => {
                    setIsWarningModalOpen(false);
                    setPendingFormData(null);
                    setChangedFields([]);
                }}
                onConfirm={() => {
                    if (pendingFormData) {
                        submitForm(pendingFormData);
                    }
                    setIsWarningModalOpen(false);
                }}
                changedFields={changedFields}
            />

            {conflictData && (
                <DuplicateProductWarningModal 
                    isOpen={!!conflictData}
                    onClose={() => setConflictData(null)}
                    onMerge={handleMergeConflict}
                    onDelete={handleDeleteConflict}
                    existingProduct={conflictData}
                    newProduct={{
                        name: formState.name || '',
                        price: formState.price,
                        asin: formState.asin,
                        description: formState.description,
                        image_url: formState.imageUrl,
                        supplier_name: localSuppliers.find(s => s.id === formState.supplierId)?.name,
                        master_item_name: localMasterItems.find(m => m.id === formState.masterItemId)?.name
                    }}
                    isEditing={!!product?.id}
                />
            )}

            <DecodoErrorModal
                isOpen={!!decodoError}
                onClose={() => setDecodoError(null)}
                message={decodoError || ""}
            />

            <CleanUrlModal
                isOpen={isCleanUrlModalOpen}
                onClose={() => setIsCleanUrlModalOpen(false)}
                onAccept={handleAcceptCleanUrl}
                originalUrl={urlToClean.original}
                cleanUrl={urlToClean.clean}
            />

            <FetchFromAmazonModal
                isOpen={isFetchFromAmazonModalOpen}
                onClose={() => setIsFetchFromAmazonModalOpen(false)}
                onConfirm={handleConfirmFetchFromAmazon}
                detectionMethod={fetchContext.method}
                detectionValue={fetchContext.value}
            />

            <VariationsModal
                isOpen={isVariationsModalOpen}
                onClose={() => setIsVariationsModalOpen(false)}
                onSave={handleVariationsSave}
                initialConfig={formState.variations?.config}
            />

            {formState.variations && (
                <VariationsTableModal
                    isOpen={isVariationsTableModalOpen}
                    onClose={() => setIsVariationsTableModalOpen(false)}
                    config={formState.variations.config}
                    values={formState.variations.values}
                    onChange={handleVariationValuesChange}
                    basePrice={formState.price}
                    baseSku={formState.asin || formState.sku}
                    baseQuantity={undefined}
                />
            )}
        </div>
    );
}

