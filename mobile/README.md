# 📱 Módulo Móvil Nativo y Android Auto - Ojos en Alerta

## 📌 Visión General
Este módulo contiene la arquitectura de las **Aplicaciones Móviles Nativas** para:
1. **👤 App Vecino (Android / iOS):** Botón de auxilio 3s, autenticación CiDi Nivel 2 / ANSES, reportes multimediales y tracker de patrulla con visibilidad configurable.
2. **🚔 App Patrullero + Módulo Nativo Android Auto (`androidx.car.app`):** Conexión dual entre el smartphone del oficial y la consola táctil del vehículo de seguridad urbana.

---

## 🛠️ Estructura del Módulo Nativo Android Auto
- **`PatrolCarAppService.kt`:** Servicio `CarAppService` oficial declarado en el `AndroidManifest.xml` con categoría `NAVIGATION`.
- **`DispatchAlertScreen.kt`:** Pantalla emergente táctil de alta visibilidad para el tablero del auto con botones gigantes `[ ACEPTAR MÓVIL ]` y `[ RECHAZAR / DERIVAR ]`.
- **`NavigationMapScreen.kt`:** Pantalla de navegación GPS turno a turno hacia la ubicación del auxilio del vecino.

---

## 🚀 Despliegue en Flota Policial
1. Compilar APK/AAB nativo:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
2. Distribuir mediante MDM de flota municipal o Google Play Console en canal privado.
3. Al conectar el smartphone del patrullero por USB o Wireless Android Auto a la consola del auto, el sistema activa automáticamente la interfaz nativa de tablero.
