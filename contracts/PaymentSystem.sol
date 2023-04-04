// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentSystem is Ownable {
    address public _owner;

    struct Payment {
        uint256 id;
        address buyer;
        address seller;
        uint256 value;
        PaymentStatus status;
        bool exists;
    }
    enum PaymentStatus {
        OPEN,
        PAID,
        RELEASED
    }

    mapping(uint256 => Payment) public payments;

    event PaymentCreated(
        uint256 paymentId,
        address buyer,
        address seller,
        uint256 value
    );
    event PaymentReleased(
        uint256 paymentId,
        address buyer,
        address seller,
        uint256 value
    );

    constructor() {
        _owner = msg.sender;
    }

    function createPayment(
        uint256 paymentId,
        address buyer,
        address seller
    ) public payable {
        require(msg.value > 0, "Value must be greater than 0");
        require(
            !payments[paymentId].exists,
            "Payment with this ID already exists"
        );
        require(
            buyer == msg.sender,
            "Only contract buyer can create a payment"
        );

        payments[paymentId] = Payment({
            id: paymentId,
            buyer: buyer,
            seller: seller,
            value: msg.value,
            status: PaymentStatus.PAID,
            exists: true
        });

        emit PaymentCreated(paymentId, buyer, seller, msg.value);
    }

    function releasePayment(uint256 paymentId) public {
        Payment storage payment = payments[paymentId];
        require(payment.exists, "Payment does not exist");
        require(payment.value > 0, "Payment value must be greater than 0");
        require(
            address(this).balance >= payment.value,
            "Contract balance is not enough to release payment"
        );
        require(
            payment.status == PaymentStatus.PAID,
            "Payment has already been released or is not paid"
        );
        require(
            address(this).balance >= payment.value,
            "Insufficient contract balance"
        );
        // Only the seller or the contract owner can release the payment
        require(
            payment.seller == msg.sender || msg.sender == _owner,
            "Only contract owner or seller can release a payment"
        );

        uint256 fee = (payment.value * 5) / 100; // Calculate the 5% fee
        uint256 amountToTransfer = payment.value - fee; // Deduct the fee from the payment value

        payment.status = PaymentStatus.RELEASED;
        payable(payment.seller).transfer(amountToTransfer); // Transfer the remaining amount to the seller

        emit PaymentReleased(
            paymentId,
            payment.buyer,
            payment.seller,
            amountToTransfer
        );
    }

    function getPayment(
        uint256 paymentId
    ) public view returns (Payment memory) {
        Payment memory payment = payments[paymentId];
        require(payment.exists, "Payment does not exist");
        return payment;
    }

    function getPaymentStatus(
        uint256 paymentId
    ) public view returns (PaymentStatus) {
        Payment memory payment = payments[paymentId];
        require(payment.exists, "Payment does not exist");
        return payment.status;
    }

    function withdraw() public onlyOwner {
        require(msg.sender == owner(), "Only contract owner can withdraw");
        payable(owner()).transfer(address(this).balance);
    }
}
