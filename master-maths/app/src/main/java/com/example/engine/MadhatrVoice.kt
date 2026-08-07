package com.example.engine

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

object MadhatrVoice : TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = null
    private var isInitialized = false

    fun init(context: Context) {
        if (tts == null) {
            val appCtx = context.applicationContext
            tts = TextToSpeech(appCtx, this)
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale.US)
            if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                isInitialized = true
                tts?.setPitch(0.8f) // Deeper/husky
                tts?.setSpeechRate(1.05f) // Energetic
                
                // On real devices, might try to find a specific Jersey voice, but this approximates a slightly huskier tone.
            }
        }
    }

    fun speak(text: String) {
        if (isInitialized) {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "MADHATR_VOICE")
        }
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        isInitialized = false
    }
}
