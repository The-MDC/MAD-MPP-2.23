# Vendored Solidity libraries

`openzeppelin-contracts/` and `forge-std/` are committed copies (no git submodules),
because `foundry.yml` checks out without submodules and never runs `forge install`.

Only the Solidity sources are kept. The upstream JavaScript manifests
(`package.json`, `package-lock.json`) were removed on 2026-10-27: Foundry never reads
them, and while they were present GitHub's dependency graph scanned OpenZeppelin's
own dev toolchain (hardhat, axios, undici, js-yaml …) and Dependabot opened failing
security jobs for packages that never ship in MAD Gambit.

Updating a library: copy the new upstream `contracts/` or `src/` tree in, and do not
bring its `package*.json` back.
