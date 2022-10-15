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
    console.log("calling signAndSubmitTransaction", transaction);
    const pendingTransaction = await wallet.signAndSubmitTransaction(
      transaction
    );
    console.log("pendingTransaction", pendingTransaction);
    const client = getAptosClient();
    await client.waitForTransaction(pendingTransaction.hash);
    return pendingTransaction.hash;
  } catch (e) {
    throw e;
  }
}
