import { task } from "hardhat/config";
import { readFileSync, writeFileSync } from "fs";
import { ba_account, getClientDatas } from "../../../utils/constants";
import { createGasStation, fundGasStation } from "../../../utils/kadena-utils";

task("gas-station", "Create Gas Station")
  .addPositionalParam("outputFile")
  .addPositionalParam("jsonFile")
  .addPositionalParam("phase")
  .setAction(async (taskArgs) => {
    console.log("Creating Gas Station");

    const clientDatas = getClientDatas(taskArgs.phase);

    let gasStationPromises: Promise<string>[] = new Array<Promise<string>>(
      clientDatas.length,
    );
    for (let i: number = 0; i < clientDatas.length; i++) {
      gasStationPromises[i] = createGasStation(
        clientDatas[i],
        ba_account,
        ba_account,
      );
    }
    const gasStations = await Promise.all(gasStationPromises);

    const kadenaConfigFile = readFileSync(taskArgs.outputFile, "utf8");
    const kadenaConfig = JSON.parse(kadenaConfigFile.toString());

    kadenaConfig.gasStation = gasStations[0];
    writeFileSync(`${taskArgs.outputFile}`, JSON.stringify(kadenaConfig), {
      flag: "w",
    });
    console.log(`GasStation written to ${taskArgs.outputFile}`);

    // Update the specified JSON file
    const jsonFileContent = JSON.parse(readFileSync(taskArgs.jsonFile, "utf8"));
    if (jsonFileContent.chains && jsonFileContent.chains.kadena) {
      jsonFileContent.chains.kadena.gasStation = gasStations[0]; // Assuming the first gas station is for kadena
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

    let promises: Promise<void>[] = new Array<Promise<void>>(
      clientDatas.length,
    );

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = fundGasStation(
        clientDatas[i],
        ba_account,
        ba_account,
        gasStations[i],
      );
    }
    await Promise.all(promises);
  });
