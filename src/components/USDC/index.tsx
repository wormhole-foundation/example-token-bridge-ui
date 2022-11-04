import {
  ChainId,
  CHAIN_ID_AVAX,
  CHAIN_ID_ETH,
  isEVMChain,
} from "@certusone/wormhole-sdk";
import {
  Container,
  makeStyles,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@material-ui/core";
import axios, { AxiosResponse } from "axios";
import { constants, Contract, ethers } from "ethers";
import { formatUnits, hexZeroPad, parseUnits } from "ethers/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useEthereumProvider } from "../../contexts/EthereumProviderContext";
import useAllowance from "../../hooks/useAllowance";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import { CHAINS_BY_ID } from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelectArrow from "../ChainSelectArrow";
import KeyAndBalance from "../KeyAndBalance";
import NumberTextField from "../NumberTextField";
import usdcLogo from "../../icons/usdc.svg";
import wormholeLogo from "../../icons/wormhole.svg";
import { useSnackbar } from "notistack";
import { Alert } from "@material-ui/lab";
import parseError from "../../utils/parseError";
import HeaderText from "../HeaderText";

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

type State = {
  sourceChain: ChainId;
  targetChain: ChainId;
};

function USDC() {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  // TODO: move to state with safety for switching
  const [{ sourceChain, targetChain }, setState] = useState<State>({
    sourceChain: CHAIN_ID_ETH,
    targetChain: CHAIN_ID_AVAX,
  });
  const sourceContract = CIRCLE_BRIDGE_ADDRESSES[sourceChain];
  const sourceAsset = USDC_ADDRESSES[sourceChain];
  const targetContract = CIRCLE_EMITTER_ADDRESSES[targetChain];
  const [amount, setAmount] = useState<string>("");
  const baseAmountParsed = amount && parseUnits(amount, USDC_DECIMALS);
  const transferAmountParsed = baseAmountParsed && baseAmountParsed.toBigInt();
  const humanReadableTransferAmount =
    transferAmountParsed && formatUnits(transferAmountParsed, USDC_DECIMALS);
  const oneParsed = parseUnits("1", USDC_DECIMALS).toBigInt();
  const amountError =
    transferAmountParsed !== "" && transferAmountParsed <= BigInt(0)
      ? "Amount must be greater than zero"
      : "";
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sourceTxHash, setSourceTxHash] = useState<string>("");
  const [sourceTxConfirmed, setSourceTxConfirmed] = useState<boolean>(false);
  const [transferInfo, setTransferInfo] = useState<null | [string, string]>(
    null
  );
  const isSendComplete = transferInfo !== null;
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isRedeemComplete, setIsRedeemComplete] = useState<boolean>(false);
  const [targetTxHash, setTargetTxHash] = useState<string>("");

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
  // const handleSourceChange = useCallback((event) => {
  //   const v = event.target.value;
  //   setState((s) => ({
  //     ...s,
  //     sourceChain: v,
  //     targetChain: v === s.targetChain ? s.sourceChain : s.targetChain,
  //   }));
  // }, []);
  // const handleTargetChange = useCallback((event) => {
  //   const v = event.target.value;
  //   setState((s) => ({
  //     ...s,
  //     targetChain: v,
  //     sourceChain: v === s.targetChain ? s.targetChain : s.sourceChain,
  //   }));
  // }, []);
  const handleSwitch = useCallback(() => {
    setState((s) => ({
      ...s,
      sourceChain: s.targetChain,
      targetChain: s.sourceChain,
    }));
  }, []);
  //This effect initializes the state based on the path params
  useEffect(() => {
    if (!pathSourceChain && !pathTargetChain) {
      return;
    }
    try {
      const sourceChain: ChainId =
        CHAINS_BY_ID[parseFloat(pathSourceChain || "") as ChainId]?.id;
      const targetChain: ChainId =
        CHAINS_BY_ID[parseFloat(pathTargetChain || "") as ChainId]?.id;

      if (sourceChain === targetChain) {
        return;
      }
      if (sourceChain) {
        setState((s) => ({
          ...s,
          sourceChain,
          targetChain:
            sourceChain === s.targetChain ? s.sourceChain : s.targetChain,
        }));
      }
      if (targetChain) {
        setState((s) => ({
          ...s,
          targetChain,
          sourceChain:
            targetChain === s.targetChain ? s.targetChain : s.sourceChain,
        }));
      }
    } catch (e) {
      console.error("Invalid path params specified.");
    }
  }, [pathSourceChain, pathTargetChain]);

  const handleAmountChange = useCallback((event) => {
    setAmount(event.target.value);
  }, []);
  // const handleMaxClick = useCallback(() => {
  //   if (uiAmountString) {
  //     setAmount(uiAmountString);
  //   }
  // }, [uiAmountString]);

  const [allowanceError, setAllowanceError] = useState("");
  const [shouldApproveUnlimited, setShouldApproveUnlimited] = useState(false);
  const toggleShouldApproveUnlimited = useCallback(
    () => setShouldApproveUnlimited(!shouldApproveUnlimited),
    [shouldApproveUnlimited]
  );
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
    sourceContract
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
      setAllowanceError("");
      approveAmount(BigInt(transferAmountParsed)).then(
        () => {
          setAllowanceError("");
          enqueueSnackbar(null, {
            content: (
              <Alert severity="success">Approval transaction confirmed</Alert>
            ),
          });
        },
        (error) => setAllowanceError("Failed to approve the token transfer.")
      );
    };
  }, [approveAmount, transferAmountParsed, enqueueSnackbar]);
  const approveUnlimited = useMemo(() => {
    return () => {
      setAllowanceError("");
      approveAmount(constants.MaxUint256.toBigInt()).then(
        () => {
          setAllowanceError("");
          enqueueSnackbar(null, {
            content: (
              <Alert severity="success">Approval transaction confirmed</Alert>
            ),
          });
        },
        (error) => setAllowanceError("Failed to approve the token transfer.")
      );
    };
  }, [approveAmount, enqueueSnackbar]);

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
    const contract = new Contract(
      sourceContract,
      [
        "function depositForBurn(uint256 _amount, uint32 _destinationDomain, bytes32 _mintRecipient, address _burnToken) external returns (uint64 _nonce)",
      ],
      signer
    );
    setIsSending(true);
    (async () => {
      try {
        const tx = await contract.depositForBurn(
          transferAmountParsed,
          targetDomain,
          hexZeroPad(signerAddress, 32),
          sourceAsset
        );
        setSourceTxHash(tx.hash);
        const receipt = await tx.wait();
        setSourceTxConfirmed(true);
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
        setTransferInfo([circleBridgeMessage, circleAttestation]);
        enqueueSnackbar(null, {
          content: <Alert severity="success">Circle attestation found</Alert>,
        });
      } catch (e) {
        console.error(e);
        enqueueSnackbar(null, {
          content: <Alert severity="error">{parseError(e)}</Alert>,
        });
      }
      setIsSending(false);
    })();
  }, [
    isReady,
    signer,
    signerAddress,
    sourceContract,
    sourceAsset,
    sourceChain,
    targetChain,
    transferAmountParsed,
    enqueueSnackbar,
  ]);

  const handleRedeemClick = useCallback(() => {
    if (!isReady) return;
    if (!signer) return;
    if (!signerAddress) return;
    if (!targetContract) return;
    if (!transferInfo) return;
    setIsRedeeming(true);
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
          transferInfo[0],
          transferInfo[1]
        );
        setTargetTxHash(tx.hash);
        const receipt = await tx.wait();
        if (!receipt) {
          throw new Error("Invalid receipt");
        }
        setIsRedeemComplete(true);
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
      setIsRedeeming(false);
    })();
  }, [
    isReady,
    signer,
    signerAddress,
    transferInfo,
    targetContract,
    enqueueSnackbar,
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
          // onMaxClick={
          //   uiAmountString && !parsedTokenAccount.isNativeAsset
          //     ? handleMaxClick
          //     : undefined
          // }
        />
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
