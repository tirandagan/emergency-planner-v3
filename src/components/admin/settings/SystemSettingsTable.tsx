'use client';

/**
 * System Settings Table Component
 * Allows admins to edit global system configuration
 */

import React, { useState } from 'react';
import { Edit2, Save, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { updateSystemSetting } from '@/app/actions/admin';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  valueType: 'number' | 'string' | 'boolean' | 'object' | 'array';
  description: string | null;
  category: string;
  isEditable: boolean;
  environment: string | null;
}

interface SystemSettingsTableProps {
  settings: SystemSetting[];
  className?: string;
}

export function SystemSettingsTable({
  settings,
  className = '',
}: SystemSettingsTableProps): React.JSX.Element {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (setting: SystemSetting): void => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleCancel = (): void => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSave = async (setting: SystemSetting): Promise<void> => {
    setIsSaving(true);
    try {
      // Parse value based on type
      let parsedValue: unknown;
      switch (setting.valueType) {
        case 'number':
          parsedValue = Number(editValue);
          if (isNaN(parsedValue as number)) {
            toast.error('Invalid number value');
            setIsSaving(false);
            return;
          }
          break;
        case 'boolean':
          parsedValue = editValue === 'true';
          break;
        case 'object':
        case 'array':
          try {
            parsedValue = JSON.parse(editValue);
          } catch {
            toast.error('Invalid JSON value');
            setIsSaving(false);
            return;
          }
          break;
        default:
          parsedValue = editValue;
      }

      const result = await updateSystemSetting(setting.key, parsedValue);

      if (result.success) {
        toast.success('Setting updated successfully');
        setEditingKey(null);
        setEditValue('');
      } else {
        toast.error(result.error || 'Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('An error occurred while updating the setting');
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditInput = (setting: SystemSetting): React.ReactNode => {
    if (setting.valueType === 'boolean') {
      return (
        <Switch
          isSelected={editValue === 'true'}
          onChange={(isSelected) => setEditValue(isSelected ? 'true' : 'false')}
        />
      );
    }

    return (
      <Input
        type={setting.valueType === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="max-w-xs"
        autoFocus
      />
    );
  };

  const renderValue = (setting: SystemSetting): React.ReactNode => {
    if (setting.valueType === 'boolean') {
      return (
        <Badge variant={setting.value === 'true' ? 'default' : 'secondary'}>
          {setting.value === 'true' ? 'Enabled' : 'Disabled'}
        </Badge>
      );
    }

    if (setting.valueType === 'object' || setting.valueType === 'array') {
      return (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {setting.value.length > 50 ? `${setting.value.substring(0, 50)}...` : setting.value}
        </code>
      );
    }

    return <span className="font-mono text-sm">{setting.value}</span>;
  };

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return {};
  }, {} as Record<string, SystemSetting[]>);

  const categories = Object.keys(groupedSettings);

  return (
    <TooltipProvider>
      <div className={`space-y-8 ${className}`}>
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-foreground mb-4 capitalize">
              {category.replace(/_/g, ' ')} Settings
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Setting</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[120px]">Environment</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedSettings[category].map((setting) => {
                    const isEditing = editingKey === setting.key;

                    return (
                      <TableRow key={setting.id}>
                        {/* Setting Name & Description */}
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground text-sm">
                                {setting.key.replace(/_/g, ' ')}
                              </div>
                              {setting.description && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {setting.description}
                                </div>
                              )}
                            </div>
                            {setting.description && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>{setting.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>

                        {/* Value */}
                        <TableCell>
                          {isEditing ? renderEditInput(setting) : renderValue(setting)}
                        </TableCell>

                        {/* Type */}
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {setting.valueType}
                          </Badge>
                        </TableCell>

                        {/* Environment */}
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {setting.environment}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          {!setting.isEditable ? (
                            <Badge variant="secondary" className="text-xs">
                              Read-only
                            </Badge>
                          ) : isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSave(setting)}
                                disabled={isSaving}
                              >
                                <Save className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                disabled={isSaving}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(setting)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
