import { ethers } from "hardhat";

async function main() {
  const address = "0x9416cf0496bb71d47ee4865f11601ee3413b7eee";
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz");

  try {
    const balance = await provider.getBalance(address);
    const balanceInMon = ethers.formatEther(balance);

    console.log("\n✅ Account Balance Check");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Address:", address);
    console.log("Balance:", balanceInMon, "MON");
    console.log("Status:", parseFloat(balanceInMon) >= 0.5 ? "✅ Sufficient for deployment" : "⚠️  May need more");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error: any) {
    console.error("❌ Error checking balance:", error.message);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
