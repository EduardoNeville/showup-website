// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChallengeEscrow
 * @notice Implements the Showup Guarantor Model for challenge-based escrow
 * @dev Handles USDC deposits, guarantor voting, and Path of Redemption (PoR) logic
 * 
 * States:
 * - ACTIVE: Challenge is ongoing, funds are locked
 * - COMPLETED: User succeeded, funds returned
 * - FAILED_PENDING_INSURANCE: User failed, guarantors voting on PoR
 * - REMEDIATION_ACTIVE: PoR approved, user has second chance
 * - FAILED_FINAL: No redemption, funds forfeited
 */
contract ChallengeEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum ChallengeState {
        ACTIVE,
        COMPLETED,
        FAILED_PENDING_INSURANCE,
        REMEDIATION_ACTIVE,
        FAILED_FINAL
    }

    // ============ Structs ============

    struct Challenge {
        address user;
        uint256 amount;
        ChallengeState state;
        uint256 createdAt;
        uint256 endTime;
        uint256 votingDeadline;
        uint256 remediationDeadline;
        string metadataUri; // IPFS hash for challenge details
    }

    struct VotingState {
        address[] guarantors;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteValue; // true = approve PoR
        uint256 yesVotes;
        uint256 noVotes;
        uint256 requiredVotes;
    }

    // ============ State Variables ============

    IERC20 public immutable usdcToken;
    
    // Challenge storage
    mapping(bytes32 => Challenge) public challenges;
    mapping(bytes32 => VotingState) private votingStates;
    
    // Configuration
    uint256 public constant VOTING_PERIOD = 24 hours;
    uint256 public constant REMEDIATION_PERIOD = 7 days;
    uint256 public constant MIN_DEPOSIT = 1 * 10**6; // $1 USDC (6 decimals)
    uint256 public constant MAX_DEPOSIT = 10000 * 10**6; // $10,000 USDC
    
    // Platform fee (can be 0 for MVP)
    uint256 public platformFeeBps = 0; // Basis points (100 = 1%)
    address public feeRecipient;
    
    // Treasury for failed challenges
    address public treasury;

    // ============ Events ============

    event ChallengeCreated(
        bytes32 indexed challengeId,
        address indexed user,
        uint256 amount,
        address[] guarantors,
        uint256 endTime,
        string metadataUri
    );

    event ChallengeStateChanged(
        bytes32 indexed challengeId,
        ChallengeState previousState,
        ChallengeState newState
    );

    event VoteCast(
        bytes32 indexed challengeId,
        address indexed guarantor,
        bool approveRedemption,
        uint256 yesVotes,
        uint256 noVotes
    );

    event FundsReleased(
        bytes32 indexed challengeId,
        address indexed recipient,
        uint256 amount
    );

    event FundsForfeited(
        bytes32 indexed challengeId,
        address indexed user,
        uint256 amount
    );

    event RemediationStarted(
        bytes32 indexed challengeId,
        uint256 deadline
    );

    // ============ Errors ============

    error InvalidAmount();
    error InvalidGuarantors();
    error ChallengeNotFound();
    error InvalidState(ChallengeState expected, ChallengeState actual);
    error NotAuthorized();
    error AlreadyVoted();
    error NotGuarantor();
    error VotingPeriodEnded();
    error VotingPeriodActive();
    error RemediationPeriodEnded();
    error ChallengeNotEnded();
    error TransferFailed();

    // ============ Constructor ============

    constructor(
        address _usdcToken,
        address _treasury,
        address _owner
    ) Ownable(_owner) {
        usdcToken = IERC20(_usdcToken);
        treasury = _treasury;
        feeRecipient = _owner;
    }

    // ============ External Functions ============

    /**
     * @notice Creates a new challenge with USDC deposit
     * @param challengeId Unique identifier (can be hash of off-chain challenge ID)
     * @param _guarantors Array of guarantor addresses
     * @param _amount Amount of USDC to deposit (6 decimals)
     * @param _duration Challenge duration in seconds
     * @param _metadataUri IPFS URI for challenge metadata
     * @dev User must approve this contract to spend USDC first
     */
    function createChallenge(
        bytes32 challengeId,
        address[] calldata _guarantors,
        uint256 _amount,
        uint256 _duration,
        string calldata _metadataUri
    ) external nonReentrant {
        // Validations
        if (_amount < MIN_DEPOSIT || _amount > MAX_DEPOSIT) revert InvalidAmount();
        if (_guarantors.length == 0 || _guarantors.length > 10) revert InvalidGuarantors();
        if (challenges[challengeId].user != address(0)) revert InvalidState(ChallengeState.ACTIVE, challenges[challengeId].state);
        
        // Validate guarantors are unique and not the user
        for (uint256 i = 0; i < _guarantors.length; i++) {
            if (_guarantors[i] == msg.sender || _guarantors[i] == address(0)) {
                revert InvalidGuarantors();
            }
            for (uint256 j = i + 1; j < _guarantors.length; j++) {
                if (_guarantors[i] == _guarantors[j]) revert InvalidGuarantors();
            }
        }

        // Transfer USDC from user to contract
        usdcToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Create challenge
        challenges[challengeId] = Challenge({
            user: msg.sender,
            amount: _amount,
            state: ChallengeState.ACTIVE,
            createdAt: block.timestamp,
            endTime: block.timestamp + _duration,
            votingDeadline: 0,
            remediationDeadline: 0,
            metadataUri: _metadataUri
        });

        // Initialize voting state
        VotingState storage vs = votingStates[challengeId];
        vs.guarantors = _guarantors;
        vs.requiredVotes = (_guarantors.length / 2) + 1; // Simple majority

        emit ChallengeCreated(
            challengeId,
            msg.sender,
            _amount,
            _guarantors,
            block.timestamp + _duration,
            _metadataUri
        );
    }

    /**
     * @notice Reports challenge failure and initiates voting
     * @param challengeId The challenge to report as failed
     * @dev Can be called by user (self-report) or by authorized oracle
     */
    function reportFailure(bytes32 challengeId) external {
        Challenge storage c = challenges[challengeId];
        
        if (c.user == address(0)) revert ChallengeNotFound();
        if (c.state != ChallengeState.ACTIVE) {
            revert InvalidState(ChallengeState.ACTIVE, c.state);
        }
        
        // For now, only user can report failure (oracle integration later)
        if (msg.sender != c.user) revert NotAuthorized();
        
        // Must be after challenge end time
        if (block.timestamp < c.endTime) revert ChallengeNotEnded();

        ChallengeState previousState = c.state;
        c.state = ChallengeState.FAILED_PENDING_INSURANCE;
        c.votingDeadline = block.timestamp + VOTING_PERIOD;

        emit ChallengeStateChanged(challengeId, previousState, c.state);
    }

    /**
     * @notice Guarantor casts vote on Path of Redemption
     * @param challengeId The challenge to vote on
     * @param approveRedemption True to approve PoR, false to reject
     */
    function castVote(bytes32 challengeId, bool approveRedemption) external {
        Challenge storage c = challenges[challengeId];
        VotingState storage vs = votingStates[challengeId];

        if (c.user == address(0)) revert ChallengeNotFound();
        if (c.state != ChallengeState.FAILED_PENDING_INSURANCE) {
            revert InvalidState(ChallengeState.FAILED_PENDING_INSURANCE, c.state);
        }
        if (block.timestamp > c.votingDeadline) revert VotingPeriodEnded();
        if (vs.hasVoted[msg.sender]) revert AlreadyVoted();

        // Verify sender is a guarantor
        bool isGuarantor = false;
        for (uint256 i = 0; i < vs.guarantors.length; i++) {
            if (vs.guarantors[i] == msg.sender) {
                isGuarantor = true;
                break;
            }
        }
        if (!isGuarantor) revert NotGuarantor();

        // Record vote
        vs.hasVoted[msg.sender] = true;
        vs.voteValue[msg.sender] = approveRedemption;
        
        if (approveRedemption) {
            vs.yesVotes++;
        } else {
            vs.noVotes++;
        }

        emit VoteCast(
            challengeId,
            msg.sender,
            approveRedemption,
            vs.yesVotes,
            vs.noVotes
        );

        // Check if vote threshold reached
        if (vs.yesVotes >= vs.requiredVotes) {
            _startRemediation(challengeId);
        } else if (vs.noVotes > vs.guarantors.length - vs.requiredVotes) {
            // Impossible to reach yes threshold
            _finalizeFailed(challengeId);
        }
    }

    /**
     * @notice Finalizes voting after deadline
     * @param challengeId The challenge to finalize
     */
    function finalizeVoting(bytes32 challengeId) external {
        Challenge storage c = challenges[challengeId];
        VotingState storage vs = votingStates[challengeId];

        if (c.user == address(0)) revert ChallengeNotFound();
        if (c.state != ChallengeState.FAILED_PENDING_INSURANCE) {
            revert InvalidState(ChallengeState.FAILED_PENDING_INSURANCE, c.state);
        }
        if (block.timestamp <= c.votingDeadline) revert VotingPeriodActive();

        // Check final vote count
        if (vs.yesVotes >= vs.requiredVotes) {
            _startRemediation(challengeId);
        } else {
            _finalizeFailed(challengeId);
        }
    }

    /**
     * @notice Completes a challenge successfully (happy path or after remediation)
     * @param challengeId The challenge to complete
     * @dev Can be called by any guarantor to confirm success
     */
    function completeChallenge(bytes32 challengeId) external {
        Challenge storage c = challenges[challengeId];
        VotingState storage vs = votingStates[challengeId];

        if (c.user == address(0)) revert ChallengeNotFound();
        if (c.state != ChallengeState.ACTIVE && c.state != ChallengeState.REMEDIATION_ACTIVE) {
            revert InvalidState(ChallengeState.ACTIVE, c.state);
        }

        // Only guarantors or user (after end time) can complete
        bool isGuarantor = false;
        for (uint256 i = 0; i < vs.guarantors.length; i++) {
            if (vs.guarantors[i] == msg.sender) {
                isGuarantor = true;
                break;
            }
        }
        
        // User can self-complete after challenge end time if no guarantor has acted
        bool canUserComplete = msg.sender == c.user && block.timestamp >= c.endTime;
        
        if (!isGuarantor && !canUserComplete) revert NotAuthorized();

        ChallengeState previousState = c.state;
        c.state = ChallengeState.COMPLETED;

        // Calculate and transfer funds
        uint256 fee = (c.amount * platformFeeBps) / 10000;
        uint256 userAmount = c.amount - fee;

        if (fee > 0 && feeRecipient != address(0)) {
            usdcToken.safeTransfer(feeRecipient, fee);
        }
        usdcToken.safeTransfer(c.user, userAmount);

        emit ChallengeStateChanged(challengeId, previousState, c.state);
        emit FundsReleased(challengeId, c.user, userAmount);
    }

    /**
     * @notice Finalizes remediation period as failed
     * @param challengeId The challenge to finalize
     */
    function finalizeRemediation(bytes32 challengeId) external {
        Challenge storage c = challenges[challengeId];

        if (c.user == address(0)) revert ChallengeNotFound();
        if (c.state != ChallengeState.REMEDIATION_ACTIVE) {
            revert InvalidState(ChallengeState.REMEDIATION_ACTIVE, c.state);
        }
        if (block.timestamp <= c.remediationDeadline) revert RemediationPeriodEnded();

        _finalizeFailed(challengeId);
    }

    // ============ View Functions ============

    /**
     * @notice Gets challenge details
     */
    function getChallenge(bytes32 challengeId) external view returns (
        address user,
        uint256 amount,
        ChallengeState state,
        uint256 createdAt,
        uint256 endTime,
        uint256 votingDeadline,
        uint256 remediationDeadline,
        string memory metadataUri
    ) {
        Challenge storage c = challenges[challengeId];
        return (
            c.user,
            c.amount,
            c.state,
            c.createdAt,
            c.endTime,
            c.votingDeadline,
            c.remediationDeadline,
            c.metadataUri
        );
    }

    /**
     * @notice Gets voting state for a challenge
     */
    function getVotingState(bytes32 challengeId) external view returns (
        address[] memory guarantors,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 requiredVotes
    ) {
        VotingState storage vs = votingStates[challengeId];
        return (vs.guarantors, vs.yesVotes, vs.noVotes, vs.requiredVotes);
    }

    /**
     * @notice Checks if an address has voted
     */
    function hasVoted(bytes32 challengeId, address voter) external view returns (bool) {
        return votingStates[challengeId].hasVoted[voter];
    }

    /**
     * @notice Gets vote value for an address
     */
    function getVote(bytes32 challengeId, address voter) external view returns (bool) {
        return votingStates[challengeId].voteValue[voter];
    }

    // ============ Admin Functions ============

    /**
     * @notice Updates platform fee
     * @param _feeBps New fee in basis points
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = _feeBps;
    }

    /**
     * @notice Updates fee recipient
     */
    function setFeeRecipient(address _recipient) external onlyOwner {
        feeRecipient = _recipient;
    }

    /**
     * @notice Updates treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    // ============ Internal Functions ============

    function _startRemediation(bytes32 challengeId) internal {
        Challenge storage c = challenges[challengeId];
        ChallengeState previousState = c.state;
        c.state = ChallengeState.REMEDIATION_ACTIVE;
        c.remediationDeadline = block.timestamp + REMEDIATION_PERIOD;

        emit ChallengeStateChanged(challengeId, previousState, c.state);
        emit RemediationStarted(challengeId, c.remediationDeadline);
    }

    function _finalizeFailed(bytes32 challengeId) internal {
        Challenge storage c = challenges[challengeId];
        ChallengeState previousState = c.state;
        c.state = ChallengeState.FAILED_FINAL;

        // Send funds to treasury
        if (treasury != address(0)) {
            usdcToken.safeTransfer(treasury, c.amount);
        }

        emit ChallengeStateChanged(challengeId, previousState, c.state);
        emit FundsForfeited(challengeId, c.user, c.amount);
    }
}
