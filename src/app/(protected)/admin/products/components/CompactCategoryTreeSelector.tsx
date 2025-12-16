"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronDown, Check, Search, Box, Folder, FolderOpen } from "lucide-react";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
    icon: string | null;
}

interface MasterItem {
    id: string;
    name: string;
    categoryId: string;
    description: string | null;
}

interface CompactCategoryTreeSelectorProps {
    categories: Category[];
    masterItems: MasterItem[];
    selectedMasterItemId: string | null;
    onSelect: (masterItemId: string, categoryId: string, subCategoryId?: string) => void;
    className?: string;
}

type TreeNode = {
    type: 'category' | 'subcategory' | 'master_item';
    id: string;
    name: string;
    children: TreeNode[];
    data?: Category | MasterItem;
};

export default function CompactCategoryTreeSelector({
    categories,
    masterItems,
    selectedMasterItemId,
    onSelect,
    className = ""
}: CompactCategoryTreeSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Build the tree structure
    const treeData = useMemo(() => {
        const roots = categories.filter(c => !c.parentId);
        const subs = categories.filter(c => c.parentId);
        
        const getItems = (catId: string) => 
            masterItems
                .filter(m => m.categoryId === catId)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(m => ({
                    type: 'master_item' as const,
                    id: m.id,
                    name: m.name,
                    children: [],
                    data: m
                }));

        return roots.sort((a, b) => a.name.localeCompare(b.name)).map(root => {
            const rootSubs = subs
                .filter(s => s.parentId === root.id)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(sub => ({
                    type: 'subcategory' as const,
                    id: sub.id,
                    name: sub.name,
                    children: getItems(sub.id),
                    data: sub
                }));
            
            const directItems = getItems(root.id);

            return {
                type: 'category' as const,
                id: root.id,
                name: root.name,
                children: [...rootSubs, ...directItems],
                data: root
            };
        });
    }, [categories, masterItems]);

    // Filter the tree based on search
    const filteredTree = useMemo(() => {
        if (!searchTerm) return treeData;

        const lowerTerm = searchTerm.toLowerCase();

        const filterNode = (node: TreeNode): TreeNode | null => {
            const matches = node.name.toLowerCase().includes(lowerTerm);
            
            if (node.type === 'master_item') {
                return matches ? node : null;
            }

            const filteredChildren = node.children
                .map(child => filterNode(child))
                .filter((child): child is TreeNode => child !== null);

            if (matches || filteredChildren.length > 0) {
                return {
                    ...node,
                    children: filteredChildren
                };
            }

            return null;
        };

        return treeData
            .map(root => filterNode(root))
            .filter((node): node is TreeNode => node !== null);
    }, [treeData, searchTerm]);

    // Initialize expanded state for selected item
    useEffect(() => {
        if (selectedMasterItemId && !searchTerm) {
            const selectedItem = masterItems.find(m => m.id === selectedMasterItemId);
            if (selectedItem) {
                const categoryId = selectedItem.categoryId;
                const category = categories.find(c => c.id === categoryId);
                const toExpand = new Set<string>();
                
                if (category) {
                    toExpand.add(category.id);
                    if (category.parentId) {
                        toExpand.add(category.parentId);
                    }
                }
                setExpandedIds(prev => {
                    const next = new Set(prev);
                    toExpand.forEach(id => next.add(id));
                    return next;
                });
            }
        }
    }, [selectedMasterItemId, categories, masterItems, searchTerm]);

    // Auto-expand all when searching
    useEffect(() => {
        if (searchTerm) {
            const allIds = new Set<string>();
            const traverse = (nodes: TreeNode[]) => {
                nodes.forEach(node => {
                    if (node.type !== 'master_item') {
                        allIds.add(node.id);
                        traverse(node.children);
                    }
                });
            };
            traverse(filteredTree);
            setExpandedIds(allIds);
        }
    }, [searchTerm, filteredTree]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelect = (node: TreeNode) => {
        if (node.type === 'master_item') {
            const masterItem = node.data as MasterItem;
            const catId = masterItem.categoryId;
            const cat = categories.find(c => c.id === catId);
             
            if (cat) {
                if (cat.parentId) {
                    onSelect(masterItem.id, cat.parentId, cat.id);
                } else {
                    onSelect(masterItem.id, cat.id, undefined);
                }
            }
        }
    };

    const renderNode = (node: TreeNode, depth: number = 0) => {
        const isExpanded = expandedIds.has(node.id);
        const isSelected = node.type === 'master_item' && node.id === selectedMasterItemId;
        const hasChildren = node.children.length > 0;
        
        const paddingLeft = `${depth * 16 + 12}px`;

        if (node.type === 'master_item') {
            return (
                <div
                    key={node.id}
                    className={`
                        group flex items-center py-1.5 pr-2 cursor-pointer transition-colors text-sm
                        ${isSelected ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                    `}
                    style={{ paddingLeft }}
                    onClick={() => handleSelect(node)}
                >
                    <Box className={`w-4 h-4 mr-2 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-muted-foreground'}`} strokeWidth={2.5} />
                    <span className="truncate">{node.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-primary" strokeWidth={2.5} />}
                </div>
            );
        }

        return (
            <div key={node.id}>
                <div
                    className="flex items-center py-1.5 pr-2 cursor-pointer hover:bg-muted/50 text-foreground text-sm font-medium transition-colors select-none"
                    style={{ paddingLeft }}
                    onClick={() => toggleExpand(node.id)}
                >
                    <span className="mr-1.5 text-muted-foreground">
                        {hasChildren ? (
                            isExpanded ? <ChevronDown className="w-4 h-4" strokeWidth={2.5} /> : <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                        ) : (
                            <span className="w-4 h-4 inline-block" />
                        )}
                    </span>
                    {node.type === 'category' ? (
                        <span className="category-icon mr-2" title={(node.data as Category).icon || '🗂️'}>
                            {(node.data as Category).icon || '🗂️'}
                        </span>
                    ) : (node.type === 'subcategory' ? (
                        <span className="category-icon mr-2" title={(node.data as Category).icon || '📁'}>
                            {(node.data as Category).icon || '📁'}
                        </span>
                    ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-2.5 ml-1" />
                    ))}
                    <span className="truncate">{node.name}</span>
                    {hasChildren && (
                        <span className="ml-auto text-xs text-muted-foreground font-normal">
                            {node.children.length}
                        </span>
                    )}
                </div>
                {isExpanded && hasChildren && (
                    <div className="border-l border-border ml-[19px]">
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                <input
                    type="text"
                    placeholder="Search categories & items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background border border-input rounded-lg py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary transition-all"
                />
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px] pr-1 space-y-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {filteredTree.length > 0 ? (
                    filteredTree.map(root => renderNode(root, 0))
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No matches found
                    </div>
                )}
            </div>
        </div>
    );
}
