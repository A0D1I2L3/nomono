# Quick Start: No-Loss Prediction Pool

## ✅ Setup Complete!

All contracts and deployment scripts have been created and configured.

## 📁 Files Created

### Contracts
- ✅ `packages/hardhat/contracts/MockYieldProvider.sol`
- ✅ `packages/hardhat/contracts/NoLossPredictionPool.sol`

### Deployment Scripts
- ✅ `packages/hardhat/deploy/01_deploy_mock_yield_provider.ts`
- ✅ `packages/hardhat/deploy/02_deploy_no_loss_prediction_pool.ts`

### Configuration
- ✅ `packages/hardhat/hardhat.config.ts` - Added Monad testnet
- ✅ `packages/nextjs/scaffold.config.ts` - Added Monad testnet chain

### Frontend
- ✅ `packages/nextjs/app/page.tsx` - Full dApp interface

## 🚀 Deploy to Monad Testnet

### Step 1: Set Environment Variables

Create/update `.env` file:
```bash
__RUNTIME_DEPLOYER_PRIVATE_KEY=your_private_key_here
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
```

### Step 2: Compile Contracts

```bash
yarn compile
```

### Step 3: Deploy

```bash
yarn deploy --network monad_testnet
```

This will:
1. Deploy `MockYieldProvider` first
2. Deploy `NoLossPredictionPool` with MockYieldProvider address
3. Auto-generate `deployedContracts.ts` with addresses

### Step 4: Verify Contracts

```bash
yarn verify --network monad_testnet
```

### Step 5: Start Frontend

```bash
yarn start
```

Open `http://localhost:3000` and connect your wallet to Monad testnet.

## 🎬 Demo Flow

1. **Create Pool** (as Sponsor)
   - Question: "Will Monad hit 100k TPS by EOY?"
   - Duration: 3600 (1 hour)
   - Deposit: 2.0 MON

2. **Join Pool** (as Participants)
   - Participant 1: Join with "Yes" (0.1 MON)
   - Participant 2: Join with "No" (0.1 MON)
   - Participant 3: Join with "Yes" (0.1 MON)

3. **Settle Pool** (as Sponsor)
   - Wait for betting to end
   - Winning Outcome: 1 (Yes)
   - Simulated Yield: 1.0 MON

4. **Claim Funds**
   - Winners (Participants 1 & 3): Get principal + yield share
   - Loser (Participant 2): Get principal only (no loss!)
   - Sponsor: Get deposit + 40% yield cut

## 📚 Documentation

- **Full Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Testing Guide**: See `TESTING_GUIDE.md`

## 🔧 Troubleshooting

### Contracts won't compile
```bash
yarn compile
```
Check for errors and fix any issues.

### Deployment fails
- Check RPC URL is correct
- Verify private key in `.env`
- Ensure sufficient MON balance
- Check network connectivity

### Frontend shows "Contract not deployed"
- Verify `deployedContracts.ts` has Monad testnet entries
- Check chain ID is 41443
- Restart frontend: `yarn start`
- Hard refresh browser (Ctrl+Shift+R)

## 📝 Next Steps

1. ✅ Compile contracts: `yarn compile`
2. ✅ Deploy to Monad testnet: `yarn deploy --network monad_testnet`
3. ✅ Verify contracts: `yarn verify --network monad_testnet`
4. ✅ Test frontend: `yarn start`
5. ✅ Run demo flow above

---

**Ready to deploy!** 🚀

