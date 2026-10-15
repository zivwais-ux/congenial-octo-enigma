import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pb-24 md:pb-10">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
