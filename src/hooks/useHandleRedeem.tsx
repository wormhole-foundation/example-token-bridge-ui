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
  isEVMChain,
  isTerraChain,
  parseTransferPayload,
  parseVaa,
  postVaaSolanaWithRetry,
  redeemAndUnwrapOnSolana,
  redeemOnAlgorand,
  redeemOnEth,
  redeemOnEthNative,
  redeemOnInjective,
  redeemOnNear,
  redeemOnSolana,
  redeemOnSui,
  redeemOnTerra,
  redeemOnXpla,
  uint8ArrayToHex,
} from "@certusone/wormhole-sdk";
import { completeTransferAndRegister } from "@certusone/wormhole-sdk/lib/esm/aptos/api/tokenBridge";
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
import { Connection } from "@solana/web3.js";
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
import axios from "axios";
import { Signer } from "ethers";
import { fromUint8Array } from "js-base64";
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
  selectTerraFeeDenom,
  selectTransferIsRedeeming,
  selectTransferTargetChain,
} from "../store/selectors";
import { setIsRedeeming, setRedeemTx } from "../store/transferSlice";
import { signSendAndConfirmAlgorand } from "../utils/algorand";
import {
  getAptosClient,
  waitForSignAndSubmitTransaction,
} from "../utils/aptos";
import {
  ACALA_RELAY_URL,
  ALGORAND_BRIDGE_ID,
  ALGORAND_HOST,
  ALGORAND_TOKEN_BRIDGE_ID,
  MAX_VAA_UPLOAD_RETRIES_SOLANA,
  NEAR_TOKEN_BRIDGE_ACCOUNT,
  SEI_TRANSLATER_TARGET,
  SEI_TRANSLATOR,
  SOLANA_HOST,
  SOL_BRIDGE_ADDRESS,
  SOL_TOKEN_BRIDGE_ADDRESS,
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
import { postWithFees } from "../utils/terra";
import { postWithFeesXpla } from "../utils/xpla";
import useTransferSignedVAA from "./useTransferSignedVAA";

async function algo(
  dispatch: any,
  enqueueSnackbar: any,
  senderAddr: string,
  signedVAA: Uint8Array
) {
  dispatch(setIsRedeeming(true));
  try {
    const algodClient = new algosdk.Algodv2(
      ALGORAND_HOST.algodToken,
      ALGORAND_HOST.algodServer,
      ALGORAND_HOST.algodPort
    );
    const txs = await redeemOnAlgorand(
      algodClient,
      ALGORAND_TOKEN_BRIDGE_ID,
      ALGORAND_BRIDGE_ID,
      signedVAA,
      senderAddr
    );
    const result = await signSendAndConfirmAlgorand(algodClient, txs);
    // TODO: fill these out correctly
    dispatch(
      setRedeemTx({
        id: txs[txs.length - 1].tx.txID(),
        block: result["confirmed-round"],
      })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function aptos(
  dispatch: any,
  enqueueSnackbar: any,
  signedVAA: Uint8Array,
  signAndSubmitTransaction: (
    transaction: Types.TransactionPayload,
    options?: any
  ) => Promise<{
    hash: string;
  }>
) {
  dispatch(setIsRedeeming(true));
  const tokenBridgeAddress = getTokenBridgeAddressForChain(CHAIN_ID_APTOS);
  try {
    const msg = await completeTransferAndRegister(
      getAptosClient(),
      tokenBridgeAddress,
      signedVAA
    );
    const result = await waitForSignAndSubmitTransaction(
      msg,
      signAndSubmitTransaction
    );
    dispatch(setRedeemTx({ id: result, block: 1 }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function evm(
  dispatch: any,
  enqueueSnackbar: any,
  signer: Signer,
  signedVAA: Uint8Array,
  isNative: boolean,
  chainId: ChainId
) {
  dispatch(setIsRedeeming(true));
  try {
    // Klaytn requires specifying gasPrice
    const overrides =
      chainId === CHAIN_ID_KLAYTN
        ? { gasPrice: (await signer.getGasPrice()).toString() }
        : {};
    const receipt = isNative
      ? await redeemOnEthNative(
          getTokenBridgeAddressForChain(chainId),
          signer,
          signedVAA,
          overrides
        )
      : await redeemOnEth(
          getTokenBridgeAddressForChain(chainId),
          signer,
          signedVAA,
          overrides
        );
    dispatch(
      setRedeemTx({ id: receipt.transactionHash, block: receipt.blockNumber })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function near(
  dispatch: any,
  enqueueSnackbar: any,
  senderAddr: string,
  signedVAA: Uint8Array,
  wallet: Wallet
) {
  dispatch(setIsRedeeming(true));
  try {
    const account = await makeNearAccount(senderAddr);
    const msgs = await redeemOnNear(
      makeNearProvider(),
      account.accountId,
      NEAR_TOKEN_BRIDGE_ACCOUNT,
      signedVAA
    );
    const receipt = await signAndSendTransactions(account, wallet, msgs);
    dispatch(
      setRedeemTx({
        id: receipt.transaction_outcome.id,
        block: 0,
      })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function solana(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: WalletContextState,
  payerAddress: string, //TODO: we may not need this since we have wallet
  signedVAA: Uint8Array,
  isNative: boolean
) {
  dispatch(setIsRedeeming(true));
  try {
    if (!wallet.signTransaction) {
      throw new Error("wallet.signTransaction is undefined");
    }
    const connection = new Connection(SOLANA_HOST, "confirmed");
    await postVaaSolanaWithRetry(
      connection,
      wallet.signTransaction,
      SOL_BRIDGE_ADDRESS,
      payerAddress,
      Buffer.from(signedVAA),
      MAX_VAA_UPLOAD_RETRIES_SOLANA
    );
    // TODO: how do we retry in between these steps
    const transaction = isNative
      ? await redeemAndUnwrapOnSolana(
          connection,
          SOL_BRIDGE_ADDRESS,
          SOL_TOKEN_BRIDGE_ADDRESS,
          payerAddress,
          signedVAA
        )
      : await redeemOnSolana(
          connection,
          SOL_BRIDGE_ADDRESS,
          SOL_TOKEN_BRIDGE_ADDRESS,
          payerAddress,
          signedVAA
        );
    const txid = await signSendAndConfirm(wallet, connection, transaction);
    // TODO: didn't want to make an info call we didn't need, can we get the block without it by modifying the above call?
    dispatch(setRedeemTx({ id: txid, block: 1 }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function terra(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: ConnectedWallet,
  signedVAA: Uint8Array,
  feeDenom: string,
  chainId: TerraChainId
) {
  dispatch(setIsRedeeming(true));
  try {
    const msg = await redeemOnTerra(
      getTokenBridgeAddressForChain(chainId),
      wallet.terraAddress,
      signedVAA
    );
    const result = await postWithFees(
      wallet,
      [msg],
      "Wormhole - Complete Transfer",
      [feeDenom],
      chainId
    );
    dispatch(
      setRedeemTx({ id: result.result.txhash, block: result.result.height })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function xpla(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: XplaConnectedWallet,
  signedVAA: Uint8Array
) {
  dispatch(setIsRedeeming(true));
  try {
    const msg = await redeemOnXpla(
      getTokenBridgeAddressForChain(CHAIN_ID_XPLA),
      wallet.xplaAddress,
      signedVAA
    );
    const result = await postWithFeesXpla(
      wallet,
      [msg],
      "Wormhole - Complete Transfer"
    );
    dispatch(
      setRedeemTx({ id: result.result.txhash, block: result.result.height })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function injective(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: WalletStrategy,
  walletAddress: string,
  signedVAA: Uint8Array
) {
  dispatch(setIsRedeeming(true));
  try {
    const msg = await redeemOnInjective(
      getTokenBridgeAddressForChain(CHAIN_ID_INJECTIVE),
      walletAddress,
      signedVAA
    );
    const tx = await broadcastInjectiveTx(
      wallet,
      walletAddress,
      msg,
      "Wormhole - Complete Transfer"
    );
    dispatch(setRedeemTx({ id: tx.txHash, block: tx.height }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function sei(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: SigningCosmWasmClient,
  walletAddress: string,
  signedVAA: Uint8Array
) {
  dispatch(setIsRedeeming(true));
  try {
    const parsed = parseVaa(signedVAA);
    const payload = parseTransferPayload(parsed.payload);
    if (payload.targetAddress === uint8ArrayToHex(SEI_TRANSLATER_TARGET)) {
      const msg = {
        complete_transfer_and_convert: {
          vaa: fromUint8Array(signedVAA),
        },
      };
      const fee = calculateFee(800000, "0.1usei");
      const tx = await wallet.execute(
        walletAddress,
        SEI_TRANSLATOR,
        msg,
        fee,
        "Wormhole - Complete Transfer"
      );
      dispatch(setRedeemTx({ id: tx.transactionHash, block: tx.height }));
      enqueueSnackbar(null, {
        content: <Alert severity="success">Transaction confirmed</Alert>,
      });
    } else {
      const msg = {
        submit_vaa: {
          data: fromUint8Array(signedVAA),
        },
      };
      const fee = calculateFee(800000, "0.1usei");
      const tx = await wallet.execute(
        walletAddress,
        getTokenBridgeAddressForChain(CHAIN_ID_SEI),
        msg,
        fee,
        "Wormhole - Complete Transfer"
      );
      dispatch(setRedeemTx({ id: tx.transactionHash, block: tx.height }));
      enqueueSnackbar(null, {
        content: <Alert severity="success">Transaction confirmed</Alert>,
      });
    }
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

async function sui(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: WalletContextStateSui,
  signedVAA: Uint8Array
) {
  dispatch(setIsRedeeming(true));
  try {
    const provider = getSuiProvider();
    const tx = await redeemOnSui(
      provider,
      getBridgeAddressForChain(CHAIN_ID_SUI),
      getTokenBridgeAddressForChain(CHAIN_ID_SUI),
      signedVAA
    );
    const response = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });
    dispatch(
      setRedeemTx({
        id: response.digest,
        block: Number(response.checkpoint || 0),
      })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsRedeeming(false));
  }
}

export function useHandleRedeem() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const targetChain = useSelector(selectTransferTargetChain);
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const { signer } = useEthereumProvider();
  const terraWallet = useConnectedWallet();
  const terraFeeDenom = useSelector(selectTerraFeeDenom);
  const xplaWallet = useXplaConnectedWallet();
  const { accounts: algoAccounts } = useAlgorandContext();
  const { account: aptosAccount, signAndSubmitTransaction } = useAptosContext();
  const aptosAddress = aptosAccount?.address?.toString();
  const { wallet: injWallet, address: injAddress } = useInjectiveContext();
  const { accountId: nearAccountId, wallet } = useNearContext();
  const { signingCosmWasmClient: seiSigningCosmWasmClient } =
    useSeiSigningCosmWasmClient();
  const { accounts: seiAccounts } = useSeiWallet();
  const seiAddress = seiAccounts.length ? seiAccounts[0].address : null;
  const suiWallet = useWallet();
  const signedVAA = useTransferSignedVAA();
  const isRedeeming = useSelector(selectTransferIsRedeeming);
  const handleRedeemClick = useCallback(() => {
    if (isEVMChain(targetChain) && !!signer && signedVAA) {
      evm(dispatch, enqueueSnackbar, signer, signedVAA, false, targetChain);
    } else if (
      targetChain === CHAIN_ID_SOLANA &&
      !!solanaWallet &&
      !!solPK &&
      signedVAA
    ) {
      solana(
        dispatch,
        enqueueSnackbar,
        solanaWallet,
        solPK.toString(),
        signedVAA,
        false
      );
    } else if (isTerraChain(targetChain) && !!terraWallet && signedVAA) {
      terra(
        dispatch,
        enqueueSnackbar,
        terraWallet,
        signedVAA,
        terraFeeDenom,
        targetChain
      );
    } else if (targetChain === CHAIN_ID_XPLA && !!xplaWallet && signedVAA) {
      xpla(dispatch, enqueueSnackbar, xplaWallet, signedVAA);
    } else if (targetChain === CHAIN_ID_APTOS && !!aptosAddress && signedVAA) {
      aptos(dispatch, enqueueSnackbar, signedVAA, signAndSubmitTransaction);
    } else if (
      targetChain === CHAIN_ID_ALGORAND &&
      algoAccounts[0] &&
      !!signedVAA
    ) {
      algo(dispatch, enqueueSnackbar, algoAccounts[0]?.address, signedVAA);
    } else if (
      targetChain === CHAIN_ID_INJECTIVE &&
      injWallet &&
      injAddress &&
      signedVAA
    ) {
      injective(dispatch, enqueueSnackbar, injWallet, injAddress, signedVAA);
    } else if (
      targetChain === CHAIN_ID_SEI &&
      seiSigningCosmWasmClient &&
      seiAddress &&
      signedVAA
    ) {
      sei(
        dispatch,
        enqueueSnackbar,
        seiSigningCosmWasmClient,
        seiAddress,
        signedVAA
      );
    } else if (
      targetChain === CHAIN_ID_NEAR &&
      nearAccountId &&
      wallet &&
      !!signedVAA
    ) {
      near(dispatch, enqueueSnackbar, nearAccountId, signedVAA, wallet);
    } else if (
      targetChain === CHAIN_ID_SUI &&
      suiWallet.address &&
      !!signedVAA
    ) {
      sui(dispatch, enqueueSnackbar, suiWallet, signedVAA);
    }
  }, [
    dispatch,
    enqueueSnackbar,
    targetChain,
    signer,
    signedVAA,
    solanaWallet,
    solPK,
    terraWallet,
    terraFeeDenom,
    algoAccounts,
    xplaWallet,
    aptosAddress,
    signAndSubmitTransaction,
    injWallet,
    injAddress,
    nearAccountId,
    wallet,
    seiSigningCosmWasmClient,
    seiAddress,
    suiWallet,
  ]);

  const handleRedeemNativeClick = useCallback(() => {
    console.log(targetChain, suiWallet.address, !!signedVAA);
    if (isEVMChain(targetChain) && !!signer && signedVAA) {
      evm(dispatch, enqueueSnackbar, signer, signedVAA, true, targetChain);
    } else if (
      targetChain === CHAIN_ID_SOLANA &&
      !!solanaWallet &&
      !!solPK &&
      signedVAA
    ) {
      solana(
        dispatch,
        enqueueSnackbar,
        solanaWallet,
        solPK.toString(),
        signedVAA,
        true
      );
    } else if (isTerraChain(targetChain) && !!terraWallet && signedVAA) {
      terra(
        dispatch,
        enqueueSnackbar,
        terraWallet,
        signedVAA,
        terraFeeDenom,
        targetChain
      ); //TODO isNative = true
    } else if (
      targetChain === CHAIN_ID_ALGORAND &&
      algoAccounts[0] &&
      !!signedVAA
    ) {
      algo(dispatch, enqueueSnackbar, algoAccounts[0]?.address, signedVAA);
    } else if (
      targetChain === CHAIN_ID_INJECTIVE &&
      injWallet &&
      injAddress &&
      signedVAA
    ) {
      injective(dispatch, enqueueSnackbar, injWallet, injAddress, signedVAA);
    } else if (
      targetChain === CHAIN_ID_SEI &&
      seiSigningCosmWasmClient &&
      seiAddress &&
      signedVAA
    ) {
      sei(
        dispatch,
        enqueueSnackbar,
        seiSigningCosmWasmClient,
        seiAddress,
        signedVAA
      );
    } else if (targetChain === CHAIN_ID_SUI && suiWallet.address && signedVAA) {
      sui(dispatch, enqueueSnackbar, suiWallet, signedVAA);
    }
  }, [
    dispatch,
    enqueueSnackbar,
    targetChain,
    signer,
    signedVAA,
    solanaWallet,
    solPK,
    terraWallet,
    terraFeeDenom,
    algoAccounts,
    injWallet,
    injAddress,
    seiSigningCosmWasmClient,
    seiAddress,
    suiWallet,
  ]);

  const handleAcalaRelayerRedeemClick = useCallback(async () => {
    if (!signedVAA) return;

    dispatch(setIsRedeeming(true));

    try {
      const res = await axios.post(ACALA_RELAY_URL, {
        targetChain,
        signedVAA: uint8ArrayToHex(signedVAA),
      });

      dispatch(
        setRedeemTx({
          id: res.data.transactionHash,
          block: res.data.blockNumber,
        })
      );
      enqueueSnackbar(null, {
        content: <Alert severity="success">Transaction confirmed</Alert>,
      });
    } catch (e) {
      enqueueSnackbar(null, {
        content: <Alert severity="error">{parseError(e)}</Alert>,
      });
      dispatch(setIsRedeeming(false));
    }
  }, [targetChain, signedVAA, enqueueSnackbar, dispatch]);

  return useMemo(
    () => ({
      handleNativeClick: handleRedeemNativeClick,
      handleClick: handleRedeemClick,
      handleAcalaRelayerRedeemClick,
      disabled: !!isRedeeming,
      showLoader: !!isRedeeming,
    }),
    [
      handleRedeemClick,
      isRedeeming,
      handleRedeemNativeClick,
      handleAcalaRelayerRedeemClick,
    ]
  );
}
