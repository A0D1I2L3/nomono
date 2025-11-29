# Deployment Guide: No-Loss Prediction Pool to Monad Testnet

This guide walks you through deploying the No-Loss Prediction Pool contracts to Monad Testnet and verifying them.

## Prerequisites

1. **Environment Setup**
   - Node.js >= 20.18.3
   - Yarn package manager
   - MetaMask or compatible wallet
   - MON testnet tokens for gas fees

2. **Environment Variables**
   Create a `.env` file in the project root (if not exists):
   ```bash
   # Deployer private key (NEVER commit this to git)
   __RUNTIME_DEPLOYER_PRIVATE_KEY=your_private_key_here
   
   # Optional: Custom RPC URL for Monad testnet
   MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
   
   # Optional: For frontend
   NEXT_PUBLIC_MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
   ```

## Step 1: Compile Contracts

```bash
yarn compile
```

This compiles both `MockYieldProvider.sol` and `NoLossPredictionPool.sol` contracts.

## Step 2: Deploy to Monad Testnet

### 2.1 Check Your Account Balance

```bash
yarn account
```

Ensure your deployer account has sufficient MON tokens for:
- Contract deployment gas fees
- Initial testing transactions

### 2.2 Deploy Contracts

```bash
yarn deploy --network monad_testnet
```

**What happens:**
1. Deploys `MockYieldProvider` first (no constructor args)
2. Deploys `NoLossPredictionPool` with MockYieldProvider address
3. Automatically generates `deployedContracts.ts` with contract addresses
4. Outputs deployment addresses to console

**Expected Output:**
```
Deploying MockYieldProvider...
✅ MockYieldProvider deployed at: 0x...
   Owner: 0x...

Deploying NoLossPredictionPool...
Using MockYieldProvider at: 0x...
✅ NoLossPredictionPool deployed at: 0x...
   TICKET_FEE: 100000000000000000
   SPONSOR_YIELD_CUT_PERCENT: 40
   Yield Provider: 0x...
   Next Pool ID: 1
```

### 2.3 Verify Deployment

After deployment, check `packages/nextjs/contracts/deployedContracts.ts`:

```typescript
const deployedContracts = {
  41443: { // Monad testnet chain ID
    MockYieldProvider: {
      address: "0x...",
      abi: [...],
    },
    NoLossPredictionPool: {
      address: "0x...",
      abi: [...],
    },
  },
} as const;
```

## Step 3: Verify Contracts on Block Explorer

```bash
yarn verify --network monad_testnet
```

This verifies the contract source code on the Monad block explorer, making it publicly readable.

**Note:** If verification fails, you may need to manually verify:
1. Go to Monad block explorer
2. Find your contract address
3. Click "Verify Contract"
4. Paste the contract source code
5. Select compiler version (0.8.20)
6. Submit

## Step 4: Test the Deployment

### 4.1 Start Frontend

```bash
yarn start
```

Open `http://localhost:3000` in your browser.

### 4.2 Connect Wallet

1. Click "Connect Wallet" in the header
2. Select your wallet (MetaMask, WalletConnect, etc.)
3. Switch to Monad Testnet network
4. Approve connection

### 4.3 Test Pool Creation

1. Navigate to "Create New Pool" section
2. Fill in:
   - **Question**: "Will Monad mainnet launch in Q1 2025?"
   - **Duration**: `3600` (1 hour for testing)
   - **Sponsor Deposit**: `1.0` MON
3. Click "Create Pool"
4. Approve transaction in wallet
5. Wait for confirmation

### 4.4 Test Joining Pool

1. Find your created pool in "Active Pools" section
2. Select "Yes" or "No" outcome
3. Click "Join (0.1 MON)"
4. Approve transaction
5. Verify participant count increases

### 4.5 Test Pool Settlement

1. Wait for betting period to end (or use a pool with short duration)
2. As sponsor, go to "Settle Pool" section
3. Select your pool
4. Choose winning outcome (1 for Yes, 2 for No)
5. Enter simulated yield (e.g., `0.5` MON)
6. Click "Declare Winner & Settle"
7. Approve transaction

### 4.6 Test Claiming Funds

1. After settlement, go to "Claim Funds" section
2. Find your settled pool
3. Click "Claim Principal & Winnings"
4. Approve transaction
5. Verify funds received

## Step 5: Demo Walkthrough

### Complete Demo Flow

Here's a complete demo scenario to showcase all features:

#### Setup (5 minutes)
1. **Deploy contracts** (if not already done)
2. **Fund accounts**: Ensure you have at least 5 MON for testing
3. **Open frontend**: `yarn start`

#### Demo Script

**1. Create Pool (Sponsor)**
- Question: "Will Monad hit 100k TPS by end of 2024?"
- Duration: 3600 seconds (1 hour)
- Deposit: 2.0 MON
- **Result**: Pool created, appears in Active Pools

**2. Join Pool - Participant 1 (Yes)**
- Select "Yes" outcome
- Pay 0.1 MON ticket fee
- **Result**: Participant count = 1, Total Principal = 2.1 MON

**3. Join Pool - Participant 2 (No)**
- Switch to different wallet/account
- Select "No" outcome
- Pay 0.1 MON ticket fee
- **Result**: Participant count = 2, Total Principal = 2.2 MON

**4. Join Pool - Participant 3 (Yes)**
- Switch to another account
- Select "Yes" outcome
- Pay 0.1 MON ticket fee
- **Result**: Participant count = 3, Total Principal = 2.3 MON

**5. Settle Pool (Sponsor)**
- Wait for betting period to end (or fast-forward if testing locally)
- As sponsor, select pool
- Winning Outcome: 1 (Yes)
- Simulated Yield: 1.0 MON
- **Result**: Pool settled, yield distributed

**6. Claim Funds - Winners**
- Participant 1 (Yes): Claims 0.1 MON (principal) + yield share
- Participant 3 (Yes): Claims 0.1 MON (principal) + yield share
- **Result**: Winners get principal + proportional yield

**7. Claim Funds - Loser**
- Participant 2 (No): Claims 0.1 MON (principal only)
- **Result**: Loser gets principal back (no loss!)

**8. Claim Funds - Sponsor**
- Sponsor: Claims 2.0 MON (deposit) + 0.4 MON (40% yield cut)
- **Result**: Sponsor gets deposit + yield cut

### Key Points to Highlight

✅ **No Loss Guarantee**: All participants get their principal back
✅ **Yield Distribution**: Winners share 60% of yield, sponsor gets 40%
✅ **Transparent**: All transactions on-chain
✅ **Fair**: Yield generated from DeFi protocols, not from losers

## Troubleshooting

### Issue: "Insufficient funds for gas"

**Solution:**
- Get MON testnet tokens from faucet
- Check account balance: `yarn account`
- Reduce gas price if possible

### Issue: "Contract not found" in frontend

**Solution:**
1. Verify `deployedContracts.ts` has correct chain ID (41443)
2. Check contract addresses are correct
3. Restart frontend: `yarn start`
4. Hard refresh browser (Ctrl+Shift+R)

### Issue: Deployment fails

**Solution:**
1. Check RPC URL is correct
2. Verify private key in `.env`
3. Ensure sufficient MON balance
4. Check network connectivity

### Issue: Verification fails

**Solution:**
1. Wait a few minutes after deployment
2. Try manual verification on block explorer
3. Ensure compiler version matches (0.8.20)
4. Check constructor arguments are correct

## Next Steps

After successful deployment and testing:

1. **Share contract addresses** with team/users
2. **Document** any custom configurations
3. **Monitor** contract interactions on block explorer
4. **Gather feedback** from test users
5. **Prepare** for mainnet deployment (when ready)

## Contract Addresses Reference

After deployment, save these addresses:

```
Monad Testnet (Chain ID: 41443)

MockYieldProvider: 0x...
NoLossPredictionPool: 0x...
```

## Useful Commands

```bash
# Compile contracts
yarn compile

# Deploy to Monad testnet
yarn deploy --network monad_testnet

# Verify contracts
yarn verify --network monad_testnet

# Check account balance
yarn account

# Start frontend
yarn start

# Run tests (local)
yarn test
```

---

**Congratulations!** 🎉 Your No-Loss Prediction Pool is now deployed on Monad Testnet!

