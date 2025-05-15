import { task } from "hardhat/config";
import {
  ba_account,
  getClientDatas,
  ua_account,
} from "../../../utils/constants";
import {
  verifyGasOracle,
  verifyGasStation,
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
      promises[i] = verifyGasOracle(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyValidatorAnnounce(
        clientDatas[i],
        ba_account,
        ua_account,
      );
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyISM(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyISMRouting(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyIGP(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyMailbox(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyMerkleTreeHook(
        clientDatas[i],
        ba_account,
        ua_account,
      );
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = verifyGasStation(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);
  });
