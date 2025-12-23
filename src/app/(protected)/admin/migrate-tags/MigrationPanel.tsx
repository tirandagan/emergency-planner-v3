'use client';

import { useState } from 'react';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { migrateTagSystem, rollbackTagSystemMigration } from '../products/actions/migrate-tag-system';

interface MigrationResult {
    success: boolean;
    productsUpdated: number;
    masterItemsRecalculated: number;
    masterItemsSkipped: number;
    skippedMasterItems: Array<{
        masterItemId: string;
        masterItemName: string;
        categoryName: string;
        subcategoryName: string | null;
        reason: string;
        productIds: string[];
    }>;
    changes: Array<{
        productId: string;
        productName: string;
        changes: string[];
    }>;
    error?: string;
}

interface RollbackResult {
    success: boolean;
    productsRolledBack: number;
    masterItemsRecalculated: number;
    error?: string;
}

export function MigrationPanel(): JSX.Element {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<MigrationResult | null>(null);
    const [rollbackResult, setRollbackResult] = useState<RollbackResult | null>(null);

    const handleRunMigration = async (): Promise<void> => {
        setIsRunning(true);
        setResult(null);
        setRollbackResult(null);

        try {
            const migrationResult = await migrateTagSystem();
            setResult(migrationResult);
        } catch (error) {
            setResult({
                success: false,
                productsUpdated: 0,
                masterItemsRecalculated: 0,
                masterItemsSkipped: 0,
                skippedMasterItems: [],
                changes: [],
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsRunning(false);
        }
    };

    const handleRollback = async (): Promise<void> => {
        if (!confirm('Are you sure you want to rollback the migration? This will restore Individual/Family tags.')) {
            return;
        }

        setIsRunning(true);
        setRollbackResult(null);

        try {
            const rollback = await rollbackTagSystemMigration();
            setRollbackResult(rollback);
        } catch (error) {
            setRollbackResult({
                success: false,
                productsRolledBack: 0,
                masterItemsRecalculated: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Migration Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Migration Overview</CardTitle>
                    <CardDescription>What this migration does:</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span>
                                Converts <code className="bg-muted px-1 py-0.5 rounded">&quot;individual&quot;</code> tags
                                to <code className="bg-muted px-1 py-0.5 rounded">X1 multiplier = OFF</code>
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span>
                                Converts <code className="bg-muted px-1 py-0.5 rounded">&quot;family&quot;</code> tags to{' '}
                                <code className="bg-muted px-1 py-0.5 rounded">X1 multiplier = ON</code>
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span>
                                Converts <code className="bg-muted px-1 py-0.5 rounded">&quot;&gt;1 year&quot;</code> to{' '}
                                <code className="bg-muted px-1 py-0.5 rounded">&quot;1 year&quot;</code>
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span>Sets default X1 multiplier to OFF for products without individual/family tags</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                            <span>Recalculates all master item tags from child products (upward propagation)</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <Button onClick={handleRunMigration} disabled={isRunning} size="lg">
                    {isRunning ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Running Migration...
                        </>
                    ) : (
                        'Run Migration'
                    )}
                </Button>

                {result?.success && (
                    <Button onClick={handleRollback} disabled={isRunning} variant="outline" size="lg">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Rollback Migration
                    </Button>
                )}
            </div>

            {/* Migration Results */}
            {result && (
                <Alert variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>{result.success ? 'Migration Successful!' : 'Migration Failed'}</AlertTitle>
                    <AlertDescription>
                        {result.success ? (
                            <div className="space-y-2 mt-2">
                                <p>
                                    Updated <strong>{result.productsUpdated}</strong> products and recalculated{' '}
                                    <strong>{result.masterItemsRecalculated}</strong> master items.
                                </p>
                                {result.masterItemsSkipped > 0 && (
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                                        <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                                            ⚠️ Skipped {result.masterItemsSkipped} master item(s) with no tags
                                        </p>
                                        <details>
                                            <summary className="cursor-pointer text-sm text-yellow-700 dark:text-yellow-300">
                                                View Skipped Items
                                            </summary>
                                            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                                                {result.skippedMasterItems.map(item => (
                                                    <div
                                                        key={item.masterItemId}
                                                        className="bg-white dark:bg-gray-900 p-3 rounded text-sm border border-yellow-200 dark:border-yellow-800"
                                                    >
                                                        <p className="font-medium text-base">{item.masterItemName}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            <span className="font-medium">Category:</span> {item.categoryName}
                                                            {item.subcategoryName && (
                                                                <> • <span className="font-medium">Subcategory:</span> {item.subcategoryName}</>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                                                            {item.reason}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            <span className="font-medium">Product IDs:</span> {item.productIds.join(', ')}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    </div>
                                )}
                                {result.changes.length > 0 && (
                                    <details className="mt-4">
                                        <summary className="cursor-pointer font-medium">
                                            View Changes ({result.changes.length} products)
                                        </summary>
                                        <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                                            {result.changes.map(change => (
                                                <div
                                                    key={change.productId}
                                                    className="bg-muted p-2 rounded text-sm"
                                                >
                                                    <p className="font-medium">{change.productName}</p>
                                                    <ul className="list-disc list-inside ml-2">
                                                        {change.changes.map((c, i) => (
                                                            <li key={i}>{c}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        ) : (
                            <p>{result.error}</p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Rollback Results */}
            {rollbackResult && (
                <Alert variant={rollbackResult.success ? 'default' : 'destructive'}>
                    {rollbackResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>{rollbackResult.success ? 'Rollback Successful!' : 'Rollback Failed'}</AlertTitle>
                    <AlertDescription>
                        {rollbackResult.success ? (
                            <p>
                                Rolled back <strong>{rollbackResult.productsRolledBack}</strong> products and
                                recalculated <strong>{rollbackResult.masterItemsRecalculated}</strong> master items.
                            </p>
                        ) : (
                            <p>{rollbackResult.error}</p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Warning Alert */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important Notes</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>This migration is safe to run multiple times (idempotent)</li>
                        <li>The rollback function is available if you need to revert changes</li>
                        <li>All changes are logged and can be reviewed in the details section</li>
                        <li>Master item tags will automatically update based on product tags after migration</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}
