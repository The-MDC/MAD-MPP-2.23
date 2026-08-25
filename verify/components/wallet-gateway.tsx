"use client";

/**
 * MΛĐ Gambit — Wallet Gateway (Tier 2 Auth)
 * ------------------------------------------------------------------
 * Gates financial surfaces behind a REAL wallet session.
 *
 * It used to gate them behind a 1.5-second setTimeout that wrote the literal
 * string "0xMAD...8888" into React state. Every balance and vault screen in the
 * app was locked by a boolean any refresh could flip, and the address it
 * reported was not an address.
 *
 * It now runs the SIWE flow that has existed server-side all along:
 * `GET /api/v1/auth/nonce` → `personal_sign` → `POST /api/v1/auth/verify` →
 * signed httpOnly session cookie. Same session the swap route and the $MADx
 * ledger check, so "unlocked" here now means the routes behind it will actually
 * answer.
 *
 * Truth comes from the SERVER (`GET /api/v1/auth/session`), not from context.
 * `walletAuth` in game-context is still updated so existing consumers keep
 * working, but it is now a mirror of server state rather than the source of it.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useGame } from "@/context/game-context";
import { hasInjectedWallet, readSession, signInWithEthereum } from "@/lib/siwe-client";
import { SIGN_IN_CHAIN_NAME } from "@/lib/chain";
import { Wallet, ShieldAlert, Loader } from "lucide-react";

export default function WalletGateway({ children }: { children: React.ReactNode }) {
  const { walletAuth, setWalletAuth } = useGame();
  const [connecting, setConnecting] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletPresent, setWalletPresent] = useState(true);

  // Ask the server, once, on mount. Until that answers we show the locked state
  // rather than flashing unlocked content we may have to take back.
  const sync = useCallback(async () => {
    const s = await readSession();
    setWalletAuth({ isConnected: s.authenticated, address: s.address });
    setChecked(true);
  }, [setWalletAuth]);

  useEffect(() => {
    setWalletPresent(hasInjectedWallet());
    void sync();
  }, [sync]);

  const isLocked = !walletAuth.isConnected;

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    const result = await signInWithEthereum();
    if (!result.ok) {
      setError(result.error);
      setConnecting(false);
      return;
    }
    await sync();
    setConnecting(false);
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
            {walletPresent ? <Wallet className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>

          <h3 className="font-mono text-sm uppercase tracking-widest font-black text-white mb-2">
            Vault Locked
          </h3>
          <p className="font-mono text-[10px] text-neutral-400 leading-relaxed mb-6">
            {!checked
              ? "Checking your session…"
              : walletPresent
                ? `Sign a message with your wallet to open the Vault. Binds to ${SIGN_IN_CHAIN_NAME}; it authorises no transaction and moves no funds.`
                : "No browser wallet detected. Install one to access balances and the Vault."}
          </p>

          {walletPresent && (
            <button
              onClick={handleConnect}
              disabled={connecting || !checked}
              className="px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {connecting ? <Loader className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              {connecting ? "Awaiting signature…" : "Sign in with wallet"}
            </button>
          )}

          {/* A silent failure here reads as a broken button. Say what happened. */}
          {error && (
            <p className="mt-3 font-mono text-[9px] text-rose-400 font-bold max-w-xs">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // If unlocked, render normally
  return <>{children}</>;
}
