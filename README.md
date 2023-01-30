# Shortener NFT

This project is a smart contract for a non-fungible token (NFT) shortener. It allows users to create short URLs that can be associated with a unique NFT token. The short URLs can be accessed only by whitelisted users.

## Features
- Create short URLs associated with a unique NFT token
- Whitelist users who can access the short URLs
- Get the original URL associated with a short URL
- Remove users from the whitelist

## Requirements
- Nodejs
- Hardhat

## Installation

1. Clone the repository

```shell
git clone https://github.com/YOUR_USERNAME/shortenerNFT.git
```

2. Install dependencies

```shell
yarn install
```

## Usage

1. Run the smart contract on a local blockchain using hardhat

```shell
yarn hardhat node
```

2. In a separate terminal, run the test suite

```shell
yarn hardhat test
```

## Test

The project includes a test suite that can be run using the command npx hardhat test. The test suite includes the following tests:

- should create a short URL
- should add a user to the whitelist
- should remove a user from the whitelist
- should not allow non-whitelisted users to create short URLs
- should not allow non-whitelisted users to get the original URL
- should not allow whitelisted users to create short URLs
- should allow whitelisted users to get short URLs

## Author
Pedro Magalhães

## License
This project is licensed under the MIT License. See the LICENSE file for details.
