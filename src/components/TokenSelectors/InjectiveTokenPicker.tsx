import {
  CHAIN_ID_INJECTIVE,
  isNativeDenomInjective,
  parseSmartContractStateResponse,
} from "@certusone/wormhole-sdk";
import { formatUnits } from "@ethersproject/units";
import { useCallback, useMemo, useRef } from "react";
import { createParsedTokenAccount } from "../../hooks/useGetSourceParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import useInjectiveNativeBalances from "../../hooks/useInjectiveNativeBalances";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";
import {
  formatNativeDenom,
  getInjectiveWasmClient,
  INJECTIVE_NATIVE_DENOM,
  isValidInjectiveAddress,
  NATIVE_INJECTIVE_DECIMALS,
} from "../../utils/injective";
import injectiveIcon from "../../icons/injective.svg";

type InjectiveTokenPickerProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: ParsedTokenAccount | null) => void;
  tokenAccounts: DataWrapper<ParsedTokenAccount[]> | undefined;
  disabled: boolean;
  resetAccounts: (() => void) | undefined;
};

export default function InjectiveTokenPicker(props: InjectiveTokenPickerProps) {
  const { value, onChange, disabled } = props;
  const { walletAddress } = useIsWalletReady(CHAIN_ID_INJECTIVE);
  const nativeRefresh = useRef<() => void>(() => {});
  const { balances, isLoading: nativeIsLoading } = useInjectiveNativeBalances(
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

  const injTokenArray = useMemo(() => {
    const balancesItems =
      balances && walletAddress
        ? Object.keys(balances).map((denom) =>
            //This token account makes a lot of assumptions
            createParsedTokenAccount(
              walletAddress,
              denom,
              balances[denom], //amount
              NATIVE_INJECTIVE_DECIMALS, //TODO actually get decimals rather than hardcode
              0, //uiAmount is unused
              formatUnits(balances[denom], NATIVE_INJECTIVE_DECIMALS), //uiAmountString
              formatNativeDenom(denom), // symbol
              undefined, //name
              injectiveIcon,
              true //is native asset
            )
          )
        : [];
    return balancesItems.filter(
      (metadata) => metadata.mintKey === INJECTIVE_NATIVE_DENOM
    );
  }, [walletAddress, balances]);

  //TODO this only supports non-native assets. Native assets come from the hook.
  //TODO correlate against token list to get metadata
  const lookupInjectiveAddress = useCallback(
    (lookupAsset: string) => {
      if (!walletAddress) {
        return Promise.reject("Wallet not connected");
      }
      const client = getInjectiveWasmClient();
      return client
        .fetchSmartContractState(
          lookupAsset,
          Buffer.from(
            JSON.stringify({
              token_info: {},
            })
          ).toString("base64")
        )
        .then((infoData) =>
          client
            .fetchSmartContractState(
              lookupAsset,
              Buffer.from(
                JSON.stringify({
                  balance: {
                    address: walletAddress,
                  },
                })
              ).toString("base64")
            )
            .then((balanceData) => {
              if (infoData && balanceData) {
                const balance = parseSmartContractStateResponse(balanceData);
                const info = parseSmartContractStateResponse(infoData);
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
                throw new Error("Failed to retrieve Injective account.");
              }
            })
        )
        .catch((e) => {
          return Promise.reject(e);
        });
    },
    [walletAddress]
  );

  const isSearchableAddress = useCallback((address: string) => {
    return isValidInjectiveAddress(address) && !isNativeDenomInjective(address);
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
      options={injTokenArray || []}
      RenderOption={RenderComp}
      onChange={onChangeWrapper}
      isValidAddress={isSearchableAddress}
      getAddress={lookupInjectiveAddress}
      disabled={disabled}
      resetAccounts={resetAccountWrapper}
      error={""}
      showLoader={isLoading}
      nft={false}
      chainId={CHAIN_ID_INJECTIVE}
    />
  );
}
