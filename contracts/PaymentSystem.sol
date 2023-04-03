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
        bool released;
        bool exists;
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
            released: false,
            exists: true
        });

        emit PaymentCreated(paymentId, buyer, seller, msg.value);
    }

function releasePayment(uint256 paymentId, address payable seller) public {
    Payment storage payment = payments[paymentId];
    require(payment.exists, "Payment does not exist");
    require(payment.value > 0, "Payment value must be greater than 0");
    require(
        address(this).balance >= payment.value,
        "Contract balance is not enough to release payment"
    );
    require(!payment.released, "Payment has already been released");
    require(
        address(this).balance >= payment.value,
        "Insufficient contract balance"
    );
    require(
        seller == msg.sender || msg.sender == _owner,
        "Only contract owner or seller can release a payment"
    );
    payment.released = true;
    seller.transfer(payment.value);

    emit PaymentReleased(paymentId, payment.buyer, seller, payment.value);
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

    function withdraw() public onlyOwner {
        require(msg.sender == owner(), "Only contract owner can withdraw");
        payable(owner()).transfer(address(this).balance);
    }
}
