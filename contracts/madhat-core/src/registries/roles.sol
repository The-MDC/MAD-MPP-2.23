// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title RolesRegistry
/// @notice Centralized role management, reusable across contracts
/// @dev Optimized for gas efficiency and enhanced security
contract RolesRegistry is Initializable, AccessControlUpgradeable {
    using Address for address;

    /// @notice Role identifier for updater
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    
    /// @notice Emitted when multiple roles are granted in batch
    event RolesBatchGranted(bytes32[] roles, address[] accounts);
    
    /// @notice Emitted when multiple roles are revoked in batch
    event RolesBatchRevoked(bytes32[] roles, address[] accounts);
    
    /// @notice Emitted when multiple roles are granted to single account
    event MultiRolesGranted(address account, bytes32[] roles);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract with admin address
    /// @param admin The address to grant default admin and updater roles
    function initialize(address admin) public initializer {
        require(admin != address(0), "RolesRegistry: admin cannot be zero address");
        
        __AccessControl_init();

        // Default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, admin);

        // Admin is also default updater
        _grantRole(UPDATER_ROLE, admin);
    }

    /// @notice Adds a role to an account
    /// @param role The role to grant
    /// @param account The address to grant the role to
    function addRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "RolesRegistry: account cannot be zero address");
        require(!hasRole(role, account), "RolesRegistry: account already has role");
        
        _grantRole(role, account);
        emit RoleGranted(role, account, msg.sender);
    }

    /// @notice Removes a role from an account
    /// @param role The role to revoke
    /// @param account The address to revoke the role from
    function removeRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "RolesRegistry: account cannot be zero address");
        require(hasRole(role, account), "RolesRegistry: account does not have role");
        
        _revokeRole(role, account);
        emit RoleRevoked(role, account, msg.sender);
    }
    
    /// @notice Batch adds roles to multiple accounts
    /// @param roles Array of roles to grant
    /// @param accounts Array of addresses to grant roles to
    function batchAddRoles(bytes32[] calldata roles, address[] calldata accounts) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(roles.length == accounts.length, "RolesRegistry: arrays length mismatch");
        require(roles.length > 0, "RolesRegistry: empty arrays not allowed");
        
        for (uint256 i = 0; i < roles.length; i++) {
            require(accounts[i] != address(0), "RolesRegistry: account cannot be zero address");
            if (!hasRole(roles[i], accounts[i])) {
                _grantRole(roles[i], accounts[i]);
            }
        }
        
        emit RolesBatchGranted(roles, accounts);
    }
    
    /// @notice Batch removes roles from multiple accounts
    /// @param roles Array of roles to revoke
    /// @param accounts Array of addresses to revoke roles from
    function batchRemoveRoles(bytes32[] calldata roles, address[] calldata accounts) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(roles.length == accounts.length, "RolesRegistry: arrays length mismatch");
        require(roles.length > 0, "RolesRegistry: empty arrays not allowed");
        
        for (uint256 i = 0; i < roles.length; i++) {
            require(accounts[i] != address(0), "RolesRegistry: account cannot be zero address");
            if (hasRole(roles[i], accounts[i])) {
                _revokeRole(roles[i], accounts[i]);
            }
        }
        
        emit RolesBatchRevoked(roles, accounts);
    }

    /// @notice Checks if an account has a specific role
    /// @param role The role to check
    /// @param account The address to check
    /// @return bool True if the account has the role
    function isRole(bytes32 role, address account) external view returns (bool) {
        return hasRole(role, account);
    }
    
    /// @notice Gets all roles for an account (limited implementation for gas efficiency)
    /// @param account The address to check
    /// @return hasAdminRole True if account has admin role
    /// @return hasUpdaterRole True if account has updater role
    function getAccountRoles(address account) external view returns (bool hasAdminRole, bool hasUpdaterRole) {
        return (
            hasRole(DEFAULT_ADMIN_ROLE, account),
            hasRole(UPDATER_ROLE, account)
        );
    }
    
    /// @notice Renounces role (only callable by role holder)
    /// @param role The role to renounce
    function renounceRole(bytes32 role) external {
        require(hasRole(role, msg.sender), "RolesRegistry: caller does not have role");
        _revokeRole(role, msg.sender);
        emit RoleRevoked(role, msg.sender, msg.sender);
    }
    
    /// @notice Grants multiple roles to a single account
    /// @param account The address to grant roles to
    /// @param roles Array of roles to grant
    function grantMultipleRoles(address account, bytes32[] calldata roles) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(account != address(0), "RolesRegistry: account cannot be zero address");
        require(roles.length > 0, "RolesRegistry: empty roles array not allowed");
        
        for (uint256 i = 0; i < roles.length; i++) {
            if (!hasRole(roles[i], account)) {
                _grantRole(roles[i], account);
                emit RoleGranted(roles[i], account, msg.sender);
            }
        }
        
        emit MultiRolesGranted(account, roles);
    }
    
    /// @notice Revokes multiple roles from a single account
    /// @param account The address to revoke roles from
    /// @param roles Array of roles to revoke
    function revokeMultipleRoles(address account, bytes32[] calldata roles) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(account != address(0), "RolesRegistry: account cannot be zero address");
        require(roles.length > 0, "RolesRegistry: empty roles array not allowed");
        
        for (uint256 i = 0; i < roles.length; i++) {
            if (hasRole(roles[i], account)) {
                _revokeRole(roles[i], account);
                emit RoleRevoked(roles[i], account, msg.sender);
            }
        }
    }
}
