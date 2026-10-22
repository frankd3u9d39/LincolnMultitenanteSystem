'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Navbar } from '@/components/navigation/Navbar';
import { UserRole } from '@/constants/navigation';
import { useAuth } from '@/lib/auth';

interface DashboardLayoutProps {
  role: UserRole;
  children?: React.ReactNode;
}

/**
 * DashboardLayout
 * Dynamic tenant branding dashboard shell layout.
 * Embeds the Sidebar and clean Navbar.
 */
export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const primaryColor = user?.schoolTheme?.primaryColor || '#B81D22';
  const secondaryColor = user?.schoolTheme?.secondaryColor || '#9E1519';
  const accentColor = user?.schoolTheme?.accentColor || '#B81D22';

  return (
    <div
      className="min-h-screen bg-white text-zinc-900 antialiased flex flex-row"
      style={{
        ['--school-primary' as any]: primaryColor,
        ['--school-secondary' as any]: secondaryColor,
        ['--school-accent' as any]: accentColor,
      }}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        role={role}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Main Content Area with Top Navbar */}
      <div className="flex flex-1 flex-col min-w-0 bg-white">
        {/* Top Navbar */}
        <Navbar role={role} onMobileMenuToggle={() => setIsMobileOpen(true)} />

        {/* Page Content Viewport - White Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-white text-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}
