"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MoveRight, FolderTree, ArrowRight } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  icon?: string | null;
};

type MasterItem = {
  id: string;
  name: string;
  categoryId: string;
};

interface MoveMasterItemDialogProps {
  isOpen: boolean;
  masterItem: MasterItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: (masterItemId: string, targetCategoryId: string) => Promise<void>;
}

export function MoveMasterItemDialog({ isOpen, masterItem, categories, onClose, onSave }: MoveMasterItemDialogProps): React.JSX.Element {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const currentSubcategoryRef = useRef<HTMLDivElement>(null);

  // Get current category details
  const currentCategory = useMemo(() => {
    if (!masterItem) return null;
    return categories.find(c => c.id === masterItem.categoryId);
  }, [masterItem, categories]);

  // Get parent category of current location
  const currentParentCategory = useMemo(() => {
    if (!currentCategory || !currentCategory.parentId) return null;
    return categories.find(c => c.id === currentCategory.parentId);
  }, [currentCategory, categories]);

  // Group subcategories by parent
  const groupedSubcategories = useMemo(() => {
    const subcategories = categories.filter(c => c.parentId !== null);
    const grouped = new Map<string, Category[]>();

    subcategories.forEach(sub => {
      const parent = categories.find(c => c.id === sub.parentId);
      if (parent) {
        if (!grouped.has(parent.id)) {
          grouped.set(parent.id, []);
        }
        grouped.get(parent.id)!.push(sub);
      }
    });

    return grouped;
  }, [categories]);

  // Get all parent categories that have subcategories
  const parentCategories = useMemo(() => {
    return categories.filter(c => c.parentId === null && groupedSubcategories.has(c.id));
  }, [categories, groupedSubcategories]);

  // Disable save button logic
  const isMoveDisabled = useMemo(() => {
    return !selectedCategoryId ||
           selectedCategoryId === masterItem?.categoryId ||
           isSaving;
  }, [selectedCategoryId, masterItem?.categoryId, isSaving]);

  useEffect(() => {
    if (masterItem) {
      // Default to current category
      setSelectedCategoryId(masterItem.categoryId);
    }
  }, [masterItem]);

  // Auto-scroll to current subcategory when dialog opens
  useEffect(() => {
    if (isOpen && currentSubcategoryRef.current) {
      // Longer delay to ensure dialog animation and full rendering completes
      const timeoutId = setTimeout(() => {
        currentSubcategoryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, masterItem?.categoryId]);

  const handleSave = async (): Promise<void> => {
    if (!masterItem || !selectedCategoryId) return;

    setIsSaving(true);
    try {
      await onSave(masterItem.id, selectedCategoryId);
      handleClose();
    } catch (error) {
      console.error('Failed to move master item:', error);
      alert('Failed to move master item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (): void => {
    setSelectedCategoryId(null);
    onClose();
  };

  if (!masterItem) return <></>;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveRight className="w-5 h-5 text-primary" />
            Move Master Item
          </DialogTitle>
          <DialogDescription>
            Move &quot;{masterItem.name}&quot; to a different category. All associated products will move automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Location Info */}
          <div className="bg-muted p-3 rounded-lg border border-border">
            <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Current Location</div>
            <div className="text-sm">
              {currentParentCategory && (
                <div className="text-muted-foreground">
                  Category: {currentParentCategory.icon || '🗂️'} {currentParentCategory.name}
                </div>
              )}
              <div>
                Subcategory: {currentCategory?.icon || '📁'} {currentCategory?.name || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
              New Location
            </label>
            <RadioGroup value={selectedCategoryId || ''} onValueChange={setSelectedCategoryId}>
              <div className="space-y-4 pl-8 -ml-8">
                {parentCategories.map((parentCat) => {
                  const subcategories = groupedSubcategories.get(parentCat.id) || [];
                  return (
                    <div key={parentCat.id} className="space-y-2">
                      {/* Parent Category Header (non-selectable) */}
                      <div className="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-foreground">
                        <FolderTree className="w-4 h-4 text-muted-foreground" />
                        <span>{parentCat.icon || '🗂️'} {parentCat.name}</span>
                      </div>

                      {/* Subcategories (selectable) */}
                      <div className="ml-6 space-y-2">
                        {subcategories.map((subCat) => {
                          const isCurrentLocation = subCat.id === masterItem.categoryId;
                          return (
                            <div
                              key={subCat.id}
                              ref={isCurrentLocation ? currentSubcategoryRef : null}
                              className={`relative flex items-center space-x-2 p-3 rounded-lg border border-border transition-colors ${
                                isCurrentLocation
                                  ? 'bg-muted/50 opacity-60 cursor-not-allowed'
                                  : 'hover:bg-muted/50'
                              }`}
                            >
                              {/* Arrow indicator for current location */}
                              {isCurrentLocation && (
                                <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center">
                                  <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                                </div>
                              )}

                              <RadioGroupItem
                                value={subCat.id}
                                id={subCat.id}
                                disabled={isCurrentLocation}
                              />
                              <Label
                                htmlFor={subCat.id}
                                className={`flex-1 flex items-center gap-2 ${
                                  isCurrentLocation ? 'cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                <span>{subCat.icon || '📁'}</span>
                                <span className="font-medium">{subCat.name}</span>
                                {isCurrentLocation && (
                                  <span className="ml-auto text-xs text-muted-foreground">(Current)</span>
                                )}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            {parentCategories.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No subcategories available. Please create subcategories first.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isMoveDisabled}
          >
            {isSaving ? 'Moving...' : 'Move Master Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
