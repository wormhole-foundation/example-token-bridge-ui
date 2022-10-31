import { CHAIN_ID_SUI, isValidAptosType } from "@certusone/wormhole-sdk";
import { formatUnits } from "@ethersproject/units";
import { useCallback, useRef } from "react";
import { createParsedTokenAccount } from "../../hooks/useGetSourceParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import { getSuiProvider } from "../../utils/sui";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";

type SuiTokenPickerProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: ParsedTokenAccount | null) => void;
  tokenAccounts: DataWrapper<ParsedTokenAccount[]> | undefined;
  disabled: boolean;
  resetAccounts: (() => void) | undefined;
};

export default function SuiTokenPicker(props: SuiTokenPickerProps) {
  const { value, onChange, tokenAccounts, disabled } = props;
  const { walletAddress } = useIsWalletReady(CHAIN_ID_SUI);
  const nativeRefresh = useRef<() => void>(() => {});

  const resetAccountWrapper = useCallback(() => {
    //we can currently skip calling this as we don't read from sourceParsedTokenAccounts
    //resetAccounts && resetAccounts();
    nativeRefresh.current();
  }, []);
  const isLoading = tokenAccounts?.isFetching;

  const onChangeWrapper = useCallback(
    async (account: NFTParsedTokenAccount | null) => {
      if (account === null) {
        onChange(null);
        return Promise.resolve();
      }
      onChange(account);
      return Promise.resolve();
    },
    [onChange]
  );

  //TODO this only supports non-native assets. Native assets come from the hook.
  //TODO correlate against token list to get metadata
  const lookupSuiAddress = useCallback(
    (lookupAsset: string) => {
      if (!walletAddress) {
        return Promise.reject("Wallet not connected");
      }
      const provider = getSuiProvider();
      return (async () => {
        try {
          const { totalBalance } = await provider.getBalance({
            owner: walletAddress,
            coinType: lookupAsset,
          });
          const response = await provider.getCoinMetadata({
            coinType: lookupAsset,
          });
          if (!response) throw new Error("bad response");
          const { decimals, symbol, name } = response;
          return createParsedTokenAccount(
            walletAddress,
            lookupAsset,
            totalBalance,
            decimals,
            Number(formatUnits(totalBalance, decimals)),
            formatUnits(totalBalance, decimals),
            symbol,
            name
          );
        } catch (e) {
          console.log(e);
          return Promise.reject();
        }
      })();
    },
    [walletAddress]
  );

  const isSearchableAddress = useCallback((address: string) => {
    // TODO: rename to `isValidMoveType` in SDK
    return isValidAptosType(address);
  }, []);

  const RenderComp = useCallback(
    ({ account }: { account: NFTParsedTokenAccount }) => {
      return BasicAccountRender(account, false);
    },
    []
  );

  return (
    <TokenPicker
      value={value}
      options={tokenAccounts?.data || []}
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
