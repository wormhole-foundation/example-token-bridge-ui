import { ChainId, ethers_contracts } from "@certusone/wormhole-sdk";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useEthereumProvider } from "../../contexts/EthereumProviderContext";
import useIsWalletReady from "../../hooks/useIsWalletReady";
import { DataWrapper } from "../../store/helpers";
import { NFTParsedTokenAccount } from "../../store/nftSlice";
import {
  selectNFTSourceParsedTokenAccount,
  selectTransferSourceParsedTokenAccount,
} from "../../store/selectors";
import { ParsedTokenAccount } from "../../store/transferSlice";
import {
  ethNFTToNFTParsedTokenAccount,
  ethTokenToParsedTokenAccount,
  getEthereumNFT,
  getEthereumToken,
  isValidEthereumAddress,
} from "../../utils/ethereum";
import TokenPicker, { BasicAccountRender } from "./TokenPicker";

type EthereumSourceTokenSelectorProps = {
  value: ParsedTokenAccount | null;
  onChange: (newValue: ParsedTokenAccount | null) => void;
  tokenAccounts: DataWrapper<ParsedTokenAccount[]> | undefined;
  disabled: boolean;
  resetAccounts: (() => void) | undefined;
  chainId: ChainId;
  nft?: boolean;
};

export default function EvmTokenPicker(
  props: EthereumSourceTokenSelectorProps
) {
  const {
    value,
    onChange,
    tokenAccounts,
    disabled,
    resetAccounts,
    chainId,
    nft,
  } = props;
  const { provider, signerAddress } = useEthereumProvider();
  const { isReady } = useIsWalletReady(chainId);
  const selectedTokenAccount: NFTParsedTokenAccount | undefined = useSelector(
    nft
      ? selectNFTSourceParsedTokenAccount
      : selectTransferSourceParsedTokenAccount
  );

  const shouldDisplayBalance = useCallback(
    (tokenAccount: NFTParsedTokenAccount) => {
      const selectedMintMatch =
        selectedTokenAccount &&
        selectedTokenAccount.mintKey.toLowerCase() ===
          tokenAccount.mintKey.toLowerCase();
      //added just in case we start displaying NFT balances again.
      const selectedTokenIdMatch =
        selectedTokenAccount &&
        selectedTokenAccount.tokenId === tokenAccount.tokenId;
      return !!(
        tokenAccount.isNativeAsset || //The native asset amount isn't taken from covalent, so can be trusted.
        (selectedMintMatch && selectedTokenIdMatch)
      );
    },
    [selectedTokenAccount]
  );

  const getAddress: (
    address: string,
    tokenId?: string
  ) => Promise<NFTParsedTokenAccount> = useCallback(
    async (address: string, tokenId?: string) => {
      if (provider && signerAddress && isReady) {
        try {
          const tokenAccount = await (nft
            ? getEthereumNFT(address, provider)
            : getEthereumToken(address, provider));
          if (!tokenAccount) {
            return Promise.reject("Could not find the specified token.");
          }
          if (nft && !tokenId) {
            return Promise.reject("Token ID is required.");
          } else if (nft && tokenId) {
            return ethNFTToNFTParsedTokenAccount(
              tokenAccount as ethers_contracts.NFTImplementation,
              tokenId,
              signerAddress
            );
          } else {
            return ethTokenToParsedTokenAccount(
              tokenAccount as ethers_contracts.TokenImplementation,
              signerAddress
            );
          }
        } catch (e) {
          return Promise.reject("Unable to retrive the specific token.");
        }
      } else {
        return Promise.reject({ error: "Wallet is not connected." });
      }
    },
    [isReady, nft, provider, signerAddress]
  );

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

  const RenderComp = useCallback(
    ({ account }: { account: NFTParsedTokenAccount }) => {
      return BasicAccountRender(account, nft || false, shouldDisplayBalance);
    },
    [nft, shouldDisplayBalance]
  );

  return (
    <TokenPicker
      value={value}
      options={tokenAccounts?.data || []}
      RenderOption={RenderComp}
      useTokenId={nft}
      onChange={onChangeWrapper}
      isValidAddress={isValidEthereumAddress}
      getAddress={getAddress}
      disabled={disabled}
      resetAccounts={resetAccounts}
      error={""}
      showLoader={tokenAccounts?.isFetching}
      nft={nft || false}
      chainId={chainId}
    />
  );
}
