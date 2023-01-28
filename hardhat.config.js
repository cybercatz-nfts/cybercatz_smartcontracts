require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-web3");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    sources: "./contracts",
    tests: "./test"
  },
  solidity: {
    version: "0.8.0",
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
  },
  testRunner: 'jest',
  testRunnerOptions: {
    testFiles: ['test/ShortenURL.js'],
    testEnvironment: 'node',
  }
};
