import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys MockYieldProvider contract
 * This must be deployed first as NoLossPredictionPool depends on it
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMockYieldProvider: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying MockYieldProvider...");

  await deploy("MockYieldProvider", {
    from: deployer,
    args: [], // No constructor arguments
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to verify
  const mockYieldProvider = await hre.ethers.getContract<Contract>("MockYieldProvider", deployer);
  console.log("✅ MockYieldProvider deployed at:", await mockYieldProvider.getAddress());
  console.log("   Owner:", await mockYieldProvider.owner());
};

export default deployMockYieldProvider;

deployMockYieldProvider.tags = ["MockYieldProvider"];
