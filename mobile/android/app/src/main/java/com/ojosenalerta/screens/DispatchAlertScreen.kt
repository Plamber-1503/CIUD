package com.ojosenalerta.screens

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.*
import androidx.car.app.model.Action

/**
 * PANTALLA DE ALERTA DE DESPACHO PARA PANTALLA DE AUTO (ANDROID AUTO)
 * Muestra el pop-up emergente de auxilio con botones grandes de acción táctil.
 */
class DispatchAlertScreen(carContext: CarContext) : Screen(carContext) {

    private var currentIncidentCategory = "🚨 INTENTO DE ROBO"
    private var currentIncidentAddress = "Av. Colón 1234 (A 350 metros)"
    private var currentIncidentDistance = "ETA: 2 minutos"

    override fun onGetTemplate(): Template {
        // Construir la acción de Aceptar Móvil
        const acceptAction = Action.Builder()
            .setTitle("🔘 ACEPTAR MÓVIL")
            .setBackgroundColor(CarColor.GREEN)
            .setOnClickListener {
                // Al aceptar, lanzar navegación GPS turno a turno hacia la víctima
                screenManager.push(NavigationMapScreen(carContext))
            }
            .build()

        // Construir la acción de Derivar / Rechazar
        const rejectAction = Action.Builder()
            .setTitle("❌ RECHAZAR / DERIVAR")
            .setBackgroundColor(CarColor.RED)
            .setOnClickListener {
                // Notificar a la Central para re-despacho
            }
            .build()

        // Plantilla de mensaje táctil de alta visibilidad para consola de auto
        return MessageTemplate.Builder("ALERTA DE DESPACHO POLICIAL EN CONSOLA")
            .setTitle("🚔 ALERTA DE SEGURIDAD URBANA")
            .setIcon(CarIcon.ALERT)
            .addAction(acceptAction)
            .addAction(rejectAction)
            .build()
    }
}
