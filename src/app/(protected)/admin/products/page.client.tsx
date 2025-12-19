"use client";

// React Core
import { useState, useMemo, useEffect, Fragment, useRef } from "react";

// Icons
import {
  AlertCircle, AlertTriangle, Baby, ChevronDown, ChevronRight, ChevronUp,
  Clock, Cloud, ClipboardPaste, Copy, Download, Edit, FileText, FolderTree,
  Layers, MapPin, MoveRight, Package, Pencil, PersonStanding, Plus, Radiation,
  Search, Shield, Tag, Tags, Trash2, Truck, Unlink, Upload, User, UserCheck,
  Users, X, Zap
} from "lucide-react";

// Local Constants & Actions
import { SCENARIOS, TIMEFRAMES, DEMOGRAPHICS, LOCATIONS } from "./constants";
import {
  bulkUpdateProducts, createMasterItem, deleteProduct, getMasterItems,
  updateMasterItem, updateProduct, updateProductTags
} from "./actions";

// External Actions
import {
  createCategory, deleteCategory, getCategoryImpact, moveMasterItem, updateCategory
} from "@/app/actions/categories";

// Admin Components
import { DeleteCategoryDialog } from "@/components/admin/DeleteCategoryDialog";
import {
  AddCategoryDialog, EditCategoryDialog, MoveCategoryDialog, MoveMasterItemDialog
} from "@/components/admin/category-dialogs";

// Modal Components
import AddProductChoiceModal from "./components/AddProductChoiceModal";
import AddToBundleModal from "./components/AddToBundleModal";
import AmazonSearchDialog from "./components/AmazonSearchDialog";
import MasterItemModal from "./components/MasterItemModal";
import ProductEditDialog from "./components/ProductEditDialog";
import { QuickTagger } from "./modals/QuickTagger";

// Feature Components
import { BulkActionBar } from "./components/BulkActionBar";
import CompactCategoryTreeSelector from "./components/CompactCategoryTreeSelector";
import { FilterActiveIndicator } from "./components/FilterActiveIndicator";
import ProductCatalogFilter from "./components/ProductCatalogFilter";

// Context Menu Components
import { CategoryContextMenu } from "./components/CategoryContextMenu";
import { MasterItemContextMenu } from "./components/MasterItemContextMenu";
import { ProductContextMenu } from "./components/ProductContextMenu";

// Tree Components
import { CategoryTreeItem } from "./components/CategoryTreeItem";
import { MasterItemRow } from "./components/MasterItemRow";
import { ProductRow } from "./components/ProductRow";
import { SubCategoryTreeItem } from "./components/SubCategoryTreeItem";

// Custom Hooks
import { useCategoryNavigation } from "./hooks/useCategoryNavigation";
import { useContextMenu } from "./hooks/useContextMenu";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useModalState } from "./hooks/useModalState";
import { useProductFilters } from "./hooks/useProductFilters";

// Types & Utils
import type { Category, FormattedTagValue, MasterItem, Product, ProductsClientProps, Supplier } from "@/lib/products-types";
import { formatTagValue, getIconDisplayName } from "@/lib/products-utils";
import type { NavigationItem } from "./hooks/useKeyboardNavigation";

// Gender symbol components (Venus ♀ and Mars ♂)
const VenusIcon = ({ className, color = "currentColor", title }: { className?: string; color?: string; title?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {title && <title>{title}</title>}
        <circle cx="12" cy="8" r="3"/>
        <path d="M12 11v10"/>
        <path d="M8 15h8"/>
    </svg>
);

const MarsIcon = ({ className, color = "currentColor", title }: { className?: string; color?: string; title?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {title && <title>{title}</title>}
        <circle cx="12" cy="8" r="3"/>
        <path d="M12 11v10"/>
        <path d="M16 15l-4-4"/>
        <path d="M12 11l4 4"/>
    </svg>
);

// --- Helper Components ---

export const TagValueDisplay = ({ value, field, title }: { value: FormattedTagValue, field?: string, title?: string }) => {
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
    return <span title={title || (typeof value === 'string' ? value : '')}>{typeof value === 'string' ? value : ''}</span>;
};

export const TagBadge = ({
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

// --- Main Component ---
export default function ProductsClient({
  products,
  masterItems,
  suppliers,
  categories
}: ProductsClientProps): React.JSX.Element {
  // === CUSTOM HOOKS === //
  // Product filtering and sorting (replaces 6 useState + filtering logic)
  const filters = useProductFilters(products, masterItems);

  // Category tree navigation (replaces 4 useState + navigation logic)
  const navigation = useCategoryNavigation(categories);

  // All modal states (replaces 12+ useState + modal management)
  const modals = useModalState();

  // Context menus (replaces 3 complex useState objects)
  const productContextMenu = useContextMenu<Product>();
  const categoryContextMenu = useContextMenu<Category>();
  const masterItemContextMenu = useContextMenu<MasterItem>();
  const backgroundContextMenu = useContextMenu<null>();

  // === LOCAL STATE === //
  // State for cascading dropdowns (Used for Category Change Modal)
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

  // Data state (synced from server)
  const [allCategories, setAllCategories] = useState(categories);
  const [allMasterItems, setAllMasterItems] = useState(masterItems);

  // Build category tree from flat array (like /admin/categories does)
  const categoryTree = useMemo(() => {
    const map = new Map();
    const roots: Category[] = [];

    // Initialize map
    allCategories.forEach(c => {
      map.set(c.id, { ...c, children: [] });
    });

    // Build hierarchy
    allCategories.forEach(c => {
      const node = map.get(c.id);
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [allCategories]);

  // Sync props to state when server revalidates
  useEffect(() => {
      setAllMasterItems(masterItems);
      setAllCategories(categories);
  }, [masterItems, categories]);
  
  const openEditMasterItemModal = (masterItemId: string) => {
      const item = allMasterItems.find(m => m.id === masterItemId);
      if (item) {
          modals.openMasterItemEdit(item);
      }
  };

  // Supplier State
  const [suppliersList, setSuppliersList] = useState(suppliers);

  // Context Menu Helper State (submenu positioning)
  const [supplierSubmenuOpen, setSupplierSubmenuOpen] = useState(false);
  const [supplierSubmenuPosition, setSupplierSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const supplierButtonRef = useRef<HTMLDivElement>(null);

  // Copy/Paste Tags State
  const [copiedTags, setCopiedTags] = useState<{
      scenarios: string[] | null;
      demographics: string[] | null;
      timeframes: string[] | null;
      locations: string[] | null;
      sourceName: string;
  } | null>(null);

  // Category Edit/Delete Dialog State
  const [editingCategoryDialog, setEditingCategoryDialog] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<{
    categoryTree: Array<{
      id: string;
      name: string;
      icon: string | null;
      subcategories: Array<{
        id: string;
        name: string;
        icon: string | null;
        masterItems: Array<{
          id: string;
          name: string;
          productCount: number;
        }>;
      }>;
      masterItems: Array<{
        id: string;
        name: string;
        productCount: number;
      }>;
    }>;
    totalMasterItems: number;
    totalProducts: number;
  } | null>(null);

  // Category Add/Move Dialog State
  const [addingCategoryDialog, setAddingCategoryDialog] = useState<{ id: string; name: string } | null | 'root'>(null);
  const [movingCategoryDialog, setMovingCategoryDialog] = useState<Category | null>(null);

  // Move Master Item Dialog State
  const [moveMasterItemDialog, setMoveMasterItemDialog] = useState<{
    isOpen: boolean;
    masterItem: MasterItem | null;
  }>({
    isOpen: false,
    masterItem: null,
  });

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

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

  // Close context menu on click outside (handled by useContextMenu hook automatically)

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
      // Close other menus
      masterItemContextMenu.closeMenu();
      productContextMenu.closeMenu();
      categoryContextMenu.openMenu(e, category);
  };

  const handleCategoryEdit = (category: Category) => {
      setEditingCategoryDialog(category);
      categoryContextMenu.closeMenu();
  };

  const handleCategoryDelete = async (category: Category) => {
      categoryContextMenu.closeMenu();

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
              // Remove deleted category and all its descendants from state
              const removeCategoryAndDescendants = (categoryId: string, cats: Category[]): Category[] => {
                  const toRemove = new Set<string>();
                  
                  // Find all descendants
                  const findDescendants = (id: string) => {
                      toRemove.add(id);
                      cats.forEach(cat => {
                          if (cat.parentId === id) {
                              findDescendants(cat.id);
                          }
                      });
                  };
                  
                  findDescendants(categoryId);
                  
                  // Return categories that are not being removed
                  return cats.filter(cat => !toRemove.has(cat.id));
              };
              
              // Get all category IDs that will be deleted (including descendants)
              const getCategoryIdsToRemove = (categoryId: string): Set<string> => {
                  const toRemove = new Set<string>();
                  const findDescendants = (id: string) => {
                      toRemove.add(id);
                      allCategories.forEach(cat => {
                          if (cat.parentId === id) {
                              findDescendants(cat.id);
                          }
                      });
                  };
                  findDescendants(categoryId);
                  return toRemove;
              };
              
              const categoryIdsToRemove = getCategoryIdsToRemove(deletingCategory.id);
              
              // Update categories state
              setAllCategories(prev => prev.filter(cat => !categoryIdsToRemove.has(cat.id)));
              
              // Remove master items that belong to deleted categories
              setAllMasterItems(prev => prev.filter(mi => !categoryIdsToRemove.has(mi.categoryId)));

              setDeletingCategory(null);
              setDeleteImpact(null);
          } else {
              alert('Failed to delete: ' + res.message);
          }
      } catch (error) {
          console.error('Delete failed:', error);
      }
  };

  const handleCategoryAdd = (category: Category) => {
      setAddingCategoryDialog({ id: category.id, name: category.name });
      categoryContextMenu.closeMenu();
  };

  const handleCategoryMove = (category: Category) => {
      setMovingCategoryDialog(category);
      categoryContextMenu.closeMenu();
  };

  const handleSaveNewCategory = async (data: { name: string; description: string; icon: string; parentId: string | null }) => {
      try {
          const res = await createCategory(data.name, data.parentId, data.description, data.icon);
          console.log('Create category response:', res);

          if (res.success && res.data) {
              console.log('Adding category to state:', res.data);
              // Add new category to state
              setAllCategories(prev => {
                  const updated = [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name));
                  console.log('Updated categories:', updated.length);
                  return updated;
              });

              setAddingCategoryDialog(null);
          } else {
              alert('Failed to create category: ' + res.message);
          }
      } catch (error) {
          console.error('Create category failed:', error);
          throw error;
      }
  };

  const handleSaveMoveCategory = async (categoryId: string, newParentId: string | null) => {
      try {
          const res = await updateCategory(categoryId, { parent_id: newParentId || undefined });
          if (res.success) {
              setMovingCategoryDialog(null);
              window.location.reload();
          } else {
              alert('Failed to move category: ' + res.message);
          }
      } catch (error) {
          console.error('Move category failed:', error);
          throw error;
      }
  };

  const handleAddMasterItem = (category: Category) => {
      modals.openMasterItemEdit(null, category);
      categoryContextMenu.closeMenu();
  };

  const handleAddProductFromMasterItem = (masterItem: MasterItem) => {
      // Pre-populate category, subcategory, and master item
      const cat = categories.find(c => c.id === masterItem.categoryId);
      if (cat) {
          if (cat.parentId) {
              // Subcategory
              modals.setPreSelectedCategory(cat.parentId);
              modals.setPreSelectedSubCategory(cat.id);
          } else {
              // Root category
              modals.setPreSelectedCategory(cat.id);
              modals.setPreSelectedSubCategory("");
          }
      }
      modals.setPreSelectedMasterItem(masterItem.id);
      masterItemContextMenu.closeMenu();
      modals.openChoiceModal();
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
      // Only show menu if clicking on the product list container itself
      if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          // Close other menus
          categoryContextMenu.closeMenu();
          masterItemContextMenu.closeMenu();
          productContextMenu.closeMenu();
          // Open background context menu (null item since it's not associated with any entity)
          backgroundContextMenu.openMenu(e, null);
      }
  };

  // Master Item Context Menu Handlers
  const handleMasterItemContextMenu = (e: React.MouseEvent, masterItem: MasterItem) => {
      e.preventDefault();
      e.stopPropagation();
      // Close other menus
      categoryContextMenu.closeMenu();
      productContextMenu.closeMenu();
      masterItemContextMenu.openMenu(e, masterItem);
  };

  const handleMasterItemEdit = (masterItem: MasterItem) => {
      openEditMasterItemModal(masterItem.id);
      masterItemContextMenu.closeMenu();
  };

  const handleMoveMasterItem = (masterItem: MasterItem): void => {
      setMoveMasterItemDialog({ isOpen: true, masterItem });
      masterItemContextMenu.closeMenu();
  };

  const handleMoveMasterItemClose = (): void => {
      setMoveMasterItemDialog({ isOpen: false, masterItem: null });
  };

  const handleMoveMasterItemSave = async (
      masterItemId: string,
      targetCategoryId: string
  ): Promise<void> => {
      const result = await moveMasterItem(masterItemId, targetCategoryId);

      if (!result.success) {
          alert(result.message || 'Failed to move master item');
          throw new Error(result.message);
      }

      // Reload master items to show new location while preserving expansion state
      const updatedMasterItems = await getMasterItems();
      setAllMasterItems(updatedMasterItems);

      // Expand parent category and subcategory to show the moved item
      const movedItem = updatedMasterItems.find(item => item.id === masterItemId);
      if (movedItem) {
          const parentCategory = allCategories.find(cat =>
              cat.id === targetCategoryId ||
              (cat.parentId && allCategories.find(c => c.id === cat.parentId)?.id === targetCategoryId)
          );

          if (parentCategory) {
              // If target is a root category, expand it
              if (!parentCategory.parentId) {
                  navigation.expandCategory(parentCategory.id);
              } else {
                  // If target is a subcategory, expand both parent and subcategory
                  const rootCategory = allCategories.find(c => c.id === parentCategory.parentId);
                  if (rootCategory) {
                      navigation.expandCategory(rootCategory.id);
                  }
                  navigation.expandSubCategory(parentCategory.id);
              }
          }
      }
  };

  // Context menu close handlers (now handled by useContextMenu hook automatically)

  const handleCopyTags = (masterItem: MasterItem) => {
      setCopiedTags({
          scenarios: masterItem.scenarios || null,
          demographics: masterItem.demographics || null,
          timeframes: masterItem.timeframes || null,
          locations: masterItem.locations || null,
          sourceName: masterItem.name
      });
      masterItemContextMenu.closeMenu();
      setToastMessage(`Tags copied from "${masterItem.name}"`);
  };

  const handlePasteTags = (targetMasterItem: MasterItem) => {
      masterItemContextMenu.closeMenu();
      if (!copiedTags) return;
      
      // Check if target has existing tags
      const hasExistingTags = 
          (targetMasterItem.scenarios && targetMasterItem.scenarios.length > 0) ||
          (targetMasterItem.demographics && targetMasterItem.demographics.length > 0) ||
          (targetMasterItem.timeframes && targetMasterItem.timeframes.length > 0) ||
          (targetMasterItem.locations && targetMasterItem.locations.length > 0);

      if (hasExistingTags) {
          modals.openPasteConfirm(targetMasterItem);
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
      modals.closePasteConfirm();
  };

  const handleContextMenu = (e: React.MouseEvent, product: Product) => {
      if (selectedIds.size >= 2) {
          e.preventDefault();
          setToastMessage("Right-click menu not available in multi-select");
          return;
      }
      e.preventDefault();
      // Close other menus
      categoryContextMenu.closeMenu();
      masterItemContextMenu.closeMenu();
      productContextMenu.openMenu(e, product);
  };

  const openCategoryModal = (product: Product) => {
      productContextMenu.closeMenu();

      // Initialize category dropdowns based on product's current master item
      const master = allMasterItems.find(m => m.id === product.masterItemId);
      if (master) {
          const cat = categories.find(c => c.id === master.categoryId); // Fixed: use camelCase
          if (cat) {
              if (cat.parentId) {
                  modals.setCategoryModalCategory(cat.parentId);
                  modals.setCategoryModalSubCategory(cat.id);
              } else {
                  modals.setCategoryModalCategory(cat.id);
                  modals.setCategoryModalSubCategory("");
              }
          } else {
              modals.setCategoryModalCategory("");
              modals.setCategoryModalSubCategory("");
          }
          modals.setCategoryModalMasterItem(product.masterItemId);
      } else {
          modals.setCategoryModalCategory("");
          modals.setCategoryModalSubCategory("");
          modals.setCategoryModalMasterItem("");
      }

      modals.openCategoryModal(product);
  };

  // Derived lists for category modal
  const categoryModalSubCategories = useMemo(() => {
      if (!modals.categoryModalCategory) return [];
      return allCategories.filter(c => c.parentId === modals.categoryModalCategory);
  }, [allCategories, modals.categoryModalCategory]);

  const categoryModalFilteredMasterItems = useMemo(() => {
      if (modals.categoryModalSubCategory) {
          return allMasterItems.filter(m => m.categoryId === modals.categoryModalSubCategory); // Fixed: use camelCase
      }
      if (modals.categoryModalCategory) {
          const childCategoryIds = categories
              .filter(c => c.parentId === modals.categoryModalCategory)
              .map(c => c.id);
          const relevantIds = new Set([modals.categoryModalCategory, ...childCategoryIds]);
          return allMasterItems.filter(m => relevantIds.has(m.categoryId)); // Fixed: use camelCase
      }
      return [];
  }, [allMasterItems, modals.categoryModalCategory, modals.categoryModalSubCategory, categories]);

  const handleSaveCategoryChange = async () => {
      if (!modals.categoryModalMasterItem) return;

      if (modals.categoryModalProduct) {
        const formData = new FormData();
        formData.append('id', modals.categoryModalProduct.id);
        formData.append('name', modals.categoryModalProduct.name || '');
        formData.append('masterItemId', modals.categoryModalMasterItem);

        if (modals.categoryModalProduct.supplierId) {
            formData.append('supplierId', modals.categoryModalProduct.supplierId);
        }

        formData.append('price', String(modals.categoryModalProduct.price ?? 0));
        formData.append('type', modals.categoryModalProduct.type || 'AFFILIATE');
        formData.append('productUrl', modals.categoryModalProduct.productUrl || '');
        formData.append('imageUrl', modals.categoryModalProduct.imageUrl || '');
        formData.append('description', modals.categoryModalProduct.description || '');
        formData.append('asin', modals.categoryModalProduct.asin || modals.categoryModalProduct.sku || '');

        if (modals.categoryModalProduct.metadata) {
            Object.entries(modals.categoryModalProduct.metadata).forEach(([key, val]) => {
                if (val != null) formData.append(`meta_${key}`, String(val));
            });
        }

        await updateProduct(formData);
      } else if (selectedIds.size > 0) {
          await bulkUpdateProducts(Array.from(selectedIds), { masterItemId: modals.categoryModalMasterItem });
          setSelectedIds(new Set());
      }

      modals.closeCategoryModal();
  };

  // Derived Lists
  const rootCategories = useMemo(() => allCategories.filter(c => !c.parentId), [allCategories]);

  const resolvePreSelectedCategories = () => {
      // Priority 1: Active Master Item Selection
      if (navigation.activeMasterItemId) {
          const master = allMasterItems.find(m => m.id === navigation.activeMasterItemId);
          if (master) {
              const cat = categories.find(c => c.id === master.categoryId); // Fixed: use camelCase
              if (cat) {
                  if (cat.parentId) {
                      modals.setPreSelectedCategory(cat.parentId);
                      modals.setPreSelectedSubCategory(cat.id);
                  } else {
                      modals.setPreSelectedCategory(cat.id);
                      modals.setPreSelectedSubCategory("");
                  }
              }
              modals.setPreSelectedMasterItem(navigation.activeMasterItemId);
              return;
          }
      }
      
      // Priority 2: Active Category/SubCategory Selection
      if (navigation.activeCategoryId && navigation.activeCategoryId !== 'uncategorized') {
          const cat = allCategories.find(c => c.id === navigation.activeCategoryId);
          if (cat) {
              if (cat.parentId) {
                  modals.setPreSelectedCategory(cat.parentId);
                  modals.setPreSelectedSubCategory(cat.id);
              } else {
                  modals.setPreSelectedCategory(cat.id);
                  modals.setPreSelectedSubCategory("");
              }
              modals.setPreSelectedMasterItem("");
              return;
          }
      }

      // Default: No pre-selection
      modals.setPreSelectedCategory("");
      modals.setPreSelectedSubCategory("");
      modals.setPreSelectedMasterItem("");
  };

  const handleManualSelect = () => {
      modals.closeChoiceModal();
      modals.openProductEdit(null);
      // Only resolve categories if not already pre-selected (e.g., from context menu)
      if (!modals.preSelectedMasterItem && !modals.preSelectedCategory) {
          resolvePreSelectedCategories();
      }
  };

  const handleAmazonSelect = () => {
      modals.closeChoiceModal();
      modals.openAmazonSearch();
  };

  const handleAmazonProductSelected = (product: any) => {
      modals.closeAmazonSearch();

      // Find Amazon supplier
      const amazonSupplier = suppliers.find(s => s.name?.toLowerCase() === 'amazon');

      // Fix URL - ensure it's a full URL
      let productUrl = product.url;
      if (productUrl && !productUrl.startsWith('http')) {
          // If it's a relative URL, make it absolute
          if (productUrl.startsWith('/')) {
              productUrl = `https://www.amazon.com${productUrl}`;
          } else {
              productUrl = `https://www.amazon.com/${productUrl}`;
          }
      }

      // Map Amazon product to partial Product
      const mappedProduct: Partial<Product> = {
          name: product.name,
          asin: product.asin,
          imageUrl: product.image_url,
          price: product.price,
          productUrl: productUrl,
          description: product.description,
          supplierId: amazonSupplier?.id || '',
          metadata: {
              quantity: product.capacity_value,
              rating: product.rating,
              reviews: product.reviews,
              weight: product.weight,
              weight_unit: product.weight_unit
          }
      };

      modals.openProductEdit(mappedProduct as Product);
      // Only resolve categories if not already pre-selected (e.g., from context menu)
      if (!modals.preSelectedMasterItem && !modals.preSelectedCategory) {
          resolvePreSelectedCategories();
      }
  };

  // Initialize form state when opening modal
  const openEditModal = (product: Product) => {
      modals.openProductEdit(product);
      modals.setPreSelectedCategory(""); // Reset for edit mode (it uses product's master item)
      modals.setPreSelectedSubCategory("");
  };

  const openNewModal = () => {
      modals.openChoiceModal();
  };

  // Sorting Helper (now in filters hook)
  const SortIcon = ({ field }: { field: string }) => {
      if (filters.sortField !== field) return <div className="w-4 h-4 opacity-0 group-hover/th:opacity-30 flex flex-col -space-y-1"><ChevronUp className="w-3 h-3" /><ChevronDown className="w-3 h-3" /></div>;
      return filters.sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" strokeWidth={2.5} /> : <ChevronDown className="w-4 h-4 text-primary" strokeWidth={2.5} />;
  };

  // Grouping Logic (uses filters.processedProducts)
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
                  const cat = allCategories.find(c => c.id === catId);
                  if (!cat) return null;
                  groups[catId] = { category: cat, subGroups: {} };
              }
          }

          const subKey = subCatId || 'root';
          if (!groups[catId].subGroups[subKey]) {
              const subCat = subCatId ? allCategories.find(c => c.id === subCatId) || null : null;
              groups[catId].subGroups[subKey] = { subCategory: subCat, masterItems: {} };
          }
          return groups[catId].subGroups[subKey];
      };

      // First, create groups for ALL root categories (so empty categories appear)
      allCategories
          .filter(c => c.parentId === null) // Only root categories
          .forEach(cat => {
              if (!groups[cat.id]) {
                  groups[cat.id] = {
                      category: cat,
                      subGroups: { root: { subCategory: null, masterItems: {} } }
                  };
              }
          });

      // Second, add ALL subcategories under their parent categories (so empty subcategories appear)
      allCategories
          .filter(c => c.parentId !== null) // Only subcategories
          .forEach(subCat => {
              const parentId = subCat.parentId!;
              // Ensure parent group exists
              if (!groups[parentId]) {
                  const parentCat = allCategories.find(c => c.id === parentId);
                  if (parentCat) {
                      groups[parentId] = {
                          category: parentCat,
                          subGroups: {}
                      };
                  }
              }
              // Add subcategory to parent
              if (groups[parentId]) {
                  groups[parentId].subGroups[subCat.id] = {
                      subCategory: subCat,
                      masterItems: {}
                  };
              }
          });

      // Third, add ALL master items to their categories (so empty master items appear)
      allMasterItems.forEach(masterItem => {
          let catId = 'uncategorized';
          let subCatId = null;

          const cat = allCategories.find(c => c.id === masterItem.categoryId);
          if (cat) {
              if (cat.parentId) {
                  catId = cat.parentId;
                  subCatId = cat.id;
              } else {
                  catId = cat.id;
              }
          }

          const group = ensureGroup(catId, subCatId);
          if (group) {
              if (!group.masterItems[masterItem.id]) {
                  group.masterItems[masterItem.id] = { masterItem: masterItem, products: [] };
              }
          }
      });

      // Finally, build product hierarchy (bottom-up approach)
      // This adds products to existing master items
      filters.processedProducts.forEach(p => {
          const masterItem = allMasterItems.find(m => m.id === p.masterItemId);
          let catId = 'uncategorized';
          let subCatId = null;

          if (masterItem) {
               const cat = allCategories.find(c => c.id === masterItem.categoryId);
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
              // Master item should already exist from Phase 3, just add the product
              if (!group.masterItems[masterId]) {
                  group.masterItems[masterId] = { masterItem: masterItem || null, products: [] };
              }
              group.masterItems[masterId].products.push(p);
          }
      });

      return groups;
  }, [filters.processedProducts, allMasterItems, allCategories]);

  // Build flat navigation list for keyboard navigation
  const navigationItems = useMemo(() => {
      const items: Array<{ id: string; type: 'category' | 'subcategory'; parentId?: string }> = [];
      const sortedGroups = Object.values(groupedProducts).sort((a, b) => {
          if (a.category.id === 'uncategorized') return 1;
          if (b.category.id === 'uncategorized') return -1;
          return a.category.name.localeCompare(b.category.name);
      });

      sortedGroups.forEach(group => {
          items.push({ id: group.category.id, type: 'category' });

          if (navigation.expandedCategories.has(group.category.id)) {
              const sortedSubGroups = Object.values(group.subGroups).sort((a, b) => {
                  const nameA = a.subCategory?.name || '';
                  const nameB = b.subCategory?.name || '';
                  return nameA.localeCompare(nameB);
              });

              sortedSubGroups.forEach(subGroup => {
                  if (subGroup.subCategory) {
                      items.push({
                          id: subGroup.subCategory.id,
                          type: 'subcategory',
                          parentId: group.category.id
                      });
                  }
              });
          }
      });

      return items;
  }, [groupedProducts, navigation.expandedCategories]);

  // Count total categories and visible categories
  const categoryCounts = useMemo(() => {
      const totalCategories = allCategories.filter(c => c.parentId === null).length;
      const visibleCategories = Object.keys(groupedProducts).filter(id => id !== 'uncategorized').length;
      return { total: totalCategories, visible: visibleCategories };
  }, [allCategories, groupedProducts]);

  // Keyboard navigation (now handled by useKeyboardNavigation hook)
  const keyboard = useKeyboardNavigation(navigationItems, {
      onNavigate: (item) => {
          navigation.handleCategorySelect(item.id);
      },
      onExpand: (itemId, type) => {
          if (type === 'category') navigation.toggleCategory(itemId);
          else navigation.toggleSubCategory(itemId);
      },
      onCollapse: (itemId, type) => {
          if (type === 'category') navigation.toggleCategory(itemId);
          else navigation.toggleSubCategory(itemId);
      },
      isModalOpen: modals.isAnyModalOpen,
      expandedCategories: navigation.expandedCategories,
      expandedSubCategories: navigation.expandedSubCategories,
  });

  const visibleProductIds = useMemo(() => {
      const ids: string[] = [];
      const sortedGroups = Object.values(groupedProducts).sort((a, b) => {
          if (a.category.id === 'uncategorized') return 1;
          if (b.category.id === 'uncategorized') return -1;
          return a.category.name.localeCompare(b.category.name);
      });

      sortedGroups.forEach(group => {
          if (navigation.expandedCategories.has(group.category.id)) {
              Object.values(group.subGroups).forEach(subGroup => {
                  Object.values(subGroup.masterItems).forEach(masterGroup => {
                      masterGroup.products.forEach(p => ids.push(p.id));
                  });
              });
          }
      });
      return ids;
  }, [groupedProducts, navigation.expandedCategories]);

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
            </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="bg-muted/50 p-4 rounded-xl border border-border flex flex-col lg:flex-row gap-4 items-center">
            <ProductCatalogFilter
                searchTerm={filters.searchTerm}
                onSearchChange={filters.setSearchTerm}
                selectedTags={filters.selectedTags}
                onTagsChange={filters.setSelectedTags}
                selectedSuppliers={filters.selectedSuppliers}
                onSuppliersChange={filters.setSelectedSuppliers}
                priceRange={filters.filterPriceRange}
                onPriceRangeChange={filters.setFilterPriceRange}
                suppliers={suppliers}
                className="flex-1 w-full"
            />

            <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                {/* Expand/Collapse All */}
                <div className="flex gap-1 border-l border-border pl-3 ml-1">
                    <button
                        type="button"
                        onClick={() => {
                            const allCatIds = Object.keys(groupedProducts);
                            const allSubCatIds: string[] = [];
                            Object.values(groupedProducts).forEach(group => {
                                Object.values(group.subGroups).forEach(subGroup => {
                                    if (subGroup.subCategory) allSubCatIds.push(subGroup.subCategory.id);
                                });
                            });
                            navigation.expandAll(allCatIds, allSubCatIds);
                        }}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        title="Expand All"
                    >
                        <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <button
                        type="button"
                        onClick={navigation.collapseAll}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        title="Collapse All"
                    >
                        <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Filter Active Indicator */}
      {filters.hasActiveFilters && (
        <FilterActiveIndicator
          visibleCount={categoryCounts.visible}
          totalCount={categoryCounts.total}
          searchTerm={filters.searchTerm}
        />
      )}

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
                .map(group => (
                    <CategoryTreeItem
                        key={group.category.id}
                        group={group}
                        isExpanded={navigation.expandedCategories.has(group.category.id)}
                        isActive={navigation.activeCategoryId === group.category.id}
                        isFocused={keyboard.focusedItemId === group.category.id}
                        selectedProductIds={selectedIds}
                        taggingProductId={taggingProductId}
                        activeMasterItemId={navigation.activeMasterItemId}
                        expandedSubCategories={navigation.expandedSubCategories}
                        activeCategoryId={navigation.activeCategoryId}
                        focusedItemId={keyboard.focusedItemId}
                        onToggle={navigation.toggleCategory}
                        onSelect={navigation.handleCategorySelect}
                        onCategoryContextMenu={handleCategoryContextMenu}
                        onMasterItemSelect={navigation.handleMasterItemSelect}
                        onMasterItemContextMenu={handleMasterItemContextMenu}
                        onProductContextMenu={handleContextMenu}
                        onProductClick={handleProductClick}
                        onQuickTagClose={() => setTaggingProductId(null)}
                        setFocusedItemId={keyboard.setFocusedItemId}
                        setFocusedItemType={keyboard.setFocusedItemType}
                        onSort={filters.handleSort}
                        sortField={filters.sortField}
                        sortDirection={filters.sortDirection}
                        onToggleSubCategory={navigation.toggleSubCategory}
                    />
                ))
        )}
      </div>

      {/* Add Category Footer - Clickable area for adding root categories */}
      <div
        className="mt-4 py-8 px-4 border-2 border-dashed border-border/50 rounded-lg text-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-context-menu"
        onContextMenu={(e) => {
          backgroundContextMenu.openMenu(e, null);
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <Plus className="w-6 h-6 opacity-50" strokeWidth={2.5} />
          <p className="text-sm font-medium">Right-click here to add a new root category</p>
        </div>
      </div>

      {/* Add Product Choice Modal */}
      <AddProductChoiceModal
          isOpen={modals.isChoiceModalOpen}
          onClose={modals.closeChoiceModal}
          onManualSelect={handleManualSelect}
          onAmazonSelect={handleAmazonSelect}
      />

      {/* Amazon Search Dialog */}
      <AmazonSearchDialog
          isOpen={modals.isAmazonSearchModalOpen}
          onClose={modals.closeAmazonSearch}
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
        isOpen={modals.isModalOpen}
        onClose={modals.closeProductEdit}
        product={modals.editingProduct}
        masterItems={masterItems}
        suppliers={suppliers}
        categories={categories}
        preSelectedCategory={modals.preSelectedCategory}
        preSelectedSubCategory={modals.preSelectedSubCategory}
        preSelectedMasterItem={modals.preSelectedMasterItem}
      />

      {/* New Master Item Modal (For Category Change flow & Editing) */}
      <MasterItemModal
          isOpen={modals.isMasterItemModalOpen}
          onClose={modals.closeMasterItemEdit}
          onCreated={(newItem) => {
             setAllMasterItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
             if (modals.isCategoryModalOpen) {
                modals.setCategoryModalMasterItem(newItem.id);
             }

             // Auto-expand the parent subcategory to show the new item
             if (newItem.categoryId) {
                 const parentCategory = allCategories.find(cat => cat.id === newItem.categoryId);
                 if (parentCategory) {
                     // If it's a subcategory, expand both parent category and subcategory
                     if (parentCategory.parentId) {
                         navigation.expandCategory(parentCategory.parentId);
                         navigation.expandSubCategory(parentCategory.id);
                     } else {
                         // If it's a root category, just expand it
                         navigation.expandCategory(parentCategory.id);
                     }
                 }
             }
          }}
          onUpdated={(updatedItem) => {
              setAllMasterItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
          }}
          itemToEdit={modals.editingMasterItem}
          selectedCategoryId={
            modals.targetCategoryForMasterItem
              ? modals.targetCategoryForMasterItem.id
              : (modals.isCategoryModalOpen ? (modals.categoryModalSubCategory || modals.categoryModalCategory) : null)
          }
          selectedCategoryName={
              modals.editingMasterItem
                ? allCategories.find(c => c.id === modals.editingMasterItem!.categoryId)?.name || 'Unknown Category'
                : modals.targetCategoryForMasterItem
                  ? modals.targetCategoryForMasterItem.name
                  : allCategories.find(c => c.id === (modals.isCategoryModalOpen ? (modals.categoryModalSubCategory || modals.categoryModalCategory) : ''))?.name || 'Unknown Category'
          }
      />

      {/* Product Context Menu */}
      {productContextMenu.menu && (() => {
        const product = productContextMenu.menu.item;
        if (!product) return null;
        return (
        <div
            className="fixed z-[70] bg-card border border-border rounded-lg shadow-2xl py-1 inline-flex flex-col w-fit animate-in fade-in zoom-in-95"
            style={{ top: productContextMenu.menu.y, left: productContextMenu.menu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
                onClick={() => {
                    openEditModal(product);
                    productContextMenu.closeMenu();
                }}
            >
                <Pencil className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
                Edit Specific Product
            </button>
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
                onClick={() => {
                    setTaggingProductId(product.id);
                    productContextMenu.closeMenu();
                }}
            >
                <Tag className="w-4 h-4 text-secondary flex-shrink-0" strokeWidth={2.5} />
                Quick Tag
            </button>
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
                onClick={() => openCategoryModal(product)}
            >
                <FolderTree className="w-4 h-4 text-warning flex-shrink-0" strokeWidth={2.5} />
                Change Category
            </button>
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
                onClick={() => {
                    openAddToBundleModal(product);
                    productContextMenu.closeMenu();
                }}
            >
                <Package className="w-4 h-4 text-secondary flex-shrink-0" strokeWidth={2.5} />
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
                    className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap ${supplierSubmenuOpen ? 'bg-muted' : ''}`}
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
                    <Truck className="w-4 h-4 text-info flex-shrink-0" strokeWidth={2.5} />
                    {product.supplierId ? 'Change Supplier' : 'Assign Supplier'}
                    <ChevronRight className={`w-4 h-4 ml-auto text-muted-foreground transition-transform flex-shrink-0 ${supplierSubmenuOpen ? '' : ''}`} strokeWidth={2.5} />
                </button>
                {/* Flyout submenu - positioned to the right */}
                {supplierSubmenuOpen && supplierSubmenuPosition && (
                    <div
                        className="fixed z-[80] inline-flex flex-col w-fit"
                        style={{
                            top: supplierSubmenuPosition.top,
                            left: supplierSubmenuPosition.left
                        }}
                    >
                        <div className="bg-card border border-border rounded-lg shadow-2xl py-1 max-h-[300px] overflow-y-auto">
                            {suppliersList
                                .filter(s => s.id !== product.supplierId)
                                .map(supplier => (
                                    <button
                                        key={supplier.id}
                                        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await bulkUpdateProducts([product.id], { supplierId: supplier.id });
                                            productContextMenu.closeMenu();
                                            setSupplierSubmenuOpen(false);
                                        }}
                                    >
                                        {supplier.name}
                                    </button>
                                ))
                            }
                            {suppliersList.filter(s => s.id !== product.supplierId).length === 0 && (
                                <div className="px-4 py-2.5 text-sm text-muted-foreground italic">No other suppliers</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="h-px bg-border my-1" />
            <button
                className="w-full text-left px-4 py-2.5 hover:bg-destructive/10 text-sm text-destructive flex items-center gap-3 transition-colors whitespace-nowrap"
                onClick={async () => {
                    if (confirm('Delete this product?')) {
                        await deleteProduct(product.id);
                    }
                    productContextMenu.closeMenu();
                }}
            >
                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                Delete
            </button>
        </div>
        );
      })()}

      {/* Master Item Context Menu */}
      {masterItemContextMenu.menu && (() => {
        const masterItem = masterItemContextMenu.menu.item;
        if (!masterItem) return null;
        return (
          <MasterItemContextMenu
            x={masterItemContextMenu.menu.x}
            y={masterItemContextMenu.menu.y}
            masterItem={masterItem}
            onClose={masterItemContextMenu.closeMenu}
            onEdit={handleMasterItemEdit}
            onAddProduct={handleAddProductFromMasterItem}
            onMove={handleMoveMasterItem}
            onCopyTags={handleCopyTags}
            onPasteTags={handlePasteTags}
            hasCopiedTags={!!copiedTags}
            copiedTagsSourceName={copiedTags?.sourceName}
          />
        );
      })()}

      {/* Paste Confirmation Modal */}
      {modals.pasteConfirmModal && copiedTags && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-xl shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-warning/10 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-warning" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Overwrite Existing Tags?</h2>
                        <p className="text-muted-foreground text-sm">
                            &quot;{modals.pasteConfirmModal.targetMasterItem.name}&quot; already has tags
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
                            {modals.pasteConfirmModal.targetMasterItem.scenarios?.length ? (
                                <div><span className="text-muted-foreground">Scenarios:</span> <span className="text-destructive">{modals.pasteConfirmModal.targetMasterItem.scenarios.join(', ')}</span></div>
                            ) : null}
                            {modals.pasteConfirmModal.targetMasterItem.demographics?.length ? (
                                <div><span className="text-muted-foreground">Demographics:</span> <span className="text-success">{modals.pasteConfirmModal.targetMasterItem.demographics.join(', ')}</span></div>
                            ) : null}
                            {modals.pasteConfirmModal.targetMasterItem.timeframes?.length ? (
                                <div><span className="text-muted-foreground">Timeframes:</span> <span className="text-primary">{modals.pasteConfirmModal.targetMasterItem.timeframes.join(', ')}</span></div>
                            ) : null}
                            {modals.pasteConfirmModal.targetMasterItem.locations?.length ? (
                                <div><span className="text-muted-foreground">Locations:</span> <span className="text-warning">{modals.pasteConfirmModal.targetMasterItem.locations.join(', ')}</span></div>
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
                        onClick={modals.closePasteConfirm}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => executePaste(modals.pasteConfirmModal!.targetMasterItem)}
                        className="px-4 py-2 bg-warning hover:bg-warning/90 text-warning-foreground text-sm font-medium rounded-lg transition-colors"
                    >
                        Overwrite Tags
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Category Change Modal - Supports Single & Bulk */}
      {modals.isCategoryModalOpen && (modals.categoryModalProduct || selectedIds.size > 0) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95">
                <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-warning" strokeWidth={2.5} />
                    {modals.categoryModalProduct ? 'Change Category' : 'Bulk Assign Category'}
                </h2>
                <p className="text-muted-foreground text-sm mb-6 truncate">
                    {modals.categoryModalProduct ? (
                        <>Product: <span className="text-foreground font-medium">{modals.categoryModalProduct.name}</span></>
                    ) : (
                        <span className="text-foreground font-medium">{selectedIds.size} products selected</span>
                    )}
                </p>

                <div className="space-y-4">
                    <div className="h-[400px] flex flex-col">
                        <CompactCategoryTreeSelector
                            categories={categories}
                            masterItems={masterItems}
                            selectedMasterItemId={modals.categoryModalMasterItem}
                            onSelect={(mId: string, cId: string, sId?: string) => {
                                modals.setCategoryModalMasterItem(mId);
                                modals.setCategoryModalCategory(cId);
                                modals.setCategoryModalSubCategory(sId || "");
                            }}
                            className="flex-1 bg-background/50 border border-border rounded-lg p-3"
                        />
                        <div className="mt-3 flex justify-between items-center px-1">
                            <span className="text-xs text-muted-foreground">Can't find the item?</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const category = modals.categoryModalCategory
                                        ? allCategories.find(c => c.id === modals.categoryModalCategory) || null
                                        : null;
                                    modals.openMasterItemEdit(null, category);
                                }}
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
                        onClick={() => modals.closeCategoryModal()}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveCategoryChange}
                        disabled={!modals.categoryModalMasterItem}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {modals.categoryModalProduct ? 'Save Changes' : 'Apply to Selected'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Bulk Supplier Modal */}
      {modals.isBulkSupplierModalOpen && (
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
                            value={modals.bulkSupplierId}
                            onChange={e => modals.setBulkSupplierId(e.target.value)}
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
                        onClick={() => modals.closeBulkSupplierModal()}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            if (!modals.bulkSupplierId) return;
                            await bulkUpdateProducts(Array.from(selectedIds), { supplierId: modals.bulkSupplierId });
                            modals.closeBulkSupplierModal();
                            setSelectedIds(new Set());
                        }}
                        disabled={!modals.bulkSupplierId}
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
        <BulkActionBar
          selectedCount={selectedIds.size}
          onAssignCategory={() => modals.openCategoryModal(null)}
          onAssignSupplier={() => modals.openBulkSupplierModal()}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* Category Context Menu */}
      {categoryContextMenu.menu && (() => {
        const category = categoryContextMenu.menu.item;
        if (!category) return null;
        return (
          <CategoryContextMenu
            x={categoryContextMenu.menu.x}
            y={categoryContextMenu.menu.y}
            category={category}
            onClose={categoryContextMenu.closeMenu}
            onEdit={handleCategoryEdit}
            onAddSubcategory={handleCategoryAdd}
            onMove={handleCategoryMove}
            onAddMasterItem={handleAddMasterItem}
            onDelete={handleCategoryDelete}
          />
        );
      })()}

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
          const result = await updateCategory(id, data);
          if (result.success && result.data) {
            // Update local state without reloading to preserve tree expansion state
            setAllCategories(prev => prev.map(cat => 
              cat.id === id ? { 
                ...cat, 
                name: result.data!.name,
                description: result.data!.description,
                icon: result.data!.icon
              } : cat
            ));
          }
          setEditingCategoryDialog(null);
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

      {/* Background Context Menu */}
      {backgroundContextMenu.menu && (
        <div
          id="background-context-menu"
          className="fixed z-50 bg-card border border-border rounded-lg shadow-2xl py-1 inline-flex flex-col w-fit overflow-hidden backdrop-blur-sm"
          style={{
            top: backgroundContextMenu.menu.y,
            left: backgroundContextMenu.menu.x
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setAddingCategoryDialog('root');
              backgroundContextMenu.closeMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
            Add Root Category
          </button>
        </div>
      )}

      {/* Add Category Dialog */}
      <AddCategoryDialog
        isOpen={!!addingCategoryDialog}
        parentCategory={
          addingCategoryDialog === 'root'
            ? null
            : addingCategoryDialog
              ? { id: addingCategoryDialog.id, name: addingCategoryDialog.name }
              : null
        }
        onClose={() => setAddingCategoryDialog(null)}
        onSave={handleSaveNewCategory}
      />

      {/* Move Category Dialog */}
      <MoveCategoryDialog
        isOpen={!!movingCategoryDialog}
        category={movingCategoryDialog}
        categories={categories}
        onClose={() => setMovingCategoryDialog(null)}
        onSave={handleSaveMoveCategory}
      />

      {/* Move Master Item Dialog */}
      <MoveMasterItemDialog
        isOpen={moveMasterItemDialog.isOpen}
        masterItem={moveMasterItemDialog.masterItem}
        categories={categories}
        onClose={handleMoveMasterItemClose}
        onSave={handleMoveMasterItemSave}
      />

    </div>
  );
}
