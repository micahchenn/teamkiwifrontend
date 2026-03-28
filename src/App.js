import SiteHeader from './components/SiteHeader';
import CrappieHouseBookingPage from './components/crappie/CrappieHouseBookingPage';
import './App.css';

export default function App() {
  return (
    <>
      <SiteHeader />
      <main className="app-main" id="main-content">
        <CrappieHouseBookingPage />
      </main>
    </>
  );
}
