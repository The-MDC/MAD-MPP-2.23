# MΛĐHATs Gambit EVM-Native Implementation Guide for Arbitrum
> Source: https://docs.google.com/document/d/1H5qPLDhbVUEmVSXKZQu8uv8Ae4SWf8cf3vA7sVoaf-E/edit
> Created: 2026-01-07 | Last Modified: 2026-02-10

## Architecture
- PredictionMarket.sol: Core market lifecycle (create, bet, resolve, claim)
- BondingCurve.sol: Automated DL-LMSR liquidity
- StakingPool.sol: TeaBag/MAD Shield loss protection with Morpho Blue integration
- Triple-Oracle: Chainlink + News APIs + 66% community supermajority
- ERC-1155 Scandal Cards with evolution/degeneration mechanics

## Key Contracts
- IPredictionMarket: createMarket, placeBet, resolveMarket, claimWinnings
- IBondingCurve: buyShares, sellShares, calculateBuyPrice
- Price formula: basePrice * (1 + supply / reserveRatio)^curveFactor

> Full document with code snippets at source URL above.
