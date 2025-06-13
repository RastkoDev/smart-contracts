import { IClient, IKeyPair } from "@kadena/client";

export interface ITokenEVM {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
}

export interface ITokenKDA {
  symbol: string;
  name: string;
  precision: number;
}

export interface IRoute {
  [domain: number]: {
    address: string;
    symbol: string;
    type: string;
  };
}

export interface IRouteObject {
  [key: string]: IRoute;
}

export interface INamespaces {
  devnet: string;
  testnet: string;
  mainnet: string;
}

export interface INetworks {
  devnet: string;
  testnet: string;
  mainnet: string;
}

export interface IDomains {
  devnet: number;
  testnet: number;
  mainnet: number;
}

export interface IUrls {
  devnet: string;
  testnet: string;
  mainnet: string;
}

export interface TxError {
  message: string;
}

export interface TxData {
  data: string;
}

export interface IClientWithData {
  client: IClient;
  chainId: string;
  phase: string;
}

export interface IAccountWithKeys {
  name: string;
  keysetName: string;
  keys: IKeyPair;
}

export interface IAccountMultipleWithKeys {
  name: string;
  keysetName: string;
  multipleKeys: IKeyPair[];
}

export interface ICapability {
  name: string;
  args?: any[];
}

export interface IRemoteGasData {
  domain: number;
  tokenExchangeRate: string;
  gasPrice: string;
}

export interface IValidatorAnnounceCfg {
  validator: string;
  storageLocation: string;
  signature: string;
}

export interface IMultisigISMCfg {
  validators: string[];
  threshold: number;
}

export interface IRemoteGasAmount {
  domain: number;
  gasAmount: string;
}

export enum TokenType {
  Collateral = "Collateral",
  Synthetic = "Synthetic",
  Native = "Native",
}

export type WarpRouteCfg = {};
