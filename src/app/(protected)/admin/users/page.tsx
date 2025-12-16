import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { missionReports } from '@/db/schema/mission-reports';
import { eq, desc, and, or, ilike, gte, lte, count, inArray } from 'drizzle-orm';
import UserListView from '@/components/admin/UserListView';
import UserFilters from '@/components/admin/UserFilters';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface SearchParams {
  page?: string;
  pageSize?: string;
  tier?: string;
  search?: string;
  highValueOnly?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Parse search params
  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.pageSize || '25');
  const tierFilter = params.tier?.split(',').filter(Boolean);
  const searchQuery = params.search || '';
  const highValueOnly = params.highValueOnly === 'true';
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

  // Build where clause dynamically
  const whereConditions = [];

  if (tierFilter && tierFilter.length > 0) {
    whereConditions.push(
      or(...tierFilter.map((t) => eq(profiles.subscriptionTier, t)))
    );
  }

  if (searchQuery) {
    whereConditions.push(
      or(
        ilike(profiles.fullName, `%${searchQuery}%`),
        ilike(profiles.email, `%${searchQuery}%`)
      )
    );
  }

  if (highValueOnly) {
    whereConditions.push(eq(profiles.isHighValue, true));
  }

  if (dateFrom) {
    whereConditions.push(gte(profiles.createdAt, dateFrom));
  }

  if (dateTo) {
    whereConditions.push(lte(profiles.createdAt, dateTo));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Fetch users with pagination
  const usersQueryBuilder = db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      subscriptionTier: profiles.subscriptionTier,
      subscriptionStatus: profiles.subscriptionStatus,
      isHighValue: profiles.isHighValue,
      lastActiveAt: profiles.lastActiveAt,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .$dynamic();

  const users = await (whereClause
    ? usersQueryBuilder.where(whereClause)
    : usersQueryBuilder)
    .orderBy(desc(profiles.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Get total count for pagination
  const countQueryBuilder = db
    .select({ totalCount: count() })
    .from(profiles)
    .$dynamic();

  const [{ totalCount }] = await (whereClause
    ? countQueryBuilder.where(whereClause)
    : countQueryBuilder);

  // Get plans created for each user
  const userIds = users.map((u) => u.id);
  const plansCreated =
    userIds.length > 0
      ? await db
          .select({
            userId: missionReports.userId,
            count: count(),
          })
          .from(missionReports)
          .where(inArray(missionReports.userId, userIds))
          .groupBy(missionReports.userId)
      : [];

  // Merge plans count with user data
  const usersWithPlans = users.map((user) => ({
    ...user,
    plansCreated: plansCreated.find((p) => p.userId === user.id)?.count || 0,
  }));

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, view analytics, and identify high-value customers
          </p>
        </div>
        <Button variant="outline" disabled>
          <Download className="w-4 h-4 mr-2" />
          Export Users
        </Button>
      </div>

      {/* Filters */}
      <UserFilters />

      {/* User list with view toggle and pagination */}
      <UserListView
        users={usersWithPlans}
        totalCount={Number(totalCount)}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
