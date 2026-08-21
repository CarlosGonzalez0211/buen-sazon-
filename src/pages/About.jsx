import { Link } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';
import DishIllustration from '../components/DishIllustration';
import './About.css';

const values = [
    { icon: '🌽', title: 'Ingredientes Frescos', desc: 'Seleccionamos los mejores ingredientes frescos cada día para garantizar el sabor auténtico.' },
    { icon: '👨‍👩‍👧', title: 'Negocio Familiar', desc: 'Somos una familia que cocina con amor y comparte sus recetas con la comunidad.' },
    { icon: '🏠', title: 'Recetas Caseras', desc: 'Cada platillo lleva la receta heredada de nuestras abuelas. Sabor de hogar.' },
    { icon: '🇲🇽', title: 'Orgullo Juarense', desc: 'Representamos el auténtico sabor de Ciudad Juárez con cada taco y burrito.' },
];

const milestones = [
    { year: '2018', event: 'Apertura de la primera sucursal en el Centro de Juárez' },
    { year: '2020', event: 'Reconocidos como mejor comida de calle de la ciudad' },
    { year: '2022', event: 'Apertura de la Sucursal Sur' },
    { year: '2025', event: 'Nueva Sucursal Norte próximamente' },
];

export default function About() {
    return (
        <main className="page-wrapper">
            <div className="page-hero">
                <div className="container">
                    <p className="section-label">Nuestra Historia</p>
                    <h1 className="section-title">El Buen Sazón – <span>Nuestra Esencia</span></h1>
                    <div className="divider" />
                    <p className="section-subtitle">
                        Más que un restaurante, somos una familia unida por el amor a la cocina mexicana.
                    </p>
                </div>
            </div>

            <div className="page-content">
                {/* Origin Story */}
                <section className="section">
                    <div className="container">
                        <div className="about__story-grid">
                            <div className="about__story-img wood-frame">
                                <div className="about__illus-panel tex-brick">
                                    <DishIllustration type="enchiladas" name="Enchiladas" title="Enchiladas de la casa" className="about__illus-svg" />
                                </div>
                                <div className="about__story-badge">
                                    <img src={logoImg} alt="Logo" />
                                    <p>Desde 2018</p>
                                </div>
                            </div>
                            <div className="about__story-content">
                                <p className="section-label" style={{ justifyContent: 'flex-start' }}>Nuestra Historia</p>
                                <h2 className="section-title text-left">El Sabor que <span>Nos Une</span></h2>
                                <div className="divider divider-left" />
                                <p style={{ marginBottom: '1rem' }}>
                                    El Buen Sazón nació en 2018 de un sueño familiar: compartir el auténtico sabor
                                    de la cocina Juarense con toda la ciudad. Lo que empezó como un pequeño puesto
                                    de tacos creció gracias al cariño de nuestra comunidad.
                                </p>
                                <p style={{ marginBottom: '1rem' }}>
                                    Nuestra fundadora, Doña Patricia González, aprendió estas recetas de su madre
                                    y su abuela. Cada salsa, cada marinada, cada tortilla lleva el amor de generaciones
                                    de cocineras Juarenses.
                                </p>
                                <p>
                                    Hoy tenemos tres sucursales y seguimos creciendo, pero nunca olvidamos nuestras
                                    raíces: comida honesta, ingredientes frescos, y el sazón que hace que la gente
                                    regrese una y otra vez.
                                </p>
                                <Link to="/menu" className="btn btn-primary" style={{ marginTop: '2rem' }}>
                                    🌮 Ver Nuestro Menú
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="section pattern-dots" style={{ background: 'var(--bg-dark-2)' }}>
                    <div className="container">
                        <div className="text-center">
                            <p className="section-label">Lo que nos define</p>
                            <h2 className="section-title">Nuestros <span>Valores</span></h2>
                            <div className="divider" />
                        </div>
                        <div className="about__values-grid">
                            {values.map(v => (
                                <div key={v.title} className="about__value-card">
                                    <span className="about__value-icon">{v.icon}</span>
                                    <h3 className="about__value-title">{v.title}</h3>
                                    <p className="about__value-desc">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section className="section">
                    <div className="container">
                        <div className="text-center">
                            <p className="section-label">Nuestro camino</p>
                            <h2 className="section-title">Historia y <span>Crecimiento</span></h2>
                            <div className="divider" />
                        </div>
                        <div className="about__timeline">
                            {milestones.map((m, i) => (
                                <div key={m.year} className={`about__milestone ${i % 2 === 0 ? 'about__milestone--left' : 'about__milestone--right'}`}>
                                    <div className="about__milestone-content">
                                        <span className="about__milestone-year">{m.year}</span>
                                        <p className="about__milestone-event">{m.event}</p>
                                    </div>
                                    <div className="about__milestone-dot" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Food Story */}
                <section className="section" style={{ background: 'var(--bg-dark-2)' }}>
                    <div className="container">
                        <div className="about__food-strip">
                            <div className="about__food-img wood-frame">
                                <div className="about__illus-panel tex-brick">
                                    <DishIllustration type="elote" name="Elote" title="Elote a la mexicana" className="about__illus-svg" />
                                </div>
                            </div>
                            <div className="about__food-content">
                                <p className="section-label" style={{ justifyContent: 'flex-start' }}>Tradición</p>
                                <h2 className="section-title text-left">La Comida como <span>Arte</span></h2>
                                <div className="divider divider-left" />
                                <p>
                                    En El Buen Sazón, la comida no es sólo alimento: es cultura, tradición e identidad.
                                    Cada tortilla es hecha a mano, cada salsa es cocinada en metate, y cada taco
                                    lleva el alma de Ciudad Juárez.
                                </p>
                                <p style={{ marginTop: '1rem' }}>
                                    Creemos que la auténtica cocina mexicana merece ser celebrada, compartida y disfrutada
                                    en compañía de quienes más queremos.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                                    <Link to="/locations" className="btn btn-primary">📍 Visítanos</Link>
                                    <Link to="/contact" className="btn btn-secondary">✉️ Contáctanos</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
