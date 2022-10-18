import {
  ChainId,
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_SOLANA,
  CHAIN_ID_TERRA2,
  CHAIN_ID_XPLA,
  isEVMChain,
  isTerraChain,
  TerraChainId,
} from "@certusone/wormhole-sdk";
import { TokenInfo } from "@solana/spl-token-registry";
import { useMemo } from "react";
import { DataWrapper, getEmptyDataWrapper } from "../store/helpers";
import { Metadata } from "../utils/metaplex";
import useAlgoMetadata, { AlgoMetadata } from "./useAlgoMetadata";
import useAptosMetadata, { AptosMetadata } from "./useAptosMetadata";
import useEvmMetadata, { EvmMetadata } from "./useEvmMetadata";
import useInjectiveMetadata, {
  InjectiveMetadata,
} from "./useInjectiveMetadata";
import useMetaplexData from "./useMetaplexData";
import useSolanaTokenMap from "./useSolanaTokenMap";
import useTerraMetadata, { TerraMetadata } from "./useTerraMetadata";
import useTerraTokenMap, { TerraTokenMap } from "./useTerraTokenMap";
import useXplaMetadata, { XplaMetadata } from "./useXplaMetadata";

export type GenericMetadata = {
  symbol?: string;
  logo?: string;
  tokenName?: string;
  decimals?: number;
  //TODO more items
  raw?: any;
};

const constructSolanaMetadata = (
  addresses: string[],
  solanaTokenMap: DataWrapper<TokenInfo[]>,
  metaplexData: DataWrapper<Map<string, Metadata | undefined> | undefined>
) => {
  const isFetching = solanaTokenMap.isFetching || metaplexData?.isFetching;
  const error = solanaTokenMap.error || metaplexData?.isFetching;
  const receivedAt = solanaTokenMap.receivedAt && metaplexData?.receivedAt;
  const data = new Map<string, GenericMetadata>();
  addresses.forEach((address) => {
    const metaplex = metaplexData?.data?.get(address);
    const tokenInfo = solanaTokenMap.data?.find((x) => x.address === address);
    //Both this and the token picker, at present, give priority to the tokenmap
    const obj = {
      symbol: metaplex?.data?.symbol || tokenInfo?.symbol || undefined,
      logo: tokenInfo?.logoURI || undefined, //TODO is URI on metaplex actually the logo? If not, where is it?
      tokenName: metaplex?.data?.name || tokenInfo?.name || undefined,
      decimals: tokenInfo?.decimals || undefined, //TODO decimals are actually on the mint, not the metaplex account.
      raw: metaplex,
    };
    data.set(address, obj);
  });

  return {
    isFetching,
    error,
    receivedAt,
    data,
  };
};

const constructTerraMetadata = (
  addresses: string[],
  tokenMap: DataWrapper<TerraTokenMap>,
  terraMetadata: DataWrapper<Map<string, TerraMetadata>>,
  chainId: TerraChainId
) => {
  const isFetching = tokenMap.isFetching || terraMetadata.isFetching;
  const error = tokenMap.error || terraMetadata.error;
  const receivedAt = tokenMap.receivedAt && terraMetadata.receivedAt;
  const data = new Map<string, GenericMetadata>();
  addresses.forEach((address) => {
    const metadata = terraMetadata.data?.get(address);
    const tokenInfo =
      chainId === CHAIN_ID_TERRA2
        ? tokenMap.data?.mainnet[address]
        : tokenMap.data?.classic[address];
    const obj = {
      symbol: tokenInfo?.symbol || metadata?.symbol || undefined,
      logo: tokenInfo?.icon || metadata?.logo || undefined,
      tokenName: tokenInfo?.name || metadata?.tokenName || undefined,
      decimals: metadata?.decimals || undefined,
    };
    data.set(address, obj);
  });

  return {
    isFetching,
    error,
    receivedAt,
    data,
  };
};

const constructXplaMetadata = (
  addresses: string[],
  metadataMap: DataWrapper<Map<string, XplaMetadata>>
) => {
  const isFetching = metadataMap.isFetching;
  const error = metadataMap.error;
  const receivedAt = metadataMap.receivedAt;
  const data = new Map<string, GenericMetadata>();
  addresses.forEach((address) => {
    const meta = metadataMap.data?.get(address);
    const obj = {
      symbol: meta?.symbol || undefined,
      logo: undefined,
      tokenName: meta?.tokenName || undefined,
      decimals: meta?.decimals,
    };
    data.set(address, obj);
  });

  return {
    isFetching,
    error,
    receivedAt,
    data,
  };
};

const constructEthMetadata = (
  addresses: string[],
  metadataMap: DataWrapper<Map<string, EvmMetadata> | null>
) => {
  const isFetching = metadataMap.isFetching;
  const error = metadataMap.error;
  const receivedAt = metadataMap.receivedAt;
  const data = new Map<string, GenericMetadata>();
  addresses.forEach((address) => {
    const meta = metadataMap.data?.get(address);
    const obj = {
      symbol: meta?.symbol || undefined,
      logo: meta?.logo || undefined,
      tokenName: meta?.tokenName || undefined,
      decimals: meta?.decimals,
    };
    data.set(address, obj);
  });

  return {
    isFetching,
    error,
    receivedAt,
    data,
  };
};

const constructAlgoMetadata = (
  addresses: string[],
  metadataMap: DataWrapper<Map<string, AlgoMetadata> | null>
) => {
  const isFetching = metadataMap.isFetching;
  const error = metadataMap.error;
  const receivedAt = metadataMap.receivedAt;
  const data = new Map<string, GenericMetadata>();
  addresses.forEach((address) => {
    const meta = metadataMap.data?.get(address);
    const obj = {
      symbol: meta?.symbol || undefined,
      logo: undefined,
      tokenName: meta?.tokenName || undefined,
      decimals: meta?.decimals,
    };
    data.set(address, obj);
  });

  return {
    isFetching,
    error,
    receivedAt,
    data,
  };
};

const constructAptosMetadata = (
  addresses: string[],
  metadataMap: DataWrapper<Map<string, AptosMetadata> | null>
) => {
  const isFetching = metadataMap.isFetching;
  const error = metadataMap.error;
  const receivedAt = metadataMap.receivedAt;
  const data = new Map<string, GenericMetadata>();
  addresses.forEach((address) => {
    const meta = metadataMap.data?.get(address);
    const obj = {
      symbol: meta?.symbol || undefined,
      logo: undefined,
      tokenName: meta?.tokenName || undefined,
      decimals: meta?.decimals,
    };
    data.set(address, obj);
  });

  return {
    isFetching,
    error,
    receivedAt,
    data,
  };
};

const constructInjectiveMetadata = (
  addresses: string[],
  metadataMap: DataWrapper<Map<string, InjectiveMetadata>>
) => {
  const isFetching = metadataMap.isFetching;
  const error = metadataMap.error;
  const receivedAt = metadataMap.receivedAt;
  const data = new Map<string, GenericMetadata>();
  addresses.forEach((address) => {
    const meta = metadataMap.data?.get(address);
    const obj = {
      symbol: meta?.symbol || undefined,
      logo: undefined,
      tokenName: meta?.tokenName || undefined,
      decimals: meta?.decimals,
    };
    data.set(address, obj);
  });

  return {
    isFetching,
    error,
    receivedAt,
    data,
  };
};

export default function useMetadata(
  chainId: ChainId,
  addresses: string[]
): DataWrapper<Map<string, GenericMetadata>> {
  const terraTokenMap = useTerraTokenMap(isTerraChain(chainId));
  const solanaTokenMap = useSolanaTokenMap();

  const solanaAddresses = useMemo(() => {
    return chainId === CHAIN_ID_SOLANA ? addresses : [];
  }, [chainId, addresses]);
  const terraAddresses = useMemo(() => {
    return isTerraChain(chainId) ? addresses : [];
  }, [chainId, addresses]);
  const xplaAddresses = useMemo(() => {
    return chainId === CHAIN_ID_XPLA ? addresses : [];
  }, [chainId, addresses]);
  const ethereumAddresses = useMemo(() => {
    return isEVMChain(chainId) ? addresses : [];
  }, [chainId, addresses]);
  const algoAddresses = useMemo(() => {
    return chainId === CHAIN_ID_ALGORAND ? addresses : [];
  }, [chainId, addresses]);
  const aptosAddresses = useMemo(() => {
    return chainId === CHAIN_ID_APTOS ? addresses : [];
  }, [chainId, addresses]);
  const injAddresses = useMemo(() => {
    return chainId === CHAIN_ID_INJECTIVE ? addresses : [];
  }, [chainId, addresses]);

  const metaplexData = useMetaplexData(solanaAddresses);
  const terraMetadata = useTerraMetadata(
    terraAddresses,
    chainId as TerraChainId
  );
  const xplaMetadata = useXplaMetadata(xplaAddresses);
  const ethMetadata = useEvmMetadata(ethereumAddresses, chainId);
  const algoMetadata = useAlgoMetadata(algoAddresses);
  const aptosMetadata = useAptosMetadata(aptosAddresses);
  const injMetadata = useInjectiveMetadata(injAddresses);

  const output: DataWrapper<Map<string, GenericMetadata>> = useMemo(
    () =>
      chainId === CHAIN_ID_SOLANA
        ? constructSolanaMetadata(solanaAddresses, solanaTokenMap, metaplexData)
        : isEVMChain(chainId)
        ? constructEthMetadata(ethereumAddresses, ethMetadata)
        : isTerraChain(chainId)
        ? constructTerraMetadata(
            terraAddresses,
            terraTokenMap,
            terraMetadata,
            chainId
          )
        : chainId === CHAIN_ID_XPLA
        ? constructXplaMetadata(xplaAddresses, xplaMetadata)
        : chainId === CHAIN_ID_APTOS
        ? constructAptosMetadata(aptosAddresses, aptosMetadata)
        : chainId === CHAIN_ID_ALGORAND
        ? constructAlgoMetadata(algoAddresses, algoMetadata)
        : chainId === CHAIN_ID_INJECTIVE
        ? constructInjectiveMetadata(injAddresses, injMetadata)
        : getEmptyDataWrapper(),
    [
      chainId,
      solanaAddresses,
      solanaTokenMap,
      metaplexData,
      ethereumAddresses,
      ethMetadata,
      terraAddresses,
      terraTokenMap,
      terraMetadata,
      xplaAddresses,
      xplaMetadata,
      algoAddresses,
      algoMetadata,
      aptosAddresses,
      aptosMetadata,
      injAddresses,
      injMetadata,
    ]
  );

  return output;
}
