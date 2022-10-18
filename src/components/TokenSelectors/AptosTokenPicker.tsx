import { CHAIN_ID_APTOS, isValidAptosType } from "@certusone/wormhole-sdk";
import { formatUnits } from "@ethersproject/units";
import { useCallback, useMemo, useRef } from "react";
import { AptosCoinResourceReturn } from "../../hooks/useAptosMetadata";
import useAptosNativeBalance from "../../hooks/useAptosNativeBalance";
import { createParsedTokenAccount } from "../../hooks/useGetSourceParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import aptosIcon from "../../icons/aptos.svg";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import { getAptosClient } from "../../utils/aptos";
import {
  APTOS_NATIVE_DECIMALS,
  APTOS_NATIVE_TOKEN_KEY,
} from "../../utils/consts";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";

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
              "APT", // symbol
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
      const client = getAptosClient();
      return (async () => {
        try {
          const coinType = `0x1::coin::CoinInfo<${lookupAsset}>`;
          const coinStore = `0x1::coin::CoinStore<${lookupAsset}>`;
          const value = (
            (await client.getAccountResource(walletAddress, coinStore))
              .data as any
          ).coin.value;
          const assetInfo = (
            await client.getAccountResource(
              lookupAsset.split("::")[0],
              coinType
            )
          ).data as AptosCoinResourceReturn;
          if (value && assetInfo) {
            return createParsedTokenAccount(
              walletAddress,
              lookupAsset,
              value.toString(),
              assetInfo.decimals,
              Number(formatUnits(value, assetInfo.decimals)),
              formatUnits(value, assetInfo.decimals),
              assetInfo.symbol,
              assetInfo.name
            );
          } else {
            throw new Error("Failed to retrieve Aptos account.");
          }
        } catch (e) {
          console.log(e);
          return Promise.reject();
        }
      })();
    },
    [walletAddress]
  );

  const isSearchableAddress = useCallback((address: string) => {
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
