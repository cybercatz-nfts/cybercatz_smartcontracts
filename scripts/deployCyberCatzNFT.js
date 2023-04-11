require('dotenv').config();

const hre = require("hardhat");

async function main() {
    const PaymentSystem = await hre.ethers.getContractFactory("CyberCatz");
    const paymentSystem = await PaymentSystem.deploy(5);
    await paymentSystem.deployed();

    console.log(`CyberCatz contract deployed to ${paymentSystem.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
