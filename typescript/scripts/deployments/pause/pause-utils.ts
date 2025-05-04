import { http, walletActions, getContract, createPublicClient } from "viem";
import { PausableIsm__factory } from "@hyperlane-xyz/core";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { bridgeNetwork } from "../../utils/constants";
import {
  IAccountWithKeys,
  ICapability,
  IClientWithData,
} from "../../utils/interfaces";
import { submitSignedTxWithCap } from "../../utils/submit-tx";

export const pauseKDA = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const command = `(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")
      (mailbox.pause)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "n_9b079bebc8a0d688e4b2f4279a114148d6760edf.mailbox.ONLY_ADMIN" },
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
  const command = `(namespace "n_9b079bebc8a0d688e4b2f4279a114148d6760edf")
      (mailbox.unpause)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "n_9b079bebc8a0d688e4b2f4279a114148d6760edf.mailbox.ONLY_ADMIN" },
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
