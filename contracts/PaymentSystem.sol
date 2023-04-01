// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract PaymentSystem {
    struct Payment {
        uint256 id;
        address buyer;
        address seller;
        uint256 value;
        bool released;
        bool exists;
    }

    mapping(uint256 => Payment) public payments;
    uint256 public paymentCounter;
    address public owner;

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
        owner = msg.sender;
        paymentCounter = 1;
    }

    function createPayment(address buyer, address seller) public payable {
        require(
            msg.sender == buyer || msg.sender == seller,
            "Only buyer or seller can create a payment"
        );
        require(msg.value > 0, "Value must be greater than 0");

        payments[paymentCounter] = Payment({
            id: paymentCounter,
            buyer: buyer,
            seller: seller,
            value: msg.value,
            released: false,
            exists: true
        });

        emit PaymentCreated(paymentCounter, buyer, seller, msg.value);

        paymentCounter++;
    }

    function releasePayment(uint256 paymentId) public {
        Payment storage payment = payments[paymentId];
        require(payment.exists, "Payment does not exist");
        require(
            msg.sender == payment.seller,
            "Only seller can release the payment"
        );
        require(payment.value > 0, "Payment value must be greater than 0");
        require(!payment.released, "Payment has already been released");
        payment.released = true;
        payable(payment.buyer).transfer(payment.value);

        emit PaymentReleased(
            paymentId,
            payment.buyer,
            payment.seller,
            payment.value
        );
    }

    function getPayment(
        uint256 paymentId
    ) public view returns (Payment memory) {
        Payment memory payment = payments[paymentId];
        require(payment.exists, "Payment does not exist");
        return payment;
    }

    function getPaymentStatus(uint256 paymentId) public view returns (bool) {
        Payment memory payment = payments[paymentId];
        require(payment.exists, "Payment does not exist");
        return payment.released;
    }

    function withdraw() public {
        require(msg.sender == owner, "Only contract owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
}
