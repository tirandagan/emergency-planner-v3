"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Smile } from 'lucide-react';
import { EmojiPickerDialog } from '@/components/admin/EmojiPicker';

interface AddCategoryDialogProps {
  isOpen: boolean;
  parentCategory: { id: string; name: string } | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string; icon: string; parentId: string | null }) => Promise<void>;
}

export function AddCategoryDialog({ isOpen, parentCategory, onClose, onSave }: AddCategoryDialogProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🗂️');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        icon,
        parentId: parentCategory?.id || null
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (): void => {
    setName('');
    setDescription('');
    setIcon('🗂️');
    setEmojiPickerOpen(false);
    onClose();
  };

  const handleEmojiSelect = (emoji: string): void => {
    setIcon(emoji);
    setEmojiPickerOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <style>{`
            .add-category-dialog input::selection,
            .add-category-dialog textarea::selection {
              background-color: hsl(var(--primary));
              color: hsl(var(--primary-foreground));
            }
          `}</style>
          <DialogHeader>
            <DialogTitle>
              {parentCategory ? `Add Subcategory to "${parentCategory.name}"` : 'Add Root Category'}
            </DialogTitle>
            <DialogDescription>
              {parentCategory
                ? `Create a new subcategory under "${parentCategory.name}".`
                : 'Create a new root-level category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 add-category-dialog">
            {/* Name Field */}
            <div>
              <label htmlFor="add-name" className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Name *
              </label>
              <Input
                id="add-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category Name"
                disabled={isSaving}
                autoFocus
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Icon</label>
              <div className="flex items-center gap-3">
                <div className="text-4xl">{icon}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEmojiPickerOpen(true)}
                  className="gap-2"
                  disabled={isSaving}
                >
                  <Smile className="w-4 h-4" />
                  Choose Icon
                </Button>
              </div>
            </div>

            {/* Slug Preview (Read-only) */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                URL Slug (Auto-generated)
              </label>
              <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded border border-border">
                {name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'preview-slug'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Used in URLs and API endpoints</p>
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="add-desc" className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Description
              </label>
              <Textarea
                id="add-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter category description..."
                className="h-32"
                disabled={isSaving}
              />
            </div>

            {/* Parent Category Info */}
            {parentCategory && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Parent Category</label>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded border border-border">
                  {parentCategory.name}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker Dialog */}
      <EmojiPickerDialog
        isOpen={emojiPickerOpen}
        currentEmoji={icon}
        onClose={() => setEmojiPickerOpen(false)}
        onSelect={handleEmojiSelect}
      />
    </>
  );
}
