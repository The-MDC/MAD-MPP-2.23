"use client";

/**
 * MΛĐ Gambit — Auth Modal (Two-Tier Auth)
 * ------------------------------------------------------------------
 * This is the Tier 1 gateway: Social Authentication.
 * It intercepts guest users when they attempt to stake or trade.
 * 
 * PLACEHOLDER: UI is fully built out for the requested providers. 
 * Wiring to a live OAuth provider (Privy / NextAuth) goes here.
 */

import React, { useState } from "react";
import { X, Mail, MessageCircle, Phone, Command, Share2, Play } from "lucide-react";
import { useGame } from "@/context/game-context";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { setSocialAuth } = useGame();
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (provider: string) => {
    setLoading(provider);
    // Simulate OAuth delay
    setTimeout(() => {
      setSocialAuth({
        isAuthenticated: true,
        provider,
        email: `degen@${provider}.local`
      });
      setLoading(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0a0c14] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative p-6 border-b border-neutral-800/50 bg-[#05070c]">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="font-mono text-xl font-black text-white uppercase tracking-wider mb-1">
            Access Required
          </h2>
          <p className="font-mono text-xs text-neutral-400">
            Sign in to interact with markets and place stakes.
          </p>
        </div>

        {/* Providers */}
        <div className="p-6 space-y-3">
          
          <button 
            onClick={() => handleLogin("google")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-xl py-3.5 hover:bg-neutral-200 transition-all disabled:opacity-50"
          >
            {loading === "google" ? <Play className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            Continue with Google
          </button>

          <button 
            onClick={() => handleLogin("apple")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-black border border-neutral-700 text-white font-semibold rounded-xl py-3.5 hover:bg-neutral-900 transition-all disabled:opacity-50"
          >
            {loading === "apple" ? <Play className="w-5 h-5 animate-spin" /> : <Command className="w-5 h-5" />}
            Continue with Apple
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-neutral-800 flex-1"></div>
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Web3 & Social</span>
            <div className="h-px bg-neutral-800 flex-1"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleLogin("telegram")}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 bg-[#229ED9]/10 border border-[#229ED9]/30 text-[#229ED9] rounded-xl py-3 hover:bg-[#229ED9]/20 transition-all disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" /> Telegram
            </button>
            <button 
              onClick={() => handleLogin("discord")}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] rounded-xl py-3 hover:bg-[#5865F2]/20 transition-all disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" /> Discord
            </button>
            <button 
              onClick={() => handleLogin("meta")}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-xl py-3 hover:bg-[#25D366]/20 transition-all disabled:opacity-50"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </button>
            <button 
              onClick={() => handleLogin("email")}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 bg-neutral-800/50 border border-neutral-700 text-neutral-300 rounded-xl py-3 hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 text-center border-t border-neutral-900 bg-[#030408]">
          <p className="font-mono text-[9px] text-neutral-600">
            By signing in, you agree to our Terms of Service.
            <br/>Tier 2 Wallet Connect is required later for withdrawals.
          </p>
        </div>
      </div>
    </div>
  );
}
