package com.example

import android.content.Context
import com.example.auth.AuthManager
import com.example.auth.MockAuthManager
import com.example.defi.MockWeb3Service
import com.example.defi.Web3Service
import com.example.engine.SensoryFeedbackEngine

/**
 * AppContainer acts as a simple manual Dependency Injection container.
 * This ensures loose coupling and makes testing/mocking easier without the overhead of Hilt/Dagger.
 */
interface AppContainer {
    val authManager: AuthManager
    val web3Service: Web3Service
    val sensoryFeedbackEngine: SensoryFeedbackEngine
    val gambitRepository: com.example.model.GambitRepository
}

class DefaultAppContainer(private val applicationContext: Context) : AppContainer {
    
    // Core Dependencies instantiated lazily
    override val authManager: AuthManager by lazy {
        MockAuthManager() // Replace with LiveAuthManager when Smart Contracts are deployed
    }

    override val web3Service: Web3Service by lazy {
        MockWeb3Service()
    }

    override val sensoryFeedbackEngine: SensoryFeedbackEngine by lazy {
        SensoryFeedbackEngine(applicationContext)
    }

    override val gambitRepository: com.example.model.GambitRepository by lazy {
        val database = com.example.model.AppDatabase.getDatabase(applicationContext)
        val geminiRepository = com.example.api.GeminiRepository()
        com.example.model.GambitRepository(database.localDataDao(), geminiRepository)
    }
}
