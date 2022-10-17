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

export async function waitForSignAndSubmitTransaction(
  transaction: any
): Promise<string> {
  const wallet = getAptosWallet();
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
