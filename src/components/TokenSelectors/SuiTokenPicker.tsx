import { CHAIN_ID_SUI, isValidAptosType } from "@certusone/wormhole-sdk";
import { formatUnits } from "@ethersproject/units";
import { useCallback, useMemo, useRef } from "react";
import { createParsedTokenAccount } from "../../hooks/useGetSourceParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import useSuiNativeBalance from "../../hooks/useNativeSuiBalance";
import suiIcon from "../../icons/sui.svg";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import { SUI_NATIVE_DECIMALS, SUI_NATIVE_TOKEN_KEY } from "../../utils/consts";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";

type SuiTokenPickerProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: ParsedTokenAccount | null) => void;
  tokenAccounts: DataWrapper<ParsedTokenAccount[]> | undefined;
  disabled: boolean;
  resetAccounts: (() => void) | undefined;
};

export default function SuiTokenPicker(props: SuiTokenPickerProps) {
  const { value, onChange, disabled } = props;
  const { walletAddress } = useIsWalletReady(CHAIN_ID_SUI);
  const nativeRefresh = useRef<() => void>(() => {});
  const { balance, isLoading: nativeIsLoading } = useSuiNativeBalance(
    walletAddress,
    nativeRefresh,
  );

  const resetAccountWrapper = useCallback(() => {
    //we can currently skip calling this as we don't read from sourceParsedTokenAccounts
    //resetAccounts && resetAccounts();
    nativeRefresh.current();
  }, []);
  const isLoading = nativeIsLoading;

  const onChangeWrapper = useCallback(
    async (account: NFTParsedTokenAccount | null) => {
      if (account === null) {
        onChange(null);
        return Promise.resolve();
      }
      onChange(account);
      return Promise.resolve();
    },
    [onChange],
  );

  const suiTokenArray = useMemo(() => {
    const balancesItems =
      balance !== undefined && walletAddress
        ? [
            createParsedTokenAccount(
              walletAddress,
              SUI_NATIVE_TOKEN_KEY,
              balance.toString(), //amount
              SUI_NATIVE_DECIMALS,
              0, //uiAmount is unused
              formatUnits(balance, SUI_NATIVE_DECIMALS), //uiAmountString
              "SUI", // symbol
              "SUI Coin", //name
              suiIcon,
              true, //is native asset
            ),
          ]
        : [];
    return balancesItems;
  }, [walletAddress, balance]);

  //TODO this only supports non-native assets. Native assets come from the hook.
  //TODO correlate against token list to get metadata
  const lookupSuiAddress = useCallback(
    (lookupAsset: string) => {
      if (!walletAddress) {
        return Promise.reject("Wallet not connected");
      }
      return (async () => {
        try {
          // TODO
          return Promise.resolve(null as any);
        } catch (e) {
          console.log(e);
          return Promise.reject();
        }
      })();
    },
    [walletAddress],
  );

  const isSearchableAddress = useCallback((address: string) => {
    // TODO: rename to `isValidMoveType` in SDK
    return isValidAptosType(address);
  }, []);

  const RenderComp = useCallback(
    ({ account }: { account: NFTParsedTokenAccount }) => {
      return BasicAccountRender(account, false);
    },
    [],
  );

  return (
    <TokenPicker
      value={value}
      options={suiTokenArray || []}
      RenderOption={RenderComp}
      onChange={onChangeWrapper}
      isValidAddress={isSearchableAddress}
      getAddress={lookupSuiAddress}
      disabled={disabled}
      resetAccounts={resetAccountWrapper}
      error={""}
      showLoader={isLoading}
      nft={false}
      chainId={CHAIN_ID_SUI}
    />
  );
}
