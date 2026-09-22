'use client';

import React from 'react';
import { NavIcon } from './NavIcons';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  className?: string;
}

/**
 * Navbar - Clean Top Navigation Shell
 * Pure black background with subtle white border.
 * Content is intentionally kept empty as instructed.
 */
export function Navbar({ onMobileMenuToggle, className = '' }: NavbarProps) {
  return (
    <header
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-black px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {/* Mobile Drawer Trigger */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Open sidebar navigation"
        >
          <NavIcon name="menu" className="h-6 w-6" />
        </button>
      </div>

      {/* Nav Content Shell - Intentionally empty as requested */}
      <div className="flex-1" />
    </header>
  );
}
