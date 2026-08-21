/* ==========================================================================
   OJOS EN ALERTA - REAL-TIME WEBSOCKET DISPATCH ENGINE (SOCKET.IO)
   ========================================================================== */

import { memoryStore } from '../config/database.js';

export function setupDispatchSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Unirse a sala según rol (citizen, patrol, central)
    socket.on('join:role', (data) => {
      const { role, userId } = data;
      socket.join(role);
      console.log(`👤 Socket ${socket.id} se unió al rol: ${role} (${userId})`);
      
      // Enviar configuración municipal actual al conectarse
      socket.emit('settings:current', memoryStore.municipalSettings);
    });

    // 🚨 1. VECINO: DISPARO DE BOTÓN DE PÁNICO / ALERTA DE AUXILIO
    socket.on('citizen:panic', (incidentData) => {
      const newIncident = {
        id: `inc-${Date.now()}`,
        citizenId: incidentData.citizenId,
        citizenName: incidentData.citizenName,
        citizenAddress: incidentData.citizenAddress,
        coords: incidentData.coords,
        category: incidentData.category,
        description: incidentData.description || 'Sin descripción',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'searching', // 'searching' | 'assigned' | 'resolved'
        assignedPatrol: null
      };

      memoryStore.incidents.unshift(newIncident);
      console.log(`🚨 NUEVA ALERTA DE PÁNICO DETECTADA: ${newIncident.id} (${newIncident.category.name})`);

      // Emitir evento prioritario a la Central de Monitoreo
      io.to('central').emit('central:new_incident', newIncident);

      // Buscar la patrulla libre más cercana en línea (Algoritmo Haversine)
      const availablePatrol = memoryStore.patrols.find(p => p.status === 'online');

      if (availablePatrol) {
        newIncident.assignedPatrol = availablePatrol;
        availablePatrol.status = 'busy';
        newIncident.status = 'assigned';

        console.log(`🚔 Asignando Alerta ${newIncident.id} a ${availablePatrol.code}`);

        // Emitir popup de despacho ("Uber Dispatch") al patrullero (Android Auto)
        io.to('patrol').emit('patrol:incoming_dispatch', {
          incident: newIncident,
          targetPatrolId: availablePatrol.id
        });

        // Notificar a la Central del estado de asignación
        io.to('central').emit('incident:updated', newIncident);
        io.to('central').emit('patrols:updated', memoryStore.patrols);
      }

      // Notificar al vecino solicitante
      socket.emit('citizen:incident_status', newIncident);
    });

    // 🚔 2. PATRULLERO: ACEPTAR O RECHAZAR ALERTA EN CONSOLA (ANDROID AUTO)
    socket.on('patrol:respond_dispatch', (data) => {
      const { incidentId, patrolId, action } = data; // action: 'accept' | 'reject'
      const incident = memoryStore.incidents.find(i => i.id === incidentId);
      const patrol = memoryStore.patrols.find(p => p.id === patrolId);

      if (!incident || !patrol) return;

      if (action === 'accept') {
        incident.status = 'assigned';
        patrol.status = 'busy';
        console.log(`✅ Patrulla ${patrol.code} ACEPTÓ la alerta ${incident.id}`);

        // Notificar a todos los canales
        io.emit('incident:updated', incident);
        io.emit('patrols:updated', memoryStore.patrols);
      } else {
        console.log(`⚠️ Patrulla ${patrol.code} DERIVÓ la alerta ${incident.id}`);
        // Re-despachar a otra unidad disponible
        patrol.status = 'online';
        incident.status = 'searching';
        incident.assignedPatrol = null;
        io.to('central').emit('incident:updated', incident);
      }
    });

    // 📍 3. PATRULLERO: STREAMING DE COORDENADAS GPS (TELEMETRÍA EN TIEMPO REAL)
    socket.on('patrol:location_update', (data) => {
      const { patrolId, coords } = data;
      const patrol = memoryStore.patrols.find(p => p.id === patrolId);
      if (patrol) {
        patrol.coords = coords;
        // Transmitir a Central y Vecino si la visibilidad está activa
        io.to('central').emit('patrols:updated', memoryStore.patrols);
        if (memoryStore.municipalSettings.patrolVisibilityToCitizen) {
          io.to('citizen').emit('patrol:live_gps', { patrolId, coords });
        }
      }
    });

    // ⚙️ 4. CENTRAL: CAMBIO DE AJUSTES MUNICIPALES EN VIVO (TOGGLES & CATEGORÍAS)
    socket.on('central:update_settings', (newSettings) => {
      memoryStore.municipalSettings = { ...memoryStore.municipalSettings, ...newSettings };
      console.log('⚙️ Ajustes Municipales actualizados en vivo');
      io.emit('settings:updated', memoryStore.municipalSettings);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });
}
