'use client';

import React, { useState, useTransition } from 'react';
import type {
  EmergencyContactRecommendation,
  ContactCategory,
  ContactPriority,
} from '@/types/emergency-contacts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Phone,
  MapPin,
  Globe,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { regenerateEmergencyContacts } from '@/app/actions/regenerate-emergency-contacts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface EmergencyContactsTabProps {
  contacts: EmergencyContactRecommendation[];
  userTier: string;
  reportId: string;
}

export default function EmergencyContactsTab({
  contacts,
  userTier,
  reportId,
}: EmergencyContactsTabProps): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<ContactCategory | 'all'>('all');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Check if user has access to full contacts
  const hasAccess = userTier === 'BASIC' || userTier === 'PRO';

  // Handle regenerate contacts
  const handleRegenerate = () => {
    startTransition(async () => {
      const result = await regenerateEmergencyContacts(reportId);

      if (result.success) {
        toast.success(`Successfully generated ${result.contactCount} emergency contacts`);
        router.refresh(); // Refresh to show new contacts
      } else {
        toast.error(result.error || 'Failed to regenerate contacts');
      }
    });
  };

  // For FREE users, show only first 5 contacts
  const displayedContacts = hasAccess ? contacts : contacts.slice(0, 5);
  const filteredContacts = selectedCategory === 'all'
    ? displayedContacts
    : displayedContacts.filter(c => c.category === selectedCategory);

  // Get category counts
  const categoryCounts: Record<ContactCategory | 'all', number> = {
    all: contacts.length,
    medical: contacts.filter(c => c.category === 'medical').length,
    government: contacts.filter(c => c.category === 'government').length,
    family: contacts.filter(c => c.category === 'family').length,
    community: contacts.filter(c => c.category === 'community').length,
    utility: contacts.filter(c => c.category === 'utility').length,
    information: contacts.filter(c => c.category === 'information').length,
  };

  if (!hasAccess) {
    return <FreeUserUpgradePrompt totalContactsAvailable={contacts.length} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Emergency Contacts
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-recommended emergency contacts and meeting locations for your scenarios
          </p>
        </div>
        <Button
          onClick={handleRegenerate}
          disabled={isPending}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
          {isPending ? 'Regenerating...' : 'Regenerate Contacts'}
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <CategoryButton
          label="All"
          count={categoryCounts.all}
          active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        />
        <CategoryButton
          label="Medical"
          count={categoryCounts.medical}
          active={selectedCategory === 'medical'}
          onClick={() => setSelectedCategory('medical')}
        />
        <CategoryButton
          label="Government"
          count={categoryCounts.government}
          active={selectedCategory === 'government'}
          onClick={() => setSelectedCategory('government')}
        />
        <CategoryButton
          label="Community"
          count={categoryCounts.community}
          active={selectedCategory === 'community'}
          onClick={() => setSelectedCategory('community')}
        />
        <CategoryButton
          label="Utility"
          count={categoryCounts.utility}
          active={selectedCategory === 'utility'}
          onClick={() => setSelectedCategory('utility')}
        />
        <CategoryButton
          label="Information"
          count={categoryCounts.information}
          active={selectedCategory === 'information'}
          onClick={() => setSelectedCategory('information')}
        />
      </div>

      {/* Contacts Grid with Grouping */}
      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No contacts found in this category.
            </p>
          </CardContent>
        </Card>
      ) : selectedCategory === 'all' ? (
        <GroupedContactsByCategory contacts={filteredContacts} />
      ) : (
        <GroupedContactsByRegion contacts={filteredContacts} />
      )}
    </div>
  );
}

/**
 * Category filter button
 */
function CategoryButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      {label}
      <Badge variant={active ? 'secondary' : 'outline'} className="rounded-full">
        {count}
      </Badge>
    </Button>
  );
}

/**
 * Individual contact card
 */
function ContactCard({ contact }: { contact: EmergencyContactRecommendation }) {
  const priorityConfig: Record<ContactPriority, { icon: typeof AlertCircle; color: string }> = {
    critical: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400' },
    important: { icon: CheckCircle2, color: 'text-yellow-600 dark:text-yellow-400' },
    helpful: { icon: HelpCircle, color: 'text-blue-600 dark:text-blue-400' },
  };

  const PriorityIcon = priorityConfig[contact.priority].icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{contact.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {contact.category}
              </Badge>
              <Badge
                variant="outline"
                className={cn('capitalize', priorityConfig[contact.priority].color)}
              >
                <PriorityIcon className="h-3 w-3 mr-1" />
                {contact.priority}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary">
              Fit: {contact.fitScore}/100
            </Badge>
            {contact.availability24hr && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                24/7
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reasoning */}
        <p className="text-sm text-muted-foreground">
          {contact.reasoning}
        </p>

        {/* Contact Information */}
        <div className="space-y-2">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="font-mono">{contact.phone}</span>
            </a>
          )}

          {contact.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{contact.address}</span>
            </div>
          )}

          {contact.website && (
            <Link
              href={contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Globe className="h-4 w-4" />
              <span>Visit website</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Scenario Tags */}
        {contact.relevantScenarios.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {contact.relevantScenarios.map(scenario => (
              <Badge key={scenario} variant="secondary" className="text-xs">
                {scenario.replace('-', ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Source Indicator */}
        <div className="text-xs text-muted-foreground">
          Source: {contact.source === 'static' ? 'Universal' : contact.source === 'google_places' ? 'Google Places' : 'AI Generated'}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Group contacts by National/Local (for specific category views)
 */
function GroupedContactsByRegion({ contacts }: { contacts: EmergencyContactRecommendation[] }) {
  const nationalContacts = contacts.filter(c => c.region === 'national');
  const localContacts = contacts.filter(c => c.region !== 'national');

  return (
    <div className="space-y-8">
      {nationalContacts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
            National
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {nationalContacts.map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </div>
      )}

      {localContacts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">
            Local
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {localContacts.map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Group contacts by Category, then National/Local (for "All" view)
 */
function GroupedContactsByCategory({ contacts }: { contacts: EmergencyContactRecommendation[] }) {
  const categories: ContactCategory[] = ['medical', 'government', 'community', 'utility', 'information', 'family'];

  return (
    <div className="space-y-8">
      {categories.map(category => {
        const categoryContacts = contacts.filter(c => c.category === category);
        if (categoryContacts.length === 0) return null;

        const nationalContacts = categoryContacts.filter(c => c.region === 'national');
        const localContacts = categoryContacts.filter(c => c.region !== 'national');

        return (
          <div key={category} className="space-y-6">
            <h3 className="text-xl font-bold capitalize flex items-center gap-2">
              {category}
              <Badge variant="outline">{categoryContacts.length}</Badge>
            </h3>

            {nationalContacts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  National
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {nationalContacts.map(contact => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            )}

            {localContacts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Local
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {localContacts.map(contact => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Upgrade prompt for FREE users
 */
function FreeUserUpgradePrompt({ totalContactsAvailable }: { totalContactsAvailable: number }) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <Shield className="h-16 w-16 text-primary" />

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Unlock Full Emergency Contact List</h3>
              <p className="text-muted-foreground text-lg">
                You're viewing a preview. Upgrade to see all <strong>{totalContactsAvailable} emergency contacts</strong>.
              </p>
            </div>

            <div className="w-full max-w-md space-y-3 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Local hospitals, fire stations, and emergency services</p>
                  <p className="text-sm text-muted-foreground">AI-selected for your specific location and scenarios</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Scenario-specific contacts</p>
                  <p className="text-sm text-muted-foreground">Medical, utilities, government resources, and community aid</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">AI-recommended meeting locations</p>
                  <p className="text-sm text-muted-foreground">Safe family reunification points with directions</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Export contacts to your phone</p>
                  <p className="text-sm text-muted-foreground">vCard generation for easy access during emergencies</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Link href="/pricing" className="flex-1">
                <Button size="lg" className="w-full">
                  Upgrade to Basic - $9.99/month
                </Button>
              </Link>
              <Link href="/pricing" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
