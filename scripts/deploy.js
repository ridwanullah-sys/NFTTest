const { ethers, network, run } = require("hardhat");
const { NomicLabsHardhatPluginError } = require("hardhat/plugins");

async function main() {
  const signers = await ethers.getSigners();

  let deployer;
  signers.forEach((signer) => {
    if (signer.address === process.env.OWNER_ADDRESS) {
      deployer = signer;
    }
  });
  if (!deployer) {
    throw new Error(`${process.env.OWNER_ADDRESS} not found in signers!`);
  }

  if (
    network.name === "goerli" ||
    network.name === "mainnet" ||
    network.name === "localhost"
  ) {
    // Saving the info to be logged in the table (deployer address)
    const deployerLog = { Label: "Deploying Address", Info: deployer.address };
    // Saving the info to be logged in the table (deployer address)
    const deployerBalanceLog = {
      Label: "Deployer ETH Balance",
      Info: ethers.utils.formatEther(await deployer.getBalance()),
    };

    const NFT = await ethers.getContractFactory("MyTestNFT");

    // Deploy the contract
    const NFTInst = await NFT.deploy();
    await NFTInst.deployed();
    if (network.name === "goerli" || network.name === "mainnet") {
      try {
        // Verify the contract
        await run("verify:verify", {
          address: NFTInst.address,
          constructorArguments: [],
        });
      } catch (error) {
        if (error instanceof NomicLabsHardhatPluginError) {
          console.log("Contract source code already verified");
        } else {
          console.error(error);
        }
      }
    }
    const NFTLog = {
      Label: "Deployed NFT Contract Address",
      Info: NFTInst.address,
    };

    console.table([deployerLog, deployerBalanceLog, NFTLog]);
  } else {
    throw new Error("Not found network");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
