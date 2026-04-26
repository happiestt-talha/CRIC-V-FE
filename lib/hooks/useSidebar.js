'use client'

import { useState, useEffect } from 'react'

export const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('cric-v-sidebar-collapsed');
    return saved === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggle = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('cric-v-sidebar-collapsed', String(next));
      return next;
    });
  };

  const closeMobile = () => setIsMobileOpen(false);
  const openMobile = () => setIsMobileOpen(true);

  return { isCollapsed, isMobileOpen, toggle, closeMobile, openMobile };
};
