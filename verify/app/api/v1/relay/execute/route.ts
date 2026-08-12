import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, isAddressEqual } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { requireMadxRouteAuth, isAuthResponse } from "@/lib/madx-route-auth";
import { deploymentFor } from "@/lib/contracts";
import { FORWARDER_ABI } from "@/lib/meta-tx";

/**
 * POST /api/v1/relay/execute — the gasless relayer.
 *
 * Submits a user-signed ERC-2771 ForwardRequest on-chain, paying gas from
 * RELAYER_PRIVATE_KEY. The forwarder contract (OpenZeppelin's
 * ERC2771Forwarder, unmodified) is what actually verifies the signature and
 * enforces the deadline/nonce — this route's own job is narrower and just as
 * load-bearing: don't let this become an open relay for arbitrary calls.
 *
 * Two guards beyond signature validity, per ERC2771Forwarder's own security
 * note ("consider whitelisting target contracts"):
 *   1. `request.to` must be one of MAD Gambit's own deployed contracts.
 *   2. `request.from` must equal the caller's authenticated session address
 *      — relaying is for your own signed actions, not an anonymous
 *      broadcast service for whoever's signature you happen to be holding.
 */

const MAX_RELAY_GAS = BigInt(2_000_000);

function allowlistedTargets(): Set<`0x${string}`> {
  const { staking, marketFactory } = deploymentFor();
  const targets = new Set<`0x${string}`>();
  if (staking) targets.add(staking);
  if (marketFactory) targets.add(marketFactory);
  return targets;
}

interface RelayBody {
  request?: {
    from?: string;
    to?: string;
    value?: string;
    gas?: string;
    deadline?: number;
    data?: string;
    signature?: string;
  };
}

export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "relay-execute", 15, 60_000);
  if (isAuthResponse(auth)) return auth;

  const forwarderAddress = deploymentFor().forwarder;
  if (!forwarderAddress) {
    return NextResponse.json({ success: false, error: "relayer not configured (no forwarder deployed)" }, { status: 503 });
  }
  const relayerKey = process.env.RELAYER_PRIVATE_KEY;
  if (!relayerKey) {
    return NextResponse.json({ success: false, error: "relayer not configured (no RELAYER_PRIVATE_KEY)" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as RelayBody;
  const r = body.request;
  if (!r || !r.from || !r.to || !r.gas || !r.data || !r.signature || typeof r.deadline !== "number") {
    return NextResponse.json({ success: false, error: "malformed forward request" }, { status: 400 });
  }

  let from: `0x${string}`, to: `0x${string}`;
  try {
    from = r.from as `0x${string}`;
    to = r.to as `0x${string}`;
    if (!/^0x[0-9a-fA-F]{40}$/.test(from) || !/^0x[0-9a-fA-F]{40}$/.test(to)) throw new Error("bad address");
  } catch {
    return NextResponse.json({ success: false, error: "malformed address" }, { status: 400 });
  }

  if (!isAddressEqual(from, auth.owner as `0x${string}`)) {
    return NextResponse.json({ success: false, error: "request.from must match your authenticated wallet" }, { status: 403 });
  }

  if (!allowlistedTargets().has(to)) {
    return NextResponse.json({ success: false, error: "target contract is not relayable" }, { status: 403 });
  }

  let gas: bigint;
  try {
    gas = BigInt(r.gas);
  } catch {
    return NextResponse.json({ success: false, error: "malformed gas value" }, { status: 400 });
  }
  if (gas <= BigInt(0) || gas > MAX_RELAY_GAS) {
    return NextResponse.json({ success: false, error: `gas must be between 0 and ${MAX_RELAY_GAS}` }, { status: 400 });
  }

  const account = privateKeyToAccount(relayerKey as `0x${string}`);
  const transport = http(process.env.RELAYER_RPC_URL || undefined);
  const publicClient = createPublicClient({ chain: arbitrum, transport });
  const walletClient = createWalletClient({ account, chain: arbitrum, transport });

  try {
    const hash = await walletClient.writeContract({
      address: forwarderAddress,
      abi: FORWARDER_ABI,
      functionName: "execute",
      args: [
        {
          from,
          to,
          value: BigInt(0),
          gas,
          deadline: r.deadline,
          data: r.data as `0x${string}`,
          signature: r.signature as `0x${string}`,
        },
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 30_000 });
    return NextResponse.json({
      success: receipt.status === "success",
      hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (e) {
    console.error("relay/execute error:", e);
    return NextResponse.json({ success: false, error: "relay submission failed" }, { status: 502 });
  }
}
