package com.example.diagnostics

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ErrorCategory {
    NUMERIC,
    ARRAY_STRING,
    GRAPH_TREE,
    BOUNDARY_CONSTRAINT,
    CRITICAL,
    HIGH_RISK,
    WARNING,
    NOTICE,
    SYSTEM_ANOMALY
}

enum class SystemHealth {
    OPTIMAL, // Blue
    NORMAL,  // Green
    UNSTABLE, // Yellow
    CRITICAL  // Red
}

data class SystemErrorLog(
    val timestamp: Long = System.currentTimeMillis(),
    val id: String = java.util.UUID.randomUUID().toString().take(8),
    val category: ErrorCategory,
    val message: String,
    val stackTraceSnippet: String,
    val component: String
)

object ErrorDiagnosticsModule {
    private val _logs = MutableStateFlow<List<SystemErrorLog>>(emptyList())
    val logs: StateFlow<List<SystemErrorLog>> = _logs.asStateFlow()

    private val _systemHealth = MutableStateFlow(SystemHealth.OPTIMAL)
    val systemHealth = _systemHealth.asStateFlow()

    private val _edgeCaseFrequencies = MutableStateFlow(
        ErrorCategory.values().associateWith { 0 }
    )
    val edgeCaseFrequencies = _edgeCaseFrequencies.asStateFlow()

    // Real-time Latency (Mock generator could update this)
    private val _currentLatencyMs = MutableStateFlow(42L)
    val currentLatencyMs = _currentLatencyMs.asStateFlow()

    // Real-time Throughput (Requests/sec)
    private val _systemThroughput = MutableStateFlow(
        listOf(120f, 135f, 110f, 145f, 160f, 130f, 180f, 210f, 190f, 220f)
    )
    val systemThroughput = _systemThroughput.asStateFlow()

    fun logException(ex: Throwable, component: String) {
        val category = categorizeException(ex)
        val snippet = ex.stackTraceToString().lines().take(3).joinToString("\n")
        val log = SystemErrorLog(
            category = category,
            message = ex.message ?: "Unknown exception",
            stackTraceSnippet = snippet,
            component = component
        )
        
        // Add to logs (keep last 50)
        val currentList = _logs.value.toMutableList()
        currentList.add(0, log)
        if (currentList.size > 50) currentList.removeAt(currentList.lastIndex)
        _logs.value = currentList

        // Update frequencies
        val newFreq = _edgeCaseFrequencies.value.toMutableMap()
        newFreq[category] = (newFreq[category] ?: 0) + 1
        _edgeCaseFrequencies.value = newFreq
        
        updateHealthStatus()
    }
    
    fun setHealthStatus(health: SystemHealth) {
        _systemHealth.value = health
    }

    private fun updateHealthStatus() {
        val critCount = _logs.value.count { it.category == ErrorCategory.CRITICAL || it.category == ErrorCategory.SYSTEM_ANOMALY }
        _systemHealth.value = when {
            critCount > 5 -> SystemHealth.CRITICAL
            critCount > 0 -> SystemHealth.UNSTABLE
            _logs.value.isNotEmpty() -> SystemHealth.NORMAL
            else -> SystemHealth.OPTIMAL
        }
    }

    private fun categorizeException(ex: Throwable): ErrorCategory {
        val msg = ex.message?.lowercase() ?: ""
        return when {
            ex is ArithmeticException || msg.contains("divide by zero") || msg.contains("overflow") -> ErrorCategory.NUMERIC
            ex is IndexOutOfBoundsException && msg.contains("index") -> ErrorCategory.ARRAY_STRING
            msg.contains("cycle") || msg.contains("node") || msg.contains("tree") -> ErrorCategory.GRAPH_TREE
            msg.contains("boundary") || msg.contains("constraint") || msg.contains("out of bounds") -> ErrorCategory.BOUNDARY_CONSTRAINT
            ex is SecurityException || msg.contains("tamper") || msg.contains("anomaly") -> ErrorCategory.SYSTEM_ANOMALY
            ex is NullPointerException -> ErrorCategory.HIGH_RISK
            else -> ErrorCategory.WARNING
        }
    }
    
    // Seed some initial demo data for visualization
    init {
        logException(ArithmeticException("Integer overflow during token pricing"), "PricingEngine")
        logException(IndexOutOfBoundsException("Index 0 out of bounds for string length 0"), "DataWarehouse")
        logException(IllegalArgumentException("Invalid routing constraint for CDP"), "CDP_Router")
        logException(SecurityException("Unrecognized DDOS anomaly in contract logic"), "SmartContractDefender")
        logException(NullPointerException("Missing OAuth token in headers"), "AuthGuard")
        logException(Exception("Tree node cyclic reference detected in sybil network graph"), "SybilDefense")
    }

    fun formatTime(timestamp: Long): String {
        return java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date(timestamp))
    }
}
