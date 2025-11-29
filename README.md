# Nomono – No-Loss, Yield-Backed Prediction Protocol (Monad Blitz Edition)
A decentralized no-loss prediction game built for the Monad Blitz event, where sponsors create YES/NO questions and users stake MON into yield pools to vote on outcomes. User deposits generate yield during the lock period — users never lose principal. Only the yield is distributed to winners.

---

## 🚀 Features

### 🎯 No-Loss Prediction Pools
Users stake MON into a YES or NO pool. After resolution:
- Users reclaim 100% of their deposit
- Yield generated becomes the reward pool

### 🧑‍💼 Sponsor-Created Markets
Sponsors define:
- Question text  
- Lock duration  
- Optional initial seed liquidity  
- Yield module configuration  

### 🏦 Yield Accumulation
Deposited MON generates simulated on-chain yield using a modular yield backend.

### 🥇 Winner Rewards
After resolution:
- Deposits are returned  
- Winners split accumulated yield proportionally  

### 🔒 Fully On-Chain & Non-Custodial
Sponsors never hold user funds; smart contracts ensure safety and transparency.

---

## 💰 Token & Asset Info

### Platform Currency
Nomono uses:
- MON (Monad Testnet native token)
- Used for staking, deposits, rewards, and gas fees

### Internal Mechanics
- Users deposit MON → receive pool shares  
- Yield grows during lock period  
- After resolution → users reclaim deposit + yield (if winners)

---

## 🛠️ Prerequisites
- Node.js 18+
- pnpm
- Foundry
- MetaMask with Monad Testnet configured
- MON Testnet funds

---

## 🏗️ Architecture

### Smart Contracts (`src/`)
- Nomono.sol – Core no-loss market & pool logic  
- QuestionNFT.sol – ERC-721 representing each question  
- YieldModule.sol – Yield integration abstraction  
- MockYield.sol – Simulated yield backend  
- Token.sol – Test ERC-20 (local development)

### Scripts (`script/`)
- DeployNomono.s.sol  
- CreateQuestion.s.sol  
- FundYieldModule.s.sol  

### Tests (`test/`)
- Market lifecycle  
- Claim logic  
- Yield simulation  

---


---

## 🎮 Usage

### 1. Browse Questions
Questions are represented as NFTs.

### 2. Stake MON into YES or NO
Users deposit MON and receive pool shares.

### 3. Yield Accumulation
Deposits generate yield during the lock period.

### 4. Resolution
Sponsor resolves the question.

### 5. Claim
Users reclaim deposit + yield (if winners).

---

## 📊 Contract Addresses (Monad Testnet)
Replace after deployment:
| Contract | Address |
|---------|---------|
| Nomono Core | `0x...` |
| Question NFT | `0x...` |
| Yield Module | `0x...` |

---

---

## Built with love for the Blitz Bangalore Hackathon, by Adwaith and Adil.
