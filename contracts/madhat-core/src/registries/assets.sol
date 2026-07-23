// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./roles.sol";

contract AssetsRegistry is Initializable, UUPSUpgradeable, OwnableUpgradeable, AccessControlUpgradeable {

    RolesRegistry public roles;

    struct Asset {
        string name;
        uint8 volatility; // 0-100
        uint8 clout;      // 0-100
        uint8 faction;    // 1=Politicos, 2=Disruptors, 3=Pop Icons
        bool exists;
    }

    mapping(uint256 => Asset) private assets;

    // Event ketika asset diupdate/ditambahkan
    event AssetSet(uint256 indexed id, string name, uint8 volatility, uint8 clout, uint8 faction);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // disable constructor untuk upgradeable
    }

    function initialize(address rolesAddress, address owner) public initializer {
        __Ownable_init(owner);
        __AccessControl_init();
        
        // Grant DEFAULT_ADMIN_ROLE to the contract owner
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        
        roles = RolesRegistry(rolesAddress);
    }

    // UUPS upgrade authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setAsset(
        uint256 id,
        string memory name,
        uint8 volatility,
        uint8 clout,
        uint8 faction
    ) external onlyOwner {
        assets[id] = Asset({
            name: name,
            volatility: volatility,
            clout: clout,
            faction: faction,
            exists: true
        });
        emit AssetSet(id, name, volatility, clout, faction);
    }

    function updateAsset(
        uint256 id,
        uint8 volatility,
        uint8 clout,
        uint8 faction
    ) external {
        require(roles.isRole(roles.UPDATER_ROLE(), msg.sender), "Not authorized");
        require(assets[id].exists, "Asset not found");

        Asset storage a = assets[id];
        a.volatility = volatility;
        a.clout = clout;
        a.faction = faction;

        emit AssetSet(id, a.name, volatility, clout, faction);
    }

    function getAsset(uint256 id) external view returns (string memory name, uint8 volatility, uint8 clout, uint8 faction) {
        require(assets[id].exists, "Asset not found");
        Asset storage a = assets[id];
        return (a.name, a.volatility, a.clout, a.faction);
    }

    function assetExists(uint256 id) external view returns (bool) {
        return assets[id].exists;
    }

    function getAssetFaction(uint256 id) external view returns (uint8) {
        require(assets[id].exists, "Asset not found");
        return assets[id].faction;
    }

}
