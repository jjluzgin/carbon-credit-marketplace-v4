// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CarbonProjectRegistry is AccessControl {
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant PROJECT_OWNER_ROLE =
        keccak256("PROJECT_OWNER_ROLE");
    uint8 public immutable mintPercentage;

    struct ProjectMetadata {
        ProjectStatus status;
        bytes32 uniqueVerificationId;
        address projectOwner;
        address auditor;
        uint256 authenticationDate;
        uint256 carbonRemoved;
        uint256 creditsIssued;
        string ipfsCID;
    }

    enum ProjectStatus {
        Pending,
        Audited,
        Rejected
    }

    mapping(uint256 => ProjectMetadata) public projects;
    uint256 private projectCount;

    mapping(bytes32 => bool) private registeredProjects;

    constructor(
        uint8 _percentageToBeMinted,
        address defaultAdmin,
        address defaultProjectOwner
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(AUDITOR_ROLE, defaultAdmin);
        _grantRole(PROJECT_OWNER_ROLE, defaultProjectOwner);
        mintPercentage = _percentageToBeMinted;
    }

    function addProject(
        uint256 _carbonReduction,
        string calldata _ipfsCID,
        string calldata _verificationId
    ) external onlyRole(PROJECT_OWNER_ROLE) {
        // Generate hash for verification ID
        bytes32 projectHash = keccak256(bytes(_verificationId));
        // Checks
        if (registeredProjects[projectHash]) revert ProjectAlreadyExists(_verificationId);
        if (_carbonReduction == 0) revert InvalidReductionAmount(_carbonReduction);
        // Create new project
        projects[projectCount] = ProjectMetadata({
            status: ProjectStatus.Pending,
            ipfsCID: _ipfsCID,
            projectOwner: msg.sender,
            auditor: address(0),
            authenticationDate: 0,
            carbonRemoved: _carbonReduction,
            uniqueVerificationId: projectHash,
            creditsIssued: 0
        });
        // Set project existance to true
        registeredProjects[projectHash] = true;
        // Emit event about a new project
        emit ProjectAdded(
            projectCount,
            msg.sender,
            _verificationId,
            ProjectStatus.Pending,
            _carbonReduction,
            _ipfsCID
        );
        projectCount++;
    }

    function updateProjectMetadata(
        uint256 _projectId,
        string calldata _newIpfsCID
    ) external {
        // Check roles, we allow Auditor and Project Owner roles
        if (
            !hasRole(PROJECT_OWNER_ROLE, msg.sender) &&
            !hasRole(AUDITOR_ROLE, msg.sender)
        ) {
            bytes32[2] memory requiredRoles = [PROJECT_OWNER_ROLE,AUDITOR_ROLE];
            revert UnauthorizedAccount(address(msg.sender), requiredRoles);
        }
        // Check if project exists
        if (!projectExists(_projectId)) revert ProjectNotFound();
        // Auditor can update already audited projects
        if (!hasRole(AUDITOR_ROLE, msg.sender)) {
            // Check if caller is actually project owner
            if (projects[_projectId].projectOwner != msg.sender)
                revert NotProjectOwner();
            // Project owner can only update Pending or Rejected projects
            if (projects[_projectId].status == ProjectStatus.Audited)
                revert ProjectAlreadyAudited();
        }else{
            // update auditor
            projects[_projectId].auditor = address(msg.sender);
        }
        // Update project
        projects[_projectId].ipfsCID = _newIpfsCID;
        projects[_projectId].status = ProjectStatus.Pending;
    }

    function getRiskCorrectedCreditAmount(
        uint256 amount
    ) internal view returns (uint256) {
        return (amount * mintPercentage) / 100;
    }

    function acceptProject(uint256 _projectId) public onlyRole(AUDITOR_ROLE) {
        // Checks
        if (!projectExists(_projectId)) revert ProjectNotFound();
        if (projects[_projectId].status != ProjectStatus.Pending) revert ProjectNotInPendingState();
        // Calculate credits to issue
        uint256 _creditsIssued = getRiskCorrectedCreditAmount(
            projects[_projectId].carbonRemoved
        );
        // Update project
        projects[_projectId].status = ProjectStatus.Audited;
        projects[_projectId].authenticationDate = block.timestamp;
        projects[_projectId].auditor = msg.sender;
        projects[_projectId].creditsIssued = _creditsIssued;
        // Emit event about status change
        emit ProjectStatusChanged(
            _projectId,
            ProjectStatus.Audited,
            msg.sender,
            _creditsIssued,
            block.timestamp
        );
    }

    function rejectProject(uint256 _projectId) public onlyRole(AUDITOR_ROLE) {
        // Checks
        if (!projectExists(_projectId)) revert ProjectNotFound();
        if (projects[_projectId].status == ProjectStatus.Audited) revert ProjectAlreadyAudited();
        // Update project
        projects[_projectId].status = ProjectStatus.Rejected;
        projects[_projectId].auditor = msg.sender;
        // Emit event about status change
        emit ProjectStatusChanged(
            _projectId,
            ProjectStatus.Rejected,
            msg.sender,
            0,
            block.timestamp
        );
    }

    function projectExists(uint256 _projectId) public view returns (bool) {
        bytes32 _uniqueVerificationId = projects[_projectId]
            .uniqueVerificationId;
        if (_uniqueVerificationId == 0) return false;
        return registeredProjects[_uniqueVerificationId];
    }

    function getProjectIssuedCredits(uint256 _projectId) public view returns (uint256) {
        return projects[_projectId].creditsIssued;
    }

    function getProjectOwner(uint256 _projectId) public view returns (address) {
        return projects[_projectId].projectOwner;
    }

    function isProjectAudited(uint256 projectId) public view returns(bool) {
        return projects[projectId].status == ProjectStatus.Audited;
    }

    error InvalidReductionAmount(uint256 carbonReduced);
    error NotProjectOwner();
    error ProjectAlreadyExists(string verificationId);
    error ProjectAlreadyAudited();
    error ProjectNotInPendingState();
    error ProjectNotFound();
    error UnauthorizedAccount(address account, bytes32[2] neededRoles);

    event ProjectAdded(
        uint256 indexed projectId,
        address indexed projectOwner,
        string verificationId,
        ProjectStatus status,
        uint256 carbonReduced,
        string ipfsCID
    );

    event ProjectStatusChanged(
        uint256 indexed projectId,
        ProjectStatus indexed newStatus,
        address indexed auditor,
        uint256 creditsIssued,
        uint256 changeTimestamp
    );
}
