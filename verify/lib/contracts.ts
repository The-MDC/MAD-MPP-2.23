/**
 * MAD Gambit — on-chain contract + token address registry.
 * ------------------------------------------------------------------
 * The single source of truth the frontend reads for chain metadata and
 * contract/token addresses. Env-overridable (NEXT_PUBLIC_*) so a testnet or
 * mainnet deploy never needs a code change. Every deployed address is `null`
 * until it exists — callers MUST degrade (show "not deployed", never call a
 * zero address).
 *
 * $MADx ground truth is verified on-chain — see
 * docs/MAD_GAMBIT_MASTER.md.
 */

export interface ChainInfo {
  id: number;
  name: string;
  shortName: string;
  explorer: string;
  nativeSymbol: string;
}

export const CHAINS = {
  arbitrumOne: { id: 42161, name: "Arbitrum One", shortName: "arb1", explorer: "https://arbiscan.io", nativeSymbol: "ETH" },
  arbitrumNova: { id: 42170, name: "Arbitrum Nova", shortName: "nova", explorer: "https://nova.arbiscan.io", nativeSymbol: "ETH" },
  arbitrumSepolia: { id: 421614, name: "Arbitrum Sepolia", shortName: "arb-sep", explorer: "https://sepolia.arbiscan.io", nativeSymbol: "ETH" },
} as const satisfies Record<string, ChainInfo>;

export const DEFAULT_CHAIN_ID = 42161;

/**
 * $MADx — the real, verified fair-launch token (MADDEX / "MADx", 18 decimals)
 * on Arbitrum One. Cap 224,573,096; mint-on-purchase; owner-modifiable;
 * totalSupply was 0 at last read (nothing minted until legitimately purchased).
 */
export const MADX = {
  address: "0x6972370e1caAA3624F37D7e87C28e1089D00151f",
  chainId: 42161,
  name: "MADDEX",
  symbol: "MADx",
  decimals: 18,
  maxSupplyCap: "224573096", // whole tokens — fair-launch hard cap (owner-modifiable)
} as const;

const isAddress = (v: string | undefined): v is `0x${string}` =>
  typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v);

const asAddr = (v: string | undefined): `0x${string}` | null => (isAddress(v) ? v : null);

// Referenced statically so Next.js inlines NEXT_PUBLIC_* into the client bundle.
const ENV = {
  madx: process.env.NEXT_PUBLIC_MADX_ADDRESS,
  staking: process.env.NEXT_PUBLIC_STAKING_ADDRESS,
  marketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS,
  treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
  forwarder: process.env.NEXT_PUBLIC_FORWARDER_ADDRESS,
};

export interface Deployment {
  madx: `0x${string}` | null;
  staking: `0x${string}` | null;
  marketFactory: `0x${string}` | null;
  treasury: `0x${string}` | null;
  /** ERC-2771 trusted forwarder — see script/Deploy.s.sol and lib/meta-tx.ts. */
  forwarder: `0x${string}` | null;
}

/**
 * Addresses the frontend should use for `chainId`. On Arbitrum One, `madx`
 * defaults to the real verified token; the rest are null until deployed
 * (override any of them via NEXT_PUBLIC_* env at deploy time).
 */
export function deploymentFor(chainId: number = DEFAULT_CHAIN_ID): Deployment {
  const madxDefault = chainId === MADX.chainId ? (MADX.address as `0x${string}`) : null;
  return {
    madx: asAddr(ENV.madx) ?? madxDefault,
    staking: asAddr(ENV.staking),
    marketFactory: asAddr(ENV.marketFactory),
    treasury: asAddr(ENV.treasury),
    forwarder: asAddr(ENV.forwarder),
  };
}

export function explorerAddress(chainId: number, address: string): string {
  const chain = Object.values(CHAINS).find((c) => c.id === chainId) ?? CHAINS.arbitrumOne;
  return `${chain.explorer}/address/${address}`;
}
