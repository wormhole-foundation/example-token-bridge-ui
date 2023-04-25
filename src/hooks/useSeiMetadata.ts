import { useLayoutEffect, useMemo, useState } from "react";
import { DataWrapper } from "../store/helpers";
import { CosmWasmClient, getSeiWasmClient } from "../utils/sei";

export type SeiMetadata = {
  symbol?: string;
  logo?: string;
  tokenName?: string;
  decimals?: number;
};

const fetchSingleMetadata = async (address: string, client: CosmWasmClient) =>
  client
    .queryContractSmart(address, {
      token_info: {},
    })
    .then(
      ({ symbol, name: tokenName, decimals }: any) =>
        ({
          symbol,
          tokenName,
          decimals,
        } as SeiMetadata)
    );

const fetchSeiMetadata = async (
  addresses: string[],
  client: CosmWasmClient
) => {
  const promises: Promise<SeiMetadata>[] = [];
  addresses.forEach((address) => {
    promises.push(fetchSingleMetadata(address, client));
  });
  const resultsArray = await Promise.all(promises);
  const output = new Map<string, SeiMetadata>();
  addresses.forEach((address, index) => {
    output.set(address, resultsArray[index]);
  });

  return output;
};

const useSeiMetadata = (
  addresses: string[]
): DataWrapper<Map<string, SeiMetadata>> => {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Map<string, SeiMetadata> | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    if (addresses.length) {
      setIsFetching(true);
      setError("");
      setData(null);
      getSeiWasmClient().then(
        (client) =>
          fetchSeiMetadata(addresses, client).then(
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
          ),
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

export default useSeiMetadata;
