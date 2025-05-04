import { task } from "hardhat/config";
import { readFile } from "fs/promises";
import {
  EVM_DOMAINS,
  EVM_NETWORKS,
  KDA_DOMAINS,
} from "../../../utils/constants";
import { IDomains, INetworks } from "../../../utils/interfaces";
import { upgradeCollateralWarpRoute } from "../upgrade-collateral-route";
import { upgradeSyntheticWarpRoute } from "../upgrade-synthetic-route";
import { upgradeNativeWarpRoute } from "../upgrade-native-route";

task("upgrade-warp", "Deploy Warp Route")
  .addPositionalParam("inputFile")
  .addPositionalParam("outputFile")
  .addPositionalParam("jsonFile")
  .addPositionalParam("phase")
  .setAction(async (taskArgs, hre) => {
    console.log("Upgrading Warp Route");

    const inputFile = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(inputFile.toString());
    const currentChain =
      parsedJSON[EVM_NETWORKS[taskArgs.phase as keyof INetworks]];
    const proxyAdminAddress: `0x${string}` = currentChain.proxyAdmin;
    const mailboxAddress: `0x${string}` = currentChain.mailbox;

    const txtFile = await readFile(taskArgs.outputFile);
    const parsedTXTFile = JSON.parse(txtFile.toString());

    const routes = Object.keys(parsedTXTFile).map((token) => {
      const tokenData = parsedTXTFile[token];
      return tokenData;
    });

    const jsonFile = await readFile(taskArgs.jsonFile);
    const parsedJSONFile = JSON.parse(jsonFile.toString());

    for (let route of routes) {
      if (
        route[EVM_DOMAINS[taskArgs.phase as keyof IDomains]].type === "Native"
      ) {
        // upgrade native
        await upgradeNativeWarpRoute(
          taskArgs.phase,
          hre,
          mailboxAddress,
          proxyAdminAddress,
          route[EVM_DOMAINS[taskArgs.phase as keyof IDomains]].address,
          EVM_DOMAINS[taskArgs.phase as keyof IDomains],
          KDA_DOMAINS[taskArgs.phase as keyof IDomains],
          parsedJSONFile.chains[EVM_NETWORKS[taskArgs.phase as keyof INetworks]]
            .nativeToken.symbol,
          parsedJSONFile.chains[EVM_NETWORKS[taskArgs.phase as keyof INetworks]]
            .nativeToken.decimals,
        );
      } else if (
        route[KDA_DOMAINS[taskArgs.phase as keyof IDomains]].type ===
        "Synthetic"
      ) {
        // upgrade synthetic
        await upgradeSyntheticWarpRoute(
          taskArgs.phase,
          hre,
          mailboxAddress,
          proxyAdminAddress,
          route[EVM_DOMAINS[taskArgs.phase as keyof IDomains]].address,
          EVM_DOMAINS[taskArgs.phase as keyof IDomains],
          KDA_DOMAINS[taskArgs.phase as keyof IDomains],
        );
      } else if (
        route[KDA_DOMAINS[taskArgs.phase as keyof IDomains]].type ===
        "Collateral"
      ) {
        // upgrade collateral
        await upgradeCollateralWarpRoute(
          taskArgs.phase,
          hre,
          mailboxAddress,
          proxyAdminAddress,
          route[EVM_DOMAINS[taskArgs.phase as keyof IDomains]].address,
          EVM_DOMAINS[taskArgs.phase as keyof IDomains],
          KDA_DOMAINS[taskArgs.phase as keyof IDomains],
          `${route[KDA_DOMAINS[taskArgs.phase as keyof IDomains]].symbol}`,
        );
      }
    }
  });
