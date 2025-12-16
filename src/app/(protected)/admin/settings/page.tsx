import { Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { SystemSettingsTable, type SystemSetting } from '@/components/admin/settings/SystemSettingsTable';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function AdminSettingsPage() {
  // Fetch all system settings
  const allSettings = await db.select().from(systemSettings);

  // Cast to SystemSetting type for component
  const settings: SystemSetting[] = allSettings.map((setting) => ({
    id: setting.id,
    key: setting.key,
    value: setting.value,
    valueType: setting.valueType,
    description: setting.description,
    category: setting.category,
    isEditable: setting.isEditable,
    environment: setting.environment,
  }));

  return (
    <div className="p-8 space-y-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-primary/10 p-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure global system parameters and application behavior
          </p>
        </div>
      </div>

      {/* Warning Notice */}
      <Alert variant="destructive" className="border-warning/20 bg-warning/5">
        <AlertCircle className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Admin Configuration</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          These settings affect the entire system. Changes take effect immediately and may impact all users.
          Use caution when modifying values.
        </AlertDescription>
      </Alert>

      {/* Settings Table */}
      <Card className="p-6">
        {settings.length > 0 ? (
          <SystemSettingsTable settings={settings} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No system settings configured.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
