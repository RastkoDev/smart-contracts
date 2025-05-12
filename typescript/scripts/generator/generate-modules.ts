import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";
import path from "path";
import { NAMESPACES } from "../utils/constants";
import { IClientWithData, IDomains } from "../utils/interfaces";

export const getCollateralFile = async () => {
  const templateFile = (
    await readFile(path.join(__dirname, "../../../pact/col-template.pact"))
  ).toString();

  return templateFile;
};

export const getSyntheticFile = async () => {
  const templateFile = (
    await readFile(path.join(__dirname, "../../../pact/syn-template.pact"))
  ).toString();

  return templateFile;
};

export const createTokenFile = async (
  file: string,
  moduleName: string,
  precision: string
) => {
  const nameRegExp = new RegExp("SYMBOL", "g");
  let resultFile = file.replaceAll(nameRegExp, moduleName);
  const precisionRegExp = new RegExp("PRECISION", "g");
  resultFile = resultFile.replaceAll(precisionRegExp, precision);

  return resultFile;
};

export const createNamespaceFile = async (
  client: IClientWithData,
  file: string
) => {
  const namespaceRegExp = new RegExp("NAMESPACE", "g");
  let resultFile = file.replaceAll(
    namespaceRegExp,
    NAMESPACES[client.phase as keyof IDomains]
  );
  return resultFile;
};

async function main() {
  const colPath = path.join(
    __dirname,
    "../../../pact/hyp-erc20-collateral/hyp-erc20-collateral.pact"
  );

  const synPath = path.join(
    __dirname,
    "../../../pact/hyp-erc20/hyp-erc20.pact"
  );

  const synName = "hyp-erc20";
  const colName = "hyp-erc20-collateral";

  const resultSyn = await createTokenFile(
    await getSyntheticFile(),
    synName,
    "18"
  );
  await writeFile(synPath, resultSyn);

  const resultCol = await createTokenFile(
    await getCollateralFile(),
    colName,
    "18"
  );
  await writeFile(colPath, resultCol);
}

main();
