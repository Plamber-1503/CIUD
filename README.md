# 🚨 Ojos en Alerta - Sistema de Seguridad Urbana

**Plataforma de Alerta Temprana, Despacho Inmediato y Monitoreo Municipal en Tiempo Real.**

---

## 📌 Visión General
**Ojos en Alerta** es una solución integral diseñada para municipios de **+1.000.000 de habitantes**, conectando a vecinos, patrulleros y la central de monitoreo mediante alertas geolocalizadas de ultra baja latencia.

---

## 📱 Componentes del Sistema

1. **👤 App Vecino (iOS / Android):**
   - Autenticación unificada con **CiDi Nivel 2 (Gobierno de Córdoba)** y **ANSES / Mi Argentina**.
   - Botón de Pánico de 3 segundos con confirmación háptica.
   - Categorías de emergencia dinámicas y reportes multimedia (foto, audio, video).
   - Tracker en tiempo real con opción de visibilidad configurable por el municipio.

2. **🚔 App Patrullero + Módulo Nativo Android Auto (`androidx.car.app`):**
   - Integración nativa con la consola táctil del vehículo policial.
   - Banner emergente de despacho ("Uber Dispatch") con botón gigante `[ ACEPTAR MÓVIL ]`.
   - Alertas por voz hands-free (*Text-to-Speech*) y navegación GPS turno a turno hacia la víctima.

3. **🖥️ Central de Monitoreo (Dashboard Web):**
   - Mapa espacial interactivo con algoritmo de despacho automático por proximidad.
   - Ajustes municipales en vivo: switch de visibilidad de patrullas y administración de categorías.

---

## 🛠️ Tecnologías
- **Frontend Prototipo:** HTML5, CSS3 (Sistema de diseño institucional), JavaScript ES6 Modules, Leaflet.js.
- **Producción:** React Native / Flutter, Android Jetpack Car App Library, Node.js / Go, PostgreSQL + PostGIS, Redis Pub/Sub, WebSockets.

---

## 🚀 Inicio Rápido Local
```bash
# Servir en puerto local 8080
npx serve . -p 8080
```
Acceder a [http://localhost:8080](http://localhost:8080) en el navegador.
