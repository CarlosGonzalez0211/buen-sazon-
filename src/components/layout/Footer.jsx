import { Link } from 'react-router-dom';
import logoImg from '../../assets/images/logo.png';
import './Footer.css';

const footerLinks = [
    {
        title: 'Navegación',
        links: [
            { label: 'Inicio', to: '/' },
            { label: 'Menú', to: '/menu' },
            { label: 'Sucursales', to: '/locations' },
            { label: 'Nosotros', to: '/about' },
            { label: 'Galería', to: '/gallery' },
            { label: 'Contacto', to: '/contact' },
        ],
    },
    {
        title: 'Sucursales',
        links: [
            { label: 'Sucursal Centro', to: '/locations' },
            { label: 'Sucursal Sur', to: '/locations' },
            { label: 'Sucursal Norte (Próximamente)', to: '/locations' },
        ],
    },
    {
        title: 'Horarios',
        text: [
            'Lunes – Viernes',
            '8:00 AM – 10:00 PM',
            '',
            'Sábado – Domingo',
            '8:00 AM – 11:00 PM',
        ],
    },
];

const socialLinks = [
    { icon: '📘', label: 'Facebook', href: 'https://facebook.com/ElBuenSazon' },
    { icon: '📸', label: 'Instagram', href: 'https://instagram.com/elbuensazon_mx' },
    { icon: '🎵', label: 'TikTok', href: 'https://tiktok.com/@elbuensazon' },
];

export default function Footer() {
    return (
        <footer className="footer">
            {/* Top Wave */}
            <div className="footer__wave" aria-hidden="true">
                <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0,64 C360,0 1080,0 1440,64 L1440,80 L0,80 Z" fill="currentColor" />
                </svg>
            </div>

            <div className="footer__body">
                <div className="container">
                    <div className="footer__grid">
                        {/* Brand Column */}
                        <div className="footer__brand">
                            <Link to="/" className="footer__logo-link">
                                <img src={logoImg} alt="El Buen Sazón" className="footer__logo" />
                                <div>
                                    <p className="footer__brand-name">El Buen Sazón</p>
                                    <p className="footer__brand-sub">Comida Mexicana y Antojitos</p>
                                </div>
                            </Link>
                            <p className="footer__brand-desc">
                                Auténtico sabor Juarense desde el corazón de nuestra familia hasta tu mesa.
                                Tradición, sazón y amor en cada platillo.
                            </p>
                            <div className="footer__social">
                                {socialLinks.map(s => (
                                    <a
                                        key={s.label}
                                        href={s.href}
                                        className="footer__social-btn"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.label}
                                        title={s.label}
                                    >
                                        <span>{s.icon}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Link Columns */}
                        {footerLinks.map(col => (
                            <div className="footer__col" key={col.title}>
                                <h4 className="footer__col-title">{col.title}</h4>
                                {col.links && (
                                    <ul className="footer__col-links">
                                        {col.links.map(link => (
                                            <li key={link.label}>
                                                <Link to={link.to} className="footer__col-link">{link.label}</Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {col.text && (
                                    <div className="footer__col-text">
                                        {col.text.map((line, i) => (
                                            <p key={i}>{line || <br />}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Contact Column */}
                        <div className="footer__col">
                            <h4 className="footer__col-title">Contacto</h4>
                            <div className="footer__contact-item">
                                <span>📞</span>
                                <span>+52 656 123 4567</span>
                            </div>
                            <div className="footer__contact-item">
                                <span>✉️</span>
                                <span>hola@elbuensazon.mx</span>
                            </div>
                            <div className="footer__contact-item">
                                <span>📍</span>
                                <span>Ciudad Juárez, Chihuahua</span>
                            </div>
                            <div className="footer__badge-strip">
                                <span className="footer__badge">🌮 Auténtico</span>
                                <span className="footer__badge">🇲🇽 Juarense</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer__bottom">
                <div className="container">
                    <p className="footer__copyright">
                        © {new Date().getFullYear()} El Buen Sazón – Comida Mexicana y Antojitos. Todos los derechos reservados.
                    </p>
                    <p className="footer__made">
                        Hecho con <span style={{ color: 'var(--red)' }}>❤</span> en Ciudad Juárez, México
                    </p>
                </div>
            </div>
        </footer>
    );
}
