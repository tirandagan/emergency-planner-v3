import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Plan | BePrepared.ai',
  description: 'View a shared emergency preparedness plan',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
