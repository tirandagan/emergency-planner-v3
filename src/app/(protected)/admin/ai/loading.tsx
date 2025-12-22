/**
 * Loading state for LLM System pages
 */

import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function LLMSystemLoading(): React.JSX.Element {
  return (
    <div className="space-y-6 mt-6">
      <Card className="border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}
