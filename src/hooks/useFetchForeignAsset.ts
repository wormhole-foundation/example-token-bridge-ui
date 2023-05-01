import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SEI,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_TERRA2,
  CHAIN_ID_XPLA,
  ChainId,
  getEmitterAddressNear,
  getForeignAssetAlgorand,
  getForeignAssetAptos,
  getForeignAssetEth,
  getForeignAssetInjective,
  getForeignAssetNear,
  getForeignAssetSolana,
  getForeignAssetSui,
  getForeignAssetTerra,
  getForeignAssetXpla,
  hexToUint8Array,
  isEVMChain,
  isTerraChain,
  nativeToHexString,
} from "@certusone/wormhole-sdk";
import { buildTokenId } from "@certusone/wormhole-sdk/lib/esm/cosmwasm/address";
import { Connection } from "@solana/web3.js";
import { LCDClient } from "@terra-money/terra.js";
import { LCDClient as XplaLCDClient } from "@xpla/xpla.js";
import { Algodv2 } from "algosdk";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { useNearContext } from "../contexts/NearWalletContext";
import { DataWrapper } from "../store/helpers";
import { getAptosClient } from "../utils/aptos";
import {
  ALGORAND_HOST,
  ALGORAND_TOKEN_BRIDGE_ID,
  NATIVE_NEAR_PLACEHOLDER,
  NATIVE_NEAR_WH_ADDRESS,
  NEAR_TOKEN_BRIDGE_ACCOUNT,
  SOLANA_HOST,
  SOL_TOKEN_BRIDGE_ADDRESS,
  XPLA_LCD_CLIENT_CONFIG,
  getEvmChainId,
  getTerraConfig,
  getTokenBridgeAddressForChain,
} from "../utils/consts";
import { getInjectiveWasmClient } from "../utils/injective";
import { makeNearProvider } from "../utils/near";
import { getForeignAssetSei, getSeiWasmClient } from "../utils/sei";
import { getSuiProvider } from "../utils/sui";
import useIsWalletReady from "./useIsWalletReady";

export type ForeignAssetInfo = {
  doesExist: boolean;
  address: string | null;
};

function useFetchForeignAsset(
  originChain: ChainId,
  originAsset: string,
  foreignChain: ChainId
): DataWrapper<ForeignAssetInfo> {
  const { provider, chainId: evmChainId } = useEthereumProvider();
  const { isReady } = useIsWalletReady(foreignChain, false);
  const correctEvmNetwork = getEvmChainId(foreignChain);
  const hasCorrectEvmNetwork = evmChainId === correctEvmNetwork;
  const { accountId: nearAccountId } = useNearContext();

  const [assetAddress, setAssetAddress] = useState<string | null>(null);
  const [doesExist, setDoesExist] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const originAssetHex = useMemo(() => {
    try {
      if (originChain === CHAIN_ID_TERRA2) {
        return buildTokenId(originChain, originAsset);
      }
      if (originChain === CHAIN_ID_NEAR) {
        if (originAsset === NATIVE_NEAR_PLACEHOLDER) {
          return NATIVE_NEAR_WH_ADDRESS;
        }
        return getEmitterAddressNear(originAsset);
      }
      return nativeToHexString(originAsset, originChain);
    } catch (e) {
      return null;
    }
  }, [originAsset, originChain]);
  const [previousArgs, setPreviousArgs] = useState<{
    originChain: ChainId;
    originAsset: string;
    foreignChain: ChainId;
  } | null>(null);
  const argsEqual =
    !!previousArgs &&
    previousArgs.originChain === originChain &&
    previousArgs.originAsset === originAsset &&
    previousArgs.foreignChain === foreignChain;
  const setArgs = useCallback(() => {
    setPreviousArgs({ foreignChain, originChain, originAsset });
  }, [foreignChain, originChain, originAsset]);

  const argumentError = useMemo(
    () =>
      !originChain ||
      !originAsset ||
      !foreignChain ||
      !originAssetHex ||
      foreignChain === originChain ||
      (isEVMChain(foreignChain) && !isReady) ||
      (isEVMChain(foreignChain) && !hasCorrectEvmNetwork) ||
      argsEqual,
    [
      isReady,
      foreignChain,
      originAsset,
      originChain,
      hasCorrectEvmNetwork,
      originAssetHex,
      argsEqual,
    ]
  );

  useEffect(() => {
    if (!argsEqual) {
      setAssetAddress(null);
      setError("");
      setDoesExist(null);
      setPreviousArgs(null);
    }
    if (argumentError || !originAssetHex) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    try {
      const getterFunc: () => Promise<string | bigint | null> = isEVMChain(
        foreignChain
      )
        ? () =>
            getForeignAssetEth(
              getTokenBridgeAddressForChain(foreignChain),
              provider as any, //why does this typecheck work elsewhere?
              originChain,
              hexToUint8Array(originAssetHex)
            )
        : isTerraChain(foreignChain)
        ? () => {
            const lcd = new LCDClient(getTerraConfig(foreignChain));
            return getForeignAssetTerra(
              getTokenBridgeAddressForChain(foreignChain),
              lcd,
              originChain,
              hexToUint8Array(originAssetHex)
            );
          }
        : foreignChain === CHAIN_ID_XPLA
        ? () => {
            const lcd = new XplaLCDClient(XPLA_LCD_CLIENT_CONFIG);
            return getForeignAssetXpla(
              getTokenBridgeAddressForChain(foreignChain),
              lcd,
              originChain,
              hexToUint8Array(originAssetHex)
            );
          }
        : foreignChain === CHAIN_ID_APTOS
        ? () => {
            return getForeignAssetAptos(
              getAptosClient(),
              getTokenBridgeAddressForChain(foreignChain),
              originChain,
              originAssetHex
            );
          }
        : foreignChain === CHAIN_ID_SOLANA
        ? () => {
            const connection = new Connection(SOLANA_HOST, "confirmed");
            return getForeignAssetSolana(
              connection,
              SOL_TOKEN_BRIDGE_ADDRESS,
              originChain,
              hexToUint8Array(originAssetHex)
            );
          }
        : foreignChain === CHAIN_ID_ALGORAND
        ? () => {
            const algodClient = new Algodv2(
              ALGORAND_HOST.algodToken,
              ALGORAND_HOST.algodServer,
              ALGORAND_HOST.algodPort
            );
            return getForeignAssetAlgorand(
              algodClient,
              ALGORAND_TOKEN_BRIDGE_ID,
              originChain,
              originAssetHex
            );
          }
        : foreignChain === CHAIN_ID_INJECTIVE
        ? () => {
            const client = getInjectiveWasmClient();
            return getForeignAssetInjective(
              getTokenBridgeAddressForChain(foreignChain),
              client,
              originChain,
              hexToUint8Array(originAssetHex)
            );
          }
        : foreignChain === CHAIN_ID_SEI
        ? async () => {
            const client = await getSeiWasmClient();
            return getForeignAssetSei(
              getTokenBridgeAddressForChain(foreignChain),
              client,
              originChain,
              hexToUint8Array(originAssetHex)
            );
          }
        : foreignChain === CHAIN_ID_NEAR
        ? async () => {
            try {
              return await getForeignAssetNear(
                makeNearProvider(),
                NEAR_TOKEN_BRIDGE_ACCOUNT,
                originChain,
                originAssetHex
              );
            } catch {
              return await Promise.reject("Failed to make Near account");
            }
          }
        : foreignChain === CHAIN_ID_SUI
        ? () => {
            return getForeignAssetSui(
              getSuiProvider(),
              getTokenBridgeAddressForChain(CHAIN_ID_SUI),
              originChain,
              hexToUint8Array(originAssetHex)
            );
          }
        : () => Promise.resolve(null);

      getterFunc()
        .then((result) => {
          if (!cancelled) {
            if (
              result &&
              !(
                isEVMChain(foreignChain) &&
                result === ethers.constants.AddressZero
              )
            ) {
              setArgs();
              setDoesExist(true);
              setIsLoading(false);
              setAssetAddress(result.toString());
            } else {
              setArgs();
              setDoesExist(false);
              setIsLoading(false);
              setAssetAddress(null);
            }
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setError("Could not retrieve the foreign asset.");
            setIsLoading(false);
          }
        });
    } catch (e) {
      //This catch mostly just detects poorly formatted addresses
      if (!cancelled) {
        setError("Could not retrieve the foreign asset.");
        setIsLoading(false);
      }
    }
  }, [
    argumentError,
    foreignChain,
    originAssetHex,
    originChain,
    provider,
    setArgs,
    argsEqual,
    nearAccountId,
  ]);

  const compoundError = useMemo(() => {
    return error ? error : "";
  }, [error]); //now swallows wallet errors

  const output: DataWrapper<ForeignAssetInfo> = useMemo(
    () => ({
      error: compoundError,
      isFetching: isLoading,
      data:
        (assetAddress !== null && assetAddress !== undefined) ||
        (doesExist !== null && doesExist !== undefined)
          ? { address: assetAddress, doesExist: !!doesExist }
          : null,
      receivedAt: null,
    }),
    [compoundError, isLoading, assetAddress, doesExist]
  );

  return output;
}

export default useFetchForeignAsset;
