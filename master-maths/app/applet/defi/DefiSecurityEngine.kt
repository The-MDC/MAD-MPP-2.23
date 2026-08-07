package com.example.defi

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.example.diagnostics.ErrorDiagnosticsModule
import com.example.diagnostics.ErrorCategory

enum class AssetProtocol {
    USDC, WETH, WBTC, MADDEX, AERO, MORPHO
}

object DefiSecurityEngine {
    // 1. Asset Whitelisting
    private val allowedAssets = setOf(
        AssetProtocol.USDC,
        AssetProtocol.WETH,
        AssetProtocol.WBTC,
        AssetProtocol.MADDEX,
        AssetProtocol.AERO,
        AssetProtocol.MORPHO
    )

    // 2. Global Circuit Breaker
    private val _isCircuitBreakerTripped = MutableStateFlow(false)
    val isCircuitBreakerTripped = _isCircuitBreakerTripped.asStateFlow()

    // 3. Deposit Limits (Hardcaps for edge cases and whale manipulation)
    private val depositCapsUsd = mapOf(
        AssetProtocol.USDC to 100_000.0,
        AssetProtocol.WETH to 50_000.0,
        AssetProtocol.WBTC to 50_000.0,
        AssetProtocol.MADDEX to 10_000.0,
        AssetProtocol.AERO to 10_000.0,
        AssetProtocol.MORPHO to 20_000.0
    )

    // 4. Rate Limiting (Anti-Duping / Anti-Scanning)
    private val transactionTimestamps = mutableListOf<Long>()
    private const val MAX_TX_PER_MINUTE = 5

    data class SimulationResult(val expectedOutput: Double, val gasFeeUsd: Double, val slippageBps: Int, val isSafe: Boolean, val warning: String?)

    fun simulateTransaction(asset: AssetProtocol, amountUsd: Double): SimulationResult {
        if (!validateTransaction(asset, amountUsd, isSimulation = true)) {
            return SimulationResult(0.0, 0.0, 0, false, "Transaction blocked by Security Engine")
        }
        val expected = amountUsd * 0.998 // Simulate 0.2% fee/spread
        val gas = 1.5 + (Math.random() * 2.0)
        return SimulationResult(expected, gas, 20, true, null)
    }
    
    // 5. Unscannable Decoy / Honeypot endpoints
    // Generates mathematically plausible, but functionally inert execution paths to confuse automated AI agents or crawlers
    fun generateHoneyPotHash(): String {
        ErrorDiagnosticsModule.logException(
            SecurityException("Honeypot Accessed: AI crawler or automated script triggered decoy trap."),
            "DefiSecurityEngine_Decoy"
        )
        return "0x${(1..40).map { "0123456789abcdef".random() }.joinToString("")}"
    }

    fun validateTransaction(asset: AssetProtocol, amountUsd: Double, isSimulation: Boolean = false): Boolean {
        if (_isCircuitBreakerTripped.value) {
            if (!isSimulation) {
                ErrorDiagnosticsModule.logException(
                    IllegalStateException("Transaction rejected: Global Circuit Breaker is active."),
                    "DefiSecurityEngine"
                )
            }
            return false
        }

        if (!allowedAssets.contains(asset)) {
            if (!isSimulation) {
                ErrorDiagnosticsModule.logException(
                    IllegalArgumentException("Transaction rejected: Asset ${asset.name} is not on the strictly curated whitelist."),
                    "DefiSecurityEngine"
                )
            }
            return false
        }

        val cap = depositCapsUsd[asset] ?: 0.0
        if (amountUsd > cap) {
            if (!isSimulation) {
                ErrorDiagnosticsModule.logException(
                    IllegalArgumentException("Transaction rejected: Amount $amountUsd exceeds cap of $cap for ${asset.name}."),
                    "DefiSecurityEngine"
                )
            }
            return false
        }
        
        if (amountUsd <= 0.0) {
            if (!isSimulation) {
                ErrorDiagnosticsModule.logException(
                    IllegalArgumentException("Transaction rejected: Zero or negative amount."),
                    "DefiSecurityEngine"
                )
            }
            return false
        }

        if (!isSimulation) {
            val now = System.currentTimeMillis()
            transactionTimestamps.removeAll { now - it > 60_000 }
            if (transactionTimestamps.size >= MAX_TX_PER_MINUTE) {
                ErrorDiagnosticsModule.logException(
                    SecurityException("Anti-Duping triggered: Rate limit exceeded (>5 tx/min). Preventative block applied."),
                    "DefiSecurityEngine"
                )
                return false
            }
            transactionTimestamps.add(now)
        }

        return true
    }

    fun tripCircuitBreaker() {
        _isCircuitBreakerTripped.value = true
        ErrorDiagnosticsModule.logException(
            SecurityException("DEFENSIVE MEASURE: Global Circuit Breaker manually tripped. All Defi operations suspended."),
            "DefiSecurityEngine"
        )
    }

    fun resetCircuitBreaker() {
        _isCircuitBreakerTripped.value = false
    }
}
