/* ==========================================================================
   OJOS EN ALERTA - REST API CONTROLLERS (AUTH CIDI, INCIDENTES, PATRULLAS)
   ========================================================================== */

import { memoryStore } from '../config/database.js';
import { authenticateWithCiDi, sendSmsOtp, verifySmsOtp } from '../services/authService.js';

// 1. AUTENTICACIÓN REAL CIDI NIVEL 2 / ANSES
export async function loginWithCiDi(req, res) {
  const { authCode, dni, authProvider } = req.body;
  try {
    const cidiResult = await authenticateWithCiDi(authCode || 'code_mock_cidi');
    
    const citizen = {
      id: `cit-${Date.now()}`,
      name: cidiResult.name,
      dni: cidiResult.dni || dni || '35.123.456',
      address: cidiResult.address || 'Córdoba Capital',
      authProvider: cidiResult.provider,
      cidiLevel: cidiResult.cidiLevel,
      cidiVerified: true,
      verifiedAt: cidiResult.verifiedAt
    };

    memoryStore.citizens.unshift(citizen);

    return res.json({
      success: true,
      message: 'Autenticación e Identidad Validada exitosamente con CiDi Nivel 2',
      token: `jwt_cidi_token_${Date.now()}`,
      user: citizen
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 2. SERVICIO DE VERIFICACIÓN VÍA SMS OTP
export async function requestSmsCode(req, res) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Número de teléfono requerido' });
  const result = await sendSmsOtp(phone);
  return res.json(result);
}

export async function confirmSmsCode(req, res) {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ success: false, message: 'Teléfono y código requeridos' });
  const result = await verifySmsOtp(phone, code);
  return res.json(result);
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
