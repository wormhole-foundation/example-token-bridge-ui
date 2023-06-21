import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_KLAYTN,
  CHAIN_ID_NEAR,
  CHAIN_ID_SEI,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_XPLA,
  ChainId,
  TerraChainId,
  attestFromAlgorand,
  attestFromAptos,
  attestFromEth,
  attestFromInjective,
  attestFromSolana,
  attestFromSui,
  attestFromTerra,
  attestFromXpla,
  attestNearFromNear,
  attestTokenFromNear,
  getEmitterAddressAlgorand,
  getEmitterAddressEth,
  getEmitterAddressInjective,
  getEmitterAddressNear,
  getEmitterAddressSolana,
  getEmitterAddressTerra,
  getEmitterAddressXpla,
  getSignedVAAWithRetry,
  isEVMChain,
  isTerraChain,
  parseSequenceFromLogAlgorand,
  parseSequenceFromLogEth,
  parseSequenceFromLogInjective,
  parseSequenceFromLogNear,
  parseSequenceFromLogSolana,
  parseSequenceFromLogTerra,
  parseSequenceFromLogXpla,
  uint8ArrayToHex,
} from "@certusone/wormhole-sdk";
import { getOriginalPackageId } from "@certusone/wormhole-sdk/lib/cjs/sui";
import { getEmitterAddressAndSequenceFromResponseSui } from "@certusone/wormhole-sdk/lib/esm/sui";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { calculateFee } from "@cosmjs/stargate";
import { WalletStrategy } from "@injectivelabs/wallet-ts";
import { Alert } from "@material-ui/lab";
import { Wallet } from "@near-wallet-selector/core";
import {
  useSigningCosmWasmClient as useSeiSigningCosmWasmClient,
  useWallet as useSeiWallet,
} from "@sei-js/react";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  WalletContextState as WalletContextStateSui,
  useWallet,
} from "@suiet/wallet-kit";
import {
  ConnectedWallet,
  useConnectedWallet,
} from "@terra-money/wallet-provider";
import {
  ConnectedWallet as XplaConnectedWallet,
  useConnectedWallet as useXplaConnectedWallet,
} from "@xpla/wallet-provider";
import algosdk from "algosdk";
import { Types } from "aptos";
import { Signer } from "ethers";
import { useSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlgorandContext } from "../contexts/AlgorandWalletContext";
import { useAptosContext } from "../contexts/AptosWalletContext";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { useInjectiveContext } from "../contexts/InjectiveWalletContext";
import { useNearContext } from "../contexts/NearWalletContext";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import {
  setAttestTx,
  setIsSending,
  setSignedVAAHex,
} from "../store/attestSlice";
import {
  selectAttestIsSendComplete,
  selectAttestIsSending,
  selectAttestIsTargetComplete,
  selectAttestSourceAsset,
  selectAttestSourceChain,
  selectTerraFeeDenom,
} from "../store/selectors";
import { signSendAndConfirmAlgorand } from "../utils/algorand";
import {
  getAptosClient,
  getEmitterAddressAndSequenceFromResult,
  waitForSignAndSubmitTransaction,
} from "../utils/aptos";
import {
  ALGORAND_BRIDGE_ID,
  ALGORAND_HOST,
  ALGORAND_TOKEN_BRIDGE_ID,
  NATIVE_NEAR_PLACEHOLDER,
  NEAR_CORE_BRIDGE_ACCOUNT,
  NEAR_TOKEN_BRIDGE_ACCOUNT,
  SOLANA_HOST,
  SOL_BRIDGE_ADDRESS,
  SOL_TOKEN_BRIDGE_ADDRESS,
  WORMHOLE_RPC_HOSTS,
  getBridgeAddressForChain,
  getTokenBridgeAddressForChain,
} from "../utils/consts";
import { broadcastInjectiveTx } from "../utils/injective";
import {
  makeNearAccount,
  makeNearProvider,
  signAndSendTransactions,
} from "../utils/near";
import parseError from "../utils/parseError";
import { signSendAndConfirm } from "../utils/solana";
import { getSuiProvider } from "../utils/sui";
import { postWithFees, waitForTerraExecution } from "../utils/terra";
import { postWithFeesXpla, waitForXplaExecution } from "../utils/xpla";
import { attestFromSeiMsg, parseSequenceFromLogSei } from "../utils/sei";

async function algo(
  dispatch: any,
  enqueueSnackbar: any,
  senderAddr: string,
  sourceAsset: string
) {
  dispatch(setIsSending(true));
  try {
    const algodClient = new algosdk.Algodv2(
      ALGORAND_HOST.algodToken,
      ALGORAND_HOST.algodServer,
      ALGORAND_HOST.algodPort
    );
    const txs = await attestFromAlgorand(
      algodClient,
      ALGORAND_TOKEN_BRIDGE_ID,
      ALGORAND_BRIDGE_ID,
      senderAddr,
      BigInt(sourceAsset)
    );
    const result = await signSendAndConfirmAlgorand(algodClient, txs);
    const sequence = parseSequenceFromLogAlgorand(result);
    // TODO: fill these out correctly
    dispatch(
      setAttestTx({
        id: txs[txs.length - 1].tx.txID(),
        block: result["confirmed-round"],
      })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const emitterAddress = getEmitterAddressAlgorand(ALGORAND_TOKEN_BRIDGE_ID);
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_ALGORAND,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function aptos(
  dispatch: any,
  enqueueSnackbar: any,
  sourceAsset: string,
  signAndSubmitTransaction: (
    transaction: Types.TransactionPayload,
    options?: any
  ) => Promise<{
    hash: string;
  }>
) {
  dispatch(setIsSending(true));
  const tokenBridgeAddress = getTokenBridgeAddressForChain(CHAIN_ID_APTOS);
  try {
    const attestPayload = attestFromAptos(
      tokenBridgeAddress,
      CHAIN_ID_APTOS,
      sourceAsset
    );
    const hash = await waitForSignAndSubmitTransaction(
      attestPayload,
      signAndSubmitTransaction
    );
    dispatch(setAttestTx({ id: hash, block: 1 }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const result = (await getAptosClient().waitForTransactionWithResult(
      hash
    )) as Types.UserTransaction;
    const { emitterAddress, sequence } =
      getEmitterAddressAndSequenceFromResult(result);
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_APTOS,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function evm(
  dispatch: any,
  enqueueSnackbar: any,
  signer: Signer,
  sourceAsset: string,
  chainId: ChainId
) {
  dispatch(setIsSending(true));
  try {
    // Klaytn requires specifying gasPrice
    const overrides =
      chainId === CHAIN_ID_KLAYTN
        ? { gasPrice: (await signer.getGasPrice()).toString() }
        : {};
    const receipt = await attestFromEth(
      getTokenBridgeAddressForChain(chainId),
      signer,
      sourceAsset,
      overrides
    );
    dispatch(
      setAttestTx({ id: receipt.transactionHash, block: receipt.blockNumber })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const sequence = parseSequenceFromLogEth(
      receipt,
      getBridgeAddressForChain(chainId)
    );
    const emitterAddress = getEmitterAddressEth(
      getTokenBridgeAddressForChain(chainId)
    );
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      chainId,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function near(
  dispatch: any,
  enqueueSnackbar: any,
  senderAddr: string,
  sourceAsset: string,
  wallet: Wallet
) {
  dispatch(setIsSending(true));
  try {
    const account = await makeNearAccount(senderAddr);
    const msgs =
      sourceAsset === NATIVE_NEAR_PLACEHOLDER
        ? [
            await attestNearFromNear(
              makeNearProvider(),
              NEAR_CORE_BRIDGE_ACCOUNT,
              NEAR_TOKEN_BRIDGE_ACCOUNT
            ),
          ]
        : await attestTokenFromNear(
            makeNearProvider(),
            NEAR_CORE_BRIDGE_ACCOUNT,
            NEAR_TOKEN_BRIDGE_ACCOUNT,
            sourceAsset
          );
    const receipt = await signAndSendTransactions(account, wallet, msgs);
    const sequence = parseSequenceFromLogNear(receipt);
    if (sequence === null) {
      throw new Error("Unable to parse sequence from log");
    }
    dispatch(
      setAttestTx({
        id: receipt.transaction_outcome.id,
        block: 0,
      })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const emitterAddress = getEmitterAddressNear(NEAR_TOKEN_BRIDGE_ACCOUNT);
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_NEAR,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function solana(
  dispatch: any,
  enqueueSnackbar: any,
  solPK: PublicKey,
  sourceAsset: string,
  wallet: WalletContextState
) {
  dispatch(setIsSending(true));
  try {
    const connection = new Connection(SOLANA_HOST, "confirmed");
    const transaction = await attestFromSolana(
      connection,
      SOL_BRIDGE_ADDRESS,
      SOL_TOKEN_BRIDGE_ADDRESS,
      solPK.toString(),
      sourceAsset
    );
    const txid = await signSendAndConfirm(wallet, connection, transaction);
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const info = await connection.getTransaction(txid);
    if (!info) {
      // TODO: error state
      throw new Error("An error occurred while fetching the transaction info");
    }
    dispatch(setAttestTx({ id: txid, block: info.slot }));
    const sequence = parseSequenceFromLogSolana(info);
    const emitterAddress = await getEmitterAddressSolana(
      SOL_TOKEN_BRIDGE_ADDRESS
    );
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_SOLANA,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function terra(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: ConnectedWallet,
  asset: string,
  feeDenom: string,
  chainId: TerraChainId
) {
  dispatch(setIsSending(true));
  try {
    const tokenBridgeAddress = getTokenBridgeAddressForChain(chainId);
    const msg = await attestFromTerra(
      tokenBridgeAddress,
      wallet.terraAddress,
      asset
    );
    const result = await postWithFees(
      wallet,
      [msg],
      "Create Wrapped",
      [feeDenom],
      chainId
    );
    const info = await waitForTerraExecution(result, chainId);
    dispatch(setAttestTx({ id: info.txhash, block: info.height }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const sequence = parseSequenceFromLogTerra(info);
    if (!sequence) {
      throw new Error("Sequence not found");
    }
    const emitterAddress = await getEmitterAddressTerra(tokenBridgeAddress);
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      chainId,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function xpla(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: XplaConnectedWallet,
  asset: string
) {
  dispatch(setIsSending(true));
  try {
    const tokenBridgeAddress = getTokenBridgeAddressForChain(CHAIN_ID_XPLA);
    const msg = attestFromXpla(tokenBridgeAddress, wallet.xplaAddress, asset);
    const result = await postWithFeesXpla(wallet, [msg], "Create Wrapped");
    const info = await waitForXplaExecution(result);
    dispatch(setAttestTx({ id: info.txhash, block: info.height }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const sequence = parseSequenceFromLogXpla(info);
    if (!sequence) {
      throw new Error("Sequence not found");
    }
    const emitterAddress = await getEmitterAddressXpla(tokenBridgeAddress);
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_XPLA,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function injective(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: WalletStrategy,
  walletAddress: string,
  asset: string
) {
  dispatch(setIsSending(true));
  try {
    const tokenBridgeAddress =
      getTokenBridgeAddressForChain(CHAIN_ID_INJECTIVE);
    const msg = await attestFromInjective(
      tokenBridgeAddress,
      walletAddress,
      asset
    );
    const tx = await broadcastInjectiveTx(
      wallet,
      walletAddress,
      msg,
      "Attest Token"
    );
    dispatch(setAttestTx({ id: tx.txHash, block: tx.height }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const sequence = parseSequenceFromLogInjective(tx);
    if (!sequence) {
      throw new Error("Sequence not found");
    }
    const emitterAddress = await getEmitterAddressInjective(tokenBridgeAddress);
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_INJECTIVE,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function sei(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: SigningCosmWasmClient,
  walletAddress: string,
  asset: string
) {
  dispatch(setIsSending(true));
  try {
    const msg = attestFromSeiMsg(asset);
    const fee = calculateFee(600000, "0.1usei");
    const tokenBridgeAddress = getTokenBridgeAddressForChain(CHAIN_ID_SEI);
    const tx = await wallet.execute(
      walletAddress,
      tokenBridgeAddress,
      msg,
      fee,
      "Wormhole - Create Wrapped"
    );
    dispatch(setAttestTx({ id: tx.transactionHash, block: tx.height }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const sequence = parseSequenceFromLogSei(tx);
    if (!sequence) {
      throw new Error("Sequence not found");
    }
    const emitterAddress = await getEmitterAddressTerra(tokenBridgeAddress);
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_SEI,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

async function sui(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: WalletContextStateSui,
  asset: string
) {
  dispatch(setIsSending(true));
  try {
    const provider = getSuiProvider();
    const tx = await attestFromSui(
      provider,
      getBridgeAddressForChain(CHAIN_ID_SUI),
      getTokenBridgeAddressForChain(CHAIN_ID_SUI),
      asset
    );
    const response = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEvents: true,
      },
    });
    dispatch(
      setAttestTx({
        id: response.digest,
        block: Number(response.checkpoint || 0),
      })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
    const coreBridgePackageId = await getOriginalPackageId(
      provider,
      getBridgeAddressForChain(CHAIN_ID_SUI)
    );
    if (!coreBridgePackageId)
      throw new Error("Unable to retrieve original package id");
    const { sequence, emitterAddress } =
      getEmitterAddressAndSequenceFromResponseSui(
        coreBridgePackageId,
        response
      );
    enqueueSnackbar(null, {
      content: <Alert severity="info">Fetching VAA</Alert>,
    });
    const { vaaBytes } = await getSignedVAAWithRetry(
      WORMHOLE_RPC_HOSTS,
      CHAIN_ID_SUI,
      emitterAddress,
      sequence
    );
    dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Fetched Signed VAA</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsSending(false));
  }
}

export function useHandleAttest() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const sourceChain = useSelector(selectAttestSourceChain);
  const sourceAsset = useSelector(selectAttestSourceAsset);
  const isTargetComplete = useSelector(selectAttestIsTargetComplete);
  const isSending = useSelector(selectAttestIsSending);
  const isSendComplete = useSelector(selectAttestIsSendComplete);
  const { signer } = useEthereumProvider();
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const terraWallet = useConnectedWallet();
  const xplaWallet = useXplaConnectedWallet();
  const terraFeeDenom = useSelector(selectTerraFeeDenom);
  const { accounts: algoAccounts } = useAlgorandContext();
  const { account: aptosAccount, signAndSubmitTransaction } = useAptosContext();
  const aptosAddress = aptosAccount?.address?.toString();
  const { wallet: injWallet, address: injAddress } = useInjectiveContext();
  const { signingCosmWasmClient: seiSigningCosmWasmClient } =
    useSeiSigningCosmWasmClient();
  const { accounts: seiAccounts } = useSeiWallet();
  const seiAddress = seiAccounts.length ? seiAccounts[0].address : null;
  const { accountId: nearAccountId, wallet: nearWallet } = useNearContext();
  const suiWallet = useWallet();
  const disabled = !isTargetComplete || isSending || isSendComplete;
  const handleAttestClick = useCallback(() => {
    if (isEVMChain(sourceChain) && !!signer) {
      evm(dispatch, enqueueSnackbar, signer, sourceAsset, sourceChain);
    } else if (sourceChain === CHAIN_ID_SOLANA && !!solanaWallet && !!solPK) {
      solana(dispatch, enqueueSnackbar, solPK, sourceAsset, solanaWallet);
    } else if (isTerraChain(sourceChain) && !!terraWallet) {
      terra(
        dispatch,
        enqueueSnackbar,
        terraWallet,
        sourceAsset,
        terraFeeDenom,
        sourceChain
      );
    } else if (sourceChain === CHAIN_ID_XPLA && !!xplaWallet) {
      xpla(dispatch, enqueueSnackbar, xplaWallet, sourceAsset);
    } else if (sourceChain === CHAIN_ID_ALGORAND && algoAccounts[0]) {
      algo(dispatch, enqueueSnackbar, algoAccounts[0].address, sourceAsset);
    } else if (sourceChain === CHAIN_ID_APTOS && aptosAddress) {
      aptos(dispatch, enqueueSnackbar, sourceAsset, signAndSubmitTransaction);
    } else if (sourceChain === CHAIN_ID_INJECTIVE && injWallet && injAddress) {
      injective(dispatch, enqueueSnackbar, injWallet, injAddress, sourceAsset);
    } else if (
      sourceChain === CHAIN_ID_SEI &&
      seiSigningCosmWasmClient &&
      seiAddress
    ) {
      sei(
        dispatch,
        enqueueSnackbar,
        seiSigningCosmWasmClient,
        seiAddress,
        sourceAsset
      );
    } else if (sourceChain === CHAIN_ID_NEAR && nearAccountId && nearWallet) {
      near(dispatch, enqueueSnackbar, nearAccountId, sourceAsset, nearWallet);
    } else if (
      sourceChain === CHAIN_ID_SUI &&
      suiWallet.connected &&
      suiWallet.address
    ) {
      sui(dispatch, enqueueSnackbar, suiWallet, sourceAsset);
    }
  }, [
    dispatch,
    enqueueSnackbar,
    sourceChain,
    signer,
    solanaWallet,
    solPK,
    terraWallet,
    sourceAsset,
    terraFeeDenom,
    algoAccounts,
    xplaWallet,
    aptosAddress,
    signAndSubmitTransaction,
    injWallet,
    injAddress,
    nearAccountId,
    nearWallet,
    suiWallet,
    seiSigningCosmWasmClient,
    seiAddress,
  ]);
  return useMemo(
    () => ({
      handleClick: handleAttestClick,
      disabled,
      showLoader: isSending,
    }),
    [handleAttestClick, disabled, isSending]
  );
}
