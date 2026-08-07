package com.example.model

import com.example.api.GeminiRepository
import kotlinx.coroutines.flow.Flow

/**
 * Abstract repository orchestrating flow between Local Room DB, Gemini API, and Network feeds.
 */
class GambitRepository(
    val localDao: LocalDataDao,
    private val geminiRepository: GeminiRepository
) {
    // Local DB Flows
    fun getAllUserCards(): Flow<List<UserCardEntity>> = localDao.getAllUserCards()
    fun getSagaProgress(): Flow<List<SagaProgressEntity>> = localDao.getSagaProgress()
    fun getEvolutionHistory(): Flow<List<CardEvolutionHistoryEntity>> = localDao.getEvolutionHistory()

    suspend fun insertUserCards(cards: List<UserCardEntity>) = localDao.insertUserCards(cards)
    suspend fun insertSagaProgress(progress: List<SagaProgressEntity>) = localDao.insertSagaProgress(progress)
    suspend fun insertEvolutionHistory(history: CardEvolutionHistoryEntity) = localDao.insertHistory(history)

    // Gemini API Wrappers
    suspend fun fetchSatiricalHeadlines(): List<String> {
        return geminiRepository.fetchSatiricalHeadlines()
    }

    suspend fun getPersonaCommentary(persona: String, market: String, conviction: String, vol: String): String {
        return geminiRepository.generateCommentaryWithPersona(persona, market, conviction, vol)
    }
}
