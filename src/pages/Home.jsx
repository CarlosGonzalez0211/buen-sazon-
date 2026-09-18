import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import logoImg from '../assets/images/logo.png';
import DishIllustration from '../components/DishIllustration';
import { locations } from '../data/locations';
import './Home.css';

const featuredDishes = [
    { name: 'Tacos al Pastor', desc: 'Carne marinada con piña y cilantro', price: '$3.50', type: 'taco', tag: '🔥 Más Pedido' },
    { name: 'Burrito de Asada', desc: 'Burrito XXL con guacamole y pico de gallo', price: '$9.50', type: 'burrito', tag: '⭐ Favorito' },
    { name: 'Torta de Carnitas', desc: 'Carnitas en bolillo con aguacate y jalapeño', price: '$7.50', type: 'torta', tag: '🌶️ Picosita' },
    { name: 'Enchiladas Verdes', desc: 'Enchiladas de pollo en salsa tomatillo', price: '$10.00', type: 'enchiladas', tag: '🌿 Casero' },
    { name: 'Quesadilla de Asada', desc: 'Queso Chihuahua fundido con carne asada', price: '$7.00', type: 'quesadilla', tag: '🧀 Especial' },
    { name: 'Aguas Frescas', desc: 'Jamaica, tamarindo, sandía y más', price: '$3.00', type: 'agua-jamaica', tag: '🍉 Frescas' },
];

const galleryTypes = ['taco', 'burrito', 'quesadilla', 'enchiladas', 'elote', 'agua-jamaica'];

const marqueeItems = [
    'Tacos al Pastor', 'Burritos XXL', 'Tortas Juarenses', 'Enchiladas',
    'Quesadillas', 'Aguas Frescas', 'Elote Loco', 'Tamales', 'Birria de Res',
];

function useIntersect(ref, options = {}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, options);
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [ref, options.threshold]);
    return visible;
}

function AnimSection({ children, className = '', delay = 0 }) {
    const ref = useRef();
    const visible = useIntersect(ref, { threshold: 0.1 });
    return (
        <div ref={ref} className={`anim-section ${visible ? 'is-visible' : ''} ${className}`} style={{ '--anim-delay': `${delay}ms` }}>
            {children}
        </div>
    );
}

export default function Home() {
    return (
        <main className="home">
            {/* ── HERO ──────────────────────────────────────── */}
            <section className="hero">
                <div className="hero__bg" aria-hidden="true">
                    <div className="hero__overlay" />
                    <DishIllustration type="taco" className="hero__float hero__float--1" title="" />
                    <DishIllustration type="agua-jamaica" className="hero__float hero__float--2" title="" />
                    <DishIllustration type="elote" className="hero__float hero__float--3" title="" />
                </div>
                <div className="hero__content container">
                    <div className="hero__badge">🌮 Auténtico Sabor Juarense</div>
                    <img src={logoImg} alt="El Buen Sazón" className="hero__logo" />
                    <h1 className="hero__title">
                        El Buen <span className="gradient-text">Sazón</span>
                    </h1>
                    <p className="hero__subtitle">
                        Comida Mexicana y Antojitos
                    </p>
                    <p className="hero__tagline">
                        Tradición, sabor y amor en cada bocado.<br />
                        La auténtica receta de Ciudad Juárez.
                    </p>
                    <div className="hero__ctas">
                        <Link to="/menu" className="btn btn-primary btn-lg">
                            🌮 Ver Menú
                        </Link>
                        <Link to="/locations" className="btn btn-secondary btn-lg">
                            📍 Nuestras Sucursales
                        </Link>
                    </div>
                </div>

                {/* Scroll hint */}
                <div className="hero__scroll" aria-hidden="true">
                    <span className="hero__scroll-dot" />
                </div>
            </section>

            {/* ── MARQUEE ───────────────────────────────────── */}
            <div className="marquee-strip" aria-hidden="true">
                <div className="marquee-inner">
                    {[...marqueeItems, ...marqueeItems].map((item, i) => (
                        <span key={i} className="marquee-item">
                            {item}<span className="dot" />
                        </span>
                    ))}
                </div>
            </div>

            {/* ── FEATURED DISHES ───────────────────────────── */}
            <section className="section home__dishes">
                <div className="container">
                    <AnimSection className="text-center">
                        <p className="section-label">Especialidades</p>
                        <h2 className="section-title">Platillos <span>Destacados</span></h2>
                        <div className="divider" />
                        <p className="section-subtitle">
                            Cocinados con ingredientes frescos, recetas tradicionales y el sazón de siempre.
                        </p>
                    </AnimSection>

                    <div className="home__dishes-grid">
                        {featuredDishes.map((dish, i) => (
                            <AnimSection key={dish.name} delay={i * 80} className="food-card">
                                <div className="food-card__img-wrap">
                                    <DishIllustration type={dish.type} title={dish.name} />
                                    <span className="food-card__tag">{dish.tag}</span>
                                </div>
                                <div className="food-card-body">
                                    <p className="food-card-name">{dish.name}</p>
                                    <p className="food-card-desc">{dish.desc}</p>
                                    <div className="food-card-footer">
                                        <span className="food-card-price">{dish.price}</span>
                                    </div>
                                </div>
                            </AnimSection>
                        ))}
                    </div>

                    <AnimSection className="text-center" delay={200}>
                        <Link to="/menu" className="btn btn-gold btn-lg">Ver Menú Completo →</Link>
                    </AnimSection>
                </div>
            </section>

            {/* ── LOCATIONS PREVIEW ─────────────────────────── */}
            <section className="section home__locations pattern-dots">
                <div className="container">
                    <AnimSection className="text-center">
                        <p className="section-label">Encuéntranos</p>
                        <h2 className="section-title">Nuestras <span>Sucursales</span></h2>
                        <div className="divider" />
                    </AnimSection>

                    <div className="home__locations-grid">
                        {locations.map((loc, i) => (
                            <AnimSection key={loc.id} delay={i * 100} className="location-preview-card">
                                <div className="location-preview-card__header">
                                    <div>
                                        <h3 className="location-preview-card__name">{loc.name}</h3>
                                        <p className="location-preview-card__addr">📍 {loc.address}</p>
                                    </div>
                                    <span className={`badge ${loc.status === 'open' ? 'badge-open' : 'badge-soon'}`}>
                                        {loc.status === 'open' ? '● Abierto' : '◐ Próximamente'}
                                    </span>
                                </div>
                                {loc.hours && (
                                    <div className="location-preview-card__hours">
                                        <p>🕐 {loc.hours.weekday}</p>
                                        <p>🕐 {loc.hours.weekend}</p>
                                    </div>
                                )}
                                {loc.status === 'coming-soon' && (
                                    <div className="location-preview-card__soon">
                                        <span>🚧</span>
                                        <p>¡Nueva sucursal próximamente! Mantente al tanto.</p>
                                    </div>
                                )}
                                <div className="location-preview-card__footer">
                                    {loc.status === 'open' ? (
                                        <Link to={`/menu?location=${loc.id}`} className="btn btn-primary btn-sm">Ver Menú</Link>
                                    ) : (
                                        <span className="btn btn-secondary btn-sm" style={{ opacity: 0.5, cursor: 'default' }}>Próximamente</span>
                                    )}
                                    <Link to="/locations" className="btn btn-secondary btn-sm">Ver Sucursal →</Link>
                                </div>
                            </AnimSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ABOUT SNIPPET ─────────────────────────────── */}
            <section className="section home__about">
                <div className="container">
                    <div className="home__about-grid">
                        <AnimSection className="home__about-img-wrap">
                            <div className="home__about-panel wood-frame">
                                <div className="home__about-panel-inner">
                                    <DishIllustration type="taco" title="Cocina tradicional" className="home__about-art" />
                                    <img src={logoImg} alt="El Buen Sazón" className="home__about-logo" />
                                </div>
                            </div>
                            <div className="home__about-stat">
                                <span className="home__about-stat-num">100%</span>
                                <span className="home__about-stat-label">Auténtico</span>
                            </div>
                        </AnimSection>
                        <AnimSection className="home__about-content" delay={150}>
                            <p className="section-label" style={{ justifyContent: 'flex-start' }}>Nuestra Historia</p>
                            <h2 className="section-title text-left">El Sabor de <span>Juárez</span></h2>
                            <div className="divider divider-left" />
                            <p>
                                El Buen Sazón nació del amor por la cocina tradicional de Ciudad Juárez.
                                Desde la primera tortilla hasta el último taco, cada platillo lleva el alma
                                de nuestras abuelas y la pasión de nuestra familia.
                            </p>
                            <p style={{ marginTop: '1rem' }}>
                                Usamos ingredientes frescos, recetas heredadas y mucho cariño para traerte
                                el auténtico sabor Juarense. Porque para nosotros, cocinar es un acto de amor.
                            </p>
                            <div className="home__about-badges">
                                <div className="home__about-badge"><span>🌽</span><p>Ingredientes Frescos</p></div>
                                <div className="home__about-badge"><span>👨‍👩‍👧</span><p>Negocio Familiar</p></div>
                                <div className="home__about-badge"><span>🇲🇽</span><p>Recetas Tradicionales</p></div>
                            </div>
                            <Link to="/about" className="btn btn-primary" style={{ marginTop: '2rem' }}>Conoce Nuestra Historia →</Link>
                        </AnimSection>
                    </div>
                </div>
            </section>

            {/* ── GALLERY STRIP ─────────────────────────────── */}
            <section className="section-sm home__gallery-strip">
                <div className="container">
                    <AnimSection className="text-center">
                        <p className="section-label">Galería</p>
                        <h2 className="section-title">Comida que <span>Enamora</span></h2>
                        <div className="divider" />
                    </AnimSection>
                    <div className="home__gallery-grid">
                        {galleryTypes.map((t, i) => (
                            <AnimSection key={i} delay={i * 60} className="home__gallery-item">
                                <DishIllustration type={t} title={`Galería ${i + 1}`} />
                            </AnimSection>
                        ))}
                    </div>
                    <AnimSection className="text-center" delay={150}>
                        <Link to="/gallery" className="btn btn-secondary btn-lg">Ver Galería Completa 📸</Link>
                    </AnimSection>
                </div>
            </section>

            {/* ── CTA BANNER ────────────────────────────────── */}
            <section className="home__cta-banner">
                <div className="home__cta-banner-bg" aria-hidden="true" />
                <AnimSection className="container text-center">
                    <p className="section-label">Visítanos</p>
                    <h2 className="home__cta-title">¿Listo para el Auténtico <span>Sabor Juarense?</span></h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem' }}>
                        Encuéntranos en nuestras sucursales. ¡Te esperamos con los brazos abiertos!
                    </p>
                    <div className="hero__ctas">
                        <Link to="/locations" className="btn btn-primary btn-lg">📍 Encontrar Sucursal</Link>
                        <Link to="/contact" className="btn btn-secondary btn-lg">✉️ Contáctanos</Link>
                    </div>
                </AnimSection>
            </section>
        </main>
    );
}
