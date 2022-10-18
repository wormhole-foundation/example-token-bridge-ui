import { CHAIN_ID_XPLA, isNativeDenomXpla } from "@certusone/wormhole-sdk";
import { formatUnits } from "@ethersproject/units";
import { useCallback, useMemo, useRef } from "react";
import { createParsedTokenAccount } from "../../hooks/useGetSourceParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import useXplaNativeBalances from "../../hooks/useXplaNativeBalances";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import { XPLA_NATIVE_DENOM, XPLA_LCD_CLIENT_CONFIG } from "../../utils/consts";
import {
  formatNativeDenom,
  isValidXplaAddress,
  NATIVE_XPLA_DECIMALS,
  XPLA_NATIVE_TOKEN_ICON,
} from "../../utils/xpla";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";
import { LCDClient } from "@xpla/xpla.js";

type XplaTokenPickerProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: ParsedTokenAccount | null) => void;
  tokenAccounts: DataWrapper<ParsedTokenAccount[]> | undefined;
  disabled: boolean;
  resetAccounts: (() => void) | undefined;
};

export default function XplaTokenPicker(props: XplaTokenPickerProps) {
  const { value, onChange, disabled } = props;
  const { walletAddress } = useIsWalletReady(CHAIN_ID_XPLA);
  const nativeRefresh = useRef<() => void>(() => {});
  const { balances, isLoading: nativeIsLoading } = useXplaNativeBalances(
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

  const xplaTokenArray = useMemo(() => {
    const balancesItems =
      balances && walletAddress
        ? Object.keys(balances).map((denom) =>
            //This token account makes a lot of assumptions
            createParsedTokenAccount(
              walletAddress,
              denom,
              balances[denom], //amount
              NATIVE_XPLA_DECIMALS, //TODO actually get decimals rather than hardcode
              0, //uiAmount is unused
              formatUnits(balances[denom], NATIVE_XPLA_DECIMALS), //uiAmountString
              formatNativeDenom(denom), // symbol
              undefined, //name
              XPLA_NATIVE_TOKEN_ICON,
              true //is native asset
            )
          )
        : [];
    return balancesItems.filter(
      (metadata) => metadata.mintKey === XPLA_NATIVE_DENOM
    );
  }, [walletAddress, balances]);

  //TODO this only supports non-native assets. Native assets come from the hook.
  //TODO correlate against token list to get metadata
  const lookupXplaAddress = useCallback(
    (lookupAsset: string) => {
      if (!walletAddress) {
        return Promise.reject("Wallet not connected");
      }
      const lcd = new LCDClient(XPLA_LCD_CLIENT_CONFIG);
      return lcd.wasm
        .contractQuery(lookupAsset, {
          token_info: {},
        })
        .then((info: any) =>
          lcd.wasm
            .contractQuery(lookupAsset, {
              balance: {
                address: walletAddress,
              },
            })
            .then((balance: any) => {
              if (balance && info) {
                return createParsedTokenAccount(
                  walletAddress,
                  lookupAsset,
                  balance.balance.toString(),
                  info.decimals,
                  Number(formatUnits(balance.balance, info.decimals)),
                  formatUnits(balance.balance, info.decimals),
                  info.symbol,
                  info.name
                );
              } else {
                throw new Error("Failed to retrieve Xpla account.");
              }
            })
        )
        .catch(() => {
          return Promise.reject();
        });
    },
    [walletAddress]
  );

  const isSearchableAddress = useCallback((address: string) => {
    return isValidXplaAddress(address) && !isNativeDenomXpla(address);
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
      options={xplaTokenArray || []}
      RenderOption={RenderComp}
      onChange={onChangeWrapper}
      isValidAddress={isSearchableAddress}
      getAddress={lookupXplaAddress}
      disabled={disabled}
      resetAccounts={resetAccountWrapper}
      error={""}
      showLoader={isLoading}
      nft={false}
      chainId={CHAIN_ID_XPLA}
    />
  );
}
