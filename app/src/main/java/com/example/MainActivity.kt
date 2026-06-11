package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.navigation.GambitNavigation
import com.example.ui.theme.MyApplicationTheme
import com.example.viewmodel.GambitViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        com.example.engine.MadhatrVoice.init(this)
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, exception ->
            com.example.diagnostics.ErrorDiagnosticsModule.logException(exception, "GlobalUncaughtExceptionHandler")
            defaultHandler?.uncaughtException(thread, exception)
        }

        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                val vm: GambitViewModel = viewModel()
                GambitNavigation(vm)
            }
        }
    }
}
