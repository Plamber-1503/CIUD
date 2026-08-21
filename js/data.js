/* ==========================================================================
   OJOS EN ALERTA - CORDOBESES EN ALERTA
   Base de Datos Demo, Usuarios, Métricas y Manejo de Estado Real-Time
   ========================================================================== */

// 1. CIUDADANOS DEMO (5 Usuarios Registrados con DNI, Tel, Domicilio y Validación CiDi / ANSES)
export const DEMO_CITIZENS = [
  {
    id: 'cit-1',
    name: 'Juan Pérez',
    dni: '35.123.456',
    phone: '351-555-0101',
    address: 'Av. Colón 1234, Córdoba',
    coords: [-31.4135, -64.1867], // Centro Córdoba
    emergencyContact: 'Hermano: 351-555-9988',
    authProvider: 'CiDi', // CiDi Nivel 2
    cidiVerified: true
  },
  {
    id: 'cit-2',
    name: 'María González',
    dni: '38.987.654',
    phone: '351-555-0102',
    address: 'Av. Vélez Sarsfield 567, Córdoba',
    coords: [-31.4230, -64.1880], // Nueva Córdoba
    emergencyContact: 'Esposo: 351-555-7766',
    authProvider: 'ANSES / Mi Argentina',
    cidiVerified: true
  },
  {
    id: 'cit-3',
    name: 'Carlos Rodríguez',
    dni: '32.456.789',
    phone: '351-555-0103',
    address: 'General Paz 890, Córdoba',
    coords: [-31.4080, -64.1810], // Barrio Alberdi / Centro
    emergencyContact: 'Madre: 351-555-4433',
    authProvider: 'CiDi',
    cidiVerified: true
  },
  {
    id: 'cit-4',
    name: 'Ana Martínez',
    dni: '40.111.222',
    phone: '351-555-0104',
    address: 'Obispo Trejo 432, Córdoba',
    coords: [-31.4200, -64.1870], // Plaza San Martín / Nueva Córdoba
    emergencyContact: 'Padre: 351-555-1122',
    authProvider: 'CiDi',
    cidiVerified: true
  },
  {
    id: 'cit-5',
    name: 'Lucas Silva',
    dni: '37.333.444',
    phone: '351-555-0105',
    address: 'Fragueiro 1550, Córdoba',
    coords: [-31.3980, -64.1890], // Alta Córdoba
    emergencyContact: 'Hermana: 351-555-3311',
    authProvider: 'ANSES',
    cidiVerified: true
  }
];

// 2. PATRULLAS / MÓVILES DE SEGURIDAD URBANA (3 Unidades con Métricas de Servicio)
// Estados:
// 'online'  => 🟢 Círculo Verde (En Patrullaje Activo)
// 'busy'    => 🔴 Círculo Rojo (Asignado a Incidente / Alerta)
// 'stopped' => 🟡 Círculo Amarillo (Móvil Detenido / Inactivo > 15 min)
export const DEMO_PATROLS = [
  {
    id: 'pat-101',
    code: 'Móvil M-101',
    officer: 'Agente Fernando Gómez',
    badge: 'SU-4029',
    phone: '351-555-9001',
    vehicle: 'Nissan Frontier 4x4 (AF-892-OK)',
    zone: 'Zona Centro / General Paz',
    status: 'online', // 🟢 Verde
    coords: [-31.4110, -64.1840],
    metrics: {
      acceptedToday: 8,
      rejectedToday: 1,
      acceptedMonth: 142,
      rejectedMonth: 12,
      stoppedTimeMinutesToday: 20,
      stoppedTimeMinutesMonth: 310
    }
  },
  {
    id: 'pat-102',
    code: 'Móvil M-102',
    officer: 'Agente Laura Fernández',
    badge: 'SU-3882',
    phone: '351-555-9002',
    vehicle: 'Renault Kangoo Urbana (AE-714-XY)',
    zone: 'Zona Sur / Nueva Córdoba',
    status: 'busy', // 🔴 Rojo
    coords: [-31.4250, -64.1895],
    metrics: {
      acceptedToday: 11,
      rejectedToday: 2,
      acceptedMonth: 180,
      rejectedMonth: 15,
      stoppedTimeMinutesToday: 45,
      stoppedTimeMinutesMonth: 520
    }
  },
  {
    id: 'pat-103',
    code: 'Móvil M-103',
    officer: 'Agente Roberto Cáceres',
    badge: 'SU-5104',
    phone: '351-555-9003',
    vehicle: 'Fiat Cronos Patrulla (AG-301-ZZ)',
    zone: 'Zona Norte / Alta Córdoba',
    status: 'stopped', // 🟡 Amarillo (> 15 min inactivo)
    coords: [-31.4010, -64.1850],
    metrics: {
      acceptedToday: 4,
      rejectedToday: 0,
      acceptedMonth: 95,
      rejectedMonth: 8,
      stoppedTimeMinutesToday: 85,
      stoppedTimeMinutesMonth: 890
    }
  }
];

// 3. CENTRAL DE MONITOREO (Operador Principal)
export const CENTRAL_OPERATOR = {
  id: 'central-01',
  name: 'Operador Central - Despacho Principal',
  code: 'CENTRAL-01',
  broadcastRadiusKm: 5.0 // Radio predeterminado de 5 km (configurable)
};

// 4. CONFIGURACIÓN MUNICIPAL GLOBAL (ADMINISTRABLE DESDE CENTRAL DE MONITOREO)
export const MUNICIPAL_SETTINGS = {
  municipalityName: 'Municipalidad de Córdoba',
  patrolVisibilityToCitizen: true, // true = Ciudadano ve móvil en mapa, false = Oculto por seguridad
  cidiIntegrationEnabled: true,
  ansesIntegrationEnabled: true,
  incidentCategories: [
    { id: 'robo', name: 'Intento de Robo', icon: '🚨', danger: 'high', active: true },
    { id: 'violencia', name: 'Violencia Callejera', icon: '⚠️', danger: 'high', active: true },
    { id: 'accidente', name: 'Accidente Tránsito', icon: '🚗', danger: 'medium', active: true },
    { id: 'sospechoso', name: 'Actitud Sospechosa', icon: '👁️', danger: 'medium', active: true },
    { id: 'medica', name: 'Emergencia Médica', icon: '🚑', danger: 'high', active: true },
    { id: 'incendio', name: 'Foco de Incendio / Humo', icon: '🔥', danger: 'high', active: true }
  ]
};

// CATEGORÍAS DE INCIDENTES (Retrocompatibilidad)
export const INCIDENT_CATEGORIES = MUNICIPAL_SETTINGS.incidentCategories;

// ALMACENAMIENTO DE MENSAJES DE CHAT (GENERAL Y DE CASO)
export const CHAT_STORE = [];

// GENERADOR DE SONIDOS SINTETIZADOS EN NAVEGADOR (Web Audio API)
export function playAlertSound(type = 'dispatch') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'dispatch' || type === 'panic') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(650, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(650, ctx.currentTime + 0.45);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'accept') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.warn('Audio non-blocking error:', e);
  }
}

// CÁLCULO DE DISTANCIA HAVERSINE (En Kilómetros)
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
