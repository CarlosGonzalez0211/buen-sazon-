import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './site/Home';
import { About, Boho, Branch, Contact, Gallery, Locations, MenuChooser, MenuPage } from './site/pages';
import { features } from './site/data';
import { Footer, Navbar, ScrollTop } from './site/ui';

export default function App() {
    return (
        <BrowserRouter>
            <ScrollTop />
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<MenuChooser />} />
                <Route path="/menu/:slug" element={<MenuPage />} />
                <Route path="/sucursales" element={<Locations />} />
                <Route path="/galeria" element={<Gallery />} />
                <Route path="/sucursales/:slug" element={<Branch />} />
                <Route path="/salon-boho" element={features.boho ? <Boho /> : <Navigate to="/" replace />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
        </BrowserRouter>
    );
}
