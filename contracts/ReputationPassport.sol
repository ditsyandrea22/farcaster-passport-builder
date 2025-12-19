// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationPassport
 * @dev ERC721 NFT representing Farcaster user reputation
 */
contract ReputationPassport is ERC721, Ownable {
    uint256 public nextTokenId;
    string public baseTokenURI;

    struct Passport {
        uint256 fid;
        uint256 score;
        string badge;
        uint256 mintedAt;
        uint256 lastUpdated;
    }

    mapping(uint256 => Passport) public passports;
    mapping(uint256 => uint256) public fidToToken;

    event PassportMinted(
        address indexed user,
        uint256 indexed tokenId,
        uint256 fid,
        uint256 score,
        string badge
    );

    event PassportUpdated(
        uint256 indexed tokenId,
        uint256 newScore,
        string newBadge
    );

    constructor(string memory _baseTokenURI) ERC721("Farcaster Reputation Passport", "FRP") Ownable(msg.sender) {
        baseTokenURI = _baseTokenURI;
    }

    /**
     * @dev Mint a new reputation passport
     * @param to Address to mint to
     * @param fid Farcaster ID
     * @param score Reputation score (0-1000)
     * @param badge Badge type (OG, Active, Builder, Whale, etc)
     */
    function mintPassport(
        address to,
        uint256 fid,
        uint256 score,
        string calldata badge
    ) external {
        require(fidToToken[fid] == 0, "Passport already exists for this FID");
        require(score <= 1000, "Score must be <= 1000");

        nextTokenId++;
        uint256 tokenId = nextTokenId;

        _safeMint(to, tokenId);

        passports[tokenId] = Passport({
            fid: fid,
            score: score,
            badge: badge,
            mintedAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        fidToToken[fid] = tokenId;

        emit PassportMinted(to, tokenId, fid, score, badge);
    }

    /**
     * @dev Update passport score and badge
     * @param tokenId Token ID to update
     * @param newScore New reputation score
     * @param newBadge New badge
     */
    function updateScore(
        uint256 tokenId,
        uint256 newScore,
        string calldata newBadge
    ) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "Invalid token");
        require(newScore <= 1000, "Score must be <= 1000");

        passports[tokenId].score = newScore;
        passports[tokenId].badge = newBadge;
        passports[tokenId].lastUpdated = block.timestamp;

        emit PassportUpdated(tokenId, newScore, newBadge);
    }

    /**
     * @dev Get passport data by FID
     * @param fid Farcaster ID
     */
    function getPassportByFID(uint256 fid) external view returns (Passport memory) {
        uint256 tokenId = fidToToken[fid];
        require(tokenId != 0, "No passport for this FID");
        return passports[tokenId];
    }

    /**
     * @dev Set base URI for token metadata
     * @param _baseTokenURI New base URI
     */
    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    /**
     * @dev Returns the token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Invalid token");
        return string(abi.encodePacked(baseTokenURI, "/", _toString(tokenId)));
    }

    /**
     * @dev Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
