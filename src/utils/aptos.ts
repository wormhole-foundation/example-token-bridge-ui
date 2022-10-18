import { CHAIN_ID_APTOS } from "@certusone/wormhole-sdk";
import { AptosClient, Types } from "aptos";
import { hexZeroPad } from "ethers/lib/utils";
import { APTOS_URL, getBridgeAddressForChain } from "./consts";

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

export const getEmitterAddressAndSequenceFromResult = (
  result: Types.UserTransaction
): { emitterAddress: string; sequence: string } => {
  const data = result.events.find(
    (e) =>
      e.type ===
      `${getBridgeAddressForChain(CHAIN_ID_APTOS)}::state::WormholeMessage`
  )?.data;
  const emitterAddress = hexZeroPad(
    `0x${parseInt(data?.sender).toString(16)}`,
    32
  ).substring(2);
  const sequence = data?.sequence;
  return {
    emitterAddress,
    sequence,
  };
};

export async function waitForSignAndSubmitTransaction(
  transaction: any
): Promise<string> {
  const wallet = getAptosWallet();
  // The wallets do not handle Uint8Array serialization'
  if (transaction?.arguments) {
    transaction.arguments = transaction.arguments.map((a: any) =>
      a instanceof Uint8Array ? Array.from(a) : a
    );
  }
  try {
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
