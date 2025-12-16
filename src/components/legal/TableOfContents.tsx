'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TOCItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8 border rounded-lg bg-muted/50">
      {/* Mobile: Collapsible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:hidden text-left"
      >
        <span className="font-semibold text-foreground">Table of Contents</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Desktop: Always visible */}
      <div className="hidden md:block p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-foreground">Table of Contents</h3>
      </div>

      {/* TOC Items */}
      <nav
        className={`${
          isOpen ? 'block' : 'hidden'
        } md:block p-4 md:p-6`}
      >
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}


