const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers");

describe('PaymentSystem contract', async () => {
    let PaymentSystem;
    let paymentSystem;
    let owner;
    let buyer;
    let buyer1;
    let buyer2;
    let buyer3;
    let seller;
    let other;

    beforeEach(async () => {
        PaymentSystem = await ethers.getContractFactory("PaymentSystem");
        [owner, buyer, buyer1, buyer2, buyer3, seller, other] = await ethers.getSigners();
        paymentSystem = await PaymentSystem.deploy();
        await paymentSystem.deployed();
    });

    it('should create payment and emit payment created event', async () => {
        const value = ethers.utils.parseEther("1.0");
        const tx = await paymentSystem.connect(buyer).createPayment(1, seller.address, { value: value });
        const receipt = await tx.wait();
        const paymentId = receipt.events[0].args[0].toNumber();
        const payment = await paymentSystem.getPayment(paymentId, seller.address);
        expect(payment.id).to.equal(1);
        expect(payment.buyers).to.include(buyer.address);
    });


    it("should release payment and emit payment released event", async () => {
        const value = ethers.utils.parseEther("1.0");
        const tx = await paymentSystem.connect(buyer).createPayment(1, seller.address, { value: value });
        const receipt = await tx.wait();
        const paymentId = receipt.events[0].args[0];
        const payment = await paymentSystem.getPayment(paymentId, seller.address);
        const tx2 = await paymentSystem.releasePayment(paymentId, seller.address);
        const receipt2 = await tx2.wait();
        expect(receipt2.events[0].event).to.equal("PaymentReleased");
        expect(receipt2.events[0].args[0]).to.equal(payment.id);
    });


    it('should not allow zero value payments', async () => {
        await expect(
            paymentSystem.connect(buyer).createPayment(1, seller.address, { value: 0 })
        ).to.be.revertedWith("Value must be greater than 0");
    });

    it('should not allow non-seller to release payment', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1, seller.address);

        await expect(
            paymentSystem.connect(buyer).releasePayment(payment.id, seller.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('should allow owner to withdraw balance', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, seller.address, { value: value });
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


    it('should allow contract owner to release payment', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1, seller.address);

        await expect(
            paymentSystem.connect(owner).releasePayment(payment.id, seller.address)
        ).not.to.be.reverted;
    });

    it('should not allow non-seller and non-owner to release payment', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1, seller.address);

        await expect(
            paymentSystem.connect(other).releasePayment(payment.id, seller.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('should allow multiple buyers to create payments', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer1).createPayment(1, seller.address, { value: value });
        await paymentSystem.connect(buyer2).createPayment(1, seller.address, { value: value });
        await paymentSystem.connect(buyer3).createPayment(1, seller.address, { value: value });
        const payment1 = await paymentSystem.isPaid(1, buyer1.address, seller.address);
        const payment2 = await paymentSystem.isPaid(1, buyer2.address, seller.address);
        const payment3 = await paymentSystem.isPaid(1, buyer3.address, seller.address);

        expect(payment1).to.true;
        expect(payment2).to.true;
        expect(payment3).to.true;
    });

    it('should return if the payment is paid', async () => {
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(1, seller.address, { value: value });
        const payment = await paymentSystem.getPayment(1, seller.address);
        const isPaid = await paymentSystem.isPaid(payment.id, buyer.address, seller.address);
        expect(isPaid).to.be.true;
    });


    it('should not return if the payment is not paid', async () => {
        const paymentId = 1;
        const isPaid = await paymentSystem.connect(buyer1).isPaid(paymentId, buyer1.address, seller.address);
        expect(isPaid).to.be.false;
    });

    it('should return if the order is paid for multiple buyers', async () => {
        const paymentId = 1;
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer1).createPayment(1, seller.address, { value: value });
        await paymentSystem.connect(buyer2).createPayment(1, seller.address, { value: value });
        await paymentSystem.connect(buyer3).createPayment(1, seller.address, { value: value });
        const isPaid1 = await paymentSystem.connect(buyer1).isPaid(paymentId, buyer1.address, seller.address);
        const isPaid2 = await paymentSystem.connect(buyer2).isPaid(paymentId, buyer2.address, seller.address);
        const isPaid3 = await paymentSystem.connect(buyer3).isPaid(paymentId, buyer3.address, seller.address);
        expect(isPaid1).to.be.true;
        expect(isPaid2).to.be.true;
        expect(isPaid3).to.be.true;
    });

    it('should not return if the order is not paid for multiple buyers', async () => {
        const paymentId = 9;
        const isPaid1 = await paymentSystem.connect(buyer1).isPaid(paymentId, buyer1.address, seller.address);
        const isPaid2 = await paymentSystem.connect(buyer1).isPaid(paymentId, buyer2.address, seller.address);
        const isPaid3 = await paymentSystem.connect(buyer1).isPaid(paymentId, buyer3.address, seller.address);
        expect(isPaid1).to.be.false;
        expect(isPaid2).to.be.false;
        expect(isPaid3).to.be.false;
    });

    it('should return if the payment exists', async () => {
        const paymentId = 1;
        const value = ethers.utils.parseEther("1.0");
        await paymentSystem.connect(buyer).createPayment(paymentId, seller.address, { value: value });
        const isPaymentExists = await paymentSystem.isPaymentExists(paymentId, seller.address);
        expect(isPaymentExists).to.be.true;
    });

    it('should deduct 5% fee when releasing payment', async () => {
        const value = ethers.utils.parseEther('1.0');
        const tx = await paymentSystem.connect(buyer).createPayment(1, seller.address, { value });
        const receipt = await tx.wait();
        const paymentId = receipt.events[0].args[0];
        const payment = await paymentSystem.getPayment(paymentId, seller.address);
        const gasUsed = receipt.gasUsed.mul(tx.gasPrice);

        const initialBalance = await ethers.provider.getBalance(seller.address);
        const tx2 = await paymentSystem.connect(owner).releasePayment(paymentId, seller.address);
        const receipt2 = await tx2.wait();
        const gasUsed2 = receipt2.gasUsed.mul(tx2.gasPrice);
        const expectedFee = payment.value.mul(5).div(100);
        const expectedAmount = payment.value.sub(expectedFee).sub(gasUsed).sub(gasUsed2);
        const newBalance = await ethers.provider.getBalance(seller.address);
        const expected = BigNumber.from(expectedAmount.toString());
        const actual = BigNumber.from(newBalance.toString()).sub(initialBalance).sub(gasUsed).sub(gasUsed2);

        expect(actual).to.equal(expected);
    });

    it('should deduct 5% fee when releasing payment and leave the fee in the smart contract', async () => {
        const value = ethers.utils.parseEther('5.0');
        const tx = await paymentSystem.connect(buyer).createPayment(1, seller.address, { value });
        const receipt = await tx.wait();
        const paymentId = receipt.events[0].args[0];
        const payment = await paymentSystem.getPayment(paymentId, seller.address);
        const gasUsed = receipt.gasUsed.mul(tx.gasPrice);
      
        const initialBalance = await ethers.provider.getBalance(seller.address);
        const tx2 = await paymentSystem.connect(owner).releasePayment(paymentId, seller.address);
        const receipt2 = await tx2.wait();
        const gasUsed2 = receipt2.gasUsed.mul(tx2.gasPrice);
        const paymentValueMinusGas = payment.value.sub(gasUsed).sub(gasUsed2);
        const expectedFee = paymentValueMinusGas.mul(5).div(100);
        const expectedAmount = paymentValueMinusGas.sub(expectedFee);
        const newBalance = await ethers.provider.getBalance(seller.address);
      
        const expected = BigNumber.from(expectedAmount.toString());
        const actual = BigNumber.from(newBalance.toString()).sub(initialBalance).sub(gasUsed).sub(gasUsed2);
      
        expect(actual).to.be.closeTo(expected, 100000000000000);
      });

    it('should return a list of buyers for a payment', async () => {
        const value = ethers.utils.parseEther('1.0');
        const buyers = [buyer.address, buyer2.address, buyer3.address];
        await paymentSystem.connect(buyer).createPayment(1, seller.address, { value });
        await paymentSystem.connect(buyer2).createPayment(1, seller.address, { value });
        await paymentSystem.connect(buyer3).createPayment(1, seller.address, { value });
        const allBuyers = await paymentSystem.getBuyers(1, seller.address);
        expect(allBuyers).to.deep.equal(buyers);
    });


});
