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
import { AlertTriangle, Layers } from 'lucide-react';

interface CategoryImpact {
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
          {/* Impact Summary */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-destructive mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              This will permanently delete:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Master items:</span>
                <span className="font-mono font-bold text-destructive">{impact.totalMasterItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Specific products:</span>
                <span className="font-mono font-bold text-destructive">{impact.totalProducts}</span>
              </div>
            </div>
          </div>

          {/* Category Tree Structure */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Items to be deleted:</h4>
            {impact.categoryTree.map((cat) => (
              <div key={cat.id} className="space-y-2">
                {/* Root Category - Outside highlighted box */}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-lg">{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>

                {/* Highlighted box containing only subcategories and master items */}
                {(cat.subcategories.length > 0 || cat.masterItems.length > 0) && (
                  <div className="bg-muted/50 rounded-lg border border-border p-3 max-h-96 overflow-y-auto">
                    {/* Master Items directly under root category */}
                    {cat.masterItems.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {cat.masterItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 text-sm py-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Layers className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded border border-destructive/20 flex-shrink-0">
                              {item.productCount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subcategories */}
                    {cat.subcategories.length > 0 && (
                      <div className="ml-6 space-y-2">
                        {cat.subcategories.map((subcat) => (
                          <div key={subcat.id} className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span className="text-base">{subcat.icon}</span>
                              <span>{subcat.name}</span>
                            </div>

                            {/* Master Items under subcategory */}
                            {subcat.masterItems.length > 0 && (
                              <div className="ml-8 space-y-1">
                                {subcat.masterItems.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between gap-2 text-sm py-1">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Layers className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                      <span className="truncate text-muted-foreground">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded border border-destructive/20 flex-shrink-0">
                                      {item.productCount}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

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
