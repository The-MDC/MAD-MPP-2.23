package com.example.auth

import com.example.model.AuthState
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class MockAuthManager : AuthManager {
    private val _authState = MutableStateFlow(AuthState())
    override val authState: StateFlow<AuthState> = _authState.asStateFlow()

    override suspend fun loginWithZeroAuth() {
        delay(1200)
        _authState.value = _authState.value.copy(
            isAuthenticated = false,
            username = "0-Auth Node",
            email = "node@0-auth.net"
        )
    }

    override suspend fun loginWithMeta() { simulateLogin("Meta User") }
    override suspend fun loginWithGoogle() { simulateLogin("Google User") }
    override suspend fun loginWithApple() { simulateLogin("Apple User") }
    override suspend fun loginWithDiscord() { simulateLogin("Discord Degen") }
    override suspend fun loginWithTelegram() { simulateLogin("TG Whale") }
    override suspend fun loginWithX() { simulateLogin("X Poster") }
    
    override suspend fun connectWallet(address: String) {
        delay(800)
        _authState.value = _authState.value.copy(
            isAuthenticated = true,
            walletAddress = address
        )
    }

    override suspend fun logout() {
        delay(500)
        _authState.value = AuthState()
    }

    private suspend fun simulateLogin(username: String) {
        delay(1200) // Simulate network delay
        _authState.value = _authState.value.copy(
            isAuthenticated = false, // Still need wallet for full app gating
            username = username,
            email = "${username.replace(" ", "").lowercase()}@madgambit.test"
        )
    }
}
