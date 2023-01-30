// shortener-smartcontracts/hardhat.config.js
require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-web3");

const { ALCHEMY_API_KEY, PRIVATE_KEY, ETHERSCAN_KEY, BSCSCAN_KEY } = process.env;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_KEY,
      bsc: BSCSCAN_KEY,
      goerli: ETHERSCAN_KEY,
    },
  },
  testRunner: 'jest',
  testRunnerOptions: {
    testFiles: ['test/ShortenURL.js'],
    testEnvironment: 'node',
  }
};
