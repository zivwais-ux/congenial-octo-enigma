import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store/StoreProvider';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ItemPage } from './pages/ItemPage';
import { UploadPage } from './pages/UploadPage';
import { ArchivePage } from './pages/ArchivePage';

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="item/:id" element={<ItemPage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="archive" element={<ArchivePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
}
