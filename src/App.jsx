import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Locations from './pages/Locations';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import logoImg from './assets/images/logo.png';
import './index.css';

function LoadingScreen({ done }) {
  return (
    <div className={`loading-screen ${done ? 'hidden' : ''}`} aria-hidden={done}>
      <img src={logoImg} alt="El Buen Sazón" className="loading-logo" />
      <p className="loading-text">El Buen Sazón</p>
      <div className="loading-spinner" />
    </div>
  );
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppContent() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/about" element={<About />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <LoadingScreen done={loaded} />
      <AppContent />
    </BrowserRouter>
  );
}
