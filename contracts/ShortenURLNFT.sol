// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IShortener {
    function createShortUrl(string memory originalUrl) external;

    function getUrl(bytes32 shortId) external view returns (string memory);

    function addToWhitelist(address user) external;

    function removeFromWhitelist(address user) external;

    event ShortUrlCreated(bytes32 shortId, string originalUrl);
}

contract ShortenerNFT is Ownable {
    mapping(bytes32 => Url) public urls;
    mapping(address => bool) public whitelist;

    struct Url {
        string originalUrl;
        address creator;
    }

    Url[] public urlsArray;

    bytes32 shortId;

    event ShortUrlCreated(bytes32 shortId, string originalUrl, address creator);

    constructor(bytes32 randomKey) {
        whitelist[msg.sender] = true;
        shortId = randomKey;
    }

    function createShortUrl(string memory originalUrl) public onlyOwner {
        urls[shortId] = Url(originalUrl, msg.sender);
        // Emit the event
        emit ShortUrlCreated(shortId, originalUrl, msg.sender);
    }

    function getUrl(bytes32 _shortId) public view returns (string memory) {
        require(whitelist[msg.sender], "Sender not in whitelist.");

        return urls[_shortId].originalUrl;
    }

    function addToWhitelist(address user) public onlyOwner{
        whitelist[user] = true;
    }

    function removeFromWhitelist(address user) public onlyOwner {
        whitelist[user] = false;
    }
}
