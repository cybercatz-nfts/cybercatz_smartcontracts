require('dotenv').config();

const hre = require("hardhat");

async function main() {
    const PaymentSystem = await hre.ethers.getContractFactory("PaymentSystem");
    const paymentSystem = await PaymentSystem.deploy();
    await paymentSystem.deployed();

    console.log(`PaymentSystem contract deployed to ${paymentSystem.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
