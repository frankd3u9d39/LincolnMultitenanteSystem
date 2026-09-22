'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Navbar } from '@/components/navigation/Navbar';
import { UserRole } from '@/constants/navigation';

interface DashboardLayoutProps {
  role: UserRole;
  children?: React.ReactNode;
}

/**
 * DashboardLayout
 * Red, White, and Black dashboard shell layout.
 * Embeds the Sidebar and clean Navbar.
 */
export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-row">
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
        {/* Top Navbar - Clean & Empty */}
        <Navbar onMobileMenuToggle={() => setIsMobileOpen(true)} />

        {/* Page Content Viewport - White Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-white text-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}
