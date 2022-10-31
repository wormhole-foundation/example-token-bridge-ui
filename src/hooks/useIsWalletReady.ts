import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SEI,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_XPLA,
  ChainId,
  isEVMChain,
  isTerraChain,
} from "@certusone/wormhole-sdk";
import { hexStripZeros, hexlify } from "@ethersproject/bytes";
import { useWallet as useSeiWallet } from "@sei-js/react";
import { useWallet as useSuiWallet } from "@suiet/wallet-kit";
import { useConnectedWallet } from "@terra-money/wallet-provider";
import { useConnectedWallet as useXplaConnectedWallet } from "@xpla/wallet-provider";
import { useCallback, useMemo } from "react";
import { useAlgorandContext } from "../contexts/AlgorandWalletContext";
import { useAptosContext } from "../contexts/AptosWalletContext";
import {
  ConnectType,
  useEthereumProvider,
} from "../contexts/EthereumProviderContext";
import { useInjectiveContext } from "../contexts/InjectiveWalletContext";
import { useNearContext } from "../contexts/NearWalletContext";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { APTOS_NETWORK, CLUSTER, getEvmChainId } from "../utils/consts";
import {
  EVM_RPC_MAP,
  METAMASK_CHAIN_PARAMETERS,
} from "../utils/metaMaskChainParameters";

const createWalletStatus = (
  isReady: boolean,
  statusMessage: string = "",
  forceNetworkSwitch: () => void,
  walletAddress?: string
) => ({
  isReady,
  statusMessage,
  forceNetworkSwitch,
  walletAddress,
});

function useIsWalletReady(
  chainId: ChainId,
  enableNetworkAutoswitch: boolean = true
): {
  isReady: boolean;
  statusMessage: string;
  walletAddress?: string;
  forceNetworkSwitch: () => void;
} {
  const autoSwitch = enableNetworkAutoswitch;
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const terraWallet = useConnectedWallet();
  const hasTerraWallet = !!terraWallet;
  const {
    provider,
    signerAddress,
    chainId: evmChainId,
    connectType,
    disconnect,
  } = useEthereumProvider();
  const hasEthInfo = !!provider && !!signerAddress;
  const correctEvmNetwork = getEvmChainId(chainId);
  const hasCorrectEvmNetwork = evmChainId === correctEvmNetwork;
  const { accounts: algorandAccounts } = useAlgorandContext();
  const algoPK = algorandAccounts[0]?.address;
  const xplaWallet = useXplaConnectedWallet();
  const hasXplaWallet = !!xplaWallet;
  const { account: aptosAccount, network: aptosNetwork } = useAptosContext();
  const aptosAddress = aptosAccount?.address?.toString();
  const hasAptosWallet = !!aptosAddress;
  // The wallets do not all match on network names and the adapter doesn't seem to normalize this yet.
  // Petra = "Testnet"
  // Martian = "Testnet"
  // Pontam = "Aptos testnet"
  // Nightly = undefined... error on NightlyWallet.ts
  const hasCorrectAptosNetwork = aptosNetwork?.name
    ?.toLowerCase()
    .includes(APTOS_NETWORK.toLowerCase());
  const { address: injAddress } = useInjectiveContext();
  const hasInjWallet = !!injAddress;
  const { accountId: nearPK } = useNearContext();
  const { accounts: seiAccounts } = useSeiWallet();
  const seiAddress = seiAccounts.length ? seiAccounts[0].address : null;
  const hasSeiWallet = !!seiAddress;
  const { address: suiAddress } = useSuiWallet();

  const forceNetworkSwitch = useCallback(async () => {
    if (provider && correctEvmNetwork) {
      if (!isEVMChain(chainId)) {
        return;
      }
      if (
        connectType === ConnectType.WALLETCONNECT &&
        EVM_RPC_MAP[correctEvmNetwork] === undefined
      ) {
        // WalletConnect requires a rpc url for this chain
        // Force user to switch connect type
        disconnect();
        return;
      }

      try {
        await provider.send("wallet_switchEthereumChain", [
          { chainId: hexStripZeros(hexlify(correctEvmNetwork)) },
        ]);
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          const addChainParameter =
            METAMASK_CHAIN_PARAMETERS[correctEvmNetwork];
          if (addChainParameter !== undefined) {
            try {
              await provider.send("wallet_addEthereumChain", [
                addChainParameter,
              ]);
            } catch (addError) {
              console.error(addError);
            }
          }
        }
      }
    }
  }, [provider, correctEvmNetwork, chainId, connectType, disconnect]);

  return useMemo(() => {
    if (isTerraChain(chainId) && hasTerraWallet && terraWallet?.walletAddress) {
      // TODO: terraWallet does not update on wallet changes
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        terraWallet.walletAddress
      );
    }
    if (chainId === CHAIN_ID_SOLANA && solPK) {
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        solPK.toString()
      );
    }
    if (chainId === CHAIN_ID_ALGORAND && algoPK) {
      return createWalletStatus(true, undefined, forceNetworkSwitch, algoPK);
    }
    if (
      chainId === CHAIN_ID_XPLA &&
      hasXplaWallet &&
      xplaWallet?.walletAddress
    ) {
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        xplaWallet.walletAddress
      );
    }
    if (chainId === CHAIN_ID_APTOS && hasAptosWallet && aptosAddress) {
      if (hasCorrectAptosNetwork) {
        return createWalletStatus(
          true,
          undefined,
          forceNetworkSwitch,
          aptosAddress
        );
      } else {
        return createWalletStatus(
          false,
          `Wallet is not connected to ${APTOS_NETWORK}.`,
          forceNetworkSwitch,
          undefined
        );
      }
    }
    if (chainId === CHAIN_ID_INJECTIVE && hasInjWallet && injAddress) {
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        injAddress
      );
    }
    if (chainId === CHAIN_ID_SEI && hasSeiWallet && seiAddress) {
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        seiAddress
      );
    }
    if (chainId === CHAIN_ID_NEAR && nearPK) {
      return createWalletStatus(true, undefined, forceNetworkSwitch, nearPK);
    }
    if (chainId === CHAIN_ID_SUI && suiAddress) {
      return createWalletStatus(
        true,
        undefined,
        forceNetworkSwitch,
        suiAddress
      );
    }
    if (isEVMChain(chainId) && hasEthInfo && signerAddress) {
      if (hasCorrectEvmNetwork) {
        return createWalletStatus(
          true,
          undefined,
          forceNetworkSwitch,
          signerAddress
        );
      } else {
        if (provider && correctEvmNetwork && autoSwitch) {
          forceNetworkSwitch();
        }
        return createWalletStatus(
          false,
          `Wallet is not connected to ${CLUSTER}. Expected Chain ID: ${correctEvmNetwork}`,
          forceNetworkSwitch,
          undefined
        );
      }
    }

    return createWalletStatus(
      false,
      "Wallet not connected",
      forceNetworkSwitch,
      undefined
    );
  }, [
    chainId,
    autoSwitch,
    forceNetworkSwitch,
    hasTerraWallet,
    solPK,
    hasEthInfo,
    correctEvmNetwork,
    hasCorrectEvmNetwork,
    provider,
    signerAddress,
    terraWallet,
    algoPK,
    xplaWallet,
    hasXplaWallet,
    hasAptosWallet,
    aptosAddress,
    hasCorrectAptosNetwork,
    hasInjWallet,
    injAddress,
    hasSeiWallet,
    seiAddress,
    nearPK,
    suiAddress,
  ]);
}

export default useIsWalletReady;
