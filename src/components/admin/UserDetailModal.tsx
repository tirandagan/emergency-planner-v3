'use client';

import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Calendar, Clock, TrendingUp, DollarSign, X, GripHorizontal } from 'lucide-react';
import { toggleHighValueUser } from '@/app/actions/admin';
import { toast } from 'sonner';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserDetailData {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  timezone: string | null;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  isHighValue: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
  plansCreated: number;
  favoriteScenarios: string[];
  recentActivities: Array<{
    id: string;
    activityType: string;
    createdAt: Date;
    metadata: Record<string, unknown> | null;
  }>;
  billingTransactions: Array<{
    id: string;
    transactionDate: Date;
    description: string | null;
    amount: string;
    status: string;
    invoicePdfUrl: string | null;
  }>;
  lifetimeValue: number;
}

export default function UserDetailModal({ userId, isOpen, onClose }: UserDetailModalProps) {
  const [userData, setUserData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHighValue, setIsHighValue] = useState(false);
  const [isTogglingHighValue, setIsTogglingHighValue] = useState(false);
  const [initialPosition, setInitialPosition] = useState({ x: 200, y: 50 });

  // Calculate center position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInitialPosition({
        x: (window.innerWidth - 1000) / 2,
        y: (window.innerHeight - 700) / 2,
      });
    }
  }, []);

  // Fetch user detail when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetail(userId);
    } else {
      setUserData(null);
    }
  }, [isOpen, userId]);

  async function fetchUserDetail(id: string) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user details');
      const data = await response.json();
      setUserData(data);
      setIsHighValue(data.isHighValue);
    } catch (error) {
      toast.error('Failed to load user details');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleHighValue() {
    if (!userId) return;

    setIsTogglingHighValue(true);
    try {
      const newValue = !isHighValue;
      await toggleHighValueUser(userId, newValue);
      setIsHighValue(newValue);
      toast.success(
        newValue ? 'User flagged as high-value' : 'High-value flag removed'
      );
    } catch (error) {
      toast.error('Failed to update high-value status');
      console.error(error);
    } finally {
      setIsTogglingHighValue(false);
    }
  }

  // Tier badge color
  const getTierColor = (tier: string) => {
    return (
      {
        FREE: 'bg-gray-500',
        BASIC: 'bg-blue-500',
        PRO: 'bg-purple-500',
      }[tier] || 'bg-gray-500'
    );
  };

  // Activity type icons and labels
  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      created_plan: '🎯',
      updated_plan: '📝',
      deleted_plan: '🗑️',
      upgraded_tier: '💳',
      downgraded_tier: '📉',
      canceled_subscription: '❌',
      signed_up: '👤',
      updated_profile: '✏️',
      changed_password: '🔒',
      newsletter_subscribed: '📧',
      marketing_unsubscribed: '🚫',
      viewed_bundle: '👁️',
      clicked_product: '🔗',
    };
    return icons[type] || '📌';
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      created_plan: 'Created plan',
      updated_plan: 'Updated plan',
      deleted_plan: 'Deleted plan',
      upgraded_tier: 'Upgraded subscription',
      downgraded_tier: 'Downgraded subscription',
      canceled_subscription: 'Canceled subscription',
      signed_up: 'Signed up',
      updated_profile: 'Updated profile',
      changed_password: 'Changed password',
      newsletter_subscribed: 'Subscribed to newsletter',
      marketing_unsubscribed: 'Unsubscribed from marketing',
      viewed_bundle: 'Viewed bundle',
      clicked_product: 'Clicked product',
    };
    return labels[type] || type;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Draggable & Resizable Modal */}
      <Rnd
        key={`${initialPosition.x}-${initialPosition.y}`}
        default={{
          x: initialPosition.x,
          y: initialPosition.y,
          width: 1000,
          height: 700,
        }}
        minWidth={600}
        minHeight={400}
        maxWidth={typeof window !== 'undefined' ? window.innerWidth - 100 : 1400}
        maxHeight={typeof window !== 'undefined' ? window.innerHeight - 100 : 900}
        dragHandleClassName="drag-handle"
        bounds="window"
        className="z-50"
        style={{ position: 'fixed' }}
      >
        <div className="h-full flex flex-col bg-card border-2 border-border rounded-lg shadow-2xl">
          {/* Header - Draggable */}
          <div className="drag-handle flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50 rounded-t-lg cursor-move">
            <div className="flex items-center gap-3">
              <GripHorizontal className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-bold">
                {isLoading ? 'Loading...' : (userData?.fullName || userData?.email || 'Unknown User')}
              </h2>
              {userData && (
                <Badge className={`${getTierColor(userData.subscriptionTier)} text-white`}>
                  {userData.subscriptionTier}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isHighValue ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleHighValue}
                disabled={isTogglingHighValue}
              >
                <Star className={`w-4 h-4 mr-2 ${isHighValue ? 'fill-current' : ''}`} />
                {isHighValue ? 'High-Value User' : 'Flag as High-Value'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <div className="animate-pulse">Loading user details...</div>
              </div>
            ) : userData ? (
              <Tabs defaultValue="profile" className="h-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="billing">Billing History</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                      <p className="font-medium">{userData.fullName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-medium">{userData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{userData.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="font-medium">{userData.location || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Timezone</p>
                      <p className="font-medium">{userData.timezone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Stripe Customer ID</p>
                      <p className="font-medium text-xs">{userData.stripeCustomerId || '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                          {format(new Date(userData.createdAt), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {differenceInDays(new Date(), new Date(userData.createdAt))} days ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Last Active</p>
                        <p className="font-medium">
                          {userData.lastActiveAt
                            ? formatDistanceToNow(new Date(userData.lastActiveAt), {
                                addSuffix: true,
                              })
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <p className="font-semibold">User Metrics</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{userData.plansCreated}</p>
                        <p className="text-sm text-muted-foreground">Plans Created</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">
                          ${userData.lifetimeValue.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">Lifetime Value</p>
                      </div>
                    </div>
                  </div>

                  {userData.favoriteScenarios.length > 0 && (
                    <div className="pt-6 border-t">
                      <p className="font-semibold mb-3">Favorite Scenarios</p>
                      <div className="flex flex-wrap gap-2">
                        {userData.favoriteScenarios.map((scenario, i) => (
                          <Badge key={i} variant="secondary">
                            {scenario}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Tier</p>
                      <Badge className={`${getTierColor(userData.subscriptionTier)} text-white`}>
                        {userData.subscriptionTier}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <p className="font-medium">{userData.subscriptionStatus || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Period End</p>
                      <p className="font-medium">
                        {userData.subscriptionPeriodEnd
                          ? format(new Date(userData.subscriptionPeriodEnd), 'MMMM d, yyyy')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">High-Value Status</p>
                      <div className="flex items-center gap-2">
                        {userData.isHighValue ? (
                          <>
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium text-yellow-600">High-Value User</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Standard User</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {userData.subscriptionPeriodEnd && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold">Days Until Renewal</p>
                          <p className="text-2xl font-bold text-primary">
                            {Math.max(
                              0,
                              differenceInDays(
                                new Date(userData.subscriptionPeriodEnd),
                                new Date()
                              )
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold">Recent Activities</p>
                    <p className="text-sm text-muted-foreground">
                      Last {userData.recentActivities.length} activities
                    </p>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {userData.recentActivities.length > 0 ? (
                      userData.recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-2xl">{getActivityIcon(activity.activityType)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{getActivityLabel(activity.activityType)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No recent activities
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Billing History Tab */}
                <TabsContent value="billing" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold">Billing Transactions</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lifetime Value</p>
                        <p className="font-bold text-green-600">
                          ${userData.lifetimeValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {userData.billingTransactions.length > 0 ? (
                      userData.billingTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {transaction.description || 'Subscription Payment'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transaction.transactionDate), 'MMMM d, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              ${Number(transaction.amount).toFixed(2)}
                            </p>
                            <Badge
                              variant={transaction.status === 'succeeded' ? 'default' : 'secondary'}
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No billing transactions
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No user data available
              </div>
            )}
          </div>
        </div>
      </Rnd>
    </>
  );
}
