import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getClientDatas } from "../../utils/constants";
import { verifyHypERC20Coll } from "./verify-warp-module";

export const verifyCollateralWarpRoute = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  hypERC20Address: `0x${string}`,
  tokenSymbolKDA: string,
) => {
  const clientDatas = getClientDatas(phase);

  const hypERC20 = await hre.viem.getContractAt("HypERC20", hypERC20Address);
  const tokenPrecisionKDA = await hypERC20.read.decimals();

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = verifyHypERC20Coll(
      clientDatas[i],
      tokenSymbolKDA,
      tokenPrecisionKDA,
    );
  }
  await Promise.all(promises);
};
