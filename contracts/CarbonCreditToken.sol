// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "./CarbonProjectRegistry.sol";

contract CarbonCreditToken is
    ERC1155,
    ERC1155Burnable,
    AccessControl,
    ERC1155Supply
{
    bytes32 public constant TOKEN_MANAGER_ROLE =
        keccak256("TOKEN_MANAGER_ROLE");
    CarbonProjectRegistry public projectRegistry;

    // Struct to track individual retirement records
    struct RetirementRecord {
        uint256 projectId;
        uint256 amount;
        uint256 timestamp;
        string description;
        address retiree;
    }

    // Mapping to store retirement history per user
    mapping(address => RetirementRecord[]) internal userRetirementHistory;

    // Mapping to store total retirements per project
    mapping(uint256 => uint256) internal projectTotalRetirements;

    constructor(
        address _defaultAdmin,
        address _manager,
        address _registryAddress
    ) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(TOKEN_MANAGER_ROLE, _manager);
        projectRegistry = CarbonProjectRegistry(_registryAddress);
    }

    function mintCredits(
        address _to,
        uint64 _projectId,
        uint256 _amount,
        bytes calldata _data
    ) external onlyRole(TOKEN_MANAGER_ROLE) {
        // Check if project exists
        if (!projectRegistry.projectExists(_projectId))
            revert ProjectNotFound(_projectId);
        // Get the token amount that's still up for minting
        uint256 allowedAmount = projectRegistry.getProjectIssuedCredits(_projectId) - totalSupply(_projectId);
        // Check if project has the required supply
        if (allowedAmount < _amount)
            revert MintExceedsIssuedCredits(_projectId, allowedAmount);
        // Mint tokens
        _mint(_to, _projectId, _amount, _data);
        // Emit event about new mint
        emit CreditsMinted(_to, _projectId, _amount);
    }

    function retireCredits(
        uint256 _projectId,
        uint256 _amount,
        string calldata _description
    ) external {
        // Check for user balance
        if (balanceOf(msg.sender, _projectId) < _amount) {
            revert InsufficientBalance(_projectId);
        }
        // Burn tokens
        _burn(msg.sender, _projectId, _amount);
        // Save users retirement
        userRetirementHistory[msg.sender].push(
            RetirementRecord({
                projectId: _projectId,
                amount: _amount,
                timestamp: block.timestamp,
                description: _description,
                retiree: msg.sender
            })
        );
        // update total project retirements amount
        projectTotalRetirements[_projectId] += _amount;

        // Emit event about token retirement
        emit CreditRetired(
            msg.sender,
            _projectId,
            _amount,
            block.timestamp,
            _description
        );
    }

    function getUserRetirementHistory(
        address _user
    ) external view returns (RetirementRecord[] memory) {
        return userRetirementHistory[_user];
    }

    function getProjectTotalRetirements(
        uint256 _projectId
    ) external view returns (uint256) {
        return projectTotalRetirements[_projectId];
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    error InsufficientBalance(uint256 projectId);
    error MintExceedsIssuedCredits(uint256 projectId, uint256 allowedAmount);
    error MismatchingArrayLengths();
    error ProjectNotFound(uint256 projectId);

    event CreditsMinted(
        address indexed to,
        uint256 indexed projectId,
        uint256 amount
    );

    event CreditsMintedBatch(
        address indexed to,
        uint256[] indexed projectId,
        uint256[] amount
    );

    // Event to log credit retirements
    event CreditRetired(
        address indexed retiree,
        uint256 indexed projectId,
        uint256 amount,
        uint256 timestamp,
        string emissionDescription
    );
}
