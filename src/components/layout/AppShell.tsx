import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { DemoGuide } from './DemoGuide';
import { useUI } from './UIContext';

export function AppShell() {
  const { pathname } = useLocation();
  const { setPaletteOpen } = useUI();
  // במסך עבודה במובייל, הסרגל התחתון מפנה מקום לכפתורי ההחלטה
  const onItem = pathname.startsWith('/item/');

  useEffect(() => window.scrollTo(0, 0), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.closest('input, textarea, select') || e.target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaletteOpen]);

  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar />
      <div className="lg:ps-60">
        <TopBar />
        <main className={onItem ? '' : pathname === '/upload' ? 'pb-[57px] lg:pb-0' : 'pb-28 lg:pb-16'}>
          <Outlet />
        </main>
      </div>
      {!onItem && <MobileNav />}
      <CommandPalette />
      <DemoGuide />
    </div>
  );
}
