import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SEI,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_XPLA,
  isEVMChain,
  isTerraChain,
} from "@certusone/wormhole-sdk";
import { TextField, Typography } from "@material-ui/core";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import useGetSourceParsedTokens from "../../hooks/useGetSourceParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import {
  setSourceParsedTokenAccount as setNFTSourceParsedTokenAccount,
  setSourceWalletAddress as setNFTSourceWalletAddress,
} from "../../store/nftSlice";
import {
  selectNFTSourceChain,
  selectNFTSourceParsedTokenAccount,
  selectTransferSourceChain,
  selectTransferSourceParsedTokenAccount,
} from "../../store/selectors";
import {
  ParsedTokenAccount,
  setSourceParsedTokenAccount as setTransferSourceParsedTokenAccount,
  setSourceWalletAddress as setTransferSourceWalletAddress,
} from "../../store/transferSlice";
import AlgoTokenPicker from "./AlgoTokenPicker";
import AptosTokenPicker from "./AptosTokenPicker";
import EvmTokenPicker from "./EvmTokenPicker";
import NearTokenPicker from "./NearTokenPicker";
import RefreshButtonWrapper from "./RefreshButtonWrapper";
import SolanaTokenPicker from "./SolanaTokenPicker";
import SuiTokenPicker from "./SuiTokenPicker";
import TerraTokenPicker from "./TerraTokenPicker";
import XplaTokenPicker from "./XplaTokenPicker";
import InjectiveTokenPicker from "./InjectiveTokenPicker";
import SeiTokenPicker from "./SeiTokenPicker";

type TokenSelectorProps = {
  disabled: boolean;
  nft?: boolean;
};

export const TokenSelector = (props: TokenSelectorProps) => {
  const { disabled, nft } = props;
  const dispatch = useDispatch();

  const lookupChain = useSelector(
    nft ? selectNFTSourceChain : selectTransferSourceChain
  );
  const sourceParsedTokenAccount = useSelector(
    nft
      ? selectNFTSourceParsedTokenAccount
      : selectTransferSourceParsedTokenAccount
  );
  const walletIsReady = useIsWalletReady(lookupChain);

  const setSourceParsedTokenAccount = nft
    ? setNFTSourceParsedTokenAccount
    : setTransferSourceParsedTokenAccount;
  const setSourceWalletAddress = nft
    ? setNFTSourceWalletAddress
    : setTransferSourceWalletAddress;

  const handleOnChange = useCallback(
    (newTokenAccount: ParsedTokenAccount | null) => {
      if (!newTokenAccount) {
        dispatch(setSourceParsedTokenAccount(undefined));
        dispatch(setSourceWalletAddress(undefined));
      } else if (newTokenAccount !== undefined && walletIsReady.walletAddress) {
        dispatch(setSourceParsedTokenAccount(newTokenAccount));
        dispatch(setSourceWalletAddress(walletIsReady.walletAddress));
      }
    },
    [
      dispatch,
      walletIsReady,
      setSourceParsedTokenAccount,
      setSourceWalletAddress,
    ]
  );

  const maps = useGetSourceParsedTokens(nft);
  const resetAccountWrapper = maps?.resetAccounts || (() => {}); //This should never happen.

  //This is only for errors so bad that we shouldn't even mount the component
  const fatalError =
    !isEVMChain(lookupChain) &&
    !isTerraChain(lookupChain) &&
    maps?.tokenAccounts?.error; //Terra & EVM chains can proceed because they have advanced mode

  const content = fatalError ? (
    <RefreshButtonWrapper callback={resetAccountWrapper}>
      <Typography>{fatalError}</Typography>
    </RefreshButtonWrapper>
  ) : lookupChain === CHAIN_ID_SOLANA ? (
    <SolanaTokenPicker
      value={sourceParsedTokenAccount || null}
      onChange={handleOnChange}
      disabled={disabled}
      accounts={maps?.tokenAccounts}
      mintAccounts={maps?.mintAccounts}
      resetAccounts={maps?.resetAccounts}
      nft={nft}
    />
  ) : isEVMChain(lookupChain) ? (
    <EvmTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      tokenAccounts={maps?.tokenAccounts}
      resetAccounts={maps?.resetAccounts}
      chainId={lookupChain}
      nft={nft}
    />
  ) : isTerraChain(lookupChain) ? (
    <TerraTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      resetAccounts={maps?.resetAccounts}
      tokenAccounts={maps?.tokenAccounts}
      chainId={lookupChain}
    />
  ) : lookupChain === CHAIN_ID_XPLA ? (
    <XplaTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      resetAccounts={maps?.resetAccounts}
      tokenAccounts={maps?.tokenAccounts}
    />
  ) : lookupChain === CHAIN_ID_APTOS ? (
    <AptosTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      resetAccounts={maps?.resetAccounts}
      tokenAccounts={maps?.tokenAccounts}
    />
  ) : lookupChain === CHAIN_ID_ALGORAND ? (
    <AlgoTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      resetAccounts={maps?.resetAccounts}
      tokenAccounts={maps?.tokenAccounts}
    />
  ) : lookupChain === CHAIN_ID_INJECTIVE ? (
    <InjectiveTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      resetAccounts={maps?.resetAccounts}
      tokenAccounts={maps?.tokenAccounts}
    />
  ) : lookupChain === CHAIN_ID_NEAR ? (
    <NearTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      resetAccounts={maps?.resetAccounts}
      tokenAccounts={maps?.tokenAccounts}
    />
  ) : lookupChain === CHAIN_ID_SEI ? (
    <SeiTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      resetAccounts={maps?.resetAccounts}
      tokenAccounts={maps?.tokenAccounts}
    />
  ) : lookupChain === CHAIN_ID_SUI ? (
    <SuiTokenPicker
      value={sourceParsedTokenAccount || null}
      disabled={disabled}
      onChange={handleOnChange}
      resetAccounts={maps?.resetAccounts}
      tokenAccounts={maps?.tokenAccounts}
    />
  ) : (
    <TextField
      variant="outlined"
      placeholder="Asset"
      fullWidth
      value={"Not Implemented"}
      disabled={true}
    />
  );

  return <div>{content}</div>;
};
