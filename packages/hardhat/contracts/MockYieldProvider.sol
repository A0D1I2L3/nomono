// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockYieldProvider
 * @dev Simulates a DeFi protocol (like Aave or Lido) for hackathon/demo use.
 * IMPORTANT FIX:
 *  - returnPrincipalAndYield() no longer reverts when contract lacks funds.
 *  - It now sends MIN(balance, requestedAmount) so "simulated yield" always works.
 */
contract MockYieldProvider {
    address public owner;
    mapping(address => bool) public authorizedPools;
    mapping(address => uint256) public poolYields;

    event PrincipalDeposited(address indexed poolAddress, uint256 amount);
    event YieldSet(address indexed poolAddress, uint256 yieldAmount);
    event PrincipalAndYieldReturned(address indexed poolAddress, uint256 totalReturn);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier onlyOwnerOrPool() {
        require(msg.sender == owner || authorizedPools[msg.sender], "Only owner or authorized pool can call");
        _;
    }

    /**
     * @dev Authorize a pool contract to call yield functions
     */
    function authorizePool(address _poolAddress) external onlyOwner {
        authorizedPools[_poolAddress] = true;
    }

    /**
     * @dev Simulated principal deposit.
     */
    function depositPrincipal(address _poolAddress, uint256 _amount) public payable {
        require(msg.value == _amount, "Deposit amount mismatch");
        emit PrincipalDeposited(_poolAddress, _amount);
        // Funds accumulate in this contract
    }

    /**
     * @dev Set simulated yield amount (manual)
     */
    function setPoolYield(address _poolAddress, uint256 _yieldAmount) public onlyOwnerOrPool {
        poolYields[_poolAddress] = _yieldAmount;
        emit YieldSet(_poolAddress, _yieldAmount);
    }

    /**
     * @dev Return principal + yield to pool.
     * FIXED: does NOT revert when mock contract lacks enough ETH.
     */
    function returnPrincipalAndYield(address _poolAddress, uint256 _requestedAmount) public onlyOwnerOrPool {
        uint256 balance = address(this).balance;

        // For demos: send whatever is available
        uint256 payout = _requestedAmount > balance ? balance : _requestedAmount;

        (bool success, ) = payable(_poolAddress).call{value: payout}("");
        require(success, "Transfer failed");

        delete poolYields[_poolAddress];

        emit PrincipalAndYieldReturned(_poolAddress, payout);
    }
}
