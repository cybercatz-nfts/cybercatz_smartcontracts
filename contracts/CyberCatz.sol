// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/// @custom:security-contact contact@ioralabs.com
contract CyberCatz is ERC721, ERC721URIStorage, Pausable, Ownable {
    using SafeMath for uint256;

    uint256 public platformShare;

    mapping(uint256 => mapping(address => bool)) private contentAccess;

    event MintContentNFT(address indexed to, uint256 indexed fileId);
    event BuyContentNFT(
        address indexed buyer,
        uint256 indexed fileId,
        uint256 amount
    );
    event SetPlatformShare(uint256 platformShare);
    event Withdraw(uint256 amount);

    constructor(uint256 _platformShare) ERC721("CyberCatz", "SYCat") {
        platformShare = _platformShare;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(
        address to,
        uint256 fileId,
        string memory uri
    ) public onlyOwner {
        _safeMint(to, fileId);
        _setTokenURI(fileId, uri);
        emit MintContentNFT(to, fileId);
    }

    function buyContentNFT(
        uint256 fileId,
        address _seller,
        string memory uri
    ) public payable {
        require(msg.value > 0, "Payment required");

        uint256 platformAmount = msg.value.mul(platformShare).div(100);
        uint256 creatorAmount = msg.value.sub(platformAmount);

        if (!_exists(fileId)) {
            // Mint the NFT content if it doesn't exist
            _safeMint(_seller, fileId);
            _setTokenURI(fileId, uri);

            emit MintContentNFT(_seller, fileId);
        }

        payable(_seller).transfer(creatorAmount);

        // Grant the buyer access to the content associated with the fileId
        contentAccess[fileId][msg.sender] = true;

        emit BuyContentNFT(msg.sender, fileId, msg.value);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 fileId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, fileId, batchSize);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 fileId) internal override(ERC721, ERC721URIStorage) {
        super._burn(fileId);
    }

    function tokenURI(
        uint256 fileId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(fileId);
    }

    function contractURI() public pure returns (string memory) {
        return "https://api.scy.cat/nfts/project";
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function hasContentAccess(
        uint256 fileId,
        address user
    ) public view returns (bool) {
        return contentAccess[fileId][user];
    }

    function setPlatformShare(uint256 _platformShare) public onlyOwner {
        require(
            _platformShare <= 100,
            "Platform share can't be greater than 100"
        );
        platformShare = _platformShare;
        emit SetPlatformShare(_platformShare);
    }

    function withdraw(uint256 amount) public onlyOwner {
        require(
            amount <= address(this).balance,
            "Withdraw amount is greater than contract balance"
        );
        payable(msg.sender).transfer(amount);
        emit Withdraw(amount);
    }
}
