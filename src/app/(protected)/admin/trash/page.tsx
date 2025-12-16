import { Trash2, AlertCircle, Info } from 'lucide-react';
import { getAllDeletedPlans } from '@/lib/mission-reports';
import { AdminTrashView, type DeletedPlan } from '@/components/admin/trash/AdminTrashView';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getDeletedPlansRetentionDays } from '@/db/queries/system-settings';

export default async function AdminTrashPage() {
  // Fetch all deleted plans across all users
  const deletedPlans = await getAllDeletedPlans();

  // Get retention period from system settings
  const retentionDays = await getDeletedPlansRetentionDays();

  // Calculate statistics
  const totalDeleted = deletedPlans.length;
  const expiredCount = deletedPlans.filter((p) => !p.canRestore).length;
  const restorableCount = deletedPlans.filter((p) => p.canRestore).length;

  // Cast to component type
  const plans: DeletedPlan[] = deletedPlans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    userId: plan.userId,
    userEmail: plan.userEmail,
    deletedAt: plan.deletedAt,
    daysUntilPermanentDeletion: plan.daysUntilPermanentDeletion,
    canRestore: plan.canRestore,
  }));

  return (
    <div className="p-8 space-y-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Trash2 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Trash Management</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor and manage deleted plans across all users
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Deleted</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalDeleted}</p>
            </div>
            <div className="rounded-full bg-muted/50 p-3">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Restorable</p>
              <p className="text-2xl font-bold text-primary mt-1">{restorableCount}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-destructive mt-1">{expiredCount}</p>
            </div>
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      {/* Info Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Retention Policy</AlertTitle>
        <AlertDescription className="text-sm">
          Deleted plans are retained for {retentionDays} days before permanent deletion. Users can restore
          plans within this window. Plans beyond the retention period are automatically cleaned up.
        </AlertDescription>
      </Alert>

      {/* Trash View */}
      <Card className="p-6">
        <AdminTrashView plans={plans} />
      </Card>
    </div>
  );
}
