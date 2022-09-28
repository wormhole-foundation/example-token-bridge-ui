import { CHAIN_ID_NEAR } from "@certusone/wormhole-sdk";
import { formatUnits } from "ethers/lib/utils";
import { useCallback } from "react";
import { createParsedTokenAccount } from "../../hooks/useGetSourceParsedTokenAccounts";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import { fetchSingleMetadata } from "../../hooks/useNearMetadata";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import { makeNearAccount } from "../../utils/near";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";

type NearTokenPickerProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: ParsedTokenAccount | null) => void;
  tokenAccounts: DataWrapper<ParsedTokenAccount[]> | undefined;
  disabled: boolean;
  resetAccounts: (() => void) | undefined;
};

export default function NearTokenPicker(props: NearTokenPickerProps) {
  const { value, onChange, disabled, tokenAccounts, resetAccounts } = props;
  const { walletAddress } = useIsWalletReady(CHAIN_ID_NEAR);

  const resetAccountWrapper = useCallback(() => {
    resetAccounts && resetAccounts();
  }, [resetAccounts]);
  const isLoading = tokenAccounts?.isFetching || false;

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

  const lookupNearAddress = useCallback(
    (lookupAsset: string) => {
      if (!walletAddress) {
        return Promise.reject("Wallet not connected");
      }
      return makeNearAccount(walletAddress)
        .then((account) => {
          return fetchSingleMetadata(lookupAsset, account)
            .then((metadata) => {
              return account
                .viewFunction(lookupAsset, "ft_balance_of", {
                  account_id: walletAddress,
                })
                .then((amount) => {
                  return createParsedTokenAccount(
                    walletAddress,
                    lookupAsset,
                    amount,
                    metadata.decimals,
                    parseFloat(formatUnits(amount, metadata.decimals)),
                    formatUnits(amount, metadata.decimals).toString(),
                    metadata.symbol,
                    metadata.tokenName,
                    undefined,
                    false
                  );
                })
                .catch(() => Promise.reject());
            })
            .catch(() => Promise.reject());
        })
        .catch(() => Promise.reject());
    },
    [walletAddress]
  );

  const isSearchableAddress = useCallback(
    (address: string) => address.length > 0,
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
      options={tokenAccounts?.data || []}
      RenderOption={RenderComp}
      onChange={onChangeWrapper}
      isValidAddress={isSearchableAddress}
      getAddress={lookupNearAddress}
      disabled={disabled}
      resetAccounts={resetAccountWrapper}
      error={""}
      showLoader={isLoading}
      nft={false}
      chainId={CHAIN_ID_NEAR}
    />
  );
}
