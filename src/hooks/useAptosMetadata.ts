import { ensureHexPrefix } from "@certusone/wormhole-sdk";
import { AptosClient } from "aptos";
import { useEffect, useMemo, useState } from "react";
import { DataWrapper } from "../store/helpers";
import { getAptosClient } from "../utils/aptos";

export type AptosMetadata = {
  symbol?: string;
  tokenName?: string;
  decimals: number;
};

export type AptosCoinResourceReturn = {
  decimals: number;
  name: string;
  supply: any;
  symbol: string;
};

export const fetchSingleMetadata = async (
  address: string,
  client: AptosClient
): Promise<AptosMetadata> => {
  const coinType = `0x1::coin::CoinInfo<${ensureHexPrefix(address)}>`;
  const assetInfo = (
    await client.getAccountResource(address.split("::")[0], coinType)
  ).data as AptosCoinResourceReturn;
  return {
    tokenName: assetInfo.name,
    symbol: assetInfo.symbol,
    decimals: assetInfo.decimals,
  };
};

const fetchAptosMetadata = async (addresses: string[]) => {
  const client = getAptosClient();
  const promises: Promise<AptosMetadata>[] = [];
  addresses.forEach((address) => {
    promises.push(fetchSingleMetadata(address, client));
  });
  const resultsArray = await Promise.all(promises);
  const output = new Map<string, AptosMetadata>();
  addresses.forEach((address, index) => {
    output.set(address, resultsArray[index]);
  });

  return output;
};

function useAptosMetadata(
  addresses: string[]
): DataWrapper<Map<string, AptosMetadata>> {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Map<string, AptosMetadata> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (addresses.length) {
      setIsFetching(true);
      setError("");
      setData(null);
      fetchAptosMetadata(addresses).then(
        (results) => {
          if (!cancelled) {
            setData(results);
            setIsFetching(false);
          }
        },
        () => {
          if (!cancelled) {
            setError("Could not retrieve contract metadata");
            setIsFetching(false);
          }
        }
      );
    }
    return () => {
      cancelled = true;
    };
  }, [addresses]);

  return useMemo(
    () => ({
      data,
      isFetching,
      error,
      receivedAt: null,
    }),
    [data, isFetching, error]
  );
}

export default useAptosMetadata;
