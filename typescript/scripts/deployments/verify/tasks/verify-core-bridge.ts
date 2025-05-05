import { task } from "hardhat/config";
import { getClientDatas } from "../../../utils/constants";
import {
  verifyGasOracle,
  verifyGasStation,
  verifyGuards,
  verifyGuards1,
  verifyIGP,
  verifyISM,
  verifyISMRouting,
  verifyMailbox,
  verifyMerkleTreeHook,
  verifyValidatorAnnounce,
} from "../verify-core-modules";

task("verify-core", "Verify Core Bridge")
  .addPositionalParam("phase")
  .setAction(async (taskArgs) => {
    console.log("Verifying Core Bridge");

    const clientDatas = getClientDatas(taskArgs.phase);

    let promises: Promise<void>[] = new Array<Promise<void>>(
      clientDatas.length,
    );

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyGasOracle(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyValidatorAnnounce(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyISM(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyISMRouting(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyIGP(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyMailbox(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyMerkleTreeHook(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyGuards(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyGuards1(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyGasStation(clientDatas[i]);
    }
    await Promise.all(promises);
  });
