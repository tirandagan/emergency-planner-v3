'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';

export default function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedTiers, setSelectedTiers] = useState<string[]>(
    searchParams.get('tier')?.split(',').filter(Boolean) || []
  );
  const [highValueOnly, setHighValueOnly] = useState(
    searchParams.get('highValueOnly') === 'true'
  );

  const tiers = ['FREE', 'BASIC', 'PRO'];

  // Update URL with filters
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.set('page', '1');

    router.push(`/admin/users?${params.toString()}`);
  };

  // Handle search input (debounced in practice, but simplified here)
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput || undefined });
  };

  const toggleTier = (tier: string) => {
    const newTiers = selectedTiers.includes(tier)
      ? selectedTiers.filter((t) => t !== tier)
      : [...selectedTiers, tier];

    setSelectedTiers(newTiers);
    updateFilters({ tier: newTiers.length > 0 ? newTiers.join(',') : undefined });
  };

  const toggleHighValue = () => {
    const newValue = !highValueOnly;
    setHighValueOnly(newValue);
    updateFilters({ highValueOnly: newValue ? 'true' : undefined });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedTiers([]);
    setHighValueOnly(false);
    router.push('/admin/users');
  };

  const hasActiveFilters =
    searchInput || selectedTiers.length > 0 || highValueOnly;

  return (
    <div className="bg-card border-2 border-border rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Tier filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Tier:</span>
          {tiers.map((tier) => (
            <Badge
              key={tier}
              variant={selectedTiers.includes(tier) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTier(tier)}
            >
              {tier}
            </Badge>
          ))}
        </div>

        {/* High-value filter */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="highValue"
            checked={highValueOnly}
            onChange={toggleHighValue}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="highValue" className="text-sm font-medium cursor-pointer">
            High-Value Users Only
          </label>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="w-fit">
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
