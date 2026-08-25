"use client";

/**
 * MΛĐ Gambit — Auth Modal
 * ------------------------------------------------------------------
 * WALLET SIGN-IN IS REAL. THE SOCIAL BUTTONS ARE NOT, AND NOW SAY SO.
 *
 * Every social button used to run a 1.5-second setTimeout and then write
 * `{ isAuthenticated: true, email: "degen@<provider>.local" }` into React
 * state — an authenticated session with a fabricated email and zero
 * verification, under the words "Sign in to interact with markets and place
 * stakes." There is no OAuth backend in this repo: no provider routes, no
 * social tables, nothing to call. The buttons could not have worked.
 *
 * They are kept, because they describe the intended product, and removed
 * nothing is the rule here. What changed is that they no longer manufacture a
 * session. They are visibly marked as not yet wired, and the real path — SIWE
 * wallet sign-in, whose server half has existed all along — is now the primary
 * action rather than an afterthought labelled "required later".
 *
 * Wiring the social tier needs an OAuth provider package (NextAuth / Privy),
 * which cannot be installed from the build container while the npm registry is
 * 403. It is a founder decision plus a session with registry access, not a
 * missing call.
 */

import React, { useEffect, useState } from "react";
import { X, Mail, MessageCircle, Phone, Command, Share2, Wallet, Loader } from "lucide-react";
import { hasInjectedWallet, signInWithEthereum } from "@/lib/siwe-client";
import { SIGN_IN_CHAIN_NAME } from "@/lib/chain";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletPresent, setWalletPresent] = useState(true);

  useEffect(() => {
    if (isOpen) setWalletPresent(hasInjectedWallet());
  }, [isOpen]);

  if (!isOpen) return null;

  /** The one path that produces a session any route will honour. */
  const handleWallet = async () => {
    setLoading("wallet");
    setError(null);
    const result = await signInWithEthereum();
    setLoading(null);
    if (!result.ok) { setError(result.error); return; }
    onClose();
  };

  /**
   * Social providers have no backend. Saying so is the whole fix — a button
   * that silently does nothing reads as broken, and one that fakes a session
   * is worse than either.
   */
  const handleSocialUnavailable = (provider: string) => {
    setError(`${provider} sign-in is not wired yet — no OAuth provider is connected. Use your wallet to sign in.`);
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

          {/* The real one. */}
          <button
            onClick={handleWallet}
            disabled={!!loading || !walletPresent}
            className="w-full flex items-center justify-center gap-3 bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-semibold rounded-xl py-3.5 hover:bg-cyan-500/20 transition-all disabled:opacity-40"
          >
            {loading === "wallet" ? <Loader className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
            {walletPresent ? "Sign in with wallet" : "No browser wallet detected"}
          </button>
          <p className="font-mono text-[9px] text-neutral-500 text-center">
            Signs a message on {SIGN_IN_CHAIN_NAME}. Authorises no transaction and moves no funds.
          </p>

          {error && (
            <p className="font-mono text-[9px] text-amber-400 font-bold text-center leading-relaxed">{error}</p>
          )}

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-neutral-800 flex-1"></div>
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Not wired yet</span>
            <div className="h-px bg-neutral-800 flex-1"></div>
          </div>

          <button 
            onClick={() => handleSocialUnavailable("Google")}
            disabled={!!loading}
            title="Not wired yet — no OAuth provider is connected"
            className="w-full flex items-center justify-center gap-3 opacity-50 bg-white text-black font-semibold rounded-xl py-3.5 hover:bg-neutral-200 transition-all disabled:opacity-50"
          >
            <Share2 className="w-5 h-5" />
            Continue with Google
          </button>

          <button 
            onClick={() => handleSocialUnavailable("Apple")}
            disabled={!!loading}
            title="Not wired yet — no OAuth provider is connected"
            className="w-full flex items-center justify-center gap-3 opacity-50 bg-black border border-neutral-700 text-white font-semibold rounded-xl py-3.5 hover:bg-neutral-900 transition-all disabled:opacity-50"
          >
            <Command className="w-5 h-5" />
            Continue with Apple
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleSocialUnavailable("Telegram")}
              disabled={!!loading}
              title="Not wired yet — no OAuth provider is connected"
              className="opacity-50 flex items-center justify-center gap-2 bg-[#229ED9]/10 border border-[#229ED9]/30 text-[#229ED9] rounded-xl py-3 hover:bg-[#229ED9]/20 transition-all disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" /> Telegram
            </button>
            <button 
              onClick={() => handleSocialUnavailable("Discord")}
              disabled={!!loading}
              title="Not wired yet — no OAuth provider is connected"
              className="opacity-50 flex items-center justify-center gap-2 bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] rounded-xl py-3 hover:bg-[#5865F2]/20 transition-all disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" /> Discord
            </button>
            <button 
              onClick={() => handleSocialUnavailable("WhatsApp")}
              disabled={!!loading}
              title="Not wired yet — no OAuth provider is connected"
              className="opacity-50 flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-xl py-3 hover:bg-[#25D366]/20 transition-all disabled:opacity-50"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </button>
            <button 
              onClick={() => handleSocialUnavailable("Email")}
              disabled={!!loading}
              title="Not wired yet — no OAuth provider is connected"
              className="opacity-50 flex items-center justify-center gap-2 bg-neutral-800/50 border border-neutral-700 text-neutral-300 rounded-xl py-3 hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 text-center border-t border-neutral-900 bg-[#030408]">
          <p className="font-mono text-[9px] text-neutral-600">
            By signing in, you agree to our Terms of Service.
            <br/>Social providers are shown for the intended product; none is connected yet.
          </p>
        </div>
      </div>
    </div>
  );
}
