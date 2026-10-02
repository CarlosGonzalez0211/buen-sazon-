// Single source of truth for the site. Facts marked VERIFIED come from the
// restaurant's Facebook page (facebook.com/elbuensazonjuarez); anything marked
// TODO is a placeholder the owner needs to confirm.

export const brand = {
    name: 'El Buen Sazón',
    tagline: 'Comida mexicana y antojitos con sabor casero',
    phone: '656 407 1273', // VERIFIED
    phoneHref: 'tel:+526564071273',
    whatsapp: 'https://wa.me/526564071273', // VERIFIED number, link format assumed
    email: 'elbuensazonpradera@hotmail.com', // VERIFIED
    facebook: 'https://www.facebook.com/elbuensazonjuarez',
    instagram: 'https://instagram.com/elbuensazonjrz',
    tiktok: 'https://www.tiktok.com/@elbuensazonjrz',
    linktree: 'https://linktr.ee/Elbuensazonjrz',
    followers: '7.2K',
    recommend: 84,
    reviews: 342,
    timezone: 'America/Ciudad_Juarez',
};

// Day 0 = Sunday. [open, close] in 24h decimal hours. VERIFIED (Facebook "About").
export const hours = {
    0: [8, 14.5],
    1: [8, 17],
    2: [8, 17],
    3: [8, 17],
    4: [8, 17],
    5: [8, 17],
    6: [8, 17],
};
export const hoursText = [
    { days: 'Lunes a sábado', time: '8:00 am – 5:00 pm' },
    { days: 'Domingo', time: '8:00 am – 2:30 pm' },
];

export const locations = [
    {
        slug: 'tecnologico',
        name: 'Tecnológico',
        zone: 'Pradera · Av. Tecnológico',
        address: 'Av. Tecnológico #3575-19B, Ciudad Juárez, Chih.', // VERIFIED
        phone: brand.phone,
        services: ['Comedor', 'Servicio a domicilio', 'Pedidos por WhatsApp'],
        uberEats: null, // TODO: URL de Uber Eats de esta sucursal
        verified: true,
        note: 'Sucursal principal de nuestra página de Facebook.',
    },
    {
        slug: 'sucursal-2',
        name: 'Segunda sucursal',
        zone: 'Ciudad Juárez',
        address: null, // TODO: confirmar dirección
        phone: brand.phone, // TODO: número propio de la sucursal
        services: ['Comedor', 'Servicio a domicilio'],
        uberEats: null, // TODO: URL de Uber Eats de esta sucursal
        verified: false,
        note: 'Pronto publicaremos los datos completos de esta sucursal.',
    },
    {
        slug: 'sucursal-3',
        name: 'Tercera sucursal',
        zone: 'Ciudad Juárez',
        address: null, // TODO: confirmar dirección
        phone: brand.phone, // TODO: número propio de la sucursal
        services: ['Comedor', 'Servicio a domicilio'],
        uberEats: null, // TODO: URL de Uber Eats de esta sucursal
        verified: false,
        note: 'Pronto publicaremos los datos completos de esta sucursal.',
    },
];

export const getLocation = (slug) => locations.find((l) => l.slug === slug);

// Dishes that show up on the restaurant's own posts. No prices on purpose.
export const favorites = [
    { name: 'Pozole', note: 'Caliente, con todo y tostadas.' },
    { name: 'Flautas', note: 'Doradas, con arroz y frijoles.' },
    { name: 'Burritos', note: 'De harina, bien rellenos.' },
    { name: 'Gorditas', photo: 'gordita', note: 'Recién hechas, a tu gusto.' },
    { name: 'Chuleta ahumada', photo: 'chuleta', note: 'Con papas y guarnición.' },
    { name: 'Club sándwich', photo: 'club', note: 'Doble piso, con papas.' },
    { name: 'Ensalada de pollo', photo: 'ensalada', note: 'Para cuando andas a dieta.' },
    { name: 'Enchiladas', note: 'Con arroz y frijoles de olla.' },
];

// "Open now" in Ciudad Juárez time, independent of the visitor's timezone.
export function getOpenStatus(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: brand.timezone,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
    }).formatToParts(now);
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    const t = Number(get('hour')) + Number(get('minute')) / 60;
    const [open, close] = hours[day];
    if (t >= open && t < close) {
        const left = close - t;
        return { open: true, label: left <= 1 ? 'Cerramos pronto' : 'Abierto ahora' };
    }
    return { open: false, label: 'Cerrado por ahora' };
}
