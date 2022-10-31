import {
  CHAIN_ID_APTOS,
  CHAIN_ID_NEAR,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  getEmitterAddressNear,
  hexToNativeString,
  isEVMChain,
} from "@certusone/wormhole-sdk";
import { makeStyles, Typography } from "@material-ui/core";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNearContext } from "../../contexts/NearWalletContext";
import useGetTargetParsedTokenAccounts from "../../hooks/useGetTargetParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import useSyncTargetAddress from "../../hooks/useSyncTargetAddress";
import {
  selectTransferAmount,
  selectTransferIsTargetComplete,
  selectTransferShouldLockFields,
  selectTransferSourceChain,
  selectTransferTargetAddressHex,
  selectTransferTargetAsset,
  selectTransferTargetAssetWrapper,
  selectTransferTargetBalanceString,
  selectTransferTargetChain,
  selectTransferTargetError,
  selectTransferTargetParsedTokenAccount,
} from "../../store/selectors";
import { incrementStep, setTargetChain } from "../../store/transferSlice";
import { CHAINS } from "../../utils/consts";
import ButtonWithLoader from "../ButtonWithLoader";
import ChainSelect from "../ChainSelect";
import FeeMethodSelector from "../FeeMethodSelector";
import KeyAndBalance from "../KeyAndBalance";
import LowBalanceWarning from "../LowBalanceWarning";
import SmartAddress from "../SmartAddress";
import SolanaCreateAssociatedAddress, {
  useAssociatedAccountExistsState,
} from "../SolanaCreateAssociatedAddress";
import StepDescription from "../StepDescription";
import RegisterNowButton from "./RegisterNowButton";

const useStyles = makeStyles((theme) => ({
  transferField: {
    marginTop: theme.spacing(5),
  },
  alert: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

export const useTargetInfo = () => {
  const { accountId: nearAccountId } = useNearContext();
  const targetChain = useSelector(selectTransferTargetChain);
  const targetAddressHex = useSelector(selectTransferTargetAddressHex);
  const targetAsset = useSelector(selectTransferTargetAsset);
  const targetParsedTokenAccount = useSelector(
    selectTransferTargetParsedTokenAccount
  );
  const tokenName = targetParsedTokenAccount?.name;
  const symbol = targetParsedTokenAccount?.symbol;
  const logo = targetParsedTokenAccount?.logo;
  const readableTargetAddress =
    targetChain === CHAIN_ID_NEAR
      ? // Near uses a hashed address, which isn't very readable - check that the hash matches and show them their account id
        nearAccountId &&
        // this just happens to be the same hashing mechanism as emitters
        getEmitterAddressNear(nearAccountId) === targetAddressHex
        ? nearAccountId
        : targetAddressHex || ""
      : targetChain === CHAIN_ID_APTOS || targetChain === CHAIN_ID_SUI
      ? targetAddressHex
        ? `0x${targetAddressHex}`
        : ""
      : hexToNativeString(targetAddressHex, targetChain) || "";
  console.log(targetAddressHex);
  return useMemo(
    () => ({
      targetChain,
      targetAsset,
      tokenName,
      symbol,
      logo,
      readableTargetAddress,
    }),
    [targetChain, targetAsset, tokenName, symbol, logo, readableTargetAddress]
  );
};

function Target() {
  useGetTargetParsedTokenAccounts();
  const classes = useStyles();
  const dispatch = useDispatch();
  const sourceChain = useSelector(selectTransferSourceChain);
  const chains = useMemo(
    () => CHAINS.filter((c) => c.id !== sourceChain),
    [sourceChain]
  );
  const { error: targetAssetError, data } = useSelector(
    selectTransferTargetAssetWrapper
  );
  const {
    targetChain,
    targetAsset,
    tokenName,
    symbol,
    logo,
    readableTargetAddress,
  } = useTargetInfo();
  const uiAmountString = useSelector(selectTransferTargetBalanceString);
  const transferAmount = useSelector(selectTransferAmount);
  const error = useSelector(selectTransferTargetError);
  const isTargetComplete = useSelector(selectTransferIsTargetComplete);
  const shouldLockFields = useSelector(selectTransferShouldLockFields);
  const { statusMessage, isReady } = useIsWalletReady(targetChain);
  const isLoading = !statusMessage && !targetAssetError && !data;
  const { associatedAccountExists, setAssociatedAccountExists } =
    useAssociatedAccountExistsState(
      targetChain,
      targetAsset,
      readableTargetAddress
    );
  useSyncTargetAddress(!shouldLockFields);
  const handleTargetChange = useCallback(
    (event) => {
      dispatch(setTargetChain(event.target.value));
    },
    [dispatch]
  );
  const handleNextClick = useCallback(() => {
    dispatch(incrementStep());
  }, [dispatch]);
  return (
    <>
      <StepDescription>Select a recipient chain and address.</StepDescription>
      <ChainSelect
        variant="outlined"
        select
        fullWidth
        value={targetChain}
        onChange={handleTargetChange}
        disabled={true}
        chains={chains}
      />
      <KeyAndBalance chainId={targetChain} />
      {readableTargetAddress ? (
        <>
          {targetAsset ? (
            <div className={classes.transferField}>
              <Typography variant="subtitle2">Bridged tokens:</Typography>
              <Typography component="div">
                <SmartAddress
                  chainId={targetChain}
                  address={targetAsset}
                  symbol={symbol}
                  tokenName={tokenName}
                  logo={logo}
                  variant="h6"
                  isAsset
                />
                {`(Amount: ${transferAmount})`}
              </Typography>
            </div>
          ) : null}
          <div className={classes.transferField}>
            <Typography variant="subtitle2">Sent to:</Typography>
            <Typography component="div">
              <SmartAddress
                chainId={targetChain}
                address={readableTargetAddress}
                variant="h6"
              />
              {`(Current balance: ${uiAmountString || "0"})`}
            </Typography>
          </div>
        </>
      ) : null}
      {targetChain === CHAIN_ID_SOLANA && targetAsset ? (
        <SolanaCreateAssociatedAddress
          mintAddress={targetAsset}
          readableTargetAddress={readableTargetAddress}
          associatedAccountExists={associatedAccountExists}
          setAssociatedAccountExists={setAssociatedAccountExists}
        />
      ) : null}
      {isEVMChain(targetChain) && !isReady ? null : <FeeMethodSelector />}
      <LowBalanceWarning chainId={targetChain} />
      <ButtonWithLoader
        disabled={!isTargetComplete || !associatedAccountExists}
        onClick={handleNextClick}
        showLoader={isLoading}
        error={
          statusMessage || (isLoading ? undefined : error || targetAssetError)
        }
      >
        Next
      </ButtonWithLoader>
      {!statusMessage && data && !data.doesExist ? <RegisterNowButton /> : null}
    </>
  );
}

export default Target;
