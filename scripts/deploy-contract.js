// Deploy script for Hardhat or Foundry
// Usage: npx hardhat run scripts/deploy-contract.js --network base

const hre = require("hardhat")

async function main() {
  const baseTokenURI = process.env.NEXT_PUBLIC_APP_URL + "/api/metadata"

  console.log("Deploying ReputationPassport contract...")
  console.log("Base Token URI:", baseTokenURI)
  console.log("Mint Fee: 0.0002 ETH")

  const ReputationPassport = await hre.ethers.getContractFactory("ReputationPassport")
  const passport = await ReputationPassport.deploy(baseTokenURI)

  await passport.waitForDeployment()

  const address = await passport.getAddress()
  console.log("ReputationPassport deployed to:", address)
  console.log("\nAdd this to your .env:")
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`)

  // Get mint fee for verification
  const mintFee = await passport.MINT_FEE()
  console.log("\nContract Mint Fee:", hre.ethers.formatEther(mintFee), "ETH")

  // Verify on BaseScan
  console.log("\nVerifying contract...")
  await hre.run("verify:verify", {
    address: address,
    constructorArguments: [baseTokenURI],
  })

  console.log("\n✅ Deployment complete!")
  console.log("\nNext steps:")
  console.log("1. Update your .env with the contract address")
  console.log("2. Register collection on OpenSea:")
  console.log(`   - Collection slug: ${process.env.NEXT_PUBLIC_OPENSEA_COLLECTION_SLUG || 'reputation-passport'}`)
  console.log(`   - Contract address: ${address}`)
  console.log("3. Test minting functionality")
  console.log("4. Set up your OpenSea API key in .env")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
