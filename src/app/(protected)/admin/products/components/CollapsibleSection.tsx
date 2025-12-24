import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  preview?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  preview,
  badge,
  children
}: CollapsibleSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="border border-border rounded-xl bg-card">
      <CollapsibleTrigger className="w-full flex items-center justify-between py-4 px-6 hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-3 flex-1">
          <Icon className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {title}
          </h3>
          {!isOpen && preview && (
            <span className="text-xs text-muted-foreground ml-2 truncate">
              {preview}
            </span>
          )}
          {badge}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" strokeWidth={2.5} />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent
        forceMount
        className="px-6 pb-6"
        style={{
          height: isOpen ? 'auto' : '0',
          overflow: isOpen ? 'visible' : 'hidden',
          opacity: isOpen ? 1 : 0,
          paddingTop: isOpen ? undefined : 0,
          paddingBottom: isOpen ? undefined : 0,
          transition: 'height 200ms ease-in-out, opacity 200ms ease-in-out'
        }}
      >
        <div className="space-y-6 pt-4">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
