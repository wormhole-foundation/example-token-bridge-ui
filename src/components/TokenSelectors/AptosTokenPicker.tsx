import { CHAIN_ID_APTOS } from "@certusone/wormhole-sdk";
import { formatUnits } from "@ethersproject/units";
import { useCallback, useMemo, useRef } from "react";
import useAptosNativeBalance from "../../hooks/useAptosNativeBalance";
import { createParsedTokenAccount } from "../../hooks/useGetSourceParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import {
  APTOS_NATIVE_DECIMALS,
  APTOS_NATIVE_TOKEN_KEY,
} from "../../utils/consts";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";
import aptosIcon from "../../icons/aptos.svg";

type AptosTokenPickerProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: ParsedTokenAccount | null) => void;
  tokenAccounts: DataWrapper<ParsedTokenAccount[]> | undefined;
  disabled: boolean;
  resetAccounts: (() => void) | undefined;
};

export default function AptosTokenPicker(props: AptosTokenPickerProps) {
  const { value, onChange, disabled } = props;
  const { walletAddress } = useIsWalletReady(CHAIN_ID_APTOS);
  const nativeRefresh = useRef<() => void>(() => {});
  const { balance, isLoading: nativeIsLoading } = useAptosNativeBalance(
    walletAddress,
    nativeRefresh
  );

  const resetAccountWrapper = useCallback(() => {
    //we can currently skip calling this as we don't read from sourceParsedTokenAccounts
    //resetAccounts && resetAccounts();
    nativeRefresh.current();
  }, []);
  const isLoading = nativeIsLoading; // || (tokenMap?.isFetching || false);

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

  const aptosTokenArray = useMemo(() => {
    const balancesItems =
      balance !== undefined && walletAddress
        ? [
            createParsedTokenAccount(
              walletAddress,
              APTOS_NATIVE_TOKEN_KEY,
              balance.toString(), //amount
              APTOS_NATIVE_DECIMALS,
              0, //uiAmount is unused
              formatUnits(balance, APTOS_NATIVE_DECIMALS), //uiAmountString
              "APTOS", // symbol
              "Aptos Coin", //name
              aptosIcon,
              true //is native asset
            ),
          ]
        : [];
    return balancesItems;
  }, [walletAddress, balance]);

  //TODO this only supports non-native assets. Native assets come from the hook.
  //TODO correlate against token list to get metadata
  const lookupAptosAddress = useCallback(
    (lookupAsset: string) => {
      if (!walletAddress) {
        return Promise.reject("Wallet not connected");
      }
      throw new Error("Failed to retrieve Aptos account.");
      //   const lcd = new LCDClient(APTOS_LCD_CLIENT_CONFIG);
      //   return lcd.wasm
      //     .contractQuery(lookupAsset, {
      //       token_info: {},
      //     })
      //     .then((info: any) =>
      //       lcd.wasm
      //         .contractQuery(lookupAsset, {
      //           balance: {
      //             address: walletAddress,
      //           },
      //         })
      //         .then((balance: any) => {
      //           if (balance && info) {
      //             return createParsedTokenAccount(
      //               walletAddress,
      //               lookupAsset,
      //               balance.balance.toString(),
      //               info.decimals,
      //               Number(formatUnits(balance.balance, info.decimals)),
      //               formatUnits(balance.balance, info.decimals),
      //               info.symbol,
      //               info.name
      //             );
      //           } else {
      //             throw new Error("Failed to retrieve Aptos account.");
      //           }
      //         })
      //     )
      // .catch(() => {
      //   return Promise.reject();
      // });
    },
    [walletAddress]
  );

  const isSearchableAddress = useCallback((address: string) => {
    return false; // isValidAptosAddress(address) && !isNativeDenom(address);
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
      options={aptosTokenArray || []}
      RenderOption={RenderComp}
      onChange={onChangeWrapper}
      isValidAddress={isSearchableAddress}
      getAddress={lookupAptosAddress}
      disabled={disabled}
      resetAccounts={resetAccountWrapper}
      error={""}
      showLoader={isLoading}
      nft={false}
      chainId={CHAIN_ID_APTOS}
    />
  );
}
