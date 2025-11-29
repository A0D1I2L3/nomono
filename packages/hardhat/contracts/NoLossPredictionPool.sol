// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockYieldProvider.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NoLossPredictionPool
 * @dev A prediction market where user principal is returned regardless of the outcome.
 * The prize pool is funded entirely by yield generated from DeFi lending.
 */
contract NoLossPredictionPool is Ownable {

    // --- CONFIGURATION ---
    uint256 public constant TICKET_FEE = 0.1 ether; // 0.1 MON per participation
    uint256 public constant SPONSOR_YIELD_CUT_PERCENT = 40; // 40% of total yield goes to the sponsor

    MockYieldProvider public immutable yieldProvider;

    // --- STRUCTS & STORAGE ---
    struct Pool {
        uint256 poolId;
        string question;
        address sponsor;
        uint256 sponsorDeposit;
        uint256 participantCount;
        uint256 totalPrincipal;
        mapping(uint8 => uint256) outcomeTicketCount;
        mapping(address => uint8) userBet;
        mapping(address => bool) hasClaimed;
        uint256 bettingEndTime;
        bool isSettled;
        uint8 winningOutcomeId;
        uint256 totalYield;
    }

    uint256 public nextPoolId = 1;
    mapping(uint256 => Pool) public pools;

    // --- EVENTS & CONSTRUCTOR ---
    event PoolCreated(uint256 indexed poolId, address indexed sponsor, string question);
    event JoinedPool(uint256 indexed poolId, address indexed user, uint8 outcomeId, uint256 deposit);
    event PoolSettled(uint256 indexed poolId, uint8 winningOutcomeId, uint256 totalYield);
    event FundsClaimed(uint256 indexed poolId, address indexed user, uint256 amountClaimed);

    constructor(address _yieldProviderAddress) Ownable(msg.sender) {
        yieldProvider = MockYieldProvider(_yieldProviderAddress);
    }

    // --- MODIFIERS ---
    modifier onlySponsor(uint256 _poolId) {
        require(pools[_poolId].sponsor == msg.sender, "Caller must be the sponsor");
        _;
    }

    modifier bettingOpen(uint256 _poolId) {
        require(block.timestamp < pools[_poolId].bettingEndTime, "Betting period has ended");
        require(!pools[_poolId].isSettled, "Pool is already settled");
        _;
    }

    modifier notSettled(uint256 _poolId) {
        require(!pools[_poolId].isSettled, "Pool is already settled");
        _;
    }

    modifier isSettled(uint256 _poolId) {
        require(pools[_poolId].isSettled, "Pool is not yet settled");
        _;
    }

    // --- CORE FUNCTIONS ---

    function createPool(
        string memory _question,
        uint256 _bettingDuration
    ) external payable notSettled(nextPoolId) {
        uint256 sponsorDeposit = msg.value;
        require(sponsorDeposit > 0, "Sponsor must deposit initial capital");

        Pool storage newPool = pools[nextPoolId];
        newPool.poolId = nextPoolId;
        newPool.question = _question;
        newPool.sponsor = msg.sender;
        newPool.sponsorDeposit = sponsorDeposit;
        newPool.totalPrincipal = sponsorDeposit;
        newPool.bettingEndTime = block.timestamp + _bettingDuration;

        // Deposit principal to the yield generator
        yieldProvider.depositPrincipal{value: sponsorDeposit}(address(this), sponsorDeposit);

        emit PoolCreated(nextPoolId, msg.sender, _question);
        nextPoolId++;
    }

    function joinPool(uint256 _poolId, uint8 _outcomeId) external payable bettingOpen(_poolId) {
        Pool storage pool = pools[_poolId];
        require(msg.value == TICKET_FEE, "Must pay exactly the TICKET_FEE");
        require(pool.userBet[msg.sender] == 0, "User already participated in this pool");

        pool.userBet[msg.sender] = _outcomeId;
        pool.outcomeTicketCount[_outcomeId] = pool.outcomeTicketCount[_outcomeId] + 1;
        pool.participantCount = pool.participantCount + 1;
        pool.totalPrincipal = pool.totalPrincipal + TICKET_FEE;

        // Deposit new ticket principal to the yield generator
        yieldProvider.depositPrincipal{value: TICKET_FEE}(address(this), TICKET_FEE);

        emit JoinedPool(_poolId, msg.sender, _outcomeId, TICKET_FEE);
    }

    function settlePool(
        uint256 _poolId,
        uint8 _winningOutcomeId,
        uint256 _simulatedYield
    ) external onlySponsor(_poolId) notSettled(_poolId) {
        Pool storage pool = pools[_poolId];
        require(block.timestamp >= pool.bettingEndTime, "Betting period is not over yet");
        require(_winningOutcomeId > 0, "Winning outcome must be valid");

        pool.isSettled = true;
        pool.winningOutcomeId = _winningOutcomeId;
        pool.totalYield = _simulatedYield;

        // Set the yield in the mock provider
        yieldProvider.setPoolYield(address(this), _simulatedYield);

        // Return total funds (Principal + Yield) back to this contract
        uint256 totalReturn = pool.totalPrincipal + _simulatedYield;
        yieldProvider.returnPrincipalAndYield(address(this), totalReturn);

        emit PoolSettled(_poolId, _winningOutcomeId, _simulatedYield);
    }

    function claimFunds(uint256 _poolId) external isSettled(_poolId) {
        Pool storage pool = pools[_poolId];
        uint256 claimAmount = 0;

        // Sponsor Claim
        if (msg.sender == pool.sponsor) {
            require(!pool.hasClaimed[msg.sender], "Sponsor has already claimed");

            uint256 sponsorYieldCut = (pool.totalYield * SPONSOR_YIELD_CUT_PERCENT) / 100;
            claimAmount = pool.sponsorDeposit + sponsorYieldCut;

            pool.hasClaimed[msg.sender] = true;
        } 
        // Participant Claim
        else if (pool.userBet[msg.sender] != 0) {
            require(!pool.hasClaimed[msg.sender], "Participant has already claimed");

            // Principal is always returned (NO LOSS)
            claimAmount = TICKET_FEE;

            // Add yield share for winners
            if (pool.userBet[msg.sender] == pool.winningOutcomeId) {
                uint256 remainingYield = pool.totalYield - ((pool.totalYield * SPONSOR_YIELD_CUT_PERCENT) / 100);
                uint256 winningTickets = pool.outcomeTicketCount[pool.winningOutcomeId];
                
                if (winningTickets > 0) {
                    uint256 yieldShare = remainingYield / winningTickets;
                    claimAmount = claimAmount + yieldShare;
                }
            }

            pool.hasClaimed[msg.sender] = true;
        } else {
            revert("Address is neither sponsor nor participant in this pool");
        }

        // Send the funds
        (bool success, ) = payable(msg.sender).call{value: claimAmount}("");
        require(success, "ETH transfer failed");

        emit FundsClaimed(_poolId, msg.sender, claimAmount);
    }

    // --- VIEW FUNCTIONS ---

    /**
     * @dev Returns pool details. Note: This is a simplified version.
     * For full details, you may need separate getter functions for mappings.
     */
    function getPoolDetails(uint256 _poolId) external view returns (
        uint256 poolId,
        string memory question,
        address sponsor,
        uint256 sponsorDeposit,
        uint256 participantCount,
        uint256 totalPrincipal,
        uint256 bettingEndTime,
        bool settled,
        uint8 winningOutcomeId,
        uint256 totalYield
    ) {
        Pool storage pool = pools[_poolId];
        return (
            pool.poolId,
            pool.question,
            pool.sponsor,
            pool.sponsorDeposit,
            pool.participantCount,
            pool.totalPrincipal,
            pool.bettingEndTime,
            pool.isSettled,
            pool.winningOutcomeId,
            pool.totalYield
        );
    }

    /**
     * @dev Get user's bet for a specific pool
     */
    function getUserBet(uint256 _poolId, address _user) external view returns (uint8) {
        return pools[_poolId].userBet[_user];
    }

    /**
     * @dev Check if user has claimed for a pool
     */
    function hasUserClaimed(uint256 _poolId, address _user) external view returns (bool) {
        return pools[_poolId].hasClaimed[_user];
    }

    /**
     * @dev Get outcome ticket count for a pool
     */
    function getOutcomeTicketCount(uint256 _poolId, uint8 _outcomeId) external view returns (uint256) {
        return pools[_poolId].outcomeTicketCount[_outcomeId];
    }
}

