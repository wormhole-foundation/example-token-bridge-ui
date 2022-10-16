import {
  ChainId,
  ChainName,
  coalesceChainId,
  ensureHexPrefix,
  getForeignAssetAddress,
} from "@certusone/wormhole-sdk";
import { AptosClient } from "aptos";
import { APTOS_URL } from "./consts";

export enum AptosNetwork {
  Testnet = "Testnet",
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Localhost = "Localhost",
}

export const getAptosWallet = () => {
  if ("aptos" in window) {
    return (window as any).aptos;
  } else if ("martian" in window) {
    return (window as any).martian;
  } else {
    window.open("https://petra.app/", "_blank", "noopener noreferrer");
    return undefined;
  }
};

export const getAptosClient = () => new AptosClient(APTOS_URL);

// TODO: use updated SDK function
export async function getForeignAssetAptos(
  client: AptosClient,
  tokenBridgeAddress: string,
  originChain: ChainId | ChainName,
  originAddress: string
): Promise<string | null> {
  const originChainId = coalesceChainId(originChain);
  const assetAddress = getForeignAssetAddress(
    tokenBridgeAddress,
    originChainId,
    originAddress
  );
  if (!assetAddress) {
    return null;
  }

  try {
    // check if asset exists and throw if it doesn't
    await client.getAccountResource(
      assetAddress,
      `0x1::coin::CoinInfo<${ensureHexPrefix(assetAddress)}::coin::T>`
    );
    return assetAddress;
  } catch (e) {
    return null;
  }
}

export async function waitForSignAndSubmitTransaction(
  transaction: any
): Promise<string> {
  const wallet = getAptosWallet();
  try {
    console.log("calling signAndSubmitTransaction", transaction);
    console.log(typeof transaction.arguments[0]);
    console.log(transaction.arguments[0] instanceof Uint8Array);
    let hash = "";
    if (wallet.generateSignAndSubmitTransaction) {
      // Martian
      hash = await wallet.generateSignAndSubmitTransaction(
        wallet.address,
        transaction
      );
    } else {
      // Petra
      hash = (await wallet.signAndSubmitTransaction(transaction)).hash;
    }
    if (!hash) {
      throw new Error("Invalid hash");
    }
    const client = getAptosClient();
    await client.waitForTransaction(hash);
    return hash;
  } catch (e) {
    throw e;
  }
}
