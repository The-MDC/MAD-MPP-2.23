// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Errors {
    error MarketNotResolved();
    error MarketNotActive();
    error InvalidOutcome();
    error InsufficientPayment();
    error InsufficientShares();
    error ZeroAddress();
    error InvalidAmount();
    error InvalidTokenId();
    error NotTokenOwner();
    error CardNotActive();
    error MaxSupplyReached();
    error PackNotActive();
    error PackExpired();
    error EvolutionInProgress();
    error MaxEvolutionAttempts();
    error Unauthorized();
    error InvalidCardIds();
    error InvalidAmounts();
    error InvalidBuzzScore();
    error MarketAlreadyResolved();
    error MarketExpired();
    error MaxSupplyExceeded();
    error BurnCapExceeded();
    error InvalidTransactionType();
    error InvalidCardId();
    error InvalidFactionId();
    error InsufficientBalance();
    error InsufficientContractBalance();
    error EvolutionFailed();
    error ArrayLengthMismatch();
    error InvalidMetadata();
    error MetadataTooLong();
    error InvalidURI();
    error PoolNotSet();
    error SwapFailed();
    error InsufficientStake();
    error ExcessiveStake();
    error AlreadyClaimed();
    error DisputePeriodExpired();
    error OracleVerificationFailed();
    error InvalidAsset();
    error InvalidPriceFeed();
    error InsufficientData();
    error GARCHConstraintViolation();
    error StalePrice();
    error PositionNotActive();
    error LockPeriodNotMet();
    error PositionAlreadyExists();
    error ClaimAlreadyProcessed();
    error InsufficientInsurancePool();
    error TransferFailed();
    error InvalidParameter();
}
    // DutchAuction errors
    error AuctionNotActive();
    error AuctionExpired();
    error PriceBelowMinimum();
    error MaxPacksPurchased();
    error InsufficientPaymentForPack();
    error AuctionAlreadyExists();
    
    // MarketFactory errors  
    error MarketAlreadyExists();
    error InvalidEndTime();
    error InvalidOutcomes();
    error MarketNotFound();
    error CreatorCannotBeSelf();
    error TooManyOutcomes();
    error EndTimeTooSoon();
    error EndTimeTooFar();
