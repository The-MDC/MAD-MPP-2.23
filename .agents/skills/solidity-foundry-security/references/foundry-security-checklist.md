# Foundry + OZ Security Checklist for MAD Gambit

## Reentrancy
- [ ] All external calls after state updates (CEI)
- [ ] ReentrancyGuard or manual nonReentrant on payable / state-changing functions
- [ ] No cross-function reentrancy vectors between vault, staking, escrow

## Access Control
- [ ] RolesRegistry used for all privileged ops
- [ ] No hardcoded owner addresses; use AccessControl / Ownable2Step
- [ ] Role grants are events + onlyRole checks

## Upgradeability (UUPS)
- [ ] _authorizeUpgrade onlyRole
- [ ] Storage gaps present and sized correctly
- [ ] Initializers protected (initializer modifier, no double-init)
- [ ] proxiableUUID correct

## Arithmetic & Accounting
- [ ] No unchecked {} around fee or vault math
- [ ] Fee split invariants hold (public 40/28.8/28.8)
- [ ] Shield vault accounting never allows over-withdrawal of recovery share

## Fuzz / Invariants
- [ ] forge test --fuzz-runs 10000+ on pricing, deposit, withdraw, fee
- [ ] Invariant: totalFeesAccounted == creator + community + shield
- [ ] Invariant: shield recovery share never exceeds public max

## Static Analysis
- [ ] Slither clean (or documented exceptions)
- [ ] No high/medium findings left open

## Deployment
- [ ] Correct chain IDs (42170 / 42161)
- [ ] Verified on Arbiscan
- [ ] Roles set post-deploy
