import { useState } from 'react';
import { locations } from '../data/locations';
import './Contact.css';

const socialLinks = [
    { icon: '📘', label: 'Facebook', handle: '@ElBuenSazon', href: 'https://facebook.com' },
    { icon: '📸', label: 'Instagram', handle: '@elbuensazon_mx', href: 'https://instagram.com' },
    { icon: '🎵', label: 'TikTok', handle: '@elbuensazon', href: 'https://tiktok.com' },
];

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();
        // TODO: integrate real form submission
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    };

    return (
        <main className="page-wrapper">
            <div className="page-hero">
                <div className="container">
                    <p className="section-label">Contáctanos</p>
                    <h1 className="section-title">Estamos para <span>Servirte</span></h1>
                    <div className="divider" />
                    <p className="section-subtitle">
                        ¿Tienes preguntas, comentarios o reservaciones? ¡Escríbenos! Respondemos en menos de 24 horas.
                    </p>
                </div>
            </div>

            <div className="page-content section">
                <div className="container">
                    <div className="contact__grid">
                        {/* Contact Form */}
                        <div className="contact__form-wrap">
                            <h2 className="contact__form-title">Envíanos un Mensaje</h2>
                            {submitted && (
                                <div className="contact__success">
                                    ✅ ¡Mensaje enviado! Te contactaremos pronto.
                                </div>
                            )}
                            <form className="contact__form" onSubmit={handleSubmit} noValidate>
                                <div className="contact__form-row">
                                    <div className="form-group">
                                        <label htmlFor="name" className="form-label">Nombre *</label>
                                        <input id="name" name="name" type="text" className="form-input" placeholder="Tu nombre" value={form.name} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email" className="form-label">Email *</label>
                                        <input id="email" name="email" type="email" className="form-input" placeholder="tu@email.com" value={form.email} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="contact__form-row">
                                    <div className="form-group">
                                        <label htmlFor="phone" className="form-label">Teléfono</label>
                                        <input id="phone" name="phone" type="tel" className="form-input" placeholder="+52 656 000 0000" value={form.phone} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="subject" className="form-label">Asunto *</label>
                                        <select id="subject" name="subject" className="form-select" value={form.subject} onChange={handleChange} required>
                                            <option value="">Selecciona un asunto</option>
                                            <option value="reservacion">Reservación</option>
                                            <option value="pedido">Pedido especial</option>
                                            <option value="evento">Evento privado</option>
                                            <option value="queja">Comentario / Queja</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="message" className="form-label">Mensaje *</label>
                                    <textarea id="message" name="message" className="form-textarea" placeholder="Cuéntanos en qué podemos ayudarte..." rows={5} value={form.message} onChange={handleChange} required />
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg w-full" style={{ justifyContent: 'center' }}>
                                    📨 Enviar Mensaje
                                </button>
                            </form>
                        </div>

                        {/* Info Panel */}
                        <div className="contact__info">
                            <h3 className="contact__info-title">Información de Contacto</h3>

                            {locations.filter(l => l.status === 'open').map(loc => (
                                <div key={loc.id} className="contact__location-card">
                                    <h4 className="contact__location-name">{loc.name}</h4>
                                    <p className="contact__location-addr">📍 {loc.address}</p>
                                    {loc.phone && <p className="contact__location-phone">📞 <a href={`tel:${loc.phone}`} className="contact__link">{loc.phone}</a></p>}
                                    {loc.email && <p className="contact__location-email">✉️ <a href={`mailto:${loc.email}`} className="contact__link">{loc.email}</a></p>}
                                    {loc.hours && (
                                        <div className="contact__location-hours">
                                            <p>🕐 {loc.hours.weekday}</p>
                                            <p>🕐 {loc.hours.weekend}</p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Social */}
                            <div className="contact__social">
                                <h4 className="contact__social-title">Síguenos</h4>
                                {socialLinks.map(s => (
                                    <a key={s.label} href={s.href} className="contact__social-link" target="_blank" rel="noopener noreferrer">
                                        <span className="contact__social-icon">{s.icon}</span>
                                        <div>
                                            <p className="contact__social-name">{s.label}</p>
                                            <p className="contact__social-handle">{s.handle}</p>
                                        </div>
                                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
                                    </a>
                                ))}
                            </div>

                            {/* Map */}
                            <div className="contact__map">
                                <h4 className="contact__social-title">Sucursal Centro</h4>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3394.123456!2d-106.4245!3d31.7385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDQ0JzE4LjYiTiAxMDbCsDI1JzI4LjIiVw!5e0!3m2!1ses!2smx!4v1234567890"
                                    width="100%"
                                    height="220"
                                    style={{ border: 0, borderRadius: '12px' }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Mapa Sucursal Centro"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
