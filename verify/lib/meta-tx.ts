/**
 * ERC-2771 meta-transactions — shared client/server pieces.
 *
 * The forwarder is OpenZeppelin's ERC2771Forwarder (contracts/lib, deployed
 * as-is via script/Deploy.s.sol — MAD Gambit doesn't subclass it, there's
 * nothing to add to an already-audited, already-deployable contract).
 * MADMarketFactory and MADStaking both trust it (see ERC2771Context in each).
 *
 * Flow: user signs a ForwardRequest off-chain (no gas, no tx) → POSTs it to
 * /api/v1/relay/execute → the relayer submits it on-chain and pays gas → the
 * target contract sees the real user as _msgSender(), never the relayer.
 */
import type { Address, Hex, WalletClient } from "viem";
import { CHAINS } from "@/lib/contracts";

export const FORWARDER_ABI = [
  {
    type: "function",
    name: "execute",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

/** Mirrors ERC2771Forwarder's FORWARD_REQUEST_TYPEHASH exactly — do not reorder fields. */
export const FORWARD_REQUEST_EIP712_TYPES = {
  ForwardRequest: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "gas", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint48" },
    { name: "data", type: "bytes" },
  ],
} as const;

/** Must match the name passed to `new ERC2771Forwarder("...")` in Deploy.s.sol. */
export const FORWARDER_EIP712_DOMAIN_NAME = "MAD Gambit Forwarder";
export const FORWARDER_EIP712_VERSION = "1";

export interface SignedForwardRequest {
  from: Address;
  to: Address;
  value: bigint;
  gas: bigint;
  deadline: number;
  data: Hex;
  signature: Hex;
}

/**
 * Sign a gasless call for relaying. `gas` should be a real estimate (with
 * headroom) of what `data` costs against `to` — the forwarder enforces that
 * at least this much gas reaches the call, so under-estimating makes the
 * relayed call revert for the wrong reason. `deadlineSeconds` defaults to 10
 * minutes, generous for a UI flow, tight enough that a stale signature isn't
 * replayable indefinitely.
 */
export async function signMetaTx(params: {
  walletClient: WalletClient;
  account: Address;
  forwarderAddress: Address;
  to: Address;
  data: Hex;
  gas: bigint;
  currentNonce: bigint;
  chainId?: number;
  deadlineSeconds?: number;
}): Promise<SignedForwardRequest> {
  const {
    walletClient,
    account,
    forwarderAddress,
    to,
    data,
    gas,
    currentNonce,
    chainId = CHAINS.arbitrumOne.id,
    deadlineSeconds = 600,
  } = params;

  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;

  const signature = await walletClient.signTypedData({
    account,
    domain: {
      name: FORWARDER_EIP712_DOMAIN_NAME,
      version: FORWARDER_EIP712_VERSION,
      chainId,
      verifyingContract: forwarderAddress,
    },
    types: FORWARD_REQUEST_EIP712_TYPES,
    primaryType: "ForwardRequest",
    message: {
      from: account,
      to,
      value: BigInt(0),
      gas,
      nonce: currentNonce,
      deadline,
      data,
    },
  });

  return { from: account, to, value: BigInt(0), gas, deadline, data, signature };
}
