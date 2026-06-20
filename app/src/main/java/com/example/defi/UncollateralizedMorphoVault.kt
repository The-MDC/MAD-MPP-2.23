package com.example.defi

/**
 * Interface mapping the Smart Contract definitions for the Uncollateralized Morpho Lending Vault.
 * This mechanic restricts micro-loans exclusively to trusted MDC Community members via Quadratic Governance.
 */
interface UncollateralizedMorphoVault {

    /** Checks if the active wallet is an approved MDC Creator/Member. */
    suspend fun isApprovedMember(walletAddress: String): Boolean

    /** Retrieves the quadratic conviction score for the user, determining their maximum uncollateralized draw. */
    suspend fun getQuadraticConvictionScore(walletAddress: String): Double

    /**
     * Given a requested loan amount, calculates the required community upvotes (quadratic scale)
     * necessary to underwrite the risk.
     */
    suspend fun calculateRequiredGovernanceVotes(loanAmountWei: Double): Int

    /** Executes the EIP-712 meta-transaction to draw the micro-loan, if governance thresholds are met. */
    suspend fun drawMicroLoan(walletAddress: String, amountUsdc: Double): Result<String>

    /** Submits a quadratic governance vote (allocating squared tokens) to back or reject a peer's loan. */
    suspend fun submitQuadraticVote(voterAddress: String, targetBorrower: String, voteWeight: Int): Result<String>

    /** Retrieves the current liquid reserves available for uncollateralized micro-lending. */
    suspend fun getAvailablePoolLiquidity(): Double
}
