'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROLE_NAVIGATION, UserRole } from '@/constants/navigation';
import { NavIcon } from './NavIcons';
import { useAuth } from '@/lib/auth';

interface NavbarProps {
  role?: UserRole;
  onMobileMenuToggle?: () => void;
  className?: string;
}

/**
 * Navbar - Top Navigation Shell
 * Displays contextual breadcrumbs, academic session indicator,
 * notification quick link, and user status.
 */
export function Navbar({ role = 'admin', onMobileMenuToggle, className = '' }: NavbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const config = ROLE_NAVIGATION[role];

  // Resolve active breadcrumb info
  let activeGroupLabel = '';
  let activeItemTitle = '';

  if (config) {
    for (const group of config.groups) {
      for (const item of group.items) {
        if (
          pathname === item.href ||
          (item.href !== `/${role}/dashboard` && pathname.startsWith(`${item.href}/`))
        ) {
          activeGroupLabel = group.label;
          activeItemTitle = item.title;
          break;
        }
      }
      if (activeItemTitle) break;
    }
  }

  // Fallback for title if not directly in ROLE_NAVIGATION
  if (!activeItemTitle) {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) {
      activeItemTitle = last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
    } else {
      activeItemTitle = 'Dashboard';
    }
  }

  const notificationHref =
    role === 'student'
      ? '/student/notifications'
      : role === 'superadmin'
      ? '/superadmin/audit-logs'
      : `/${role}/announcements`;

  const primaryColor = user?.schoolTheme?.primaryColor || '#B81D22';
  const secondaryColor = user?.schoolTheme?.secondaryColor || '#9E1519';

  return (
    <header
      style={{
        backgroundColor: primaryColor,
        borderBottomColor: secondaryColor,
      }}
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b text-white px-4 sm:px-6 lg:px-8 shadow-sm transition-colors duration-200 ${className}`}
    >
      {/* Left: Mobile Drawer Trigger + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="inline-flex items-center justify-center rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white lg:hidden"
          aria-label="Open sidebar navigation"
        >
          <NavIcon name="menu" className="h-6 w-6" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm">
          {activeGroupLabel && (
            <>
              <span className="hidden sm:inline text-white/60 font-medium">{activeGroupLabel}</span>
              <span className="hidden sm:inline text-white/40">/</span>
            </>
          )}
          <span className="font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-none">
            {activeItemTitle}
          </span>
        </nav>
      </div>

      {/* Right: Academic Context Badge + Notification Shortcut + User Context */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Academic Session / Context Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold text-white shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">
            {role === 'superadmin' ? 'Multi-Tenant Network' : '2025/2026 • First Term'}
          </span>
        </div>

        {/* Quick Notification Shortcut */}
        <Link
          href={notificationHref}
          className="relative p-2 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition-colors"
          title="Notifications & Announcements"
        >
          <NavIcon name="bell" className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2"
            style={{ ['--tw-ring-color' as any]: primaryColor }}
          />
        </Link>

        {/* User Mini Identifier */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/20">
            <span className="text-xs font-semibold text-white max-w-[120px] truncate">
              {user.name}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white uppercase tracking-wider">
              {role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
