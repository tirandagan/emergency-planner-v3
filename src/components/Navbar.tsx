"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Menu, X, LogOut, User as UserIcon, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { BrandText } from '@/components/ui/brand-text';

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAdmin, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Define public routes where navbar should be visible
  const publicRoutes = ['/', '/about', '/terms', '/privacy', '/cookies'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth');
  
  // Don't render navbar on protected routes (they have sidebar)
  if (!isPublicRoute) {
    return null;
  }

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Call server action to sign out
      await signOut();
      // Force full page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      // Next.js redirect() throws NEXT_REDIRECT which is expected behavior
      // Check if it's a redirect error (digest starts with NEXT_REDIRECT)
      if (error && typeof error === 'object' && 'digest' in error &&
          typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
        // This is expected - force reload anyway
        window.location.href = '/';
        return;
      }
      console.error('Logout failed:', error);
      // Fallback to hard redirect if something goes wrong
      window.location.href = '/';
    }
  };

  return (
    <nav className="bg-background/95 border-b border-border sticky top-0 z-50 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logo.png"
                alt="BePrepared.ai logo"
                width={32}
                height={32}
                className="h-8 w-8 group-hover:opacity-80 transition-opacity"
              />
              <BrandText className="text-foreground text-xl" withDomain />
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {pathname === '/' ? (
                // Landing page navigation - anchor links
                <>
                  <a
                    href="#features"
                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                  <Link
                    href="/about"
                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                  {user && (
                    <Link
                      href={isAdmin ? "/admin" : "/dashboard"}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  )}
                </>
              ) : (
                // Informational pages navigation (about, terms, privacy, cookies)
                <>
                  <Link
                    href="/about"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/about'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    About
                  </Link>
                  {user && (
                    <Link
                      href={isAdmin ? "/admin" : "/dashboard"}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              {!mounted || isLoading ? (
                <div className="w-20 h-10 bg-muted/50 animate-pulse rounded-md" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-sm">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-muted border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {pathname === '/' ? (
              // Landing page mobile navigation
              <>
                <a href="#features" className="text-muted-foreground hover:bg-background hover:text-foreground block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsOpen(false)}>Features</a>
                <a href="#pricing" className="text-muted-foreground hover:bg-background hover:text-foreground block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsOpen(false)}>Pricing</a>
                <Link href="/about" className="text-muted-foreground hover:bg-background hover:text-foreground block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsOpen(false)}>About</Link>
                {mounted && !isLoading && user && (
                  <Link
                    href={isAdmin ? "/admin" : "/dashboard"}
                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                )}
              </>
            ) : (
              // Informational pages mobile navigation
              <>
                <Link
                  href="/about"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/about'
                      ? 'bg-background text-foreground'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
                {mounted && !isLoading && user && (
                  <Link
                    href={isAdmin ? "/admin" : "/dashboard"}
                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Link>
                )}
              </>
            )}

            <div className="border-t border-border mt-4 pt-4 space-y-2">
              {/* Theme Toggle (Mobile) */}
              <button 
                onClick={toggleTheme} 
                className="flex items-center gap-2 text-muted-foreground hover:bg-background hover:text-foreground w-full px-3 py-2 rounded-md text-base font-medium"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4" /> Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" /> Light Mode
                  </>
                )}
              </button>

              {!mounted || isLoading ? (
                <div className="w-full h-10 bg-muted/50 animate-pulse rounded-md" />
              ) : user ? (
                <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:bg-background hover:text-foreground w-full px-3 py-2 rounded-md text-base font-medium">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              ) : (
                <Link href="/auth" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-base font-medium">
                  <UserIcon className="w-4 h-4" /> Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;