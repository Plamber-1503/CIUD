package com.ojosenalerta.screens

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.*
import androidx.car.app.navigation.model.NavigationTemplate

/**
 * PANTALLA DE NAVEGACIÓN GPS TURNO A TURNO EN PANTALLA DE AUTO (ANDROID AUTO)
 */
class NavigationMapScreen(carContext: CarContext) : Screen(carContext) {

    override fun onGetTemplate(): Template {
        return NavigationTemplate.Builder()
            .setNavigationInfo(
                RoutingInfo.Builder()
                    .setCurrentStep(
                        Step.Builder("Girar a la derecha en Av. Colón")
                            .setManeuver(Maneuver.Builder(Maneuver.TYPE_TURN_RIGHT).build())
                            .build(),
                        Distance.create(350.0, Distance.UNIT_METERS)
                    )
                    .setNextStep(Step.Builder("Arribo al destino de la víctima").build())
                    .build()
            )
            .setActionStrip(
                ActionStrip.Builder()
                    .addAction(
                        Action.Builder()
                            .setTitle("LLEGADA A ESCENA")
                            .setOnClickListener {
                                screenManager.pop()
                            }
                            .build()
                    )
                    .build()
            )
            .build()
    }
}
