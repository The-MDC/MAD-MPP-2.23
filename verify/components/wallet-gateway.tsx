"use client";

/**
 * MΛĐ Gambit — Wallet Gateway (Tier 2 Auth)
 * ------------------------------------------------------------------
 * Intercepts the view if the user is socially logged in but hasn't
 * connected a Web3 wallet yet. Used to hide financial balances and
 * withdrawal screens.
 */

import React, { useState } from "react";
import { useGame } from "@/context/game-context";
import { Wallet, ShieldAlert, Loader } from "lucide-react";

export default function WalletGateway({ children }: { children: React.ReactNode }) {
  const { socialAuth, walletAuth, setWalletAuth } = useGame();
  const [connecting, setConnecting] = useState(false);

  // If they aren't even socially logged in, let the AuthModal handle it,
  // but blur the content anyway.
  const isGuest = !socialAuth.isAuthenticated;
  const isLocked = !walletAuth.isConnected;

  const handleConnect = () => {
    setConnecting(true);
    // Simulate wallet connection (e.g., WalletConnect, Metamask)
    setTimeout(() => {
      setWalletAuth({
        isConnected: true,
        address: "0xMAD...8888"
      });
      setConnecting(false);
    }, 1500);
  };

  if (isLocked) {
    return (
      <div className="relative w-full h-full min-h-[300px] flex items-center justify-center rounded-2xl overflow-hidden bg-neutral-950/50">
        
        {/* Blurred background preview of the children */}
        <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none select-none">
          {children}
        </div>
        
        {/* Gateway Overlay */}
        <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-800/50 flex items-center justify-center mb-4 text-cyan-400">
            {isGuest ? <ShieldAlert className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
          </div>
          
          <h3 className="font-mono text-sm uppercase tracking-widest font-black text-white mb-2">
            Vault Locked
          </h3>
          <p className="font-mono text-[10px] text-neutral-400 leading-relaxed mb-6">
            {isGuest 
              ? "Sign in with a social account first to view platform balances."
              : "Your social account is linked. Connect a Web3 wallet to access your balances and Vault."}
          </p>

          {!isGuest && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-cyan-500/20 transition-all flex items-center gap-2"
            >
              {connecting ? <Loader className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // If unlocked, render normally
  return <>{children}</>;
}
