import { Link } from 'react-router-dom';
import logo from '../assets/brand/logo-hero.png';
import { boho, brand, features, hoursText, locations } from './data';
import { bohoSalon, bohoSalonAlt } from './bohoAssets';
import { Arrow, Btn, Reveal } from './ui';

export function LocationCards() {
    return (
        <div className="suc__grid">
            {locations.map((l, i) => (
                <Reveal key={l.slug} delay={i * 100}>
                    <div className="shell">
                        <article className="card">
                            <span className="card__num">Sucursal {i + 1}</span>
                            <h3>{l.name}</h3>
                            <p className="card__addr">{l.address ?? 'Dirección próximamente'}</p>
                            <p className="card__hours">{l.comingSoon ? 'Próxima apertura' : `${hoursText[0].days} · ${hoursText[0].time}`}</p>
                            <div className="card__actions">
                                <Btn to={`/menu/${l.slug}`} tone="light" small>Ver menú</Btn>
                                {l.uberEats
                                    ? <Btn href={l.uberEats} tone="ghost-light" small>Uber Eats</Btn>
                                    : <span className="btn btn--sm btn--off" aria-disabled="true">Uber Eats · pronto</span>}
                            </div>
                            <Link to={`/sucursales/${l.slug}`} className="card__go">
                                <span>Ver sucursal</span><span className="btn__dot"><Arrow /></span>
                            </Link>
                        </article>
                    </div>
                </Reveal>
            ))}
        </div>
    );
}

const vibes = [
    ['Café', 'recién hecho, desde las 8'],
    ['Mesa', 'para la familia completa'],
    ['Domingo', 'de sobremesa larga'],
    ['Casa', 'con sazón de la de siempre'],
];

export default function Home() {
    return (
        <main>
            {/* HERO: the logo, big, on the brown */}
            <section className="hero2">
                <div className="hero2__stage">
                    <img className="hero2__logo" src={logo} alt="El Buen Sazón, comida mexicana y antojitos" />
                </div>
                <div className="hero2__foot">
                    <span />
                    <a href="#sucursales" className="hero2__cue">Elige tu sucursal <span><Arrow /></span></a>
                </div>
            </section>

            {/* SUCURSALES */}
            <section className="section suc suc--flat" id="sucursales">
                <div className="wrap">
                    <div className="suc__head">
                        <Reveal>
                            <span className="eyebrow">Tres sucursales</span>
                            <h2 className="h2" style={{ marginTop: '1rem' }}>Elige la <em>más cercana.</em></h2>
                        </Reveal>
                        <Reveal delay={100}>
                            <p className="lede" style={{ color: 'rgba(247,239,223,.75)' }}>Cada sucursal tiene su propio menú. Míralo aquí o pídelo por Uber Eats.</p>
                        </Reveal>
                    </div>
                    <LocationCards />
                </div>
            </section>

            {/* VIBE */}
            <section className="section vibe">
                <div className="wrap">
                    <Reveal>
                        <span className="eyebrow">El ambiente</span>
                        <h2 className="h1 vibe__title">Aquí se viene a <em>quedarse</em> un rato.</h2>
                    </Reveal>
                    <div className="vibe__grid">
                        <Reveal delay={80}>
                            <p className="lede">
                                Comida mexicana y antojitos con sabor casero, en un lugar para desayunar sin prisa,
                                comer en familia o juntarse con quien quieres. Servicio a domicilio disponible.
                            </p>
                            <div className="vibe__hours">
                                {hoursText.map((h) => <div key={h.days}><span>{h.days}</span><b>{h.time}</b></div>)}
                            </div>
                        </Reveal>
                        <ul className="vibe__list">
                            {vibes.map(([a, b], i) => (
                                <Reveal as="li" key={a} delay={i * 80}><b>{a}</b><span>{b}</span></Reveal>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SALÓN BOHO: hidden via features.boho in data.js */}
            {features.boho && (
                <section className="section boho">
                    <div className="wrap boho__grid">
                        <Reveal>
                            <span className="eyebrow">Eventos</span>
                            <h2 className="h2" style={{ margin: '1rem 0 1.5rem' }}>Tu fiesta, en <em>Salón Boho.</em></h2>
                            <p className="lede">Salón de eventos y catering. Cumpleaños, bodas y celebraciones en un lugar hecho para quedarse.</p>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '.8rem', flexWrap: 'wrap' }}>
                                <Btn to="/salon-boho" tone="light">Conocer el salón</Btn>
                                <Btn href={boho.whatsapp} tone="ghost">Cotizar</Btn>
                            </div>
                        </Reveal>
                        <Reveal delay={120} className="boho__art boho__art--photo">
                            <div className="arch"><div><img src={bohoSalon} alt={bohoSalonAlt} loading="lazy" /></div></div>
                        </Reveal>
                    </div>
                </section>
            )}

            {/* GALERÍA */}
            <section className="section">
                <div className="wrap">
                    <Reveal className="galcta">
                        <div>
                            <span className="eyebrow">Galería</span>
                            <h2 className="h2" style={{ marginTop: '1rem' }}>Todos los <em>platillos</em> y el lugar, en un solo sitio.</h2>
                        </div>
                        <Btn to="/galeria">Abrir la galería</Btn>
                    </Reveal>
                </div>
            </section>

            {/* REDES */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <Reveal>
                        <span className="eyebrow">Síguenos</span>
                        <h2 className="h2" style={{ marginTop: '1rem' }}>Antojo <em>diario</em> en tu pantalla.</h2>
                    </Reveal>
                    <div className="social">
                        {[
                            ['Facebook', `${brand.followers} seguidores`, brand.facebook],
                            ['Instagram', '@elbuensazonjrz', brand.instagram],
                            ['TikTok', '@elbuensazonjrz', brand.tiktok],
                            ['Linktree', 'Todos nuestros enlaces', brand.linktree],
                        ].map(([n, s, href], i) => (
                            <Reveal key={n} delay={i * 70}>
                                <a href={href} target="_blank" rel="noreferrer"><span>{s}</span><b>{n} ↗</b></a>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
