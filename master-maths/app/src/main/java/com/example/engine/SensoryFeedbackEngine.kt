package com.example.engine

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

/**
 * Foundational engine for Neuroscience / Dopamine UX.
 * Handles audio cues and haptic feedback safely without crashing if permissions or hardware are missing.
 */
@OptIn(DelicateCoroutinesApi::class)
class SensoryFeedbackEngine(private val context: Context) {
    private val attributionContext: Context = context

    private var toneGenerator: ToneGenerator? = null
    private val vibrator: Vibrator? by lazy {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = attributionContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                attributionContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
        } catch (e: Exception) {
            null
        }
    }

    init {
        try {
            // Instantiate with lower volume (35) for subtle, ethereal feedback using STREAM_MUSIC 
            // to avoid AppOps audit logs triggered by notification-level streams.
            toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 35)
        } catch (e: Exception) {
            // Safe fallback if hardware is unsupported
        }
    }

    fun playPositiveFeedback() {
        kotlinx.coroutines.GlobalScope.launch {
            try {
                // High frequency magical arpeggio simulating a metallic chime
                toneGenerator?.startTone(ToneGenerator.TONE_CDMA_KEYPAD_VOLUME_KEY_LITE, 40)
                kotlinx.coroutines.delay(50)
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 60)
                triggerHaptic(VibrationEffect.EFFECT_TICK)
            } catch (e: Exception) {}
        }
    }

    fun playVictoryFeedback() {
        kotlinx.coroutines.GlobalScope.launch {
            try {
                // Triumphant metallic spread
                toneGenerator?.startTone(ToneGenerator.TONE_SUP_PIP, 50)
                kotlinx.coroutines.delay(60)
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_ACK, 80)
                kotlinx.coroutines.delay(80)
                toneGenerator?.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 200)
                triggerHaptic(VibrationEffect.EFFECT_CLICK)
            } catch (e: Exception) {}
        }
    }

    fun playErrorFeedback() {
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_CDMA_SOFT_ERROR_LITE, 200)
            triggerHaptic(VibrationEffect.EFFECT_DOUBLE_CLICK)
        } catch (e: Exception) {}
    }

    fun playNeutralTick() {
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 40)
            // Lighter haptic for scrolling/neutral actions if needed
        } catch (e: Exception) {}
    }

    fun playLiquidationAlert() {
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_CDMA_HIGH_PBX_SLS, 300)
            triggerHaptic(VibrationEffect.EFFECT_HEAVY_CLICK)
        } catch (e: Exception) {}
    }

    var hapticsEnabled: Boolean = false

    private fun triggerHaptic(effectId: Int) {
        if (!hapticsEnabled) return
        try {
            if (vibrator?.hasVibrator() == true) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    vibrator?.vibrate(VibrationEffect.createPredefined(effectId))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(50L)
                }
            }
        } catch (e: Exception) {
            // Ignore permission or hardware issues
        }
    }

    fun release() {
        try {
            toneGenerator?.release()
        } catch (e: Exception) {}
    }
}
