'use client';

import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
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
import type { MasterItem } from '@/lib/products-types';

interface DeleteMasterItemDialogProps {
  isOpen: boolean;
  masterItem: MasterItem | null;
  products: Array<{ id: string; name: string; asin: string | null }>;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

/**
 * DeleteMasterItemDialog
 *
 * Confirmation modal for deleting master items with two variants:
 * - With products: 2-step confirmation (name typing + final confirm)
 * - Without products: 1-step confirmation (simple yes/no)
 */
export function DeleteMasterItemDialog({
  isOpen,
  masterItem,
  products,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteMasterItemDialogProps): React.JSX.Element {
  const [nameInput, setNameInput] = useState('');
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  const hasProducts = products.length > 0;
  const nameMatches = nameInput.trim() === masterItem?.name;

  // Reset modal state when closed to ensure clean state on next open
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNameInput('');
      setShowFinalConfirmation(false);
    }
  }, [isOpen]);

  if (!masterItem) return <></>;

  if (hasProducts) {
    if (showFinalConfirmation) {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Final Confirmation
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. Are you absolutely sure?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                You are about to permanently delete:
              </p>
              <p className="text-base font-semibold mt-2">{masterItem.name}</p>
              <p className="text-sm text-destructive mt-2">
                This will delete {products.length} associated product{products.length !== 1 ? 's' : ''}.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowFinalConfirmation(false)}
                disabled={isDeleting}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Master Item
            </DialogTitle>
            <DialogDescription>
              This master item has associated products that will also be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-semibold text-destructive mb-2">
                ⚠️ Warning: {products.length} product{products.length !== 1 ? 's' : ''} will be permanently deleted:
              </p>
              <div className="max-h-[200px] overflow-y-auto space-y-1 bg-card border-2 border-border rounded shadow-sm p-3">
                {products.map((product) => (
                  <div key={product.id} className="text-sm text-foreground">
                    • {product.name} {product.asin ? `(${product.asin})` : ''}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Type <span className="font-semibold text-foreground">{masterItem.name}</span> to confirm deletion:
              </p>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter master item name"
                className="font-mono"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowFinalConfirmation(true)}
              disabled={!nameMatches}
            >
              Continue to Confirmation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete Master Item
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this master item?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-base font-semibold">{masterItem.name}</p>
          <p className="text-sm text-muted-foreground mt-2">
            This master item has no associated products.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
