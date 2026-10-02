import { createElement, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logo from '../assets/brand/logo-sm.png';

export function ScrollTop() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
        else window.scrollTo(0, 0);
    }, [pathname, hash]);
    return null;
}
import { brand, features, hoursText, locations, telHref, waHref } from './data';

export const Arrow = () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
);

export function Reveal({ as = 'div', delay = 0, className = '', children, ...rest }) {
    const ref = useRef(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setSeen(true); io.disconnect(); }
        }, { threshold: 0.12 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    // the ref is only handed to the DOM element, never read during render
    // eslint-disable-next-line react-hooks/refs
    return createElement(as, {
        ref,
        className: `rv ${seen ? 'in' : ''} ${className}`,
        style: { '--d': `${delay}ms` },
        ...rest,
    }, children);
}

// Link or <a>, with the trailing circle arrow.
export function Btn({ to, href, tone = 'chile', small, children, ...rest }) {
    const cls = `btn btn--${tone} ${small ? 'btn--sm' : ''}`;
    const inner = (<>{children}<span className="btn__dot"><Arrow /></span></>);
    if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
    return <a href={href} className={cls} target="_blank" rel="noreferrer" {...rest}>{inner}</a>;
}

const allLinks = [
    ['/menu', 'Menú'],
    ['/sucursales', 'Sucursales'],
    ['/salon-boho', 'Salón Boho'],
    ['/galeria', 'Galería'],
    ['/nosotros', 'Nosotros'],
    ['/contacto', 'Contacto'],
];

const links = allLinks.filter(([to]) => features.boho || to !== '/salon-boho');

export function Navbar() {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);

    return (
        <header className="nav">
            <div className="nav__bar">
                <Link to="/" className="nav__brand" aria-label="El Buen Sazón, inicio"><img src={logo} alt="El Buen Sazón, comida mexicana y antojitos" width="520" height="251" /></Link>
                <nav className="nav__links" aria-label="Principal">
                    {links.map(([to, label]) => (
                        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
                    ))}
                </nav>
                <div className="nav__cta">
                    <Btn to="/menu" small>Ver menú</Btn>
                    <button className="nav__burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menú">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 7h14M3 13h14" />}
                        </svg>
                    </button>
                </div>
            </div>
            <div className={`nav__sheet ${open ? 'is-open' : ''}`} aria-hidden={!open}>
                <Link to="/" onClick={close}>Inicio</Link>
                {links.map(([to, label]) => <Link key={to} to={to} onClick={close}>{label}</Link>)}
                <small>{hoursText[0].days} {hoursText[0].time}</small>
            </div>
        </header>
    );
}

export function Footer() {
    return (
        <footer className="foot">
            <div className="wrap">
                <div className="foot__top">
                    <div>
                        <h4>El Buen Sazón</h4>
                        <p style={{ maxWidth: '20rem', opacity: .85 }}>{brand.tagline}. Servicio a domicilio disponible.</p>
                    </div>
                    <div>
                        <h4>Sucursales</h4>
                        <ul>{locations.map((l) => <li key={l.slug}><Link to={`/sucursales/${l.slug}`}>{l.name}</Link></li>)}</ul>
                    </div>
                    <div>
                        <h4>Horario</h4>
                        <ul>{hoursText.map((h) => <li key={h.days}>{h.days}<br /><span style={{ opacity: .7 }}>{h.time}</span></li>)}</ul>
                    </div>
                    <div>
                        <h4>Síguenos</h4>
                        <ul>
                            <li><a href={brand.facebook} target="_blank" rel="noreferrer">Facebook</a></li>
                            <li><a href={brand.instagram} target="_blank" rel="noreferrer">Instagram</a></li>
                            <li><a href={brand.tiktok} target="_blank" rel="noreferrer">TikTok</a></li>
                            <li><a href={brand.linktree} target="_blank" rel="noreferrer">Linktree</a></li>
                        </ul>
                    </div>
                </div>
                <p className="foot__big" aria-hidden="true">El Buen <em>Sazón</em></p>
                <div className="foot__legal">
                    <span>© {new Date().getFullYear()} El Buen Sazón · Ciudad Juárez, Chihuahua</span>
                    <a href={brand.facebook} target="_blank" rel="noreferrer">facebook.com/elbuensazonjuarez</a>
                </div>
            </div>
        </footer>
    );
}

// Order buttons for one branch: WhatsApp + call only if it has a phone, Uber Eats only if it has a link.
export function OrderButtons({ location, tone = 'chile' }) {
    const wa = waHref(location, `Hola, quiero hacer un pedido en la sucursal ${location.name}.`);
    const tel = telHref(location);
    const none = !wa && !location.uberEats;
    return (
        <>
            {wa && <Btn href={wa} tone={tone}>Pedir por WhatsApp</Btn>}
            {tel && <Btn href={tel} tone="ghost">Llamar</Btn>}
            {location.uberEats && <Btn href={location.uberEats} tone="ghost">Uber Eats</Btn>}
            {none && <span className="btn btn--sm btn--off btn--off-dark" aria-disabled="true">Pedidos · próximamente</span>}
        </>
    );
}
