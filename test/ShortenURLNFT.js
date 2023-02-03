// test/ShortenURLNFT.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Shortener contract', async () => {
    let Shortner;
    let shortener;
    let generatedKey

    function generateRandomKey() {
        try {
            const randomBytes1 = ethers.utils.randomBytes(32);
            const randomBytes2 = ethers.utils.randomBytes(32);
            return [randomBytes1, randomBytes2];
        } catch (error) {
            console.log("generateRandomKey", error)
        }
    }

    async function deployShortnerLinks() {
        Shortner = await ethers.getContractFactory("ShortenerNFT");
        generatedKey = generateRandomKey();
        shortener = await Shortner.deploy(generatedKey, "Test 1", "TST");
        const [owner, user1, user2, user3] = await ethers.getSigners();
        creator = owner.address;
        return { shortener, creator, generatedKey, owner, user1, user2, user3 };
    }

    it('should create a short URL', async () => {
        const { shortener, creator, generatedKey } = await deployShortnerLinks();
        const originalUrl = ['https://www.example3.com', 'https://www.example2.com'];
        const tx = await shortener.createShortUrl(originalUrl, { from: creator });
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);
        
        const url = await shortener.getUrl(generatedKey);

        expect(url).to.deep.equal(originalUrl);
    });
    

    it('should add a user to the whitelist', async () => {
        const { shortener, user1, creator } = await deployShortnerLinks();
        const tx = await shortener.addToWhitelist(user1.address, { from: creator });
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);

        const isWhitelisted = await shortener.whitelist(user1.address, { from: creator });
        expect(isWhitelisted).to.be.true;

    });

    it('should remove a user from the whitelist', async () => {
        const { shortener, user1, creator } = await deployShortnerLinks();
        await shortener.addToWhitelist(user1.address, { from: creator });
        const tx = await shortener.removeFromWhitelist(user1.address, { from: creator });
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);

        const isWhitelisted = await shortener.whitelist(user1.address);
        expect(isWhitelisted).to.be.false;
    });

    it('should not allow non-whitelisted users to create short URLs', async () => {
        const { shortener } = await deployShortnerLinks();
        const originalUrl = ['https://www.example.com'];
        try {
            await shortener.createShortUrl(originalUrl);
        } catch (error) {
            expect(error.message).to.include('Sender is not on the whitelist');
        }
    });

    it('should transfer ownership of a short URL', async () => {
        const { shortener, creator, user2 } = await deployShortnerLinks();
        const tx = await shortener.transferOwnership(user2.address, { from: creator });
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);

        const urlOwner = await shortener.owner();
        expect(urlOwner).to.equal(user2.address);
    });

    it('should not allow whitelisted users to create short URLs', async () => {
        const { shortener, user1, creator } = await deployShortnerLinks()
            ;
        await shortener.addToWhitelist(user1.address, { from: creator });
        const originalUrl = ['https://www.example.com'];

        try {
            await shortener.createShortUrl(originalUrl);
        } catch (error) {
            expect(error.message).to.include('Only the contract owner can create short URLs');
        }
    });

    it('should not allow non-whitelisted users to get the original URL', async () => {
        const { shortener, generatedKey } = await deployShortnerLinks();
        try {
            await shortener.getUrl(generatedKey);
        } catch (error) {
            expect(error.message).to.include('Sender not in whitelist');
        }
    });

    it('should add an NFT to an address', async () => {
        const { shortener, creator, user1 } = await deployShortnerLinks();
        const tokenId = 1;
        await shortener._addTokenTo(user1.address, tokenId, { from: creator });

        const nftOwner = await shortener.ownerOf(tokenId);
        expect(nftOwner).to.equal(user1.address);
    });

    it('should check that a token has been minted', async () => {
        const { shortener, user2, user3, creator } = await deployShortnerLinks();
        await shortener._mintNFT(user2.address, 1, { from: creator });
        await shortener._mintNFT(user3.address, 2, { from: creator });
        const nftCount = await shortener.getActualTokenId()

        expect(2).to.equal(nftCount.toNumber());
    });

    it('should add an NFT to an address', async () => {
        const { shortener, creator, user1 } = await deployShortnerLinks();
        const tokenId = 1;
        await shortener._addTokenTo(user1.address, tokenId, { from: creator });
        const nftOwner = await shortener.ownerOf(tokenId);
        expect(nftOwner).to.equal(user1.address);
    });

    it('should transfer NFT ownership', async () => {
        const { shortener, creator, user2, user3 } = await deployShortnerLinks();
        const tokenId = 10;
        await shortener._addTokenTo(user2.address, tokenId, { from: creator });
        const tx = await shortener.transferFrom(user2.address, user3.address, tokenId, { from: user2.address });
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);
        const nftOwner = await shortener.ownerOf(tokenId);
        expect(nftOwner).to.equal(user3.address);
    });

    it.only('should retrieve NFT metadata', async () => {
        const { shortener, creator, user2 } = await deployShortnerLinks();
        const tokenId = 2;
        const originalUrl = ['https://www.example.com'];
        await shortener.createShortUrl(originalUrl, { from: creator });
        await shortener._addTokenTo(user2.address, tokenId, { from: creator });
        const metadata = await shortener.tokenMetadata(tokenId);
        expect(metadata).to.equal(originalUrl);
    });

});