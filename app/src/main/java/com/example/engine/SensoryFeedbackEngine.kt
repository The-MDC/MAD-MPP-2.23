package com.example.engine

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Foundational engine for Neuroscience / Dopamine UX.
 * Handles audio cues and haptic feedback safely without crashing if permissions or hardware are missing.
 */
class SensoryFeedbackEngine(private val context: Context) {
    private var toneGenerator: ToneGenerator? = null
    private var vibrator: Vibrator? = null

    init {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 100)
            
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
        } catch (e: Exception) {
            // Safe fallback if hardware is unsupported
        }
    }

    fun playPositiveFeedback() {
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_PROP_ACK, 70)
            triggerHaptic(VibrationEffect.EFFECT_TICK)
        } catch (e: Exception) {}
    }

    fun playVictoryFeedback() {
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_CDMA_CONFIRM, 150)
            triggerHaptic(VibrationEffect.EFFECT_CLICK)
        } catch (e: Exception) {}
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
