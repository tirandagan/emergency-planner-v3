"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Smile } from 'lucide-react';
import { EmojiPickerDialog } from '@/components/admin/EmojiPicker';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: Date;
}

interface EditCategoryDialogProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; description: string; icon: string }) => Promise<void>;
}

export function EditCategoryDialog({ isOpen, category, onClose, onSave }: EditCategoryDialogProps): JSX.Element | null {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🗂️');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setIcon(category.icon || '🗂️');
    }
  }, [category]);

  const handleSave = async (): Promise<void> => {
    if (!category || !name.trim()) return;

    setIsSaving(true);
    try {
      await onSave(category.id, { name: name.trim(), description: description.trim(), icon });
      handleClose();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category. Please try again.');
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

  if (!category) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <style>{`
            .edit-category-dialog input::selection,
            .edit-category-dialog textarea::selection {
              background-color: hsl(var(--primary));
              color: hsl(var(--primary-foreground));
            }
          `}</style>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name, icon, and description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 edit-category-dialog">
            {/* Name Field */}
            <div>
              <label htmlFor="edit-name" className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Name *
              </label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category Name"
                disabled={isSaving}
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
              <label htmlFor="edit-desc" className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Description
              </label>
              <Textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter category description..."
                className="h-32"
                disabled={isSaving}
              />
            </div>

            {/* Creation Date (Read-only) */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Created</label>
              <div className="text-sm text-muted-foreground">
                {category.createdAt ? new Date(category.createdAt).toLocaleString() : 'Unknown'}
              </div>
            </div>
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
              {isSaving ? 'Saving...' : 'Save Changes'}
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
