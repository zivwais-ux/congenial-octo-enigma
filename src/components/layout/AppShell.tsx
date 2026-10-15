import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export function AppShell() {
  // במסך פריט במובייל, הסרגל התחתון מפנה מקום לכפתורי ההחלטה
  const onItem = useLocation().pathname.startsWith('/item/');
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className={onItem ? 'pb-6' : 'pb-24 md:pb-10'}>
        <Outlet />
      </main>
      {!onItem && <MobileNav />}
    </div>
  );
}
