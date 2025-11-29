# Troubleshooting: Deployment Issues

## Issue: "Signer had insufficient balance"

### Problem
Your deployer account doesn't have enough MON tokens to pay for gas fees on Monad testnet.

### Solutions

#### 1. Check Your Balance
```bash
yarn account
```

Look for your account balance on `monad_testnet`. You need at least:
- **0.1-0.5 MON** for contract deployments
- **Additional MON** for testing transactions

#### 2. Get Testnet MON Tokens

**Option A: Use Monad Testnet Faucet**
- Visit the Monad testnet faucet (if available)
- Enter your wallet address
- Request testnet MON tokens

**Option B: Request from Monad Team**
- Join Monad Discord/Telegram
- Request testnet tokens in the appropriate channel
- Provide your wallet address

**Option C: Use a Different Account**
If you have another account with MON tokens:
```bash
# Import the account with tokens
yarn account:import
```

Then update your `.env` file:
```bash
__RUNTIME_DEPLOYER_PRIVATE_KEY=your_account_with_tokens_private_key
```

#### 3. Deploy Only Required Contracts

The deployment now skips `YourContract` on Monad testnet. To deploy only the NoLossPredictionPool contracts:

```bash
# Deploy only the NoLossPredictionPool contracts
yarn deploy --network monad_testnet --tags MockYieldProvider,NoLossPredictionPool
```

Or use the default deploy (YourContract will be skipped automatically):
```bash
yarn deploy --network monad_testnet
```

## Issue: Chain ID Mismatch

### Problem
Different chain IDs in different config files.

### Solution
Ensure chain IDs match:
- `hardhat.config.ts`: `chainId: 10143`
- `scaffold.config.ts`: `id: 10143`

Both should use the same Monad testnet chain ID.

## Issue: "Contract not found" in Frontend

### Problem
Frontend can't find deployed contracts.

### Solutions

1. **Check deployedContracts.ts**
   ```bash
   cat packages/nextjs/contracts/deployedContracts.ts
   ```
   
   Should have entries like:
   ```typescript
   10143: {
     MockYieldProvider: { address: "0x...", abi: [...] },
     NoLossPredictionPool: { address: "0x...", abi: [...] },
   }
   ```

2. **Verify Chain ID Matches**
   - Hardhat config: `10143`
   - Scaffold config: `10143`
   - deployedContracts.ts: `10143`

3. **Restart Frontend**
   ```bash
   # Stop frontend (Ctrl+C)
   yarn start
   ```

4. **Hard Refresh Browser**
   - Press `Ctrl+Shift+R` (Linux/Windows)
   - Press `Cmd+Shift+R` (Mac)

## Issue: Deployment Fails with Network Error

### Problem
Can't connect to Monad testnet RPC.

### Solutions

1. **Check RPC URL**
   ```bash
   # In hardhat.config.ts
   url: "https://testnet-rpc.monad.xyz"
   ```

2. **Try Alternative RPC** (if available)
   Update `.env`:
   ```bash
   MONAD_TESTNET_RPC_URL=https://alternative-rpc-url.monad.xyz
   ```

3. **Check Network Connectivity**
   ```bash
   curl https://testnet-rpc.monad.xyz
   ```

## Issue: "YourContract" Still Deploying

### Problem
The default template contract is still trying to deploy.

### Solution
The deployment script now automatically skips `YourContract` on Monad testnet. If it still tries to deploy:

1. **Check the deployment script was updated**
   ```bash
   cat packages/hardhat/deploy/00_deploy_your_contract.ts
   ```
   
   Should have:
   ```typescript
   if (hre.network.name === "monad_testnet") {
     console.log("⏭️  Skipping YourContract deployment on Monad testnet");
     return;
   }
   ```

2. **Deploy with specific tags**
   ```bash
   yarn deploy --network monad_testnet --tags MockYieldProvider,NoLossPredictionPool
   ```

## Quick Fixes Summary

### Fix Insufficient Balance
1. Get MON testnet tokens from faucet
2. Or use account with tokens: `yarn account:import`
3. Update `.env` with new private key

### Fix Chain ID Mismatch
- Update both configs to use `10143` (or correct Monad testnet chain ID)

### Fix Contract Not Found
1. Verify `deployedContracts.ts` has correct chain ID
2. Restart frontend
3. Hard refresh browser

### Skip Unwanted Contracts
- YourContract is now automatically skipped on Monad testnet
- Or use tags: `--tags MockYieldProvider,NoLossPredictionPool`

---

**Still having issues?** Check the deployment logs for specific error messages and verify:
- ✅ Account has MON tokens
- ✅ Chain ID is correct (10143)
- ✅ RPC URL is accessible
- ✅ Private key is correct in `.env`

