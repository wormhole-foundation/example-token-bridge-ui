import { JsonRpcProvider } from "@mysten/sui.js";
import { useLayoutEffect, useMemo, useState } from "react";
import { DataWrapper } from "../store/helpers";
import { getSuiProvider } from "../utils/sui";

export type SuiMetadata = {
  symbol?: string;
  logo?: string;
  tokenName?: string;
  decimals?: number;
};

const fetchSingleMetadata = async (
  coinType: string,
  provider: JsonRpcProvider
) =>
  provider.getCoinMetadata({ coinType }).then((response) => {
    if (!response) {
      throw new Error("Error fetching metdata");
    }
    return {
      symbol: response.symbol,
      tokenName: response.name,
      decimals: response.decimals,
    } as SuiMetadata;
  });

const fetchSuiMetadata = async (addresses: string[]) => {
  const provider = getSuiProvider();
  const promises: Promise<SuiMetadata>[] = [];
  addresses.forEach((address) => {
    promises.push(fetchSingleMetadata(address, provider));
  });
  const resultsArray = await Promise.all(promises);
  const output = new Map<string, SuiMetadata>();
  addresses.forEach((address, index) => {
    output.set(address, resultsArray[index]);
  });

  return output;
};

const useSuiMetadata = (
  addresses: string[]
): DataWrapper<Map<string, SuiMetadata>> => {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Map<string, SuiMetadata> | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    if (addresses.length) {
      setIsFetching(true);
      setError("");
      setData(null);
      fetchSuiMetadata(addresses).then(
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
};

export default useSuiMetadata;
