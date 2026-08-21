/* ==========================================================================
   OJOS EN ALERTA - BACKEND DATABASE CONFIG & POSTGIS SPATIAL ENGINE
   ========================================================================== */

import pg from 'pg';

const { Pool } = pg;

// Configuración de pool PostgreSQL
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ojos_en_alerta_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000
});

// Verificación de conexión a PostgreSQL
let isPostgresConnected = false;

export async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL DB');
    
    // Crear extensión PostGIS si existe
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    client.release();
    isPostgresConnected = true;
  } catch (err) {
    console.warn('⚠️ No se detectó un servidor PostgreSQL activo. Utilizando Motor Espacial In-Memory de alta velocidad para entorno Dev.');
    isPostgresConnected = false;
  }
}

// In-Memory Data Store para entorno de desarrollo local ultrarrápido
export const memoryStore = {
  citizens: [
    { id: 'cit-1', name: 'Juan Pérez', dni: '35.123.456', authProvider: 'CiDi', coords: [-31.4135, -64.1867] },
    { id: 'cit-2', name: 'María González', dni: '38.987.654', authProvider: 'ANSES', coords: [-31.4230, -64.1880] }
  ],
  patrols: [
    { id: 'pat-101', code: 'Móvil M-101', officer: 'Agente Fernando Gómez', status: 'online', coords: [-31.4110, -64.1840] },
    { id: 'pat-102', code: 'Móvil M-102', officer: 'Agente Laura Fernández', status: 'busy', coords: [-31.4250, -64.1895] },
    { id: 'pat-103', code: 'Móvil M-103', officer: 'Agente Roberto Cáceres', status: 'stopped', coords: [-31.4010, -64.1850] }
  ],
  incidents: [],
  municipalSettings: {
    municipalityName: 'Municipalidad de Córdoba',
    patrolVisibilityToCitizen: true,
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
  }
};
