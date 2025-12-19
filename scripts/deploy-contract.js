// Deploy script for Hardhat or Foundry
// Usage: npx hardhat run scripts/deploy-contract.js --network base

const hre = require("hardhat")

async function main() {
  const baseTokenURI = process.env.NEXT_PUBLIC_APP_URL + "/api/metadata"

  console.log("Deploying ReputationPassport contract...")
  console.log("Base Token URI:", baseTokenURI)

  const ReputationPassport = await hre.ethers.getContractFactory("ReputationPassport")
  const passport = await ReputationPassport.deploy(baseTokenURI)

  await passport.waitForDeployment()

  const address = await passport.getAddress()
  console.log("ReputationPassport deployed to:", address)
  console.log("\nAdd this to your .env:")
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`)

  // Verify on BaseScan
  console.log("\nVerifying contract...")
  await hre.run("verify:verify", {
    address: address,
    constructorArguments: [baseTokenURI],
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
