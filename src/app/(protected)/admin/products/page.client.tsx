"use client";

import { useState, useMemo, useEffect, Fragment, useRef } from "react";
import { Plus, Trash2, Tags, Upload, Package, Layers, AlertCircle, X, Search, Truck, FolderTree, ChevronDown, ChevronRight, ChevronUp, Clock, Users, MapPin, Zap, Unlink, PersonStanding, Copy, ClipboardPaste, Tag, Download, FileText, Edit, Pencil, Radiation, AlertTriangle, Cloud, Shield, Baby, UserCheck, User } from "lucide-react";
import { SCENARIOS, TIMEFRAMES, DEMOGRAPHICS, LOCATIONS } from "./constants";
import { deleteProduct, createMasterItem, bulkUpdateProducts, updateProduct, updateMasterItem, updateProductTags } from "./actions";
import { getCategoryImpact, updateCategory, deleteCategory } from "@/app/actions/categories";
import { EditCategoryDialog } from "@/components/admin/category-dialogs";
import { DeleteCategoryDialog } from "@/components/admin/DeleteCategoryDialog";
import ProductEditDialog from "./components/ProductEditDialog";
import MasterItemModal from "./components/MasterItemModal";
import AddProductChoiceModal from "./components/AddProductChoiceModal";
import AmazonSearchDialog from "./components/AmazonSearchDialog";
import AddToBundleModal from "./components/AddToBundleModal";
import ProductCatalogFilter from "./components/ProductCatalogFilter";
import CompactCategoryTreeSelector from "./components/CompactCategoryTreeSelector";

// --- Types ---
interface Category {
    id: string;
    name: string;
    parentId: string | null;
    description: string | null;
    icon: string | null;
    createdAt?: Date;
}

interface MasterItem {
    id: string;
    name: string;
    categoryId: string; // Drizzle returns camelCase
    description: string | null;
    timeframes: string[] | null;
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
    price?: string | number; // Drizzle returns decimal as string
    type?: string;
    productUrl?: string; // Fixed: camelCase to match Drizzle schema
    imageUrl?: string; // Fixed: camelCase to match Drizzle schema
    masterItemId: string; // Drizzle returns camelCase
    supplierId: string; // Fixed: camelCase to match Drizzle schema
    supplier?: { name: string };
    masterItem?: { name: string }; // Fixed: camelCase consistency
    metadata?: any;
    timeframes?: string[] | null;
    demographics?: string[] | null;
    locations?: string[] | null;
    scenarios?: string[] | null;
    variations?: any;
}

// Gender symbol components (Venus ♀ and Mars ♂)
const VenusIcon = ({ className, color = "currentColor", title }: { className?: string; color?: string; title?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" title={title}>
        <circle cx="12" cy="8" r="3"/>
        <path d="M12 11v10"/>
        <path d="M8 15h8"/>
    </svg>
);

const MarsIcon = ({ className, color = "currentColor", title }: { className?: string; color?: string; title?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" title={title}>
        <circle cx="12" cy="8" r="3"/>
        <path d="M12 11v10"/>
        <path d="M16 15l-4-4"/>
        <path d="M12 11l4 4"/>
    </svg>
);

// --- Helper Components ---
// Condense timeframe labels for display
export const formatTagValue = (value: string, field?: string): string | { icon: 'user' | 'users' | 'zap' | 'radiation' | 'alertTriangle' | 'users' | 'cloud' | 'baby' | 'userCheck' | 'venus' | 'mars' } => {
    const lower = value.toLowerCase();
    
    // Scenarios - use icons everywhere
    if (lower === 'emp') return { icon: 'zap' };
    if (lower === 'cbrn') return { icon: 'radiation' };
    if (lower === 'domestic terrorism') return { icon: 'alertTriangle' };
    if (lower === 'civil unrest') return { icon: 'users' };
    if (lower === 'storms') return { icon: 'cloud' };
    
    // Timeframes
    if (lower === '1 year') return '1Y';
    if (lower === '>1 year') return '>1Y';
    if (lower === '1 month') return '1MO';
    if (lower === '1 week') return '1W';
    // Demographics - use icons for all
    if (lower === 'man') return { icon: 'mars' };
    if (lower === 'woman') return { icon: 'venus' };
    if (lower === 'adult') return { icon: 'userCheck' };
    if (lower === 'child') return { icon: 'baby' };
    if (lower === 'individual') return { icon: 'user' };
    if (lower === 'family') return { icon: 'users' };
    return value;
};

// Helper function to get display name for icon values
const getIconDisplayName = (icon: string, originalValue?: string): string => {
    if (originalValue) return originalValue;
    
    const iconMap: Record<string, string> = {
        'mars': 'Male',
        'venus': 'Female',
        'userCheck': 'Adult',
        'baby': 'Child',
        'user': 'Individual',
        'users': 'Family',
        'zap': 'EMP',
        'radiation': 'CBRN',
        'alertTriangle': 'Domestic Terrorism',
        'cloud': 'Storms',
    };
    
    return iconMap[icon] || icon;
};

export const TagValueDisplay = ({ value, field, title }: { value: string | { icon: 'user' | 'users' | 'zap' | 'radiation' | 'alertTriangle' | 'users' | 'cloud' | 'baby' | 'userCheck' | 'venus' | 'mars' }, field?: string, title?: string }) => {
    if (typeof value === 'object' && value.icon) {
        const displayTitle = title || getIconDisplayName(value.icon);
        const commonProps = { className: "w-3.5 h-3.5", title: displayTitle };
        
        if (value.icon === 'user') return <User {...commonProps} />;
        if (value.icon === 'users') return <Users {...commonProps} />;
        if (value.icon === 'zap') return <Zap {...commonProps} />;
        if (value.icon === 'radiation') return <Radiation {...commonProps} />;
        if (value.icon === 'alertTriangle') return <AlertTriangle {...commonProps} />;
        if (value.icon === 'cloud') return <Cloud {...commonProps} />;
        if (value.icon === 'baby') return <Baby {...commonProps} />;
        if (value.icon === 'userCheck') return <UserCheck {...commonProps} />;
        if (value.icon === 'venus') return <VenusIcon className="w-3.5 h-3.5" color="#ec4899" title={displayTitle} />;
        if (value.icon === 'mars') return <MarsIcon className="w-3.5 h-3.5" color="#3b82f6" title={displayTitle} />;
    }
    return <span title={title || (typeof value === 'string' ? value : '')}>{value}</span>;
};

const TagBadge = ({ 
    icon: Icon, 
    items, 
    className,
    label,
    alwaysExpanded = false
}: { 
    icon: any, 
    items?: string[] | null, 
    className: string,
    label: string,
    alwaysExpanded?: boolean
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    useEffect(() => {
        if (isExpanded && !alwaysExpanded) {
            const timer = setTimeout(() => setIsExpanded(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isExpanded, alwaysExpanded]);
    
    const isDemographics = label.toLowerCase() === 'people' || label.toLowerCase() === 'demographics';
    const isScenarios = label.toLowerCase() === 'scenarios';
    
    // For demographics, show all options in order with inactive ones greyed out
    if (isDemographics) {
        const activeItems = items || [];
        const allOptions = DEMOGRAPHICS;
        const formattedOptions = allOptions.map(option => formatTagValue(option, 'demographics'));
        
        return (
            <div className={`flex items-stretch overflow-hidden rounded-md border transition-all duration-200 ${className} pl-0 py-0`}>
                <div className="px-2 bg-white/10 border-r border-white/10 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                </div>
                <div className="px-2.5 py-1 flex items-center flex-wrap gap-0">
                    {allOptions.map((option, i) => {
                        const isActive = activeItems.includes(option);
                        const formattedValue = formattedOptions[i];
                        const isGenderIcon = typeof formattedValue === 'object' && (formattedValue.icon === 'venus' || formattedValue.icon === 'mars');
                        
                        return (
                            <span key={option} className="flex items-center">
                                {i > 0 && <span className="mx-1.5 w-px h-3 bg-current opacity-30" />}
                                <span className={`text-[11px] font-medium tracking-wide uppercase transition-all rounded px-1.5 py-0.5 ${
                                    isActive 
                                        ? '' 
                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                }`} title={option}>
                                    <TagValueDisplay value={formattedValue} field="demographics" title={option} />
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    // For other tags, use the original behavior
    const hasItems = items && items.length > 0;
    const canCollapse = hasItems && items.length > 2 && !alwaysExpanded;
    const isCondensed = canCollapse && !isExpanded;
    const formattedItems = hasItems ? items.map(item => {
        // Don't format "ALL Scenarios" - show as text
        if (item === 'ALL Scenarios') return item;
        return formatTagValue(item, isScenarios ? 'scenarios' : undefined);
    }) : [];
    
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                if (canCollapse) setIsExpanded(!isExpanded);
            }}
            className={`flex items-stretch overflow-hidden rounded-md border transition-all duration-200 ${className} pl-0 py-0 ${!hasItems ? 'opacity-30' : ''} ${canCollapse ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}`}
        >
            <div className="px-2 bg-white/10 border-r border-white/10 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />
            </div>
            <div className="px-2.5 py-1 flex items-center">
                {hasItems && (
                    isCondensed ? (
                        <span className="text-[11px] font-medium tracking-wide uppercase">
                            {items.length} {label}
                        </span>
                    ) : (
                        <span className="flex items-center text-[11px] font-medium tracking-wide uppercase">
                            {formattedItems.map((item, i) => (
                                <span key={i} className="flex items-center">
                                    {i > 0 && <span className="mx-1.5 w-px h-3 bg-current opacity-30" />}
                                    {typeof item === 'string' ? (
                                        <span title={item}>{item}</span>
                                    ) : (
                                        <TagValueDisplay value={item} field={isScenarios ? 'scenarios' : undefined} title={items[i]} />
                                    )}
                                </span>
                            ))}
                        </span>
                    )
                )}
                {!hasItems && (
                    <span className="text-[11px] font-medium tracking-wide uppercase italic opacity-50">
                        No {label}
                    </span>
                )}
            </div>
        </button>
    );
};

const SelectInput = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className={`w-full bg-background border border-input rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all text-sm appearance-none ${props.className || ''}`} />
);

const QuickTagger = ({
    product,
    masterItem,
    onClose
}: {
    product: Product,
    masterItem: MasterItem | undefined,
    onClose: () => void
}) => {
    const handleToggle = async (
        field: 'scenarios' | 'demographics' | 'timeframes' | 'locations',
        value: string
    ) => {
        const currentTags = product[field];
        const isInherited = currentTags === null;
        
        let newTags: string[];
        
        if (isInherited) {
            const inherited = masterItem?.[field] || [];
            if (inherited.includes(value)) {
                newTags = inherited.filter(t => t !== value);
            } else {
                newTags = [...inherited, value];
            }
        } else {
            const current = currentTags || [];
            if (current.includes(value)) {
                newTags = current.filter(t => t !== value);
            } else {
                newTags = [...current, value];
            }
        }
        
        await updateProductTags(product.id, {
            scenarios: field === 'scenarios' ? newTags : (product.scenarios ?? null),
            demographics: field === 'demographics' ? newTags : (product.demographics ?? null),
            timeframes: field === 'timeframes' ? newTags : (product.timeframes ?? null),
            locations: field === 'locations' ? newTags : (product.locations ?? null),
        });
    };

    const handleReset = async (field: 'scenarios' | 'demographics' | 'timeframes' | 'locations') => {
        await updateProductTags(product.id, {
            scenarios: field === 'scenarios' ? null : (product.scenarios ?? null),
            demographics: field === 'demographics' ? null : (product.demographics ?? null),
            timeframes: field === 'timeframes' ? null : (product.timeframes ?? null),
            locations: field === 'locations' ? null : (product.locations ?? null),
        });
    };

    const TagSection = ({ 
        title, 
        items, 
        field, 
        icon: Icon 
    }: { 
        title: string, 
        items: string[], 
        field: 'scenarios' | 'demographics' | 'timeframes' | 'locations',
        icon: any
    }) => {
        const currentValues = product[field];
        const isInherited = currentValues === null;
        const effectiveValues = isInherited ? (masterItem?.[field] || []) : (currentValues || []);

        // Get color classes matching TagBadge style
        let badgeClassName = 'text-primary bg-primary/10 border-primary/20';
        if (field === 'scenarios') badgeClassName = 'text-destructive bg-destructive/10 border-destructive/20';
        if (field === 'demographics') badgeClassName = 'text-success bg-success/10 border-success/20';
        if (field === 'timeframes') badgeClassName = 'text-primary bg-primary/10 border-primary/20';
        if (field === 'locations') badgeClassName = 'text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50';

        const formattedItems = items.map(item => formatTagValue(item, field));
        const hasActiveItems = effectiveValues && effectiveValues.length > 0;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs mb-2 pr-4">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium uppercase tracking-wider">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
                        {title}
                    </div>
                    {!isInherited ? (
                        <button
                            onClick={() => handleReset(field)}
                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors opacity-60 hover:opacity-100"
                            title="Reset to Master Item defaults"
                        >
                            <Unlink className="w-3 h-3" strokeWidth={2.5} />
                            Reset
                        </button>
                    ) : (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 italic cursor-help" title="Inheriting from Master Item">
                            <Unlink className="w-3 h-3 opacity-30" strokeWidth={2.5} />
                            Inherited
                        </span>
                    )}
                </div>
                <div className={`flex items-stretch overflow-hidden rounded-md border transition-all duration-200 pl-0 py-0 ${hasActiveItems ? badgeClassName : 'bg-muted text-muted-foreground border-border'}`}>
                    <div className="px-2 bg-white/10 border-r border-white/10 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" strokeWidth={2.5} />
                    </div>
                    <div className="px-2.5 py-1 flex items-center flex-wrap gap-0">
                        {items.map((item, i) => {
                            const isActive = effectiveValues!.includes(item);
                            const formattedValue = formattedItems[i];
                            
                            return (
                                <span key={item} className="flex items-center">
                                    {i > 0 && <span className="mx-1.5 w-px h-3 bg-current opacity-30" />}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(field, item);
                                        }}
                                        className={`text-[11px] font-medium tracking-wide uppercase transition-colors hover:opacity-80 ${
                                            isActive ? '' : 'opacity-50'
                                        }`}
                                        title={item}
                                    >
                                        <TagValueDisplay value={formattedValue} field={field} title={item} />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="bg-card border-x border-b border-border py-6 px-6 shadow-lg rounded-b-lg mx-2 -mt-[1px] relative"
            onClick={(e) => e.stopPropagation()}
            style={{
                animation: 'slideDown 250ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close"
            >
                <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        max-height: 0;
                        padding-top: 0;
                        padding-bottom: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        max-height: 500px;
                        padding-top: 1.5rem;
                        padding-bottom: 1.5rem;
                        transform: translateY(0);
                    }
                }
            `}</style>
             <div className="flex flex-wrap gap-12 justify-center">
                <div className="min-w-[180px]">
                    <TagSection title="Scenarios" items={SCENARIOS} field="scenarios" icon={Shield} />
                </div>
                <div className="min-w-[140px]">
                    <TagSection title="People" items={DEMOGRAPHICS} field="demographics" icon={Users} />
                </div>
                <div className="min-w-[140px]">
                    <TagSection title="Timeframes" items={TIMEFRAMES} field="timeframes" icon={Clock} />
                </div>
                <div className="min-w-[140px]">
                    <TagSection title="Locations" items={LOCATIONS} field="locations" icon={MapPin} />
                </div>
             </div>
        </div>
    );
};

// --- Main Component ---
export default function ProductsClient({ 
    products, 
    masterItems, 
    suppliers,
    categories 
}: { 
    products: any[], 
    masterItems: MasterItem[], 
    suppliers: any[],
    categories: Category[] 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtering State
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Tags can be "Tag" or "!Tag"
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]); // Supplier IDs, can be "id" or "!id"
  const [filterPriceRange, setFilterPriceRange] = useState<string>(""); // "0-50", "50-100", "100+"
  
  // Sorting State
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc");

  // State for cascading dropdowns (Used for Category Change Modal mainly now)
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  
  // Master Items State
  const [allMasterItems, setAllMasterItems] = useState(masterItems);
  const [isMasterItemModalOpen, setIsMasterItemModalOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<MasterItem | null>(null);

  // Build category tree from flat array (like /admin/categories does)
  const categoryTree = useMemo(() => {
    const map = new Map();
    const roots: Category[] = [];

    // Initialize map
    categories.forEach(c => {
      map.set(c.id, { ...c, children: [] });
    });

    // Build hierarchy
    categories.forEach(c => {
      const node = map.get(c.id);
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [categories]);

  // Sync props to state when server revalidates
  useEffect(() => {
      setAllMasterItems(masterItems);
  }, [masterItems]);
  
  const openEditMasterItemModal = (masterItemId: string) => {
      const item = allMasterItems.find(m => m.id === masterItemId);
      if (item) {
          setEditingMasterItem(item);
          setIsMasterItemModalOpen(true);
      }
  };

  // Supplier State
  const [suppliersList, setSuppliersList] = useState(suppliers);
  
  // Collapsible Categories State
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeMasterItemId, setActiveMasterItemId] = useState<string | null>(null);

  const toggleCategory = (catId: string) => {
      setExpandedCategories(prev => {
          const next = new Set(prev);
          if (next.has(catId)) {
              next.delete(catId);
          } else {
              next.add(catId);
          }
          return next;
      });
  };

  const toggleSubCategory = (subCatId: string) => {
      setExpandedSubCategories(prev => {
          const next = new Set(prev);
          if (next.has(subCatId)) {
              next.delete(subCatId);
          } else {
              next.add(subCatId);
          }
          return next;
      });
  };

  const handleCategorySelect = (catId: string) => {
      setActiveCategoryId(prev => prev === catId ? null : catId);
      setActiveMasterItemId(null); // Clear master item selection when category changes
  };

  const handleMasterItemSelect = (masterItemId: string) => {
      setActiveMasterItemId(prev => prev === masterItemId ? null : masterItemId);
  };

  const expandAllCategories = () => {
      const allCatIds = Object.keys(groupedProducts);
      setExpandedCategories(new Set(allCatIds));
      
      // Also expand all subcategories
      const allSubCatIds = new Set<string>();
      Object.values(groupedProducts).forEach(group => {
          Object.values(group.subGroups).forEach(subGroup => {
              if (subGroup.subCategory) {
                  allSubCatIds.add(subGroup.subCategory.id);
              }
          });
      });
      setExpandedSubCategories(allSubCatIds);
  };

  const collapseAllCategories = () => {
      setExpandedCategories(new Set());
      setExpandedSubCategories(new Set());
  };

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; product: Product } | null>(null);
  const [supplierSubmenuOpen, setSupplierSubmenuOpen] = useState(false);
  const [supplierSubmenuPosition, setSupplierSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const supplierButtonRef = useRef<HTMLDivElement>(null);

  const [copiedTags, setCopiedTags] = useState<{
      scenarios: string[] | null;
      demographics: string[] | null;
      timeframes: string[] | null;
      locations: string[] | null;
      sourceName: string;
  } | null>(null);
  const [pasteConfirmModal, setPasteConfirmModal] = useState<{
      targetMasterItem: MasterItem;
  } | null>(null);
  
  // Category Change Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalProduct, setCategoryModalProduct] = useState<Product | null>(null);
  const [categoryModalCategory, setCategoryModalCategory] = useState<string>("");
  const [categoryModalSubCategory, setCategoryModalSubCategory] = useState<string>("");
  const [categoryModalMasterItem, setCategoryModalMasterItem] = useState<string>("");

  // Category Context Menu State
  const [categoryContextMenu, setCategoryContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    category: Category | null;
  }>({ visible: false, x: 0, y: 0, category: null });

  // Master Item Context Menu State
  const [masterItemContextMenu, setMasterItemContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    masterItem: MasterItem | null;
  }>({ visible: false, x: 0, y: 0, masterItem: null });

  // Category Edit/Delete Dialog State
  const [editingCategoryDialog, setEditingCategoryDialog] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<{
    subcategoryCount: number;
    masterItemCount: number;
    affectedItems: Array<{ id: string; name: string }>;
  } | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [isBulkSupplierModalOpen, setIsBulkSupplierModalOpen] = useState(false);
  const [bulkSupplierId, setBulkSupplierId] = useState<string>("");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Quick Tagging State
  const [taggingProductId, setTaggingProductId] = useState<string | null>(null);

  // Add To Bundle Modal State
  const [isAddToBundleModalOpen, setIsAddToBundleModalOpen] = useState(false);
  const [addToBundleProduct, setAddToBundleProduct] = useState<Product | null>(null);
  
  const openAddToBundleModal = (product: Product) => {
      setAddToBundleProduct(product);
      setIsAddToBundleModalOpen(true);
  };

  useEffect(() => {
    if (toastMessage) {
          const timer = setTimeout(() => setToastMessage(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toastMessage]);

  // Close context menu on click outside
  useEffect(() => {
      const handleClick = () => {
          setContextMenu(null);
          setSupplierSubmenuOpen(false);
      };
      if (contextMenu) {
          const timer = setTimeout(() => {
              window.addEventListener('click', handleClick);
          }, 10);
          return () => {
              clearTimeout(timer);
              window.removeEventListener('click', handleClick);
          };
      }
  }, [contextMenu]);

  // Close tagging interface on click outside
  useEffect(() => {
      const handleClick = () => setTaggingProductId(null);
      if (taggingProductId) {
          const timer = setTimeout(() => {
              window.addEventListener('click', handleClick);
          }, 10);
          return () => {
              clearTimeout(timer);
              window.removeEventListener('click', handleClick);
          };
      }
  }, [taggingProductId]);

  // Category Context Menu Handlers
  const handleCategoryContextMenu = (e: React.MouseEvent, category: Category) => {
      e.preventDefault();
      e.stopPropagation();
      // Close master item menu if open
      setMasterItemContextMenu(prev => ({ ...prev, visible: false }));
      // Close product menu if open
      setContextMenu(null);
      setCategoryContextMenu({
          visible: true,
          x: e.pageX,
          y: e.pageY,
          category
      });
  };

  const handleCategoryEdit = (category: Category) => {
      setEditingCategoryDialog(category);
      setCategoryContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleCategoryDelete = async (category: Category) => {
      setCategoryContextMenu(prev => ({ ...prev, visible: false }));

      const impactRes = await getCategoryImpact(category.id);
      if (impactRes.success && impactRes.data) {
          setDeletingCategory(category);
          setDeleteImpact(impactRes.data);
      }
  };

  const handleConfirmDeleteCategory = async () => {
      if (!deletingCategory) return;

      try {
          const res = await deleteCategory(deletingCategory.id);
          if (res.success) {
              setDeletingCategory(null);
              setDeleteImpact(null);
              window.location.reload();
          } else {
              alert('Failed to delete: ' + res.message);
          }
      } catch (error) {
          console.error('Delete failed:', error);
      }
  };

  // Master Item Context Menu Handlers
  const handleMasterItemContextMenu = (e: React.MouseEvent, masterItem: MasterItem) => {
      e.preventDefault();
      e.stopPropagation();
      // Close category menu if open
      setCategoryContextMenu(prev => ({ ...prev, visible: false }));
      // Close product menu if open
      setContextMenu(null);
      setMasterItemContextMenu({
          visible: true,
          x: e.pageX,
          y: e.pageY,
          masterItem
      });
  };

  const handleMasterItemEdit = (masterItem: MasterItem) => {
      openEditMasterItemModal(masterItem.id);
      setMasterItemContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Close context menus on global click or Escape
  useEffect(() => {
      const handleClick = () => {
          if (categoryContextMenu.visible) {
              setCategoryContextMenu(prev => ({ ...prev, visible: false }));
          }
          if (masterItemContextMenu.visible) {
              setMasterItemContextMenu(prev => ({ ...prev, visible: false }));
          }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              if (categoryContextMenu.visible) {
                  setCategoryContextMenu(prev => ({ ...prev, visible: false }));
              }
              if (masterItemContextMenu.visible) {
                  setMasterItemContextMenu(prev => ({ ...prev, visible: false }));
              }
          }
      };

      if (categoryContextMenu.visible || masterItemContextMenu.visible) {
          const timer = setTimeout(() => {
              window.addEventListener('click', handleClick);
              window.addEventListener('keydown', handleKeyDown);
          }, 10);

          return () => {
              clearTimeout(timer);
              window.removeEventListener('click', handleClick);
              window.removeEventListener('keydown', handleKeyDown);
          };
      }
  }, [categoryContextMenu.visible, masterItemContextMenu.visible]);

  const handleCopyTags = (masterItem: MasterItem) => {
      setCopiedTags({
          scenarios: masterItem.scenarios || null,
          demographics: masterItem.demographics || null,
          timeframes: masterItem.timeframes || null,
          locations: masterItem.locations || null,
          sourceName: masterItem.name
      });
      setMasterItemContextMenu(prev => ({ ...prev, visible: false }));
      setToastMessage(`Tags copied from "${masterItem.name}"`);
  };

  const handlePasteTags = (targetMasterItem: MasterItem) => {
      setMasterItemContextMenu(prev => ({ ...prev, visible: false }));
      if (!copiedTags) return;
      
      // Check if target has existing tags
      const hasExistingTags = 
          (targetMasterItem.scenarios && targetMasterItem.scenarios.length > 0) ||
          (targetMasterItem.demographics && targetMasterItem.demographics.length > 0) ||
          (targetMasterItem.timeframes && targetMasterItem.timeframes.length > 0) ||
          (targetMasterItem.locations && targetMasterItem.locations.length > 0);
      
      if (hasExistingTags) {
          setPasteConfirmModal({ targetMasterItem });
      } else {
          executePaste(targetMasterItem);
      }
  };

  const executePaste = async (targetMasterItem: MasterItem) => {
      if (!copiedTags) return;
      
      const formData = new FormData();
      formData.append('id', targetMasterItem.id);
      formData.append('name', targetMasterItem.name);
      formData.append('description', targetMasterItem.description || '');
      
      copiedTags.scenarios?.forEach(s => formData.append('scenarios', s));
      copiedTags.demographics?.forEach(d => formData.append('demographics', d));
      copiedTags.timeframes?.forEach(t => formData.append('timeframes', t));
      copiedTags.locations?.forEach(l => formData.append('locations', l));
      
      try {
          await updateMasterItem(formData);
          // Update local state
          setAllMasterItems(prev => prev.map(m => 
              m.id === targetMasterItem.id 
                  ? { 
                      ...m, 
                      scenarios: copiedTags.scenarios || [],
                      demographics: copiedTags.demographics || [],
                      timeframes: copiedTags.timeframes || [],
                      locations: copiedTags.locations || []
                  } 
                  : m
          ));
          setToastMessage(`Tags pasted to "${targetMasterItem.name}"`);
      } catch (error) {
          setToastMessage('Failed to paste tags');
      }
      setPasteConfirmModal(null);
  };

  const handleContextMenu = (e: React.MouseEvent, product: Product) => {
      if (selectedIds.size >= 2) {
          e.preventDefault();
          setToastMessage("Right-click menu not available in multi-select");
          return;
      }
      e.preventDefault();
      // Close category menu if open
      setCategoryContextMenu(prev => ({ ...prev, visible: false }));
      // Close master item menu if open
      setMasterItemContextMenu(prev => ({ ...prev, visible: false }));
      setContextMenu({ x: e.clientX, y: e.clientY, product });
  };

  const openCategoryModal = (product: Product) => {
      setCategoryModalProduct(product);
      setContextMenu(null);
      
      // Initialize category dropdowns based on product's current master item
      const master = allMasterItems.find(m => m.id === product.masterItemId);
      if (master) {
          const cat = categories.find(c => c.id === master.categoryId); // Fixed: use camelCase
          if (cat) {
              if (cat.parentId) {
                  setCategoryModalCategory(cat.parentId);
                  setCategoryModalSubCategory(cat.id);
              } else {
                  setCategoryModalCategory(cat.id);
                  setCategoryModalSubCategory("");
              }
          } else {
              setCategoryModalCategory("");
              setCategoryModalSubCategory("");
          }
          setCategoryModalMasterItem(product.masterItemId);
      } else {
          setCategoryModalCategory("");
          setCategoryModalSubCategory("");
          setCategoryModalMasterItem("");
      }
      
      setIsCategoryModalOpen(true);
  };

  // Derived lists for category modal
  const categoryModalSubCategories = useMemo(() => {
      if (!categoryModalCategory) return [];
      return categories.filter(c => c.parentId === categoryModalCategory);
  }, [categories, categoryModalCategory]);

  const categoryModalFilteredMasterItems = useMemo(() => {
      if (categoryModalSubCategory) {
          return allMasterItems.filter(m => m.categoryId === categoryModalSubCategory); // Fixed: use camelCase
      }
      if (categoryModalCategory) {
          const childCategoryIds = categories
              .filter(c => c.parentId === categoryModalCategory)
              .map(c => c.id);
          const relevantIds = new Set([categoryModalCategory, ...childCategoryIds]);
          return allMasterItems.filter(m => relevantIds.has(m.categoryId)); // Fixed: use camelCase
      }
      return [];
  }, [allMasterItems, categoryModalCategory, categoryModalSubCategory, categories]);

  const handleSaveCategoryChange = async () => {
      if (!categoryModalMasterItem) return;
      
      if (categoryModalProduct) {
        const formData = new FormData();
        formData.append('id', categoryModalProduct.id);
        formData.append('name', categoryModalProduct.name || '');
        formData.append('masterItemId', categoryModalMasterItem);

        if (categoryModalProduct.supplierId) {
            formData.append('supplierId', categoryModalProduct.supplierId);
        }

        formData.append('price', String(categoryModalProduct.price ?? 0));
        formData.append('type', categoryModalProduct.type || 'AFFILIATE');
        formData.append('productUrl', categoryModalProduct.productUrl || '');
        formData.append('imageUrl', categoryModalProduct.imageUrl || '');
        formData.append('description', categoryModalProduct.description || '');
        formData.append('asin', categoryModalProduct.asin || categoryModalProduct.sku || '');
        
        if (categoryModalProduct.metadata) {
            Object.entries(categoryModalProduct.metadata).forEach(([key, val]) => {
                if (val != null) formData.append(`meta_${key}`, String(val));
            });
        }
        
        await updateProduct(formData);
      } else if (selectedIds.size > 0) {
          await bulkUpdateProducts(Array.from(selectedIds), { masterItemId: categoryModalMasterItem });
          setSelectedIds(new Set());
      }

      setIsCategoryModalOpen(false);
      setCategoryModalProduct(null);
  };

  // Derived Lists
  const rootCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);

  // New Modal State
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isAmazonSearchModalOpen, setIsAmazonSearchModalOpen] = useState(false);
  const [preSelectedCategory, setPreSelectedCategory] = useState<string>("");
  const [preSelectedSubCategory, setPreSelectedSubCategory] = useState<string>("");
  const [preSelectedMasterItem, setPreSelectedMasterItem] = useState<string>("");

  const resolvePreSelectedCategories = () => {
      // Priority 1: Active Master Item Selection
      if (activeMasterItemId) {
          const master = allMasterItems.find(m => m.id === activeMasterItemId);
          if (master) {
              const cat = categories.find(c => c.id === master.categoryId); // Fixed: use camelCase
              if (cat) {
                  if (cat.parentId) {
                      setPreSelectedCategory(cat.parentId);
                      setPreSelectedSubCategory(cat.id);
                  } else {
                      setPreSelectedCategory(cat.id);
                      setPreSelectedSubCategory("");
                  }
              }
              setPreSelectedMasterItem(activeMasterItemId);
              return;
          }
      }
      
      // Priority 2: Active Category/SubCategory Selection
      if (activeCategoryId && activeCategoryId !== 'uncategorized') {
          const cat = categories.find(c => c.id === activeCategoryId);
          if (cat) {
              if (cat.parentId) {
                  setPreSelectedCategory(cat.parentId);
                  setPreSelectedSubCategory(cat.id);
              } else {
                  setPreSelectedCategory(cat.id);
                  setPreSelectedSubCategory("");
              }
              setPreSelectedMasterItem("");
              return;
          }
      }

      // Default: No pre-selection
      setPreSelectedCategory("");
      setPreSelectedSubCategory("");
      setPreSelectedMasterItem("");
  };

  const handleManualSelect = () => {
      setIsChoiceModalOpen(false);
      setEditingProduct(null);
      resolvePreSelectedCategories();
      setIsModalOpen(true);
  };

  const handleAmazonSelect = () => {
      setIsChoiceModalOpen(false);
      setIsAmazonSearchModalOpen(true);
  };

  const handleAmazonProductSelected = (product: any) => {
      setIsAmazonSearchModalOpen(false);
      
      // Map Amazon product to partial Product
      const mappedProduct: Partial<Product> = {
          name: product.name,
          asin: product.asin,
          imageUrl: product.image_url,
          price: product.price,
          productUrl: product.url,
          description: product.description,
          metadata: {
              quantity: product.capacity_value,
              rating: product.rating,
              reviews: product.reviews,
              weight: product.weight,
              weight_unit: product.weight_unit
          }
      };
      
      setEditingProduct(mappedProduct as Product); 
      resolvePreSelectedCategories();
      setIsModalOpen(true);
  };
  
  // Initialize form state when opening modal
  const openEditModal = (product: Product) => {
      setEditingProduct(product);
      setPreSelectedCategory(""); // Reset for edit mode (it uses product's master item)
      setPreSelectedSubCategory("");
      setIsModalOpen(true);
  };

  const openNewModal = () => {
      setIsChoiceModalOpen(true);
  };

  // Sorting Helper
  const handleSort = (field: string) => {
      if (sortField === field) {
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortDirection('asc');
      }
  };

  const SortIcon = ({ field }: { field: string }) => {
      if (sortField !== field) return <div className="w-4 h-4 opacity-0 group-hover/th:opacity-30 flex flex-col -space-y-1"><ChevronUp className="w-3 h-3" /><ChevronDown className="w-3 h-3" /></div>;
      return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" strokeWidth={2.5} /> : <ChevronDown className="w-4 h-4 text-primary" strokeWidth={2.5} />;
  };

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let result = products.filter(p => {
        // Text Search
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term || (
            (p.name && p.name.toLowerCase().includes(term)) ||
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.asin && p.asin.toLowerCase().includes(term)) ||
            (p.supplier?.name && p.supplier.name.toLowerCase().includes(term))
        );

        // Tag Filter (with include/exclude support)
        let matchesTags = true;
        if (selectedTags.length > 0) {
            const master = masterItems.find(m => m.id === p.masterItemId);
            const allProductTags = new Set([
                ...(p.scenarios || master?.scenarios || []),
                ...(p.demographics || master?.demographics || []),
                ...(p.timeframes || master?.timeframes || []),
                ...(p.locations || master?.locations || []),
                ...(master?.scenarios || []),
                ...(master?.demographics || []),
                ...(master?.timeframes || []),
                ...(master?.locations || [])
            ]);
            
            const includeTags = selectedTags.filter(t => !t.startsWith('!')).map(t => t);
            const excludeTags = selectedTags.filter(t => t.startsWith('!')).map(t => t.slice(1));
            
            const hasAllInclude = includeTags.every(tag => allProductTags.has(tag));
            const hasNoExclude = excludeTags.every(tag => !allProductTags.has(tag));
            matchesTags = hasAllInclude && hasNoExclude;
        }

        // Supplier Filter (with include/exclude support)
        let matchesSupplier = true;
        if (selectedSuppliers.length > 0) {
            const includeSuppliers = selectedSuppliers.filter(s => !s.startsWith('!')).map(s => s);
            const excludeSuppliers = selectedSuppliers.filter(s => s.startsWith('!')).map(s => s.slice(1));
            
            // If there are include suppliers, must match one of them
            const matchesInclude = includeSuppliers.length === 0 || includeSuppliers.includes(p.supplierId);
            // Must not match any exclude suppliers
            const matchesExclude = !excludeSuppliers.includes(p.supplierId);
            matchesSupplier = matchesInclude && matchesExclude;
        }

        // Price Filter
        let matchesPrice = true;
        if (filterPriceRange) {
            const price = Number(p.price) || 0;
            if (filterPriceRange === "0-50") matchesPrice = price < 50;
            else if (filterPriceRange === "50-100") matchesPrice = price >= 50 && price <= 100;
            else if (filterPriceRange === "100-500") matchesPrice = price > 100 && price <= 500;
            else if (filterPriceRange === "500+") matchesPrice = price > 500;
        }

        return matchesSearch && matchesTags && matchesSupplier && matchesPrice;
    });

    // Sorting
    result.sort((a, b) => {
        let valA = a[sortField as keyof Product] as any;
        let valB = b[sortField as keyof Product] as any;

        if (sortField === 'supplier') {
            valA = a.supplier?.name || '';
            valB = b.supplier?.name || '';
        }
        
        if (sortField === 'master_item') {
            const masterA = masterItems.find(m => m.id === a.masterItemId);
            const masterB = masterItems.find(m => m.id === b.masterItemId);
            valA = masterA?.name || '';
            valB = masterB?.name || '';
        }

        // Handle price sorting - convert string to number
        if (sortField === 'price') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
        } else {
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [products, searchTerm, selectedTags, selectedSuppliers, filterPriceRange, sortField, sortDirection, masterItems]);

  // Grouping Logic
  const groupedProducts = useMemo(() => {
      type MasterGroup = { masterItem: MasterItem | null, products: Product[] };
      type SubGroup = { subCategory: Category | null, masterItems: Record<string, MasterGroup> };
      type CategoryGroup = { category: Category, subGroups: Record<string, SubGroup> };
      
      const groups: Record<string, CategoryGroup> = {};
      
      const ensureGroup = (catId: string, subCatId: string | null) => {
          if (!groups[catId]) {
              if (catId === 'uncategorized') {
                  groups[catId] = {
                      category: { id: 'uncategorized', name: 'Uncategorized', parentId: null, description: null, icon: null },
                      subGroups: {}
                  };
              } else {
                  const cat = categories.find(c => c.id === catId);
                  if (!cat) return null;
                  groups[catId] = { category: cat, subGroups: {} };
              }
          }
          
          const subKey = subCatId || 'root';
          if (!groups[catId].subGroups[subKey]) {
              const subCat = subCatId ? categories.find(c => c.id === subCatId) || null : null;
              groups[catId].subGroups[subKey] = { subCategory: subCat, masterItems: {} };
          }
          return groups[catId].subGroups[subKey];
      };

      processedProducts.forEach(p => {
          const masterItem = allMasterItems.find(m => m.id === p.masterItemId);
          let catId = 'uncategorized';
          let subCatId = null;

          if (masterItem) {
               const cat = categories.find(c => c.id === masterItem.categoryId); // Fixed: use camelCase
               if (cat) {
                   if (cat.parentId) {
                       catId = cat.parentId;
                       subCatId = cat.id;
                   } else {
                       catId = cat.id;
                   }
               }
          }

          const group = ensureGroup(catId, subCatId);
          if (group) {
              const masterId = p.masterItemId || 'nomaster';
              if (!group.masterItems[masterId]) {
                  group.masterItems[masterId] = { masterItem: masterItem || null, products: [] };
              }
              group.masterItems[masterId].products.push(p);
          }
      });

      return groups;
  }, [processedProducts, allMasterItems, categories]);

  const visibleProductIds = useMemo(() => {
      const ids: string[] = [];
      const sortedGroups = Object.values(groupedProducts).sort((a, b) => {
          if (a.category.id === 'uncategorized') return 1;
          if (b.category.id === 'uncategorized') return -1;
          return a.category.name.localeCompare(b.category.name);
      });

      sortedGroups.forEach(group => {
          if (expandedCategories.has(group.category.id)) {
              Object.values(group.subGroups).forEach(subGroup => {
                  Object.values(subGroup.masterItems).forEach(masterGroup => {
                      masterGroup.products.forEach(p => ids.push(p.id));
                  });
              });
          }
      });
      return ids;
  }, [groupedProducts, expandedCategories]);

  const handleProductClick = (e: React.MouseEvent, productId: string) => {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('input')) return;
      
      if (e.shiftKey) {
          window.getSelection()?.removeAllRanges();
      }

      const newSelectedIds = new Set(selectedIds);
      
      if (e.shiftKey && lastSelectedId) {
          const start = visibleProductIds.indexOf(lastSelectedId);
          const end = visibleProductIds.indexOf(productId);
          
          if (start !== -1 && end !== -1) {
              const [lower, upper] = start < end ? [start, end] : [end, start];
              
              if (!e.ctrlKey && !e.metaKey) {
                  newSelectedIds.clear();
              }

              for (let i = lower; i <= upper; i++) {
                  newSelectedIds.add(visibleProductIds[i]);
              }
          } else {
              newSelectedIds.add(productId);
          }
      } else if (e.ctrlKey || e.metaKey) {
          if (newSelectedIds.has(productId)) {
              newSelectedIds.delete(productId);
          } else {
              newSelectedIds.add(productId);
          }
          setLastSelectedId(productId);
      } else {
          newSelectedIds.clear();
          newSelectedIds.add(productId);
          setLastSelectedId(productId);
      }
      
      setSelectedIds(newSelectedIds);
  };

  const handleExport = async () => {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Emergency Planner';
      workbook.created = new Date();

      // Helper to create styled sheet
      const createSheet = (name: string, columns: any[], data: any[]) => {
          const sheet = workbook.addWorksheet(name, {
              views: [{ state: 'frozen', ySplit: 1 }]
          });
          
          sheet.columns = columns;
          data.forEach(row => sheet.addRow(row));

          // Style Header
          const headerRow = sheet.getRow(1);
          headerRow.height = 30;
          headerRow.eachCell((cell: any) => {
              cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF1E293B' } // Dark Slate
              };
              cell.font = {
                  color: { argb: 'FFFFFFFF' }, // White
                  bold: true,
                  size: 12
              };
              cell.alignment = { vertical: 'middle', horizontal: 'left' };
              cell.border = {
                  bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } // Blue border
              };
          });

          // Style Data Rows
          sheet.eachRow((row: any, rowNumber: any) => {
              if (rowNumber > 1) {
                  row.height = 24;
                  row.eachCell((cell: any) => {
                      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
                      cell.border = {
                          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                      };
                  });
                  // Zebra Striping
                  if (rowNumber % 2 === 0) {
                      row.eachCell((cell: any) => {
                          cell.fill = {
                               type: 'pattern',
                               pattern: 'solid',
                               fgColor: { argb: 'FFF8FAFC' } // Light Grey
                          };
                      });
                  }
              }
          });
      };

      // 1. Products Sheet
      const allMetaKeys = new Set<string>();
      products.forEach(p => {
          if(p.metadata) Object.keys(p.metadata).forEach(k => allMetaKeys.add(k));
      });
      
      const productsColumns = [
          { header: 'ID', key: 'id', width: 32 },
          { header: 'Name', key: 'name', width: 40 },
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'ASIN', key: 'asin', width: 15 },
          { header: 'Description', key: 'description', width: 50 },
          { header: 'Price', key: 'price', width: 12, style: { numFmt: '"$"#,##0.00' } },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Supplier', key: 'supplier', width: 25 },
          { header: 'Master Item', key: 'master_item', width: 25 },
          { header: 'Category', key: 'category', width: 20 },
          { header: 'Subcategory', key: 'subcategory', width: 20 },
          { header: 'Product URL', key: 'product_url', width: 35 },
          { header: 'Image URL', key: 'image_url', width: 35 },
          { header: 'Scenarios', key: 'scenarios', width: 30 },
          { header: 'Demographics', key: 'demographics', width: 30 },
          { header: 'Timeframes', key: 'timeframes', width: 30 },
          { header: 'Locations', key: 'locations', width: 30 },
          ...Array.from(allMetaKeys).map(k => ({ header: `Meta: ${k}`, key: `meta_${k}`, width: 20 }))
      ];

      const productsData = products.map(p => {
          const masterItem = masterItems.find(m => m.id === p.masterItemId);
          const category = masterItem ? categories.find(c => c.id === masterItem.categoryId) : null; // Fixed: use camelCase
          const parentCategory = category?.parentId ? categories.find(c => c.id === category.parentId) : null;
          
          const metaObj: any = {};
          if (p.metadata) Object.entries(p.metadata).forEach(([k, v]) => metaObj[`meta_${k}`] = v);

          return {
              id: p.id,
              name: p.name,
              sku: p.sku,
              asin: p.asin,
              description: p.description,
              price: p.price,
              type: p.type,
              supplier: p.supplier?.name,
              master_item: masterItem?.name,
              category: parentCategory ? parentCategory.name : (category?.name || "Uncategorized"),
              subcategory: parentCategory ? category?.name : "",
              product_url: p.productUrl,
              image_url: p.imageUrl,
              scenarios: (p.scenarios || masterItem?.scenarios || []).join(", "),
              demographics: (p.demographics || masterItem?.demographics || []).join(", "),
              timeframes: (p.timeframes || masterItem?.timeframes || []).join(", "),
              locations: (p.locations || masterItem?.locations || []).join(", "),
              ...metaObj
          };
      });
      createSheet("Products", productsColumns, productsData);

      // 2. Master Items Sheet
      const masterColumns = [
          { header: 'ID', key: 'id', width: 32 },
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Category', key: 'category', width: 20 },
          { header: 'Subcategory', key: 'subcategory', width: 20 },
          { header: 'Description', key: 'description', width: 40 },
          { header: 'Scenarios', key: 'scenarios', width: 30 },
          { header: 'Demographics', key: 'demographics', width: 30 },
          { header: 'Timeframes', key: 'timeframes', width: 30 },
          { header: 'Locations', key: 'locations', width: 30 }
      ];
      const masterData = masterItems.map(m => {
           const category = categories.find(c => c.id === m.categoryId); // Fixed: use camelCase
           const parentCategory = category?.parentId ? categories.find(c => c.id === category.parentId) : null;
           return {
               id: m.id,
               name: m.name,
               description: m.description,
               category: parentCategory ? parentCategory.name : (category?.name || "Uncategorized"),
               subcategory: parentCategory ? category?.name : "",
               scenarios: (m.scenarios || []).join(", "),
               demographics: (m.demographics || []).join(", "),
               timeframes: (m.timeframes || []).join(", "),
               locations: (m.locations || []).join(", ")
           };
      });
      createSheet("Master Items", masterColumns, masterData);

      // 3. Suppliers Sheet
      createSheet("Suppliers", 
          [{ header: 'ID', key: 'id', width: 32 }, { header: 'Name', key: 'name', width: 40 }], 
          suppliers.map(s => ({ id: s.id, name: s.name }))
      );

      // 4. Categories Sheet
      const categoriesData = categories.map(c => {
          const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
          return {
              id: c.id,
              name: c.name,
              type: c.parentId ? "Subcategory" : "Category",
              parent: parent ? parent.name : ""
          };
      });
      createSheet("Categories", 
          [{ header: 'ID', key: 'id', width: 32 }, { header: 'Name', key: 'name', width: 30 }, { header: 'Type', key: 'type', width: 15 }, { header: 'Parent', key: 'parent', width: 30 }],
          categoriesData
      );

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'EmergencyPlanner_Catalog.xlsx';
      anchor.click();
      window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-6 mb-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Tags className="w-8 h-8 text-primary" strokeWidth={2.5} />
                    Products Catalog
                </h1>
                <p className="text-muted-foreground mt-1">Manage individual SKUs and link them to suppliers</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <button
                    onClick={handleExport}
                    className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap border border-border"
                >
                    <Download className="w-4 h-4" strokeWidth={2.5} />
                    Export
                </button>
                <a
                    href="/admin/import"
                    className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap border border-border"
                >
                    <Upload className="w-4 h-4" strokeWidth={2.5} />
                    Import
                </a>
                <button
                    onClick={openNewModal}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Add Product
                </button>
            </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="bg-muted/50 p-4 rounded-xl border border-border flex flex-col lg:flex-row gap-4 items-center">
            <ProductCatalogFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                selectedSuppliers={selectedSuppliers}
                onSuppliersChange={setSelectedSuppliers}
                priceRange={filterPriceRange}
                onPriceRangeChange={setFilterPriceRange}
                suppliers={suppliers}
                className="flex-1 w-full"
            />

            <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                {/* Expand/Collapse All */}
                <div className="flex gap-1 border-l border-border pl-3 ml-1">
                    <button
                        type="button"
                        onClick={expandAllCategories}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        title="Expand All"
                    >
                        <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <button
                        type="button"
                        onClick={collapseAllCategories}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        title="Collapse All"
                    >
                        <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Product List (Grouped) */}
      <div className="space-y-2">
        {Object.entries(groupedProducts).length === 0 ? (
             <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" strokeWidth={2.5} />
                <p>No products found matching your criteria.</p>
            </div>
        ) : (
            Object.values(groupedProducts)
                .sort((a, b) => {
                    if (a.category.id === 'uncategorized') return 1;
                    if (b.category.id === 'uncategorized') return -1;
                    return a.category.name.localeCompare(b.category.name);
                })
                .map(group => {
                const isExpanded = expandedCategories.has(group.category.id);
                const isCategoryActive = activeCategoryId === group.category.id;
                const itemCount = Object.values(group.subGroups).reduce((acc, g) => 
                    acc + Object.values(g.masterItems).reduce((acc2, m) => acc2 + m.products.length, 0)
                , 0);
                
                return (
                <div key={group.category.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Main Category Header - Collapsible */}
                    <div
                        className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors group/cat ${
                            isCategoryActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                        onClick={() => toggleCategory(group.category.id)}
                        onContextMenu={(e) => handleCategoryContextMenu(e, group.category)}
                    >
                         {isExpanded ? (
                             <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover/cat:text-foreground" strokeWidth={2.5} />
                         ) : (
                             <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover/cat:text-foreground" strokeWidth={2.5} />
                         )}
                         
                         <span className="category-icon" title={group.category.icon || '🗂️'}>
                            {group.category.icon || '🗂️'}
                         </span>
                         
                         <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCategorySelect(group.category.id); }}
                            className="flex items-center gap-2 flex-1 text-left"
                         >
                             <div className="flex-1 min-w-0">
                                 <span className={`text-sm font-medium transition-colors ${isCategoryActive ? 'text-primary' : ''}`}>
                                    {group.category.name}
                                 </span>
                                 {group.category.description && (
                                     <span className="text-[10px] text-muted-foreground/70 truncate italic block leading-tight">
                                         {group.category.description}
                                     </span>
                                 )}
                             </div>
                             {isCategoryActive && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Selected</span>}
                         </button>

                         <span className="text-xs text-muted-foreground/70">
                             ({itemCount})
                         </span>
                    </div>

                    {/* Subgroups - Collapsible Content */}
                    {isExpanded && (
                    <div className="grid gap-6 mt-2 ml-4">
                        {Object.values(group.subGroups).map(subGroup => {
                            const subCatId = subGroup.subCategory?.id || `root-${group.category.id}`;
                            const isSubExpanded = subGroup.subCategory ? expandedSubCategories.has(subCatId) : true;
                            const isSubActive = subGroup.subCategory ? activeCategoryId === subGroup.subCategory.id : false;

                            // Sort Master Items by Name (or keep original order?)
                            // Using sort by name for consistency as previously products were sorted but now we have groups.
                            const sortedMasterGroups = Object.values(subGroup.masterItems).sort((a, b) => {
                                const nameA = a.masterItem?.name || 'Uncategorized';
                                const nameB = b.masterItem?.name || 'Uncategorized';
                                return nameA.localeCompare(nameB);
                            });

                            return (
                            <div key={subCatId} className="transition-colors">
                                {/* Subcategory Header (if exists) */}
                                {subGroup.subCategory && (
                                    <div
                                        className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors group/subcat ${
                                            isSubActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        }`}
                                        onClick={() => toggleSubCategory(subCatId)}
                                        onContextMenu={(e) => handleCategoryContextMenu(e, subGroup.subCategory!)}
                                    >
                                        {isSubExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover/subcat:text-foreground" strokeWidth={2.5} />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover/subcat:text-foreground" strokeWidth={2.5} />
                                        )}
                                        
                                        <span className="category-icon" title={subGroup.subCategory.icon || '📁'}>
                                            {subGroup.subCategory.icon || '📁'}
                                        </span>
                                        
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleCategorySelect(subGroup.subCategory!.id); }}
                                            className="flex items-center gap-2 flex-1 text-left"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-medium transition-colors ${isSubActive ? 'text-primary' : ''}`}>
                                                    {subGroup.subCategory.name}
                                                </span>
                                                {subGroup.subCategory.description && (
                                                    <span className="text-[10px] text-muted-foreground/70 truncate italic block leading-tight">
                                                        {subGroup.subCategory.description}
                                                    </span>
                                                )}
                                            </div>
                                            {isSubActive && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Selected</span>}
                                        </button>
                                        
                                        <span className="text-xs text-muted-foreground/70">
                                            ({Object.values(subGroup.masterItems).reduce((acc, m) => acc + m.products.length, 0)})
                                        </span>
                                    </div>
                                )}
                                
                                {/* Master Items Groups */}
                                {(isSubExpanded || !subGroup.subCategory) && (
                                <div className="space-y-4 mt-2 ml-4">
                                    {sortedMasterGroups.map(masterGroup => {
                                        const isMasterActive = masterGroup.masterItem?.id === activeMasterItemId;
                                        return (
                                        <div key={masterGroup.masterItem?.id || 'nomaster'} className="bg-card border rounded-xl overflow-hidden shadow-sm transition-colors">
                                            {/* Master Item Header */}
                                            {masterGroup.masterItem && (
                                                <div
                                                    className={`px-6 py-3 cursor-pointer transition-colors ${
                                                        isMasterActive
                                                            ? 'bg-success/10'
                                                            : 'bg-muted/40 hover:bg-muted/60'
                                                    }`}
                                                    onClick={() => handleMasterItemSelect(masterGroup.masterItem!.id)}
                                                    onContextMenu={(e) => handleMasterItemContextMenu(e, masterGroup.masterItem!)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-1.5">
                                                                <h4 className={`text-sm font-semibold truncate ${isMasterActive ? 'text-success' : 'text-foreground'}`}>
                                                                    {masterGroup.masterItem.name}
                                                                </h4>
                                                                {isMasterActive && (
                                                                    <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">
                                                                        Selected
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            {masterGroup.masterItem.description && (
                                                                <p className="text-xs text-muted-foreground mb-2 max-w-4xl line-clamp-2">
                                                                    {masterGroup.masterItem.description}
                                                                </p>
                                                            )}
                                                            
                                                            {/* Visual Tags Display */}
                                                            <div className="flex flex-wrap gap-2 items-center">
                                                                <TagBadge
                                                                    icon={Shield}
                                                                    items={
                                                                        masterGroup.masterItem.scenarios?.length === SCENARIOS.length
                                                                            ? ['ALL Scenarios']
                                                                            : masterGroup.masterItem.scenarios
                                                                    }
                                                                    className="text-destructive bg-destructive/10 border-destructive/20"
                                                                    label="Scenarios"
                                                                    alwaysExpanded
                                                                />
                                                                <TagBadge
                                                                    icon={Users}
                                                                    items={masterGroup.masterItem.demographics}
                                                                    className="text-success bg-success/10 border-success/20"
                                                                    label="People"
                                                                    alwaysExpanded
                                                                />
                                                                <TagBadge
                                                                    icon={Clock}
                                                                    items={masterGroup.masterItem.timeframes}
                                                                    className="text-primary bg-primary/10 border-primary/20"
                                                                    label="Times"
                                                                    alwaysExpanded
                                                                />
                                                                <TagBadge
                                                                    icon={MapPin}
                                                                    items={masterGroup.masterItem.locations}
                                                                    className="text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50"
                                                                    label="Locs"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Products Table */}
                                            <table className="w-full text-left text-sm text-muted-foreground table-fixed">
                                                <thead className="bg-background/50 text-muted-foreground text-[10px] uppercase font-medium border-b border-border/50">
                                                    <tr>
                                                        <th className="px-6 py-2 cursor-pointer hover:text-foreground group/th" onClick={() => handleSort('name')}>
                                                            <div className="flex items-center gap-2">Product <SortIcon field="name" /></div>
                                                        </th>
                                                        <th className="px-6 py-2 w-[180px] cursor-pointer hover:text-foreground group/th" onClick={() => handleSort('supplier')}>
                                                            <div className="flex items-center gap-2">Supplier <SortIcon field="supplier" /></div>
                                                        </th>
                                                        <th className="px-6 py-2 w-[120px] cursor-pointer hover:text-foreground group/th" onClick={() => handleSort('price')}>
                                                            <div className="flex items-center gap-2">Price <SortIcon field="price" /></div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {masterGroup.products.map((product) => {
                                                        // Check if product has overridden tags (non-null means inheritance is broken)
                                                        const hasOverriddenTags = product.timeframes !== null || 
                                                            product.demographics !== null || 
                                                            product.locations !== null || 
                                                            product.scenarios !== null;
                                                        
                                                        // Calculate tag differences for display
                                                        const getTagDifferences = () => {
                                                            const masterItem = masterGroup.masterItem;
                                                            if (!masterItem || !hasOverriddenTags) return [];
                                                            
                                                            const differences: Array<{
                                                                field: 'scenarios' | 'demographics' | 'timeframes' | 'locations';
                                                                icon: any;
                                                                className: string;
                                                                label: string;
                                                                differentTags: string[];
                                                            }> = [];
                                                            
                                                            const checkField = (
                                                                field: 'scenarios' | 'demographics' | 'timeframes' | 'locations',
                                                                productTags: string[] | null,
                                                                masterTags: string[] | null,
                                                                icon: any,
                                                                className: string,
                                                                label: string
                                                            ) => {
                                                                if (productTags === null) return; // Inheriting, no difference
                                                                
                                                                const productSet = new Set(productTags || []);
                                                                const masterSet = new Set(masterTags || []);
                                                                
                                                                // For demographics, compare all options to show state differences
                                                                if (field === 'demographics') {
                                                                    const allOptions = DEMOGRAPHICS;
                                                                    const differentTags: string[] = [];
                                                                    
                                                                    allOptions.forEach(option => {
                                                                        const inProduct = productSet.has(option);
                                                                        const inMaster = masterSet.has(option);
                                                                        if (inProduct !== inMaster) {
                                                                            differentTags.push(option);
                                                                        }
                                                                    });
                                                                    
                                                                    if (differentTags.length > 0) {
                                                                        differences.push({
                                                                            field,
                                                                            icon,
                                                                            className,
                                                                            label,
                                                                            differentTags
                                                                        });
                                                                    }
                                                                } else {
                                                                    // For other fields, find tags that are different
                                                                    const differentTags: string[] = [];
                                                                    
                                                                    // Tags added in product
                                                                    productSet.forEach(tag => {
                                                                        if (!masterSet.has(tag)) {
                                                                            differentTags.push(tag);
                                                                        }
                                                                    });
                                                                    
                                                                    // Tags removed in product (present in master but not in product)
                                                                    masterSet.forEach(tag => {
                                                                        if (!productSet.has(tag)) {
                                                                            differentTags.push(tag);
                                                                        }
                                                                    });
                                                                    
                                                                    if (differentTags.length > 0) {
                                                                        differences.push({
                                                                            field,
                                                                            icon,
                                                                            className,
                                                                            label,
                                                                            differentTags
                                                                        });
                                                                    }
                                                                }
                                                            };
                                                            
                                                            checkField('scenarios', product.scenarios, masterItem.scenarios, Shield, 'text-destructive bg-destructive/10 border-destructive/20', 'Scenarios');
                                                            checkField('demographics', product.demographics, masterItem.demographics, Users, 'text-success bg-success/10 border-success/20', 'People');
                                                            checkField('timeframes', product.timeframes, masterItem.timeframes, Clock, 'text-primary bg-primary/10 border-primary/20', 'Times');
                                                            checkField('locations', product.locations, masterItem.locations, MapPin, 'text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50', 'Locs');
                                                            
                                                            return differences;
                                                        };
                                                        
                                                        const tagDifferences = getTagDifferences();
                                                        const isTagging = taggingProductId === product.id;

                                                        return (
                                                        <Fragment key={product.id}>
                                                        <tr
                                                            className={`transition-colors group cursor-pointer ${
                                                                selectedIds.has(product.id)
                                                                    ? 'bg-primary/10 hover:bg-primary/15 border-l-2 border-primary'
                                                                    : isTagging
                                                                        ? 'bg-muted/60 border-l-2 border-primary'
                                                                        : 'hover:bg-muted/50 border-l-2 border-transparent'
                                                            }`}
                                                            onContextMenu={(e) => handleContextMenu(e, product)}
                                                            onClick={(e) => handleProductClick(e, product.id)}
                                                        >
                                                            <td className="px-6 py-3 min-w-0">
                                                                <div className="flex gap-3 items-start">
                                                                    {/* Broken link indicator */}
                                                                    {hasOverriddenTags && (
                                                                        <div className="w-4 shrink-0 pt-1">
                                                                            <span title="Tags overridden from master item">
                                                                                <Unlink className="w-3.5 h-3.5 text-warning/70" strokeWidth={2.5} />
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {product.imageUrl && (
                                                                        <img src={product.imageUrl} alt="" className="w-24 h-24 rounded bg-muted object-cover border border-border shrink-0" />
                                                                    )}
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="font-medium text-foreground">{product.name}</div>
                                                                        <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                                                                            {product.sku || product.asin || 'No ID'}
                                                                            {/* Master Item info removed as it is now in the header */}
                                                                        </div>
                                                                        {/* Product-specific tag differences */}
                                                                        {tagDifferences.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                                {tagDifferences.map((diff) => {
                                                                                    const masterSet = new Set(masterGroup.masterItem?.[diff.field] || []);
                                                                                    const productSet = new Set(product[diff.field] || []);
                                                                                    
                                                                                    // For demographics, show only differing options with their product state
                                                                                    if (diff.field === 'demographics') {
                                                                                        const formattedOptions = diff.differentTags.map(option => formatTagValue(option, 'demographics'));
                                                                                        
                                                                                        return (
                                                                                            <div key={diff.field} className={`flex items-center gap-1 px-2 py-0.5 rounded border ${diff.className}`}>
                                                                                                <diff.icon className="w-3 h-3 opacity-70 shrink-0" />
                                                                                                <div className="flex items-center gap-0">
                                                                                                    {diff.differentTags.map((option, idx) => {
                                                                                                        const inProduct = productSet.has(option);
                                                                                                        const formattedValue = formattedOptions[idx];
                                                                                                        return (
                                                                                                            <span key={option} className="flex items-center">
                                                                                                                {idx > 0 && <span className="mx-1 w-px h-2.5 bg-current opacity-30" />}
                                                                                                                <span className={`rounded px-1 py-0.5 ${inProduct ? '' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                                                                                                    <TagValueDisplay value={formattedValue} field={diff.field} title={option} />
                                                                                                                </span>
                                                                                                            </span>
                                                                                                        );
                                                                                                    })}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    // For other fields, show only the different tags
                                                                                    return (
                                                                                        <div key={diff.field} className={`flex items-center gap-1 px-2 py-0.5 rounded border ${diff.className}`}>
                                                                                            <diff.icon className="w-3 h-3 opacity-70 shrink-0" />
                                                                                            <div className="flex items-center gap-1">
                                                                                                {diff.differentTags.map((tag, idx) => {
                                                                                                    const isEnabled = productSet.has(tag);
                                                                                                    const formattedTag = formatTagValue(tag, diff.field);
                                                                                                    return (
                                                                                                        <span key={tag} className="flex items-center">
                                                                                                            {idx > 0 && <span className="mx-1 w-px h-2.5 bg-current opacity-30" />}
                                                                                                            <TagValueDisplay value={formattedTag} field={diff.field} title={tag} />
                                                                                                        </span>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                        {/* Compact metadata tags */}
                                                                        {product.metadata && Object.keys(product.metadata).length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                                {product.metadata.brand && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-warning/10 text-warning rounded border border-warning/20">{product.metadata.brand}</span>
                                                                                )}
                                                                                {product.metadata.quantity && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-info/10 text-info rounded border border-info/20">×{product.metadata.quantity}</span>
                                                                                )}
                                                                                {product.metadata.weight && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">{product.metadata.weight}{product.metadata.weight_unit || 'g'}</span>
                                                                                )}
                                                                                {product.metadata.volume && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">{product.metadata.volume}{product.metadata.volume_unit || 'ml'}</span>
                                                                                )}
                                                                                {product.metadata.size && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded border border-accent/20">{product.metadata.size}</span>
                                                                                )}
                                                                                {product.metadata.color && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-secondary/10 text-secondary rounded border border-secondary/20">{product.metadata.color}</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 w-[180px]">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="text-foreground text-xs flex items-center gap-1.5 min-w-0">
                                                                        {!product.supplierId && (
                                                                            <span title="Missing Supplier" className="shrink-0">
                                                                                <AlertCircle className="w-3.5 h-3.5 text-destructive" strokeWidth={2.5} />
                                                                            </span>
                                                                        )}
                                                                        <span className="truncate min-w-0">{product.supplier?.name || <span className="text-destructive italic">No Supplier</span>}</span>
                                                                    </div>
                                                                    <span className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                                                                        product.type === 'DROP_SHIP'
                                                                        ? 'text-secondary'
                                                                        : 'text-primary'
                                                                    }`}>
                                                                        {product.type}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 w-[120px]">
                                                                <div className="text-foreground font-mono">
                                                                    ${product.price ? Number(product.price).toFixed(2) : '0.00'}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {isTagging && (
                                                            <tr>
                                                                <td colSpan={3} className="p-0 relative z-10 overflow-hidden">
                                                                    <QuickTagger 
                                                                        product={product} 
                                                                        masterItem={masterGroup.masterItem || undefined}
                                                                        onClose={() => setTaggingProductId(null)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        )}
                                                        </Fragment>
                                                    )})}
                                                </tbody>
                                            </table>
                                        </div>
                                    );})}
                                </div>
                                )}
                            </div>
                        )})}
                    </div>
                    )}
                </div>
            )})
        )}
      </div>

      {/* Add Product Choice Modal */}
      <AddProductChoiceModal
          isOpen={isChoiceModalOpen}
          onClose={() => setIsChoiceModalOpen(false)}
          onManualSelect={handleManualSelect}
          onAmazonSelect={handleAmazonSelect}
      />

      {/* Amazon Search Dialog */}
      <AmazonSearchDialog
          isOpen={isAmazonSearchModalOpen}
          onClose={() => setIsAmazonSearchModalOpen(false)}
          onSelect={handleAmazonProductSelected}
      />

      {/* Add to Bundle Modal */}
      <AddToBundleModal
        isOpen={isAddToBundleModalOpen}
        onClose={() => setIsAddToBundleModalOpen(false)}
        product={addToBundleProduct}
      />

      {/* Product Edit Dialog */}
      <ProductEditDialog 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        masterItems={masterItems}
        suppliers={suppliers}
        categories={categories}
        preSelectedCategory={preSelectedCategory}
        preSelectedSubCategory={preSelectedSubCategory}
        preSelectedMasterItem={preSelectedMasterItem}
      />

      {/* New Master Item Modal (For Category Change flow & Editing) */}
      <MasterItemModal 
          isOpen={isMasterItemModalOpen}
          onClose={() => {
              setIsMasterItemModalOpen(false);
              setEditingMasterItem(null);
          }}
          onCreated={(newItem) => {
             setAllMasterItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
             if (isCategoryModalOpen) {
                setCategoryModalMasterItem(newItem.id);
             }
          }}
          onUpdated={(updatedItem) => {
              setAllMasterItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
          }}
          itemToEdit={editingMasterItem}
          selectedCategoryId={isCategoryModalOpen ? (categoryModalSubCategory || categoryModalCategory) : null}
          selectedCategoryName={
              editingMasterItem 
                ? categories.find(c => c.id === editingMasterItem.categoryId)?.name || 'Unknown Category' // Fixed: use camelCase
                : categories.find(c => c.id === (isCategoryModalOpen ? (categoryModalSubCategory || categoryModalCategory) : ''))?.name || 'Unknown Category'
          }
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
            className="fixed z-[70] bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[180px] animate-in fade-in zoom-in-95"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors"
                onClick={() => {
                    openEditModal(contextMenu.product);
                    setContextMenu(null);
                }}
            >
                <Pencil className="w-4 h-4 text-primary" strokeWidth={2.5} />
                Edit Specific Product
            </button>
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors"
                onClick={() => {
                    setTaggingProductId(contextMenu.product.id);
                    setContextMenu(null);
                }}
            >
                <Tag className="w-4 h-4 text-secondary" strokeWidth={2.5} />
                Quick Tag
            </button>
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors"
                onClick={() => openCategoryModal(contextMenu.product)}
            >
                <FolderTree className="w-4 h-4 text-warning" strokeWidth={2.5} />
                Change Category
            </button>
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors"
                onClick={() => {
                    openAddToBundleModal(contextMenu.product);
                    setContextMenu(null);
                }}
            >
                <Package className="w-4 h-4 text-secondary" strokeWidth={2.5} />
                Add to bundle
            </button>
            {/* Supplier Submenu with Flyout */}
            <div 
                ref={supplierButtonRef}
                className="relative w-full"
                onMouseEnter={() => {
                    if (supplierButtonRef.current) {
                        const rect = supplierButtonRef.current.getBoundingClientRect();
                        setSupplierSubmenuPosition({
                            top: rect.top,
                            left: rect.right + 4
                        });
                    }
                    setSupplierSubmenuOpen(true);
                }}
                onMouseLeave={() => setSupplierSubmenuOpen(false)}
            >
                <button
                    className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors ${supplierSubmenuOpen ? 'bg-muted' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (supplierButtonRef.current) {
                            const rect = supplierButtonRef.current.getBoundingClientRect();
                            setSupplierSubmenuPosition({
                                top: rect.top,
                                left: rect.right + 4
                            });
                        }
                        setSupplierSubmenuOpen(!supplierSubmenuOpen);
                    }}
                >
                    <Truck className="w-4 h-4 text-info" strokeWidth={2.5} />
                    {contextMenu.product.supplierId ? 'Change Supplier' : 'Assign Supplier'}
                    <ChevronRight className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${supplierSubmenuOpen ? '' : ''}`} strokeWidth={2.5} />
                </button>
                {/* Flyout submenu - positioned to the right */}
                {supplierSubmenuOpen && supplierSubmenuPosition && (
                    <div 
                        className="fixed z-[80]"
                        style={{ 
                            top: supplierSubmenuPosition.top,
                            left: supplierSubmenuPosition.left,
                            minWidth: '180px'
                        }}
                    >
                        <div className="bg-card border border-border rounded-lg shadow-2xl py-1 max-h-[300px] overflow-y-auto">
                            {suppliersList
                                .filter(s => s.id !== contextMenu.product.supplierId)
                                .map(supplier => (
                                    <button
                                        key={supplier.id}
                                        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await bulkUpdateProducts([contextMenu.product.id], { supplierId: supplier.id });
                                            setContextMenu(null);
                                            setSupplierSubmenuOpen(false);
                                        }}
                                    >
                                        {supplier.name}
                                    </button>
                                ))
                            }
                            {suppliersList.filter(s => s.id !== contextMenu.product.supplierId).length === 0 && (
                                <div className="px-4 py-2.5 text-sm text-muted-foreground italic">No other suppliers</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="h-px bg-border my-1" />
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-destructive/10 text-sm text-destructive flex items-center gap-3 transition-colors"
                onClick={async () => {
                    if (confirm('Delete this product?')) {
                        await deleteProduct(contextMenu.product.id);
                    }
                    setContextMenu(null);
                }}
            >
                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                Delete
            </button>
        </div>
      )}

      {/* Master Item Context Menu */}
      {masterItemContextMenu.visible && masterItemContextMenu.masterItem && (
        <div
            className="fixed z-[70] bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[180px] overflow-hidden animate-in fade-in zoom-in-95"
            style={{ top: masterItemContextMenu.y, left: masterItemContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors"
                onClick={() => handleMasterItemEdit(masterItemContextMenu.masterItem!)}
            >
                <Edit className="w-4 h-4 text-primary" strokeWidth={2.5} />
                Edit Master Item
            </button>
            <div className="h-px bg-border my-1" />
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors"
                onClick={() => handleCopyTags(masterItemContextMenu.masterItem!)}
            >
                <Copy className="w-4 h-4 text-primary" strokeWidth={2.5} />
                Copy Tags
            </button>
            <button
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                    copiedTags
                        ? 'hover:bg-muted text-foreground'
                        : 'text-muted-foreground cursor-not-allowed'
                }`}
                onClick={() => copiedTags && handlePasteTags(masterItemContextMenu.masterItem!)}
                disabled={!copiedTags}
            >
                <ClipboardPaste className={`w-4 h-4 ${copiedTags ? 'text-success' : 'text-muted-foreground'}`} strokeWidth={2.5} />
                Paste Tags
                {copiedTags && (
                    <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[80px]">
                        from {copiedTags.sourceName}
                    </span>
                )}
            </button>
        </div>
      )}

      {/* Paste Confirmation Modal */}
      {pasteConfirmModal && copiedTags && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-xl shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-warning/10 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-warning" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Overwrite Existing Tags?</h2>
                        <p className="text-muted-foreground text-sm">
                            &quot;{pasteConfirmModal.targetMasterItem.name}&quot; already has tags
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Before */}
                    <div className="bg-background rounded-lg p-4 border border-border">
                        <h3 className="text-xs font-medium text-destructive uppercase tracking-wide mb-3 flex items-center gap-2">
                            <X className="w-3 h-3" strokeWidth={2.5} /> Current (will be replaced)
                        </h3>
                        <div className="space-y-2 text-xs">
                            {pasteConfirmModal.targetMasterItem.scenarios?.length ? (
                                <div><span className="text-muted-foreground">Scenarios:</span> <span className="text-destructive">{pasteConfirmModal.targetMasterItem.scenarios.join(', ')}</span></div>
                            ) : null}
                            {pasteConfirmModal.targetMasterItem.demographics?.length ? (
                                <div><span className="text-muted-foreground">Demographics:</span> <span className="text-success">{pasteConfirmModal.targetMasterItem.demographics.join(', ')}</span></div>
                            ) : null}
                            {pasteConfirmModal.targetMasterItem.timeframes?.length ? (
                                <div><span className="text-muted-foreground">Timeframes:</span> <span className="text-primary">{pasteConfirmModal.targetMasterItem.timeframes.join(', ')}</span></div>
                            ) : null}
                            {pasteConfirmModal.targetMasterItem.locations?.length ? (
                                <div><span className="text-muted-foreground">Locations:</span> <span className="text-warning">{pasteConfirmModal.targetMasterItem.locations.join(', ')}</span></div>
                            ) : null}
                        </div>
                    </div>

                    {/* After */}
                    <div className="bg-background rounded-lg p-4 border border-success/30">
                        <h3 className="text-xs font-medium text-success uppercase tracking-wide mb-3 flex items-center gap-2">
                            <ClipboardPaste className="w-3 h-3" strokeWidth={2.5} /> New (from {copiedTags.sourceName})
                        </h3>
                        <div className="space-y-2 text-xs">
                            {copiedTags.scenarios?.length ? (
                                <div><span className="text-muted-foreground">Scenarios:</span> <span className="text-destructive">{copiedTags.scenarios.join(', ')}</span></div>
                            ) : <div className="text-muted-foreground italic">No scenarios</div>}
                            {copiedTags.demographics?.length ? (
                                <div><span className="text-muted-foreground">Demographics:</span> <span className="text-success">{copiedTags.demographics.join(', ')}</span></div>
                            ) : <div className="text-muted-foreground italic">No demographics</div>}
                            {copiedTags.timeframes?.length ? (
                                <div><span className="text-muted-foreground">Timeframes:</span> <span className="text-primary">{copiedTags.timeframes.join(', ')}</span></div>
                            ) : <div className="text-muted-foreground italic">No timeframes</div>}
                            {copiedTags.locations?.length ? (
                                <div><span className="text-muted-foreground">Locations:</span> <span className="text-warning">{copiedTags.locations.join(', ')}</span></div>
                            ) : <div className="text-muted-foreground italic">No locations</div>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setPasteConfirmModal(null)}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => executePaste(pasteConfirmModal.targetMasterItem)}
                        className="px-4 py-2 bg-warning hover:bg-warning/90 text-warning-foreground text-sm font-medium rounded-lg transition-colors"
                    >
                        Overwrite Tags
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Category Change Modal - Supports Single & Bulk */}
      {isCategoryModalOpen && (categoryModalProduct || selectedIds.size > 0) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95">
                <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-warning" strokeWidth={2.5} />
                    {categoryModalProduct ? 'Change Category' : 'Bulk Assign Category'}
                </h2>
                <p className="text-muted-foreground text-sm mb-6 truncate">
                    {categoryModalProduct ? (
                        <>Product: <span className="text-foreground font-medium">{categoryModalProduct.name}</span></>
                    ) : (
                        <span className="text-foreground font-medium">{selectedIds.size} products selected</span>
                    )}
                </p>

                <div className="space-y-4">
                    <div className="h-[400px] flex flex-col">
                        <CompactCategoryTreeSelector
                            categories={categories}
                            masterItems={masterItems}
                            selectedMasterItemId={categoryModalMasterItem}
                            onSelect={(mId: string, cId: string, sId?: string) => {
                                setCategoryModalMasterItem(mId);
                                setCategoryModalCategory(cId);
                                setCategoryModalSubCategory(sId || "");
                            }}
                            className="flex-1 bg-background/50 border border-border rounded-lg p-3"
                        />
                        <div className="mt-3 flex justify-between items-center px-1">
                            <span className="text-xs text-muted-foreground">Can't find the item?</span>
                            <button
                                type="button"
                                onClick={() => setIsMasterItemModalOpen(true)}
                                className="text-primary hover:text-primary/80 text-xs flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Create New Master Item
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => {
                            setIsCategoryModalOpen(false);
                            setCategoryModalProduct(null);
                        }}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveCategoryChange}
                        disabled={!categoryModalMasterItem}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {categoryModalProduct ? 'Save Changes' : 'Apply to Selected'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Bulk Supplier Modal */}
      {isBulkSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
                <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    Bulk Assign Supplier
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                    Assigning <span className="text-foreground font-medium">{selectedIds.size}</span> products to a supplier.
                </p>

                <div className="space-y-4">
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Select Supplier <span className="text-destructive">*</span></label>
                        <SelectInput
                            value={bulkSupplierId}
                            onChange={e => setBulkSupplierId(e.target.value)}
                        >
                            <option value="">Select Supplier...</option>
                            {suppliersList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </SelectInput>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => {
                            setIsBulkSupplierModalOpen(false);
                            setBulkSupplierId("");
                        }}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            if (!bulkSupplierId) return;
                            await bulkUpdateProducts(Array.from(selectedIds), { supplierId: bulkSupplierId });
                            setIsBulkSupplierModalOpen(false);
                            setBulkSupplierId("");
                            setSelectedIds(new Set());
                        }}
                        disabled={!bulkSupplierId}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Apply to Selected
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-destructive/90 border border-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-4 pointer-events-none">
              <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
                  {toastMessage}
              </div>
          </div>
      )}
      
      {selectedIds.size >= 2 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 z-[50] animate-in slide-in-from-bottom-4 fade-in duration-200">
                <div className="text-sm text-foreground font-medium border-r border-border pr-4 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{selectedIds.size}</span>
                    Selected
                </div>
                <button
                    onClick={() => {
                        setCategoryModalProduct(null);
                        setCategoryModalCategory("");
                        setCategoryModalSubCategory("");
                        setCategoryModalMasterItem("");
                        setIsCategoryModalOpen(true);
                    }}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <FolderTree className="w-4 h-4" strokeWidth={2.5} /> Assign Category
                </button>
                <div className="w-px h-4 bg-border" />
                <button
                    onClick={() => {
                        setBulkSupplierId("");
                        setIsBulkSupplierModalOpen(true);
                    }}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <Truck className="w-4 h-4" strokeWidth={2.5} /> Assign Supplier
                </button>
                <div className="w-px h-4 bg-border" />
                <button onClick={() => setSelectedIds(new Set())} className="text-muted-foreground hover:text-foreground p-1" title="Clear Selection">
                    <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
            </div>
      )}

      {/* Category Context Menu */}
      {categoryContextMenu.visible && categoryContextMenu.category && (
        <div
          id="category-context-menu"
          className="fixed z-50 bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[160px] overflow-hidden backdrop-blur-sm"
          style={{
            top: categoryContextMenu.y,
            left: categoryContextMenu.x
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleCategoryEdit(categoryContextMenu.category!)}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
          >
            <FileText className="w-4 h-4 text-primary" strokeWidth={2.5} />
            Edit Category
          </button>
          <div className="h-px bg-border my-1" />
          <button
            onClick={() => handleCategoryDelete(categoryContextMenu.category!)}
            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
            Delete
          </button>
        </div>
      )}

      {/* Category Edit Dialog */}
      <EditCategoryDialog
        isOpen={!!editingCategoryDialog}
        category={editingCategoryDialog ? {
          id: editingCategoryDialog.id,
          name: editingCategoryDialog.name,
          description: editingCategoryDialog.description,
          icon: editingCategoryDialog.icon,
          createdAt: editingCategoryDialog.createdAt || new Date()
        } : null}
        onClose={() => setEditingCategoryDialog(null)}
        onSave={async (id, data) => {
          await updateCategory(id, data);
          setEditingCategoryDialog(null);
          window.location.reload();
        }}
      />

      {/* Category Delete Dialog */}
      <DeleteCategoryDialog
        isOpen={!!deletingCategory}
        category={deletingCategory}
        impact={deleteImpact}
        onClose={() => {
          setDeletingCategory(null);
          setDeleteImpact(null);
        }}
        onConfirm={handleConfirmDeleteCategory}
      />

    </div>
  );
}
