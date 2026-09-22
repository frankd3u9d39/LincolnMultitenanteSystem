'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROLE_NAVIGATION, UserRole } from '@/constants/navigation';
import { NavIcon } from './NavIcons';

interface SidebarProps {
  role: UserRole;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const DEFAULT_USERS: Record<UserRole, { name: string; email: string; initials: string }> = {
  admin: { name: 'Dr. Sarah Jenkins', email: 's.jenkins@lincoln.edu', initials: 'SJ' },
  teacher: { name: 'Prof. Marcus Vance', email: 'm.vance@lincoln.edu', initials: 'MV' },
  student: { name: 'Liam Chen', email: 'l.chen24@lincoln.edu', initials: 'LC' },
  superadmin: { name: 'Alexander Cross', email: 'admin@lincolnplatform.io', initials: 'AC' },
};

export function Sidebar({
  role,
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const config = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.admin;
  const user = DEFAULT_USERS[role];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container - Pure Black & White with Red Accents */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-black border-r border-white/10 text-white transition-all duration-300 ease-in-out lg:static
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* Header: School Branding & Tenant Context */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 bg-black">
          <div className="flex items-center gap-3 overflow-hidden">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 py-1">
                <img
                  src="/lincoln-logo.png"
                  alt="Lincoln College of Science Management & Technology"
                  className="h-10 w-auto object-contain max-w-[170px]"
                />
                <div className="h-6 w-px bg-white/20 shrink-0" />
                <span className="font-extrabold text-xs tracking-wider text-white bg-red-600 px-2 py-1 rounded-md shadow-sm shadow-red-600/30 shrink-0">
                  SMTS
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center w-10 h-10">
                <span className="font-black text-[11px] tracking-wider text-white bg-red-600 px-1.5 py-1 rounded-md shadow-sm">
                  SMTS
                </span>
              </div>
            )}
          </div>

          {/* Close button for Mobile */}
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 lg:hidden focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Close menu"
          >
            <NavIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Role Pill Banner */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-white/10 bg-zinc-950">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Workspace</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-red-600/15 text-red-500 border-red-600/30">
                {config.roleBadge}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {config.groups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  {group.label}
                </p>
              )}

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onMobileClose}
                        title={isCollapsed ? item.title : undefined}
                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? 'bg-red-600/15 text-white border border-red-600/40'
                              : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                          }
                          ${isCollapsed ? 'justify-center px-0' : ''}
                        `}
                      >
                        <NavIcon
                          name={item.iconName}
                          className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                            isActive ? 'text-red-500' : 'text-zinc-400 group-hover:text-white'
                          }`}
                        />

                        {!isCollapsed && (
                          <span className="truncate flex-1">{item.title}</span>
                        )}

                        {/* Badges in Red / White / Black */}
                        {!isCollapsed && item.badge && (
                          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-sm shadow-red-600/20">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer: User Profile & Collapse Toggle */}
        <div className="p-3 border-t border-white/10 bg-zinc-950 space-y-2">
          {/* User Profile Mini-Card */}
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-black border border-white/10 ${
              isCollapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 text-white font-bold text-xs shrink-0 shadow-md">
              {user.initials}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-black" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-white truncate">{user.name}</span>
                <span className="text-[11px] text-zinc-400 truncate">{user.email}</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`hidden lg:flex w-full items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors ${
                isCollapsed ? 'px-0' : ''
              }`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <NavIcon
                name={isCollapsed ? 'chevronRight' : 'chevronLeft'}
                className="w-4 h-4 text-zinc-400"
              />
              {!isCollapsed && <span>Collapse Sidebar</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
