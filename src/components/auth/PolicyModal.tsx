"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface PolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  onAccept: () => void;
  isAccepted: boolean;
}

export function PolicyModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onAccept,
  isAccepted,
}: PolicyModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setHasScrolledToBottom(false);
      setShowScrollIndicator(true);
    }
  }, [open]);

  useEffect(() => {
    // Check if content is scrollable on mount
    const element = contentRef.current;
    if (!element) return;

    const isScrollable = element.scrollHeight > element.clientHeight;
    if (!isScrollable) {
      // If content fits without scrolling, mark as scrolled to bottom
      setHasScrolledToBottom(true);
      setShowScrollIndicator(false);
    }
  }, [open, children]);

  function handleScroll(): void {
    const element = contentRef.current;
    if (!element) return;

    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Hide scroll indicator once user starts scrolling
    if (scrollTop > 20) {
      setShowScrollIndicator(false);
    }
    
    // Consider scrolled to bottom if within 10px
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  }

  function handleAccept(): void {
    onAccept();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 gap-0 flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {title}
              {isAccepted && (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto px-6 py-4 space-y-4 text-sm text-gray-700 dark:text-gray-300"
          >
            {children}
          </div>
          {showScrollIndicator && !hasScrolledToBottom && !isAccepted && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none flex items-end justify-center pb-2">
              <div className="flex flex-col items-center gap-1 text-amber-600 dark:text-amber-400 animate-bounce">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
                <span className="text-xs font-medium">Scroll to read</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
          {!hasScrolledToBottom && !isAccepted && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Please scroll to the bottom to continue
            </p>
          )}
          {hasScrolledToBottom && !isAccepted && (
            <p className="text-sm text-green-600 dark:text-green-400">
              You have read to the end
            </p>
          )}
          {isAccepted && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Accepted
            </p>
          )}

          <div className="flex gap-2 ml-auto">
            {!isAccepted && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            )}
            {isAccepted ? (
              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleAccept}
                disabled={!hasScrolledToBottom}
              >
                Accept
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

