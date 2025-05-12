import { IAccountWithKeys, IClientWithData } from "../../utils/interfaces";
import { verifyModuleDirectly } from "../../utils/submit-tx";
import {
  createTokenFile,
  getCollateralFile,
  getSyntheticFile,
} from "../../generator/generate-modules";

export const verifyHypERC20Synth = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  name: string,
  precision: number
) => {
  const file = await getSyntheticFile();
  const resultSyn = await createTokenFile(file, name, precision.toString());

  const result = await verifyModuleDirectly(
    client,
    sender,
    keyset,
    resultSyn,
    name
  );
  console.log(`\nVerifying ${name}`);
  console.log(result);
};

export const verifyHypERC20Coll = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  name: string,
  precision: number
) => {
  const file = await getCollateralFile();
  const resultCol = await createTokenFile(file, name, precision.toString());

  const result = await verifyModuleDirectly(
    client,
    sender,
    keyset,
    resultCol,
    name
  );
  console.log(`\nVerifying ${name}`);
  console.log(result);
};
