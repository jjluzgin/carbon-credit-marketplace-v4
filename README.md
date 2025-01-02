
# Carbon Credit Marketplace Prototype

This project demonstrates a prototype implementation of a Carbon Credit Marketplace using Hardhat. It includes a sample contract, tests, deployment modules, and integration with a frontend and backend.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Hardhat Tasks and Tests](#hardhat-tasks-and-tests)
5. [Running on Localhost](#running-on-localhost)
   - [Starting Hardhat Node](#starting-hardhat-node)
   - [Contract Deployment](#contract-deployment)
     - [Using Thirdweb](#using-thirdweb)
     - [Using Hardhat](#using-hardhat)
   - [Frontend Integration](#frontend-integration)

---

## Overview

The Carbon Credit Marketplace prototype uses Hardhat for Ethereum development. It includes:

- Three contracts and associated tests.
- Gas usage reporting.
- Localhost deployment and wallet integration.
- Frontend and backend application integration.

---

## Prerequisites

Ensure you have the following installed:

- Node.js
- pnpm (preferred for package management)
- Hardhat (just install all the necessary packages with pnpm install)
- Thirdweb account (for Thirdweb deployments)

---

## Installation

To install dependencies, run:

```shell
pnpm install
```

---

## Hardhat Tasks and Tests

### Running Hardhat Tests

1. Open the `carbon-credit-marketplace-v4` folder.
2. Execute:

   ```shell
   npx hardhat test
   ```

3. For real-time cost analysis of functions, add necessary API keys in the `.env` file. Uncomment these lines in `hardhat.config.ts`:

   ```typescript
   L1Etherscan: process.env.POLYGONSCAN_API
   coinmarketcap: process.env.COINMARKETCAP_API
   currencyDisplayPrecision: 5
   ```

4. Check test coverage:

   ```shell
   npx hardhat coverage
   ```

---

## Running on Localhost

### Starting Hardhat Node

1. Navigate to `carbon-credit-marketplace-v4`.
2. Start the Hardhat node:

   ```shell
   npx hardhat node
   ```

3. Add addresses to your preferred wallet following [this guide](https://medium.com/@kaishinaw/connecting-metamask-with-a-local-hardhat-network-7d8cea604dc6) for example.
   - **Note:** Use Chain ID **1337**, not **31337**.

---

### Contract Deployment

#### Using Thirdweb (Preferred)

1. Log in to [Thirdweb](https://thirdweb.com).
2. Generate a new project and retrieve the secret key.
3. Deploy contracts:

   ```shell
   npx thirdweb deploy -k [SECRET_KEY]
   ```

4. Deploy contracts in this order:
   - `ProjectRegistry`
   - `CarbonCreditToken`
   - `CarbonCreditMarketplace`

5. Ensure Thirdweb's localhost chain matches your Hardhat configuration:

   - **Name:** Localhost
   - **Slug:** localhost
   - **Chain ID:** 1337
   - **Currency:** ETH
   - **Type:** Testnet
   - **RPC:** `http://127.0.0.1:8545`

#### Using Hardhat

1. Write a deployment method in `ignition/modules` that deploys all three contracts. Refer to the [Hardhat deployment guide](https://hardhat.org/hardhat-runner/docs/guides/deploying).

---

### Frontend Integration

1. Update contract addresses in `frontend_app/src/constants/constants.ts`.
2. Add your Thirdweb project's public key (Client ID) to `frontend_app/.env`.
3. Start the frontend application:

   ```shell
   pnpm run dev
   ```

4. In a second terminal, start the backend database:

   ```shell
   pnpm run start
   ```

5. Open the frontend application at `http://localhost:3000`.
6. Log in using wallet authentication.
7. Use an account with a **Project Owner** role to:
   - Submit new projects.
   - Build credit supplies.
8. Start listening for events by clicking **Start Listening** in the top-right corner of the app.
