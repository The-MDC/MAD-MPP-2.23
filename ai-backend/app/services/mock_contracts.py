"""
MAD Gambit AI Backend — Mock Contracts Service
════════════════════════════════════════════════════════════════════
Mocks the on-chain latency and state for MADShieldVault and MADStaking.
Used in place of deploying real Solidity contracts to test the E2E UI.
════════════════════════════════════════════════════════════════════
"""
import time
import asyncio
from typing import Optional, Dict

class MockContractState:
    def __init__(self):
        # Mocks MADStaking (wallet -> staked balance)
        self.stakes: Dict[str, float] = {}
        # Mocks MADShieldVault (wallet -> shield status dict)
        self.shields: Dict[str, dict] = {}

state = MockContractState()

async def simulate_tx_latency():
    """Simulates 1-3 seconds of block confirmation time."""
    import random
    await asyncio.sleep(random.uniform(1.0, 3.0))

async def mock_stake(wallet_address: str, amount: float) -> dict:
    """Simulates staking MADx."""
    await simulate_tx_latency()
    
    current = state.stakes.get(wallet_address, 0.0)
    state.stakes[wallet_address] = current + amount
    
    return {
        "status": "success",
        "tx_hash": f"0xmock{int(time.time())}stake",
        "new_balance": state.stakes[wallet_address]
    }

async def mock_shield_opt_in(wallet_address: str, stake_amount: float, tier: str, premium_tier: float) -> dict:
    """Simulates creating a new shield opt-in."""
    await simulate_tx_latency()
    
    # Premium calc from gambit-game-math.ts
    premium_min = 0.02
    premium_max = 0.04
    if tier == "whale":
        premium = stake_amount * 0.03
    else:
        pct = premium_min + premium_tier * (premium_max - premium_min)
        premium = stake_amount * pct

    shield_info = {
        "status": "active",
        "tier": tier,
        "premium_tier": premium_tier,
        "premium_paid": premium,
        "staked_at": int(time.time() * 1000),
        "unstake_requested_at": None,
        "estimated_return_at": None,
        "return_window_hours": 0
    }
    state.shields[wallet_address] = shield_info
    
    return {
        "status": "success",
        "tx_hash": f"0xmock{int(time.time())}shield",
        "shield_info": shield_info
    }

async def mock_shield_unstake(wallet_address: str, stake_amount: float) -> dict:
    """Simulates requesting an unstake."""
    await simulate_tx_latency()
    
    if wallet_address not in state.shields or state.shields[wallet_address]["status"] != "active":
        return {"status": "error", "message": "No active shield found."}
    
    info = state.shields[wallet_address]
    
    # calc window from gambit-game-math.ts
    safe_stake = max(stake_amount, 0)
    hours = 2 + int(safe_stake / 10000) * 2
    window_hours = min(24, max(2, hours))
    
    now = int(time.time() * 1000)
    info["status"] = "unstaking"
    info["unstake_requested_at"] = now
    info["estimated_return_at"] = now + window_hours * 60 * 60 * 1000
    info["return_window_hours"] = window_hours
    
    return {
        "status": "success",
        "tx_hash": f"0xmock{int(time.time())}unstake",
        "shield_info": info
    }
