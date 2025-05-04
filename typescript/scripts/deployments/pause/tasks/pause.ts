import { task } from "hardhat/config";
import { readFile } from "fs/promises";
import {
  ba_account,
  EVM_NETWORKS,
  getClientDatas,
} from "../../../utils/constants";
import { INetworks } from "../../../utils/interfaces";
import { pauseEVM } from "../pause-utils";
import { pauseKDA } from "../pause-utils";

task("pause", "Pause Bridge")
  .addPositionalParam("inputFile")
  .addPositionalParam("phase")
  .setAction(async (taskArgs, hre) => {
    console.log("Pausing Bridge");

    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString());
    const currentChain =
      parsedJSON[EVM_NETWORKS[taskArgs.phase as keyof INetworks]];

    const ismAddress: `0x${string}` = currentChain.pausableIsm;

    await pauseEVM(taskArgs.phase, hre, ismAddress);

    const clientDatas = getClientDatas(taskArgs.phase);

    let promises: Promise<void>[] = new Array<Promise<void>>(
      clientDatas.length,
    );

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = pauseKDA(clientDatas[0], ba_account, ba_account);
    }
    await Promise.all(promises);
  });
