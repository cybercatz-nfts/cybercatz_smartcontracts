// shortener-smartcontracts/test/PaymentSystem.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PaymentSystem contract', async () => {
    let PaymentSystem;
    let paymentSystem;
    let owner;
    let buyer;
    let seller;
    let other;

    beforeEach(async () => {
        PaymentSystem = await ethers.getContractFactory("PaymentSystem");
        [owner, buyer, seller, other] = await ethers.getSigners();
        paymentSystem = await PaymentSystem.deploy();
        await paymentSystem.deployed();
    });

    it('should create payment and emit payment created event', async () => {
        const value = ethers.utils.parseEther("1.0");
        const tx = await paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: value });
        const receipt = await tx.wait();
        const paymentId = receipt.events[0].args[0];
        const payment = await paymentSystem.getPayment(paymentId);
        expect(payment.id).to.equal(1);
        expect(payment.buyer).to.equal(buyer.address);
        expect(payment.seller).to.equal(seller.address);
        expect(payment.value).to.equal(value);
        expect(payment.status).to.equal(1);
    });

    it('should release payment and emit payment released event', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1);
        const tx = await paymentSystem.releasePayment(payment.id);
        const receipt = await tx.wait();
        const newPayment = await paymentSystem.getPaymentStatus(payment.id);

        expect(receipt.events[0].event).to.equal("PaymentReleased");
        expect(receipt.events[0].args[0]).to.equal(payment.id);
        expect(newPayment).to.equal(2);
    });

    it('should not allow non-buyer or non-seller to create payment', async () => {
        const value = ethers.utils.parseEther("1.0");

        await expect(
            paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: value })
        ).not.to.be.reverted;

        await expect(
            paymentSystem.connect(seller).createPayment(2, buyer.address, seller.address, { value: value })
        ).to.be.revertedWith("Only contract buyer can create a payment");


        await expect(
            paymentSystem.connect(owner).createPayment(3, buyer.address, seller.address, { value: value })
        ).to.be.revertedWith("Only contract buyer can create a payment");
    });


    it('should not allow zero value payments', async () => {
        await expect(
            paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: 0 })
        ).to.be.revertedWith("Value must be greater than 0");
    });

    it('should not allow release of non-existent payment', async () => {
        await expect(
            paymentSystem.releasePayment(1)
        ).to.be.revertedWith("Payment does not exist");
    });

    it('should not allow non-seller to release payment', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1);

        await expect(
            paymentSystem.connect(buyer).releasePayment(payment.id)
        ).to.be.revertedWith("Only contract owner or seller can release a payment");
    });

    it('should allow owner to withdraw balance', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: value });
        const initialBalance = await ethers.provider.getBalance(owner.address);
        await paymentSystem.withdraw();
        const newBalance = await ethers.provider.getBalance(owner.address);
        expect(newBalance).to.be.gt(initialBalance);
    });

    it('should not allow non-owner to withdraw balance', async () => {
        await expect(
            paymentSystem.connect(buyer).withdraw()
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('should allow seller to release payment', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1);

        await expect(
            paymentSystem.connect(seller).releasePayment(payment.id)
        ).not.to.be.reverted;
    });

    it('should allow contract owner to release payment', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1);

        await expect(
            paymentSystem.connect(owner).releasePayment(payment.id)
        ).not.to.be.reverted;
    });

    it('should not allow non-seller and non-owner to release payment', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, buyer.address, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1);
        
        await expect(
            paymentSystem.connect(other).releasePayment(payment.id)
        ).to.be.revertedWith("Only contract owner or seller can release a payment");
    });

});
