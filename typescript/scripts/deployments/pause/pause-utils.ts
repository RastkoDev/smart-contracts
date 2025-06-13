import { http, walletActions, getContract, createPublicClient } from "viem";
import { PausableIsm__factory } from "@hyperlane-xyz/core";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { bridgeNetwork, NAMESPACES } from "../../utils/constants";
import {
  IAccountWithKeys,
  ICapability,
  IClientWithData,
  IDomains,
} from "../../utils/interfaces";
import { submitSignedTxWithCap } from "../../utils/submit-tx";

export const pauseKDA = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
      (mailbox.pause true)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.mailbox.PAUSE`,
    },
  ];
  const result = await submitSignedTxWithCap(
    client,
    sender,
    account,
    command,
    capabilities,
  );
  console.log(result);
};

export const unpauseKDA = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
      (mailbox.pause false)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.mailbox.PAUSE`,
    },
  ];
  const result = await submitSignedTxWithCap(
    client,
    sender,
    account,
    command,
    capabilities,
  );
  console.log(result);
};

export const pauseEVM = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  ismAddress: `0x${string}`,
) => {
  const [deployer] = await hre.viem.getWalletClients();

  const publicClient = createPublicClient({
    chain: bridgeNetwork(phase),
    transport: http(),
  });

  const walletClient = deployer.extend(walletActions);

  const ism = getContract({
    address: ismAddress,
    abi: PausableIsm__factory.abi,
    publicClient,
    walletClient,
  });

  await ism.write.pause();
};

export const unpauseEVM = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  ismAddress: `0x${string}`,
) => {
  const [deployer] = await hre.viem.getWalletClients();

  const publicClient = createPublicClient({
    chain: bridgeNetwork(phase),
    transport: http(),
  });

  const walletClient = deployer.extend(walletActions);

  const ism = getContract({
    address: ismAddress,
    abi: PausableIsm__factory.abi,
    publicClient,
    walletClient,
  });

  await ism.write.unpause();
};
