"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Smile } from 'lucide-react';
import { EmojiPickerDialog } from '@/components/admin/EmojiPicker';

interface CreateCategoryDialogProps {
  isOpen: boolean;
  parentId: string | null;
  onClose: () => void;
  onCreate: (name: string, parentId: string | null, description: string, icon: string) => Promise<void>;
}

export function CreateCategoryDialog({ isOpen, parentId, onClose, onCreate }: CreateCategoryDialogProps): JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🗂️');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (): Promise<void> => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(name.trim(), parentId, description.trim(), icon);
      handleClose();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setIsCreating(false);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && name.trim()) {
      handleCreate();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <style>{`
            .create-category-dialog input::selection,
            .create-category-dialog textarea::selection {
              background-color: hsl(var(--primary));
              color: hsl(var(--primary-foreground));
            }
          `}</style>
          <DialogHeader>
            <DialogTitle>{parentId ? "Create Sub-Category" : "Create Root Category"}</DialogTitle>
            <DialogDescription>
              Create a new category to organize your master items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 create-category-dialog">
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
                  disabled={isCreating}
                >
                  <Smile className="w-4 h-4" />
                  Choose Icon
                </Button>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="cat-name" className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Name *
              </label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category Name"
                autoFocus
                onKeyDown={handleKeyDown}
                disabled={isCreating}
              />
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="cat-desc" className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Description (Optional)
              </label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Category Description"
                className="h-20 resize-none"
                disabled={isCreating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
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
