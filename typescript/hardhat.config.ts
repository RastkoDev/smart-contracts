import { HardhatUserConfig } from "hardhat/config";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";

import "./scripts/deployments/core/tasks/create-namespace.ts";
import "./scripts/deployments/core/tasks/deploy-core-bridge.ts";
import "./scripts/deployments/core/tasks/create-gas-station.ts";
import "./scripts/deployments/core/tasks/upgrade-core-bridge.ts";
import "./scripts/deployments/warp/tasks/configure-chains.ts";
import "./scripts/deployments/warp/tasks/deploy-warp-route.ts";
import "./scripts/deployments/warp/tasks/upgrade-warp-route.ts";
import "./scripts/deployments/pause/tasks/pause.ts";
import "./scripts/deployments/pause/tasks/unpause.ts";

import dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      url: "http://anvil:8545",
      accounts: [privateKey],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      chainId: 11155111,
      accounts: [privateKey],
    },
    ethereum: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      chainId: 1,
      accounts: [privateKey],
    },
    moonbaseAlpha: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: [privateKey],
    },
    polygonMumbai: {
      url: "https://rpc.ankr.com/polygon_mumbai",
      chainId: 80001,
      accounts: [privateKey],
    },
  },
  etherscan: {
    apiKey: "MQ4SRM16Q3BGPDH4QPEV4S1B82I3BQP6CT",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: ["contracts/mocks/"],
  },
};

export default config;
