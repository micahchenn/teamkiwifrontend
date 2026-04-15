import SiteHeader from './components/SiteHeader';
import CrappieHouseBookingPage from './components/crappie/CrappieHouseBookingPage';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminCodesPage from './components/admin/AdminCodesPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <main className="app-main" id="main-content">
        <Routes>
          <Route path="/" element={<CrappieHouseBookingPage />} />
          <Route path="/admin/codes" element={<AdminCodesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
