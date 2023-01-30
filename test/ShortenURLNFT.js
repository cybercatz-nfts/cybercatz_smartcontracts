// test/ShortenURLNFT.js
const { expect } = require('chai');
const { ethers, deployments } = require('hardhat');

describe('Shortener contract', async () => {
    let Shortner;
    let shortener;
    let generatedKey;

    function generateRandomKey() {
        try {
            const randomBytes = ethers.utils.randomBytes(32);
            return randomBytes;
        } catch (error) {
            console.log("generateRandomKey", error)
        }
    }

    async function deployShortnerLinks() {
        Shortner = await ethers.getContractFactory("ShortenerNFT");
        generatedKey = generateRandomKey();

        shortener = await Shortner.deploy(generatedKey);
        const [owner, user1, user2, user3] = await ethers.getSigners();
        creator = owner.address;
        return { shortener, creator, owner, generatedKey, user1, user2, user3 };
    }


    it('should create a short URL', async () => {
        const { shortener, creator, generatedKey } = await deployShortnerLinks();
        const originalUrl = 'https://www.example.com';

        const tx = await shortener.createShortUrl(originalUrl, { from: creator });
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);


        const url = await shortener.getUrl(generatedKey);
        expect(url).to.equal(originalUrl);
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
        const originalUrl = 'https://www.example.com';
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
        const originalUrl = 'https://www.example.com';

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

});