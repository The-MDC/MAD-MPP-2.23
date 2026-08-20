package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.navigation.GambitNavigation
import com.example.ui.theme.MyApplicationTheme
import com.example.viewmodel.GambitViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // com.example.engine.MadhatrVoice.init(this)
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, exception ->
            com.example.diagnostics.ErrorDiagnosticsModule.logException(exception, "GlobalUncaughtExceptionHandler")
            defaultHandler?.uncaughtException(thread, exception)
        }

        enableEdgeToEdge()
        val appContainer = (application as MADGambitApplication).container
        setContent {
            val vm: GambitViewModel = viewModel(
                factory = GambitViewModel.provideFactory(appContainer)
            )
            val state by vm.state.collectAsState()
            val isNeonMode = state.currentTheme == com.example.ui.theme.ThemeStyle.SHABBY_CHIC_RETRO

            com.example.ui.theme.MadGambitTheme(isNeonMode = isNeonMode) {
                com.example.ui.theme.ProvideGambitTheme(
                    themeStyle = state.currentTheme
                ) {
                    GambitNavigation(vm, appContainer.authManager)
                }
            }
        }
    }
}
