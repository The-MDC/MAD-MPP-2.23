package com.example.auth

import com.example.model.AuthState
import kotlinx.coroutines.flow.StateFlow

/**
 * Interface definition for Authentication operations in the MAD Gambit dApp.
 */
interface AuthManager {
    val authState: StateFlow<AuthState>

    suspend fun loginWithZeroAuth()
    suspend fun loginWithMeta()
    suspend fun loginWithGoogle()
    suspend fun loginWithApple()
    suspend fun loginWithDiscord()
    suspend fun loginWithTelegram()
    suspend fun loginWithX()
    suspend fun connectWallet(address: String)
    suspend fun logout()
}
