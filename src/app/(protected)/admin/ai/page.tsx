/**
 * LLM System - Unified Tabbed Interface
 *
 * Three tabs managed by layout via URL params:
 * - Overview: AI usage and costs dashboard
 * - Queue: LLM job queue management
 * - Webhooks: Webhook callback history
 */

'use client';

import { TabsContent } from '@/components/ui/tabs';
import { LLMQueueTab } from '@/app/(protected)/admin/debug/LLMQueueTab';
import { WebhooksTab } from '@/components/admin/ai/WebhooksTab';
import { LLMOverviewTab } from '@/components/admin/ai/LLMOverviewTab';

export default function LLMSystemPage(): React.JSX.Element {
  return (
    <>
      <TabsContent value="overview" className="space-y-6 mt-6">
        <LLMOverviewTab />
      </TabsContent>

      <TabsContent value="queue" className="mt-6">
        <LLMQueueTab />
      </TabsContent>

      <TabsContent value="webhooks" className="mt-6">
        <WebhooksTab />
      </TabsContent>
    </>
  );
}
