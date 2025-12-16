"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Download, Key } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { exportUserData } from '@/app/actions/profile';
import { toast } from 'sonner';

interface AccountTabProps {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
}

export function AccountTab({ userId, userEmail, userFirstName, userLastName }: AccountTabProps) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      // Call server action to export data
      const result = await exportUserData(userId, userFirstName, userLastName);

      if (!result.success) {
        toast.error(result.error || 'Failed to export data');
        return;
      }

      // Generate filename: FirstName_LastName_data_export_YYYYMMDD.json
      const today = new Date();
      const dateString = today.toISOString().split('T')[0].replace(/-/g, '');
      const filename = `${userFirstName}_${userLastName}_data_export_${dateString}.json`;

      // Create blob and trigger download
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data export downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An unexpected error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Password Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Password Management
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We recommend using a strong, unique password that you don&apos;t use for other accounts.
          </p>
          <Button onClick={() => setIsPasswordModalOpen(true)}>
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Data Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export My Data (GDPR)
          </CardTitle>
          <CardDescription>
            Download all your personal data in JSON format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will download a complete copy of your data including profile information,
            emergency plans, inventory, and billing history.
          </p>
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                <span>Exporting...</span>
              </div>
            ) : (
              'Export My Data'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
}
