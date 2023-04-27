import { CHAIN_ID_SEI, ChainId, cosmos } from "@certusone/wormhole-sdk";
import { useCallback, useRef } from "react";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import useSeiNativeBalances from "../../hooks/useSeiNativeBalances";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";
import { getSeiQueryClient, getSeiWasmClient } from "../../utils/sei";
import { base58, formatUnits } from "ethers/lib/utils";
import { SEI_TRANSLATOR } from "../../utils/consts";
import { createParsedTokenAccount } from "../../hooks/useGetSourceParsedTokenAccounts";

type SeiTokenPickerProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: ParsedTokenAccount | null) => void;
  tokenAccounts: DataWrapper<ParsedTokenAccount[]> | undefined;
  disabled: boolean;
  resetAccounts: (() => void) | undefined;
};

export default function SeiTokenPicker(props: SeiTokenPickerProps) {
  const { value, onChange, disabled } = props;
  const { walletAddress } = useIsWalletReady(CHAIN_ID_SEI);
  const nativeRefresh = useRef<() => void>(() => {});
  const { balances, isLoading: nativeIsLoading } = useSeiNativeBalances(
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

  //TODO this only supports non-native assets. Native assets come from the hook.
  //TODO correlate against token list to get metadata
  const lookupSeiAddress = useCallback(
    (lookupAsset: string) => {
      if (!walletAddress) {
        return Promise.reject("Wallet not connected");
      }
      // NOTE: this does not support other banks and CW20s on Sei
      if (!lookupAsset.startsWith(`factory/${SEI_TRANSLATOR}/`)) {
        return Promise.reject("Unsupported asset");
      }
      return (async () => {
        // see useSeiNativeBalances
        const client = await getSeiQueryClient();
        const wasmClient = await getSeiWasmClient();
        const response = await client.cosmos.bank.v1beta1.balance({
          address: walletAddress,
          denom: lookupAsset,
        });
        const info = await wasmClient.queryContractSmart(
          cosmos.humanAddress("sei", base58.decode(lookupAsset.split("/")[2])),
          {
            token_info: {},
          }
        );
        return createParsedTokenAccount(
          walletAddress,
          lookupAsset,
          response.balance.amount,
          info.decimals,
          Number(formatUnits(response.balance.amount, info.decimals)),
          formatUnits(response.balance.amount, info.decimals),
          info.symbol,
          info.name
        );
      })();
    },
    [walletAddress]
  );

  const isSearchableAddress = useCallback(
    (address: string, chainId: ChainId) => {
      return false;
    },
    []
  );

  const RenderComp = useCallback(
    ({ account }: { account: NFTParsedTokenAccount }) => {
      return BasicAccountRender(account, false);
    },
    []
  );

  return (
    <TokenPicker
      value={value}
      options={balances || []}
      RenderOption={RenderComp}
      onChange={onChangeWrapper}
      isValidAddress={isSearchableAddress}
      getAddress={lookupSeiAddress}
      disabled={disabled}
      resetAccounts={resetAccountWrapper}
      error={""}
      showLoader={isLoading}
      nft={false}
      chainId={CHAIN_ID_SEI}
    />
  );
}
