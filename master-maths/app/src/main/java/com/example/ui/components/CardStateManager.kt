package com.example.ui.components

import androidx.compose.runtime.*
import com.example.model.SatiricalCard
import com.example.viewmodel.GambitViewModel

/**
 * CardStateManagerState models standard attributes for MADHATs Gambit NFT cards in single components.
 * It tracks local attributes including:
 *   - EvolutionLevel (1: Standard, 2: Elite, 3: Supreme)
 *   - DeteriorationPercent (calculated from card durability as (1.0 - durability) * 100)
 *   - BurnStatus (boolean indicating if the card has been incinerated/deleted)
 * All states are reactively updated from the database and persist across session restarts.
 */
class CardStateManagerState(
    val cardId: Int,
    private val vm: GambitViewModel,
    cardProvider: () -> SatiricalCard?,
    allCardsProvider: () -> List<SatiricalCard>
) {
    private val card by derivedStateOf { cardProvider() }
    private val allCards by derivedStateOf { allCardsProvider() }

    val evolutionLevel: Int
        get() = card?.evolutionStage ?: 1

    val deteriorationPercent: Double
        get() = ((1.0 - (card?.durability ?: 1.0)) * 100).coerceAtLeast(0.0)

    val burnStatus: Boolean
        get() = card == null && allCards.isNotEmpty() && !allCards.any { it.id == cardId }

    val dynamicName: String
        get() = card?.name ?: "BURNED CARD #$cardId"

    val dynamicPower: Int
        get() = card?.powerLevel ?: 0

    val dynamicEarns: Double
        get() = card?.earnsCount ?: 0.0

    val isEquipped: Boolean
        get() = card?.durability ?: 0.0 > 0.0 && !burnStatus

    fun evolve() {
        vm.evolveCardState(cardId)
    }

    fun inflictDamage(amount: Double) {
        vm.damageCardState(cardId, amount)
    }

    fun repair() {
        vm.repairCardState(cardId)
    }

    fun burn() {
        vm.burnCardState(cardId)
    }
}

/**
 * Jetpack Compose state hook equivalent to track state of singular NFT attributes locally
 * and keep them synchronized in Room persistent database storage across app sessions.
 */
@Composable
fun rememberCardStateManager(cardId: Int, vm: GambitViewModel): CardStateManagerState {
    val state by vm.state.collectAsState()
    return remember(cardId, state) {
        CardStateManagerState(
            cardId = cardId,
            vm = vm,
            cardProvider = { state.ownedCards.find { it.id == cardId } },
            allCardsProvider = { state.ownedCards }
        )
    }
}
