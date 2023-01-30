// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Shortener {
    using SafeMath for uint256;

    mapping(bytes32 => Url) public urls;
    mapping(address => mapping(bytes32 => bool)) public userUrls;

    struct Url {
        string originalUrl;
        address creator;
    }

    Url[] public urlsArray;

    bytes32 shortIdCounter;

    event ShortUrlCreated(bytes32 shortId, string originalUrl, address creator);

    constructor(bytes32 randomKey) {
        shortIdCounter = randomKey;
    }

    function createShortUrl(string memory originalUrl) public {
        urls[shortIdCounter] = Url(originalUrl, msg.sender);
        userUrls[msg.sender][shortIdCounter] = true;
        urlsArray.push(urls[shortIdCounter]);

        // Emit the event
        emit ShortUrlCreated(shortIdCounter, originalUrl, msg.sender);
    }

    function getOriginalUrl(bytes32 shortId)
        public
        view
        returns (string memory)
    {
        // Find the URL with the given short id
        Url memory url = urls[shortId];
        require(
            url.creator == msg.sender || msg.sender == address(0),
            "Sender is not the creator of this short link"
        );

        return urls[shortId].originalUrl;
    }
}
