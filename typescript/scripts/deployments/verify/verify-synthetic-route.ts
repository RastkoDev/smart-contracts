import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getClientDatas } from "../../utils/constants";
import { verifyHypERC20Synth } from "./verify-warp-module";

export const verifySyntheticWarpRoute = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  hypERC20CollateralAddress: `0x${string}`,
) => {
  const clientDatas = getClientDatas(phase);

  const hypERC20Collateral = await hre.viem.getContractAt(
    "HypERC20Collateral",
    hypERC20CollateralAddress,
  );
  const tokenAddressEVM = await hypERC20Collateral.read.wrappedToken();

  const erc20Collateral = await hre.viem.getContractAt(
    "ERC20Collateral" as string,
    tokenAddressEVM,
  );
  const tokenSymbolEVM = await erc20Collateral.read.symbol();
  const tokenSymbolKDA = `kb-${tokenSymbolEVM}`;

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = verifyHypERC20Synth(
      clientDatas[i],
      tokenSymbolKDA,
      (await erc20Collateral.read.decimals()) as number,
    );
  }
  await Promise.all(promises);
};
