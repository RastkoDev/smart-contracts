import { ba_account, getClientDatas, ua_account } from "../../utils/constants";
import { verifyHypERC20Synth } from "./verify-warp-module";

export const verifyNativeWarpRoute = async (
  phase: string,
  tokenSymbolEVM: string,
  tokenDecimalsEVM: number,
) => {
  const clientDatas = getClientDatas(phase);

  const tokenSymbolKDA = `kb-${tokenSymbolEVM}`;

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = verifyHypERC20Synth(
      clientDatas[i],
      ba_account,
      ua_account,
      tokenSymbolKDA,
      tokenDecimalsEVM,
    );
  }
  await Promise.all(promises);
};
