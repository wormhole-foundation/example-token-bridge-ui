import {
  ChainId,
  CHAIN_ID_AVAX,
  CHAIN_ID_ETH,
  getEmitterAddressEth,
  getSignedVAAWithRetry,
  isEVMChain,
  keccak256,
  parseSequenceFromLogEth,
  parseVaa,
  tryUint8ArrayToNative,
  uint8ArrayToHex,
} from "@certusone/wormhole-sdk";
import {
  Container,
  FormControlLabel,
  FormGroup,
  makeStyles,
  Slider,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import axios, { AxiosResponse } from "axios";
import { constants, Contract, ethers } from "ethers";
import {
  arrayify,
  formatUnits,
  hexlify,
  hexZeroPad,
  parseUnits,
} from "ethers/lib/utils";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { useEthereumProvider } from "../../contexts/EthereumProviderContext";
import useAllowance from "../../hooks/useAllowance";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import usdcLogo from "../../icons/usdc.svg";
import wormholeLogo from "../../icons/wormhole.svg";
import {
  selectAllowanceError,
  selectAmount,
  selectBalance,
  selectEstimatedSwapAmount,
  selectIsRedeemComplete,
  selectIsRedeeming,
  selectIsSending,
  selectMaxSwapAmount,
  selectRelayerFee,
  selectShouldApproveUnlimited,
  selectShouldRelay,
  selectSourceChain,
  selectSourceTxConfirmed,
  selectSourceTxHash,
  selectTargetChain,
  selectTargetTxHash,
  selectToNativeAmount,
  selectTransferInfo,
} from "../../store/usdcSelectors";
import {
  setAllowanceError,
  setAmount,
  setBalance,
  setEstimatedSwapAmount,
  setIsRedeemComplete,
  setIsRedeeming,
  setIsSending,
  setMaxSwapAmount,
  setRelayerFee,
  setShouldRelay,
  setSourceChain,
  setSourceTxConfirmed,
  setSourceTxHash,
  setTargetChain,
  setTargetTxHash,
  setToNativeAmount,
  setTransferInfo,
} from "../../store/usdcSlice";
import {
  CHAINS_BY_ID,
  getBridgeAddressForChain,
  getEvmChainId,
  WORMHOLE_RPC_HOSTS,
} from "../../utils/consts";
import {
  ethTokenToParsedTokenAccount,
  getEthereumToken,
} from "../../utils/ethereum";
import {
  EVM_RPC_MAP,
  METAMASK_CHAIN_PARAMETERS,
} from "../../utils/metaMaskChainParameters";
import parseError from "../../utils/parseError";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelectArrow from "../ChainSelectArrow";
import HeaderText from "../HeaderText";
import KeyAndBalance from "../KeyAndBalance";
import NumberTextField from "../NumberTextField";

const useStyles = makeStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    "& > img": {
      height: 20,
      maxWidth: 20,
      margin: "0 6px",
    },
  },
  chainSelectWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing(2),
  },
  chainSelectContainer: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "4px",
    display: "flex",
    width: "160px",
    maxWidth: "160px",
    height: "160px",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    "& > .MuiTypography-root": {
      marginTop: "8px",
    },
  },
  chainSelectArrow: {
    flexGrow: 1,
    textAlign: "center",
  },
  chainLogo: {
    height: 80,
    maxWidth: 80,
  },
  transferField: {
    marginTop: theme.spacing(2),
  },
  message: {
    color: theme.palette.warning.light,
    marginTop: theme.spacing(1),
    textAlign: "center",
  },
  stepperContainer: {
    marginTop: theme.spacing(4),
  },
  toggle: {
    marginTop: theme.spacing(2),
    "& .MuiFormControlLabel-root": {
      flexDirection: "row-reverse",
      marginLeft: theme.spacing(1),
      marginRight: 0,
    },
    "& .MuiFormControlLabel-label": {
      flexGrow: 1,
    },
  },
  sliderContainer: {
    margin: theme.spacing(0.5, 2, 0),
    "& .MuiSlider-thumb.MuiSlider-active": {
      // avoid increasing the margin further
      boxShadow: "0px 0px 0px 12px rgb(63 81 181 / 16%)",
    },
  },
  infoContainer: {
    display: "flex",
    margin: theme.spacing(2, 1, 0),
  },
}));

function findCircleMessageInLogs(
  logs: ethers.providers.Log[],
  circleEmitterAddress: string
): string | null {
  for (const log of logs) {
    if (log.address === circleEmitterAddress) {
      const messageSentIface = new ethers.utils.Interface([
        "event MessageSent(bytes message)",
      ]);
      return messageSentIface.parseLog(log).args.message as string;
    }
  }

  return null;
}

async function sleep(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function getCircleAttestation(
  messageHash: ethers.BytesLike,
  timeout: number = 2000
) {
  while (true) {
    // get the post
    const response = await axios
      .get(`https://iris-api-sandbox.circle.com/attestations/${messageHash}`)
      .catch((reason) => {
        return null;
      })
      .then(async (response: AxiosResponse | null) => {
        if (
          response !== null &&
          response.status === 200 &&
          response.data.status === "complete"
        ) {
          return response.data.attestation as string;
        }

        return null;
      });

    if (response !== null) {
      return response;
    }

    await sleep(timeout);
  }
}

async function handleCircleMessageInLogs(
  logs: ethers.providers.Log[],
  circleEmitterAddress: string
): Promise<[string | null, string | null]> {
  const circleMessage = findCircleMessageInLogs(logs, circleEmitterAddress);
  if (circleMessage === null) {
    return [null, null];
  }

  const circleMessageHash = ethers.utils.keccak256(circleMessage);
  const signature = await getCircleAttestation(circleMessageHash);

  return [circleMessage, signature];
}

// const USDC_CHAINS = CHAINS.filter(
//   (c) => c.id === CHAIN_ID_ETH || c.id === CHAIN_ID_AVAX
// );

const USDC_DECIMALS = 6;
const USDC_ADDRESSES: { [key in ChainId]?: string } = {
  [CHAIN_ID_ETH]: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
  [CHAIN_ID_AVAX]: "0x5425890298aed601595a70AB815c96711a31Bc65",
};
const CIRCLE_BRIDGE_ADDRESSES: { [key in ChainId]?: string } = {
  [CHAIN_ID_ETH]: "0xdAbec94B97F7b5FCA28f050cC8EeAc2Dc9920476",
  [CHAIN_ID_AVAX]: "0x0fC1103927AF27aF808D03135214718bCEDbE9ad",
};
const CIRCLE_EMITTER_ADDRESSES: { [key in ChainId]?: string } = {
  [CHAIN_ID_ETH]: "0x40A61D3D2AfcF5A5d31FcDf269e575fB99dd87f7",
  [CHAIN_ID_AVAX]: "0x52FfFb3EE8Fa7838e9858A2D5e454007b9027c3C",
};
const CIRCLE_DOMAINS: { [key in ChainId]?: number } = {
  [CHAIN_ID_ETH]: 0,
  [CHAIN_ID_AVAX]: 1,
};
const CIRCLE_DOMAIN_TO_WORMHOLE_CHAIN: { [key in number]: ChainId } = {
  0: CHAIN_ID_ETH,
  1: CHAIN_ID_AVAX,
};
const USDC_RELAYER: { [key in ChainId]?: string } = {
  [CHAIN_ID_ETH]: "0x2dacca34c172687efa15243a179ea9e170864a67",
  [CHAIN_ID_AVAX]: "0x7b135d7959e59ba45c55ae08c14920b06f2658ec",
};
const USDC_WH_INTEGRATION: { [key in ChainId]?: string } = {
  [CHAIN_ID_ETH]: "0xbdcc4ebe3157df347671e078a41ee5ce137cd306",
  [CHAIN_ID_AVAX]: "0xb200977d46aea35ce6368d181534f413570a0f54",
};
const USDC_WH_EMITTER: { [key in ChainId]?: string } = {
  [CHAIN_ID_ETH]: getEmitterAddressEth(USDC_WH_INTEGRATION[CHAIN_ID_ETH] || ""),
  [CHAIN_ID_AVAX]: getEmitterAddressEth(
    USDC_WH_INTEGRATION[CHAIN_ID_AVAX] || ""
  ),
};

function USDC() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const sourceChain = useSelector(selectSourceChain);
  const targetChain = useSelector(selectTargetChain);
  const sourceContract = CIRCLE_BRIDGE_ADDRESSES[sourceChain];
  const sourceRelayContract = USDC_RELAYER[sourceChain];
  const sourceRelayEmitter = USDC_WH_EMITTER[sourceChain];
  const sourceAsset = USDC_ADDRESSES[sourceChain];
  const targetContract = CIRCLE_EMITTER_ADDRESSES[targetChain];
  const targetRelayContract = USDC_RELAYER[targetChain];
  const targetCircleIntegrationContract = USDC_WH_INTEGRATION[targetChain];
  const targetAsset = USDC_ADDRESSES[targetChain];
  const balance = useSelector(selectBalance);
  const relayerFee = useSelector(selectRelayerFee);
  const maxSwapAmount = useSelector(selectMaxSwapAmount);
  const estimatedSwapAmount = useSelector(selectEstimatedSwapAmount);
  const amount = useSelector(selectAmount);
  const baseAmountParsed = amount && parseUnits(amount, USDC_DECIMALS);
  const transferAmountParsed = baseAmountParsed && baseAmountParsed.toBigInt();
  const humanReadableTransferAmount =
    transferAmountParsed && formatUnits(transferAmountParsed, USDC_DECIMALS);
  const oneParsed = parseUnits("1", USDC_DECIMALS).toBigInt();
  let bigIntBalance = BigInt(0);
  try {
    bigIntBalance = BigInt(balance?.amount || "0");
  } catch (e) {}
  const shouldRelay = useSelector(selectShouldRelay);
  const toNativeAmount = useSelector(selectToNativeAmount);
  const [debouncedToNativeAmount] = useDebounce(toNativeAmount, 500);
  const amountError =
    transferAmountParsed !== "" && transferAmountParsed <= BigInt(0)
      ? "Amount must be greater than zero"
      : transferAmountParsed > bigIntBalance
      ? "Amount must not be greater than balance"
      : shouldRelay && relayerFee && transferAmountParsed < BigInt(relayerFee)
      ? "Amount must at least cover the relayer fee"
      : shouldRelay &&
        relayerFee &&
        toNativeAmount &&
        transferAmountParsed < BigInt(relayerFee) + BigInt(toNativeAmount)
      ? "Amount must at least cover the relayer fee and swap amount"
      : "";
  const isSending = useSelector(selectIsSending);
  const sourceTxHash = useSelector(selectSourceTxHash);
  const sourceTxConfirmed = useSelector(selectSourceTxConfirmed);
  const transferInfo = useSelector(selectTransferInfo);
  const isSendComplete = transferInfo !== null;
  const isRedeeming = useSelector(selectIsRedeeming);
  const isRedeemComplete = useSelector(selectIsRedeemComplete);
  const targetTxHash = useSelector(selectTargetTxHash);
  const vaa = transferInfo && transferInfo.vaaHex;
  const { isReady, statusMessage } = useIsWalletReady(
    transferInfo ? targetChain : sourceChain
  );
  const { signer, signerAddress } = useEthereumProvider();
  const shouldLockFields =
    isSending || isSendComplete || isRedeeming || isRedeemComplete;
  const preventNavigation =
    (isSending || isSendComplete || isRedeeming) && !isRedeemComplete;

  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const pathSourceChain = query.get("sourceChain");
  const pathTargetChain = query.get("targetChain");
  const handleSwitch = useCallback(() => {
    dispatch(setSourceChain(targetChain));
    dispatch(setTargetChain(sourceChain));
  }, [sourceChain, targetChain, dispatch]);
  const handleToggleRelay = useCallback(() => {
    dispatch(setShouldRelay(!shouldRelay));
  }, [shouldRelay, dispatch]);
  const handleSliderChange = useCallback(
    (event, value) => {
      dispatch(
        setToNativeAmount(
          parseUnits(value.toString(), USDC_DECIMALS).toString()
        )
      );
    },
    [dispatch]
  );
  //This effect initializes the state based on the path params
  useEffect(() => {
    if (!pathSourceChain && !pathTargetChain) {
      return;
    }
    try {
      const parsedSourceChain: ChainId =
        CHAINS_BY_ID[parseInt(pathSourceChain || "") as ChainId]?.id;
      const parsedTargetChain: ChainId =
        CHAINS_BY_ID[parseInt(pathTargetChain || "") as ChainId]?.id;

      if (parsedSourceChain === parsedTargetChain) {
        return;
      }
      if (parsedSourceChain) {
        dispatch(setSourceChain(parsedSourceChain));
      }
      if (parsedTargetChain) {
        dispatch(setTargetChain(parsedTargetChain));
      }
    } catch (e) {
      console.error("Invalid path params specified.");
    }
  }, [pathSourceChain, pathTargetChain, dispatch]);
  //This effect fetches the source USDC balance for the connected wallet
  useEffect(() => {
    dispatch(setBalance(null));
    if (!sourceAsset) return;
    if (!signerAddress) return;
    const sourceEVMChain = getEvmChainId(sourceChain);
    if (!sourceEVMChain) return;
    const sourceRPC = EVM_RPC_MAP[sourceEVMChain];
    if (!sourceRPC) return;
    const provider = new ethers.providers.JsonRpcProvider(sourceRPC);
    let cancelled = false;
    (async () => {
      const token = await getEthereumToken(sourceAsset, provider);
      if (cancelled) return;
      const parsedTokenAccount = await ethTokenToParsedTokenAccount(
        token,
        signerAddress
      );
      if (cancelled) return;
      dispatch(setBalance(parsedTokenAccount));
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, sourceAsset, signerAddress, sourceChain]);
  //This effect fetches the relayer fee for the destination chain (from the source chain, which will be encoded into the transfer)
  useEffect(() => {
    dispatch(setRelayerFee(null));
    if (!sourceRelayContract) return;
    if (!sourceAsset) return;
    const sourceEVMChain = getEvmChainId(sourceChain);
    if (!sourceEVMChain) return;
    const sourceRPC = EVM_RPC_MAP[sourceEVMChain];
    if (!sourceRPC) return;
    const provider = new ethers.providers.JsonRpcProvider(sourceRPC);
    let cancelled = false;
    (async () => {
      const contract = new Contract(
        sourceRelayContract,
        [
          `function relayerFee(uint16 chainId_, address token) external view returns (uint256)`,
        ],
        provider
      );
      const fee = await contract.relayerFee(targetChain, sourceAsset);
      if (cancelled) return;
      dispatch(setRelayerFee(fee.toString()));
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, sourceRelayContract, sourceAsset, targetChain, sourceChain]);
  //This effect fetches the maximum swap amount from the destination chain
  useEffect(() => {
    dispatch(setMaxSwapAmount(null));
    if (!targetRelayContract) return;
    if (!targetAsset) return;
    const targetEVMChain = getEvmChainId(targetChain);
    if (!targetEVMChain) return;
    const targetRPC = EVM_RPC_MAP[targetEVMChain];
    if (!targetRPC) return;
    const provider = new ethers.providers.JsonRpcProvider(targetRPC);
    let cancelled = false;
    (async () => {
      const contract = new Contract(
        targetRelayContract,
        [
          `function calculateMaxSwapAmountIn(
              address token
          ) external view returns (uint256)`,
        ],
        provider
      );
      const maxSwap = await contract.calculateMaxSwapAmountIn(targetAsset);
      if (cancelled) return;
      dispatch(setMaxSwapAmount(maxSwap.toString()));
    })();
    return () => {
      cancelled = true;
    };
  }, [targetRelayContract, targetAsset, targetChain, dispatch]);
  //This effect fetches the estimated swap amount from the destination chain
  useEffect(() => {
    dispatch(setEstimatedSwapAmount(null));
    if (!targetRelayContract) return;
    if (!targetAsset) return;
    const targetEVMChain = getEvmChainId(targetChain);
    if (!targetEVMChain) return;
    const targetRPC = EVM_RPC_MAP[targetEVMChain];
    if (!targetRPC) return;
    const provider = new ethers.providers.JsonRpcProvider(targetRPC);
    let cancelled = false;
    (async () => {
      const contract = new Contract(
        targetRelayContract,
        [
          `function calculateNativeSwapAmountOut(
            address token,
            uint256 toNativeAmount
        ) external view returns (uint256)`,
        ],
        provider
      );
      const estimatedSwap = await contract.calculateNativeSwapAmountOut(
        targetAsset,
        debouncedToNativeAmount
      );
      if (cancelled) return;
      dispatch(setEstimatedSwapAmount(estimatedSwap.toString()));
    })();
    return () => {
      cancelled = true;
    };
  }, [
    targetRelayContract,
    targetAsset,
    targetChain,
    debouncedToNativeAmount,
    dispatch,
  ]);
  //This effect polls to see if the transaction has been redeemed when relaying
  useEffect(() => {
    if (!shouldRelay) return;
    if (!isSendComplete) return;
    if (!vaa) return;
    if (!targetCircleIntegrationContract) return;
    if (!isReady) return;
    if (!signer) return;
    const hash = hexlify(keccak256(parseVaa(arrayify(vaa)).hash));
    let cancelled = false;
    (async () => {
      let wasRedeemed = false;
      while (!wasRedeemed && !cancelled) {
        try {
          const contract = new Contract(
            targetCircleIntegrationContract,
            [
              `function isMessageConsumed(bytes32 hash) external view returns (bool)`,
            ],
            signer
          );
          wasRedeemed = await contract.isMessageConsumed(hash);
          if (!wasRedeemed) await sleep(5000);
        } catch (e) {
          console.error(
            "An error occurred while checking if the message was consumed",
            e
          );
        }
      }
      if (!cancelled) {
        dispatch(setIsRedeemComplete(wasRedeemed));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    shouldRelay,
    isSendComplete,
    vaa,
    targetCircleIntegrationContract,
    isReady,
    signer,
    dispatch,
  ]);
  const handleAmountChange = useCallback(
    (event) => {
      dispatch(setAmount(event.target.value));
    },
    [dispatch]
  );
  const handleMaxClick = useCallback(() => {
    if (balance && balance.uiAmountString) {
      dispatch(setAmount(balance.uiAmountString));
    }
  }, [balance, dispatch]);

  const allowanceError = useSelector(selectAllowanceError);
  const shouldApproveUnlimited = useSelector(selectShouldApproveUnlimited);
  // const toggleShouldApproveUnlimited = useCallback(
  //   () => setShouldApproveUnlimited(!shouldApproveUnlimited),
  //   [shouldApproveUnlimited]
  // );
  const {
    sufficientAllowance,
    isAllowanceFetching,
    isApproveProcessing,
    approveAmount,
  } = useAllowance(
    sourceChain,
    sourceAsset,
    transferAmountParsed || undefined,
    false,
    shouldRelay ? sourceRelayContract : sourceContract
  );

  const approveButtonNeeded = isEVMChain(sourceChain) && !sufficientAllowance;
  const notOne = shouldApproveUnlimited || transferAmountParsed !== oneParsed;
  const isApproveDisabled =
    !isReady ||
    !amount ||
    !!amountError ||
    isAllowanceFetching ||
    isApproveProcessing;
  const errorMessage = statusMessage || allowanceError || undefined;
  const approveExactAmount = useMemo(() => {
    return () => {
      dispatch(setAllowanceError(""));
      approveAmount(BigInt(transferAmountParsed)).then(
        () => {
          dispatch(setAllowanceError(""));
          enqueueSnackbar(null, {
            content: (
              <Alert severity="success">Approval transaction confirmed</Alert>
            ),
          });
        },
        (error) =>
          dispatch(setAllowanceError("Failed to approve the token transfer."))
      );
    };
  }, [approveAmount, transferAmountParsed, enqueueSnackbar, dispatch]);
  const approveUnlimited = useMemo(() => {
    return () => {
      dispatch(setAllowanceError(""));
      approveAmount(constants.MaxUint256.toBigInt()).then(
        () => {
          dispatch(setAllowanceError(""));
          enqueueSnackbar(null, {
            content: (
              <Alert severity="success">Approval transaction confirmed</Alert>
            ),
          });
        },
        (error) =>
          dispatch(setAllowanceError("Failed to approve the token transfer."))
      );
    };
  }, [approveAmount, enqueueSnackbar, dispatch]);

  const handleTransferClick = useCallback(() => {
    if (!isReady) return;
    if (!signer) return;
    if (!signerAddress) return;
    if (!sourceContract) return;
    if (!sourceAsset) return;
    const sourceEmitter = CIRCLE_EMITTER_ADDRESSES[sourceChain];
    if (!sourceEmitter) return;
    const targetDomain = CIRCLE_DOMAINS[targetChain];
    if (targetDomain === undefined) return;
    if (!transferAmountParsed) return;
    if (shouldRelay) {
      if (!sourceRelayContract) return;
      if (!sourceRelayEmitter) return;
      const contract = new Contract(
        sourceRelayContract,
        [
          `function transferTokensWithRelay(
          address token,
          uint256 amount,
          uint256 toNativeTokenAmount,
          uint16 targetChain,
          bytes32 targetRecipientWallet
        ) external payable returns (uint64 messageSequence)`,
        ],
        signer
      );
      dispatch(setIsSending(true));
      (async () => {
        try {
          const tx = await contract.transferTokensWithRelay(
            sourceAsset,
            transferAmountParsed,
            toNativeAmount,
            targetChain,
            hexZeroPad(signerAddress, 32)
          );
          dispatch(setSourceTxHash(tx.hash));
          const receipt = await tx.wait();
          dispatch(setSourceTxConfirmed(true));
          // recovery test
          // const hash =
          //   "0xa73642c06cdcce5882c208885481b4433c0abf8a4128889ff1996865a06af90d";
          // setSourceTxHash(hash);
          // const receipt = await signer.provider?.getTransactionReceipt(hash);
          // setSourceTxConfirmed(true);
          if (!receipt) {
            throw new Error("Invalid receipt");
          }
          enqueueSnackbar(null, {
            content: (
              <Alert severity="success">Transfer transaction confirmed</Alert>
            ),
          });
          // find circle message
          const [circleBridgeMessage, circleAttestation] =
            await handleCircleMessageInLogs(receipt.logs, sourceEmitter);
          if (circleBridgeMessage === null || circleAttestation === null) {
            throw new Error(`Error parsing receipt for ${tx.hash}`);
          }
          enqueueSnackbar(null, {
            content: <Alert severity="success">Circle attestation found</Alert>,
          });
          // find wormhole message
          const seq = parseSequenceFromLogEth(
            receipt,
            getBridgeAddressForChain(sourceChain)
          );
          const { vaaBytes } = await getSignedVAAWithRetry(
            WORMHOLE_RPC_HOSTS,
            sourceChain,
            sourceRelayEmitter,
            seq
          );
          // TODO: more discreet state for better loading messages
          dispatch(
            setTransferInfo({
              vaaHex: `0x${uint8ArrayToHex(vaaBytes)}`,
              circleBridgeMessage,
              circleAttestation,
            })
          );
          enqueueSnackbar(null, {
            content: <Alert severity="success">Wormhole message found</Alert>,
          });
        } catch (e) {
          console.error(e);
          enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
          });
        }
        dispatch(setIsSending(false));
      })();
    } else {
      const contract = new Contract(
        sourceContract,
        [
          "function depositForBurn(uint256 _amount, uint32 _destinationDomain, bytes32 _mintRecipient, address _burnToken) external returns (uint64 _nonce)",
        ],
        signer
      );
      dispatch(setIsSending(true));
      (async () => {
        try {
          const tx = await contract.depositForBurn(
            transferAmountParsed,
            targetDomain,
            hexZeroPad(signerAddress, 32),
            sourceAsset
          );
          dispatch(setSourceTxHash(tx.hash));
          const receipt = await tx.wait();
          dispatch(setSourceTxConfirmed(true));
          // const receipt = await signer.provider?.getTransactionReceipt(
          //   "0x5772e912b4febaff4245472efe1c4a5d6bab663e20a66876c08fac376e3b1a60"
          // );
          if (!receipt) {
            throw new Error("Invalid receipt");
          }
          enqueueSnackbar(null, {
            content: (
              <Alert severity="success">Transfer transaction confirmed</Alert>
            ),
          });
          // find circle message
          const [circleBridgeMessage, circleAttestation] =
            await handleCircleMessageInLogs(receipt.logs, sourceEmitter);
          if (circleBridgeMessage === null || circleAttestation === null) {
            throw new Error(`Error parsing receipt for ${tx.hash}`);
          }
          dispatch(
            setTransferInfo({
              vaaHex: null,
              circleBridgeMessage,
              circleAttestation,
            })
          );
          enqueueSnackbar(null, {
            content: <Alert severity="success">Circle attestation found</Alert>,
          });
        } catch (e) {
          console.error(e);
          enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
          });
        }
        dispatch(setIsSending(false));
      })();
    }
  }, [
    isReady,
    signer,
    signerAddress,
    sourceContract,
    sourceAsset,
    sourceChain,
    targetChain,
    transferAmountParsed,
    shouldRelay,
    sourceRelayContract,
    sourceRelayEmitter,
    toNativeAmount,
    enqueueSnackbar,
    dispatch,
  ]);

  const handleRedeemClick = useCallback(() => {
    if (!isReady) return;
    if (!signer) return;
    if (!signerAddress) return;
    if (!targetContract) return;
    if (!transferInfo) return;
    if (shouldRelay) {
      if (!targetRelayContract) return;
      if (!vaa) return;
      dispatch(setIsRedeeming(true));
      (async () => {
        try {
          // adapted from https://github.com/wormhole-foundation/example-circle-relayer/blob/c488fe61c528b6099a90f01f42e796df7f330485/relayer/src/main.ts
          const contract = new Contract(
            targetRelayContract,
            [
              `function calculateNativeSwapAmountOut(
                address token,
                uint256 toNativeAmount
                ) external view returns (uint256)`,
              `function redeemTokens((bytes,bytes,bytes)) external payable`,
            ],
            signer
          );
          const payloadArray = parseVaa(arrayify(vaa)).payload;
          // parse the domain into a chain
          const toDomain = payloadArray.readUInt32BE(69);
          if (!(toDomain in CIRCLE_DOMAIN_TO_WORMHOLE_CHAIN)) {
            console.warn(`Unknown toDomain ${toDomain}`);
          }
          const toChain = CIRCLE_DOMAIN_TO_WORMHOLE_CHAIN[toDomain];
          // parse the token address and toNativeAmount
          const token = tryUint8ArrayToNative(
            payloadArray.subarray(1, 33),
            toChain
          );
          const toNativeAmount = ethers.utils.hexlify(
            payloadArray.subarray(180, 212)
          );
          const nativeSwapQuote = await contract.calculateNativeSwapAmountOut(
            token,
            toNativeAmount
          );
          const tx = await contract.redeemTokens(
            [
              transferInfo.vaaHex,
              transferInfo.circleBridgeMessage,
              transferInfo.circleAttestation,
            ],
            {
              value: nativeSwapQuote,
            }
          );
          dispatch(setTargetTxHash(tx.hash));
          const receipt = await tx.wait();
          if (!receipt) {
            throw new Error("Invalid receipt");
          }
          dispatch(setIsRedeemComplete(true));
          enqueueSnackbar(null, {
            content: (
              <Alert severity="success">Redeem transaction confirmed</Alert>
            ),
          });
        } catch (e) {
          console.error(e);
          enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
          });
        }
        dispatch(setIsRedeeming(false));
      })();
    } else {
      dispatch(setIsRedeeming(true));
      (async () => {
        try {
          const contract = new Contract(
            targetContract,
            [
              "function receiveMessage(bytes memory _message, bytes calldata _attestation) external returns (bool success)",
            ],
            signer
          );
          const tx = await contract.receiveMessage(
            transferInfo.circleBridgeMessage,
            transferInfo.circleAttestation
          );
          dispatch(setTargetTxHash(tx.hash));
          const receipt = await tx.wait();
          if (!receipt) {
            throw new Error("Invalid receipt");
          }
          dispatch(setIsRedeemComplete(true));
          enqueueSnackbar(null, {
            content: (
              <Alert severity="success">Redeem transaction confirmed</Alert>
            ),
          });
        } catch (e) {
          console.error(e);
          enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
          });
        }
        dispatch(setIsRedeeming(false));
      })();
    }
  }, [
    isReady,
    signer,
    signerAddress,
    transferInfo,
    targetContract,
    shouldRelay,
    targetRelayContract,
    vaa,
    enqueueSnackbar,
    dispatch,
  ]);

  useEffect(() => {
    if (preventNavigation) {
      window.onbeforeunload = () => true;
      return () => {
        window.onbeforeunload = null;
      };
    }
  }, [preventNavigation]);
  return (
    <>
      <Container maxWidth="md" style={{ paddingBottom: 24 }}>
        <HeaderText
          white
          subtitle={
            <>
              <Typography gutterBottom>
                This is a developmental USDC bridge that tests transfers across
                chains using the Circle bridge.
              </Typography>
              <Typography className={classes.header}>
                <img src={usdcLogo} alt="USDC" />
                <span role="img">&#129309;</span>
                <img src={wormholeLogo} alt="Wormhole" />
              </Typography>
            </>
          }
        >
          USDC Bridge
        </HeaderText>
      </Container>
      <Container maxWidth="xs">
        <KeyAndBalance chainId={sourceChain} />
        <div className={classes.chainSelectWrapper}>
          <div className={classes.chainSelectContainer}>
            <img
              src={CHAINS_BY_ID[sourceChain].logo}
              alt={CHAINS_BY_ID[sourceChain].name}
              className={classes.chainLogo}
            />
            <Typography>Source</Typography>
          </div>
          <div className={classes.chainSelectArrow}>
            <ChainSelectArrow
              onClick={handleSwitch}
              disabled={shouldLockFields}
            />
          </div>
          <div className={classes.chainSelectContainer}>
            <img
              src={CHAINS_BY_ID[targetChain].logo}
              alt={CHAINS_BY_ID[targetChain].name}
              className={classes.chainLogo}
            />
            <Typography>Target</Typography>
          </div>
        </div>
        <NumberTextField
          variant="outlined"
          label="Amount (USDC)"
          fullWidth
          className={classes.transferField}
          value={amount}
          onChange={handleAmountChange}
          disabled={shouldLockFields}
          onMaxClick={
            balance && balance.uiAmountString ? handleMaxClick : undefined
          }
        />
        <div className={classes.infoContainer}>
          <Typography variant="body2" style={{ flexGrow: 1 }}>
            Source Balance
          </Typography>
          <Typography variant="body2">
            {balance?.uiAmountString || 0} USDC
          </Typography>
        </div>
        {/* TODO: destination balance */}
        <FormGroup className={classes.toggle}>
          <FormControlLabel
            disabled={shouldLockFields}
            control={
              <Switch
                value={shouldRelay}
                onChange={handleToggleRelay}
                color="primary"
              />
            }
            label="Use relayer"
          />
        </FormGroup>
        <div className={classes.infoContainer}>
          <Typography
            variant="body2"
            style={{ flexGrow: 1 }}
            color={shouldRelay ? "textPrimary" : "textSecondary"}
          >
            Relayer Fee
          </Typography>
          <Typography
            variant="body2"
            color={shouldRelay ? "textPrimary" : "textSecondary"}
          >
            {(relayerFee && `${formatUnits(relayerFee, USDC_DECIMALS)} USDC`) ||
              null}
          </Typography>
        </div>
        <div className={classes.infoContainer}>
          <Typography
            variant="body2"
            style={{ flexGrow: 1 }}
            color={shouldRelay ? "textPrimary" : "textSecondary"}
          >
            Destination Gas
          </Typography>
          <Typography
            variant="body2"
            color={shouldRelay ? "textPrimary" : "textSecondary"}
          >
            {formatUnits(toNativeAmount, USDC_DECIMALS)} USDC
          </Typography>
        </div>
        {/* TODO: enforce max */}
        <div className={classes.sliderContainer}>
          <Slider
            disabled={!shouldRelay || shouldLockFields}
            onChange={handleSliderChange}
            value={Number(formatUnits(toNativeAmount, USDC_DECIMALS))}
            step={0.001}
            min={0}
            max={Number(formatUnits(maxSwapAmount || 0, USDC_DECIMALS))}
            valueLabelDisplay="off"
          />
        </div>
        <div className={classes.infoContainer}>
          <Typography
            variant="body2"
            style={{ flexGrow: 1 }}
            color={shouldRelay ? "textPrimary" : "textSecondary"}
          >
            Maximum Destination Gas
          </Typography>
          <Typography
            variant="body2"
            color={shouldRelay ? "textPrimary" : "textSecondary"}
          >
            {(maxSwapAmount &&
              `${formatUnits(maxSwapAmount, USDC_DECIMALS)} USDC`) ||
              null}
          </Typography>
        </div>
        <div className={classes.infoContainer}>
          <Typography
            variant="body2"
            style={{ flexGrow: 1 }}
            color={shouldRelay ? "textPrimary" : "textSecondary"}
          >
            Estimated Destination Gas
          </Typography>
          <Typography
            variant="body2"
            color={shouldRelay ? "textPrimary" : "textSecondary"}
          >
            {(estimatedSwapAmount &&
              `${formatUnits(
                estimatedSwapAmount,
                METAMASK_CHAIN_PARAMETERS[getEvmChainId(targetChain) || 1]
                  ?.nativeCurrency.decimals || 18
              )} ${
                METAMASK_CHAIN_PARAMETERS[getEvmChainId(targetChain) || 1]
                  ?.nativeCurrency.symbol || "ETH"
              }`) ||
              null}
          </Typography>
        </div>
        {transferInfo ? (
          <ButtonWithLoader
            disabled={!isReady || isRedeeming || isRedeemComplete}
            onClick={handleRedeemClick}
            showLoader={isRedeeming}
            error={statusMessage}
          >
            Redeem
          </ButtonWithLoader>
        ) : approveButtonNeeded ? (
          <>
            {/* <FormControlLabel
            control={
              <Checkbox
                checked={shouldApproveUnlimited}
                onChange={toggleShouldApproveUnlimited}
                color="primary"
              />
            }
            label="Approve Unlimited Tokens"
          /> */}
            <ButtonWithLoader
              disabled={isApproveDisabled}
              onClick={
                shouldApproveUnlimited ? approveUnlimited : approveExactAmount
              }
              showLoader={isAllowanceFetching || isApproveProcessing}
              error={errorMessage || amountError}
            >
              {"Approve " +
                (shouldApproveUnlimited
                  ? "Unlimited"
                  : humanReadableTransferAmount
                  ? humanReadableTransferAmount
                  : amount) +
                ` Token${notOne ? "s" : ""}`}
            </ButtonWithLoader>
          </>
        ) : (
          <ButtonWithLoader
            disabled={!isReady || isSending}
            onClick={handleTransferClick}
            showLoader={isSending}
            error={statusMessage || amountError}
          >
            Transfer
          </ButtonWithLoader>
        )}
        {!statusMessage && !amountError ? (
          <Typography variant="body2" className={classes.message}>
            {isApproveProcessing ? (
              "Waiting for wallet approval and confirmation..."
            ) : isSending ? (
              !sourceTxHash ? (
                "Waiting for wallet approval..."
              ) : !sourceTxConfirmed ? (
                "Waiting for tx confirmation..."
              ) : (
                "Waiting for Circle attestation..."
              )
            ) : isRedeeming ? (
              !targetTxHash ? (
                "Waiting for wallet approval..."
              ) : (
                "Waiting for tx confirmation..."
              )
            ) : (
              <>&nbsp;</>
            )}
          </Typography>
        ) : null}
        <div className={classes.stepperContainer}>
          <Stepper
            activeStep={
              isRedeemComplete
                ? 3
                : transferInfo
                ? 2
                : approveButtonNeeded
                ? 0
                : 1
            }
            alternativeLabel
          >
            <Step>
              <StepLabel>Approve</StepLabel>
            </Step>
            <Step>
              <StepLabel>Transfer</StepLabel>
            </Step>
            <Step>
              <StepLabel>Redeem</StepLabel>
            </Step>
          </Stepper>
        </div>
      </Container>
    </>
  );
}
export default USDC;
