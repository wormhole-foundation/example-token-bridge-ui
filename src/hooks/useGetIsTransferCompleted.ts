import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SEI,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_XPLA,
  getIsTransferCompletedAlgorand,
  getIsTransferCompletedAptos,
  getIsTransferCompletedEth,
  getIsTransferCompletedInjective,
  getIsTransferCompletedNear,
  getIsTransferCompletedSolana,
  getIsTransferCompletedSui,
  getIsTransferCompletedTerra,
  getIsTransferCompletedXpla,
  isEVMChain,
  isTerraChain,
} from "@certusone/wormhole-sdk";
import { Connection } from "@solana/web3.js";
import { LCDClient } from "@terra-money/terra.js";
import { LCDClient as XplaLCDClient } from "@xpla/xpla.js";
import algosdk from "algosdk";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { useNearContext } from "../contexts/NearWalletContext";
import {
  selectTransferIsRecovery,
  selectTransferTargetAddressHex,
  selectTransferTargetChain,
} from "../store/selectors";
import { getAptosClient } from "../utils/aptos";
import {
  ALGORAND_HOST,
  ALGORAND_TOKEN_BRIDGE_ID,
  NEAR_TOKEN_BRIDGE_ACCOUNT,
  SOLANA_HOST,
  XPLA_LCD_CLIENT_CONFIG,
  getEvmChainId,
  getTerraConfig,
  getTerraGasPricesUrl,
  getTokenBridgeAddressForChain,
} from "../utils/consts";
import { getInjectiveWasmClient } from "../utils/injective";
import { makeNearProvider } from "../utils/near";
import { getIsTransferCompletedSei, getSeiWasmClient } from "../utils/sei";
import { getSuiProvider } from "../utils/sui";
import useIsWalletReady from "./useIsWalletReady";
import useTransferSignedVAA from "./useTransferSignedVAA";

/**
 * @param recoveryOnly Only fire when in recovery mode
 */
export default function useGetIsTransferCompleted(
  recoveryOnly: boolean,
  pollFrequency?: number
): {
  isTransferCompletedLoading: boolean;
  isTransferCompleted: boolean;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);

  const isRecovery = useSelector(selectTransferIsRecovery);
  const targetAddress = useSelector(selectTransferTargetAddressHex);
  const targetChain = useSelector(selectTransferTargetChain);

  const { isReady } = useIsWalletReady(targetChain, false);
  const { provider, chainId: evmChainId } = useEthereumProvider();
  const { accountId: nearAccountId } = useNearContext();
  const signedVAA = useTransferSignedVAA();

  const hasCorrectEvmNetwork = evmChainId === getEvmChainId(targetChain);
  const shouldFire = !recoveryOnly || isRecovery;
  const [pollState, setPollState] = useState(pollFrequency);

  useEffect(() => {
    let cancelled = false;
    if (pollFrequency && !isLoading && !isTransferCompleted) {
      setTimeout(() => {
        if (!cancelled) {
          setPollState((prevState) => (prevState || 0) + 1);
        }
      }, pollFrequency);
    }
    return () => {
      cancelled = true;
    };
  }, [pollFrequency, isLoading, isTransferCompleted]);

  useEffect(() => {
    if (!shouldFire) {
      return;
    }

    let cancelled = false;
    let transferCompleted = false;
    if (targetChain && targetAddress && signedVAA && isReady) {
      if (isEVMChain(targetChain) && hasCorrectEvmNetwork && provider) {
        setIsLoading(true);
        (async () => {
          try {
            transferCompleted = await getIsTransferCompletedEth(
              getTokenBridgeAddressForChain(targetChain),
              provider,
              signedVAA
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (targetChain === CHAIN_ID_SOLANA) {
        setIsLoading(true);
        (async () => {
          try {
            const connection = new Connection(SOLANA_HOST, "confirmed");
            transferCompleted = await getIsTransferCompletedSolana(
              getTokenBridgeAddressForChain(targetChain),
              signedVAA,
              connection
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (isTerraChain(targetChain)) {
        setIsLoading(true);
        (async () => {
          try {
            const lcdClient = new LCDClient(getTerraConfig(targetChain));
            transferCompleted = await getIsTransferCompletedTerra(
              getTokenBridgeAddressForChain(targetChain),
              signedVAA,
              lcdClient,
              getTerraGasPricesUrl(targetChain)
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (targetChain === CHAIN_ID_XPLA) {
        setIsLoading(true);
        (async () => {
          try {
            const lcdClient = new XplaLCDClient(XPLA_LCD_CLIENT_CONFIG);
            transferCompleted = await getIsTransferCompletedXpla(
              getTokenBridgeAddressForChain(targetChain),
              signedVAA,
              lcdClient
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (targetChain === CHAIN_ID_APTOS) {
        setIsLoading(true);
        (async () => {
          try {
            transferCompleted = await getIsTransferCompletedAptos(
              getAptosClient(),
              getTokenBridgeAddressForChain(targetChain),
              signedVAA
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (targetChain === CHAIN_ID_ALGORAND) {
        setIsLoading(true);
        (async () => {
          try {
            const algodClient = new algosdk.Algodv2(
              ALGORAND_HOST.algodToken,
              ALGORAND_HOST.algodServer,
              ALGORAND_HOST.algodPort
            );
            transferCompleted = await getIsTransferCompletedAlgorand(
              algodClient,
              ALGORAND_TOKEN_BRIDGE_ID,
              signedVAA
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (targetChain === CHAIN_ID_INJECTIVE) {
        setIsLoading(true);
        (async () => {
          try {
            const client = getInjectiveWasmClient();
            transferCompleted = await getIsTransferCompletedInjective(
              getTokenBridgeAddressForChain(targetChain),
              signedVAA,
              client
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (targetChain === CHAIN_ID_SEI) {
        setIsLoading(true);
        (async () => {
          try {
            const client = await getSeiWasmClient();
            transferCompleted = await getIsTransferCompletedSei(
              getTokenBridgeAddressForChain(targetChain),
              signedVAA,
              client
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (targetChain === CHAIN_ID_NEAR && nearAccountId) {
        setIsLoading(true);
        (async () => {
          try {
            transferCompleted = await getIsTransferCompletedNear(
              makeNearProvider(),
              NEAR_TOKEN_BRIDGE_ACCOUNT,
              signedVAA
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      } else if (targetChain === CHAIN_ID_SUI) {
        setIsLoading(true);
        (async () => {
          try {
            const provider = getSuiProvider();
            transferCompleted = await getIsTransferCompletedSui(
              provider,
              getTokenBridgeAddressForChain(CHAIN_ID_SUI),
              signedVAA
            );
          } catch (error) {
            console.error(error);
          }
          if (!cancelled) {
            setIsTransferCompleted(transferCompleted);
            setIsLoading(false);
          }
        })();
      }
    }
    return () => {
      cancelled = true;
    };
  }, [
    shouldFire,
    hasCorrectEvmNetwork,
    targetChain,
    targetAddress,
    signedVAA,
    isReady,
    provider,
    pollState,
    nearAccountId,
  ]);

  return { isTransferCompletedLoading: isLoading, isTransferCompleted };
}
