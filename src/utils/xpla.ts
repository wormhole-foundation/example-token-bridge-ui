import { LCDClient, isTxError } from "@xpla/xpla.js";
import { ConnectedWallet, TxResult } from "@xpla/wallet-provider";
import axios from "axios";
import {
  XPLA_GAS_PRICES_URL,
  XPLA_LCD_CLIENT_CONFIG,
  XPLA_NATIVE_DENOM,
} from "./consts";
import { cosmos, isNativeDenomXpla } from "@certusone/wormhole-sdk";

export const NATIVE_XPLA_DECIMALS = 18;

export async function waitForXplaExecution(transaction: TxResult) {
  const lcd = new LCDClient(XPLA_LCD_CLIENT_CONFIG);
  let info;
  while (!info) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      info = await lcd.tx.txInfo(transaction.result.txhash);
    } catch (e) {
      console.error(e);
    }
  }
  if (isTxError(info)) {
    throw new Error(
      `Tx ${transaction.result.txhash}: error code ${info.code}: ${info.raw_log}`
    );
  }
  return info;
}

export async function postWithFeesXpla(
  wallet: ConnectedWallet,
  msgs: any[],
  memo: string
) {
  // don't try/catch, let errors propagate
  const lcd = new LCDClient(XPLA_LCD_CLIENT_CONFIG);
  //Thus, we are going to pull it directly from the current FCD.
  const gasPrices = await axios
    .get(XPLA_GAS_PRICES_URL)
    .then((result) => result.data);

  const account = await lcd.auth.accountInfo(wallet.walletAddress);

  const feeDenoms = [XPLA_NATIVE_DENOM];

  const feeEstimate = await lcd.tx.estimateFee(
    [
      {
        sequenceNumber: account.getSequenceNumber(),
        publicKey: account.getPublicKey(),
      },
    ],
    {
      msgs: [...msgs],
      memo,
      feeDenoms,
      gasPrices,
    }
  );

  const result = await wallet.post({
    msgs: [...msgs],
    memo,
    feeDenoms,
    gasPrices,
    fee: feeEstimate,
  });

  return result;
}

export const isValidXplaAddress = (address: string) => {
  if (isNativeDenomXpla(address)) {
    return true;
  }
  try {
    const startsWithXpla = address && address.startsWith("xpla");
    const isParseable = cosmos.canonicalAddress(address);
    const isLengthOk = isParseable.length === 32;
    return !!(startsWithXpla && isParseable && isLengthOk);
  } catch (error) {
    return false;
  }
};

export const formatNativeDenom = (denom: string) =>
  denom === XPLA_NATIVE_DENOM ? "XPLA" : "";

export const XPLA_NATIVE_TOKEN_ICON =
  "https://assets.xpla.io/icon/svg/XPLA.svg";
