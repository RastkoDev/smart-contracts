import { IClientWithData } from "../../utils/interfaces";
import { verifyModuleDirectly } from "../../utils/submit-tx";
import {
  createNamedFile,
  getCollateralFile,
  getSyntheticFile,
} from "../../generator/generate-modules";

export const verifyHypERC20Synth = async (
  client: IClientWithData,
  name: string,
  precision: number,
) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const file = await getSyntheticFile();
  const resultSyn = await createNamedFile(file, name, precision.toString());

  const result = await verifyModuleDirectly(
    client,
    mainnetNamespace,
    resultSyn,
    name,
  );
  console.log(`\nVerifying ${name}`);
  console.log(result);
};

export const verifyHypERC20Coll = async (
  client: IClientWithData,
  name: string,
  precision: number,
) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const file = await getCollateralFile();
  const resultCol = await createNamedFile(file, name, precision.toString());

  const result = await verifyModuleDirectly(
    client,
    mainnetNamespace,
    resultCol,
    name,
  );
  console.log(`\nVerifying ${name}`);
  console.log(result);
};
