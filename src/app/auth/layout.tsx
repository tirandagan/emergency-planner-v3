import React from 'react';

// Force dynamic rendering for all auth routes (some use cookies, some use searchParams)
export const dynamic = 'force-dynamic';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
