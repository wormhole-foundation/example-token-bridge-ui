import { parseSmartContractStateResponse } from "@certusone/wormhole-sdk";
import { ChainGrpcWasmApi } from "@injectivelabs/sdk-ts";
import { useLayoutEffect, useMemo, useState } from "react";
import { DataWrapper } from "../store/helpers";
import { getInjectiveWasmClient } from "../utils/injective";

export type InjectiveMetadata = {
  symbol?: string;
  logo?: string;
  tokenName?: string;
  decimals?: number;
};

const fetchSingleMetadata = async (address: string, client: ChainGrpcWasmApi) =>
  client
    .fetchSmartContractState(
      address,
      Buffer.from(JSON.stringify({ token_info: {} })).toString("base64")
    )
    .then((data) => {
      const parsed = parseSmartContractStateResponse(data);
      return {
        symbol: parsed.symbol,
        tokenName: parsed.name,
        decimals: parsed.decimals,
      } as InjectiveMetadata;
    });

const fetchInjectiveMetadata = async (addresses: string[]) => {
  const client = getInjectiveWasmClient();
  const promises: Promise<InjectiveMetadata>[] = [];
  addresses.forEach((address) => {
    promises.push(fetchSingleMetadata(address, client));
  });
  const resultsArray = await Promise.all(promises);
  const output = new Map<string, InjectiveMetadata>();
  addresses.forEach((address, index) => {
    output.set(address, resultsArray[index]);
  });

  return output;
};

const useInjectiveMetadata = (
  addresses: string[]
): DataWrapper<Map<string, InjectiveMetadata>> => {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Map<string, InjectiveMetadata> | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    if (addresses.length) {
      setIsFetching(true);
      setError("");
      setData(null);
      fetchInjectiveMetadata(addresses).then(
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

export default useInjectiveMetadata;
