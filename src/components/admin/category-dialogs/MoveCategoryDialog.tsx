"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FolderTree, MoveRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface MoveCategoryDialogProps {
  isOpen: boolean;
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  onSave: (categoryId: string, newParentId: string | null) => Promise<void>;
}

export function MoveCategoryDialog({ isOpen, category, categories, onClose, onSave }: MoveCategoryDialogProps): React.JSX.Element {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get root categories (excluding the category being moved and its children)
  const getRootCategories = (): Category[] => {
    if (!category) return [];

    // Filter out the category being moved
    return categories.filter(c =>
      c.parentId === null &&
      c.id !== category.id
    );
  };

  useEffect(() => {
    if (category) {
      // Default to current parent or null for root
      setSelectedParentId(category.parentId);
    }
  }, [category]);

  const handleSave = async (): Promise<void> => {
    if (!category) return;

    setIsSaving(true);
    try {
      await onSave(category.id, selectedParentId);
      handleClose();
    } catch (error) {
      console.error('Failed to move category:', error);
      alert('Failed to move category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (): void => {
    setSelectedParentId(null);
    onClose();
  };

  if (!category) return <></>;

  const rootCategories = getRootCategories();
  const currentParent = categories.find(c => c.id === category.parentId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MoveRight className="w-5 h-5 text-primary" />
            Move Category
          </DialogTitle>
          <DialogDescription>
            Move "{category.name}" to a different parent category or make it a root category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Location Info */}
          <div className="bg-muted p-3 rounded-lg border border-border">
            <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Current Location</div>
            <div className="text-sm">
              {currentParent ? (
                <>
                  <span className="text-muted-foreground">Under:</span> {currentParent.name}
                </>
              ) : (
                <span className="text-muted-foreground">Root Category</span>
              )}
            </div>
          </div>

          {/* Parent Selection */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
              New Location
            </label>
            <RadioGroup value={selectedParentId || 'root'} onValueChange={(value) => setSelectedParentId(value === 'root' ? null : value)}>
              {/* Root Option */}
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="root" id="root" />
                <Label htmlFor="root" className="flex-1 cursor-pointer flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Root Category</span>
                  <span className="text-xs text-muted-foreground">(Top Level)</span>
                </Label>
              </div>

              {/* Root Categories */}
              {rootCategories.map((rootCat) => (
                <div key={rootCat.id} className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={rootCat.id} id={rootCat.id} />
                  <Label htmlFor={rootCat.id} className="flex-1 cursor-pointer flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{rootCat.name}</span>
                    <span className="text-xs text-muted-foreground">(Subcategory)</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {rootCategories.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No other root categories available. You can only make this a root category.
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
            disabled={isSaving || selectedParentId === category.parentId}
          >
            {isSaving ? 'Moving...' : 'Move Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
