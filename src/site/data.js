// Single source of truth for the site. Facts marked VERIFIED come from the
// restaurant's Facebook page (facebook.com/elbuensazonjuarez); anything marked
// TODO is a placeholder the owner needs to confirm.

export const brand = {
    name: 'El Buen Sazón',
    tagline: 'Comida mexicana y antojitos con sabor casero',
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

// Feature flags. Salón Boho is built but hidden (planned for its own site).
export const features = { boho: false };

// Salón Boho (salón de eventos y catering). VERIFIED (owner).
export const boho = {
    phone: '656 100 9950',
    phoneHref: 'tel:+526561009950',
    whatsapp: 'https://wa.me/526561009950?text=' + encodeURIComponent('Hola, me gustaría cotizar un evento en Salón Boho.'),
    email: 'eventosdecorarconmagia@gmail.com',
    linktree: 'https://linktr.ee/salonboho',
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
        slug: 'ramon-rivera-lara',
        video: 'https://www.facebook.com/elbuensazonjuarez/videos/1170800437194094/', // video de la sucursal (Facebook)
        name: 'Ramón Rivera Lara',
        zone: 'Ciudad Juárez',
        address: 'Ramón Rivera Lara, 32605 Ciudad Juárez, Chih.', // VERIFIED (owner)
        phone: '656 407 1273', // VERIFIED (owner): solo la sucursal 1
        services: ['Comedor', 'Servicio a domicilio', 'Uber Eats'],
        uberEats: 'https://www.ubereats.com/mx-en/store/el-buen-sazon/V5X5qVfvTm6WIzMCxJrTUA?diningMode=DELIVERY&ps=1&surfaceName=',
        verified: true,
        note: '',
    },
    {
        slug: 'juarez-mall',
        video: 'https://www.facebook.com/elbuensazonjuarez/videos/3358380244467691/', // video de la sucursal (Facebook)
        name: 'Juárez Mall', // name taken from the Uber Eats listing ("suc-juarez-mall"); TODO: confirmar
        zone: 'Del Márquez',
        address: 'Av. Ejército Nacional 2701, Del Márquez, 32607 Juárez, Chih.', // VERIFIED (owner)
        phone: null, // TODO: teléfono de esta sucursal
        services: ['Comedor', 'Servicio a domicilio', 'Uber Eats'],
        uberEats: 'https://www.ubereats.com/mx-en/store/el-buen-sazon-suc-juarez-mall/1spa7tVDV9a4VMpFsuO3Hg?diningMode=DELIVERY&ps=1&surfaceName=',
        verified: true,
        note: '',
    },
    {
        slug: 'troncoso',
        name: 'Troncoso',
        zone: 'Fracc. Eco 2000',
        address: 'Santiago Blancas #1110, Fracc. Eco 2000, Ciudad Juárez, Chih.', // VERIFIED (flyer de próxima apertura)
        phone: null, // TODO: teléfono de esta sucursal
        services: ['Comedor', 'Servicio a domicilio'],
        uberEats: null, // TODO: URL de Uber Eats cuando abra
        comingSoon: true,
        verified: true,
        note: 'Próxima apertura. Pronto publicaremos horario y menú.',
    },
];

// Phone helpers: each branch has its own number (or none yet).
const digits = (l) => l?.phone?.replace(/\D/g, '');
export const telHref = (l) => (digits(l) ? `tel:+52${digits(l)}` : null);
export const waHref = (l, text) => (digits(l) ? `https://wa.me/52${digits(l)}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null);

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
