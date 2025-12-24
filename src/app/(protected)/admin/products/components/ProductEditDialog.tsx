import { useState, useEffect, useMemo, useRef } from "react";
import {
    Pencil, Plus, X, Save, Package, Layers, DollarSign,
    Tags, ExternalLink, Loader2, Sparkles, Check, AlertCircle, Target,
    Settings2, TableProperties, History
} from "lucide-react";
import VariationsModal, { VariationConfig } from "./VariationsModal";
import VariationsTableModal from "./VariationsTableModal";
import { createProduct, updateProduct, deleteProduct, summarizeProductDescription } from "../actions";
import { getProductDetailsFromAmazon, getProductDetailsFromWeb, searchProductsFromAmazon } from "../actions";
import type { ProductOperationResult } from "../actions";
import ProductSearchModal from "../modals/ProductSearchModal";
import DuplicateProductWarningModal from "../modals/DuplicateProductWarningModal";
import CleanUrlModal from "../modals/CleanUrlModal";
import FetchFromAmazonModal from "../modals/FetchFromAmazonModal";
import FetchFromWebModal from "../modals/FetchFromWebModal";
import SupplierModal from "./SupplierModal";
import MasterItemModal from "./MasterItemModal";
import DecodoErrorModal from "../modals/DecodoErrorModal";
import ProductErrorModal from "../modals/ProductErrorModal";
import { SectionTitle, InputGroup, TextInput, SelectInput, TextArea } from "./ProductFormElements";
import { CollapsibleSection } from "./CollapsibleSection";
import TagSelector from "./TagSelector";
import { TIMEFRAMES, DEMOGRAPHICS, LOCATIONS, SCENARIOS } from "../constants";
import type { Category, MasterItem, Supplier, Product, ProductMetadata } from "@/lib/products-types";

// Types

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

import { ChangeHistoryModal } from "@/components/admin/ChangeHistoryModal";
import type { ChangeHistory } from "@/types/change-history";

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

    // Change History Modal State
    const [isChangeHistoryModalOpen, setIsChangeHistoryModalOpen] = useState(false);
    const [localSuppliers, setLocalSuppliers] = useState(initialSuppliers);

    // Sub-Modals State
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isMasterItemModalOpen, setIsMasterItemModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);
    const [isVariationsTableModalOpen, setIsVariationsTableModalOpen] = useState(false);
    const [isCleanUrlModalOpen, setIsCleanUrlModalOpen] = useState(false);
    const [isFetchFromAmazonModalOpen, setIsFetchFromAmazonModalOpen] = useState(false);
    const [isFetchFromWebModalOpen, setIsFetchFromWebModalOpen] = useState(false);
    const [urlToClean, setUrlToClean] = useState({ original: '', clean: '' });
    const [fetchContext, setFetchContext] = useState<{ method: 'url' | 'asin'; value: string }>({ method: 'url', value: '' });
    const [webScrapeUrl, setWebScrapeUrl] = useState<string>('');
    const [decodoError, setDecodoError] = useState<string | null>(null);
    const [webScrapeError, setWebScrapeError] = useState<{ message: string; errors?: string[] } | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [conflictData, setConflictData] = useState<any>(null);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

    // Async State
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    // Data State
    const [productSuggestions, setProductSuggestions] = useState<Record<string, any> | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Refs for debouncing and field focus
    const asinDebounceTimer = useRef<NodeJS.Timeout | null>(null);
    const asinInputRef = useRef<HTMLInputElement | null>(null);
    const productUrlInputRef = useRef<HTMLInputElement | null>(null);
    
    // Dropdown State
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

    // Collapsible Section States (all default to OPEN)
    const [identityOpen, setIdentityOpen] = useState(true);
    const [pricingOpen, setPricingOpen] = useState(true);
    const [classificationOpen, setClassificationOpen] = useState(true);
    const [categorizationOpen, setCategorizationOpen] = useState(true);
    const [inventoryOpen, setInventoryOpen] = useState(true);
    const [variationsOpen, setVariationsOpen] = useState(true);
    const [attributesOpen, setAttributesOpen] = useState(true);

    // Initialization
    useEffect(() => {
        if (isOpen) {
            // Initialize state from product
            const initialState: Partial<Product> = product ? { ...product } : {};

            // If pre-selected master item is provided (from UI selection), use it
            // Use it if creating new product OR if product doesn't have masterItemId set
            if (preSelectedMasterItem && (!product || !product.masterItemId)) {
                initialState.masterItemId = preSelectedMasterItem;
            }

            // Deduplicate tag arrays to prevent duplicate keys
            if (initialState.scenarios) {
                initialState.scenarios = [...new Set(initialState.scenarios)];
            }
            if (initialState.demographics) {
                initialState.demographics = [...new Set(initialState.demographics)];
            }
            if (initialState.timeframes) {
                initialState.timeframes = [...new Set(initialState.timeframes)];
            }
            if (initialState.locations) {
                initialState.locations = [...new Set(initialState.locations)];
            }

            setFormState(initialState);
            setProductSuggestions(null);

            // Reset all section states to OPEN when dialog opens
            setIdentityOpen(true);
            setPricingOpen(true);
            setClassificationOpen(true);
            setCategorizationOpen(true);
            setInventoryOpen(true);
            setVariationsOpen(true);
            setAttributesOpen(true);

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
    }, [isOpen, product, preSelectedMasterItem, preSelectedCategory, preSelectedSubCategory]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup debounce timer on unmount or dialog close
    useEffect(() => {
        return () => {
            if (asinDebounceTimer.current) {
                clearTimeout(asinDebounceTimer.current);
            }
        };
    }, []);

    // Auto-expand sections when suggestions arrive
    useEffect(() => {
        if (!productSuggestions || Object.keys(productSuggestions).length === 0) return;

        // Map suggestion fields to their sections
        const fieldToSection: Record<string, () => void> = {
            'name': () => setIdentityOpen(true),
            'productUrl': () => setIdentityOpen(true),
            'imageUrl': () => setIdentityOpen(true),
            'description': () => setIdentityOpen(true),
            'price': () => setPricingOpen(true),
            'sku': () => setInventoryOpen(true),
            'asin': () => setInventoryOpen(true),
            'package_size': () => setAttributesOpen(true),
            'required_quantity': () => setAttributesOpen(true),
            'metadata_brand': () => setAttributesOpen(true),
            'metadata_upc': () => setAttributesOpen(true),
            'metadata_model_number': () => setAttributesOpen(true),
            'metadata_dimensions': () => setAttributesOpen(true),
            'metadata_weight': () => setAttributesOpen(true),
            'metadata_weight_unit': () => setAttributesOpen(true),
            'metadata_color': () => setAttributesOpen(true),
            'metadata_size': () => setAttributesOpen(true),
        };

        // Auto-expand sections that have suggestions
        Object.keys(productSuggestions).forEach(field => {
            const expandSection = fieldToSection[field];
            if (expandSection) {
                expandSection();
            }
        });
    }, [productSuggestions]);

    // Auto-fill tags from Master Item on creation
    useEffect(() => {
        // Only if we are creating a new product (no ID) and a master item is selected
        if (!product?.id && formState.masterItemId) {
            // Initialize tags as empty arrays for new products
            // Tags will need to be explicitly set (no inheritance)
            if (!formState.timeframes) {
                setFormState(prev => ({
                    ...prev,
                    timeframes: [],
                    demographics: [],
                    locations: [],
                    scenarios: []
                }));
            }
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
        // Directly submit form without inheritance warnings
        await submitForm(formData);
    };

    const submitForm = async (formData: FormData) => {
        try {
            if (formState.variations) {
                formData.append('variations', JSON.stringify(formState.variations));
            }

            let res: ProductOperationResult;
            if (product?.id) {
                formData.append('id', product.id);
                res = await updateProduct(formData);
            } else {
                res = await createProduct(formData);
            }

            // Handle validation or conflict errors returned from server
            if (res && !res.success) {
                if ('conflict' in res && res.conflict) {
                    setPendingFormData(formData);
                    setConflictData(res.conflict);
                    return;
                }

                // Validation error
                if (res.message) {
                    setSaveError(res.message);
                    return;
                }
            }

            if (onSave) onSave();
            onClose();
        } catch (error: any) {
            console.error("Error saving product:", error);
            setSaveError(error.message || "An error occurred while saving the product.");
        }
    };

    const handleMergeConflict = async () => {
        if (!pendingFormData || !conflictData) return;
        
        // Update the conflicting product with our new data
        pendingFormData.set('id', conflictData.id);
        
        try {
            const res = await updateProduct(pendingFormData);
             if (res && !res.success) {
                 setSaveError(res.message || "Merge failed");
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
             setSaveError(e.message);
        }
    };

    const handleDeleteConflict = async () => {
         if (product?.id) {
             try {
                 await deleteProduct(product.id);
                 if (onSave) onSave();
                 onClose();
             } catch (e: any) {
                 setSaveError(e.message);
             }
         } else {
             // Discard draft
             onClose();
         }
         setConflictData(null);
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

    const isValidProductUrl = (url: string): boolean => {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
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
        } else if (newUrl && isValidProductUrl(newUrl)) {
            // Non-Amazon URL - trigger web scraper
            setWebScrapeUrl(newUrl);
            setIsFetchFromWebModalOpen(true);
        }
    };

    const handleAcceptCleanUrl = (cleanUrl: string) => {
        setFormState({ ...formState, productUrl: cleanUrl });

        // After accepting clean URL, offer to fetch from Amazon
        setFetchContext({ method: 'url', value: cleanUrl });
        setIsFetchFromAmazonModalOpen(true);
    };

    const handleProductUrlBlur = (): void => {
        const url = formState.productUrl;
        if (!url || isAmazonUrl(url)) return;

        if (isValidProductUrl(url) && !productSuggestions) {
            setWebScrapeUrl(url);
            setIsFetchFromWebModalOpen(true);
        }
    };

    const extractDomainFromUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'website';
        }
    };

    const normalizeWeightUnit = (unit: string): string => {
        const normalized = unit.toLowerCase().trim();
        const weightUnitMap: Record<string, string> = {
            'lbs': 'lb',
            'pounds': 'lb',
            'pound': 'lb',
            'lb': 'lb',
            'kg': 'kg',
            'kgs': 'kg',
            'kilograms': 'kg',
            'kilogram': 'kg',
            'oz': 'oz',
            'ounces': 'oz',
            'ounce': 'oz',
            'g': 'g',
            'grams': 'g',
            'gram': 'g',
        };
        return weightUnitMap[normalized] || normalized;
    };

    const parseWeight = (weightString: string): { value: string; unit: string } | null => {
        if (!weightString) return null;

        const match = weightString.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
        if (match) {
            const [, value, unit] = match;
            return { value, unit: normalizeWeightUnit(unit) };
        }

        return null;
    };

    const handleAsinChange = (newAsin: string) => {
        // Only allow alphanumeric characters for ASIN
        const sanitizedAsin = newAsin.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        setFormState({ ...formState, asin: sanitizedAsin });

        // Clear any existing timer
        if (asinDebounceTimer.current) {
            clearTimeout(asinDebounceTimer.current);
        }

        // Clear any previous ASIN errors when user starts editing
        if (decodoError && decodoError.includes('ASIN')) {
            setDecodoError(null);
        }

        // Only trigger modal if ASIN is exactly 10 characters (valid Amazon ASIN length)
        const currentSupplier = localSuppliers.find(s => s.id === formState.supplierId);
        if (sanitizedAsin.length === 10 && currentSupplier?.name === 'Amazon') {
            // Debounce: wait 2.5 seconds before showing modal (in case user is still typing)
            asinDebounceTimer.current = setTimeout(() => {
                setFetchContext({ method: 'asin', value: sanitizedAsin });
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
        setWebScrapeUrl('');

        try {
            const queryValue = fetchContext.method === 'url' ? fetchContext.value : fetchContext.value;
            const res = await getProductDetailsFromAmazon(queryValue);

            if (res.success && res.data) {
                applyAutoFillData(res.data);
            } else {
                setDecodoError(res.message || 'Unknown error');

                // Focus the appropriate field based on the error
                if (res.fieldError === 'asin' && asinInputRef.current) {
                    // ASIN-related error: focus ASIN field
                    setTimeout(() => {
                        asinInputRef.current?.focus();
                        asinInputRef.current?.select();
                    }, 100);
                } else if (res.fieldError === 'productUrl' && productUrlInputRef.current) {
                    // URL extraction error: focus Product URL field
                    setTimeout(() => {
                        productUrlInputRef.current?.focus();
                        productUrlInputRef.current?.select();
                    }, 100);
                }
            }
        } catch (error: any) {
            setDecodoError("Error fetching details: " + error.message);
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleConfirmFetchFromWeb = async (): Promise<void> => {
        setIsFetchingDetails(true);
        setProductSuggestions(null);
        setWebScrapeError(null);

        try {
            const res = await getProductDetailsFromWeb(webScrapeUrl);

            if (res.success && res.data) {
                applyWebScrapeData(res.data, res.errors);
            } else {
                setWebScrapeError({
                    message: res.message || 'Unknown error',
                    errors: res.errors
                });
            }
        } catch (error: any) {
            setWebScrapeError({
                message: 'Error fetching details: ' + error.message,
                errors: [error.stack].filter(Boolean)
            });
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const applyWebScrapeData = (scrapedData: any, errors?: string[]): void => {
        if (!scrapedData) return;

        const suggestions: Record<string, any> = {};
        const currentMeta = formState.metadata || {};

        const addSuggestion = (stateKey: string, newValue: any, currentVal: any): void => {
            if (newValue !== undefined && newValue !== null && newValue !== '') {
                const strNew = String(newValue).trim();
                const strCurrent = String(currentVal || '').trim();

                if (strNew !== strCurrent) {
                    suggestions[stateKey] = { current: currentVal, new: newValue };
                }
            }
        };

        addSuggestion('name', scrapedData.name, formState.name);
        addSuggestion('imageUrl', scrapedData.image_url, formState.imageUrl);
        addSuggestion('price', scrapedData.price, formState.price);
        addSuggestion('description', scrapedData.description, formState.description);
        addSuggestion('sku', scrapedData.sku, formState.sku);

        addSuggestion('metadata_brand', scrapedData.brand, currentMeta.brand);
        addSuggestion('metadata_color', scrapedData.color, currentMeta.color);
        addSuggestion('metadata_size', scrapedData.size, currentMeta.size);
        addSuggestion('metadata_dimensions', scrapedData.dimensions, currentMeta.dimensions);
        addSuggestion('metadata_model_number', scrapedData.model_number, currentMeta.model_number);
        addSuggestion('metadata_upc', scrapedData.upc, currentMeta.upc);

        if (scrapedData.weight) {
            const parsedWeight = parseWeight(scrapedData.weight);
            if (parsedWeight) {
                addSuggestion('metadata_weight', parsedWeight.value, currentMeta.weight);
                addSuggestion('metadata_weight_unit', parsedWeight.unit, currentMeta.weight_unit);
            } else {
                addSuggestion('metadata_weight', scrapedData.weight, currentMeta.weight);
            }
        }

        if (Object.keys(suggestions).length > 0) {
            setProductSuggestions(suggestions);

            if (errors && errors.length > 0) {
                setWebScrapeError({
                    message: 'Partial data retrieved.',
                    errors
                });
            }
        } else if (errors && errors.length > 0) {
            setWebScrapeError({
                message: 'Scraping failed',
                errors
            });
        } else {
            setWebScrapeError({
                message: 'No new data found from the website.'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">

            {/* Loading Overlay - Shows when fetching product details */}
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
                            <h3 className="text-lg font-bold text-foreground">
                                {webScrapeUrl ? `Fetching from ${extractDomainFromUrl(webScrapeUrl)}` : 'Fetching from Amazon'}
                            </h3>
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
                <div className="flex items-center gap-2">
                    {product?.id && (
                        <button
                            onClick={() => setIsChangeHistoryModalOpen(true)}
                            className="text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2 text-sm"
                            title="View change history"
                        >
                            <History className="w-4 h-4" strokeWidth={2.5} />
                            <span>Log</span>
                        </button>
                    )}
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">
                <form id="product-form" action={handleSaveClick}>
                    <div className="p-8 space-y-4">

                        {/* Suggestions Bar - Only shows when there are auto-fill suggestions */}
                        {productSuggestions && Object.keys(productSuggestions).length > 0 && (
                            <div className="flex justify-between items-center p-4 rounded-xl border bg-primary/10 border-primary/50">
                                <div className="text-xs text-muted-foreground">
                                    {Object.keys(productSuggestions).length} field(s) ready to update
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

                            {/* Section 1: Product Identity */}
                        <CollapsibleSection
                            title="Product Identity"
                            icon={Package}
                            isOpen={identityOpen}
                            onToggle={setIdentityOpen}
                        >
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
                                                ref={productUrlInputRef}
                                                name="productUrl"
                                                type="url"
                                                value={formState.productUrl || ''}
                                                onChange={e => handleProductUrlChange(e.target.value)}
                                                onBlur={handleProductUrlBlur}
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

                            {/* Description with Image Preview Side-by-Side */}
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Image Preview - Left Side */}
                                {formState.imageUrl && (
                                    <div className="flex-shrink-0">
                                        <div className="w-40 h-40 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden relative group">
                                            <img src={formState.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1">
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
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Section 2: Pricing & Type */}
                        <CollapsibleSection
                            title="Pricing & Type"
                            icon={DollarSign}
                            isOpen={pricingOpen}
                            onToggle={setPricingOpen}
                            preview={
                                formState.price
                                    ? `$${Number(formState.price).toFixed(2)} • ${formState.type === 'DROP_SHIP' ? 'Drop-Ship' : 'Affiliate'}`
                                    : undefined
                            }
                        >
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
                        </CollapsibleSection>

                        {/* Section 3: Classification */}
                        <CollapsibleSection
                            title="Classification"
                            icon={Target}
                            isOpen={classificationOpen}
                            onToggle={setClassificationOpen}
                            preview={
                                (() => {
                                    const tagCounts = [
                                        (formState.scenarios || []).length && `${(formState.scenarios || []).length} scenario${(formState.scenarios || []).length !== 1 ? 's' : ''}`,
                                        (formState.demographics || []).length && `${(formState.demographics || []).length} demographic${(formState.demographics || []).length !== 1 ? 's' : ''}`,
                                        (formState.timeframes || []).length && `${(formState.timeframes || []).length} timeframe${(formState.timeframes || []).length !== 1 ? 's' : ''}`,
                                        (formState.locations || []).length && `${(formState.locations || []).length} location${(formState.locations || []).length !== 1 ? 's' : ''}`
                                    ].filter(Boolean);
                                    return tagCounts.length ? tagCounts.join(', ') : undefined;
                                })()
                            }
                        >
                            {/* Hidden Inputs for Tags */}
                            {(formState.timeframes || []).map((t: string, idx: number) => <input key={`timeframe-${t}-${idx}`} type="hidden" name="timeframes" value={t} />)}
                            {(formState.demographics || []).map((t: string, idx: number) => <input key={`demographic-${t}-${idx}`} type="hidden" name="demographics" value={t} />)}
                            {(formState.locations || []).map((t: string, idx: number) => <input key={`location-${t}-${idx}`} type="hidden" name="locations" value={t} />)}
                            {(formState.scenarios || []).map((t: string, idx: number) => <input key={`scenario-${t}-${idx}`} type="hidden" name="scenarios" value={t} />)}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <TagSelector
                                    label="Scenario"
                                    options={SCENARIOS}
                                    selected={formState.scenarios || []}
                                    onChange={(vals: string[] | null) => setFormState((prev: any) => ({ ...prev, scenarios: vals || [] }))}
                                    field="scenarios"
                                />
                                <TagSelector
                                    label="Demographics"
                                    options={DEMOGRAPHICS}
                                    selected={formState.demographics || []}
                                    onChange={(vals: string[] | null) => setFormState((prev: any) => ({ ...prev, demographics: vals || [] }))}
                                    field="demographics"
                                />
                                <TagSelector
                                    label="Timeframe"
                                    options={TIMEFRAMES}
                                    selected={formState.timeframes || []}
                                    onChange={(vals: string[] | null) => setFormState((prev: any) => ({ ...prev, timeframes: vals || [] }))}
                                    field="timeframes"
                                />
                                <TagSelector
                                    label="Location"
                                    options={LOCATIONS}
                                    selected={formState.locations || []}
                                    onChange={(vals: string[] | null) => setFormState((prev: any) => ({ ...prev, locations: vals || [] }))}
                                    field="locations"
                                />

                                {/* X1 Multiplier Toggle */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs mb-2 pr-4">
                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            X1 Multiplier
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentMetadata = (formState.metadata as ProductMetadata) || {};
                                            setFormState({
                                                ...formState,
                                                metadata: {
                                                    ...currentMetadata,
                                                    x1_multiplier: !currentMetadata.x1_multiplier,
                                                },
                                            });
                                        }}
                                        className={`w-full flex items-stretch overflow-hidden rounded-md border transition-all duration-200 ${
                                            (formState.metadata as ProductMetadata)?.x1_multiplier
                                                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40'
                                                : 'bg-muted text-muted-foreground border-border'
                                        }`}
                                    >
                                        <div className="px-2 border-r border-white/10 flex items-center justify-center">
                                            <X className={`w-3.5 h-3.5 shrink-0 transition-opacity ${(formState.metadata as ProductMetadata)?.x1_multiplier ? 'opacity-90' : 'opacity-40'}`} strokeWidth={2.5} />
                                        </div>
                                        <div className="px-2.5 py-1 flex items-center justify-center flex-1">
                                            <span className="text-[11px] font-bold tracking-wide uppercase">
                                                {(formState.metadata as ProductMetadata)?.x1_multiplier ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                    </button>
                                    {/* Hidden input to ensure x1_multiplier is submitted with form */}
                                    <input
                                        type="hidden"
                                        name="meta_x1_multiplier"
                                        value={(formState.metadata as ProductMetadata)?.x1_multiplier ? 'true' : 'false'}
                                    />
                                    <p className="text-[10px] text-muted-foreground text-center italic">
                                        {(formState.metadata as ProductMetadata)?.x1_multiplier
                                            ? 'Quantity multiplies by party size'
                                            : 'Fixed quantity regardless of party size'}
                                    </p>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Section 4: Categorization */}
                        <CollapsibleSection
                            title="Categorization"
                            icon={Layers}
                            isOpen={categorizationOpen}
                            onToggle={setCategorizationOpen}
                            preview={
                                (() => {
                                    const parts = [];
                                    if (selectedCategory) {
                                        const cat = categories.find(c => c.id === selectedCategory);
                                        if (cat) parts.push(cat.name);
                                    }
                                    if (selectedSubCategory) {
                                        const subCat = categories.find(c => c.id === selectedSubCategory);
                                        if (subCat) parts.push(subCat.name);
                                    }
                                    if (formState.masterItemId) {
                                        const master = localMasterItems.find(m => m.id === formState.masterItemId);
                                        if (master) parts.push(master.name);
                                    }
                                    return parts.length ? parts.join(' → ') : undefined;
                                })()
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            name="masterItemId"
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
                                <div className="mt-3 flex items-center gap-2 text-xs text-foreground bg-warning/20 p-3 rounded-lg border border-warning/50">
                                    <AlertCircle className="w-4 h-4 text-warning" strokeWidth={2.5} />
                                    No master items found in this category. Please add a Master Item first or check the category selection.
                                </div>
                            )}
                        </CollapsibleSection>

                        {/* Section 5: Inventory & Supplier */}
                        <CollapsibleSection
                            title="Inventory & Supplier"
                            icon={Package}
                            isOpen={inventoryOpen}
                            onToggle={setInventoryOpen}
                            preview={
                                formState.sku || formState.supplierId
                                    ? [
                                        formState.sku && `SKU: ${formState.sku}`,
                                        formState.supplierId && localSuppliers.find(s => s.id === formState.supplierId)?.name
                                    ].filter(Boolean).join(' • ')
                                    : undefined
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="SKU">
                                    <TextInput
                                        name="sku"
                                        value={formState.sku || ''}
                                        onChange={e => setFormState({ ...formState, sku: e.target.value })}
                                        placeholder="e.g. PROD-12345"
                                    />
                                    {renderSuggestion('sku')}
                                </InputGroup>

                                <InputGroup label="ASIN">
                                    <TextInput
                                        ref={asinInputRef}
                                        name="asin"
                                        value={formState.asin || ''}
                                        onChange={e => handleAsinChange(e.target.value)}
                                        onBlur={handleAsinBlur}
                                        placeholder="e.g. B005EHPVQW"
                                        maxLength={10}
                                    />
                                    {renderSuggestion('asin')}
                                </InputGroup>
                            </div>

                            <InputGroup label="Supplier">
                                <div className="flex gap-2">
                                    <SelectInput
                                        name="supplierId"
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
                        </CollapsibleSection>

                        {/* Section 6: Variations */}
                        <CollapsibleSection
                            title="Variations"
                            icon={Settings2}
                            isOpen={variationsOpen}
                            onToggle={setVariationsOpen}
                        >
                            <div className="flex justify-between items-center mb-4">
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
                        </CollapsibleSection>

                        {/* Section 7: Attributes */}
                        <CollapsibleSection
                            title="Attributes"
                            icon={Tags}
                            isOpen={attributesOpen}
                            onToggle={setAttributesOpen}
                        >
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
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Package Size">
                                    <TextInput
                                        name="package_size"
                                        type="number"
                                        min="1"
                                        value={formState.packageSize || 1}
                                        onChange={e => setFormState({ ...formState, packageSize: Number(e.target.value) })}
                                        placeholder="1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Items per supplier package
                                    </p>
                                    {renderSuggestion('package_size')}
                                </InputGroup>
                                <InputGroup label="Required Quantity">
                                    <TextInput
                                        name="required_quantity"
                                        type="number"
                                        min="1"
                                        value={formState.requiredQuantity || 1}
                                        onChange={e => setFormState({ ...formState, requiredQuantity: Number(e.target.value) })}
                                        placeholder="1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Packages needed for this master item
                                    </p>
                                    {renderSuggestion('required_quantity')}
                                </InputGroup>
                            </div>
                            <p className="text-sm text-muted-foreground -mt-2">
                                (= {(formState.packageSize || 1) * (formState.requiredQuantity || 1)} total units)
                            </p>
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
                        </CollapsibleSection>
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

                            // Define field order and their refs for focusing
                            const fieldOrder = [
                                'name', 'productUrl', 'imageUrl', 'description',
                                'price', 'asin', 'sku',
                                'package_size', 'required_quantity',
                                'metadata_brand', 'metadata_upc', 'metadata_model_number',
                                'metadata_dimensions', 'metadata_weight', 'metadata_weight_unit',
                                'metadata_color', 'metadata_size'
                            ];

                            // Find the first field with a suggestion (in display order)
                            const firstFieldKey = fieldOrder.find(field => keys.includes(field));

                            if (firstFieldKey) {
                                // Map field keys to input names/refs
                                const fieldInputs: Record<string, string> = {
                                    'name': 'name',
                                    'imageUrl': 'imageUrl',
                                    'productUrl': 'productUrl',
                                    'description': 'description',
                                    'price': 'price',
                                    'asin': 'asin',
                                    'sku': 'asin', // ASIN field handles both
                                    'package_size': 'package_size',
                                    'required_quantity': 'required_quantity',
                                    'metadata_brand': 'meta_brand',
                                    'metadata_dimensions': 'meta_dimensions',
                                    'metadata_color': 'meta_color',
                                    'metadata_size': 'meta_size',
                                    'metadata_upc': 'meta_upc',
                                    'metadata_model_number': 'meta_model_number',
                                    'metadata_weight': 'meta_weight',
                                    'metadata_weight_unit': 'meta_weight_unit'
                                };

                                const inputName = fieldInputs[firstFieldKey];
                                if (inputName) {
                                    const inputElement = document.querySelector(`[name="${inputName}"]`) as HTMLElement;
                                    if (inputElement) {
                                        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        setTimeout(() => inputElement.focus(), 300);
                                    }
                                }
                            }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-warning/20 border border-warning/50 text-foreground rounded-lg text-xs font-medium mr-auto animate-pulse hover:bg-warning/30 transition-all"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0 text-warning" strokeWidth={2.5} />
                        <span>Please accept or ignore all product suggestions above.</span>
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

            {conflictData && (
                <DuplicateProductWarningModal
                    isOpen={!!conflictData}
                    onClose={() => setConflictData(null)}
                    onSave={async () => {
                        // Save as separate product by proceeding with the original creation
                        if (pendingFormData) {
                            try {
                                const res = await createProduct(pendingFormData);
                                if (res && !res.success) {
                                    setSaveError(res.message || "Failed to create product");
                                    return;
                                }
                                if (onSave) onSave();
                                onClose();
                                setConflictData(null);
                                setPendingFormData(null);
                            } catch (e: any) {
                                setSaveError(e.message);
                            }
                        }
                    }}
                    existingProduct={conflictData}
                    newProduct={{
                        name: formState.name || '',
                        price: typeof formState.price === 'number' ? formState.price : typeof formState.price === 'string' ? parseFloat(formState.price) : undefined,
                        asin: formState.asin ?? undefined,
                        description: formState.description ?? undefined,
                        image_url: formState.imageUrl ?? undefined,
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

            <DecodoErrorModal
                isOpen={!!webScrapeError}
                onClose={() => setWebScrapeError(null)}
                message={webScrapeError?.message || ""}
                errors={webScrapeError?.errors}
            />

            <ProductErrorModal
                isOpen={!!saveError}
                onClose={() => setSaveError(null)}
                message={saveError || ""}
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

            <FetchFromWebModal
                isOpen={isFetchFromWebModalOpen}
                onClose={() => setIsFetchFromWebModalOpen(false)}
                onConfirm={handleConfirmFetchFromWeb}
                url={webScrapeUrl}
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
                    basePrice={typeof formState.price === 'number' ? formState.price : typeof formState.price === 'string' ? parseFloat(formState.price) : undefined}
                    baseSku={formState.sku ?? undefined}
                    baseAsin={formState.asin ?? undefined}
                    basePackageSize={formState.packageSize ?? 1}
                    baseRequiredQuantity={formState.requiredQuantity ?? 1}
                />
            )}

            <ChangeHistoryModal
                isOpen={isChangeHistoryModalOpen}
                onClose={() => setIsChangeHistoryModalOpen(false)}
                entityType="product"
                entityName={product?.name || 'Product'}
                changeHistory={product?.changeHistory as ChangeHistory || []}
            />
        </div>
    );
}

