import { task } from "hardhat/config";
import { readFile } from "fs/promises";
import {
  ba_account,
  EVM_NETWORKS,
  getClientDatas,
} from "../../../utils/constants";
import { configureEVM, writeTokens } from "../warp-utils";
import { INetworks, ITokenEVM } from "../../../utils/interfaces";
import { parseEther, walletActions } from "viem";
import { deployFungible } from "../deploy-warp-modules";

task("config", "Configure Chains")
  .addPositionalParam("inputFile")
  .addPositionalParam("jsonFile")
  .addPositionalParam("tokenObjectsEVM")
  .addPositionalParam("tokenObjectsKDA")
  .addPositionalParam("phase")
  .setAction(async (taskArgs, hre) => {
    console.log("Configuring Chains");

    const [deployer] = await hre.viem.getWalletClients();
    const walletClient = deployer.extend(walletActions);
    const clientDatas = getClientDatas(taskArgs.phase);

    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString());
    const currentChain =
      parsedJSON[EVM_NETWORKS[taskArgs.phase as keyof INetworks]];

    const oracleAddress: `0x${string}` = currentChain.storageGasOracle;
    const igpAddress: `0x${string}` = currentChain.interchainGasPaymaster;
    const ismAddress: `0x${string}` = currentChain.staticAggregationIsm;
    const mailboxAddress: `0x${string}` = currentChain.mailbox;

    await configureEVM(
      taskArgs.phase,
      hre,
      oracleAddress,
      igpAddress,
      ismAddress,
      mailboxAddress,
    );

    if (taskArgs.phase === "devnet") {
      const fileTokenObjectsEVM = await readFile(taskArgs.tokenObjectsEVM);
      const tokenObjectsEVM = JSON.parse(fileTokenObjectsEVM.toString());
      let devnetTokenObjectsEVM = new Array<ITokenEVM>();
      for (let tokenObjectEVM of tokenObjectsEVM[taskArgs.phase]) {
        const tokenEVM = await hre.viem.deployContract(
          "ERC20CollateralDec",
          [],
          {
            walletClient,
          },
        );
        await tokenEVM.write.initialize([
          parseEther("500"),
          tokenObjectEVM.symbol,
          tokenObjectEVM.symbol,
          tokenObjectEVM.decimals,
        ]);
        devnetTokenObjectsEVM.push({
          symbol: tokenObjectEVM.symbol,
          address: tokenEVM.address,
          decimals: tokenObjectEVM.decimals,
        });
      }
      tokenObjectsEVM[taskArgs.phase] = devnetTokenObjectsEVM;
      await writeTokens(taskArgs.tokenObjectsEVM, tokenObjectsEVM);

      const fileTokenObjectsKDA = await readFile(taskArgs.tokenObjectsKDA);
      const tokenObjectsKDA = JSON.parse(fileTokenObjectsKDA.toString());
      for (let tokenObjectKDA of tokenObjectsKDA[taskArgs.phase]) {
        if (tokenObjectKDA.name === "coin") {
          continue;
        }
        let promises: Promise<void>[] = new Array<Promise<void>>(
          clientDatas.length,
        );
        for (let i: number = 0; i < clientDatas.length; i++) {
          promises[i] = deployFungible(
            clientDatas[i],
            ba_account,
            ba_account,
            tokenObjectKDA.name,
          );
        }
        await Promise.all(promises);
      }
    }
  });
