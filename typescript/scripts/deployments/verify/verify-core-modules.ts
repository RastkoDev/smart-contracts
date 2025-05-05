import { IClientWithData } from "../../utils/interfaces";
import { verifyModule } from "../../utils/submit-tx";

export const verifyGasOracle = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "gas-oracle";
  const moduleName = "gas-oracle";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying GasOracle");
  console.log(result);
};

export const verifyValidatorAnnounce = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "validator-announce";
  const moduleName = "validator-announce";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying ValidatorAnnounce");
  console.log(result);
};

export const verifyISM = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "ism";
  const moduleName = "merkle-tree-ism";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying ISM");
  console.log(result);
};

export const verifyISMRouting = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "ism";
  const moduleName = "domain-routing-ism";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying ISM Routing");
  console.log(result);
};

export const verifyIGP = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "igp";
  const moduleName = "igp";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying IGP");
  console.log(result);
};

export const verifyMerkleTreeHook = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "merkle";
  const moduleName = "merkle-tree-hook";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying Merkle Tree Hook");
  console.log(result);
};

export const verifyMailbox = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "mailbox";
  const moduleName = "mailbox";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying Mailbox");
  console.log(result);
};

export const verifyGuards = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "gas-station";
  const moduleName = "guards";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying Guards");
  console.log(result);
};

export const verifyGuards1 = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "gas-station";
  const moduleName = "guards1";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying Guards1");
  console.log(result);
};

export const verifyGasStation = async (client: IClientWithData) => {
  const mainnetNamespace = "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff";
  const moduleFolder = "gas-station";
  const moduleName = "kinesis-gas-station";

  const result = await verifyModule(
    client,
    mainnetNamespace,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying Gas Station");
  console.log(result);
};
