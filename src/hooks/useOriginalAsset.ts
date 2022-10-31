import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_TERRA2,
  CHAIN_ID_XPLA,
  ChainId,
  getForeignAssetSui,
  getOriginalAssetAlgorand,
  getOriginalAssetAptos,
  getOriginalAssetCosmWasm,
  getOriginalAssetEth,
  getOriginalAssetInjective,
  getOriginalAssetNear,
  getOriginalAssetSol,
  getOriginalAssetSui,
  getTypeFromExternalAddress,
  hexToNativeAssetString,
  isEVMChain,
  isTerraChain,
  queryExternalId,
  queryExternalIdInjective,
  uint8ArrayToHex,
  uint8ArrayToNative,
} from "@certusone/wormhole-sdk";
import {
  WormholeWrappedNFTInfo,
  getOriginalAssetEth as getOriginalAssetEthNFT,
  getOriginalAssetSol as getOriginalAssetSolNFT,
} from "@certusone/wormhole-sdk/lib/esm/nft_bridge";
import { Web3Provider } from "@ethersproject/providers";
import { Connection } from "@solana/web3.js";
import { LCDClient } from "@terra-money/terra.js";
import { LCDClient as XplaLCDClient } from "@xpla/xpla.js";
import { Algodv2 } from "algosdk";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Provider,
  useEthereumProvider,
} from "../contexts/EthereumProviderContext";
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
  SOLANA_SYSTEM_PROGRAM_ADDRESS,
  SOL_NFT_BRIDGE_ADDRESS,
  SOL_TOKEN_BRIDGE_ADDRESS,
  XPLA_LCD_CLIENT_CONFIG,
  getNFTBridgeAddressForChain,
  getTerraConfig,
  getTokenBridgeAddressForChain,
} from "../utils/consts";
import { getInjectiveWasmClient } from "../utils/injective";
import { lookupHash, makeNearAccount, makeNearProvider } from "../utils/near";
import { getSuiProvider } from "../utils/sui";
import useIsWalletReady from "./useIsWalletReady";

export type OriginalAssetInfo = {
  originChain: ChainId | null;
  originAddress: string | null;
  originTokenId: string | null;
};

export async function getOriginalAssetToken(
  foreignChain: ChainId,
  foreignNativeStringAddress: string,
  provider?: Web3Provider,
  nearAccountId?: string | null
) {
  let promise = null;
  try {
    if (isEVMChain(foreignChain) && provider) {
      promise = await getOriginalAssetEth(
        getTokenBridgeAddressForChain(foreignChain),
        provider,
        foreignNativeStringAddress,
        foreignChain
      );
    } else if (foreignChain === CHAIN_ID_SOLANA) {
      const connection = new Connection(SOLANA_HOST, "confirmed");
      promise = await getOriginalAssetSol(
        connection,
        SOL_TOKEN_BRIDGE_ADDRESS,
        foreignNativeStringAddress
      );
    } else if (isTerraChain(foreignChain)) {
      const lcd = new LCDClient(getTerraConfig(foreignChain));
      promise = await getOriginalAssetCosmWasm(
        lcd,
        foreignNativeStringAddress,
        foreignChain
      );
    } else if (foreignChain === CHAIN_ID_ALGORAND) {
      const algodClient = new Algodv2(
        ALGORAND_HOST.algodToken,
        ALGORAND_HOST.algodServer,
        ALGORAND_HOST.algodPort
      );
      promise = await getOriginalAssetAlgorand(
        algodClient,
        ALGORAND_TOKEN_BRIDGE_ID,
        BigInt(foreignNativeStringAddress)
      );
    } else if (foreignChain === CHAIN_ID_APTOS) {
      promise = await getOriginalAssetAptos(
        getAptosClient(),
        getTokenBridgeAddressForChain(CHAIN_ID_APTOS),
        foreignNativeStringAddress
      );
    } else if (foreignChain === CHAIN_ID_INJECTIVE) {
      promise = await getOriginalAssetInjective(
        foreignNativeStringAddress,
        getInjectiveWasmClient()
      );
    } else if (foreignChain === CHAIN_ID_NEAR && nearAccountId) {
      const provider = makeNearProvider();
      promise = await getOriginalAssetNear(
        provider,
        NEAR_TOKEN_BRIDGE_ACCOUNT,
        foreignNativeStringAddress
      );
    } else if (foreignChain === CHAIN_ID_SUI) {
      promise = await getOriginalAssetSui(
        getSuiProvider(),
        getTokenBridgeAddressForChain(CHAIN_ID_SUI),
        foreignNativeStringAddress
      );
    }
  } catch (e) {
    promise = Promise.reject("Invalid foreign arguments.");
  }
  if (!promise) {
    promise = Promise.reject("Invalid foreign arguments.");
  }
  return promise;
}

export async function getOriginalAssetNFT(
  foreignChain: ChainId,
  foreignNativeStringAddress: string,
  tokenId?: string,
  provider?: Provider
) {
  let promise = null;
  try {
    if (isEVMChain(foreignChain) && provider && tokenId) {
      promise = getOriginalAssetEthNFT(
        getNFTBridgeAddressForChain(foreignChain),
        provider,
        foreignNativeStringAddress,
        tokenId,
        foreignChain
      );
    } else if (foreignChain === CHAIN_ID_SOLANA) {
      const connection = new Connection(SOLANA_HOST, "confirmed");
      promise = getOriginalAssetSolNFT(
        connection,
        SOL_NFT_BRIDGE_ADDRESS,
        foreignNativeStringAddress
      );
    }
  } catch (e) {
    promise = Promise.reject("Invalid foreign arguments.");
  }
  if (!promise) {
    promise = Promise.reject("Invalid foreign arguments.");
  }
  return promise;
}

//TODO refactor useCheckIfWormholeWrapped to use this function, and probably move to SDK
export async function getOriginalAsset(
  foreignChain: ChainId,
  foreignNativeStringAddress: string,
  nft: boolean,
  tokenId?: string,
  provider?: Provider,
  nearAccountId?: string | null
): Promise<WormholeWrappedNFTInfo> {
  const result = nft
    ? await getOriginalAssetNFT(
        foreignChain,
        foreignNativeStringAddress,
        tokenId,
        provider
      )
    : await getOriginalAssetToken(
        foreignChain,
        foreignNativeStringAddress,
        provider,
        nearAccountId
      );

  if (
    isEVMChain(result.chainId) &&
    uint8ArrayToNative(result.assetAddress, result.chainId) ===
      ethers.constants.AddressZero
  ) {
    throw new Error("Unable to find address.");
  }
  if (
    result.chainId === CHAIN_ID_SOLANA &&
    uint8ArrayToNative(result.assetAddress, result.chainId) ===
      SOLANA_SYSTEM_PROGRAM_ADDRESS
  ) {
    throw new Error("Unable to find address.");
  }

  return result;
}

//This potentially returns the same chain as the foreign chain, in the case where the asset is native
function useOriginalAsset(
  foreignChain: ChainId,
  foreignAddress: string,
  nft: boolean,
  tokenId?: string
): DataWrapper<OriginalAssetInfo> {
  const { provider } = useEthereumProvider();
  const { accountId: nearAccountId } = useNearContext();
  const { isReady } = useIsWalletReady(foreignChain, false);
  const [originAddress, setOriginAddress] = useState<string | null>(null);
  const [originTokenId, setOriginTokenId] = useState<string | null>(null);
  const [originChain, setOriginChain] = useState<ChainId | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previousArgs, setPreviousArgs] = useState<{
    foreignChain: ChainId;
    foreignAddress: string;
    nft: boolean;
    tokenId?: string;
  } | null>(null);
  const argsEqual =
    !!previousArgs &&
    previousArgs.foreignChain === foreignChain &&
    previousArgs.foreignAddress === foreignAddress &&
    previousArgs.nft === nft &&
    previousArgs.tokenId === tokenId;
  const setArgs = useCallback(
    () => setPreviousArgs({ foreignChain, foreignAddress, nft, tokenId }),
    [foreignChain, foreignAddress, nft, tokenId]
  );

  const argumentError = useMemo(
    () =>
      !foreignChain ||
      !foreignAddress ||
      (isEVMChain(foreignChain) && !isReady) ||
      (isEVMChain(foreignChain) && nft && !tokenId) ||
      argsEqual,
    [isReady, nft, tokenId, argsEqual, foreignChain, foreignAddress]
  );

  useEffect(() => {
    if (!argsEqual) {
      setError("");
      setOriginAddress(null);
      setOriginTokenId(null);
      setOriginChain(null);
      setPreviousArgs(null);
    }
    if (argumentError) {
      return;
    }
    // short circuit for near native
    if (
      foreignChain === CHAIN_ID_NEAR &&
      foreignAddress === NATIVE_NEAR_PLACEHOLDER
    ) {
      setOriginChain(CHAIN_ID_NEAR);
      setOriginAddress(NATIVE_NEAR_PLACEHOLDER);
      return;
    }
    let cancelled = false;
    setIsLoading(true);

    getOriginalAsset(
      foreignChain,
      foreignAddress,
      nft,
      tokenId,
      provider,
      nearAccountId
    )
      .then((result) => {
        if (!cancelled) {
          setIsLoading(false);
          setArgs();
          if (
            result.chainId === CHAIN_ID_TERRA2 ||
            result.chainId === CHAIN_ID_XPLA
          ) {
            const lcd =
              result.chainId === CHAIN_ID_TERRA2
                ? new LCDClient(getTerraConfig(CHAIN_ID_TERRA2))
                : new XplaLCDClient(XPLA_LCD_CLIENT_CONFIG);
            const tokenBridgeAddress = getTokenBridgeAddressForChain(
              result.chainId
            );
            queryExternalId(
              lcd,
              tokenBridgeAddress,
              uint8ArrayToHex(result.assetAddress)
            ).then((tokenId) => setOriginAddress(tokenId || null));
          } else if (result.chainId === CHAIN_ID_APTOS) {
            getTypeFromExternalAddress(
              getAptosClient(),
              getTokenBridgeAddressForChain(CHAIN_ID_APTOS),
              uint8ArrayToHex(result.assetAddress)
            ).then((tokenId) => setOriginAddress(tokenId || null));
          } else if (result.chainId === CHAIN_ID_INJECTIVE) {
            const client = getInjectiveWasmClient();
            const tokenBridgeAddress = getTokenBridgeAddressForChain(
              result.chainId
            );
            queryExternalIdInjective(
              client,
              tokenBridgeAddress,
              uint8ArrayToHex(result.assetAddress)
            ).then((tokenId) => setOriginAddress(tokenId));
          } else if (result.chainId === CHAIN_ID_NEAR) {
            if (
              uint8ArrayToHex(result.assetAddress) === NATIVE_NEAR_WH_ADDRESS
            ) {
              setOriginAddress(NATIVE_NEAR_PLACEHOLDER);
            } else if (nearAccountId) {
              makeNearAccount(nearAccountId).then((account) => {
                lookupHash(
                  account,
                  NEAR_TOKEN_BRIDGE_ACCOUNT,
                  uint8ArrayToHex(result.assetAddress)
                ).then((tokenAccount) => {
                  if (!cancelled) {
                    setOriginAddress(tokenAccount[1] || null);
                  }
                });
              });
            }
          } else if (result.chainId === CHAIN_ID_SUI) {
            getForeignAssetSui(
              getSuiProvider(),
              getTokenBridgeAddressForChain(CHAIN_ID_SUI),
              result.chainId,
              result.assetAddress
            ).then((coinType) => {
              if (!cancelled) {
                setOriginAddress(coinType);
              }
            });
          } else {
            setOriginAddress(
              hexToNativeAssetString(
                uint8ArrayToHex(result.assetAddress),
                result.chainId
              ) || null
            );
          }
          setOriginTokenId(result.tokenId || null);
          setOriginChain(result.chainId);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setIsLoading(false);
          setError("Unable to determine original asset.");
        }
      });
  }, [
    foreignChain,
    foreignAddress,
    nft,
    provider,
    setArgs,
    argumentError,
    tokenId,
    argsEqual,
    nearAccountId,
  ]);

  const output: DataWrapper<OriginalAssetInfo> = useMemo(
    () => ({
      error: error,
      isFetching: isLoading,
      data:
        originChain || originAddress || originTokenId
          ? { originChain, originAddress, originTokenId }
          : null,
      receivedAt: null,
    }),
    [isLoading, originAddress, originChain, originTokenId, error]
  );

  return output;
}

export default useOriginalAsset;
