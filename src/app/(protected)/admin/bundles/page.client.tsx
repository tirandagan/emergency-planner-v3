"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Boxes, Search, X, Edit, Save, Loader2, ChevronRight, ChevronDown, ArrowLeft, Folder, FolderOpen, Tag, Package, Info, DollarSign, Pencil, MoreVertical, Copy, Users, Thermometer, Baby, Layers } from "lucide-react";
import { createBundle, updateBundle, deleteBundle } from "./actions";
import ProductEditDialog from "../products/components/ProductEditDialog";
import { SCENARIOS, CLIMATES as PROD_CLIMATES, DEMOGRAPHICS as PROD_DEMOGRAPHICS } from "../products/constants";
import MultiSelectPills from "./components/MultiSelectPills";
import CompactTagFilter from "./components/CompactTagFilter";
import { slugify } from "@/lib/slugify";

const CLIMATES = PROD_CLIMATES; // Use product constants
const AGE_GROUPS = ['Infant/Toddler', 'Child', 'Adult', 'Elderly/Mobility'];
const GENDERS = ['Male', 'Female'];
// Removed local SCENARIOS definition to use imported one

interface BundleItem {
    id: string; // Product ID
    name: string;
    price: number;
    type: string;
    imageUrl?: string;
    quantity: number;
    master_item_name?: string;
    metadata?: any;
}

// Recursive Node Component
const CategoryTreeNode = ({ 
    node, 
    level = 0, 
    selectedId, 
    onSelect,
    expandedIds,
    onToggleExpand
}: { 
    node: any, 
    level?: number, 
    selectedId: string | null, 
    onSelect: (id: string) => void,
    expandedIds: Set<string>,
    onToggleExpand: (id: string) => void
}) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                    isSelected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onSelect(node.id)}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(node.id);
                    }}
                    className={`p-0.5 rounded hover:bg-muted/80 ${hasChildren ? 'opacity-100' : 'opacity-0'}`}
                >
                    {isExpanded ? <ChevronDown className="w-3 h-3" strokeWidth={2.5} /> : <ChevronRight className="w-3 h-3" strokeWidth={2.5} />}
                </button>

                <span className="category-icon" title={node.icon || '🗂️'}>
                    {node.icon || '🗂️'}
                </span>

                <span className="text-sm truncate font-medium">{node.name}</span>
            </div>
            
            {isExpanded && hasChildren && (
                <div>
                    {node.children.map((child: any) => (
                        <CategoryTreeNode 
                            key={child.id} 
                            node={child} 
                            level={level + 1} 
                            selectedId={selectedId}
                            onSelect={onSelect}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function BundlesClient({ 
    bundles, 
    categories, 
    masterItems, 
    products,
    suppliers
}: { 
    bundles: any[], 
    categories: any[], 
    masterItems: any[], 
    products: any[],
    suppliers: any[]
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Product Edit Dialog State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bundleName, setBundleName] = useState("");
  const [bundleSlug, setBundleSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [bundleDesc, setBundleDesc] = useState("");
  const [bundlePrice, setBundlePrice] = useState("0.00");

  // Targeting State
  const [targetScenarios, setTargetScenarios] = useState<string[]>([]);
  const [minPeople, setMinPeople] = useState<number | "">("");
  const [maxPeople, setMaxPeople] = useState<number | "">("");
  const [targetGender, setTargetGender] = useState<string[]>([]);
  const [targetAgeGroups, setTargetAgeGroups] = useState<string[]>([]);
  const [targetClimates, setTargetClimates] = useState<string[]>([]);
  
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  
  // Browser State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Categories are already a tree from getCategoryTree()
  const categoryTree = categories;

  // Flatten categories for lookup
  const flatCategories = useMemo(() => {
    const flatten = (nodes: any[]): any[] => {
      return nodes.reduce((acc, node) => {
        acc.push(node);
        if (node.children && node.children.length > 0) {
          acc.push(...flatten(node.children));
        }
        return acc;
      }, []);
    };
    return flatten(categories);
  }, [categories]);

  // Reset browser when modal opens
  useEffect(() => {
      if (isModalOpen) {
          setSearchQuery("");
          setSelectedTags([]);
      }
  }, [isModalOpen]);

  // Filtered Products based on Selection or Search
  const filteredProducts = useMemo(() => {
      let filtered = products;

      // 1. Search Mode (Text)
      if (searchQuery.length > 0) {
          const term = searchQuery.toLowerCase();
          filtered = filtered.filter((p: any) => {
              const master = masterItems.find((m: any) => m.id === p.masterItemId);
              
              const matchProduct = 
              p.name.toLowerCase().includes(term) || 
                  (p.description && p.description.toLowerCase().includes(term)) ||
                  (p.sku && p.sku.toLowerCase().includes(term)) || 
                  (p.asin && p.asin.toLowerCase().includes(term));
              
              const matchMaster = master && (
                  master.name.toLowerCase().includes(term) ||
                  (master.description && master.description.toLowerCase().includes(term))
              );
              
              return matchProduct || matchMaster;
          });
      }

      // 2. Tag Filter Mode (AND logic with negation support)
      // Tags starting with "!" are negated (must NOT have the tag)
      if (selectedTags.length > 0) {
          const includeTags = selectedTags.filter(t => !t.startsWith('!')).map(t => t);
          const excludeTags = selectedTags.filter(t => t.startsWith('!')).map(t => t.slice(1));
          
          filtered = filtered.filter((p: any) => {
              const master = masterItems.find((m: any) => m.id === p.masterItemId);
              const allTags = new Set([
                  ...(p.scenarios || master?.scenarios || []),
                  ...(p.demographics || master?.demographics || []),
                  ...(p.timeframes || master?.timeframes || []),
                  ...(p.locations || master?.locations || []),
                  ...(master?.scenarios || []),
                  ...(master?.demographics || []),
                  ...(master?.timeframes || []),
                  ...(master?.locations || [])
              ]);
              // Must have ALL include tags AND must NOT have ANY exclude tags
              const hasAllInclude = includeTags.every(tag => allTags.has(tag));
              const hasNoExclude = excludeTags.every(tag => !allTags.has(tag));
              return hasAllInclude && hasNoExclude;
          });
      }

      return filtered;
  }, [searchQuery, selectedTags, products, masterItems, categories]);

  // Result Tree Structure
  const resultTree = useMemo(() => {
      if (filteredProducts.length === 0) return [];

      const relevantMasterItemIds = new Set(filteredProducts.map((p: any) => p.masterItemId));
      const getProductsForMaster = (masterId: string) => filteredProducts.filter((p: any) => p.masterItemId === masterId);

      const processNode = (node: any): any | null => {
          // 1. Process Children
          const processedChildren = node.children
              .map((child: any) => processNode(child))
              .filter((child: any) => child !== null);

          // 2. Find Master Items belonging to this category (DIRECTLY)
          const nodeMasterItems = masterItems
              .filter((m: any) => m.categoryId === node.id && relevantMasterItemIds.has(m.id))
              .map((m: any) => ({
                  masterItem: m,
                  products: getProductsForMaster(m.id)
              }));

          // 3. Keep node if it has children OR master items
          if (processedChildren.length > 0 || nodeMasterItems.length > 0) {
              return {
                  ...node,
                  children: processedChildren,
                  masterItems: nodeMasterItems
              };
          }

          return null;
      };

      return categoryTree
          .map((root: any) => processNode(root))
          .filter((node: any) => node !== null);
  }, [categoryTree, filteredProducts, masterItems]);

  // Group Bundle Items by Category
  const groupedBundleItems = useMemo(() => {
      const groups: Record<string, { category: any; items: BundleItem[] }> = {};
      
      bundleItems.forEach(item => {
          const product = products.find((p: any) => p.id === item.id);
          let categoryObj = { id: 'uncategorized', name: 'Uncategorized', icon: '🗂️' };

          if (product) {
              const masterItem = masterItems.find((m: any) => m.id === product.masterItemId);
              if (masterItem) {
                  const category = flatCategories.find((c: any) => c.id === masterItem.categoryId);
                  if (category) {
                      if (category.parentId) {
                          const parent = flatCategories.find((c: any) => c.id === category.parentId);
                          categoryObj = parent || category;
                      } else {
                          categoryObj = category;
                      }
                  }
              }
          }
          
          const catKey = categoryObj.name;
          if (!groups[catKey]) {
              groups[catKey] = { category: categoryObj, items: [] };
          }
          groups[catKey].items.push(item);
      });
      
      return Object.entries(groups)
          .map(([_, group]) => group)
          .sort((a, b) => {
              if (a.category.name === 'Uncategorized') return 1;
              if (b.category.name === 'Uncategorized') return -1;
              return a.category.name.localeCompare(b.category.name);
          });
  }, [bundleItems, products, masterItems, flatCategories]);

  // Calculate Total Helper
  const calculateTotal = () => {
      return bundleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  // Update price automatically when items change
  useEffect(() => {
    setBundlePrice(calculateTotal());
  }, [bundleItems]);

  // Auto-generate slug from bundle name (unless manually edited)
  useEffect(() => {
    if (!isSlugManuallyEdited && bundleName) {
      setBundleSlug(slugify(bundleName));
    }
  }, [bundleName, isSlugManuallyEdited]);

  const openCreateModal = () => {
      setEditingId(null);
      setBundleName("");
      setBundleSlug("");
      setIsSlugManuallyEdited(false);
      setBundleDesc("");
      setBundlePrice("0.00");
      setTargetScenarios([]);
      setMinPeople("");
      setMaxPeople("");
      setTargetGender([]);
      setTargetAgeGroups([]);
      setTargetClimates([]);
      setBundleItems([]);
      setIsEditMode(false);
      setIsModalOpen(true);
  };

  const openEditModal = (bundle: any) => {
      setEditingId(bundle.id);
      setBundleName(bundle.name);
      setBundleSlug(bundle.slug);
      setIsSlugManuallyEdited(true); // Don't auto-update slug when editing existing bundle
      setBundleDesc(bundle.description || "");
      setBundlePrice(bundle.totalEstimatedPrice);
      
      setTargetScenarios(bundle.scenarios || []);
      setMinPeople(bundle.minPeople || "");
      setMaxPeople(bundle.maxPeople || "");
      setTargetGender(bundle.gender || []);
      setTargetAgeGroups(bundle.ageGroups || []);
      setTargetClimates(bundle.climates || []);

      // Map existing items to form structure
      setBundleItems(bundle.items.map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price || 0,
          type: item.product.type,
          imageUrl: item.product.imageUrl,
          quantity: item.quantity,
          master_item_name: masterItems.find((m: any) => m.id === item.product.masterItemId)?.name,
          metadata: item.product.metadata
      })));
      
      setIsEditMode(true);
      setIsModalOpen(true);
  };

  const handleAddItem = (product: any) => {
      const existing = bundleItems.find(i => i.id === product.id);
      if (existing) {
          setBundleItems(bundleItems.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
          const master = masterItems.find((m: any) => m.id === product.masterItemId);
          setBundleItems([...bundleItems, {
              id: product.id,
              name: product.name,
              price: product.price || 0,
              type: product.type,
              imageUrl: product.imageUrl,
              quantity: 1,
              master_item_name: master?.name,
              metadata: product.metadata
          }]);
      }
  };

  const handleRemoveItem = (id: string) => {
      setBundleItems(bundleItems.filter(i => i.id !== id));
  };

  const handleQuantityChange = (id: string, qty: number) => {
      if (qty < 1) return;
      setBundleItems(bundleItems.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const promptDelete = (id: string) => {
      setBundleToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (bundleToDelete) {
          await deleteBundle(bundleToDelete);
          setIsDeleteModalOpen(false);
          setBundleToDelete(null);
      }
  };

  const handleDuplicate = async (bundle: any) => {
      // 1. Determine new Name
      let newName = `${bundle.name} - Copy`;
      let counter = 1;
      
      // Check for existing copies (simple check against loaded bundles)
      while (bundles.some(b => b.name === newName)) {
          counter++;
          newName = `${bundle.name} - Copy (${counter})`;
      }

      // 2. Determine new Slug
      let newSlug = `${bundle.slug}-copy`;
      if (counter > 1) {
          newSlug = `${bundle.slug}-copy-${counter}`;
      }

      // 3. Prepare Payload
      const formData = new FormData();
      formData.set('name', newName);
      formData.set('slug', newSlug);
      formData.set('description', bundle.description || "");
      formData.set('total_estimated_price', bundle.totalEstimatedPrice.toString());
      
      // Copy targeting fields
      if (bundle.scenarios) formData.set('scenarios', JSON.stringify(bundle.scenarios));
      if (bundle.minPeople) formData.set('min_people', bundle.minPeople.toString());
      if (bundle.maxPeople) formData.set('max_people', bundle.maxPeople.toString());
      if (bundle.gender) formData.set('gender', JSON.stringify(bundle.gender));
      if (bundle.ageGroups) formData.set('age_groups', JSON.stringify(bundle.ageGroups));
      if (bundle.climates) formData.set('climates', JSON.stringify(bundle.climates));

      // Map items for creation
      const items = bundle.items.map((item: any) => ({
          id: item.product.id,
          quantity: item.quantity
      }));
      formData.set('items', JSON.stringify(items));

      await createBundle(formData);
  };

    const handleEditProduct = (product: any) => {
        // Fetch the master item to ensure we have complete data for inheritance logic
        const masterItem = masterItems.find(m => m.id === product.masterItemId);
        
        // The product object from bundle items might be partial or flattened.
        // Ensure we have the full product structure expected by ProductEditDialog.
        // Note: ProductEditDialog expects `timeframes`, `demographics`, etc. to be `null` if inheriting.
        // If they are coming from DB as `null`, that's good.
        
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };


  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Boxes className="w-8 h-8 text-primary" strokeWidth={2.5} />
                Bundles
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage product kits</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Create Bundle
        </button>
      </div>

      {/* Bundle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bundles.map((bundle) => (
          <div key={bundle.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-colors relative group shadow-sm">
            {/* Menu Button */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === bundle.id ? null : bundle.id);
                    }}
                    className="text-muted-foreground hover:text-foreground p-2 rounded hover:bg-muted transition-colors"
                >
                    <MoreVertical className="w-4 h-4" strokeWidth={2.5} />
                </button>

                {/* Dropdown Menu */}
                {activeMenuId === bundle.id && (
                    <>
                        {/* Backdrop to close menu */}
                        <div
                            className="fixed inset-0 z-20 cursor-default"
                            onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-xl z-30 overflow-hidden py-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    openEditModal(bundle);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                            >
                                <Edit className="w-3 h-3" strokeWidth={2.5} /> Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    handleDuplicate(bundle);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                            >
                                <Copy className="w-3 h-3" strokeWidth={2.5} /> Duplicate
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    promptDelete(bundle.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                            >
                                <Trash2 className="w-3 h-3" strokeWidth={2.5} /> Delete
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="flex justify-between items-start mb-4 pr-10">
              <div>
                  <h3 className="text-xl font-bold text-foreground">{bundle.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{bundle.description}</p>
              </div>
              <div className="text-right min-w-fit ml-4">
                  <div className="text-xl font-mono text-success">${bundle.totalEstimatedPrice}</div>
                  <div className="text-xs text-muted-foreground mt-1">{bundle.items.length} items</div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 mb-4 text-sm text-muted-foreground max-h-32 overflow-y-auto border border-border">
                <ul className="space-y-2">
                    {bundle.items.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center">
                            <span className="truncate pr-2">
                                <span className="text-muted-foreground text-xs mr-2">{item.quantity}x</span>
                                {item.product?.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                item.product?.type === 'DROP_SHIP'
                                ? 'bg-secondary/20 text-secondary border-secondary/50'
                                : 'bg-primary/20 text-primary border-primary/50'
                            }`}>
                                {item.product?.type === 'DROP_SHIP' ? 'DS' : 'AFF'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border">
                 <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">/{bundle.slug}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    {isEditMode ? `Edit Bundle: ${bundleName}` : 'Create New Bundle'}
                </h2>
                <div className="flex gap-4">
                    <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Modal Body: Split View */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT PANEL: Bundle Configuration */}
                <div className="w-[35%] min-w-[400px] border-r border-border bg-card flex flex-col">
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase">Name</label>
                                <input
                                    value={bundleName} onChange={e => setBundleName(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none text-sm"
                                    placeholder="Bundle Name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase">
                                    Slug {!isSlugManuallyEdited && <span className="text-[10px] text-muted-foreground/70">(auto-generated)</span>}
                                </label>
                                <input
                                    value={bundleSlug}
                                    onChange={e => {
                                        setBundleSlug(e.target.value);
                                        setIsSlugManuallyEdited(true);
                                    }}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none text-sm font-mono"
                                    placeholder="url-slug"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase">Description</label>
                                <textarea
                                    value={bundleDesc} onChange={e => setBundleDesc(e.target.value)}
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none text-sm resize-none"
                                    placeholder="Describe the bundle..."
                                />
                            </div>
                        </div>

                        {/* Targeting Section */}
                        <div className="space-y-6 pt-4 border-t border-border">
                             <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                Target Audience & Usage
                             </h3>

                             {/* Scenarios */}
                             <MultiSelectPills
                                label="Applicable Scenarios"
                                options={SCENARIOS}
                                selected={targetScenarios}
                                onChange={setTargetScenarios}
                             />

                             {/* People Capacity */}
                             <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase">People Capacity</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                                        <input
                                            type="number"
                                            min="1"
                                            value={minPeople}
                                            onChange={e => setMinPeople(e.target.value === "" ? "" : parseInt(e.target.value))}
                                            className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none text-sm"
                                            placeholder="Min"
                                        />
                                    </div>
                                    <span className="text-muted-foreground">-</span>
                                    <div className="relative flex-1">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                                        <input
                                            type="number"
                                            min="1"
                                            value={maxPeople}
                                            onChange={e => setMaxPeople(e.target.value === "" ? "" : parseInt(e.target.value))}
                                            className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none text-sm"
                                            placeholder="Max"
                                        />
                                    </div>
                                </div>
                             </div>

                             {/* Gender */}
                             <MultiSelectPills
                                label="Gender Target"
                                options={GENDERS}
                                selected={targetGender}
                                onChange={setTargetGender}
                             />

                             {/* Age Groups */}
                             <MultiSelectPills
                                label="Age Groups"
                                options={AGE_GROUPS}
                                selected={targetAgeGroups}
                                onChange={setTargetAgeGroups}
                             />

                             {/* Climates */}
                             <MultiSelectPills
                                label="Climates"
                                options={CLIMATES}
                                selected={targetClimates}
                                onChange={setTargetClimates}
                             />
                        </div>

                        {/* Items List */}
                        <div className="pt-4 border-t border-border">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Bundle Items ({bundleItems.length})</h3>
                            </div>

                            <div className="space-y-4 min-h-[200px]">
                                {bundleItems.length === 0 ? (
                                    <div className="border border-dashed border-border rounded-xl p-8 text-center">
                                        <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" strokeWidth={2.5} />
                                        <p className="text-sm text-muted-foreground">No items added yet.</p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">Browse products on the right to add.</p>
                                    </div>
                                ) : (
                                    groupedBundleItems.map((group) => (
                                        <div key={group.category.id} className="space-y-2">
                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2 border-b border-border pb-1">
                                                <span className="category-icon" title={group.category.icon || '🗂️'}>
                                                    {group.category.icon || '🗂️'}
                                                </span>
                                                {group.category.name} <span className="text-muted-foreground/70">({group.items.length})</span>
                                            </h4>
                                            <div className="space-y-2">
                                            {group.items.map((item) => (
                                        <div key={item.id} className="bg-background border border-border p-3 rounded-lg flex items-center gap-3 group hover:border-primary/30 transition-colors">
                                            {/* Image or Placeholder */}
                                            <div className="w-10 h-10 bg-muted rounded border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-foreground truncate font-medium">{item.name}</div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                        {item.master_item_name && <span>{item.master_item_name}</span>}
                                                        <span className="text-muted-foreground/50">•</span>
                                                        <span className="font-mono">${item.price}</span>
                                                    </div>

                                                    {/* Metadata Pills */}
                                                    {item.metadata && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.metadata.brand && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded border border-amber-800/50">{item.metadata.brand}</span>
                                                            )}
                                                            {item.metadata.quantity && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-cyan-900/30 text-cyan-400 rounded border border-cyan-800/50">×{item.metadata.quantity}</span>
                                                            )}
                                                            {item.metadata.weight && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">{item.metadata.weight}{item.metadata.weight_unit || 'g'}</span>
                                                            )}
                                                            {item.metadata.volume && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">{item.metadata.volume}{item.metadata.volume_unit || 'ml'}</span>
                                                            )}
                                                            {item.metadata.size && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-900/30 text-indigo-400 rounded border border-indigo-800/50">{item.metadata.size}</span>
                                                            )}
                                                            {item.metadata.color && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-pink-900/30 text-pink-400 rounded border border-pink-800/50">{item.metadata.color}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                                    className="w-12 bg-muted border border-border rounded px-1 py-1 text-xs text-center text-foreground focus:ring-1 focus:ring-ring focus:border-primary outline-none"
                                                />
                                                <button onClick={() => handleRemoveItem(item.id)} className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors">
                                                    <X className="w-4 h-4" strokeWidth={2.5} />
                                                </button>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                <span className="text-sm font-bold text-foreground uppercase tracking-wider">Total Price</span>
                                <span className="text-xl font-mono text-success font-bold">${bundlePrice}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-6 border-t border-border bg-card">
                        <button
                            onClick={async () => {
                                const formData = new FormData();
                                formData.set('name', bundleName);
                                formData.set('slug', bundleSlug);
                                formData.set('description', bundleDesc);
                                formData.set('total_estimated_price', bundlePrice);

                                formData.set('scenarios', JSON.stringify(targetScenarios));
                                if (minPeople !== "") formData.set('min_people', minPeople.toString());
                                if (maxPeople !== "") formData.set('max_people', maxPeople.toString());
                                formData.set('gender', JSON.stringify(targetGender));
                                formData.set('age_groups', JSON.stringify(targetAgeGroups));
                                formData.set('climates', JSON.stringify(targetClimates));

                                formData.set('items', JSON.stringify(bundleItems));

                                if (isEditMode && editingId) {
                                    formData.set('id', editingId);
                                    await updateBundle(formData);
                                } else {
                                    await createBundle(formData);
                                }
                                setIsModalOpen(false);
                            }}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Save className="w-4 h-4" strokeWidth={2.5} />
                            {isEditMode ? 'Save Changes' : 'Create Bundle'}
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: Product Browser */}
                <div className="flex-1 bg-background flex flex-col min-w-0">

                    {/* Browser Header: Search */}
                    <div className="p-4 border-b border-border bg-muted/30">
                        <CompactTagFilter
                            searchTerm={searchQuery}
                            onSearchChange={setSearchQuery}
                            selectedTags={selectedTags}
                            onTagsChange={setSelectedTags}
                            className="w-full"
                            />
                    </div>


                    {/* Content Area: Full Width Tree */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                         {/* Products Grid */}
                         <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
                             {searchQuery.length > 0 && (
                                 <div className="mb-4 px-2 text-sm text-muted-foreground">
                                     Found {filteredProducts.length} results for "{searchQuery}"
                                 </div>
                             )}

                             <div className="space-y-2">
                                 {resultTree.map((node: any) => (
                                     <ResultTreeNode
                                        key={node.id}
                                        node={node}
                                        onAdd={handleAddItem}
                                        onEdit={handleEditProduct}
                                        masterItems={masterItems}
                                        isSearchActive={searchQuery.length > 0}
                                        bundleItems={bundleItems}
                                     />
                                 ))}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl p-6">
            <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" strokeWidth={2.5} />
                Delete Bundle?
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this bundle? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg shadow-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                Delete Bundle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      <ProductEditDialog 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        masterItems={masterItems}
        suppliers={suppliers}
        categories={categories}
      />
    </div>
  );
}

// --- Subcomponents ---


function ProductCard({ product, onAdd, onEdit, masterItems, bundleItems }: { product: any, onAdd: () => void, onEdit: () => void, masterItems: any[], bundleItems?: BundleItem[] }) {
    const masterName = masterItems.find((m: any) => m.id === product.masterItemId)?.name;
    const isAdded = bundleItems?.some(item => item.id === product.id);

    return (
        <div className={`bg-card border border-border rounded-lg p-4 flex items-center gap-4 transition-colors group ${isAdded ? 'opacity-60' : 'hover:border-primary/30'}`}>
            <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center overflow-hidden shrink-0">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <Package className="w-6 h-6 text-muted-foreground" strokeWidth={2.5} />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                         <h4 className="font-medium text-foreground text-sm leading-snug line-clamp-2 mb-1" title={product.name}>{product.name}</h4>

                         <div className="flex flex-wrap gap-2 items-center mt-1">
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                {masterName && <span className="px-1.5 py-0.5 bg-muted rounded whitespace-nowrap">{masterName}</span>}
                                {product.asin && <span className="font-mono text-muted-foreground/70">{product.asin}</span>}
                            </div>

                            {/* Metadata Pills */}
                            {product.metadata && (
                                <div className="flex flex-wrap gap-1">
                                    {product.metadata.brand && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded border border-amber-800/50">{product.metadata.brand}</span>
                                    )}
                                    {product.metadata.quantity && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-cyan-900/30 text-cyan-400 rounded border border-cyan-800/50">×{product.metadata.quantity}</span>
                                    )}
                                    {product.metadata.weight && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">{product.metadata.weight}{product.metadata.weight_unit || 'g'}</span>
                                    )}
                                    {product.metadata.volume && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">{product.metadata.volume}{product.metadata.volume_unit || 'ml'}</span>
                                    )}
                                    {product.metadata.size && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-900/30 text-indigo-400 rounded border border-indigo-800/50">{product.metadata.size}</span>
                                    )}
                                    {product.metadata.color && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-pink-900/30 text-pink-400 rounded border border-pink-800/50">{product.metadata.color}</span>
                                    )}
                                </div>
                            )}
                         </div>
                    </div>

                    <div className="text-right shrink-0">
                        <div className="text-success font-mono font-medium">${product.price}</div>
                        <div className={`text-[10px] mt-1 uppercase tracking-wider font-bold ${product.type === 'DROP_SHIP' ? 'text-secondary' : 'text-primary'}`}>
                            {product.type === 'DROP_SHIP' ? 'Drop Ship' : 'Affiliate'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                    onClick={onEdit}
                    className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                    title="Edit Product"
                >
                    <Pencil className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button
                    onClick={onAdd}
                    className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors shadow-lg"
                    title="Add to Bundle"
                >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

const MasterItemNode = ({ group, onAdd, onEdit, masterItems, isSearchActive, bundleItems }: any) => {
    const [isExpanded, setIsExpanded] = useState(isSearchActive);

    useEffect(() => {
        if (isSearchActive) setIsExpanded(true);
    }, [isSearchActive]);

    return (
        <div className="mb-1">
            <div
                className="flex items-center gap-2 py-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/50 rounded transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
                <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <div className="w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-current"></div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide">{group.masterItem.name}</span>
                <span className="text-[10px] text-muted-foreground/70">({group.products.length})</span>
            </div>
            {isExpanded && (
                <div className="space-y-2 pl-6 mt-1">
                    {group.products.map((p: any) => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            onAdd={() => onAdd(p)}
                            onEdit={() => onEdit(p)}
                            masterItems={masterItems}
                            bundleItems={bundleItems}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function ResultTreeNode({
    node,
    onAdd,
    onEdit,
    masterItems,
    isSearchActive,
    bundleItems
}: {
    node: any,
    onAdd: (p: any) => void,
    onEdit: (p: any) => void,
    masterItems: any[],
    isSearchActive: boolean,
    bundleItems?: BundleItem[]
}) {
    const [isExpanded, setIsExpanded] = useState(isSearchActive);

    // Update expanded state when search state changes
    useEffect(() => {
        if (isSearchActive) setIsExpanded(true);
    }, [isSearchActive]);

    if ((!node.children || node.children.length === 0) && (!node.masterItems || node.masterItems.length === 0)) return null;

    return (
        <div className="ml-2">
            <div
                className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded px-2 text-muted-foreground hover:text-foreground transition-colors group"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" strokeWidth={2.5} /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" strokeWidth={2.5} />}
                <span className="category-icon" title={node.icon || '🗂️'}>
                    {node.icon || '🗂️'}
                </span>
                <span className="font-medium text-sm">{node.name}</span>
            </div>

            {isExpanded && (
                <div className="ml-2 border-l border-border pl-2 space-y-1 mt-1">
                    {/* Render Master Items directly in this category */}
                    {node.masterItems && node.masterItems.map((group: any) => (
                        <MasterItemNode
                            key={group.masterItem.id}
                            group={group}
                            onAdd={onAdd}
                            onEdit={onEdit}
                            masterItems={masterItems}
                            isSearchActive={isSearchActive}
                            bundleItems={bundleItems}
                        />
                    ))}

                    {/* Render Child Categories */}
                    {node.children && node.children.map((child: any) => (
                        <ResultTreeNode
                            key={child.id}
                            node={child}
                            onAdd={onAdd}
                            onEdit={onEdit}
                            masterItems={masterItems}
                            isSearchActive={isSearchActive}
                            bundleItems={bundleItems}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
