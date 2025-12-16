import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Package } from 'lucide-react';

interface CategoryImpact {
  subcategoryCount: number;
  masterItemCount: number;
  affectedItems: Array<{ id: string; name: string }>;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
}

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  category: Category | null;
  impact: CategoryImpact | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteCategoryDialog({
  isOpen,
  category,
  impact,
  onClose,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!category || !impact) return null;

  const canDelete = confirmText === category.name;

  const handleConfirm = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    setConfirmText('');
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Category?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the category and all its subcategories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Info */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{category.icon}</span>
              <div>
                <h4 className="font-bold text-lg">{category.name}</h4>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-destructive mb-3">Impact Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subcategories to delete:</span>
                <span className="font-mono font-bold">{impact.subcategoryCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Master items affected:</span>
                <span className="font-mono font-bold">{impact.masterItemCount}</span>
              </div>
            </div>
          </div>

          {/* Affected Items Preview */}
          {impact.affectedItems.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Affected Items (first 5)</h4>
              <div className="bg-muted/50 rounded-lg border border-border p-2 space-y-1 max-h-32 overflow-y-auto">
                {impact.affectedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm p-1">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
                {impact.masterItemCount > 5 && (
                  <p className="text-xs text-muted-foreground italic px-1">
                    ...and {impact.masterItemCount - 5} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Type <span className="font-mono bg-muted px-1 rounded">{category.name}</span> to confirm:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter category name..."
              className={canDelete ? 'border-destructive' : ''}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
