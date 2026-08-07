package com.example.viewmodel

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Rule
import org.junit.Before
import org.junit.After
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import com.example.model.MarketType
import com.example.DefaultAppContainer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.ExperimentalCoroutinesApi

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class GambitViewModelTest {
    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createViewModel(): GambitViewModel {
        val context = ApplicationProvider.getApplicationContext<Context>()
        return GambitViewModel(DefaultAppContainer(context))
    }

    @Test
    fun testChatChannelSwitching() {
        val viewModel = createViewModel()
        
        assertEquals("MADHATR", viewModel.state.value.activeChatChannel)
        
        viewModel.setChatChannel("GLOBAL")
        assertEquals("GLOBAL", viewModel.state.value.activeChatChannel)
        
        viewModel.setChatChannel("CONVICTIONS")
        assertEquals("CONVICTIONS", viewModel.state.value.activeChatChannel)
    }

    @Test
    fun testMarketConvictionLogic() = runTest(testDispatcher) {
        val viewModel = createViewModel()
        
        val initialMarket = viewModel.state.value.activeScenarios.first()
        val initialSpeed = initialMarket.crowdConvictionSpeed
        
        // Vote Yes
        viewModel.placeInteractivePrediction(initialMarket.id, "YES", 100.0, 0.8f)
        
        advanceUntilIdle() // Wait for Web3 delay
        
        val updatedMarket = viewModel.state.value.activeScenarios.first { it.id == initialMarket.id }
        assertTrue("Speed should increase", updatedMarket.crowdConvictionSpeed > initialSpeed)
    }
}
