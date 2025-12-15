export const REPUTATION_PASSPORT_ABI = [
  {
    inputs: [{ internalType: "string", name: "_baseTokenURI", type: "string" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "fid", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "score", type: "uint256" },
      { indexed: false, internalType: "string", name: "badge", type: "string" },
    ],
    name: "PassportMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newScore", type: "uint256" },
      { indexed: false, internalType: "string", name: "newBadge", type: "string" },
    ],
    name: "PassportUpdated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "fid", type: "uint256" },
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "string", name: "badge", type: "string" },
    ],
    name: "mintPassport",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "newScore", type: "uint256" },
      { internalType: "string", name: "newBadge", type: "string" },
    ],
    name: "updateScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "fid", type: "uint256" }],
    name: "getPassportByFID",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "fid", type: "uint256" },
          { internalType: "uint256", name: "score", type: "uint256" },
          { internalType: "string", name: "badge", type: "string" },
          { internalType: "uint256", name: "mintedAt", type: "uint256" },
          { internalType: "uint256", name: "lastUpdated", type: "uint256" },
        ],
        internalType: "struct ReputationPassport.Passport",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MINT_FEE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMintFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
] as const
