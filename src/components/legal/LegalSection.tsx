import React from 'react';

interface LegalSectionProps {
  id: string;
  title: string;
  summary?: string;
  children: React.ReactNode;
}

export function LegalSection({ id, title, summary, children }: LegalSectionProps) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      {/* Section Title */}
      <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <a href={`#${id}`} className="hover:text-primary transition-colors">
          {title}
        </a>
      </h2>

      {/* Plain English Summary (if provided) */}
      {summary && (
        <div className="mb-6 p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
          <p className="text-sm font-medium text-primary mb-1">
            📌 Key Points (Plain English)
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {summary}
          </p>
        </div>
      )}

      {/* Full Legal Content */}
      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
        {children}
      </div>
    </section>
  );
}


