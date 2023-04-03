require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");

const { ALCHEMY_API_KEY, PRIVATE_KEY, ETHERSCAN_KEY, BSCSCAN_KEY } = process.env;

const exportAbi = require('./scripts/export-abi');

module.exports = {
  paths: {
    root: "./",
    artifacts: "./artifacts",
    sources: "./contracts",
    scripts: "./scripts",
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    mainnet: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
    },
    bsc_mainnet: {
      url: 'https://bsc-dataseed1.binance.org',
      accounts: [`${PRIVATE_KEY}`],
    },
    bsc_testnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: [`${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_KEY,
      bscTestnet: BSCSCAN_KEY,
      bsc: BSCSCAN_KEY,
      goerli: ETHERSCAN_KEY,
    },
  },
  testRunner: 'jest',
  testRunnerOptions: {
    testFiles: ['test/ShortenURL.js'],
    testEnvironment: 'node',
  },
  tasks: {
    exportAbi,
  },
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true,
  },
};
