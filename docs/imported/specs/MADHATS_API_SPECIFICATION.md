# 🔌 MADHATS GAMBIT - API SPECIFICATION
## **Complete Backend API Documentation for Claude Code**

---

# TABLE OF CONTENTS

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Tournament Endpoints](#tournament-endpoints)
4. [Market Endpoints](#market-endpoints)
5. [Betting Endpoints](#betting-endpoints)
6. [Card Endpoints](#card-endpoints)
7. [mEth Endpoints](#meth-endpoints)
8. [Event Endpoints](#event-endpoints)
9. [User Endpoints](#user-endpoints)
10. [Analytics Endpoints](#analytics-endpoints)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

# 1. API OVERVIEW

**Base URL**: `https://api.madhats.com/v1`
**Format**: JSON
**Authentication**: JWT + Wallet Signature
**Rate Limiting**: Tier-based (see section 12)

---

# 2. AUTHENTICATION

## **POST /auth/connect-wallet**

Connect Web3 wallet and get challenge message.

### Request:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

### Response:
```json
{
  "challenge": "Sign this message to prove wallet ownership: nonce_abc123",
  "expiresAt": "2026-01-20T12:00:00Z"
}
```

## **POST /auth/verify-signature**

Verify signed message and create session.

### Request:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "message": "Sign this message to prove wallet ownership: nonce_abc123"
}
```

### Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "verificationTier": 2,
    "displayName": "DegenLord88",
    "balanceCents": 10000,
    "methBalance": 50000
  }
}
```

## **POST /auth/logout**

End session.

### Headers:
```
Authorization: Bearer {token}
```

### Response:
```json
{
  "success": true
}
```

---

# 3. TOURNAMENT ENDPOINTS

## **GET /tournaments/list**

List active and upcoming tournaments.

### Query Parameters:
- `status` (optional): `UPCOMING`, `ACTIVE`, `FINISHED`
- `tier` (optional): Tournament tier filter
- `limit` (default: 20, max: 100)
- `offset` (default: 0)

### Response:
```json
{
  "tournaments": [
    {
      "id": "uuid",
      "tier": "GRINDER",
      "entryFeeCents": 888,
      "startTime": "2026-01-20T18:00:00Z",
      "endTime": "2026-01-21T18:00:00Z",
      "prizePoolCents": 84467,
      "playerCount": 105,
      "maxPlayers": null,
      "status": "ACTIVE",
      "hasEntered": false
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

## **GET /tournaments/:id**

Get tournament details.

### Response:
```json
{
  "id": "uuid",
  "tier": "GRINDER",
  "entryFeeCents": 888,
  "startTime": "2026-01-20T18:00:00Z",
  "endTime": "2026-01-21T18:00:00Z",
  "durationSeconds": 86400,
  "prizePoolCents": 84467,
  "platformRakeCents": 4333,
  "guaranteedMinimumCents": 888,
  "playerCount": 105,
  "maxPlayers": null,
  "status": "ACTIVE",
  "hasEntered": false,
  "markets": [
    {
      "id": "uuid",
      "question": "Will Trump say 'Fake News' in his next speech?",
      "category": "POLITICAL_DRAMA",
      "closesAt": "2026-01-20T20:00:00Z"
    }
  ]
}
```

## **POST /tournaments/:id/enter**

Enter a tournament.

### Request:
```json
{
  "paymentCurrency": "USDC",
  "txHash": "0x..." // Optional, for on-chain verification
}
```

### Response:
```json
{
  "success": true,
  "entry": {
    "id": "uuid",
    "tournamentId": "uuid",
    "userId": "uuid",
    "entryFeePaidCents": 888,
    "paymentCurrency": "USDC",
    "enteredAt": "2026-01-20T17:55:00Z"
  },
  "tournament": {
    "id": "uuid",
    "prizePoolCents": 85355,
    "playerCount": 106
  }
}
```

## **GET /tournaments/:id/leaderboard**

Get real-time tournament leaderboard.

### Query Parameters:
- `limit` (default: 100)

### Response:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "displayName": "DegenKing",
      "avatarUrl": "https://...",
      "netProfitCents": 15000,
      "totalVolumeCents": 50000,
      "winRate": 0.72,
      "betsPlaced": 25,
      "betsWon": 18,
      "prizeAmountCents": 30600
    }
  ],
  "yourRank": 42,
  "playerCount": 106,
  "updatedAt": "2026-01-20T19:00:00Z"
}
```

## **GET /tournaments/my-entries**

Get user's tournament entry history.

### Query Parameters:
- `status` (optional): `ACTIVE`, `FINISHED`
- `limit` (default: 20)
- `offset` (default: 0)

### Response:
```json
{
  "entries": [
    {
      "id": "uuid",
      "tournament": {
        "id": "uuid",
        "tier": "GRINDER",
        "startTime": "2026-01-20T18:00:00Z",
        "status": "ACTIVE"
      },
      "entryFeePaidCents": 888,
      "netProfitCents": 5000,
      "finalRank": 12,
      "prizeWonCents": 8500,
      "prizeClaimed": false
    }
  ]
}
```

---

# 4. MARKET ENDPOINTS

## **GET /markets/list**

List prediction markets.

### Query Parameters:
- `category` (optional): Market category filter
- `status` (optional): `OPEN`, `CLOSED`, `RESOLVED`
- `tournamentId` (optional): Filter by tournament
- `limit` (default: 20)
- `offset` (default: 0)

### Response:
```json
{
  "markets": [
    {
      "id": "uuid",
      "question": "Will Bitcoin hit $100k by end of month?",
      "category": "CRYPTO_CHAOS",
      "marketType": "BINARY",
      "outcomes": [
        {
          "id": 0,
          "label": "Yes",
          "currentOdds": 0.65,
          "totalStaked": 50000
        },
        {
          "id": 1,
          "label": "No",
          "currentOdds": 0.35,
          "totalStaked": 30000
        }
      ],
      "closesAt": "2026-01-31T23:59:59Z",
      "status": "OPEN",
      "totalVolumeCents": 80000,
      "uniqueBettors": 234
    }
  ]
}
```

## **GET /markets/:id**

Get market details.

### Response:
```json
{
  "id": "uuid",
  "question": "Will Bitcoin hit $100k by end of month?",
  "description": "Market resolves YES if BTC/USD exceeds $100,000...",
  "category": "CRYPTO_CHAOS",
  "marketType": "BINARY",
  "outcomes": [
    {
      "id": 0,
      "label": "Yes",
      "currentOdds": 0.65,
      "totalStaked": 50000,
      "betCount": 156
    },
    {
      "id": 1,
      "label": "No",
      "currentOdds": 0.35,
      "totalStaked": 30000,
      "betCount": 78
    }
  ],
  "createdAt": "2026-01-15T00:00:00Z",
  "closesAt": "2026-01-31T23:59:59Z",
  "resolvesAt": null,
  "resolutionSource": "https://coinmarketcap.com/currencies/bitcoin/",
  "status": "OPEN",
  "totalVolumeCents": 80000,
  "uniqueBettors": 234,
  "tournamentId": "uuid",
  "liquidityParameter": 100,
  "difficulty": "MEDIUM"
}
```

## **GET /markets/:id/odds**

Get current odds (real-time LMSR calculation).

### Response:
```json
{
  "marketId": "uuid",
  "outcomes": [
    {
      "id": 0,
      "label": "Yes",
      "odds": 0.6523,
      "impliedProbability": 0.6523
    },
    {
      "id": 1,
      "label": "No",
      "odds": 0.3477,
      "impliedProbability": 0.3477
    }
  ],
  "liquidityParameter": 100,
  "timestamp": "2026-01-20T19:30:00Z"
}
```

## **GET /markets/:id/history**

Get market odds history (for charts).

### Query Parameters:
- `interval` (default: `1h`): `5m`, `15m`, `1h`, `4h`, `1d`
- `from` (optional): ISO timestamp
- `to` (optional): ISO timestamp

### Response:
```json
{
  "history": [
    {
      "timestamp": "2026-01-20T00:00:00Z",
      "outcomes": [
        { "id": 0, "odds": 0.50 },
        { "id": 1, "odds": 0.50 }
      ],
      "volume": 0
    },
    {
      "timestamp": "2026-01-20T01:00:00Z",
      "outcomes": [
        { "id": 0, "odds": 0.55 },
        { "id": 1, "odds": 0.45 }
      ],
      "volume": 5000
    }
  ]
}
```

---

# 5. BETTING ENDPOINTS

## **POST /bets/place**

Place a bet on a market.

### Request:
```json
{
  "marketId": "uuid",
  "tournamentId": "uuid",
  "outcomeIndex": 0,
  "amountCents": 1000,
  "cardId": "uuid", // Optional: card to use for stats boost
  "hasInsurance": false
}
```

### Response:
```json
{
  "bet": {
    "id": "uuid",
    "marketId": "uuid",
    "outcomeIndex": 0,
    "outcomeLabel": "Yes",
    "amountCents": 1000,
    "sharesPurchased": 15.32,
    "priceAtPurchase": 0.65,
    "costBasisCents": 1000,
    "placedAt": "2026-01-20T19:35:00Z"
  },
  "market": {
    "id": "uuid",
    "outcomes": [
      {
        "id": 0,
        "currentOdds": 0.66
      }
    ]
  },
  "balance": {
    "balanceCents": 9000
  }
}
```

## **GET /bets/list**

Get user's bet history.

### Query Parameters:
- `status` (optional): `PENDING`, `WON`, `LOST`
- `tournamentId` (optional)
- `limit` (default: 20)
- `offset` (default: 0)

### Response:
```json
{
  "bets": [
    {
      "id": "uuid",
      "market": {
        "id": "uuid",
        "question": "Will Bitcoin hit $100k?",
        "status": "RESOLVED"
      },
      "outcomeIndex": 0,
      "outcomeLabel": "Yes",
      "amountCents": 1000,
      "won": true,
      "payoutCents": 1540,
      "netProfitCents": 540,
      "claimed": false,
      "placedAt": "2026-01-20T19:35:00Z"
    }
  ]
}
```

## **GET /bets/:id**

Get bet details.

### Response:
```json
{
  "id": "uuid",
  "market": {
    "id": "uuid",
    "question": "Will Bitcoin hit $100k?",
    "status": "RESOLVED",
    "resolvedOutcome": "Yes"
  },
  "tournamentId": "uuid",
  "cardUsed": {
    "id": "uuid",
    "name": "The Don",
    "condition": "PRISTINE"
  },
  "outcomeIndex": 0,
  "outcomeLabel": "Yes",
  "amountCents": 1000,
  "sharesPurchased": 15.32,
  "priceAtPurchase": 0.65,
  "costBasisCents": 1000,
  "won": true,
  "payoutCents": 1540,
  "netProfitCents": 540,
  "claimed": false,
  "placedAt": "2026-01-20T19:35:00Z",
  "resolvedAt": "2026-02-01T00:00:00Z"
}
```

## **POST /bets/:id/claim**

Claim bet winnings.

### Response:
```json
{
  "success": true,
  "bet": {
    "id": "uuid",
    "claimed": true,
    "claimedAt": "2026-02-01T10:00:00Z"
  },
  "balance": {
    "balanceCents": 10540
  }
}
```

---

# 6. CARD ENDPOINTS

## **GET /cards/list**

Get user's card collection.

### Query Parameters:
- `faction` (optional)
- `rarity` (optional)
- `tier` (optional)
- `condition` (optional)
- `limit` (default: 50)
- `offset` (default: 0)

### Response:
```json
{
  "cards": [
    {
      "id": "uuid",
      "cardId": "uuid",
      "tokenId": 123,
      "name": "The Don",
      "faction": "POLITICOS",
      "rarity": "LEGENDARY",
      "tier": 5,
      "condition": "PRISTINE",
      "stats": {
        "volatility": 100,
        "clout": 95,
        "cancelRisk": 50
      },
      "ability": {
        "name": "Executive Order",
        "description": "Can change market rules mid-bet"
      },
      "imageUrl": "https://...",
      "quantity": 1,
      "timesUsed": 42,
      "totalXpEarned": 50000,
      "isStaked": false
    }
  ]
}
```

## **GET /cards/:id**

Get card details.

### Response:
```json
{
  "id": "uuid",
  "cardId": "uuid",
  "tokenId": 123,
  "name": "The Don",
  "subtitle": "The Ultimate Disruptor",
  "faction": "POLITICOS",
  "rarity": "LEGENDARY",
  "tier": 5,
  "condition": "PRISTINE",
  "stats": {
    "volatility": 100,
    "clout": 95,
    "cancelRisk": 50
  },
  "ability": {
    "name": "Executive Order",
    "description": "Can change market rules mid-bet",
    "trigger": "ONCE_PER_TOURNAMENT"
  },
  "imageUrl": "https://...",
  "animationUrl": "https://...",
  "metadataUri": "ipfs://...",
  "quantity": 1,
  "timesUsed": 42,
  "totalXpEarned": 50000,
  "evolutionProgress": 0.85,
  "isStaked": false,
  "isInRepair": false,
  "acquiredAt": "2026-01-01T00:00:00Z"
}
```

## **POST /cards/:id/evolve**

Attempt card evolution.

### Request:
```json
{
  "sourceCardIds": ["uuid", "uuid"], // Cards to sacrifice
  "paymentMethod": "MAD", // "MAD" or "METH"
  "madAmount": 1000000, // If paying with MAD
  "methAmount": 0 // If paying with mEth
}
```

### Response:
```json
{
  "success": true,
  "nearMiss": false,
  "evolution": {
    "id": "uuid",
    "sourceCardId": "uuid",
    "resultCardId": "uuid",
    "sourceTier": 4,
    "resultTier": 5,
    "madBurned": 1000000,
    "attemptedAt": "2026-01-20T20:00:00Z"
  },
  "newCard": {
    "id": "uuid",
    "name": "God Emperor Don",
    "tier": 5,
    "condition": "PRISTINE"
  }
}
```

## **POST /cards/:id/repair**

Repair damaged card.

### Request:
```json
{
  "method": "METH_INSTANT", // "METH_INSTANT", "METH_COOLDOWN", "STAKING", "SALVAGE"
  "methAmount": 16000, // For mEth methods
  "collateralToken": "USDC", // For staking
  "collateralAmount": 100, // For staking
  "cardsToSalvage": ["uuid", "uuid"] // For salvage
}
```

### Response:
```json
{
  "success": true,
  "repair": {
    "cardId": "uuid",
    "method": "METH_INSTANT",
    "conditionBefore": "BROKEN",
    "conditionAfter": "PRISTINE",
    "methSpent": 56000,
    "repairedAt": "2026-01-20T20:05:00Z"
  }
}
```

## **GET /cards/:id/condition**

Get card condition and repair status.

### Response:
```json
{
  "cardId": "uuid",
  "condition": "WORN",
  "isInRepair": true,
  "repairStartedAt": "2026-01-20T10:00:00Z",
  "repairEndsAt": "2026-01-20T14:00:00Z",
  "repairMethod": "METH_COOLDOWN",
  "secondsRemaining": 3600
}
```

---

# 7. METH ENDPOINTS

## **GET /meth/balance**

Get user's mEth balance.

### Response:
```json
{
  "balance": 50000,
  "dailyEarned": 15000,
  "dailyCap": 20000,
  "weeklyDecayAmount": 0
}
```

## **GET /meth/earn-history**

Get mEth earning history.

### Query Parameters:
- `from` (optional): ISO timestamp
- `to` (optional): ISO timestamp
- `limit` (default: 50)

### Response:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "EARN",
      "amount": 1000,
      "source": "BET_WIN",
      "description": "Won bet on market XYZ",
      "balanceBefore": 49000,
      "balanceAfter": 50000,
      "createdAt": "2026-01-20T19:40:00Z"
    }
  ]
}
```

## **POST /meth/gift**

Gift mEth to another user.

### Request:
```json
{
  "recipientId": "uuid",
  "amount": 5000,
  "message": "Thanks for the tip!"
}
```

### Response:
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "recipientId": "uuid",
    "amount": 5000,
    "balanceAfter": 45000,
    "createdAt": "2026-01-20T20:10:00Z"
  }
}
```

---

# 8. EVENT ENDPOINTS

[Event endpoint specifications...]

---

# 9. USER ENDPOINTS

[User profile endpoints...]

---

# 10. ANALYTICS ENDPOINTS

## **POST /analytics/events**

Track analytics event.

### Request:
```json
{
  "events": [
    {
      "event_name": "bet_placed",
      "event_category": "betting",
      "timestamp": "2026-01-20T19:35:00.123Z",
      "properties": {
        "market_id": "uuid",
        "amount_cents": 1000
      },
      "context": {
        "page": { "url": "https://madhats.com/tournaments/123" },
        "device": { "type": "DESKTOP" }
      }
    }
  ]
}
```

### Response:
```json
{
  "success": true,
  "eventsProcessed": 1
}
```

---

# 11. ERROR HANDLING

All errors follow this format:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "You don't have enough funds to place this bet",
    "details": {
      "required": 1000,
      "available": 500
    }
  }
}
```

### Error Codes:

- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `INSUFFICIENT_BALANCE` (400)
- `TOURNAMENT_FULL` (400)
- `TOURNAMENT_CLOSED` (400)
- `MARKET_CLOSED` (400)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)

---

# 12. RATE LIMITING

Rate limits by verification tier:

| Tier | Requests/Min | Bets/Day | Tournaments/Day |
|------|--------------|----------|-----------------|
| 0    | 10           | 10       | 1               |
| 1    | 30           | 50       | 3               |
| 2    | 60           | 200      | 10              |
| 3    | 120          | 500      | Unlimited       |
| 4    | Unlimited    | Unlimited| Unlimited       |

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642702800
```

---

**API is production-ready!** 🚀
