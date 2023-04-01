const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PaymentSystem contract', async () => {
    let PaymentSystem;
    let paymentSystem;

    beforeEach(async () => {
        PaymentSystem = await ethers.getContractFactory("PaymentSystem");
        paymentSystem = await PaymentSystem.deploy();
        await paymentSystem.deployed();
    });

    it('should create payment and emit payment created event', async () => {
        const [buyer, seller] = await ethers.getSigners();
        const value = ethers.utils.parseEther("1.0");
        const tx = await paymentSystem.createPayment(buyer.address, seller.address, { value: value });
        const receipt = await tx.wait();
        const paymentId = receipt.events[0].args[0];
        const payment = await paymentSystem.getPayment(paymentId);
        expect(payment.id).to.equal(1);
        expect(payment.buyer).to.equal(buyer.address);
        expect(payment.seller).to.equal(seller.address);
        expect(payment.value).to.equal(value);
        expect(payment.released).to.be.false;
    });

    it('should release payment and emit payment released event', async () => {
        const [buyer, seller] = await ethers.getSigners();
        const paymentSystemWithSeller = await paymentSystem.connect(seller);
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.createPayment(buyer.address, seller.address, { value: value });
        const payment = await paymentSystemWithSeller.getPayment(1);
        const tx = await paymentSystemWithSeller.releasePayment(payment.id);
        const receipt = await tx.wait();
        const newPayment = await paymentSystemWithSeller.getPaymentStatus(payment.id);

        expect(receipt.events[0].event).to.equal("PaymentReleased");
        expect(receipt.events[0].args[0]).to.equal(payment.id);
        expect(newPayment).to.be.true;
    });

    it('should not allow non-buyer or non-seller to create payment', async () => {
        const [buyer, seller, outsider] = await ethers.getSigners();
        const value = ethers.utils.parseEther("1.0");

        await expect(
            paymentSystem.connect(outsider).createPayment(buyer.address, seller.address, { value: value })
        ).to.be.revertedWith("Only buyer or seller can create a payment");
    });

    it('should not allow zero value payments', async () => {
        const [buyer, seller] = await ethers.getSigners();

        await expect(
            paymentSystem.createPayment(buyer.address, seller.address, { value: 0 })
        ).to.be.revertedWith("Value must be greater than 0");
    });

    it('should not allow release of non-existent payment', async () => {
        const [seller] = await ethers.getSigners();
        const paymentSystemWithSeller = await paymentSystem.connect(seller);

        await expect(
            paymentSystemWithSeller.releasePayment(1)
        ).to.be.revertedWith("Payment does not exist");
    });

    it('should not allow non-seller to release payment', async () => {
        const [buyer, seller, outsider] = await ethers.getSigners();
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.createPayment(buyer.address, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1);

        await expect(
            paymentSystem.connect(outsider).releasePayment(payment.id)
        ).to.be.revertedWith("Only seller can release the payment");
    });

});
