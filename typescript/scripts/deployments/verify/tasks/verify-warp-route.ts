import { task } from "hardhat/config";
import { readFile } from "fs/promises";
import {
  EVM_DOMAINS,
  EVM_NETWORKS,
  KDA_DOMAINS,
} from "../../../utils/constants";
import { IDomains, INetworks } from "../../../utils/interfaces";
import { verifyCollateralWarpRoute } from "../verify-collateral-route";
import { verifySyntheticWarpRoute } from "../verify-synthetic-route";
import { verifyNativeWarpRoute } from "../verify-native-route";

task("verify-warp", "Verfiy Warp Route")
  .addPositionalParam("outputFile")
  .addPositionalParam("jsonFile")
  .addPositionalParam("phase")
  .setAction(async (taskArgs, hre) => {
    console.log("Verifying Warp Route");

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
        // verify native
        await verifyNativeWarpRoute(
          taskArgs.phase,
          parsedJSONFile.chains[EVM_NETWORKS[taskArgs.phase as keyof INetworks]]
            .nativeToken.symbol,
          parsedJSONFile.chains[EVM_NETWORKS[taskArgs.phase as keyof INetworks]]
            .nativeToken.decimals,
        );
      } else if (
        route[KDA_DOMAINS[taskArgs.phase as keyof IDomains]].type ===
        "Synthetic"
      ) {
        // verify synthetic
        await verifySyntheticWarpRoute(
          taskArgs.phase,
          hre,
          route[EVM_DOMAINS[taskArgs.phase as keyof IDomains]].address,
        );
      } else if (
        route[KDA_DOMAINS[taskArgs.phase as keyof IDomains]].type ===
        "Collateral"
      ) {
        // verify collateral
        await verifyCollateralWarpRoute(
          taskArgs.phase,
          hre,
          route[EVM_DOMAINS[taskArgs.phase as keyof IDomains]].address,
          `${route[KDA_DOMAINS[taskArgs.phase as keyof IDomains]].symbol}`,
        );
      }
    }
  });
