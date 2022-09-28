import { Wallet } from "@near-wallet-selector/core/lib/wallet";
import { Account, connect } from "near-api-js";
import { FunctionCallOptions } from "near-api-js/lib/account";
import {
  FinalExecutionOutcome,
  JsonRpcProvider,
} from "@certusone/wormhole-sdk/node_modules/near-api-js/lib/providers"; //from "near-api-js/lib/providers";
import { getNearConnectionConfig } from "./consts";

export const makeNearAccount = async (senderAddr: string) =>
  await (await connect(getNearConnectionConfig())).account(senderAddr);

export const makeNearProvider = () =>
  new JsonRpcProvider({ url: getNearConnectionConfig().nodeUrl });

export const signAndSendTransactions = async (
  account: Account,
  wallet: Wallet,
  messages: FunctionCallOptions[]
): Promise<FinalExecutionOutcome> => {
  // the browser wallet's signAndSendTransactions call navigates away from the page which is incompatible with the current app design
  if (wallet.type === "browser" && account) {
    let lastReceipt: FinalExecutionOutcome | null = null;
    for (const message of messages) {
      lastReceipt = await account.functionCall(message);
    }
    if (!lastReceipt) {
      throw new Error("An error occurred while fetching the transaction info");
    }
    return lastReceipt;
  }
  const receipts = await wallet.signAndSendTransactions({
    transactions: messages.map((options) => ({
      signerId: wallet.id,
      receiverId: options.contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: options.methodName,
            args: options.args,
            gas: options.gas?.toString() || "0",
            deposit: options.attachedDeposit?.toString() || "0",
          },
        },
      ],
    })),
  });
  if (!receipts || receipts.length === 0) {
    throw new Error("An error occurred while fetching the transaction info");
  }
  return receipts[receipts.length - 1];
};

export async function lookupHash(
  account: Account,
  tokenBridge: string,
  hash: string
): Promise<[boolean, string]> {
  return await account.viewFunction(tokenBridge, "hash_lookup", {
    hash,
  });
}
