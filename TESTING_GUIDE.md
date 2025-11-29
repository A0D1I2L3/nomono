# Testing Guide: No-Loss Prediction Pool dApp

This guide covers all aspects of testing your No-Loss Prediction Pool dApp, from local development to Monad testnet deployment.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Local Testing Setup](#local-testing-setup)
3. [Frontend Testing](#frontend-testing)
4. [Monad Testnet Configuration](#monad-testnet-configuration)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Contract Testing](#contract-testing)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Option 1: Test Locally (Recommended for Development)
```bash
# Terminal 1: Start local blockchain
yarn chain

# Terminal 2: Deploy contracts locally
yarn deploy

# Terminal 3: Start frontend
yarn start
```

Then open `http://localhost:3000` in your browser.

### Option 2: Test on Monad Testnet
1. Configure Monad testnet (see [Monad Testnet Configuration](#monad-testnet-configuration))
2. Deploy contracts to Monad testnet
3. Update `deployedContracts.ts` with contract addresses
4. Start frontend: `yarn start`

---

## Local Testing Setup

### 1. Start Local Blockchain

```bash
yarn chain
```

This starts a local Hardhat node with 20 pre-funded accounts. Keep this terminal running.

### 2. Deploy Contracts Locally

In a new terminal:

```bash
yarn deploy
```

This will:
- Deploy `NoLossPredictionPool` and `MockYieldProvider` contracts
- Generate TypeScript types
- Update `packages/nextjs/contracts/deployedContracts.ts`

### 3. Verify Deployment

Check that contracts are deployed:
```bash
# Check deployed contracts
cat packages/nextjs/contracts/deployedContracts.ts
```

You should see entries for `NoLossPredictionPool` and `MockYieldProvider` under the Hardhat chain ID (31337).

### 4. Start Frontend

```bash
yarn start
```

Open `http://localhost:3000` and connect your wallet (use the burner wallet or MetaMask with local network).

---

## Frontend Testing

### Testing Checklist

#### ✅ Wallet Connection
- [ ] Connect wallet using the header button
- [ ] Verify connected address displays correctly
- [ ] Test wallet disconnection

#### ✅ Pool Creation (Section 1)
- [ ] Fill in question field (e.g., "Will Monad hit 100k TPS by EOY?")
- [ ] Enter betting duration (e.g., 86400 for 24 hours)
- [ ] Enter sponsor deposit (minimum 0.1 MON)
- [ ] Click "Create Pool" button
- [ ] Verify transaction succeeds
- [ ] Check that new pool appears in Active Pools list
- [ ] Test validation (try creating with < 0.1 MON deposit)

#### ✅ Joining Pools (Section 2)
- [ ] View active pools list
- [ ] Select "Yes" or "No" outcome for a pool
- [ ] Click "Join" button
- [ ] Verify transaction includes 0.1 MON (TICKET_FEE)
- [ ] Check that participant count increases
- [ ] Test joining multiple pools
- [ ] Verify countdown timer updates correctly

#### ✅ Pool Settlement (Section 3)
- [ ] Create a pool as sponsor
- [ ] Wait for betting period to end (or use time manipulation in local test)
- [ ] Verify pool appears in "Settle Pool" section
- [ ] Select pool from dropdown
- [ ] Choose winning outcome (1 for Yes, 2 for No)
- [ ] Enter simulated yield amount
- [ ] Click "Declare Winner & Settle"
- [ ] Verify transaction succeeds
- [ ] Check that pool status changes to "Settled"

#### ✅ Claiming Funds (Section 4)
- [ ] As sponsor: Claim funds from settled pool
- [ ] As winner: Claim principal + yield share
- [ ] As loser: Claim principal only
- [ ] Verify correct amounts are claimed
- [ ] Test that `hasClaimed` prevents double claiming

### Testing with Multiple Accounts

For comprehensive testing, use multiple wallet accounts:

1. **Account 1 (Sponsor)**: Create pools
2. **Account 2 (Participant)**: Join pools with different outcomes
3. **Account 3 (Participant)**: Join pools with different outcomes
4. **Account 1**: Settle pools after betting ends
5. **All Accounts**: Claim funds

### Local Account Setup

Get local account addresses and private keys:
```bash
yarn account
```

Import these accounts into MetaMask for testing with multiple wallets.

---

## Monad Testnet Configuration

### Step 1: Add Monad Testnet to Hardhat Config

Edit `packages/hardhat/hardhat.config.ts`:

```typescript
networks: {
  // ... existing networks ...
  monad_testnet: {
    url: "https://testnet-rpc.monad.xyz", // Update with actual Monad testnet RPC
    chainId: 41443, // Update with actual Monad testnet chain ID
    accounts: [deployerPrivateKey],
  },
}
```

### Step 2: Add Monad Testnet to Scaffold Config

Edit `packages/nextjs/scaffold.config.ts`:

```typescript
import { defineChain } from "viem";

// Define Monad testnet chain
const monadTestnet = defineChain({
  id: 41443, // Update with actual chain ID
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"], // Update with actual RPC URL
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet-explorer.monad.xyz", // Update if available
    },
  },
  testnet: true,
});

const scaffoldConfig = {
  targetNetworks: [monadTestnet], // Change from [chains.hardhat]
  // ... rest of config
};
```

### Step 3: Deploy to Monad Testnet

```bash
# Deploy contracts to Monad testnet
yarn deploy --network monad_testnet
```

### Step 4: Update deployedContracts.ts

After deployment, the `deployedContracts.ts` file should be auto-generated with Monad testnet addresses. Verify:

```typescript
const deployedContracts = {
  41443: { // Monad testnet chain ID
    NoLossPredictionPool: {
      address: "0x...", // Your deployed address
      abi: [...],
    },
    MockYieldProvider: {
      address: "0x...",
      abi: [...],
    },
  },
} as const;
```

### Step 5: Get Testnet MON

You'll need MON tokens for gas and testing:
- Use a Monad testnet faucet (if available)
- Or request from Monad team/discord

### Step 6: Test on Monad Testnet

1. Connect wallet to Monad testnet
2. Ensure you have MON for gas
3. Test all functionality as described in [Frontend Testing](#frontend-testing)

---

## Manual Testing Checklist

### Complete User Flow Test

#### Test Scenario 1: Full Pool Lifecycle
1. **Setup**: Connect wallet with sufficient MON
2. **Create Pool**: 
   - Question: "Will Monad mainnet launch in Q1 2025?"
   - Duration: 3600 (1 hour for testing)
   - Deposit: 1.0 MON
3. **Join Pool** (as different user):
   - Join with "Yes" outcome
   - Join with "No" outcome (different account)
4. **Wait**: Let betting period expire
5. **Settle Pool** (as sponsor):
   - Winning outcome: 1 (Yes)
   - Simulated yield: 0.5 MON
6. **Claim Funds**:
   - Sponsor claims (should get principal + 40% yield)
   - Winner claims (should get principal + yield share)
   - Loser claims (should get principal only)

#### Test Scenario 2: Edge Cases
- [ ] Create pool with minimum deposit (0.1 MON)
- [ ] Try to join pool after betting period ends (should fail)
- [ ] Try to settle pool before betting ends (should fail)
- [ ] Try to claim from unsettled pool (should fail)
- [ ] Try to claim twice (should fail)
- [ ] Create pool with very long duration
- [ ] Create pool with very short duration

#### Test Scenario 3: UI/UX
- [ ] Responsive design on mobile
- [ ] All buttons have loading states
- [ ] Error messages display correctly
- [ ] Success notifications appear
- [ ] Countdown timers update in real-time
- [ ] Addresses are properly truncated
- [ ] Amounts display with correct decimals

---

## Contract Testing

### Writing Hardhat Tests

Create test file: `packages/hardhat/test/NoLossPredictionPool.test.ts`

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { NoLossPredictionPool, MockYieldProvider } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NoLossPredictionPool", function () {
  let pool: NoLossPredictionPool;
  let yieldProvider: MockYieldProvider;
  let owner: any;
  let sponsor: any;
  let participant1: any;
  let participant2: any;

  const TICKET_FEE = ethers.parseEther("0.1");
  const SPONSOR_DEPOSIT = ethers.parseEther("1.0");

  beforeEach(async () => {
    [owner, sponsor, participant1, participant2] = await ethers.getSigners();

    // Deploy MockYieldProvider
    const YieldProviderFactory = await ethers.getContractFactory("MockYieldProvider");
    yieldProvider = await YieldProviderFactory.deploy();
    await yieldProvider.waitForDeployment();

    // Deploy NoLossPredictionPool
    const PoolFactory = await ethers.getContractFactory("NoLossPredictionPool");
    pool = await PoolFactory.deploy(await yieldProvider.getAddress());
    await pool.waitForDeployment();
  });

  describe("Pool Creation", function () {
    it("Should create a new pool with correct parameters", async function () {
      const question = "Will Monad hit 100k TPS?";
      const duration = 86400; // 24 hours

      await expect(
        pool.connect(sponsor).createPool(question, duration, { value: SPONSOR_DEPOSIT })
      ).to.emit(pool, "PoolCreated");

      const poolDetails = await pool.getPoolDetails(0);
      expect(poolDetails.question).to.equal(question);
      expect(poolDetails.sponsor).to.equal(sponsor.address);
      expect(poolDetails.totalPrincipal).to.equal(SPONSOR_DEPOSIT);
    });

    it("Should reject pool creation with insufficient deposit", async function () {
      const question = "Test question";
      const duration = 86400;
      const insufficientDeposit = ethers.parseEther("0.05"); // Less than 0.1

      await expect(
        pool.connect(sponsor).createPool(question, duration, { value: insufficientDeposit })
      ).to.be.revertedWith("Insufficient sponsor deposit");
    });
  });

  describe("Joining Pools", function () {
    beforeEach(async () => {
      const question = "Test question";
      const duration = 86400;
      await pool.connect(sponsor).createPool(question, duration, { value: SPONSOR_DEPOSIT });
    });

    it("Should allow participants to join with correct fee", async function () {
      await expect(
        pool.connect(participant1).joinPool(0, 1, { value: TICKET_FEE })
      ).to.emit(pool, "ParticipantJoined");

      const poolDetails = await pool.getPoolDetails(0);
      expect(poolDetails.participantCount).to.equal(1);
      expect(poolDetails.totalPrincipal).to.equal(SPONSOR_DEPOSIT + TICKET_FEE);
    });

    it("Should reject joining with incorrect fee", async function () {
      const wrongFee = ethers.parseEther("0.05");
      await expect(
        pool.connect(participant1).joinPool(0, 1, { value: wrongFee })
      ).to.be.revertedWith("Incorrect ticket fee");
    });
  });

  describe("Pool Settlement", function () {
    beforeEach(async () => {
      const question = "Test question";
      const duration = 3600; // 1 hour
      await pool.connect(sponsor).createPool(question, duration, { value: SPONSOR_DEPOSIT });
      await pool.connect(participant1).joinPool(0, 1, { value: TICKET_FEE });
      await pool.connect(participant2).joinPool(0, 2, { value: TICKET_FEE });
      
      // Fast forward time
      await time.increase(3601);
    });

    it("Should allow sponsor to settle pool", async function () {
      const winningOutcome = 1;
      const simulatedYield = ethers.parseEther("0.5");

      await expect(
        pool.connect(sponsor).settlePool(0, winningOutcome, simulatedYield)
      ).to.emit(pool, "PoolSettled");

      const poolDetails = await pool.getPoolDetails(0);
      expect(poolDetails.isSettled).to.be.true;
      expect(poolDetails.winningOutcomeId).to.equal(winningOutcome);
    });

    it("Should reject settlement before betting period ends", async function () {
      // Create new pool
      await pool.connect(sponsor).createPool("New question", 86400, { value: SPONSOR_DEPOSIT });
      
      await expect(
        pool.connect(sponsor).settlePool(1, 1, ethers.parseEther("0.5"))
      ).to.be.revertedWith("Betting period not ended");
    });
  });

  describe("Claiming Funds", function () {
    beforeEach(async () => {
      const question = "Test question";
      const duration = 3600;
      await pool.connect(sponsor).createPool(question, duration, { value: SPONSOR_DEPOSIT });
      await pool.connect(participant1).joinPool(0, 1, { value: TICKET_FEE });
      await pool.connect(participant2).joinPool(0, 2, { value: TICKET_FEE });
      
      await time.increase(3601);
      await pool.connect(sponsor).settlePool(0, 1, ethers.parseEther("0.5"));
    });

    it("Should allow winners to claim principal + yield", async function () {
      const initialBalance = await ethers.provider.getBalance(participant1.address);
      await pool.connect(participant1).claimFunds(0);
      const finalBalance = await ethers.provider.getBalance(participant1.address);
      
      // Winner should get more than just principal due to yield share
      expect(finalBalance).to.be.gt(initialBalance + TICKET_FEE);
    });

    it("Should allow losers to claim principal only", async function () {
      const initialBalance = await ethers.provider.getBalance(participant2.address);
      await pool.connect(participant2).claimFunds(0);
      const finalBalance = await ethers.provider.getBalance(participant2.address);
      
      // Loser should get approximately principal back (minus gas)
      expect(finalBalance).to.be.closeTo(initialBalance + TICKET_FEE, ethers.parseEther("0.01"));
    });
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn hardhat test test/NoLossPredictionPool.test.ts

# Run with gas reporting
REPORT_GAS=true yarn test

# Run with coverage
yarn hardhat coverage
```

---

## Troubleshooting

### Issue: Contracts not found in deployedContracts.ts

**Solution:**
1. Ensure contracts are deployed: `yarn deploy`
2. Check that deployment script exists in `packages/hardhat/deploy/`
3. Verify contract names match exactly (case-sensitive)

### Issue: "Target Contract is not deployed" error

**Solution:**
1. Check `deployedContracts.ts` has entries for your chain ID
2. Verify contract name matches: `"NoLossPredictionPool"` (exact case)
3. For Monad testnet, ensure chain ID is correct

### Issue: Transaction fails with "insufficient funds"

**Solution:**
1. Check wallet has enough MON for gas + transaction value
2. For local testing, use `yarn account` to see funded accounts
3. For testnet, get MON from faucet

### Issue: Frontend not updating after transactions

**Solution:**
1. Check `pollingInterval` in `scaffold.config.ts`
2. Verify `watch: true` in `useScaffoldReadContract` hooks
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Can't connect wallet to Monad testnet

**Solution:**
1. Add Monad testnet network manually to MetaMask:
   - Network Name: Monad Testnet
   - RPC URL: `https://testnet-rpc.monad.xyz`
   - Chain ID: `41443` (verify actual ID)
   - Currency Symbol: MON
2. Or use WalletConnect if supported

### Issue: Tests failing

**Solution:**
1. Ensure local node is running: `yarn chain`
2. Check contract compilation: `yarn compile`
3. Verify test network is `hardhat` in test files
4. Check for type errors: `yarn hardhat:check-types`

---

## Next Steps

1. ✅ Complete local testing
2. ✅ Write and run contract tests
3. ✅ Deploy to Monad testnet
4. ✅ Test on Monad testnet
5. ✅ Get feedback from users
6. ✅ Fix any issues found
7. ✅ Prepare for mainnet deployment

---

## Useful Commands Reference

```bash
# Development
yarn chain              # Start local blockchain
yarn deploy             # Deploy contracts
yarn start              # Start frontend
yarn compile            # Compile contracts

# Testing
yarn test               # Run contract tests
yarn hardhat:test       # Run tests with gas reporting
yarn account            # List local accounts

# Deployment
yarn deploy --network monad_testnet  # Deploy to Monad testnet
yarn verify --network monad_testnet  # Verify contracts on explorer

# Code Quality
yarn lint               # Lint code
yarn format             # Format code
yarn hardhat:check-types # Check TypeScript types
```

---

Happy Testing! 🚀

