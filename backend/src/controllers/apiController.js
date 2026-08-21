/* ==========================================================================
   OJOS EN ALERTA - REST API CONTROLLERS (AUTH CIDI, INCIDENTES, PATRULLAS)
   ========================================================================== */

import { memoryStore } from '../config/database.js';

// 1. AUTENTICACIÓN CIDI NIVEL 2 / ANSES
export async function loginWithCiDi(req, res) {
  const { dni, authProvider } = req.body;
  const citizen = memoryStore.citizens.find(c => c.dni === dni) || {
    id: `cit-${Date.now()}`,
    name: 'Ciudadano Validado CiDi',
    dni: dni || '35.999.888',
    authProvider: authProvider || 'CiDi Nivel 2',
    cidiVerified: true
  };

  return res.json({
    success: true,
    message: 'Autenticación exitosa con CiDi Nivel 2 / ANSES',
    token: `jwt_mock_${Date.now()}`,
    user: citizen
  });
}

// 2. INCIDENTES Y ALERTAS
export async function getIncidents(req, res) {
  return res.json({ success: true, incidents: memoryStore.incidents });
}

export async function createIncident(req, res) {
  const incident = {
    id: `inc-${Date.now()}`,
    ...req.body,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'searching'
  };
  memoryStore.incidents.unshift(incident);
  return res.status(201).json({ success: true, incident });
}

// 3. PATRULLAS Y TELEMETRÍA
export async function getPatrols(req, res) {
  return res.json({ success: true, patrols: memoryStore.patrols });
}

// 4. CONFIGURACIÓN MUNICIPAL
export async function getMunicipalSettings(req, res) {
  return res.json({ success: true, settings: memoryStore.municipalSettings });
}

export async function updateMunicipalSettings(req, res) {
  memoryStore.municipalSettings = { ...memoryStore.municipalSettings, ...req.body };
  return res.json({ success: true, settings: memoryStore.municipalSettings });
}
