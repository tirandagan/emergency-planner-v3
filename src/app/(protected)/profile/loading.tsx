export default function ProfileLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-72 mb-8" />

      {/* Tab Navigation Skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex space-x-8">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Content Card Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Section Title */}
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />

        {/* Form Fields Skeleton */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded w-full" />
          </div>
        ))}

        {/* Buttons Skeleton */}
        <div className="flex gap-3 pt-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
      </div>
    </div>
  );
}


