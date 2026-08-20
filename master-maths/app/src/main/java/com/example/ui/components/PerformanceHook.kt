package com.example.ui.components

import android.os.Debug
import android.util.Log
import androidx.compose.runtime.*
import kotlin.system.measureTimeMillis

/**
 * A hook to measure recomposition times of a Composable function.
 * 
 * Usage:
 * val isMeasured = remember { measureComposition("ComponentName") }
 * 
 * Also logs free memory at the time of rendering to ensure we don't leak over time 
 * on lower-end devices.
 */
@Composable
fun TrackComponentPerformance(componentName: String) {
    val runtime = Runtime.getRuntime()
    
    DisposableEffect(componentName) {
        val startTime = System.nanoTime()
        val mb = 1024 * 1024
        
        onDispose {
            val endTime = System.nanoTime()
            val durationMs = (endTime - startTime) / 1_000_000.0
            
            val usedMemory = (runtime.totalMemory() - runtime.freeMemory()) / mb
            val maxMemory = runtime.maxMemory() / mb
            
            Log.d(
                "PerfHook", 
                "[$componentName] Render lifecycle complete: ${String.format("%.2f", durationMs)}ms | Memory: ${usedMemory}MB / ${maxMemory}MB"
            )
        }
    }
}
