import { http, walletActions, getContract, createPublicClient } from "viem";
import {
  StorageGasOracle__factory,
  InterchainGasPaymaster__factory,
  Mailbox__factory,
  StaticAggregationIsm__factory,
} from "@hyperlane-xyz/core";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { bridgeNetwork, KDA_DOMAINS } from "../../utils/constants";
import { writeFileSync } from "fs";
import { IDomains, ITokenEVM } from "../../utils/interfaces";

export const configureEVM = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  oracleAddress: `0x${string}`,
  igpAddress: `0x${string}`,
  ismAddress: `0x${string}`,
  mailboxAddress: `0x${string}`,
) => {
  const [deployer] = await hre.viem.getWalletClients();

  const publicClient = createPublicClient({
    chain: bridgeNetwork(phase),
    transport: http(),
  });

  const walletClient = deployer.extend(walletActions);

  const gasOracle = getContract({
    address: oracleAddress,
    abi: StorageGasOracle__factory.abi,
    publicClient,
    walletClient,
  });

  const tokenExchangeRate = BigInt(3348);
  const gasPrice = BigInt(10000000000);

  const remoteGasDataConfig = {
    remoteDomain: KDA_DOMAINS[phase as keyof IDomains],
    tokenExchangeRate: tokenExchangeRate,
    gasPrice: gasPrice,
  };
  await gasOracle.write.setRemoteGasData([remoteGasDataConfig], {
    account: deployer.account,
  });

  const igp = getContract({
    address: igpAddress,
    abi: InterchainGasPaymaster__factory.abi,
    publicClient,
    walletClient,
  });

  const gasOverhead = BigInt(50000);

  const igpConfig = {
    remoteDomain: KDA_DOMAINS[phase as keyof IDomains],
    config: {
      gasOracle: oracleAddress,
      gasOverhead: gasOverhead,
    },
  };
  await igp.write.setDestinationGasConfigs([[igpConfig]], {
    account: deployer.account,
  });

  const ism = getContract({
    address: ismAddress,
    abi: StaticAggregationIsm__factory.abi,
    publicClient,
    walletClient,
  });

  const mailbox = getContract({
    address: mailboxAddress,
    abi: Mailbox__factory.abi,
    publicClient,
    walletClient,
  });

  await mailbox.write.setDefaultIsm([ism.address]);
};

export const writeRoutes = async (routesFilePath: string, routes: object) => {
  const data = JSON.stringify(routes);
  writeFileSync(routesFilePath, data, {
    flag: "w",
  });
};

export const writeTokens = async (
  tokensFilePath: string,
  tokenObjectsEVM: ITokenEVM[],
) => {
  const data = JSON.stringify(tokenObjectsEVM);
  writeFileSync(tokensFilePath, data, {
    flag: "w",
  });
};

export const hexToBase64 = (hexString: string): string => {
  const byteArray = new Uint8Array(
    hexString.match(/[\da-f]{2}/gi)!.map((byte) => parseInt(byte, 16)),
  );
  let base64String = Buffer.from(byteArray).toString("base64");
  base64String = base64String
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64String;
};
