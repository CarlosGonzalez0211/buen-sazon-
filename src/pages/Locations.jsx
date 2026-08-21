import { Link } from 'react-router-dom';
import { locations } from '../data/locations';
import './Locations.css';

const featureIcons = { 'Drive-through': '🚗', 'Comedor amplio': '🪑', 'Wi-Fi gratis': '📶', 'Estacionamiento': '🅿️', 'Área infantil': '👶', 'Pedidos en línea': '📱', 'Próximamente': '🚧', 'Mayor espacio': '🏢', 'Terraza exterior': '🌿' };

export default function Locations() {
    return (
        <main className="page-wrapper">
            <div className="page-hero">
                <div className="container">
                    <p className="section-label">Encuéntranos</p>
                    <h1 className="section-title">Nuestras <span>Sucursales</span></h1>
                    <div className="divider" />
                    <p className="section-subtitle">
                        Tres sucursales para servirte mejor. Auténtico sabor Juarense cerca de ti.
                    </p>
                </div>
            </div>

            <div className="page-content section">
                <div className="container">
                    <div className="locations__grid">
                        {locations.map((loc, i) => (
                            <div key={loc.id} className={`loc-card ${loc.status === 'coming-soon' ? 'loc-card--soon' : ''}`}>
                                {/* Header */}
                                <div className="loc-card__header">
                                    <div className="loc-card__num">{String(i + 1).padStart(2, '0')}</div>
                                    <div className="loc-card__info">
                                        <h2 className="loc-card__name">{loc.name}</h2>
                                        <p className="loc-card__addr">📍 {loc.address}</p>
                                    </div>
                                    <span className={`badge ${loc.status === 'open' ? 'badge-open' : 'badge-soon'}`}>
                                        {loc.status === 'open' ? '● Abierto' : '◐ Próximamente'}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="loc-card__body">
                                    {loc.status === 'open' ? (
                                        <>
                                            {/* Hours */}
                                            <div className="loc-card__section">
                                                <h4 className="loc-card__section-title">🕐 Horario</h4>
                                                <p>{loc.hours.weekday}</p>
                                                <p>{loc.hours.weekend}</p>
                                            </div>

                                            {/* Contact */}
                                            <div className="loc-card__section">
                                                <h4 className="loc-card__section-title">📞 Contacto</h4>
                                                <p><a href={`tel:${loc.phone}`} className="loc-card__link">{loc.phone}</a></p>
                                                <p><a href={`mailto:${loc.email}`} className="loc-card__link">{loc.email}</a></p>
                                            </div>

                                            {/* Features */}
                                            <div className="loc-card__section">
                                                <h4 className="loc-card__section-title">✨ Servicios</h4>
                                                <div className="loc-card__features">
                                                    {loc.features.map(f => (
                                                        <span key={f} className="loc-card__feature">
                                                            {featureIcons[f] || '✓'} {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Map */}
                                            <div className="loc-card__map">
                                                <iframe
                                                    src={loc.mapUrl}
                                                    width="100%"
                                                    height="200"
                                                    style={{ border: 0, borderRadius: '12px' }}
                                                    allowFullScreen=""
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    title={`Mapa ${loc.name}`}
                                                />
                                            </div>

                                            <div className="loc-card__actions">
                                                <Link to={`/menu?location=${loc.id}`} className="btn btn-primary">🌮 Ver Menú</Link>
                                                <a href={`tel:${loc.phone}`} className="btn btn-secondary">📞 Llamar</a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="loc-card__soon-body">
                                            <div className="loc-card__soon-icon">🚧</div>
                                            <h3>¡Nueva Sucursal en Camino!</h3>
                                            <p>
                                                Estamos trabajando para traerte el auténtico sabor de El Buen Sazón
                                                al norte de la ciudad. ¡Sigue nuestras redes sociales para más información!
                                            </p>
                                            <div className="loc-card__features" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                                                {loc.features.map(f => (
                                                    <span key={f} className="loc-card__feature">
                                                        {featureIcons[f] || '✓'} {f}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="loc-card__soon-badge">{loc.openingSoon}</div>
                                            <Link to="/contact" className="btn btn-gold" style={{ marginTop: '1.5rem' }}>
                                                📢 Notifícame
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
