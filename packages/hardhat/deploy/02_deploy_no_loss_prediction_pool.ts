import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys NoLossPredictionPool contract
 * This must be deployed after MockYieldProvider as it requires the MockYieldProvider address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployNoLossPredictionPool: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  console.log("Deploying NoLossPredictionPool...");

  // Get the deployed MockYieldProvider address
  const mockYieldProvider = await get("MockYieldProvider");
  const mockYieldProviderAddress = mockYieldProvider.address;

  console.log("Using MockYieldProvider at:", mockYieldProviderAddress);

  await deploy("NoLossPredictionPool", {
    from: deployer,
    args: [mockYieldProviderAddress], // Pass MockYieldProvider address to constructor
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to verify
  const noLossPool = await hre.ethers.getContract<Contract>("NoLossPredictionPool", deployer);
  const deployedAddress = await noLossPool.getAddress();

  console.log("✅ NoLossPredictionPool deployed at:", deployedAddress);
  console.log("   TICKET_FEE:", (await noLossPool.TICKET_FEE()).toString());
  console.log("   SPONSOR_YIELD_CUT_PERCENT:", (await noLossPool.SPONSOR_YIELD_CUT_PERCENT()).toString());
  console.log("   Yield Provider:", await noLossPool.yieldProvider());
  console.log("   Next Pool ID:", (await noLossPool.nextPoolId()).toString());
};

export default deployNoLossPredictionPool;

deployNoLossPredictionPool.tags = ["NoLossPredictionPool"];
deployNoLossPredictionPool.dependencies = ["MockYieldProvider"]; // Ensure MockYieldProvider is deployed first
