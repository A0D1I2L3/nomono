# Setup Your Deployment Account

## Your Account Details

**Address:** `0x9416cf0496bb71d47ee4865f11601ee3413b7eee`  
**Balance:** 10 MON (sufficient for deployment ✅)

## Step 1: Add Private Key to .env

You need to add your account's **private key** to the `.env` file.

1. **Open or create `.env` file** in the project root:
   ```bash
   nano .env
   # or
   code .env
   ```

2. **Add your private key:**
   ```bash
   __RUNTIME_DEPLOYER_PRIVATE_KEY=your_private_key_here
   ```

   ⚠️ **Important:** 
   - Never share your private key
   - Never commit `.env` to git (it should be in `.gitignore`)
   - The private key should start with `0x`

3. **Save the file**

## Step 2: Verify Balance

Check your balance is accessible:
```bash
node check-balance.js
```

Or use the account script (after setting up private key):
```bash
yarn account
```

## Step 3: Deploy Contracts

Once your private key is set in `.env`:

```bash
# Compile contracts
yarn compile

# Deploy to Monad testnet
yarn deploy --network monad_testnet
```

## Step 4: Verify Deployment

After deployment:
```bash
yarn verify --network monad_testnet
```

## Security Notes

- ✅ Your address is public (safe to share)
- 🔒 Your private key is secret (never share!)
- 🔒 Keep `.env` file secure
- ✅ 10 MON is more than enough for deployment (need ~0.1-0.5 MON)

## Quick Commands

```bash
# Check balance
node check-balance.js

# Deploy (after setting private key)
yarn deploy --network monad_testnet

# Verify contracts
yarn verify --network monad_testnet

# Start frontend
yarn start
```

---

**Next:** Add your private key to `.env` and run `yarn deploy --network monad_testnet`

