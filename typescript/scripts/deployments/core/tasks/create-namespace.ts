import { task } from "hardhat/config";
import { readFileSync, writeFileSync } from "fs";
import {
  ba_account,
  fd_account,
  getClientDatas,
} from "../../../utils/constants";
import { buyGas, createNamespace } from "../../../utils/kadena-utils";

task("namespace", "Create Namespace")
  .addPositionalParam("outputFile")
  .addPositionalParam("jsonFile")
  .addPositionalParam("phase")
  .setAction(async (taskArgs) => {
    console.log("Creating Namespace");

    const clientDatas = getClientDatas(taskArgs.phase);

    let promises: Promise<void>[] = new Array<Promise<void>>(
      clientDatas.length,
    );
    if (taskArgs.phase === "devnet") {
      for (let i: number = 0; i < clientDatas.length; i++) {
        promises[i] = buyGas(clientDatas[i], fd_account, ba_account);
      }
      await Promise.all(promises);
    }

    let namespacePromises: Promise<string>[] = new Array<Promise<string>>(
      clientDatas.length,
    );
    for (let i: number = 0; i < clientDatas.length; i++) {
      namespacePromises[i] = createNamespace(
        clientDatas[i],
        ba_account,
        ba_account,
      );
    }
    const namespaces = await Promise.all(namespacePromises);

    const kadenaConfig = { namespace: namespaces[0] };
    writeFileSync(`${taskArgs.outputFile}`, JSON.stringify(kadenaConfig), {
      flag: "w",
    });
    console.log(`Namespace written to ${taskArgs.outputFile}`);

    // Update the specified JSON file
    const jsonFileContent = JSON.parse(readFileSync(taskArgs.jsonFile, "utf8"));
    if (jsonFileContent.chains && jsonFileContent.chains.kadena) {
      jsonFileContent.chains.kadena.namespace = namespaces[0]; // Assuming the first namespace is for kadena
      writeFileSync(
        taskArgs.jsonFile,
        JSON.stringify(jsonFileContent, null, 2),
        {
          flag: "w",
        },
      );
      console.log(`Updated JSON file at ${taskArgs.jsonFile}`);
    } else {
      console.error("Failed to find the 'kadena' chain in the JSON file.");
    }
  });
