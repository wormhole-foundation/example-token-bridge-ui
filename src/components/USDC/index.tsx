import {
  ChainId,
  CHAIN_ID_AVAX,
  CHAIN_ID_ETH,
  isEVMChain,
} from "@certusone/wormhole-sdk";
import { Container, makeStyles, Typography } from "@material-ui/core";
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

const useStyles = makeStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    "& > img": {
      height: 64,
      maxWidth: 64,
      margin: "0 16px",
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
  // TODO: move to state with safety for switching
  const [{ sourceChain, targetChain }, setState] = useState<State>({
    sourceChain: CHAIN_ID_ETH,
    targetChain: CHAIN_ID_AVAX,
  });
  const sourceContract = CIRCLE_BRIDGE_ADDRESSES[sourceChain];
  const sourceAsset = USDC_ADDRESSES[sourceChain];
  const targetContract = CIRCLE_EMITTER_ADDRESSES[targetChain];
  const [amount, setAmount] = useState<string>("0");
  const baseAmountParsed = amount && parseUnits(amount, USDC_DECIMALS);
  const transferAmountParsed = baseAmountParsed && baseAmountParsed.toBigInt();
  const humanReadableTransferAmount =
    transferAmountParsed && formatUnits(transferAmountParsed, USDC_DECIMALS);
  const oneParsed = parseUnits("1", USDC_DECIMALS).toBigInt();

  const [transferInfo, setTransferInfo] = useState<null | [string, string]>(
    null
  );

  const { isReady, statusMessage } = useIsWalletReady(
    transferInfo ? targetChain : sourceChain
  );
  const { signer, signerAddress } = useEthereumProvider();
  const preventNavigation = false;
  // (isSending || isSendComplete || isRedeeming) && !isRedeemComplete;

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
  const isDisabled = !isReady || isAllowanceFetching || isApproveProcessing;
  const errorMessage = statusMessage || allowanceError || undefined;
  const approveExactAmount = useMemo(() => {
    return () => {
      setAllowanceError("");
      approveAmount(BigInt(transferAmountParsed)).then(
        () => {
          setAllowanceError("");
        },
        (error) => setAllowanceError("Failed to approve the token transfer.")
      );
    };
  }, [approveAmount, transferAmountParsed]);
  const approveUnlimited = useMemo(() => {
    return () => {
      setAllowanceError("");
      approveAmount(constants.MaxUint256.toBigInt()).then(
        () => {
          setAllowanceError("");
        },
        (error) => setAllowanceError("Failed to approve the token transfer.")
      );
    };
  }, [approveAmount]);

  const handleTransferClick = useCallback(() => {
    if (!isReady) return;
    if (!signer) return;
    if (!signerAddress) return;
    if (!sourceContract) return;
    if (!sourceAsset) return;
    const sourceEmitter = CIRCLE_EMITTER_ADDRESSES[sourceChain];
    if (!sourceEmitter) return;
    const targetDomain = CIRCLE_DOMAINS[targetChain];
    if (!targetDomain) return;
    if (!transferAmountParsed) return;
    const contract = new Contract(
      sourceContract,
      [
        "function depositForBurn(uint256 _amount, uint32 _destinationDomain, bytes32 _mintRecipient, address _burnToken) external returns (uint64 _nonce)",
      ],
      signer
    );
    (async () => {
      const tx = await contract.depositForBurn(
        transferAmountParsed,
        targetDomain,
        hexZeroPad(signerAddress, 32),
        sourceAsset
      );
      console.log(tx.hash);
      const receipt = await tx.wait();
      // const receipt = await signer.provider?.getTransactionReceipt(
      //   "0x99087811e5dda33de54fdcfe3c5f541ede7f45d845d1f4880cbb1e6654fbcbb8"
      // );
      if (!receipt) return;
      // find circle message
      const [circleBridgeMessage, circleAttestation] =
        await handleCircleMessageInLogs(receipt.logs, sourceEmitter);
      if (circleBridgeMessage === null || circleAttestation === null) {
        console.error("error parsing receipt", receipt);
        return;
      }
      setTransferInfo([circleBridgeMessage, circleAttestation]);
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
  ]);

  const shouldLockFields = false;

  const handleRedeemClick = useCallback(() => {
    if (!isReady) return;
    if (!signer) return;
    if (!signerAddress) return;
    if (!targetContract) return;
    if (!transferInfo) return;
    const contract = new Contract(
      targetContract,
      [
        "function receiveMessage(bytes memory _message, bytes calldata _attestation) external returns (bool success)",
      ],
      signer
    );
    contract.receiveMessage(transferInfo[0], transferInfo[1]);
  }, [isReady, signer, signerAddress, transferInfo, targetContract]);

  useEffect(() => {
    if (preventNavigation) {
      window.onbeforeunload = () => true;
      return () => {
        window.onbeforeunload = null;
      };
    }
  }, [preventNavigation]);
  return (
    <Container maxWidth="xs">
      <Typography variant="h1" className={classes.header}>
        <img src={usdcLogo} alt="USDC" />
        <span role="img">&#129309;</span>
        <img src={wormholeLogo} alt="Wormhole" />
      </Typography>
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
        label="Amount"
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
          disabled={false}
          onClick={handleRedeemClick}
          showLoader={false}
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
            disabled={isDisabled}
            onClick={
              shouldApproveUnlimited ? approveUnlimited : approveExactAmount
            }
            showLoader={isAllowanceFetching || isApproveProcessing}
            error={errorMessage}
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
          disabled={false}
          onClick={handleTransferClick}
          showLoader={false}
          error={statusMessage}
        >
          Transfer
        </ButtonWithLoader>
      )}
    </Container>
  );
}
export default USDC;
