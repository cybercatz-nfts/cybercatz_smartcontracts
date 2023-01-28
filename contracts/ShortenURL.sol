// contracts/ShortenURL.sol
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Shortener {
    bytes32 public shortIdCounter;

    using SafeMath for uint256;

    mapping(bytes32 => Url) public urls;
    mapping(address => mapping(bytes32 => bool)) public userUrls;
    mapping(address => uint256) public userAccessCount;
    mapping(address => mapping(bytes32 => uint256)) public shortUrlAccessCount;

    struct Url {
        string originalUrl;
        address creator;
    }

    Url[] public urlsArray;

    event ShortUrlCreated(bytes32 shortId, string originalUrl, address creator);
    event ShortUrlAccessed(address user, bytes32 shortId);

    constructor(bytes32 randomKey) {
        shortIdCounter = randomKey;
    }

    function createShortUrl(
        string memory originalUrl
    ) public {
     
        urls[shortIdCounter] = Url(originalUrl, msg.sender);
        userUrls[msg.sender][shortIdCounter] = true;
        userAccessCount[msg.sender]++;
        urlsArray.push(urls[shortIdCounter]);

        // Emit the event
        emit ShortUrlCreated(shortIdCounter, originalUrl, msg.sender);
    }

    receive() external payable {
        require(
            msg.value >= 0 ether,
            "Insufficient funds to create short link"
        );
        payable(address(this)).transfer(msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
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

    function getUserAccessCount() public view returns (uint256) {
        return userAccessCount[msg.sender];
    }

    function incrementAccessCount() public {
        userAccessCount[msg.sender]++;
    }

    function getShortLinkAccessCount(address user, bytes32 shortId)
        public
        view
        returns (uint256)
    {
        return shortUrlAccessCount[user][shortId];
    }
}
