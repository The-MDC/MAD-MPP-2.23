package com.example.defi

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class ContractExecutionResult(
    val success: Boolean,
    val transactionHash: String?,
    val errorReason: String?
)

/**
 * Modular foundation for Web3/Blockchain interactions.
 * Abstracts WalletConnect, Ethers/Web3j operations for signing and interacting with MAD Gambit Smart Contracts.
 */
interface Web3Service {
    val isConnected: StateFlow<Boolean>
    val currentChainId: StateFlow<Int>
    val connectedAddress: StateFlow<String?>

    suspend fun connectWallet(providerType: String): Boolean
    suspend fun disconnectWallet()
    fun switchChain(chainId: Int)
    suspend fun signAndExecuteTransaction(contractAddress: String, payload: String, value: Double = 0.0): ContractExecutionResult
    suspend fun fetchOnChainBalance(address: String): Double
}

class MockWeb3Service : Web3Service {
    private val _isConnected = MutableStateFlow(false)
    override val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _currentChainId = MutableStateFlow(8453) // 8453 = Base, 42161 = Arbitrum, 1329 = SEI
    override val currentChainId: StateFlow<Int> = _currentChainId.asStateFlow()

    override fun switchChain(chainId: Int) {
        _currentChainId.value = chainId
    }

    private val _connectedAddress = MutableStateFlow<String?>(null)
    override val connectedAddress: StateFlow<String?> = _connectedAddress.asStateFlow()

    override suspend fun connectWallet(providerType: String): Boolean {
        delay(800) // Simulate WalletConnect modal delay
        _connectedAddress.value = "0xMadGambitDegen${System.currentTimeMillis().toString().takeLast(6)}"
        _isConnected.value = true
        return true
    }

    override suspend fun disconnectWallet() {
        delay(400)
        _isConnected.value = false
        _connectedAddress.value = null
    }

    override suspend fun signAndExecuteTransaction(
        contractAddress: String,
        payload: String,
        value: Double
    ): ContractExecutionResult {
        delay(1500) // Simulate network signing & block confirmation
        val success = Math.random() > 0.1 // 90% success rate mock
        return if (success) {
            ContractExecutionResult(
                success = true,
                transactionHash = "0x${java.util.UUID.randomUUID().toString().replace("-", "")}",
                errorReason = null
            )
        } else {
            ContractExecutionResult(
                success = false,
                transactionHash = null,
                errorReason = "User rejected signature or gas estimation failed"
            )
        }
    }

    override suspend fun fetchOnChainBalance(address: String): Double {
        delay(600)
        return 1500.0 + (Math.random() * 500) // Random default allocation
    }
}
