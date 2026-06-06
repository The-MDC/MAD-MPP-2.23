package com.example.model

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "user_cards")
data class UserCardEntity(
    @PrimaryKey val id: Int,
    val name: String,
    val rarityName: String,
    val powerLevel: Int,
    val faction: String,
    val flavorText: String,
    val cloutMultiplier: Double,
    val edgeMultiplier: Double,
    val apyBoost: Double,
    val durability: Double,
    val evolutionStage: Int,
    val earnsCount: Double
) {
    fun toSatiricalCard(): SatiricalCard {
        val rarity = try {
            CardRarity.valueOf(rarityName.uppercase())
        } catch (e: Exception) {
            CardRarity.COMMON
        }
        return SatiricalCard(
            id = id,
            name = name,
            rarity = rarity,
            powerLevel = powerLevel,
            faction = faction,
            flavorText = flavorText,
            cloutMultiplier = cloutMultiplier,
            edgeMultiplier = edgeMultiplier,
            apyBoost = apyBoost,
            durability = durability,
            evolutionStage = evolutionStage,
            earnsCount = earnsCount
        )
    }

    companion object {
        fun fromSatiricalCard(card: SatiricalCard): UserCardEntity {
            return UserCardEntity(
                id = card.id,
                name = card.name,
                rarityName = card.rarity.name,
                powerLevel = card.powerLevel,
                faction = card.faction,
                flavorText = card.flavorText,
                cloutMultiplier = card.cloutMultiplier,
                edgeMultiplier = card.edgeMultiplier,
                apyBoost = card.apyBoost,
                durability = card.durability,
                evolutionStage = card.evolutionStage,
                earnsCount = card.earnsCount
            )
        }
    }
}

@Entity(tableName = "saga_progress")
data class SagaProgressEntity(
    @PrimaryKey val chapterId: Int,
    val title: String,
    val isCompleted: Boolean,
    val completionPercentage: Float,
    val totalQuests: Int,
    val scoreBoost: Float
)

@Entity(tableName = "evolution_history")
data class CardEvolutionHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val timestamp: Long,
    val cardId: Int,
    val cardName: String,
    val previousStage: Int,
    val nextStage: Int,
    val type: String, // "EVOLVE", "DAMAGE", "REPAIR", "BURN", "PVP"
    val details: String
)

@Dao
interface LocalDataDao {
    @Query("SELECT * FROM user_cards")
    fun getAllUserCards(): Flow<List<UserCardEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserCards(cards: List<UserCardEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserCard(card: UserCardEntity)

    @Query("DELETE FROM user_cards WHERE id = :id")
    suspend fun deleteUserCard(id: Int)

    @Query("SELECT * FROM saga_progress")
    fun getSagaProgress(): Flow<List<SagaProgressEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSagaProgress(progress: List<SagaProgressEntity>)

    @Query("SELECT * FROM evolution_history ORDER BY timestamp DESC")
    fun getEvolutionHistory(): Flow<List<CardEvolutionHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHistory(history: CardEvolutionHistoryEntity)
}

@Database(
    entities = [UserCardEntity::class, SagaProgressEntity::class, CardEvolutionHistoryEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun localDataDao(): LocalDataDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: android.content.Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = androidx.room.Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "gambit_local_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
