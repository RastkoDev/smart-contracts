import { task } from "hardhat/config";
import { readFile } from "fs/promises";
import {
  EVM_DOMAINS,
  EVM_NETWORKS,
  KDA_DOMAINS,
} from "../../../utils/constants";
import { deployNativeWarpRoute } from "../deploy-native-route";
import { deployCollateralWarpRoute } from "../deploy-collateral-route";
import { deploySyntheticWarpRoute } from "../deploy-synthetic-route";
import { writeRoutes } from "../warp-utils";
import { IDomains, INetworks, IRouteObject } from "../../../utils/interfaces";

task("deploy-warp", "Deploy Warp Route")
  .addPositionalParam("inputFile")
  .addPositionalParam("outputFile")
  .addPositionalParam("jsonFile")
  .addPositionalParam("tokenObjectsEVM")
  .addPositionalParam("tokenObjectsKDA")
  .addPositionalParam("phase")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying Warp Route");

    const inputFile = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(inputFile.toString());
    const currentChain =
      parsedJSON[EVM_NETWORKS[taskArgs.phase as keyof INetworks]];
    const proxyAdminAddress: `0x${string}` = currentChain.proxyAdmin;
    const igpAddress: `0x${string}` = currentChain.interchainGasPaymaster;
    const ismAddress: `0x${string}` = currentChain.staticAggregationIsm;
    const mailboxAddress: `0x${string}` = currentChain.mailbox;

    const jsonFile = await readFile(taskArgs.jsonFile);
    const parsedJSONFile = JSON.parse(jsonFile.toString());

    const fileTokenObjectsEVM = await readFile(taskArgs.tokenObjectsEVM);
    const tokenObjectsEVM = JSON.parse(fileTokenObjectsEVM.toString());

    const fileTokenObjectsKDA = await readFile(taskArgs.tokenObjectsKDA);
    const tokenObjectsKDA = JSON.parse(fileTokenObjectsKDA.toString());

    let routeResult: IRouteObject = {};

    // deploy native
    const nativeRouteResult = await deployNativeWarpRoute(
      taskArgs.phase,
      hre,
      igpAddress,
      ismAddress,
      mailboxAddress,
      proxyAdminAddress,
      EVM_DOMAINS[taskArgs.phase as keyof IDomains],
      KDA_DOMAINS[taskArgs.phase as keyof IDomains],
      parsedJSONFile.chains[EVM_NETWORKS[taskArgs.phase as keyof INetworks]]
        .nativeToken.symbol,
      parsedJSONFile.chains[EVM_NETWORKS[taskArgs.phase as keyof INetworks]]
        .nativeToken.decimals,
    );
    routeResult[
      parsedJSONFile.chains[
        EVM_NETWORKS[taskArgs.phase as keyof INetworks]
      ].nativeToken.symbol
    ] = nativeRouteResult;

    // deploy synthetic
    for (let tokenObjectEVM of tokenObjectsEVM[taskArgs.phase]) {
      const syntheticRouteResult = await deploySyntheticWarpRoute(
        taskArgs.phase,
        hre,
        igpAddress,
        ismAddress,
        mailboxAddress,
        proxyAdminAddress,
        EVM_DOMAINS[taskArgs.phase as keyof IDomains],
        KDA_DOMAINS[taskArgs.phase as keyof IDomains],
        tokenObjectEVM.address,
      );
      routeResult[tokenObjectEVM.symbol] = syntheticRouteResult;
    }

    // deploy collateral
    for (let tokenObjectKDA of tokenObjectsKDA[taskArgs.phase]) {
      const collateralRouteResult = await deployCollateralWarpRoute(
        taskArgs.phase,
        hre,
        igpAddress,
        ismAddress,
        mailboxAddress,
        proxyAdminAddress,
        EVM_DOMAINS[taskArgs.phase as keyof IDomains],
        KDA_DOMAINS[taskArgs.phase as keyof IDomains],
        `${tokenObjectKDA.symbol}`,
        `${tokenObjectKDA.name}`,
        tokenObjectKDA.precision,
      );
      routeResult[tokenObjectKDA.symbol] = collateralRouteResult;
    }

    await writeRoutes(taskArgs.outputFile, routeResult);
  });
