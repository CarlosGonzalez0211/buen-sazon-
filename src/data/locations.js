// locations.js – Branch data for El Buen Sazón

export const locations = [
    {
        id: 'sucursal-1',
        name: 'Sucursal Centro',
        shortName: 'Centro',
        address: 'Av. Juárez 1540, Col. Centro, Ciudad Juárez, Chih.',
        phone: '+52 656 123 4567',
        email: 'centro@elbuensazon.mx',
        hours: {
            weekday: 'Lun – Vie: 8:00 AM – 10:00 PM',
            weekend: 'Sáb – Dom: 8:00 AM – 11:00 PM',
        },
        status: 'open',
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3394.123456!2d-106.4245!3d31.7385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDQ0JzE4LjYiTiAxMDbCsDI1JzI4LjIiVw!5e0!3m2!1ses!2smx!4v1234567890',
        features: ['Comedor amplio', 'Wi-Fi gratis', 'Estacionamiento'],
        menuId: 'menu-centro',
    },
    {
        id: 'sucursal-2',
        name: 'Sucursal Sur',
        shortName: 'Sur',
        address: 'Blvd. Zaragoza 4890, Col. Partido Romero, Ciudad Juárez, Chih.',
        phone: '+52 656 234 5678',
        email: 'sur@elbuensazon.mx',
        hours: {
            weekday: 'Lun – Vie: 9:00 AM – 10:00 PM',
            weekend: 'Sáb – Dom: 9:00 AM – 11:00 PM',
        },
        status: 'open',
        mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3394.123456!2d-106.4145!3d31.6985!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDQxJzU0LjYiTiAxMDbCsDI0JzUyLjIiVw!5e0!3m2!1ses!2smx!4v1234567890',
        features: ['Drive-through', 'Área infantil', 'Pedidos en línea'],
        menuId: 'menu-sur',
    },
    {
        id: 'sucursal-3',
        name: 'Sucursal Norte',
        shortName: 'Norte',
        address: 'Blvd. Independencia Norte 2210, Col. San Lorenzo, Ciudad Juárez, Chih.',
        phone: null,
        email: null,
        hours: null,
        status: 'coming-soon',
        mapUrl: null,
        features: ['Próximamente', 'Mayor espacio', 'Terraza exterior'],
        menuId: null,
        openingSoon: 'Próximamente 2025',
    },
];

export const getLocationById = (id) => locations.find(l => l.id === id);
