import { JsonRpcProvider } from "@mysten/sui.js";
import {
  SUI_CONNECTION,
  getBridgeAddressForChain,
  getTokenBridgeAddressForChain,
} from "./consts";
import { CHAIN_ID_SUI } from "@certusone/wormhole-sdk";
import { getPackageId } from "@certusone/wormhole-sdk/lib/esm/sui";

export const getSuiProvider = () => new JsonRpcProvider(SUI_CONNECTION);

let suiCoreBridgePackageId: string | null = null;
export const getSuiCoreBridgePackageId = async (provider: JsonRpcProvider) => {
  if (!suiCoreBridgePackageId) {
    // cache the result
    suiCoreBridgePackageId = await getPackageId(
      provider,
      getBridgeAddressForChain(CHAIN_ID_SUI)
    );
  }
  return suiCoreBridgePackageId;
};

let suiTokenBridgePackageId: string | null = null;
export const getSuiTokenBridgePackageId = async (provider: JsonRpcProvider) => {
  if (!suiTokenBridgePackageId) {
    suiTokenBridgePackageId = await getPackageId(
      provider,
      getTokenBridgeAddressForChain(CHAIN_ID_SUI)
    );
  }
  return suiTokenBridgePackageId;
};
