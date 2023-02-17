// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ShortenerNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(string => Url) public urls;
    mapping(address => bool) public whitelist;

    struct Url {
        string originalUrl;
        address creator;
    }

    Url[] public urlsArray;

    string[] shortId;

    event ShortUrlCreated(string shortId, string originalUrl, address creator);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {
        whitelist[msg.sender] = true;
    }

    function createShortUrl(
        string[] memory originalUrls,
        string[] memory _shortId
    ) public onlyOwner {
        for (uint256 i = 0; i < originalUrls.length; i++) {
            uint256 tokenId = _tokenIds.current();
            urls[_shortId[i]] = Url(originalUrls[i], msg.sender);
            urlsArray.push(urls[_shortId[i]]);
            _mintNFT(msg.sender, tokenId);

            // Emit the event
            emit ShortUrlCreated(_shortId[i], originalUrls[i], msg.sender);
        }
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function getUrl(string[] memory _shortIds)
        public
        view
        returns (string[] memory)
    {
        require(whitelist[msg.sender], "Sender not in whitelist.");

        string[] memory originalUrls = new string[](_shortIds.length);
        for (uint256 i = 0; i < _shortIds.length; i++) {
            originalUrls[i] = urls[_shortIds[i]].originalUrl;
        }
        return originalUrls;
    }

    function addToWhitelist(address user) public onlyOwner {
        whitelist[user] = true;
    }

    function removeFromWhitelist(address user) public onlyOwner {
        whitelist[user] = false;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://scy.cat/url/";
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIds.current();
        _tokenIds.increment();
        _safeMint(to, tokenId);
    }

    function _addTokenTo(address to, uint256 tokenId) public onlyOwner {
        require(
            owner() == msg.sender,
            "Only the contract owner can add tokens to an address."
        );
        require(
            _tokenIds.current() == 0 || tokenId > _tokenIds.current(),
            "Invalid token ID."
        );

        _mintNFT(to, tokenId);
        emit Transfer(address(0), to, tokenId);
    }

    function _mintNFT(address to, uint256 tokenId) public onlyOwner {
        _mint(to, tokenId);
        _tokenIds.increment();
    }

    function getActualTokenId() public view returns (uint256) {
        return _tokenIds.current();
    }
}
