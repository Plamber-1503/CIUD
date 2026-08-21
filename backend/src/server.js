/* ==========================================================================
   OJOS EN ALERTA - SERVIDOR PRINCIPAL BACKEND REAL-TIME (PORT 5000)
   ========================================================================== */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';
import { setupDispatchSockets } from './sockets/dispatchSocket.js';
import { initDatabase } from './config/database.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir la API REST
app.use('/api', apiRoutes);

// Endpoint de Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Ojos en Alerta Real-Time Engine',
    timestamp: new Date().toISOString()
  });
});

// Inicializar sockets de despacho
setupDispatchSockets(io);

// Conectar a la base de datos y arrancar el servidor
httpServer.listen(PORT, async () => {
  await initDatabase();
  console.log(`🚀 Servidor Backend Ojos en Alerta ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Servidor de WebSockets activo y listo para conexiones de Vecinos, Patrullas y Central`);
});
