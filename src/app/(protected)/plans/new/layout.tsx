/**
 * Layout for the wizard page
 * Removes parent padding to allow full-width wizard styling
 */
export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-4 md:-m-8 min-h-[calc(100vh-4rem)]">
      {children}
    </div>
  );
}
