const { Network, Alchemy } = require("alchemy-sdk");

// Configure Alchemy
const settings = {
  apiKey: "5gwcGwhpJmXp-nH6tFvxQQINapw_PFZL",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

async function main() {
  try {
    // Test with the Waves NFT
    const contractAddress = "0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0"; // SuperRare contract
    const tokenId = "8194"; // Waves NFT

    console.log("Fetching NFT metadata for Waves...");
    const nft = await alchemy.nft.getNftMetadata(contractAddress, tokenId);
    console.log("NFT Metadata:", JSON.stringify(nft, null, 2));

    console.log("\nFetching floor price for the collection...");
    const floorPrice = await alchemy.nft.getFloorPrice(contractAddress);
    console.log("Floor Price:", JSON.stringify(floorPrice, null, 2));

  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 