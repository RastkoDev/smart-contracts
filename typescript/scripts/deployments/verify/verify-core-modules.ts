import { IAccountWithKeys, IClientWithData } from "../../utils/interfaces";
import { verifyModule } from "../../utils/submit-tx";

export const verifyGasOracle = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const moduleFolder = "gas-oracle";
  const moduleName = "gas-oracle";

  const result = await verifyModule(
    client,
    sender,
    keyset,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying GasOracle");
  console.log(result);
};

export const verifyValidatorAnnounce = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const moduleFolder = "validator-announce";
  const moduleName = "validator-announce";

  const result = await verifyModule(
    client,
    sender,
    keyset,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying ValidatorAnnounce");
  console.log(result);
};

export const verifyISM = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const moduleFolder = "ism";
  const moduleName = "merkle-tree-ism";

  const result = await verifyModule(
    client,
    sender,
    keyset,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying ISM");
  console.log(result);
};

export const verifyISMRouting = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const moduleFolder = "ism";
  const moduleName = "domain-routing-ism";

  const result = await verifyModule(
    client,
    sender,
    keyset,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying ISM Routing");
  console.log(result);
};

export const verifyIGP = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const moduleFolder = "igp";
  const moduleName = "igp";

  const result = await verifyModule(
    client,
    sender,
    keyset,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying IGP");
  console.log(result);
};

export const verifyMerkleTreeHook = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const moduleFolder = "merkle";
  const moduleName = "merkle-tree-hook";

  const result = await verifyModule(
    client,
    sender,
    keyset,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying Merkle Tree Hook");
  console.log(result);
};

export const verifyMailbox = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const moduleFolder = "mailbox";
  const moduleName = "mailbox";

  const result = await verifyModule(
    client,
    sender,
    keyset,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying Mailbox");
  console.log(result);
};

export const verifyGasStation = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const moduleFolder = "gas-station";
  const moduleName = "kinesis-gas-station";

  const result = await verifyModule(
    client,
    sender,
    keyset,
    moduleFolder,
    moduleName,
  );
  console.log("\nVerifiying Gas Station");
  console.log(result);
};
