// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MADxToken ($MAÐx)
 * @notice Deflationary ERC20 token for MADHATs Gambit platform
 * @dev Features:
 *   - 0.15% transfer burn (deflationary mechanism)
 *   - 18 decimals (standard)
 *   - Burn-exempt addresses for treasury/AMM pools
 *
 * Existing Deployment (Arbitrum):
 *   Token: 0x6972370e1caAA3624F37D7e87C28e1089D00151f
 *   Creator: 0x49cca67bad20470bd892f3841cef05c13d54a3c5
 *   Rate: 25,267 MADx per ETH
 *
 * Platform: MADHATs Gambit - Entertainment prediction markets with
 *   40% insured loss backstop, entangled AMM, and circular attention economy.
 */
contract MADxToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant BURN_RATE = 15; // 0.15% = 15 basis points
    uint256 public constant BASIS_POINTS = 10000;

    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // Addresses exempt from burn (treasury, AMM pools, etc.)
    mapping(address => bool) public burnExempt;

    // Total burned tracking
    uint256 public totalBurned;

    event BurnExemptSet(address indexed account, bool exempt);
    event TransferBurned(address indexed from, address indexed to, uint256 amount, uint256 burned);

    /**
     * @notice Deploy MADx token
     * @param initialOwner Address to receive initial supply and ownership
     * @param initialSupply Total token supply (with 18 decimals)
     */
    constructor(
        address initialOwner,
        uint256 initialSupply
    ) ERC20("MADx", "MADx") Ownable(initialOwner) {
        require(initialOwner != address(0), "Invalid owner");
        require(initialSupply > 0, "Supply must be > 0");

        _mint(initialOwner, initialSupply);

        // Owner and dead address are exempt from burn
        burnExempt[initialOwner] = true;
        burnExempt[DEAD_ADDRESS] = true;
    }

    /**
     * @notice Set burn exemption for an address
     * @param account Address to set exemption for
     * @param exempt Whether the address is exempt from burn
     */
    function setBurnExempt(address account, bool exempt) external onlyOwner {
        burnExempt[account] = exempt;
        emit BurnExemptSet(account, exempt);
    }

    /**
     * @notice Batch set burn exemption for multiple addresses
     * @param accounts Addresses to set exemption for
     * @param exempt Whether the addresses are exempt from burn
     */
    function setBurnExemptBatch(address[] calldata accounts, bool exempt) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            burnExempt[accounts[i]] = exempt;
            emit BurnExemptSet(accounts[i], exempt);
        }
    }

    /**
     * @notice Override transfer to implement burn on transfer
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Skip burn for mints, burns, and exempt addresses
        if (from != address(0) && to != address(0) && !burnExempt[from] && !burnExempt[to]) {
            uint256 burnAmount = (amount * BURN_RATE) / BASIS_POINTS;
            uint256 transferAmount = amount - burnAmount;

            // Track total burned
            totalBurned += burnAmount;

            // Burn tokens by sending to dead address
            super._update(from, DEAD_ADDRESS, burnAmount);
            super._update(from, to, transferAmount);

            emit TransferBurned(from, to, transferAmount, burnAmount);
            return;
        }

        super._update(from, to, amount);
    }

    /**
     * @notice Get circulating supply (total supply minus burned)
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply() - balanceOf(DEAD_ADDRESS);
    }
}
