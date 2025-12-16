export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="h-10 bg-muted animate-pulse rounded w-64 mb-3" />
          <div className="h-4 bg-muted animate-pulse rounded w-40" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* TOC Skeleton */}
          <div className="mb-8 border rounded-lg bg-muted/50 p-6">
            <div className="h-6 bg-muted animate-pulse rounded w-48 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 bg-muted animate-pulse rounded w-full" />
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-8 bg-muted animate-pulse rounded w-3/4 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-full" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

