const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CyberCatzNFTs contract", async () => {
    let CyberCatzNFTs;
    let cyberCatzNFTs;
    let owner;
    let buyer;
    let buyer1;
    let buyer2;
    let seller;

    beforeEach(async () => {
        CyberCatzNFTs = await ethers.getContractFactory("CyberCatz");
        [owner, buyer, buyer1, buyer2, seller, other] = await ethers.getSigners();
        cyberCatzNFTs = await CyberCatzNFTs.deploy(5);
        await cyberCatzNFTs.deployed();
    });

    it("should mint NFT and assign the owner", async () => {
        await cyberCatzNFTs.connect(owner).safeMint(seller.address, 1, "some_uri");
        const nftOwner = await cyberCatzNFTs.ownerOf(1);
        expect(nftOwner).to.equal(seller.address);
    });

    it('should not allow non-owner to mint NFT', async () => {
        await expect(cyberCatzNFTs.connect(buyer).safeMint(seller.address, 1, "some_uri")).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    it('should set the platform share correctly', async () => {

        expect(await cyberCatzNFTs.platformShare()).to.equal(5);

        await cyberCatzNFTs.setPlatformShare(10);

        expect(await cyberCatzNFTs.platformShare()).to.equal(10);

        await expect(cyberCatzNFTs.setPlatformShare(101)).to.be.revertedWith(
            "Platform share can't be greater than 100"
        );

        await expect(cyberCatzNFTs.connect(buyer).setPlatformShare(5)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    it('should return false for user without content access', async () => {
        await cyberCatzNFTs.connect(owner).safeMint(seller.address, 1, "some_uri");
        const contentId = 1;
        const user = buyer;
        const hasAccess = await cyberCatzNFTs.hasContentAccess(contentId, user.address);
        expect(hasAccess).to.be.false;
    });

    it('should allow NFT owner to access content', async () => {
        const nftId = 1;
        const uri = "some_uri";
        await cyberCatzNFTs.connect(buyer).buyContentNFT(nftId, seller.address, uri, { value: ethers.utils.parseEther("1") });
        const hasAccess = await cyberCatzNFTs.hasContentAccess(nftId, buyer.address);
        expect(hasAccess).to.be.true;
    });

    it('should allow multiple buyers to access the same content', async () => {
        const nftId = 1;
        const uri = "some_uri";
        await cyberCatzNFTs.connect(buyer).buyContentNFT(nftId, seller.address, uri, { value: ethers.utils.parseEther("1") });
        let hasAccess = await cyberCatzNFTs.hasContentAccess(nftId, buyer.address);
        expect(hasAccess).to.be.true;

        await cyberCatzNFTs.connect(buyer1).buyContentNFT(nftId, seller.address, uri, { value: ethers.utils.parseEther("1") });
        hasAccess = await cyberCatzNFTs.hasContentAccess(nftId, buyer1.address);
        expect(hasAccess).to.be.true;

        await cyberCatzNFTs.connect(buyer2).buyContentNFT(nftId, seller.address, uri, { value: ethers.utils.parseEther("1") });
        hasAccess = await cyberCatzNFTs.hasContentAccess(nftId, buyer2.address);
        expect(hasAccess).to.be.true;
    });

    it('should not allow zero value payments', async () => {
        await expect(
            cyberCatzNFTs.connect(buyer).buyContentNFT(1, seller.address, { value: 0 })
        ).to.be.revertedWith("Payment required");
    });

    it('should emit MintContentNFT event when a new NFT is minted', async () => {
        await expect(cyberCatzNFTs.connect(owner).safeMint(seller.address, 1, "some_uri"))
            .to.emit(cyberCatzNFTs, 'MintContentNFT')
            .withArgs(seller.address, 1);
    });

    it('should emit BuyContentNFT event when an NFT is purchased', async () => {
        const nftId = 1;
        const uri = "some_uri";
        await expect(cyberCatzNFTs.connect(buyer).buyContentNFT(nftId, seller.address, uri, { value: ethers.utils.parseEther("1") }))
            .to.emit(cyberCatzNFTs, 'BuyContentNFT')
            .withArgs(buyer.address, nftId, ethers.utils.parseEther("1"));
    });

    it('should accumulate the 5% platform share in the smart contract', async () => {

        const uri = "some_uri";
        const initialContractBalance = await ethers.provider.getBalance(cyberCatzNFTs.address);
        const price = ethers.utils.parseEther("1");
        await cyberCatzNFTs.connect(buyer).buyContentNFT(1, seller.address, uri, { value: price });

        const platformShare = await cyberCatzNFTs.platformShare();
        const expectedPlatformAmount = price.mul(platformShare).div(100);
        const finalContractBalance = await ethers.provider.getBalance(cyberCatzNFTs.address);

        expect(finalContractBalance.sub(initialContractBalance)).to.equal(expectedPlatformAmount);
    });

    it('should allow owner to withdraw balance', async () => {
        const nftId = 1;
        const uri = "some_uri";
        await cyberCatzNFTs.connect(buyer).buyContentNFT(nftId, seller.address, uri, { value: ethers.utils.parseEther("1") });
    
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        const contractBalance = await ethers.provider.getBalance(cyberCatzNFTs.address);
        expect(contractBalance).to.be.gt(0);
    
        const tx = await cyberCatzNFTs.connect(owner).withdraw(contractBalance);
        const txReceipt = await tx.wait();
        const gasUsed = txReceipt.gasUsed.mul(tx.gasPrice);
    
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance).to.equal(initialOwnerBalance.add(contractBalance).sub(gasUsed));
    });
    
    it('should not allow non-owner to withdraw balance', async () => {
        const nftId = 1;
        const uri = "some_uri";
        await cyberCatzNFTs.connect(buyer).buyContentNFT(nftId, seller.address, uri, { value: ethers.utils.parseEther("1") });
    
        const contractBalance = await ethers.provider.getBalance(cyberCatzNFTs.address);
        expect(contractBalance).to.be.gt(0);
    
        await expect(cyberCatzNFTs.connect(buyer).withdraw(contractBalance)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
    });

});
