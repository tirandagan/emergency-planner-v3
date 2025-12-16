'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UserListCard from './UserListCard';
import UserListTable from './UserListTable';
import UserDetailModal from './UserDetailModal';
import ViewToggle from './ViewToggle';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  fullName: string | null;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  isHighValue: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
  plansCreated: number;
}

interface UserListViewProps {
  users: User[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export default function UserListView({
  users,
  totalCount,
  page,
  pageSize,
}: UserListViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePageSizeChange = (newSize: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('pageSize', newSize);
    params.set('page', '1'); // Reset to first page
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          Showing {users.length} of {totalCount} users
        </div>
        <ViewToggle onViewChange={setViewMode} />
      </div>

      {/* User list - Card grid or Table */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {users.map((user) => (
            <UserListCard key={user.id} user={user} onClick={handleUserClick} />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg mb-6">
          <UserListTable users={users} onUserClick={handleUserClick} />
        </div>
      )}

      {/* Empty state */}
      {users.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
          <p className="text-lg font-medium mb-2">No users found</p>
          <p className="text-sm">Try adjusting your filters or search criteria</p>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User detail modal */}
      <UserDetailModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
