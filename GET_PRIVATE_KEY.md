# How to Get Your Private Key

## ⚠️ SECURITY WARNING

**NEVER share your private key with anyone!**
- Private keys give full control over your wallet
- Anyone with your private key can steal all funds
- Never commit private keys to GitHub or share publicly

## Method 1: From MetaMask (Most Common)

### Step 1: Open MetaMask
1. Open MetaMask extension in your browser
2. Click the account icon (top right)
3. Select the account: `0x9416cf0496bb71d47ee4865f11601ee3413b7eee`

### Step 2: Export Private Key
1. Click the **three dots (⋮)** next to your account name
2. Select **"Account details"**
3. Click **"Show private key"**
4. Enter your MetaMask password
5. Copy the private key (starts with `0x`)

### Step 3: Add to .env
```bash
__RUNTIME_DEPLOYER_PRIVATE_KEY=0x_your_private_key_here
```

## Method 2: From Other Wallets

### Trust Wallet
1. Go to Settings → Wallets
2. Select your wallet
3. Tap "Show Recovery Phrase" or "Export Private Key"
4. Enter password/biometric
5. Copy private key

### Coinbase Wallet
1. Go to Settings → Security
2. Select "Export Private Key"
3. Enter password
4. Copy private key

### Hardware Wallets (Ledger/Trezor)
⚠️ **Hardware wallets don't expose private keys directly**
- Use the account import feature instead
- Or use `yarn account:import` command

## Method 3: If You Don't Have the Private Key

### Option A: Import Account Using Mnemonic
If you have the 12/24 word seed phrase:
```bash
yarn account:import
```
This will encrypt and store your key securely.

### Option B: Generate New Account (Not Recommended)
Only if you want to use a different account:
```bash
yarn account:generate
```
⚠️ This creates a NEW account - you'd need to transfer MON to it.

## Method 4: Check if Already Imported

Check if you've already imported this account:
```bash
yarn account
```

If the address matches, you can use the encrypted key system.

## Setting Up .env File

1. **Create/Edit `.env` file** in project root:
   ```bash
   nano .env
   ```

2. **Add your private key:**
   ```bash
   __RUNTIME_DEPLOYER_PRIVATE_KEY=0x_your_actual_private_key_here
   ```

3. **Save and close** (Ctrl+X, then Y, then Enter in nano)

4. **Verify it's NOT in git:**
   ```bash
   git status
   ```
   
   `.env` should NOT appear in the list. If it does, add it to `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```

## Security Checklist

Before deploying:
- ✅ Private key is in `.env` file
- ✅ `.env` is in `.gitignore` (check with `git check-ignore .env`)
- ✅ Never committed `.env` to git
- ✅ Private key starts with `0x`
- ✅ Account has sufficient MON balance (you have 10 MON ✅)

## Verify Setup

After adding private key:
```bash
# Check account balance
yarn workspace @se-2/hardhat hardhat run scripts/checkBalance.ts

# Deploy contracts
yarn deploy --network monad_testnet
```

## If You Can't Access Private Key

If you can't get the private key (e.g., hardware wallet):
1. Create a new account: `yarn account:generate`
2. Transfer MON from `0x9416cf0496bb71d47ee4865f11601ee3413b7eee` to new account
3. Use new account for deployment

---

**Remember:** Your private key is like the password to your bank account. Keep it secret!

