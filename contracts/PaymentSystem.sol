// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentSystem is Ownable {
    address public _owner;

    struct Payment {
        uint256 id;
        address[] buyers;
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

    mapping(uint256 => mapping(address => Payment)) public payments;

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

    function createPayment(uint256 paymentId, address _seller) public payable {
        require(msg.value > 0, "Value must be greater than 0");

        Payment storage payment = payments[paymentId][_seller];

        payment.buyers.push(msg.sender);

        payment.id = paymentId;
        payment.seller = _seller;
        payment.value = msg.value;
        payment.status = PaymentStatus.PAID;
        payment.exists = true;

        emit PaymentCreated(paymentId, msg.sender, _seller, msg.value);
    }

    function releasePayment(
        uint256 paymentId,
        address _seller
    ) public onlyOwner {
        Payment storage payment = payments[paymentId][_seller];

        require(
            address(this).balance >= payment.value,
            "Contract balance is not enough to release payment"
        );

        uint256 fee = (payment.value * 5) / 100; // Calculate the 5% fee
        uint256 amountToTransfer = payment.value - fee; // Deduct the fee from the payment value

        payment.status = PaymentStatus.RELEASED;
        payable(payment.seller).transfer(amountToTransfer); // Transfer the remaining amount to the seller

        emit PaymentReleased(
            paymentId,
            payment.buyers[0],
            payment.seller,
            amountToTransfer
        );
    }

    function getPayment(
        uint256 paymentId,
        address _seller
    ) public view returns (Payment memory) {
        Payment storage payment = payments[paymentId][_seller];
        require(payment.exists, "Payment does not exist");
        return payment;
    }

    function isPaymentExists(
        uint256 paymentId,
        address _seller
    ) public view returns (bool) {
        Payment storage payment = payments[paymentId][_seller];
        return payment.exists;
    }

    function isPaid(
        uint256 paymentId,
        address buyer,
        address seller
    ) public view returns (bool) {
        Payment storage payment = payments[paymentId][seller];
        bool paid = false;
        for (uint256 i = 0; i < payment.buyers.length; i++) {
            if (
                payment.buyers[i] == buyer &&
                payment.status == PaymentStatus.PAID
            ) {
                paid = true;
                break;
            }
        }
        return paid;
    }

    function getBuyers(
        uint256 paymentId,
        address _seller
    ) public view returns (address[] memory) {
        Payment storage payment = payments[paymentId][_seller];
        return payment.buyers;
    }

    function withdraw() public onlyOwner {
        require(msg.sender == owner(), "Only contract owner can withdraw");
        payable(owner()).transfer(address(this).balance);
    }
}
