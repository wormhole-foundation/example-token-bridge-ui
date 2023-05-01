import {
  CHAIN_ID_ACALA,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_KARURA,
  CHAIN_ID_KLAYTN,
  CHAIN_ID_NEAR,
  CHAIN_ID_SEI,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_XPLA,
  ChainId,
  TerraChainId,
  createWrappedOnAlgorand,
  createWrappedOnAptos,
  createWrappedOnEth,
  createWrappedOnInjective,
  createWrappedOnNear,
  createWrappedOnSolana,
  createWrappedOnSui,
  createWrappedOnSuiPrepare,
  createWrappedOnTerra,
  createWrappedOnXpla,
  createWrappedTypeOnAptos,
  isEVMChain,
  isTerraChain,
  parseAttestMetaVaa,
  postVaaSolanaWithRetry,
  updateWrappedOnEth,
  updateWrappedOnInjective,
  updateWrappedOnSolana,
  updateWrappedOnTerra,
  updateWrappedOnXpla,
} from "@certusone/wormhole-sdk";
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
import { SuiSignAndExecuteTransactionBlockOutput } from "@mysten/wallet-standard";
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
import { setCreateTx, setIsCreating } from "../store/attestSlice";
import {
  selectAttestIsCreating,
  selectAttestTargetChain,
  selectTerraFeeDenom,
} from "../store/selectors";
import { signSendAndConfirmAlgorand } from "../utils/algorand";
import { waitForSignAndSubmitTransaction } from "../utils/aptos";
import {
  ACALA_HOST,
  ALGORAND_BRIDGE_ID,
  ALGORAND_HOST,
  ALGORAND_TOKEN_BRIDGE_ID,
  KARURA_HOST,
  MAX_VAA_UPLOAD_RETRIES_SOLANA,
  NEAR_TOKEN_BRIDGE_ACCOUNT,
  SOLANA_HOST,
  SOL_BRIDGE_ADDRESS,
  SOL_TOKEN_BRIDGE_ADDRESS,
  getBridgeAddressForChain,
  getTokenBridgeAddressForChain,
} from "../utils/consts";
import { broadcastInjectiveTx } from "../utils/injective";
import { getKaruraGasParams } from "../utils/karura";
import {
  makeNearAccount,
  makeNearProvider,
  signAndSendTransactions,
} from "../utils/near";
import parseError from "../utils/parseError";
import { createWrappedOnSei, updateWrappedOnSei } from "../utils/sei";
import { signSendAndConfirm } from "../utils/solana";
import { postWithFees } from "../utils/terra";
import { postWithFeesXpla } from "../utils/xpla";
import useAttestSignedVAA from "./useAttestSignedVAA";
import { getSuiProvider } from "../utils/sui";
import {
  JsonRpcProvider,
  SUI_CLOCK_OBJECT_ID,
  TransactionBlock,
  getPublishedObjectChanges,
} from "@mysten/sui.js";
import { sleep } from "../utils/sleep";
import {
  getPackageId,
  getWrappedCoinType,
} from "@certusone/wormhole-sdk/lib/cjs/sui";

// TODO: replace with SDK method
export async function updateWrappedOnSui(
  provider: JsonRpcProvider,
  coreBridgeStateObjectId: string,
  tokenBridgeStateObjectId: string,
  coinPackageId: string,
  attestVAA: Uint8Array
): Promise<TransactionBlock> {
  const coreBridgePackageId = await getPackageId(
    provider,
    coreBridgeStateObjectId
  );
  const tokenBridgePackageId = await getPackageId(
    provider,
    tokenBridgeStateObjectId
  );

  // Get coin metadata
  const coinType = getWrappedCoinType(coinPackageId);
  const coinMetadataObjectId = (await provider.getCoinMetadata({ coinType }))
    ?.id;
  if (!coinMetadataObjectId) {
    throw new Error(
      `Coin metadata object not found for coin type ${coinType}.`
    );
  }

  // Get TokenBridgeMessage
  const tx = new TransactionBlock();
  const [vaa] = tx.moveCall({
    target: `${coreBridgePackageId}::vaa::parse_and_verify`,
    arguments: [
      tx.object(coreBridgeStateObjectId),
      tx.pure([...attestVAA]),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
  const [message] = tx.moveCall({
    target: `${tokenBridgePackageId}::vaa::verify_only_once`,
    arguments: [tx.object(tokenBridgeStateObjectId), vaa],
  });

  // Construct complete registration payload
  tx.moveCall({
    target: `${tokenBridgePackageId}::create_wrapped::update_attestation`,
    arguments: [
      tx.object(tokenBridgeStateObjectId),
      tx.object(coinMetadataObjectId),
      message,
    ],
    typeArguments: [coinType],
  });
  return tx;
}

async function algo(
  dispatch: any,
  enqueueSnackbar: any,
  senderAddr: string,
  signedVAA: Uint8Array
) {
  dispatch(setIsCreating(true));
  try {
    const algodClient = new algosdk.Algodv2(
      ALGORAND_HOST.algodToken,
      ALGORAND_HOST.algodServer,
      ALGORAND_HOST.algodPort
    );
    const txs = await createWrappedOnAlgorand(
      algodClient,
      ALGORAND_TOKEN_BRIDGE_ID,
      ALGORAND_BRIDGE_ID,
      senderAddr,
      signedVAA
    );
    const result = await signSendAndConfirmAlgorand(algodClient, txs);
    dispatch(
      setCreateTx({
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
    dispatch(setIsCreating(false));
  }
}

async function aptos(
  dispatch: any,
  enqueueSnackbar: any,
  senderAddr: string,
  signedVAA: Uint8Array,
  shouldUpdate: boolean,
  signAndSubmitTransaction: (
    transaction: Types.TransactionPayload,
    options?: any
  ) => Promise<{
    hash: string;
  }>
) {
  dispatch(setIsCreating(true));
  const tokenBridgeAddress = getTokenBridgeAddressForChain(CHAIN_ID_APTOS);
  // const client = getAptosClient();
  try {
    // create coin type (it's possible this was already done)
    // TODO: can this be detected? otherwise the user has to click cancel twice
    try {
      const createWrappedCoinTypePayload = createWrappedTypeOnAptos(
        tokenBridgeAddress,
        signedVAA
      );
      await waitForSignAndSubmitTransaction(
        createWrappedCoinTypePayload,
        signAndSubmitTransaction
      );
    } catch (e) {}
    // create coin
    const createWrappedCoinPayload = createWrappedOnAptos(
      tokenBridgeAddress,
      signedVAA
    );
    const result = await waitForSignAndSubmitTransaction(
      createWrappedCoinPayload,
      signAndSubmitTransaction
    );
    dispatch(setCreateTx({ id: result, block: 1 }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsCreating(false));
  }
}

async function evm(
  dispatch: any,
  enqueueSnackbar: any,
  signer: Signer,
  signedVAA: Uint8Array,
  chainId: ChainId,
  shouldUpdate: boolean
) {
  dispatch(setIsCreating(true));
  try {
    // Karura and Acala need gas params for contract deploys
    // Klaytn requires specifying gasPrice
    const overrides =
      chainId === CHAIN_ID_KARURA
        ? await getKaruraGasParams(KARURA_HOST)
        : chainId === CHAIN_ID_ACALA
        ? await getKaruraGasParams(ACALA_HOST)
        : chainId === CHAIN_ID_KLAYTN
        ? { gasPrice: (await signer.getGasPrice()).toString() }
        : {};
    const receipt = shouldUpdate
      ? await updateWrappedOnEth(
          getTokenBridgeAddressForChain(chainId),
          signer,
          signedVAA,
          overrides
        )
      : await createWrappedOnEth(
          getTokenBridgeAddressForChain(chainId),
          signer,
          signedVAA,
          overrides
        );
    dispatch(
      setCreateTx({ id: receipt.transactionHash, block: receipt.blockNumber })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsCreating(false));
  }
}

async function near(
  dispatch: any,
  enqueueSnackbar: any,
  senderAddr: string,
  signedVAA: Uint8Array,
  wallet: Wallet
) {
  dispatch(setIsCreating(true));
  try {
    const account = await makeNearAccount(senderAddr);
    const msgs = await createWrappedOnNear(
      makeNearProvider(),
      NEAR_TOKEN_BRIDGE_ACCOUNT,
      signedVAA
    );
    const receipt = await signAndSendTransactions(account, wallet, msgs);
    dispatch(
      setCreateTx({
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
    dispatch(setIsCreating(false));
  }
}

async function solana(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: WalletContextState,
  payerAddress: string, // TODO: we may not need this since we have wallet
  signedVAA: Uint8Array,
  shouldUpdate: boolean
) {
  dispatch(setIsCreating(true));
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
    const transaction = shouldUpdate
      ? await updateWrappedOnSolana(
          connection,
          SOL_BRIDGE_ADDRESS,
          SOL_TOKEN_BRIDGE_ADDRESS,
          payerAddress,
          signedVAA
        )
      : await createWrappedOnSolana(
          connection,
          SOL_BRIDGE_ADDRESS,
          SOL_TOKEN_BRIDGE_ADDRESS,
          payerAddress,
          signedVAA
        );
    const txid = await signSendAndConfirm(wallet, connection, transaction);
    // TODO: didn't want to make an info call we didn't need, can we get the block without it by modifying the above call?
    dispatch(setCreateTx({ id: txid, block: 1 }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsCreating(false));
  }
}

async function terra(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: ConnectedWallet,
  signedVAA: Uint8Array,
  shouldUpdate: boolean,
  feeDenom: string,
  chainId: TerraChainId
) {
  dispatch(setIsCreating(true));
  const tokenBridgeAddress = getTokenBridgeAddressForChain(chainId);
  try {
    const msg = shouldUpdate
      ? await updateWrappedOnTerra(
          tokenBridgeAddress,
          wallet.terraAddress,
          signedVAA
        )
      : await createWrappedOnTerra(
          tokenBridgeAddress,
          wallet.terraAddress,
          signedVAA
        );
    const result = await postWithFees(
      wallet,
      [msg],
      "Wormhole - Create Wrapped",
      [feeDenom],
      chainId
    );
    dispatch(
      setCreateTx({ id: result.result.txhash, block: result.result.height })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsCreating(false));
  }
}

async function xpla(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: XplaConnectedWallet,
  signedVAA: Uint8Array,
  shouldUpdate: boolean
) {
  dispatch(setIsCreating(true));
  const tokenBridgeAddress = getTokenBridgeAddressForChain(CHAIN_ID_XPLA);
  try {
    const msg = shouldUpdate
      ? await updateWrappedOnXpla(
          tokenBridgeAddress,
          wallet.xplaAddress,
          signedVAA
        )
      : await createWrappedOnXpla(
          tokenBridgeAddress,
          wallet.xplaAddress,
          signedVAA
        );
    const result = await postWithFeesXpla(
      wallet,
      [msg],
      "Wormhole - Create Wrapped"
    );
    dispatch(
      setCreateTx({ id: result.result.txhash, block: result.result.height })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsCreating(false));
  }
}

async function injective(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: WalletStrategy,
  walletAddress: string,
  signedVAA: Uint8Array,
  shouldUpdate: boolean
) {
  dispatch(setIsCreating(true));
  const tokenBridgeAddress = getTokenBridgeAddressForChain(CHAIN_ID_INJECTIVE);
  try {
    const msg = shouldUpdate
      ? await updateWrappedOnInjective(
          tokenBridgeAddress,
          walletAddress,
          signedVAA
        )
      : await createWrappedOnInjective(
          tokenBridgeAddress,
          walletAddress,
          signedVAA
        );
    const tx = await broadcastInjectiveTx(
      wallet,
      walletAddress,
      msg,
      "Wormhole - Create Wrapped"
    );
    dispatch(setCreateTx({ id: tx.txHash, block: tx.height }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsCreating(false));
  }
}

async function sei(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: SigningCosmWasmClient,
  walletAddress: string,
  signedVAA: Uint8Array,
  shouldUpdate: boolean
) {
  dispatch(setIsCreating(true));
  const tokenBridgeAddress = getTokenBridgeAddressForChain(CHAIN_ID_SEI);
  try {
    const msg = shouldUpdate
      ? await updateWrappedOnSei(signedVAA)
      : await createWrappedOnSei(signedVAA);
    // TODO: is this right?
    const fee = calculateFee(600000, "0.1usei");
    const tx = await wallet.execute(
      walletAddress,
      tokenBridgeAddress,
      msg,
      fee,
      "Wormhole - Create Wrapped"
    );
    dispatch(setCreateTx({ id: tx.transactionHash, block: tx.height }));
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsCreating(false));
  }
}

async function sui(
  dispatch: any,
  enqueueSnackbar: any,
  wallet: WalletContextStateSui,
  signedVAA: Uint8Array,
  foreignAddress: string | null | undefined
) {
  dispatch(setIsCreating(true));
  try {
    if (!wallet.address) {
      throw new Error("No wallet address");
    }
    const provider = getSuiProvider();
    let response: SuiSignAndExecuteTransactionBlockOutput;
    if (foreignAddress) {
      const suiUpdateWrappedTxPayload = await updateWrappedOnSui(
        provider,
        getBridgeAddressForChain(CHAIN_ID_SUI),
        getTokenBridgeAddressForChain(CHAIN_ID_SUI),
        foreignAddress.split("::")[0],
        signedVAA
      );
      response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: suiUpdateWrappedTxPayload,
        options: {
          showEvents: true,
        },
      });
    } else {
      const suiPrepareRegistrationTxPayload = await createWrappedOnSuiPrepare(
        provider,
        getBridgeAddressForChain(CHAIN_ID_SUI),
        getTokenBridgeAddressForChain(CHAIN_ID_SUI),
        parseAttestMetaVaa(signedVAA).decimals,
        wallet.address
      );
      const suiPrepareRegistrationTxRes =
        await wallet.signAndExecuteTransactionBlock({
          transactionBlock: suiPrepareRegistrationTxPayload,
          options: {
            showObjectChanges: true,
          },
        });
      console.log(suiPrepareRegistrationTxRes);
      const wrappedAssetSetupEvent =
        suiPrepareRegistrationTxRes.objectChanges?.find(
          (oc) =>
            oc.type === "created" && oc.objectType.includes("WrappedAssetSetup")
        );
      const wrappedAssetSetupType =
        (wrappedAssetSetupEvent?.type === "created" &&
          wrappedAssetSetupEvent.objectType) ||
        undefined;
      if (!wrappedAssetSetupType) {
        throw new Error("Error parsing wrappedAssetSetupType");
      }
      const publishEvents = getPublishedObjectChanges(
        suiPrepareRegistrationTxRes
      );
      if (publishEvents.length < 1) {
        throw new Error("Error parsing publishEvents");
      }
      const coinPackageId = publishEvents[0].packageId;
      let attempts = 0;
      let suiCompleteRegistrationTxPayload: TransactionBlock | null = null;
      while (!suiCompleteRegistrationTxPayload) {
        try {
          suiCompleteRegistrationTxPayload = await createWrappedOnSui(
            provider,
            getBridgeAddressForChain(CHAIN_ID_SUI),
            getTokenBridgeAddressForChain(CHAIN_ID_SUI),
            wallet.address,
            coinPackageId,
            wrappedAssetSetupType,
            signedVAA
          );
        } catch (e) {
          console.error(`Error on attempt ${++attempts}`);
          console.error(e);
          if (attempts > 15) {
            throw e;
          } else {
            await sleep(2000);
          }
        }
      }

      response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: suiCompleteRegistrationTxPayload,
        options: {
          showEvents: true,
        },
      });
    }

    dispatch(
      setCreateTx({
        id: response.digest,
        block: Number(response.checkpoint || 0),
      })
    );
    enqueueSnackbar(null, {
      content: <Alert severity="success">Transaction confirmed</Alert>,
    });
  } catch (e) {
    console.error(e);
    enqueueSnackbar(null, {
      content: <Alert severity="error">{parseError(e)}</Alert>,
    });
    dispatch(setIsCreating(false));
  }
}

export function useHandleCreateWrapped(
  shouldUpdate: boolean,
  foreignAddress: string | null | undefined
) {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const targetChain = useSelector(selectAttestTargetChain);
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const signedVAA = useAttestSignedVAA();
  const isCreating = useSelector(selectAttestIsCreating);
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
  const handleCreateClick = useCallback(() => {
    if (isEVMChain(targetChain) && !!signer && !!signedVAA) {
      evm(
        dispatch,
        enqueueSnackbar,
        signer,
        signedVAA,
        targetChain,
        shouldUpdate
      );
    } else if (
      targetChain === CHAIN_ID_SOLANA &&
      !!solanaWallet &&
      !!solPK &&
      !!signedVAA
    ) {
      solana(
        dispatch,
        enqueueSnackbar,
        solanaWallet,
        solPK.toString(),
        signedVAA,
        shouldUpdate
      );
    } else if (isTerraChain(targetChain) && !!terraWallet && !!signedVAA) {
      terra(
        dispatch,
        enqueueSnackbar,
        terraWallet,
        signedVAA,
        shouldUpdate,
        terraFeeDenom,
        targetChain
      );
    } else if (targetChain === CHAIN_ID_XPLA && !!xplaWallet && !!signedVAA) {
      xpla(dispatch, enqueueSnackbar, xplaWallet, signedVAA, shouldUpdate);
    } else if (
      targetChain === CHAIN_ID_APTOS &&
      !!aptosAddress &&
      !!signedVAA
    ) {
      aptos(
        dispatch,
        enqueueSnackbar,
        aptosAddress,
        signedVAA,
        shouldUpdate,
        signAndSubmitTransaction
      );
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
      !!signedVAA
    ) {
      injective(
        dispatch,
        enqueueSnackbar,
        injWallet,
        injAddress,
        signedVAA,
        shouldUpdate
      );
    } else if (
      targetChain === CHAIN_ID_SEI &&
      seiSigningCosmWasmClient &&
      seiAddress &&
      !!signedVAA
    ) {
      sei(
        dispatch,
        enqueueSnackbar,
        seiSigningCosmWasmClient,
        seiAddress,
        signedVAA,
        shouldUpdate
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
      suiWallet.connected &&
      suiWallet.address &&
      !!signedVAA
    ) {
      sui(dispatch, enqueueSnackbar, suiWallet, signedVAA, foreignAddress);
    } else {
      // enqueueSnackbar(
      //   "Creating wrapped tokens on this chain is not yet supported",
      //   {
      //     variant: "error",
      //   }
      // );
    }
  }, [
    dispatch,
    enqueueSnackbar,
    targetChain,
    solanaWallet,
    solPK,
    terraWallet,
    signedVAA,
    signer,
    shouldUpdate,
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
    foreignAddress,
  ]);
  return useMemo(
    () => ({
      handleClick: handleCreateClick,
      disabled: !!isCreating,
      showLoader: !!isCreating,
    }),
    [handleCreateClick, isCreating]
  );
}
