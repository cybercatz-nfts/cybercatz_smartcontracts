// test/ShortenURL.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Shortener", () => {
    let Shortner;
    let shortener;
    let creator;
    let geratedKey;

    function generateRandomKey() {
        try {
            const randomBytes = ethers.utils.randomBytes(32);
            return randomBytes;
        } catch (error) {
            console.log("generateRandomKey", error)
        }
    }

    async function deployShortnerLinks() {
        Shortner = await ethers.getContractFactory("Shortener");
        geratedKey = generateRandomKey();

        shortener = await Shortner.deploy(geratedKey);
        const [owner] = await ethers.getSigners();
        creator = owner.address;
        return { shortener, creator, owner, geratedKey };
    }


    it("should create a short URL", async () => {
        const { shortener, geratedKey } = await deployShortnerLinks();
        const originalUrl = "https://example.com";

        const tx = await shortener.createShortUrl(originalUrl);
        await tx.wait();

        // Get the created url
        let url = await shortener.getOriginalUrl(geratedKey);

        expect(url).to.equal(originalUrl);
    });

    it("should get the original url", async () => {
        const { shortener, geratedKey } = await deployShortnerLinks();

        // Create a short url
        const originalUrl = "https://www.example.com";
        await shortener.createShortUrl(originalUrl);

        // Get the original url
        const returnedUrl = await shortener.getOriginalUrl(geratedKey);
        expect(returnedUrl).to.eq(originalUrl);
    });

    it("should get the short link access count", async () => {
        const { shortener, creator } = await deployShortnerLinks();

        const originalUrl = "https://example.com";

        const tx = await shortener.createShortUrl(originalUrl);
        await tx.wait();

        // Get the short id
        const shortId = await shortener.shortIdCounter();

        // Get the short link access count
        const accessCount = await shortener.getShortLinkAccessCount(creator, shortId);

        expect(accessCount.toNumber()).to.equal(0);
    });

    it("should get the user access count", async () => {
        const { shortener, creator } = await deployShortnerLinks();

        // Get the user access count
        const userAccessCount = await shortener.getUserAccessCount();

        expect(userAccessCount.toNumber()).to.equal(0);
    });

    it("should increment the access count for a user", async () => {
        const { shortener, creator } = await deployShortnerLinks();
        // Get the user access count before increment
        let userAccessCount = await shortener.getUserAccessCount();
        expect(userAccessCount.toNumber()).to.equal(0);

        // Increment the access count for the user
        await shortener.incrementAccessCount();
        await shortener.incrementAccessCount();

        // Get the user access count after increment
        userAccessCount = await shortener.getUserAccessCount();
        expect(userAccessCount.toNumber()).to.equal(2);
    });
});

module.exports = {};