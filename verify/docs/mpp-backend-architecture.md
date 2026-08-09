# MAD-MPP-2.23 Node.js Backend Architecture & Migration Specification

This document details the blueprint for porting the core **MAD-MPP-2.23** mathematical simulation algorithms and configurations from the Kotlin Android implementation to a robust, server-ready **Node.js/Next.js full-stack container environment**.

---

## 1. Shared Utility Library Strategy (`@madgambit/mpp-math`)

To eliminate variance between the server-side analysis engine and local client visual simulations, we establish an isomorphic utility structure:

### Configuration & Toolchain
- **Shared Module:** The core mathematical algorithms are packed into a dedicated package `lib/mpp-math.ts`. 
- **Compat Mode:** Code is written in pure vanilla TypeScript, targeting **ESNext/CommonJS** without dependency on any web (browser DOM) or node-specific (`posix`/`fs`) SDKs.
- **Precision Guarantees:** 
  - Sub-millisecond mathematical executions utilize native `Math` commands (`Math.exp`, `Math.log1p`, `Math.pow`).
  - Strict type checking utilizes TypeScript's `number` representation to reflect standard IEEE 754 double precision floats—mirroring Kotlin’s native `Double` representation exactly.

---

## 2. RESTful API Structure (Node.js/Next.js App Router)

The Node.js controller exposes standard high-fidelity, rate-resistant endpoints under `/api/v1/mpp/*`:

### A. Stochastic Matrix Calculations (`POST /api/v1/mpp/simulate`)
Accepts current inputs to generate an aligned matrix graph series.

- **Request Payload (`application/json`):**
  ```json
  {
    "baseThreshold": 680,
    "currentStake": 1500,
    "userMultiplier": 1.5,
    "alpha": 0.15,
    "governanceWeight": 75,
    "simulatedEpochs": 30,
    "bondingPriceFloor": 120,
    "pricingSlope": 0.85,
    "elasticity": 4.5
  }
  ```
- **Response Payload (`application/json`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "epoch": 0,
        "conviction": 0,
        "mppPrice": 120.00,
        "threshold": 935,
        "reached": false
      },
      ...
    ]
  }
  ```

### B. Gambit Profile Manager (`GET /api/v1/mpp/profiles`)
Retrieves available protocol templates. Supports dynamic database hydration if configured.

- **Response Payload (`application/json`):**
  ```json
  {
    "success": true,
    "profiles": [
      {
        "id": "hyperion",
        "name": "Hyperion Speed Run",
        "codename": "ALPHA-01",
        "description": "Arbitrage front-running telemetry on sub-second liquid index loops.",
        "alpha": 0.15,
        "baseThreshold": 680,
        "currentStake": 1500
      }
    ]
  }
  ```

---

## 3. Data Model Migration: Kotlin Android (Room) to JSON Schema

The native Android app implements data structures in standard Kotlin data classes. Below is the conversion mapping schema.

### A. Original Kotlin Model (Android Room Entity)
```kotlin
package com.madgambit.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "gambits")
data class GambitEntity(
    @PrimaryKey val id: String,
    val name: String,
    val codename: String,
    val description: String,
    val alpha: Double,
    val baseThreshold: Int,
    val currentStake: Double
)
```

### B. Targeted JSON Migration Schema
We migrate Room schema structures directly to standard **JSON Schema (draft-07)**, which serves as a validation layout on server api requests:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GambitProfile",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9_-]+$"
    },
    "name": {
      "type": "string"
    },
    "codename": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "alpha": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0
    },
    "baseThreshold": {
      "type": "integer",
      "minimum": 1
    },
    "currentStake": {
      "type": "number",
      "minimum": 0.0
    }
  },
  "required": ["id", "name", "codename", "alpha", "baseThreshold", "currentStake"]
}
```

### C. Migration Steps
1. **Extraction (Android):** Trigger automated database backups or export scripts in Room/SQLite to parse entries into standard JSON arrays:
   ```kotlin
   // Inside Android DAO utility: "exportToJson(context.filesDir)"
   ```
2. **Ingestion (Node.js Backend):** Write an administrative ingestion route `/api/v1/admin/ingest` to receive, validate, and write Android entity records directly to cloud-native Firestore collections or PostgreSQL tables in Cloud SQL.
