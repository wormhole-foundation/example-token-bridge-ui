import { CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { TokenInfo } from "@solana/spl-token-registry";
import { useCallback, useMemo } from "react";
import useMetaplexData from "../../hooks/useMetaplexData";
import useSolanaTokenMap from "../../hooks/useSolanaTokenMap";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import { ParsedTokenAccount } from "../../store/transferSlice";
import { ExtractedMintInfo } from "../../utils/solana";
import { sortParsedTokenAccounts } from "../../utils/sort";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";

type SolanaSourceTokenSelectorProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: NFTParsedTokenAccount | null) => void;
  accounts: DataWrapper<NFTParsedTokenAccount[]> | null | undefined;
  disabled: boolean;
  mintAccounts:
    | DataWrapper<Map<string, ExtractedMintInfo | null> | undefined>
    | undefined;
  resetAccounts: (() => void) | undefined;
  nft?: boolean;
};

export default function SolanaSourceTokenSelector(
  props: SolanaSourceTokenSelectorProps
) {
  const {
    value,
    onChange,
    disabled,
    resetAccounts,
    nft,
    accounts,
    mintAccounts,
  } = props;
  const tokenMap = useSolanaTokenMap();
  const mintAddresses = useMemo(() => {
    const output: string[] = [];
    mintAccounts?.data?.forEach(
      (mintAuth, mintAddress) => mintAddress && output.push(mintAddress)
    );
    return output;
  }, [mintAccounts?.data]);
  const metaplex = useMetaplexData(mintAddresses);

  const memoizedTokenMap: Map<String, TokenInfo> = useMemo(() => {
    const output = new Map<String, TokenInfo>();

    if (tokenMap.data) {
      for (const data of tokenMap.data) {
        if (data && data.address) {
          output.set(data.address, data);
        }
      }
    }

    return output;
  }, [tokenMap]);

  const getLogo = useCallback(
    (account: ParsedTokenAccount) => {
      return (
        (account.isNativeAsset && account.logo) ||
        memoizedTokenMap.get(account.mintKey)?.logoURI ||
        metaplex.data?.get(account.mintKey)?.data?.uri ||
        undefined
      );
    },
    [memoizedTokenMap, metaplex]
  );

  const getSymbol = useCallback(
    (account: ParsedTokenAccount) => {
      return (
        (account.isNativeAsset && account.symbol) ||
        memoizedTokenMap.get(account.mintKey)?.symbol ||
        metaplex.data?.get(account.mintKey)?.data?.symbol ||
        undefined
      );
    },
    [memoizedTokenMap, metaplex]
  );

  const getName = useCallback(
    (account: ParsedTokenAccount) => {
      return (
        (account.isNativeAsset && account.name) ||
        memoizedTokenMap.get(account.mintKey)?.name ||
        metaplex.data?.get(account.mintKey)?.data?.name ||
        undefined
      );
    },
    [memoizedTokenMap, metaplex]
  );

  //This exists to remove NFTs from the list of potential options. It requires reading the metaplex data, so it would be
  //difficult to do before this point.
  const filteredOptions = useMemo(() => {
    const array = accounts?.data || [];
    const tokenList = array.filter((x) => {
      const zeroBalance = x.amount === "0";
      if (zeroBalance) {
        return false;
      }
      const isNFT =
        x.decimals === 0 && metaplex.data?.get(x.mintKey)?.data?.uri;
      const is721CompatibleNFT =
        isNFT && mintAccounts?.data?.get(x.mintKey)?.supply === "1";
      return nft ? is721CompatibleNFT : !isNFT;
    });
    tokenList.sort(sortParsedTokenAccounts);
    return tokenList;
  }, [mintAccounts?.data, metaplex.data, nft, accounts]);

  const accountsWithMetadata = useMemo(() => {
    return filteredOptions.map((account) => {
      const logo = getLogo(account);
      const symbol = getSymbol(account);
      const name = getName(account);

      const uri = getLogo(account);

      return {
        ...account,
        name,
        symbol,
        logo,
        uri,
      };
    });
  }, [filteredOptions, getLogo, getName, getSymbol]);

  const isLoading =
    accounts?.isFetching || metaplex.isFetching || tokenMap.isFetching;

  const onChangeWrapper = useCallback(
    async (newValue: NFTParsedTokenAccount | null) => {
      // let v1 = false;
      if (newValue === null) {
        onChange(null);
        return Promise.resolve();
      }

      onChange(newValue);
      return Promise.resolve();
    },
    [onChange]
  );

  const RenderComp = useCallback(
    ({ account }: { account: NFTParsedTokenAccount }) => {
      return BasicAccountRender(account, nft || false);
    },
    [nft]
  );

  return (
    <TokenPicker
      value={value}
      options={accountsWithMetadata}
      RenderOption={RenderComp}
      onChange={onChangeWrapper}
      disabled={disabled}
      resetAccounts={resetAccounts}
      error={""}
      showLoader={isLoading}
      nft={nft || false}
      chainId={CHAIN_ID_SOLANA}
    />
  );
}
