/* ==========================================================================
   OJOS EN ALERTA - RUTAS DE API REST ENEXAS
   ========================================================================== */

import { Router } from 'express';
import {
  loginWithCiDi,
  requestSmsCode,
  confirmSmsCode,
  getIncidents,
  createIncident,
  getPatrols,
  getMunicipalSettings,
  updateMunicipalSettings
} from '../controllers/apiController.js';

const router = Router();

// Rutas de Autenticación e Identidad Real
router.post('/auth/cidi-login', loginWithCiDi);
router.post('/auth/sms/send-otp', requestSmsCode);
router.post('/auth/sms/verify-otp', confirmSmsCode);

// Rutas de Incidentes y Alertas
router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);

// Rutas de Patrullas y Telemetría
router.get('/patrols', getPatrols);

// Rutas de Ajustes Municipales
router.get('/settings', getMunicipalSettings);
router.put('/settings', updateMunicipalSettings);

export default router;
