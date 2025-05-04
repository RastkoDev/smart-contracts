import path from "path";
import { IClientWithData, IAccountWithKeys } from "../../utils/interfaces";
import { upgradeModule, upgradeModuleDirectly } from "../../utils/submit-tx";
import {
  createNamedFile,
  getCollateralFile,
  getSyntheticFile,
} from "../../generator/generate-modules";

const folderPrefix = "../../../../pact/";

export const upgradeToken = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "mainnet-tokens/kda.pact",
  );
  const result = await upgradeModule(client, sender, account, fileName);
  console.log(`\nUpgrading Token`);
  console.log(result);
};

export const upgradeHypERC20Synth = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  name: string,
  precision: number,
) => {
  const file = await getSyntheticFile();
  const resultSyn = await createNamedFile(file, name, precision.toString());

  const result = await upgradeModuleDirectly(
    client,
    sender,
    account,
    resultSyn,
  );
  console.log(`\nUpgrading ${name}`);
  console.log(result);
};

export const upgradeHypERC20Coll = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  name: string,
  precision: number,
) => {
  const file = await getCollateralFile();
  const resultCol = await createNamedFile(file, name, precision.toString());

  const result = await upgradeModuleDirectly(
    client,
    sender,
    account,
    resultCol,
  );
  console.log(`\nUpgrading ${name}`);
  console.log(result);
};
