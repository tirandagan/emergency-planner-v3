'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
}

interface StickyNavProps {
  sections: Section[];
}

export function StickyNav({ sections }: StickyNavProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Track when nav should become fixed
    const handleScroll = () => {
      if (navRef.current && placeholderRef.current) {
        const placeholderRect = placeholderRef.current.getBoundingClientRect();
        // When placeholder scrolls above the navbar (64px), make nav fixed
        setIsSticky(placeholderRect.top <= 64);
      }
    };

    // Intersection Observer for active section highlighting
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-120px 0px -50% 0px',
        threshold: 0,
      }
    );

    // Observe all sections
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        sectionObserver.observe(element);
      }
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          sectionObserver.unobserve(element);
        }
      });
    };
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 120; // Account for navbar + sticky nav height
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      {/* Placeholder to maintain layout when nav becomes fixed */}
      <div ref={placeholderRef} className={isSticky ? 'h-[52px]' : 'h-0'} />

      <nav
        ref={navRef}
        className={cn(
          'z-40 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm transition-all duration-200',
          isSticky
            ? 'fixed top-16 left-0 right-0'
            : 'relative'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 sm:gap-6 overflow-x-auto py-3 scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'text-sm font-medium whitespace-nowrap transition-colors px-3 py-1.5 rounded-md',
                  activeSection === section.id
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
