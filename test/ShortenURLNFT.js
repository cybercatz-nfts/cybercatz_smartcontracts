// test/ShortenURLNFT.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Shortener contract', async () => {
    let Shortner;
    let shortener;

    function generateKeysForUrls(originalUrls) {
        const keys = [];
        for (let i = 0; i < originalUrls.length; i++) {
            let key = "";
            const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (let j = 0; j < 5; j++) {
                key += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            keys.push(key);
        }
        return keys;
    }


    async function deployShortnerLinks() {
        Shortner = await ethers.getContractFactory("ShortenerNFT");
        shortener = await Shortner.deploy("Test 1", "TST");
        const [owner, user1, user2, user3] = await ethers.getSigners();
        creator = owner.address;
        return { shortener, creator, owner, user1, user2, user3 };
    }

    it('creates a short URL', async () => {
        const { shortener, creator } = await deployShortnerLinks();
        const originalUrls = ['https://www.google.com', 'https://www.github.com'];
        const keys = generateKeysForUrls(originalUrls);
        const tx  = await shortener.createShortUrl(originalUrls, keys);
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);
        const url = await shortener.getUrl(keys);
        expect(url).to.deep.equal(originalUrls);
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
            const keys = generateKeysForUrls(originalUrl);
            await shortener.createShortUrl(originalUrl, keys);
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
        const keys = generateKeysForUrls(originalUrl);

        try {
            await shortener.createShortUrl(originalUrl, keys);
        } catch (error) {
            expect(error.message).to.include('Only the contract owner can create short URLs');
        }
    });

    it('should not allow non-whitelisted users to get the original URL', async () => {
        const { shortener, user1, user2 } = await deployShortnerLinks();
        const originalUrl = ['https://www.example.com'];
        try {
            const keys = generateKeysForUrls(originalUrl);
            await shortener.createShortUrl(originalUrl, keys);
            await shortener.getUrl(keys, { from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" });
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

});