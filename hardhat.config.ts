import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from 'dotenv';

// Load the environment variables from the .env file
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
  gasReporter:{
    currency: 'EUR',
    L1: "polygon",
    L1Etherscan: (process.env.POLYGONSCAN_API),
    coinmarketcap: (process.env.COINMARKETCAP_API),
    currencyDisplayPrecision: 5,
    // offline: true,
  }
};

export default config;
