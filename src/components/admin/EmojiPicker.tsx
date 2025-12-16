import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';

interface EmojiPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentEmoji?: string;
}

export function EmojiPickerDialog({
  isOpen,
  onClose,
  onSelect,
  currentEmoji
}: EmojiPickerDialogProps) {
  const { theme } = useTheme();

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Category Icon</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {currentEmoji && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Current Icon</p>
              <div className="text-5xl">{currentEmoji}</div>
            </div>
          )}
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchPlaceHolder="Search emojis..."
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            width="100%"
            height="400px"
            previewConfig={{ showPreview: false }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
