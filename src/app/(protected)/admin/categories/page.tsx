"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Loader2, Plus, ChevronRight, ChevronDown, Trash2, Edit, GripVertical, FileText, Package, DollarSign, FolderInput, Search, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { 
    getCategoryTree, 
    getCategoryImpact, 
    getProductsByCategory, 
    upsertMasterItem, 
    moveMasterItem, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    type Category 
} from '@/app/actions/categories';
import { searchProductsFromAmazon, createProduct, createMasterItem } from '@/app/(protected)/admin/products/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmojiPickerDialog } from '@/components/admin/EmojiPicker';
import { EditCategoryDialog, CreateCategoryDialog } from '@/components/admin/category-dialogs';
import { DeleteCategoryDialog } from '@/components/admin/DeleteCategoryDialog';
import TagSelector from '../products/components/TagSelector';
import { TIMEFRAMES, DEMOGRAPHICS, LOCATIONS, SCENARIOS } from '../products/constants';

// Type definitions for database entities
interface SearchResult {
    name?: string;
    price?: number | string;
    url?: string;
    image_url?: string;
    asin?: string;
    description?: string;
    rating?: number;
    reviews?: number;
    is_existing?: boolean;
    existing_path?: string;
}

interface SpecificProduct {
    id: string;
    master_item_id: string;
    supplier_id: string;
    name: string;
    description?: string;
    price?: string;
    sku?: string;
    asin?: string;
    imageUrl?: string;
    product_url?: string;
    type: string;
    status: string;
}

interface MasterItem {
    id: string;
    categoryId: string;
    name: string;
    description?: string;
    status: string;
    timeframes?: string[] | null;
    demographics?: string[] | null;
    locations?: string[] | null;
    scenarios?: string[] | null;
    specific_products?: SpecificProduct[];
}

// Recursive Category Node Component
const CategoryNode = ({ 
    category, 
    level = 0, 
    onSelect, 
    selectedId,
    expandedIds,
    onToggleExpand,
    onContextMenu,
    onDragStart,
    onDrop,
    editingId,
    onRenameSubmit,
    onRenameCancel
}: { 
    category: Category, 
    level?: number, 
    onSelect: (id: string) => void, 
    selectedId: string | null,
    expandedIds: Set<string>,
    onToggleExpand: (id: string) => void,
    onContextMenu: (e: React.MouseEvent, id: string) => void,
    onDragStart: (e: React.DragEvent, id: string) => void,
    onDrop: (e: React.DragEvent, targetId: string) => void,
    editingId: string | null,
    onRenameSubmit: (id: string, newName: string) => void,
    onRenameCancel: () => void
}) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);
    const isEditing = editingId === category.id;
    const [editName, setEditName] = useState(category.name);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDropInternal = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDrop(e, category.id);
    };

    return (
        <div className="select-none">
            <div
                draggable={!isEditing}
                onDragStart={(e) => onDragStart(e, category.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropInternal}
                className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors group border border-transparent
                    ${selectedId === category.id ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
                    ${isDragOver ? 'border-primary bg-primary/5' : ''}
                `}
                style={{ marginLeft: `${level * 12}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(category.id);
                }}
                onContextMenu={(e) => onContextMenu(e, category.id)}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isEditing) {
                        onToggleExpand(category.id);
                    }
                }}
            >
                <div className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                    <GripVertical className="w-3 h-3" />
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onToggleExpand(category.id); }}
                    className={`p-0.5 rounded hover:bg-muted/80 transition-colors ${hasChildren ? 'opacity-100' : 'opacity-0'}`}
                >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} /> : <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />}
                </button>

                <span className="category-icon" title={category.icon || '🗂️'}>
                    {category.icon || '🗂️'}
                </span>

                {isEditing ? (
                    <form
                        onSubmit={(e) => { e.preventDefault(); onRenameSubmit(category.id, editName); }}
                        className="flex-1 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <input
                            autoFocus
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-background text-foreground text-sm px-2 py-1 rounded border-2 border-primary outline-none focus:ring-2 focus:ring-primary/20"
                            onBlur={() => onRenameSubmit(category.id, editName)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') onRenameCancel();
                            }}
                        />
                    </form>
                ) : (
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{category.name}</span>
                        {category.description && (
                            <span className="text-[10px] text-muted-foreground/70 truncate italic block leading-tight">
                                {category.description}
                            </span>
                        )}
                    </div>
                )}

                <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                    ({category.master_items_count})
                </span>
            </div>
            
            {isExpanded && hasChildren && (
                <div className="ml-2 border-l border-border pl-2 space-y-1 mt-1">
                    {category.children!.map(child => (
                        <CategoryNode 
                            key={child.id} 
                            category={child} 
                            level={level + 1} 
                            onSelect={onSelect} 
                            selectedId={selectedId}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            onContextMenu={onContextMenu}
                            onDragStart={onDragStart}
                            onDrop={onDrop}
                            editingId={editingId}
                            onRenameSubmit={onRenameSubmit}
                            onRenameCancel={onRenameCancel}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CategoryManager() {
    const [tree, setTree] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCat, setSelectedCat] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingDescription, setEditingDescription] = useState<{id: string, name: string, description: string, icon: string, createdAt: Date} | null>(null);
    
    // Actions
    const [isCreating, setIsCreating] = useState(false);

    // Create Master Item State
    const [isCreatingMasterItem, setIsCreatingMasterItem] = useState(false);
    const [newMasterItem, setNewMasterItem] = useState({ name: '', description: '' });

    // Master Item Editing
    const [editingMasterItem, setEditingMasterItem] = useState<{ id: string, name: string, description?: string, status?: string, categoryId?: string, timeframes?: string[] | null, demographics?: string[] | null, locations?: string[] | null, scenarios?: string[] | null, specific_products?: unknown[] } | null>(null);
    const [movingMasterItem, setMovingMasterItem] = useState<{ id: string, name: string, categoryId?: string, specific_products?: unknown[] } | null>(null);
    const [targetCategoryId, setTargetCategoryId] = useState<string>('');

    // Add Product Logic
    const [addingProductTo, setAddingProductTo] = useState<{id: string, name: string} | null>(null);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [productSearchResults, setProductSearchResults] = useState<Array<{ name?: string, price?: number, url?: string, image_url?: string, asin?: string, description?: string, rating?: number, reviews?: number, is_existing?: boolean, existing_path?: string }>>([]);
    const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
    const [newProductForm, setNewProductForm] = useState({
        name: '',
        price: '',
        product_url: '',
        image_url: '',
        asin: '',
        description: '',
        type: 'AFFILIATE'
    });

    // Sidebar Data
    const [categoryProducts, setCategoryProducts] = useState<Array<{ id: string, name: string, description?: string, categoryId?: string, specific_products?: unknown[] }>>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, categoryId: string | null }>({
        visible: false, x: 0, y: 0, categoryId: null
    });

    // Emoji Picker State
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [currentIcon, setCurrentIcon] = useState('🗂️');

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
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

    const fetchTree = async () => {
        setLoading(true);
        const data = await getCategoryTree();
        setTree(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTree();
    }, []);

    // Handle Escape to deselect
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedCat(null);
                setContextMenu(prev => ({ ...prev, visible: false }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fetch products when category selected
    useEffect(() => {
        if (!selectedCat) {
            setCategoryProducts([]);
            return;
        }

        const getDescendantIds = (rootId: string, nodes: Category[]): string[] => {
            const ids: string[] = [];
            
            const findAndCollect = (nodes: Category[]): boolean => {
                for (const node of nodes) {
                    if (node.id === rootId) {
                        // Found root, collect all descendants
                        const collect = (n: Category) => {
                            ids.push(n.id);
                            n.children?.forEach(collect);
                        };
                        collect(node);
                        return true;
                    }
                    if (node.children) {
                        if (findAndCollect(node.children)) return true;
                    }
                }
                return false;
            };
            
            findAndCollect(nodes);
            return ids;
        };

        const fetchProducts = async () => {
            setLoadingProducts(true);
            const ids = getDescendantIds(selectedCat, tree);
            if (ids.length > 0) {
                const res = await getProductsByCategory(ids);
                if (res.success) {
                    setCategoryProducts(res.data || []);
                }
            }
            setLoadingProducts(false);
        };
        
        fetchProducts();
    }, [selectedCat, tree]);

    // Group Products by Category
    const groupedProducts = useMemo(() => {
        if (!selectedCat || categoryProducts.length === 0) return [];

        // Create a map of category IDs to their node for easy lookup
        const catMap = new Map<string, Category>();
        const traverse = (nodes: Category[]) => {
            nodes.forEach(node => {
                catMap.set(node.id, node);
                if (node.children) traverse(node.children);
            });
        };
        traverse(tree);

        // We need to respect the tree order. 
        // Let's collect relevant category IDs in tree traversal order
        const orderedCategoryIds: string[] = [];
        const collectOrderedIds = (nodes: Category[]) => {
            for (const node of nodes) {
                // Check if this node or any parent up to root is the selected category
                // Actually, we just need to find the selected node and then traverse its subtree
                if (node.id === selectedCat) {
                    orderedCategoryIds.push(node.id);
                    const addChildren = (children: Category[]) => {
                        children.forEach(child => {
                            orderedCategoryIds.push(child.id);
                            if (child.children) addChildren(child.children);
                        });
                    };
                    if (node.children) addChildren(node.children);
                    return true; // Stop searching top-level once found
                }
                if (node.children) {
                    if (collectOrderedIds(node.children)) return true;
                }
            }
            return false;
        };
        collectOrderedIds(tree);

        // Now group products by categoryId (Drizzle uses camelCase)
        const groups = new Map<string, MasterItem[]>();
        categoryProducts.forEach(product => {
            const catId = product.categoryId || 'uncategorized';
            if (!groups.has(catId)) groups.set(catId, []);
            groups.get(catId)!.push(product as MasterItem);
        });

        // Build the final ordered list of groups
        const result: Array<{ id: string, name: string, icon: string, products: MasterItem[] }> = [];
        
        // Add groups in tree order
        orderedCategoryIds.forEach(catId => {
            if (groups.has(catId)) {
                const cat = catMap.get(catId);
                result.push({
                    id: catId,
                    name: cat?.name || 'Unknown Category',
                    icon: cat?.icon || '🗂️',
                    products: groups.get(catId)!
                });
                groups.delete(catId); // Remove so we don't duplicate
            }
        });

        // Add any remaining (shouldn't be any if logic is correct, but handle 'uncategorized' or orphans)
        groups.forEach((products, catId) => {
            if (catId === 'uncategorized') {
                result.push({ id: 'uncategorized', name: 'Uncategorized', icon: '📦', products });
            } else {
                 // Logic fallback: product exists but category wasn't in our subtree walk?
                 // Maybe it was moved or something. Add it at end.
                 const cat = catMap.get(catId);
                 result.push({ id: catId, name: cat?.name || 'Other', icon: cat?.icon || '🗂️', products });
            }
        });

        return result;
    }, [categoryProducts, selectedCat, tree]);

    // Close context menu on global click
    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) {
                setContextMenu(prev => ({ ...prev, visible: false }));
            }
        };

        if (contextMenu.visible) {
            // Use a small delay to avoid the initial click triggering the close
            const timer = setTimeout(() => {
                window.addEventListener('click', handleClick);
            }, 10);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('click', handleClick);
            };
        }
    }, [contextMenu.visible]);

    const handleContextMenu = (e: React.MouseEvent, categoryId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.pageX, 
            y: e.pageY,
            categoryId
        });
        setSelectedCat(categoryId);
    };

    const handleToggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        const draggedId = e.dataTransfer.getData('text/plain');
        if (!draggedId || draggedId === targetId) return;

        // Optimistic update or wait for server? Wait for server is safer for tree integrity
        const res = await updateCategory(draggedId, { parent_id: targetId });
        if (res.success) {
            fetchTree();
            // Ensure target is expanded so we see the dropped item
            setExpandedIds(prev => new Set(prev).add(targetId));
        } else {
            alert("Failed to move category: " + res.message);
        }
    };

    const handleCreateClick = () => {
        setIsCreating(true);
    };


    const handleDeleteCategoryClick = async () => {
        if (!contextMenu.categoryId) return;

        // Find the category to delete
        const findCategory = (nodes: Category[], id: string): Category | null => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                    const found = findCategory(node.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        const category = findCategory(tree, contextMenu.categoryId);
        if (!category) return;

        // Close context menu
        setContextMenu(prev => ({ ...prev, visible: false }));

        // Fetch impact data
        const impactRes = await getCategoryImpact(contextMenu.categoryId);
        if (impactRes.success && impactRes.data) {
            setCategoryToDelete(category);
            setDeleteImpact(impactRes.data);
            setDeleteDialogOpen(true);
        } else {
            // Fallback to simple confirmation
            if (confirm("Are you sure you want to delete this category?")) {
                const res = await deleteCategory(contextMenu.categoryId);
                if (res.success) {
                    if (selectedCat === contextMenu.categoryId) setSelectedCat(null);
                    fetchTree();
                } else {
                    alert('Failed to delete: ' + res.message);
                }
            }
        }
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;

        const res = await deleteCategory(categoryToDelete.id);
        if (res.success) {
            if (selectedCat === categoryToDelete.id) setSelectedCat(null);
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
            setDeleteImpact(null);
            fetchTree();
        } else {
            alert('Failed to delete: ' + res.message);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setCurrentIcon(emoji);
        // If editing a category, update the icon in editingDescription as well
        if (editingDescription) {
            setEditingDescription(prev => prev ? { ...prev, icon: emoji } : null);
        }
        setEmojiPickerOpen(false);
    };

    const handleStartRename = () => {
        if (contextMenu.categoryId) {
            setEditingId(contextMenu.categoryId);
            setContextMenu(prev => ({ ...prev, visible: false }));
        }
    };

    const handleRenameSubmit = async (id: string, newName: string) => {
        if (newName && newName.trim() !== '') {
            await updateCategory(id, { name: newName });
            fetchTree();
        }
        setEditingId(null);
    };


    const handleMasterItemSave = async () => {
        if (!editingMasterItem) return;
        
        const res = await upsertMasterItem(editingMasterItem);
        if (res.success) {
            setEditingMasterItem(null);
            // Refresh products to show updated info
            refreshProducts();
        } else {
            alert('Error saving Master Item: ' + res.error);
        }
    };

    const handleCreateMasterItemSubmit = async () => {
        if (!selectedCat || !newMasterItem.name) return;

        try {
            const formData = new FormData();
            formData.append('name', newMasterItem.name);
            formData.append('description', newMasterItem.description);
            formData.append('category_id', selectedCat);

            await createMasterItem(formData);
            
            setIsCreatingMasterItem(false);
            setNewMasterItem({ name: '', description: '' });
            refreshProducts();
            fetchTree();
        } catch (e) {
            alert('Error creating Master Item: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    };

    const refreshProducts = async () => {
        const getDescendantIds = (rootId: string, nodes: Category[]): string[] => {
            const ids: string[] = [];
            const findAndCollect = (nodes: Category[]): boolean => {
                for (const node of nodes) {
                    if (node.id === rootId) {
                        const collect = (n: Category) => { ids.push(n.id); n.children?.forEach(collect); };
                        collect(node);
                        return true;
                    }
                    if (node.children && findAndCollect(node.children)) return true;
                }
                return false;
            };
            findAndCollect(nodes);
            return ids;
        };

        if (selectedCat) {
            setLoadingProducts(true);
            const ids = getDescendantIds(selectedCat, tree);
            if (ids.length > 0) {
                const res = await getProductsByCategory(ids);
                if (res.success) setCategoryProducts(res.data || []);
            }
            setLoadingProducts(false);
        }
    };

    const handleMoveClick = (master: { id: string, name: string, categoryId?: string, specific_products?: unknown[] }) => {
        setMovingMasterItem(master);
        setTargetCategoryId('');
    };

    const handleConfirmMove = async () => {
        if (!movingMasterItem || !targetCategoryId) return;

        const res = await moveMasterItem(movingMasterItem.id, targetCategoryId);
        if (res.success) {
            setMovingMasterItem(null);
            setTargetCategoryId('');
            fetchTree(); // Refresh tree to update counts
            refreshProducts(); // Refresh products in current category
        } else {
            alert('Error moving Master Item: ' + res.message);
        }
    };

    const handleAddProductClick = (master: { id: string, name: string }) => {
        setAddingProductTo(master);
        setProductSearchQuery(master.name); // Default search to master item name
        setProductSearchResults([]);
        setActiveTab('search');
        setNewProductForm({
            name: '',
            price: '',
            product_url: '',
            image_url: '',
            asin: '',
            description: '',
            type: 'AFFILIATE'
        });
    };

    const handleProductSearch = async () => {
        if (!productSearchQuery) return;
        setIsSearchingProduct(true);
        const res = await searchProductsFromAmazon(productSearchQuery);
        if (res.success) {
            setProductSearchResults(res.data || []);
        } else {
            alert('Search failed: ' + res.message);
        }
        setIsSearchingProduct(false);
    };

    const handleSelectSearchResult = (result: SearchResult) => {
        setNewProductForm({
            name: result.name || '',
            price: result.price?.toString() || '',
            product_url: result.url || '',
            image_url: result.image_url || '',
            asin: result.asin || '',
            description: result.description || '',
            type: 'AFFILIATE'
        });
        setActiveTab('manual');
    };

    const handleCreateProductSubmit = async () => {
        if (!addingProductTo) return;

        try {
            const formData = new FormData();
            formData.append('name', newProductForm.name);
            formData.append('master_item_id', addingProductTo.id);
            formData.append('price', newProductForm.price);
            formData.append('product_url', newProductForm.product_url);
            formData.append('image_url', newProductForm.image_url);
            formData.append('asin', newProductForm.asin);
            formData.append('description', newProductForm.description);
            formData.append('type', newProductForm.type);
            // Default empty supplier
            formData.append('supplier_id', ''); 

            await createProduct(formData);
            
            setAddingProductTo(null);
            refreshProducts();
        } catch (e) {
            alert('Failed to create product: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    };

    const renderCategoryOptions = (nodes: Category[], level = 0): React.ReactNode[] => {
        return nodes.flatMap(node => [
            <option key={node.id} value={node.id} disabled={node.id === movingMasterItem?.categoryId}>
                {'\u00A0'.repeat(level * 4)}{node.name}
            </option>,
            ...(node.children ? renderCategoryOptions(node.children, level + 1) : [])
        ]);
    };

    return (
        <div className="max-w-6xl mx-auto p-8 min-h-screen" onContextMenu={(e) => e.preventDefault()}>
            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    id="context-menu"
                    className="fixed z-50 bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[160px] overflow-hidden backdrop-blur-sm"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleStartRename}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                    >
                        <Edit className="w-4 h-4 text-primary" strokeWidth={2.5} /> Rename
                    </button>
                    <button
                        onClick={() => {
                            if (contextMenu.categoryId) {
                                const cat = tree.find(c => c.id === contextMenu.categoryId) ||
                                           // Find deep
                                           (function findDeep(nodes: Category[], id: string): Category | undefined {
                                               for (const node of nodes) {
                                                   if (node.id === id) return node;
                                                   if (node.children) {
                                                       const found = findDeep(node.children, id);
                                                       if (found) return found;
                                                   }
                                               }
                                           })(tree, contextMenu.categoryId);

                                if (cat) {
                                    setEditingDescription({ id: cat.id, name: cat.name, description: cat.description || '', icon: cat.icon || '🗂️', createdAt: cat.createdAt });
                                    setContextMenu(prev => ({ ...prev, visible: false }));
                                }
                            }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                    >
                        <FileText className="w-4 h-4 text-primary" strokeWidth={2.5} /> Edit
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                        onClick={handleDeleteCategoryClick}
                        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" strokeWidth={2.5} /> Delete
                    </button>
                </div>
            )}

            {/* Delete Category Dialog */}
            <DeleteCategoryDialog
                isOpen={deleteDialogOpen}
                category={categoryToDelete}
                impact={deleteImpact}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setCategoryToDelete(null);
                    setDeleteImpact(null);
                }}
                onConfirm={handleConfirmDelete}
            />

            {/* Emoji Picker Dialog */}
            <EmojiPickerDialog
                isOpen={emojiPickerOpen}
                currentEmoji={currentIcon}
                onClose={() => setEmojiPickerOpen(false)}
                onSelect={handleEmojiSelect}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                    <span className="text-primary">Category</span> Manager
                </h1>
            </div>

            <div className="flex gap-6 h-[calc(100vh-200px)]">
                {/* Tree Panel */}
                <div
                    className={`bg-card backdrop-blur rounded-lg border border-border p-4 overflow-y-auto shadow-xl transition-all duration-300 ${selectedCat ? 'w-1/2' : 'w-full'}`}
                    onClick={() => setSelectedCat(null)}
                >
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Hierarchy</h3>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCreateClick(); }}
                                className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center justify-center shadow-sm"
                                title={selectedCat ? "Add Sub-category" : "Add Root Category"}
                            >
                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>
                        <span className="text-xs text-muted-foreground">Drag to reorder • Right-click to edit</span>
                    </div>
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p>Loading structure...</p>
                        </div>
                    ) : tree.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 border-2 border-dashed border-border rounded-lg">
                            No categories found. Create one to start.
                        </div>
                    ) : (
                        <div className="space-y-1 pb-20">
                            {tree.map(node => (
                                <CategoryNode 
                                    key={node.id} 
                                    category={node} 
                                    onSelect={setSelectedCat} 
                                    selectedId={selectedCat}
                                    expandedIds={expandedIds}
                                    onToggleExpand={handleToggleExpand}
                                    onContextMenu={handleContextMenu}
                                    onDragStart={handleDragStart}
                                    onDrop={handleDrop}
                                    editingId={editingId}
                                    onRenameSubmit={handleRenameSubmit}
                                    onRenameCancel={() => setEditingId(null)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Products Sidebar */}
                {selectedCat && (
                    <div className="w-1/2 bg-card backdrop-blur rounded-lg border border-border p-6 overflow-y-auto shadow-xl animate-in slide-in-from-right-10 fade-in">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-primary" strokeWidth={2.5} />
                                    Products in Category
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Showing master items and underlying specific products for selected category.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreatingMasterItem(true)}
                                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center justify-center transition-colors"
                                title={`Create a new Master Item in ${tree.find(c => c.id === selectedCat)?.name || (() => {
                                    const findInTree = (nodes: Category[], id: string): Category | undefined => {
                                        for (const node of nodes) {
                                            if (node.id === id) return node;
                                            if (node.children) {
                                                const found = findInTree(node.children, id);
                                                if (found) return found;
                                            }
                                        }
                                    };
                                    return findInTree(tree, selectedCat)?.name || 'this category';
                                })()}`}
                            >
                                <Plus className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>

                        {loadingProducts ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p>Loading products...</p>
                            </div>
                        ) : groupedProducts.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10 border-2 border-dashed border-border rounded-lg">
                                No products found in this category tree.
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {groupedProducts.map((group) => (
                                    <div key={group.id} className="space-y-4">
                                        {/* Category Header */}
                                        <div className="flex items-center gap-2 pb-2 border-b border-border sticky top-0 bg-card z-10 pt-2">
                                            <span className="text-lg" title={group.icon}>
                                                {group.icon}
                                            </span>
                                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                                                {group.name}
                                            </h3>
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                                                {group.products.length}
                                            </span>
                                        </div>

                                        {/* Master Items */}
                                        <div className="space-y-4 pl-2">
                                            {group.products.map((master: MasterItem) => (
                                                <div key={master.id} className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/20 transition-colors">
                                                    <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-start gap-4 group">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-lg text-primary flex items-center gap-2">
                                                                {master.name}
                                                            </h4>
                                                            {master.description && (
                                                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{master.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleAddProductClick(master)}
                                                                className="p-1.5 bg-background hover:bg-primary hover:text-primary-foreground rounded-lg text-muted-foreground transition-colors"
                                                                title="Add Specific Product"
                                                            >
                                                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleMoveClick(master)}
                                                                className="p-1.5 bg-background hover:bg-primary hover:text-primary-foreground rounded-lg text-muted-foreground transition-colors"
                                                                title="Move Master Item"
                                                            >
                                                                <FolderInput className="w-4 h-4" strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingMasterItem(master)}
                                                                className="p-1.5 bg-background hover:bg-primary hover:text-primary-foreground rounded-lg text-muted-foreground transition-colors"
                                                                title="Edit Master Item"
                                                            >
                                                                <Edit className="w-4 h-4" strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-2 space-y-2">
                                                        {master.specific_products && master.specific_products.length > 0 ? (
                                                            master.specific_products.map((prod: SpecificProduct) => (
                                                                <div key={prod.id} className="flex items-center gap-3 p-2 bg-background rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                                                                    <div className="w-10 h-10 bg-muted/50 rounded-lg border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                                        {prod.imageUrl ? (
                                                                            <Image src={prod.imageUrl} alt={prod.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                                                                        ) : (
                                                                            <Package className="w-5 h-5 text-muted-foreground" />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-sm font-medium truncate text-foreground">{prod.name}</div>
                                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                                            {prod.price !== undefined && (
                                                                                <span className="text-success flex items-center font-medium">
                                                                                    <DollarSign className="w-3 h-3" />{prod.price}
                                                                                </span>
                                                                            )}
                                                                            {prod.asin && (
                                                                                <span className="bg-muted px-1.5 rounded text-muted-foreground">{prod.asin}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-muted-foreground italic px-2 py-2">No specific products linked.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Category Dialog - Using Shared Component */}
            <CreateCategoryDialog
                isOpen={isCreating}
                parentId={selectedCat}
                onClose={() => setIsCreating(false)}
                onCreate={async (name, parentId, description, icon) => {
                    const res = await createCategory(name, parentId, description, icon);
                    if (res.success) {
                        setIsCreating(false);
                        fetchTree();
                        if (parentId) setExpandedIds(prev => new Set(prev).add(parentId));
                    }
                }}
            />

            {/* Edit Category Dialog - Using Shared Component */}
            <EditCategoryDialog
                isOpen={!!editingDescription}
                category={editingDescription ? {
                    id: editingDescription.id,
                    name: editingDescription.name,
                    description: editingDescription.description,
                    icon: editingDescription.icon,
                    createdAt: editingDescription.createdAt
                } : null}
                onClose={() => setEditingDescription(null)}
                onSave={async (id, data) => {
                    const res = await updateCategory(id, data);
                    if (res.success) {
                        setEditingDescription(null);
                        fetchTree();
                    } else {
                        alert('Error updating: ' + (res.message || 'Unknown error'));
                    }
                }}
            />

            {/* Create Master Item Dialog */}
            <Dialog open={isCreatingMasterItem} onOpenChange={setIsCreatingMasterItem}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create Master Item</DialogTitle>
                        <DialogDescription>
                            Create a new master item for this category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="master-name" className="block text-xs font-bold text-muted-foreground uppercase mb-1">Name</label>
                            <Input
                                id="master-name"
                                value={newMasterItem.name}
                                onChange={e => setNewMasterItem(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Item Name (e.g. 72-Hour Kit)"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateMasterItemSubmit()}
                            />
                        </div>
                        <div>
                            <label htmlFor="master-desc" className="block text-xs font-bold text-muted-foreground uppercase mb-1">Description</label>
                            <Textarea
                                id="master-desc"
                                value={newMasterItem.description}
                                onChange={e => setNewMasterItem(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Item Description"
                                className="h-32 resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreatingMasterItem(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateMasterItemSubmit}
                            disabled={!newMasterItem.name}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Master Item Dialog */}
            <Dialog open={!!editingMasterItem} onOpenChange={(open) => !open && setEditingMasterItem(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <style>{`
                        .edit-master-item-dialog input::selection,
                        .edit-master-item-dialog textarea::selection,
                        .edit-master-item-dialog select::selection {
                            background-color: hsl(var(--primary)) !important;
                            color: hsl(var(--primary-foreground)) !important;
                        }
                        .edit-master-item-dialog input::-moz-selection,
                        .edit-master-item-dialog textarea::-moz-selection,
                        .edit-master-item-dialog select::-moz-selection {
                            background-color: hsl(var(--primary)) !important;
                            color: hsl(var(--primary-foreground)) !important;
                        }
                    `}</style>
                    <DialogHeader>
                        <DialogTitle>Edit Master Item</DialogTitle>
                        <DialogDescription>
                            Update the master item details and classification tags.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 edit-master-item-dialog">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="edit-master-name" className="block text-xs font-bold text-muted-foreground uppercase mb-1">Name</label>
                                <Input
                                    id="edit-master-name"
                                    value={editingMasterItem?.name || ''}
                                    onChange={e => setEditingMasterItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    placeholder="Item Name"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-master-desc" className="block text-xs font-bold text-muted-foreground uppercase mb-1">Description</label>
                                <Textarea
                                    id="edit-master-desc"
                                    value={editingMasterItem?.description || ''}
                                    onChange={e => setEditingMasterItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                                    placeholder="Item Description"
                                    className="h-32 resize-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-master-status" className="block text-xs font-bold text-muted-foreground uppercase mb-1">Status</label>
                                <select
                                    id="edit-master-status"
                                    className="w-full bg-background border border-input rounded-lg p-2 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={editingMasterItem?.status || 'active'}
                                    onChange={e => setEditingMasterItem(prev => prev ? { ...prev, status: e.target.value } : null)}
                                >
                                    <option value="active">Active</option>
                                    <option value="pending_review">Pending Review</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                <span className="text-primary">Tags</span> (Classification)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TagSelector
                                    label="Timeframe"
                                    options={TIMEFRAMES}
                                    selected={editingMasterItem?.timeframes}
                                    onChange={(vals) => setEditingMasterItem(prev => prev ? { ...prev, timeframes: vals } : null)}
                                    notSetLabel="Not Set"
                                />
                                <TagSelector
                                    label="Location"
                                    options={LOCATIONS}
                                    selected={editingMasterItem?.locations}
                                    onChange={(vals) => setEditingMasterItem(prev => prev ? { ...prev, locations: vals } : null)}
                                    notSetLabel="Not Set"
                                />
                                <TagSelector
                                    label="Demographics"
                                    options={DEMOGRAPHICS}
                                    selected={editingMasterItem?.demographics}
                                    onChange={(vals) => setEditingMasterItem(prev => prev ? { ...prev, demographics: vals } : null)}
                                    notSetLabel="Not Set"
                                />
                                <TagSelector
                                    label="Scenario"
                                    options={SCENARIOS}
                                    selected={editingMasterItem?.scenarios}
                                    onChange={(vals) => setEditingMasterItem(prev => prev ? { ...prev, scenarios: vals } : null)}
                                    notSetLabel="Not Set"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-card pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setEditingMasterItem(null)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleMasterItemSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Move Master Item Dialog */}
            <Dialog open={!!movingMasterItem} onOpenChange={(open) => !open && setMovingMasterItem(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Move Master Item</DialogTitle>
                        <DialogDescription>
                            Move <span className="font-semibold">{movingMasterItem?.name}</span> to a different category.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div>
                            <p className="text-xs text-warning mb-4 flex items-start gap-2 bg-warning/10 p-2 rounded-lg border border-warning/20">
                                <span className="mt-0.5">⚠️</span>
                                This will move all specific products listed below to the new category context.
                            </p>

                            <label htmlFor="move-dest-cat" className="block text-xs font-bold text-muted-foreground uppercase mb-1">Destination Category</label>
                            <select
                                id="move-dest-cat"
                                className="w-full bg-background border border-input rounded-lg p-2 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                value={targetCategoryId}
                                onChange={e => setTargetCategoryId(e.target.value)}
                            >
                                <option value="">Select Category...</option>
                                {renderCategoryOptions(tree)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 flex justify-between">
                                Affected Items
                                <span className="bg-muted text-foreground px-1.5 rounded-full text-[10px] font-medium">{movingMasterItem?.specific_products?.length || 0}</span>
                            </label>
                            <div className="bg-muted/50 rounded-lg border border-border max-h-40 overflow-y-auto p-2 space-y-1">
                                {movingMasterItem?.specific_products && (movingMasterItem.specific_products as Array<{ id: string, name?: string }>).length > 0 ? (
                                    (movingMasterItem.specific_products as Array<{ id: string, name?: string }>).map((prod) => (
                                        <div key={prod.id} className="flex items-center gap-2 text-sm text-foreground p-1 rounded-lg hover:bg-background transition-colors">
                                            <Package className="w-3 h-3 text-muted-foreground" />
                                            <span className="truncate">{prod.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground text-xs py-4">No specific products found.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setMovingMasterItem(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmMove}
                            disabled={!targetCategoryId}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <FolderInput className="w-4 h-4" strokeWidth={2.5} /> Confirm Move
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Product Dialog */}
            <Dialog open={!!addingProductTo} onOpenChange={(open) => !open && setAddingProductTo(null)}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Product to {addingProductTo?.name}</DialogTitle>
                        <DialogDescription>
                            Search for products on Amazon or add them manually.
                        </DialogDescription>
                    </DialogHeader>
                <div className="flex gap-2 mb-4 border-b border-border">
                    <button
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'search' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('search')}
                    >
                        Search Amazon
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'manual' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('manual')}
                    >
                        Manual Entry
                    </button>
                </div>

                {activeTab === 'search' ? (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-background border border-input rounded-lg p-2 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                value={productSearchQuery}
                                onChange={e => setProductSearchQuery(e.target.value)}
                                placeholder="Search product name or ASIN..."
                                onKeyDown={e => e.key === 'Enter' && handleProductSearch()}
                            />
                            <button
                                onClick={handleProductSearch}
                                disabled={isSearchingProduct}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors"
                            >
                                {isSearchingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" strokeWidth={2.5} />}
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                            {productSearchResults.map((result, idx) => (
                                <div key={idx} className={`flex gap-3 p-3 rounded-lg border transition-colors group relative ${result.is_existing ? 'bg-warning/5 border-warning/30' : 'bg-muted/50 border-border hover:border-primary/50'}`}>
                                    {result.is_existing && (
                                        <div className="absolute top-0 left-0 right-0 bg-warning/20 text-warning text-[10px] px-2 py-0.5 text-center border-b border-warning/30 font-mono">
                                            EXISTING: {result.existing_path}
                                        </div>
                                    )}
                                    <div className={`w-16 h-16 bg-background rounded-lg border border-border flex items-center justify-center shrink-0 overflow-hidden ${result.is_existing ? 'mt-4 opacity-50' : ''}`}>
                                        {result.image_url ? (
                                            <Image src={result.image_url} alt={result.name || 'Product'} width={64} height={64} className="w-full h-full object-contain" unoptimized />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className={`flex-1 min-w-0 ${result.is_existing ? 'mt-4' : ''}`}>
                                        <a href={result.url} target="_blank" rel="noreferrer" className="font-semibold text-sm text-foreground line-clamp-2 hover:text-primary hover:underline transition-colors" title="Open product page">
                                            {result.name} <ExternalLink className="w-3 h-3 inline ml-1 text-muted-foreground" />
                                        </a>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            {result.price && result.price > 0 && <span className="text-success font-mono">${result.price}</span>}
                                            {result.asin && <span className="bg-muted px-1.5 rounded">{result.asin}</span>}
                                            {result.rating && <span>★ {result.rating} ({result.reviews})</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSelectSearchResult(result)}
                                        disabled={result.is_existing}
                                        className={`self-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            result.is_existing
                                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                            : 'bg-background hover:bg-primary hover:text-primary-foreground text-foreground opacity-0 group-hover:opacity-100 border border-border hover:border-primary'
                                        }`}
                                    >
                                        {result.is_existing ? 'Added' : 'Select'}
                                    </button>
                                </div>
                            ))}
                            {productSearchResults.length === 0 && !isSearchingProduct && (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    Enter a search term above to find products.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                        {/* Product Identity Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                <Package className="w-4 h-4 text-primary" strokeWidth={2.5} />
                                Product Identity
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Product Name *</label>
                                <input
                                    className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={newProductForm.name}
                                    onChange={e => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Sawyer Squeeze Water Filter"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Description</label>
                                <textarea
                                    className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground h-24 resize-none outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={newProductForm.description}
                                    onChange={e => setNewProductForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Detailed product description, features, and specs..."
                                />
                            </div>
                        </div>

                        {/* Media & Links Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                <ImageIcon className="w-4 h-4 text-primary" strokeWidth={2.5} />
                                Media & Links
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Product Page URL *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        className="flex-1 bg-background border border-input rounded-lg p-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                                        value={newProductForm.product_url}
                                        onChange={e => setNewProductForm(prev => ({ ...prev, product_url: e.target.value }))}
                                        placeholder="https://amazon.com/..."
                                        required
                                    />
                                    {newProductForm.product_url && (
                                        <a href={newProductForm.product_url} target="_blank" rel="noreferrer" className="p-2.5 bg-muted rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
                                            <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        className="flex-1 bg-background border border-input rounded-lg p-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                                        value={newProductForm.image_url}
                                        onChange={e => setNewProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                                        placeholder="https://..."
                                    />
                                    {newProductForm.image_url && (
                                        <div className="w-10 h-10 bg-muted rounded-lg border border-border overflow-hidden shrink-0">
                                            <Image src={newProductForm.image_url} alt="Product preview" width={40} height={40} className="w-full h-full object-contain" unoptimized />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {newProductForm.image_url && (
                                <div className="mt-2 w-32 h-32 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden">
                                    <Image src={newProductForm.image_url} alt="Full preview" width={128} height={128} className="w-full h-full object-contain" unoptimized />
                                </div>
                            )}
                        </div>

                        {/* Pricing & Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                <DollarSign className="w-4 h-4 text-primary" strokeWidth={2.5} />
                                Pricing & Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Price ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={newProductForm.price}
                                        onChange={e => setNewProductForm(prev => ({ ...prev, price: e.target.value }))}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Type</label>
                                    <select
                                        className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={newProductForm.type}
                                        onChange={e => setNewProductForm(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        <option value="AFFILIATE">Affiliate (Amazon)</option>
                                        <option value="DROP_SHIP">Drop Ship</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">ASIN</label>
                                <input
                                    className="w-full bg-background border border-input rounded-lg p-2.5 text-foreground font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={newProductForm.asin}
                                    onChange={e => setNewProductForm(prev => ({ ...prev, asin: e.target.value }))}
                                    placeholder="B07XXXXX"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-border sticky bottom-0 bg-card">
                            <button onClick={() => setAddingProductTo(null)} className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProductSubmit}
                                disabled={!newProductForm.name || !newProductForm.price || !newProductForm.product_url}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Product
                            </button>
                        </div>
                    </div>
                )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
