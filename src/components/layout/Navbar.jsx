import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logoImg from '../../assets/images/logo.png';
import './Navbar.css';

const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/menu', label: 'Menú' },
    { to: '/locations', label: 'Sucursales' },
    { to: '/about', label: 'Nosotros' },
    { to: '/gallery', label: 'Galería' },
    { to: '/contact', label: 'Contacto' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const menuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    return (
        <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${open ? 'navbar--open' : ''}`}>
            <div className="navbar__container container">
                {/* Logo */}
                <Link to="/" className="navbar__logo" aria-label="El Buen Sazón – Inicio">
                    <img src={logoImg} alt="El Buen Sazón logo" className="navbar__logo-img" />
                    <div className="navbar__logo-text">
                        <span className="navbar__logo-name">El Buen Sazón</span>
                        <span className="navbar__logo-sub">Comida Mexicana y Antojitos</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="navbar__nav" aria-label="Navegación principal">
                    <ul className="navbar__links">
                        {navLinks.map(link => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                                    end={link.to === '/'}
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* CTA */}
                <div className="navbar__cta">
                    <Link to="/menu" className="btn btn-primary btn-sm">
                        Ver Menú
                    </Link>
                </div>

                {/* Hamburger */}
                <button
                    className={`navbar__hamburger ${open ? 'navbar__hamburger--open' : ''}`}
                    onClick={() => setOpen(!open)}
                    aria-label="Toggle menu"
                    aria-expanded={open}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile Overlay */}
            <div className={`navbar__overlay ${open ? 'navbar__overlay--open' : ''}`} onClick={() => setOpen(false)} />

            {/* Mobile Drawer */}
            <div ref={menuRef} className={`navbar__drawer ${open ? 'navbar__drawer--open' : ''}`} aria-hidden={!open}>
                <div className="navbar__drawer-header">
                    <img src={logoImg} alt="El Buen Sazón" className="navbar__drawer-logo" />
                </div>
                <nav aria-label="Navegación móvil">
                    <ul className="navbar__drawer-links">
                        {navLinks.map(link => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) => `navbar__drawer-link ${isActive ? 'navbar__drawer-link--active' : ''}`}
                                    end={link.to === '/'}
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="navbar__drawer-cta">
                    <Link to="/menu" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                        Ver Menú Completo
                    </Link>
                    <Link to="/locations" className="btn btn-secondary w-full" style={{ justifyContent: 'center', marginTop: '0.75rem' }}>
                        Encontrar Sucursal
                    </Link>
                </div>
            </div>
        </header>
    );
}
