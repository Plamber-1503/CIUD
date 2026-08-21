package com.ojosenalerta.services

import android.content.Intent
import androidx.car.app.CarAppService
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.validation.HostValidator
import com.ojosenalerta.screens.DispatchAlertScreen

/**
 * SERVICIO NATIVO ANDROID AUTO PARA MÓVILES POLICIALES
 * Conecta el teléfono Android del patrullero con la pantalla de la consola del auto.
 */
class PatrolCarAppService : CarAppService() {

    override fun createHostValidator(): HostValidator {
        // Permitir conexiones de consolas Android Auto verificadas de fábrica
        return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR
    }

    override fun onCreateSession(): Session {
        return object : Session() {
            override fun onCreateScreen(intent: Intent): Screen {
                // Iniciar con la pantalla de despacho de alertas para la consola del patrullero
                return DispatchAlertScreen(carContext)
            }
        }
    }
}
