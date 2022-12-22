import { cosmos, isNativeDenomInjective } from "@certusone/wormhole-sdk";
import {
  ChainGrpcBankApi,
  ChainGrpcWasmApi,
  Msgs,
  TxGrpcClient,
} from "@injectivelabs/sdk-ts";
import { MsgBroadcaster, WalletStrategy } from "@injectivelabs/wallet-ts";
import { INJECTIVE_NETWORK, INJECTIVE_NETWORK_CHAIN_ID } from "./consts";

export const NATIVE_INJECTIVE_DECIMALS = 18;

export const INJECTIVE_NATIVE_DENOM = "inj";

export const getInjectiveWasmClient = () =>
  new ChainGrpcWasmApi(INJECTIVE_NETWORK.sentryGrpcApi);

export const getInjectiveBankClient = () =>
  new ChainGrpcBankApi(INJECTIVE_NETWORK.sentryGrpcApi);

export const getInjectiveTxClient = () =>
  new TxGrpcClient(INJECTIVE_NETWORK.sentryGrpcApi);

export const isValidInjectiveAddress = (address: string) => {
  if (isNativeDenomInjective(address)) {
    return true;
  }
  try {
    const startsWithInj = address && address.startsWith("inj");
    const isParsable = cosmos.canonicalAddress(address);
    const isLengthOk = isParsable.length === 20;
    return !!(startsWithInj && isParsable && isLengthOk);
  } catch (error) {
    return false;
  }
};

export const formatNativeDenom = (denom: string) =>
  denom === INJECTIVE_NATIVE_DENOM ? "INJ" : "";

export const broadcastInjectiveTx = async (
  walletStrategy: WalletStrategy,
  walletAddress: string,
  msgs: Msgs | Msgs[],
  memo: string = ""
) => {
  const client = getInjectiveTxClient();
  const broadcaster = new MsgBroadcaster({
    endpoints: {
      indexerApi: INJECTIVE_NETWORK.indexerApi,
      sentryGrpcApi: INJECTIVE_NETWORK.sentryGrpcApi,
      sentryHttpApi: INJECTIVE_NETWORK.sentryHttpApi,
    },
    chainId: INJECTIVE_NETWORK_CHAIN_ID,
    walletStrategy,
    simulateTx: true,
  });
  const txHash = await broadcaster.broadcast({
    msgs,
    address: walletAddress,
    memo,
  });
  const tx = await client.fetchTxPoll(txHash);
  if (!tx) {
    throw new Error("Unable to fetch transaction");
  }
  if (tx.code !== 0) {
    throw new Error(`Transaction failed: ${tx.rawLog}`);
  }
  return tx;
};
