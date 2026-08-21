/* ==========================================================================
   OJOS EN ALERTA - RUTAS DE API REST ENEXAS
   ========================================================================== */

import { Router } from 'express';
import {
  loginWithCiDi,
  getIncidents,
  createIncident,
  getPatrols,
  getMunicipalSettings,
  updateMunicipalSettings
} from '../controllers/apiController.js';

const router = Router();

// Rutas de Autenticación
router.post('/auth/cidi-login', loginWithCiDi);

// Rutas de Incidentes y Alertas
router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);

// Rutas de Patrullas y Telemetría
router.get('/patrols', getPatrols);

// Rutas de Ajustes Municipales
router.get('/settings', getMunicipalSettings);
router.put('/settings', updateMunicipalSettings);

export default router;
